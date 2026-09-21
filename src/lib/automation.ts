import { and, desc, eq, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  affiliates,
  applications,
  automationJobs,
  clients,
  commissions,
  demands,
  deployments,
  documentChecks,
  emailsLog,
  employers,
  partners,
  payments,
  slaAlerts,
  visaTypes,
} from "@/db/schema";
import { COUNTRIES, VISA_TYPES } from "./reference-data";
import { renderTrigger } from "./email-templates";

const DAY = 86_400_000;

export interface CycleSummary {
  slot: string;
  jobsCreated: number;
  stagesAdvanced: number;
  emailsDispatched: number;
  commissionsCredited: number;
  commissionAmount: number;
  slotsLocked: number;
  slaAlerts: number;
  log: string[];
}

/**
 * ব্রাউজার এআই এজেন্ট সাইকেল — ডেমো সিমুলেশন।
 * প্রোডাকশনে প্রতিটি ধাপ Playwright হেডলেস ক্লাস্টার + ডাইনামিক আইপি রোটেশন দিয়ে
 * সংশ্লিষ্ট দেশের সরকারি পোর্টালে সম্পাদিত হয়। এখানে একই ওয়ার্কফ্লো ডেটাবেজ
 * লেজারে প্রতিফলিত হয় যাতে ট্রানজেকশনাল প্রভাব observable থাকে।
 */
export async function runAgentCycle(slotLabel = "ম্যানুয়াল সাইকেল"): Promise<CycleSummary> {
  const nowMs = Date.now();
  const log: string[] = [];
  let emailsDispatched = 0;
  let commissionsCredited = 0;
  let commissionAmount = 0;
  let stagesAdvanced = 0;
  let slotsLocked = 0;

  const dispatch = async (triggerType: string, clientRow: { id: string; clientCode: string; fullName: string; email: string }, context: Record<string, unknown>, fallbackEmail?: string) => {
    const rendered = renderTrigger(triggerType, {
      clientId: clientRow.clientCode,
      clientName: clientRow.fullName,
      ...context,
    });
    await db.insert(emailsLog).values({
      clientId: clientRow.id,
      recipientEmail: fallbackEmail ?? clientRow.email ?? "info@visamotion365.com",
      subject: rendered.subject,
      triggerType,
      sentStatus: true,
    });
    emailsDispatched += 1;
  };

  /* ১. নতুন লিড → ডকুমেন্ট ভেরিফায়েড */
  const stageOrder = ["New_Lead", "Docs_Verified", "Employer_Matched", "Work_Permit_Submitted", "Consular_Review", "Visa_Approved", "Flight_Deployed"] as const;
  const pipeline = await db.select().from(clients).orderBy(desc(clients.createdAt));

  for (const client of pipeline) {
    const agedDays = Math.floor((nowMs - new Date(client.stageUpdatedAt).getTime()) / DAY);
    const idx = stageOrder.indexOf(client.stage as (typeof stageOrder)[number]);
    if (idx < 0) continue;

    if (client.stage === "New_Lead") {
      await db.update(clients).set({ stage: "Docs_Verified", stageUpdatedAt: new Date() }).where(eq(clients.id, client.id));
      await db.update(applications).set({ stage: "Docs_Verified", lastStatusSync: new Date() }).where(eq(applications.clientId, client.id));
      stagesAdvanced += 1;
      log.push(
        client.docsVerified
          ? `${client.clientCode}: OCR/CV ভ্যালিডেশন পাস → ডকুমেন্ট যাচাইকৃত`
          : `${client.clientCode}: রিজেকশন সতর্কতা নোটসহ সংশোধিত নথি পুনরায় গৃহীত → ডকুমেন্ট যাচাইকৃত`,
      );
      continue;
    }

    if (client.stage === "Docs_Verified") {
      const iso = client.countryIso;
      const [candidateEmployer] = await db
        .select()
        .from(employers)
        .where(and(eq(employers.countryIso, iso), eq(employers.verificationStatus, "Verified")))
        .limit(1);
      if (!candidateEmployer) continue;
      const [candidateDemand] = await db
        .select()
        .from(demands)
        .where(and(eq(demands.employerId, candidateEmployer.id), eq(demands.status, "Open")))
        .limit(1);
      await db
        .update(clients)
        .set({ stage: "Employer_Matched", employerId: candidateEmployer.id, demandId: candidateDemand?.id ?? null, stageUpdatedAt: new Date() })
        .where(eq(clients.id, client.id));
      await db.update(applications).set({ stage: "Employer_Matched", governmentPortal: "" }).where(eq(applications.clientId, client.id));
      await dispatch("candidate_match", client, {
        jobCategory: candidateDemand?.jobCategory ?? client.skill,
        countryBn: COUNTRIES.find((c) => c.iso3 === iso)?.nameBn,
        employerName: candidateEmployer.companyName,
      }, candidateEmployer.email);
      stagesAdvanced += 1;
      log.push(`${client.clientCode}: ${candidateEmployer.companyName} ডিমান্ডের সাথে স্কিল ম্যাচ → CV ফরোয়ার্ড`);
      continue;
    }

    if (client.stage === "Employer_Matched" && agedDays >= 0) {
      const [demandRow] = client.demandId ? await db.select().from(demands).where(eq(demands.id, client.demandId)).limit(1) : [];
      const portal = COUNTRIES.find((c) => c.iso3 === client.countryIso);
      const govCode = `${client.countryIso}-${String(700000 + Math.floor(Math.random() * 89999))}-${client.visaCode}`;
      await db.update(clients).set({ stage: "Work_Permit_Submitted", stageUpdatedAt: new Date() }).where(eq(clients.id, client.id));
      await db
        .update(applications)
        .set({
          stage: "Work_Permit_Submitted",
          permitSubmissionDate: new Date(),
          govTrackingCode: govCode,
          governmentPortal: portal?.adminPortal ?? "",
          scraperStatus: "SUBMITTED — apply_work_permit() সাকসেস",
          lastStatusSync: new Date(),
        })
        .where(eq(applications.clientId, client.id));
      if (demandRow) {
        await db.update(demands).set({ fulfilledCount: demandRow.fulfilledCount + 1 }).where(eq(demands.id, demandRow.id));
      }
      await dispatch("work_permit_submission", client, {
        govCode,
        employerName: demandRow?.jobTitle ?? "Approved Demand",
        countryBn: portal?.nameBn,
      });
      stagesAdvanced += 1;
      log.push(`${client.clientCode}: ${portal?.adminPortal ?? "সরকারি পোর্টাল"} — ট্র্যাকিং কোড ${govCode}`);
      continue;
    }

    if (client.stage === "Work_Permit_Submitted" && agedDays >= 2) {
      const portal = COUNTRIES.find((c) => c.iso3 === client.countryIso);
      const slotDays = 4 + Math.floor(Math.random() * 14);
      await db.update(clients).set({ stage: "Consular_Review", stageUpdatedAt: new Date() }).where(eq(clients.id, client.id));
      await db
        .update(applications)
        .set({
          stage: "Consular_Review",
          embassyDate: new Date(),
          appointmentSlot: `${new Date(nowMs + slotDays * DAY).toISOString().slice(0, 10)} 10:30 BST`,
          scraperStatus: "EMBASSY FILE OPENED",
          lastStatusSync: new Date(),
        })
        .where(eq(applications.clientId, client.id));
      await dispatch("embassy_submission", client, { countryBn: portal?.nameBn });
      stagesAdvanced += 1;
      log.push(`${client.clientCode}: দূতাবাসে সাবমিশন + অ্যাপয়েন্টমেন্ট স্লট লক`);
      continue;
    }

    if (client.stage === "Consular_Review" && agedDays >= 3) {
      const portal = COUNTRIES.find((c) => c.iso3 === client.countryIso);
      const approved = Math.random() > 0.08;
      if (!approved) {
        await db.update(clients).set({ stage: "Rejected", stageUpdatedAt: new Date() }).where(eq(clients.id, client.id));
        await dispatch("visa_decision", client, {
          decision: "ভিসা প্রত্যাখ্যাত",
          reason: "কনস্যুলার অফিসার আর্থিক প্রমাণ অপর্যাপ্ত হিসেবে চিহ্নিত করেছেন; পুনর্বিবেচনার জন্য অতিরিক্ত ব্যাংক স্টেটমেন্ট প্রয়োজন।",
          countryBn: portal?.nameBn,
        });
        stagesAdvanced += 1;
        log.push(`${client.clientCode}: রিজেকশন নোটিশ + আপিল গাইডলাইন প্রেরিত`);
        continue;
      }
      await db.update(clients).set({ stage: "Visa_Approved", stageUpdatedAt: new Date() }).where(eq(clients.id, client.id));
      await db
        .update(applications)
        .set({ stage: "Visa_Approved", scraperStatus: "APPROVED — ভিসা ISSYU সম্পন্ন", lastStatusSync: new Date() })
        .where(eq(applications.clientId, client.id));
      await dispatch("visa_decision", client, { decision: "ভিসা অনুমোদিত", countryBn: portal?.nameBn });

      if (client.affiliateId) {
        const visaRecord = VISA_TYPES.find((v) => v.code === client.visaCode);
        const amount = Number(visaRecord?.affiliateCommission ?? 3000);
        await db.insert(commissions).values({
          affiliateId: client.affiliateId,
          clientId: client.id,
          visaCode: client.visaCode,
          amount: amount.toFixed(2),
          note: `${client.fullName} (${client.clientCode}) ভিসা অনুমোদন — অটো কমিশন ক্রেডিট`,
        });
        await db
          .update(affiliates)
          .set({
            walletBalance: sql`${affiliates.walletBalance} + ${amount.toFixed(2)}`,
            totalEarned: sql`${affiliates.totalEarned} + ${amount.toFixed(2)}`,
          })
          .where(eq(affiliates.id, client.affiliateId));
        const [affiliateRow] = await db.select().from(affiliates).where(eq(affiliates.id, client.affiliateId)).limit(1);
        await dispatch("affiliate_commission", client, {
          commission: amount.toLocaleString("en-US"),
          visaBn: visaRecord?.labelBn,
        }, affiliateRow?.phone ? `affiliate-${affiliateRow.referralCode}@visamotion365.com` : undefined);
        commissionsCredited += 1;
        commissionAmount += amount;
        log.push(`${client.clientCode}: অ্যাফিলিয়েট কমিশন ৳${amount.toLocaleString("en-US")} ক্রেডিট`);
      }
      stagesAdvanced += 1;
      continue;
    }

    if (client.stage === "Visa_Approved" && agedDays >= 2) {
      const airline = ["Turkish Airlines", "Air Arabia", "Saudia", "Gulf Air", "Qatar Airways"][Math.floor(Math.random() * 5)];
      const pnr = `PNR${Math.floor(100000 + Math.random() * 899999)}`;
      const flightDate = new Date(nowMs + (3 + Math.floor(Math.random() * 12)) * DAY);
      await db.update(clients).set({ stage: "Flight_Deployed", stageUpdatedAt: new Date() }).where(eq(clients.id, client.id));
      await db.insert(deployments).values({
        clientId: client.id,
        flightDate,
        airline,
        pnrNumber: pnr,
        destinationAirport: `${COUNTRIES.find((c) => c.iso3 === client.countryIso)?.nameEn ?? ""} International Airport`,
        airportPickupStatus: false,
      });
      await db
        .update(applications)
        .set({ stage: "Flight_Deployed", scraperStatus: "DEPLOYED — টিকিট ইস্যু সম্পন্ন", lastStatusSync: new Date() })
        .where(eq(applications.clientId, client.id));
      await dispatch("flight_briefing", client, {
        flightDate: flightDate.toISOString().slice(0, 10),
        pnr,
        airline,
        pickupAddress: "এয়ারপোর্টে নিয়োগকর্তার প্রতিনিধি পিকআপ করবেন",
      });
      stagesAdvanced += 1;
      log.push(`${client.clientCode}: ফ্লাইট ইস্যু (${airline} · ${pnr}) — পিকআপ নোটিশ প্রেরিত`);
    }
  }

  /* ২. সাপ্তাহিক ডিপ্লয়মেন্ট সামারি — বিদেশি নিয়োগকর্তাদের জন্য */
  const activeEmployers = await db
    .select({ id: employers.id, companyName: employers.companyName, email: employers.email })
    .from(employers)
    .where(eq(employers.verificationStatus, "Verified"))
    .limit(3);
  const weekLabel = `সপ্তাহ ${Math.ceil(((nowMs - new Date(new Date().getFullYear(), 0, 1).getTime()) / DAY + 1) / 7)} · ${new Date().getFullYear()}`;
  for (const employer of activeEmployers) {
    const inProgress = pipeline.filter((c) => c.employerId === employer.id && c.stage !== "Flight_Deployed" && c.stage !== "Rejected").length;
    const deployed = pipeline.filter((c) => c.employerId === employer.id && c.stage === "Flight_Deployed").length;
    const rendered = renderTrigger("employer_weekly", {
      employerName: employer.companyName,
      weekLabel,
      inProgress,
      deployedWorkers: deployed,
    });
    await db.insert(emailsLog).values({
      recipientEmail: employer.email,
      subject: rendered.subject,
      triggerType: "employer_weekly",
      sentStatus: true,
    });
    emailsDispatched += 1;
  }
  log.push(`সাপ্তাহিক ডিপ্লয়মেন্ট সামারি ${activeEmployers.length} টি নিয়োগকর্তাকে প্রেরিত`);

  /* ৩. অ্যাপয়েন্টমেন্ট স্লট স্ক্যান + স্ট্যাটাস স্ক্র্যাপ জব লেজার */
  const slots = ["০৯:০০ BST", "১৪:০০ BST", "২১:০০ BST"];
  const jobsToInsert: (typeof automationJobs.$inferInsert)[] = [];
  let jobsCreated = 0;
  for (const country of COUNTRIES) {
    const slot = slotLabel === "ম্যানুয়াল সাইকেল" ? slots[Math.floor(Math.random() * slots.length)] : slotLabel;
    const found = Math.random() > 0.55 ? 1 + Math.floor(Math.random() * 4) : 0;
    jobsToInsert.push({
      jobType: "appointment_scan",
      countryIso: country.iso3,
      scheduledSlot: slot,
      status: found > 0 ? "success" : "warning",
      slotsFound: found,
      clientsProcessed: 0,
      resultMessage:
        found > 0
          ? `${country.nameBn}: ${found} টি স্লট DOM মিউটেশনে শনাক্ত — ওয়েটিং পুল প্লেসহোল্ডার রিলিজ সম্পন্ন`
          : `${country.nameBn}: নতুন স্লট উন্মুক্ত হয়নি — পরবর্তী শিডিউলে পুনঃপরীক্ষা`,
      startedAt: new Date(nowMs + jobsToInsert.length * 1100),
      finishedAt: new Date(nowMs + jobsToInsert.length * 1100 + 38_000),
    });
    jobsCreated += 1;
    slotsLocked += found;

    const activeClientIds = pipeline
      .filter((c) => c.countryIso === country.iso3 && ["Work_Permit_Submitted", "Consular_Review"].includes(c.stage))
      .map((c) => c.id);
    if (activeClientIds.length) {
      await db
        .update(applications)
        .set({ lastStatusSync: new Date(nowMs + jobsToInsert.length * 1100), scraperStatus: "SCRAPER SYNC — পোর্টাল রেসপন্স আপডেটেড" })
        .where(inArray(applications.clientId, activeClientIds));
    }
    jobsToInsert.push({
      jobType: "status_scrape",
      countryIso: country.iso3,
      scheduledSlot: "২৪ ঘণ্টা চক্র",
      status: "success",
      slotsFound: 0,
      clientsProcessed: activeClientIds.length,
      resultMessage: `${country.nameBn}: ${activeClientIds.length} টি ফাইলের পাসপোর্ট ও রেফারেন্স কোড ইনজেক্ট করে স্ট্যাটাস সিঙ্ক সম্পন্ন`,
      startedAt: new Date(nowMs + jobsToInsert.length * 1100),
      finishedAt: new Date(nowMs + jobsToInsert.length * 1100 + 62_000),
    });
    jobsCreated += 1;
  }
  await db.insert(automationJobs).values(jobsToInsert);

  /* ৪. SLA স্ক্যান — ৭ কার্যদিবস স্থবির ফাইলের জন্য অ্যালার্ম */
  const stalledCandidates = await db
    .select({ id: clients.id, stage: clients.stage, stageUpdatedAt: clients.stageUpdatedAt, code: clients.clientCode })
    .from(clients)
    .where(lt(clients.stageUpdatedAt, new Date(nowMs - 7 * DAY)));
  const existingAlerts = await db.select({ clientId: slaAlerts.clientId }).from(slaAlerts).where(eq(slaAlerts.resolved, false));
  const alertSet = new Set(existingAlerts.map((a) => a.clientId));
  const newAlerts = stalledCandidates.filter(
    (c) => !alertSet.has(c.id) && !["Flight_Deployed", "Rejected"].includes(c.stage),
  );
  if (newAlerts.length) {
    await db.insert(slaAlerts).values(
      newAlerts.map((c) => ({
        clientId: c.id,
        stage: c.stage,
        stalledDays: Math.floor((nowMs - new Date(c.stageUpdatedAt).getTime()) / DAY),
        severity: "critical",
      })),
    );
    log.push(`${newAlerts.length} টি স্থবির ফাইলের জন্য লাল SLA অ্যালার্ম জেনারেট`);
  }

  return {
    slot: slotLabel,
    jobsCreated,
    stagesAdvanced,
    emailsDispatched,
    commissionsCredited,
    commissionAmount,
    slotsLocked,
    slaAlerts: newAlerts.length,
    log,
  };
}

export async function recalculateWalletLedger() {
  const rows = await db
    .select({
      affiliateId: commissions.affiliateId,
      total: sql<string>`coalesce(sum(${commissions.amount}), 0)`,
    })
    .from(commissions)
    .groupBy(commissions.affiliateId);
  for (const row of rows) {
    await db.update(affiliates).set({ totalEarned: row.total }).where(eq(affiliates.id, row.affiliateId));
  }
}

export async function getPlatformSnapshot() {
  const [clientCount] = await db.select({ count: sql<number>`count(*)::int` }).from(clients);
  const [staleCount] = await db.select({ count: sql<number>`count(*)::int` }).from(slaAlerts).where(eq(slaAlerts.resolved, false));
  const [employerCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(employers)
    .where(eq(employers.verificationStatus, "Verified"));
  const [blacklistCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(employers)
    .where(eq(employers.verificationStatus, "Blacklisted"));
  const [emailCount] = await db.select({ count: sql<number>`count(*)::int` }).from(emailsLog);
  const [jobCount] = await db.select({ count: sql<number>`count(*)::int` }).from(automationJobs);
  const [approvedCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(clients)
    .where(inArray(clients.stage, ["Visa_Approved", "Flight_Deployed"]));
  const [contractSum] = await db
    .select({ total: sql<string>`coalesce(sum(${clients.contractValue}), 0)` })
    .from(clients);
  const [paymentSum] = await db.select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` }).from(payments);
  const [commissionSum] = await db.select({ total: sql<string>`coalesce(sum(${commissions.amount}), 0)` }).from(commissions);
  const [demandQuota] = await db
    .select({ quota: sql<number>`coalesce(sum(${demands.requiredWorkers}), 0)::int` })
    .from(demands)
    .where(eq(demands.status, "Open"));
  const [documentFailures] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(documentChecks)
    .where(eq(documentChecks.passed, false));
  const [checkCount] = await db.select({ count: sql<number>`count(*)::int` }).from(documentChecks);

  const contractValue = Number(contractSum?.total ?? 0);
  const received = Number(paymentSum?.total ?? 0);

  return {
    clients: clientCount?.count ?? 0,
    slaAlerts: staleCount?.count ?? 0,
    verifiedEmployers: employerCount?.count ?? 0,
    blacklistedEmployers: blacklistCount?.count ?? 0,
    emailsDispatched: emailCount?.count ?? 0,
    automationJobs: jobCount?.count ?? 0,
    approved: approvedCount?.count ?? 0,
    contractValue,
    received,
    dueBalance: contractValue - received,
    commissionsPaid: Number(commissionSum?.total ?? 0),
    openQuota: demandQuota?.quota ?? 0,
    validationPassRate: checkCount?.count ? Math.round(((checkCount.count - (documentFailures?.count ?? 0)) / checkCount.count) * 100) : 100,
  };
}

export async function getAutomationFeed(limit = 14) {
  return db.select().from(automationJobs).orderBy(desc(automationJobs.startedAt)).limit(limit);
}

export async function getEmailFeed(limit = 24) {
  return db.select().from(emailsLog).orderBy(desc(emailsLog.sentAt)).limit(limit);
}

export async function getVerifiedEmployersWithDemands() {
  const employerRows = await db.select().from(employers).orderBy(desc(employers.verificationStatus));
  const demandRows = await db.select().from(demands);
  return employerRows.map((employer) => ({
    ...employer,
    demands: demandRows.filter((d) => d.employerId === employer.id),
  }));
}

export async function getAffiliateDirectory() {
  const rows = await db.select().from(affiliates).orderBy(desc(affiliates.totalEarned));
  return rows.map((row) => ({
    ...row,
    walletBalance: Number(row.walletBalance),
    totalEarned: Number(row.totalEarned),
  }));
}

export async function getAffiliatePortal(affiliateId: string) {
  const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.id, affiliateId)).limit(1);
  if (!affiliate) return null;
  const referrals = await db.select().from(clients).where(eq(clients.affiliateId, affiliateId)).orderBy(desc(clients.createdAt));
  const ledger = await db.select().from(commissions).where(eq(commissions.affiliateId, affiliateId)).orderBy(desc(commissions.createdAt));
  return {
    affiliate,
    referrals: referrals.map((r) => ({
      ...r,
      contractValue: Number(r.contractValue),
    })),
    ledger: ledger.map((l) => ({ ...l, amount: Number(l.amount) })),
  };
}

export async function getPartnerOverview() {
  const partnerRows = await db.select().from(partners);
  const employerRows = await db.select().from(employers);
  const deploymentRows = await db.select().from(deployments);
  const clientRows = await db.select().from(clients).where(isNotNull(clients.employerId));

  return partnerRows.map((partner) => {
    const employer = employerRows.find((e) => e.id === partner.employerId);
    const pipeline = clientRows.filter((c) => c.employerId === partner.employerId);
    const deployed = pipeline.filter((c) => c.stage === "Flight_Deployed");
    const medical = pipeline.filter((c) => ["Work_Permit_Submitted", "Consular_Review"].includes(c.stage));
    const approved = pipeline.filter((c) => c.stage === "Visa_Approved");
    return {
      partner: { ...partner, commissionRate: Number(partner.commissionRate), profitShareBalance: Number(partner.profitShareBalance) },
      employer,
      pipeline,
      stats: {
        total: pipeline.length,
        medical: medical.length,
        permitsIssued: approved.length + deployed.length,
        ticketed: deployed.length,
        flightDates: deploymentRows
          .filter((d) => pipeline.some((p) => p.id === d.clientId))
          .map((d) => ({ clientId: d.clientId, flightDate: d.flightDate, airline: d.airline, pnr: d.pnrNumber })),
      },
    };
  });
}

export async function getAdminConsoleData() {
  const clientRows = await db.select().from(clients).orderBy(desc(clients.stageUpdatedAt));
  const [affiliateRows, employerRows, demandRows, visaRows, alertRows, paymentRows, applicationRows] = await Promise.all([
    db.select().from(affiliates),
    db.select().from(employers),
    db.select().from(demands),
    db.select().from(visaTypes),
    db.select().from(slaAlerts).where(eq(slaAlerts.resolved, false)),
    db.select().from(payments),
    db.select().from(applications),
  ]);

  const enriched = clientRows.map((client) => {
    const paid = paymentRows.filter((p) => p.clientId === client.id).reduce((sum, p) => sum + Number(p.amount), 0);
    const application = applicationRows.find((a) => a.clientId === client.id);
    return {
      ...client,
      contractValue: Number(client.contractValue),
      paidAmount: paid,
      dueBalance: Number(client.contractValue) - paid,
      affiliateName: affiliateRows.find((a) => a.id === client.affiliateId)?.agentName ?? null,
      affiliateDistrict: affiliateRows.find((a) => a.id === client.affiliateId)?.district ?? null,
      employerName: employerRows.find((e) => e.id === client.employerId)?.companyName ?? null,
      jobTitle: demandRows.find((d) => d.id === client.demandId)?.jobTitle ?? null,
      govTrackingCode: application?.govTrackingCode ?? "",
      governmentPortal: application?.governmentPortal ?? "",
      scraperStatus: application?.scraperStatus ?? "Pending",
      appointmentSlot: application?.appointmentSlot ?? null,
      slaBreach: alertRows.some((a) => a.clientId === client.id),
      stalledDays: Math.floor((Date.now() - new Date(client.stageUpdatedAt).getTime()) / DAY),
    };
  });

  const financials = {
    contractValue: enriched.reduce((s, c) => s + c.contractValue, 0),
    received: enriched.reduce((s, c) => s + c.paidAmount, 0),
    due: enriched.reduce((s, c) => s + c.dueBalance, 0),
    commissionsPayable: affiliateRows.reduce((s, a) => s + Number(a.walletBalance), 0),
    partnerShare: (await db.select().from(partners)).reduce((s, p) => s + Number(p.profitShareBalance), 0),
    operatingCostEstimate: enriched.reduce((s, c) => s + c.contractValue * 0.18, 0),
    visaRevenue: visaRows.map((v) => ({
      code: v.code,
      label: v.labelBn,
      total: enriched.filter((c) => c.visaCode === v.code).reduce((s, c) => s + c.contractValue, 0),
      count: enriched.filter((c) => c.visaCode === v.code).length,
    })),
  };

  return {
    clients: enriched,
    affiliates: affiliateRows.map((a) => ({ ...a, walletBalance: Number(a.walletBalance), totalEarned: Number(a.totalEarned) })),
    employers: employerRows,
    demands: demandRows,
    alerts: alertRows,
    financials,
  };
}
