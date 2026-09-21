import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  affiliates,
  applications,
  automationJobs,
  clients,
  commissions,
  countries,
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
import { buildClientCode } from "./client-code";
import { evaluateOnboarding } from "./validation";
import { renderTrigger } from "./email-templates";

const DAY = 86_400_000;
const now = () => Date.now();

function isoDate(offsetDays: number) {
  return new Date(now() + offsetDays * DAY).toISOString().slice(0, 10);
}
function ts(offsetDays: number, hours = 0) {
  return new Date(now() + offsetDays * DAY + hours * 3_600_000);
}

export async function ensureSeeded(): Promise<{ seeded: boolean }> {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(countries);
  if ((row?.count ?? 0) > 0) return { seeded: false };
  await seedAll();
  return { seeded: true };
}

async function seedAll() {
  const insertedCountries = await db
    .insert(countries)
    .values(
      COUNTRIES.map((c) => ({
        iso3: c.iso3,
        nameBn: c.nameBn,
        nameEn: c.nameEn,
        flag: c.flag,
        adminPortal: c.adminPortal,
        portalUrl: c.portalUrl,
        legalBasis: c.legalBasis,
        workMethod: c.workMethod,
        visitorCategory: c.visitorCategory,
        selfSponsorPathway: c.selfSponsorPathway,
        processingWindow: c.processingWindow,
        avgMinDays: c.avgMinDays,
        avgMaxDays: c.avgMaxDays,
        automationSteps: c.automationSteps,
      })),
    )
    .returning({ id: countries.id, iso3: countries.iso3 });

  await db.insert(visaTypes).values(VISA_TYPES);

  /* ------------------------------ EMPLOYERS ----------------------------- */
  const employerSeeds = [
    {
      companyName: "Belgrade Metal Works DOO",
      iso: "SRB",
      license: "RS-APR-1189432",
      tax: "RS-TAX-110234578",
      person: "Milos Petrovic",
      title: "HR Director",
      email: "hiring@belgrademetal.rs",
      phone: "+381 11 445 8890",
      website: "belgrademetal.rs",
      status: "Verified" as const,
      job: "ওয়েল্ডার ও ফেব্রিকেটর",
      category: "Welder",
      workers: 18,
      salary: "1150.00",
      currency: "EUR",
    },
    {
      companyName: "Andalusia Tekstil San. Tic. Ltd.",
      iso: "TUR",
      license: "TR-TR-88213004",
      tax: "TR-VKN-4560987123",
      person: "Emre Kaya",
      title: "İnsan Kaynakları Müdürü",
      email: "ik@andalusiatekstil.com.tr",
      phone: "+90 212 556 7712",
      website: "andalusiatekstil.com.tr",
      status: "Verified" as const,
      job: "টেক্সটাইল মেশিন অপারেটর",
      category: "Factory Worker",
      workers: 40,
      salary: "17500.00",
      currency: "TRY",
    },
    {
      companyName: "Al Rajhi Contracting Group",
      iso: "SAU",
      license: "SA-CR-1010456789",
      tax: "SA-VAT-300145678900003",
      person: "Abdullah Al Rajhi",
      title: "Recruitment Manager",
      email: "hr@alrajhi-contracting.sa",
      phone: "+966 11 478 9900",
      website: "alrajhi-contracting.sa",
      status: "Verified" as const,
      job: "বিল্ডিং কনস্ট্রাকশন হেল্পার",
      category: "Construction",
      workers: 120,
      salary: "1400.00",
      currency: "SAR",
    },
    {
      companyName: "Gulf Star Facilities Services",
      iso: "SAU",
      license: "SA-CR-4030911223",
      tax: "SA-VAT-310099887700003",
      person: "Faisal Alqahtani",
      title: "Operations Head",
      email: "mobilization@gulfstar.sa",
      phone: "+966 12 665 1240",
      website: "gulfstar.sa",
      status: "Verified" as const,
      job: "হসপিটালিটি ও ক্লিনিং ক্রু",
      category: "Hospitality",
      workers: 60,
      salary: "1250.00",
      currency: "SAR",
    },
    {
      companyName: "Klassen Logistics GmbH",
      iso: "MLT",
      license: "MT-MBR-8891224",
      tax: "MT-VAT-9901224400",
      person: "Karl Bonnici",
      title: "Fleet Manager",
      email: "careers@klassen-logistics.mt",
      phone: "+356 2134 8890",
      website: "klassen-logistics.mt",
      status: "Verified" as const,
      job: "ভারী যানবাহন ড্রাইভার",
      category: "Driver",
      workers: 12,
      salary: "1550.00",
      currency: "EUR",
    },
    {
      companyName: "MITP Tech Ventures SRL",
      iso: "MDA",
      license: "MD-IDNO-1002604012345",
      tax: "MD-TVA-1009900011122",
      person: "Ion Rotaru",
      title: "Co-Founder",
      email: "team@mitptech.md",
      phone: "+373 22 781 990",
      website: "mitptech.md",
      status: "Verified" as const,
      job: "সফটওয়্যার ইঞ্জিনিয়ার (মিড/সিনিয়র)",
      category: "IT Professional",
      workers: 8,
      salary: "2600.00",
      currency: "EUR",
    },
    {
      companyName: "Manama Hospitality WLL",
      iso: "BHR",
      license: "BH-CR-778129",
      tax: "BH-VAT-22001188990003",
      person: "Yousif Al Bahraini",
      title: "HR Business Partner",
      email: "recruitment@manamahospitality.bh",
      phone: "+973 1721 4455",
      website: "manamahospitality.bh",
      status: "Verified" as const,
      job: "হোটেল ফুড সার্ভিস ক্রু",
      category: "Hospitality",
      workers: 22,
      salary: "265.00",
      currency: "BHD",
    },
    {
      companyName: "Kuala Manufacturing Sdn Bhd",
      iso: "MYS",
      license: "MY-SSM-2024010456789",
      tax: "MY-LHDN-202401045678",
      person: "Tan Wei Ming",
      title: "Plant HR Manager",
      email: "lai@kualamanufacturing.com.my",
      phone: "+60 3 7890 2211",
      website: "kualamanufacturing.com.my",
      status: "Verified" as const,
      job: "ইলেকট্রনিকস অ্যাসেম্বলি অপারেটর",
      category: "Factory Worker",
      workers: 45,
      salary: "2000.00",
      currency: "MYR",
    },
    {
      companyName: "HTP Systems LLC",
      iso: "BLR",
      license: "BY-HTP-7704412",
      tax: "BY-UNP-191988776",
      person: "Dmitry Kovalenko",
      title: "Talent Lead",
      email: "talent@htpsystems.by",
      phone: "+375 17 290 7788",
      website: "htpsystems.by",
      status: "Pending" as const,
      job: "QA ইঞ্জিনিয়ার ও ডেটা অপারেটর",
      category: "IT Professional",
      workers: 6,
      salary: "1900.00",
      currency: "USD",
    },
    {
      companyName: "Aegean Staffing Partner Ltd.",
      iso: "TUR",
      license: "TR-TR-99114522",
      tax: "TR-VKN-0001229988",
      person: "Serkan Demir",
      title: "Consultant",
      email: "info@aegeanstaffing-now.top",
      phone: "+90 532 000 1122",
      website: "aegeanstaffing-now.top",
      status: "Blacklisted" as const,
      job: "ফ্যাক্টরি হেল্পার (ফ্রি ভিসা)",
      category: "Factory Worker",
      workers: 30,
      salary: "990.00",
      currency: "TRY",
    },
  ];

  const insertedEmployers = await db
    .insert(employers)
    .values(
      employerSeeds.map((e) => ({
        companyName: e.companyName,
        countryIso: e.iso,
        tradeLicenseNo: e.license,
        taxId: e.tax,
        contactPerson: e.person,
        contactTitle: e.title,
        email: e.email,
        phone: e.phone,
        website: e.website,
        verificationStatus: e.status,
        screeningNote:
          e.status === "Verified"
            ? "ট্যাক্স আইডি ও ট্রেড লাইসেন্স নিবন্ধন ডাটাবেজের সাথে ক্রস-ম্যাচ সম্পন্ন। NDA ও রিক্রুটমেন্ট সার্ভিস চুক্তি ই-সাইনকৃত।"
            : e.status === "Pending"
              ? "প্রাথমিক তদন্তাধীন — নিবন্ধন ডকুমেন্ট ফরোয়ার্ড করা হয়েছে রাষ্ট্রদূত অফিসে যাচাইয়ের জন্য।"
              : "সতর্কতা: ট্রেড লাইসেন্স নম্বর ভুয়া প্রমাণিত এবং অতীতে শ্রম অসদাচরণের রেকর্ড বিদ্যমান। ডিমান্ড স্বয়ংক্রিয়ভাবে স্থগিত।",
        agreementPdfUrl: e.status === "Verified" ? `/agreements/nda-${e.iso.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}.pdf` : null,
        agreementSignedAt: e.status === "Verified" ? ts(-40) : null,
      })),
    )
    .returning({ id: employers.id, companyName: employers.companyName, status: employers.verificationStatus });

  const employerByName = new Map(insertedEmployers.map((e) => [e.companyName, e]));

  const insertedDemands = await db
    .insert(demands)
    .values(
      employerSeeds.flatMap((e, idx) => {
        const employer = employerByName.get(e.companyName);
        if (!employer) return [];
        const base = {
          employerId: employer.id,
          jobCategory: e.category,
          workingHours: "৮ ঘণ্টা / দৈনিক (সপ্তাহে ৬ দিন)",
          overtimePolicy: idx % 2 === 0 ? "১২৫% ওভারটাইম হার, মাসে ৪০ ঘণ্টা পর্যন্ত" : "১৫০% সাপ্তাহিক ছুটির দিনে",
          accommodation: "কোম্পানি প্রদত্ত শেয়ার্ড আবাসন, ইউটিলিটি ফ্রি",
          medicalInsurance: "সম্পূর্ণ স্বাস্থ্য বীমা + ইমিগ্রেশন ও ডিপোর্টেশন কভারেজ",
          foodAllowance: "দৈনিক খাদ্য ভাতা বা ক্যান্টিন সুবিধা",
          blacklistFlag: e.status === "Blacklisted",
          status: (e.status === "Blacklisted" ? "Paused" : "Open") as "Open" | "Paused",
        };
        return [
          {
            ...base,
            jobTitle: e.job,
            requiredWorkers: e.workers,
            fulfilledCount: Math.max(3, Math.round(e.workers * 0.35)),
            salary: e.salary,
            currency: e.currency,
          },
          ...(idx % 3 === 0
            ? [
                {
                  ...base,
                  jobTitle: `${e.job} — সিজন-২ ব্যাচ`,
                  requiredWorkers: Math.max(5, Math.round(e.workers / 2)),
                  fulfilledCount: 2,
                  salary: e.salary,
                  currency: e.currency,
                },
              ]
            : []),
        ];
      }),
    )
    .returning({ id: demands.id, employerId: demands.employerId, jobCategory: demands.jobCategory });

  /* ------------------------------ AFFILIATES ---------------------------- */
  const insertedAffiliates = await db
    .insert(affiliates)
    .values([
      { agentName: "মোঃ রফিকুল ইসলাম", district: "ঢাকা", upazila: "তেজগাঁও", phone: "+880 1711-223344", referralCode: "WVC-DHK-70", walletBalance: "21000.00", totalEarned: "48000.00" },
      { agentName: "আব্দুল করিম ভূঁইয়া", district: "কুমিল্লা", upazila: "দেবিদ্বার", phone: "+880 1819-556677", referralCode: "WVC-CML-21", walletBalance: "13000.00", totalEarned: "26000.00" },
      { agentName: "সাইফুল আলম", district: "চট্টগ্রাম", upazila: "পটিয়া", phone: "+880 1913-889900", referralCode: "WVC-CTG-40", walletBalance: "8000.00", totalEarned: "8000.00" },
      { agentName: "নূরজাহান বেগম", district: "সিলেট", upazila: "গোলাপগঞ্জ", phone: "+880 1611-334455", referralCode: "WVC-SYL-32", walletBalance: "18000.00", totalEarned: "33000.00" },
      { agentName: "হাবিবুর রহমান", district: "রংপুর", upazila: "বদরগঞ্জ", phone: "+880 1512-778899", referralCode: "WVC-RNG-55", walletBalance: "3000.00", totalEarned: "3000.00" },
      { agentName: "মোস্তাফিজুর রহমান", district: "খুলনা", upazila: "ডুমুরিয়া", phone: "+880 1722-990011", referralCode: "WVC-KHL-64", walletBalance: "15000.00", totalEarned: "15000.00" },
    ])
    .returning({ id: affiliates.id, referralCode: affiliates.referralCode });

  /* -------------------------------- CLIENTS ----------------------------- */
  const clientSeeds = [
    { name: "মোঃ জাহিদুল হাসান", passport: "BP0912345", iso: "SRB", visa: "WRK", skill: "Welder (6G)", stage: "Flight_Deployed" as const, aff: 0 },
    { name: "শাহিনা আক্তার", passport: "BM1188776", iso: "TUR", visa: "VIS", skill: "Business Visitor", stage: "Visa_Approved" as const, aff: 1 },
    { name: "আরিফুল ইসলাম", passport: "BP0345561", iso: "SAU", visa: "WRK", skill: "Construction Helper", stage: "Flight_Deployed" as const, aff: 2 },
    { name: "সুমাইয়া ইসলাম", passport: "BM2209981", iso: "MLT", visa: "WRK", skill: "Heavy Vehicle Driver", stage: "Consular_Review" as const, aff: 3 },
    { name: "তানভীর আহমেদ", passport: "BP0771234", iso: "MDA", visa: "SLF", skill: "Software Engineer", stage: "Work_Permit_Submitted" as const, aff: null },
    { name: "নাজমুল হুদা", passport: "BP1122009", iso: "BHR", visa: "WRK", skill: "Food Service Crew", stage: "Employer_Matched" as const, aff: 4 },
    { name: "রুবেল মিয়া", passport: "BP0551990", iso: "MYS", visa: "WRK", skill: "Electronics Assembly", stage: "Work_Permit_Submitted" as const, aff: 2 },
    { name: "ফারহানা ইয়াসমিন", passport: "BM2298345", iso: "TUR", visa: "SLF", skill: "E-commerce Founder", stage: "Docs_Verified" as const, aff: 5 },
    { name: "শাহাদাত হোসেন", passport: "BP0887665", iso: "SAU", visa: "VIS", skill: "Umrah Pilgrim", stage: "Visa_Approved" as const, aff: 1 },
    { name: "কামরুল হাসান", passport: "BP0443322", iso: "SRB", visa: "WRK", skill: "Metal Fabricator", stage: "New_Lead" as const, aff: 0 },
    { name: "মেহেদী হাসান", passport: "BP1199887", iso: "MLT", visa: "SLF", skill: "IT Consultant", stage: "Docs_Verified" as const, aff: null },
    { name: "সালমা খাতুন", passport: "BM3344556", iso: "MYS", visa: "VIS", skill: "Tourist Visitor", stage: "Consular_Review" as const, aff: 3 },
    { name: "আশরাফুল আলম", passport: "BP0667788", iso: "BLR", visa: "WRK", skill: "QA Engineer", stage: "New_Lead" as const, aff: 4 },
    { name: "জান্নাতুল ফেরদৌস", passport: "BM5566778", iso: "BHR", visa: "SLF", skill: "Virtual CR Founder", stage: "Employer_Matched" as const, aff: 5 },
    { name: "ইব্রাহিম খলিল", passport: "BP0998877", iso: "SAU", visa: "WRK", skill: "Hospitality Crew", stage: "Work_Permit_Submitted" as const, aff: 2 },
    { name: "রাশেদুল করিম", passport: "BP1234500", iso: "MDA", visa: "WRK", skill: "Agriculture Worker", stage: "Docs_Verified" as const, aff: 1 },
    { name: "মুশফিকুর রহমান", passport: "BP0112233", iso: "SRB", visa: "SLF", skill: "DOO Director", stage: "Visa_Approved" as const, aff: 0 },
    { name: "তাসনিম জাহান", passport: "BM6677889", iso: "TUR", visa: "WRK", skill: "Textile Operator", stage: "New_Lead" as const, aff: 3 },
    { name: "হাসান মাহমুদ", passport: "BP0773344", iso: "MYS", visa: "WRK", skill: "Plant Operator", stage: "Employer_Matched" as const, aff: 4 },
    { name: "সাদিয়া আফরিন", passport: "BM7788990", iso: "MLT", visa: "VIS", skill: "Schengen Tourist", stage: "Rejected" as const, aff: 5 },
    { name: "ওমর ফারুক", passport: "BP0334455", iso: "BLR", visa: "SLF", skill: "HTP Resident Founder", stage: "Docs_Verified" as const, aff: null },
    { name: "আনিসুর রহমান", passport: "BP1223344", iso: "BHR", visa: "WRK", skill: "Hotel Steward", stage: "Consular_Review" as const, aff: 1 },
  ];

  const counters = new Map<string, number>();
  const year = new Date().getFullYear();

  const clientRows = clientSeeds.map((c, index) => {
    const key = `${c.iso}-${c.visa}`;
    const seq = (counters.get(key) ?? 0) + 1;
    counters.set(key, seq);
    const expiry = isoDate([240, 420, 700, 120, 380, 900, 640, 300, 500, 150][index % 10]);
    const enforcement = evaluateOnboarding({
      fullName: c.name,
      passportNo: c.passport,
      passportExpiry: expiry,
      phone: `+880 1${7 + (index % 3)}${index % 10}-${100000 + index * 137}`,
      email: `client${index + 1}@example.com`,
      age: 22 + (index % 12),
      skill: c.skill,
      countryIso: c.iso,
      visaCode: c.visa,
      photoFileName: `photo-${index + 1}.jpg`,
      photoFileSizeKb: 180 + index * 11,
      photoWidthMm: 35,
      photoHeightMm: 45,
      photoBackgroundWhite: index % 11 !== 0,
      faceCoveragePercent: 74 + (index % 5),
      policeClearanceDate: isoDate(-(12 + (index % 11) * 7)),
      bankStatementMonths: index % 7 === 0 ? 5 : 6,
      bankAverageBalance: 3000 + index * 850,
    });
    const visaRecord = VISA_TYPES.find((v) => v.code === c.visa);
    const employer = employerByName.get(employerSeeds.find((e) => e.iso === c.iso && e.status !== "Blacklisted")?.companyName ?? "");
    const demand = insertedDemands.find((d) => d.employerId === employer?.id);
    const affiliate = c.aff === null ? null : insertedAffiliates[c.aff];
    const stageOrder = ["New_Lead", "Docs_Verified", "Employer_Matched", "Work_Permit_Submitted", "Consular_Review", "Visa_Approved", "Flight_Deployed"];
    const stageIndex = stageOrder.indexOf(c.stage);
    const stalledDays = index % 6 === 0 && stageIndex > 0 && stageIndex < 6 ? 9 + (index % 5) : index % 3;

    return {
      clientRow: {
        clientCode: buildClientCode(c.iso, c.visa, year, seq),
        fullName: c.name,
        passportNo: c.passport,
        passportExpiry: expiry,
        passportValidityDays: enforcement.passportValidityDays,
        phone: `+880 1${7 + (index % 3)}${index % 10}-${100000 + index * 137}`,
        email: `client${index + 1}@example.com`,
        age: 22 + (index % 12),
        skill: c.skill,
        countryIso: c.iso,
        visaCode: c.visa,
        stage: c.stage,
        validationReport: enforcement.checks,
        docsVerified: enforcement.overallPass,
        contractValue: visaRecord?.baseProcessingFee ?? "0",
        affiliateId: affiliate?.id ?? null,
        demandId: stageIndex >= 2 ? (demand?.id ?? null) : null,
        employerId: stageIndex >= 2 ? (employer?.id ?? null) : null,
        stageUpdatedAt: ts(-stalledDays, -(index % 9)),
        createdAt: ts(-(30 + index * 3)),
      },
      enforcement,
      employer,
      affiliate,
      stageIndex,
    };
  });

  const insertedClients = await db
    .insert(clients)
    .values(clientRows.map((r) => r.clientRow))
    .returning({ id: clients.id, clientCode: clients.clientCode, fullName: clients.fullName, stage: clients.stage, countryIso: clients.countryIso, visaCode: clients.visaCode });

  /* --------------------------- RELATED RECORDS -------------------------- */
  const applicationRows = insertedClients.map((client, index) => {
    const meta = clientRows[index];
    const portal = COUNTRIES.find((c) => c.iso3 === client.countryIso);
    const submitted = meta.stageIndex >= 3;
    return {
      clientId: client.id,
      stage: client.stage,
      governmentPortal: portal?.adminPortal ?? "",
      permitSubmissionDate: submitted ? ts(-(18 - index)) : null,
      embassyDate: meta.stageIndex >= 4 ? ts(-(11 - (index % 10))) : null,
      govTrackingCode: submitted ? `${client.countryIso}-${String(4821000 + index * 37)}-${client.visaCode}` : "",
      appointmentSlot: meta.stageIndex >= 4 ? isoDate(3 + (index % 12)) + " 10:30 BST" : null,
      scraperStatus:
        meta.stageIndex >= 5
          ? "APPROVED — স্ট্যাটাস স্ক্র্যাপ সিঙ্ক সম্পন্ন"
          : meta.stageIndex >= 3
            ? "UNDER PROCESS — পোর্টাল রেসপন্স পার্সড"
            : "PENDING — প্রথম স্ক্যান শিডিউলে অপেক্ষমাণ",
      lastStatusSync: ts(-(index % 4), -(index % 12)),
    };
  });
  await db.insert(applications).values(applicationRows);

  const checkRows = insertedClients.flatMap((client, index) =>
    clientRows[index].enforcement.checks.map((check) => ({
      clientId: client.id,
      docType: check.docType,
      parameter: check.parameter,
      measuredValue: check.measuredValue,
      standard: check.standard,
      passed: check.passed,
      verdict: check.verdict,
    })),
  );
  await db.insert(documentChecks).values(checkRows);

  const paymentRows = insertedClients.flatMap((client, index) => {
    const meta = clientRows[index];
    const total = Number(meta.clientRow.contractValue);
    const rows: (typeof payments.$inferInsert)[] = [
      {
        clientId: client.id,
        amount: (total * 0.3).toFixed(2),
        paymentMethod: (["bKash", "Nagad", "Bank"] as const)[index % 3],
        paymentStage: "Advance" as const,
        transactionRef: `TRX${9000000 + index * 13}`,
        invoiceNo: `WVC-INV-${new Date().getFullYear()}-${String(100 + index)}`,
        createdAt: ts(-(28 + index)),
      },
    ];
    if (meta.stageIndex >= 3) {
      rows.push({
        clientId: client.id,
        amount: (total * 0.4).toFixed(2),
        paymentMethod: (["Bank", "bKash", "Nagad"] as const)[index % 3],
        paymentStage: "Stage_2",
        transactionRef: `TRX${9100000 + index * 17}`,
        invoiceNo: `WVC-INV-${new Date().getFullYear()}-${String(200 + index)}`,
        createdAt: ts(-(14 + index)),
      });
    }
    if (meta.stageIndex >= 5) {
      rows.push({
        clientId: client.id,
        amount: (total * 0.3).toFixed(2),
        paymentMethod: "Bank" as const,
        paymentStage: "Final",
        transactionRef: `TRX${9200000 + index * 19}`,
        invoiceNo: `WVC-INV-${new Date().getFullYear()}-${String(300 + index)}`,
        createdAt: ts(-(6 + index)),
      });
    }
    return rows;
  });
  await db.insert(payments).values(paymentRows);

  const commissionRows = insertedClients.flatMap((client, index) => {
    const meta = clientRows[index];
    if (!meta.affiliate || meta.stageIndex < 5) return [];
    const visaRecord = VISA_TYPES.find((v) => v.code === client.visaCode);
    return [
      {
        affiliateId: meta.affiliate.id,
        clientId: client.id,
        visaCode: client.visaCode,
        amount: visaRecord?.affiliateCommission ?? "3000.00",
        note: `${client.fullName} (${client.clientCode}) ভিসা অনুমোদন — অটো কমিশন ক্রেডিট`,
        createdAt: ts(-(5 + index % 7)),
      },
    ];
  });
  if (commissionRows.length) await db.insert(commissions).values(commissionRows);

  const deploymentRows = insertedClients.flatMap((client, index) =>
    client.stage === "Flight_Deployed"
      ? [
          {
            clientId: client.id,
            flightDate: ts(2 + (index % 5), 6),
            airline: ["Turkish Airlines", "Air Arabia", "Saudia", "Gulf Air", "Qatar Airways"][index % 5],
            pnrNumber: `PNR${700000 + index * 29}`,
            destinationAirport: ["Belgrade Nikola Tesla (BEG)", "Istanbul (IST)", "Riyadh (RUH)", "Bahrain (BAH)", "Kuala Lumpur (KUL)"][index % 5],
            airportPickupStatus: index % 2 === 0,
          },
        ]
      : [],
  );
  if (deploymentRows.length) await db.insert(deployments).values(deploymentRows);

  const partnerRows = insertedEmployers
    .filter((_, idx) => idx % 2 === 0)
    .map((employer, idx) => ({
      employerId: employer.id,
      partnerName: `${employer.companyName} — International Partner Account`,
      countryIso: employerSeeds[idx * 2]?.iso ?? "SRB",
      commissionRate: (10 + idx).toFixed(2),
      agreementPdfUrl: `/agreements/partner-agreement-${idx + 1}.pdf`,
      profitShareBalance: (185000 + idx * 42850).toFixed(2),
    }));
  await db.insert(partners).values(partnerRows);

  const emailRows = insertedClients.slice(0, 16).flatMap((client, index) => {
    const rendered = renderTrigger("onboarding_welcome", { clientId: client.clientCode, clientName: client.fullName });
    const rows = [
      {
        clientId: client.id,
        recipientEmail: `client${index + 1}@example.com`,
        subject: rendered.subject,
        triggerType: "onboarding_welcome",
        sentStatus: true,
        sentAt: ts(-(20 - index % 15), -(index % 6)),
      },
    ];
    if (index % 3 === 0) {
      const match = renderTrigger("candidate_match", {
        clientId: client.clientCode,
        clientName: client.fullName,
        jobCategory: "Welder",
        countryBn: "সার্বিয়া",
      });
      rows.push({
        clientId: client.id,
        recipientEmail: "hiring@belgrademetal.rs",
        subject: match.subject,
        triggerType: "candidate_match",
        sentStatus: true,
        sentAt: ts(-(16 - index % 10), -2),
      });
    }
    if (index % 2 === 0) {
      const wp = renderTrigger("work_permit_submission", {
        clientId: client.clientCode,
        clientName: client.fullName,
        govCode: `SRB-WP-${4821000 + index * 37}`,
        employerName: "Belgrade Metal Works DOO",
        countryBn: "সার্বিয়া",
      });
      rows.push({
        clientId: client.id,
        recipientEmail: `client${index + 1}@example.com`,
        subject: wp.subject,
        triggerType: "work_permit_submission",
        sentStatus: true,
        sentAt: ts(-(9 - index % 8), -1),
      });
    }
    return rows;
  });
  await db.insert(emailsLog).values(emailRows);

  const automationRows: (typeof automationJobs.$inferInsert)[] = [];
  const slots = ["০৯:০০ BST", "১৪:০০ BST", "২১:০০ BST"];
  COUNTRIES.forEach((country, ci) => {
    slots.forEach((slot, si) => {
      const found = (ci + si) % 3 === 0 ? 1 + ((ci + si) % 3) : 0;
      automationRows.push({
        jobType: "appointment_scan",
        countryIso: country.iso3,
        scheduledSlot: slot,
        status: found > 0 ? "success" : "warning",
        slotsFound: found,
        clientsProcessed: 0,
        resultMessage:
          found > 0
            ? `${country.nameBn}: ${found} টি VFS/বায়োমেট্রিক স্লট শনাক্ত — DOM মিউটেশন ডিটেক্টেড, ওয়েটিং পুলের প্রার্থীর জন্য তাত্ক্ষণিক লক সম্পন্ন`
            : `${country.nameBn}: নতুন স্লট উন্মুক্ত হয়নি — NEXT_RUN ইন্টারভালে পুনঃপরীক্ষা`,
        startedAt: ts(-(ci % 3), 9 + si * 5),
        finishedAt: ts(-(ci % 3), 9 + si * 5).getTime() ? new Date(ts(-(ci % 3), 9 + si * 5).getTime() + 42_000) : null,
      });
    });
    automationRows.push({
      jobType: "status_scrape",
      countryIso: country.iso3,
      scheduledSlot: "২৪ ঘণ্টা চক্র",
      status: ci % 5 === 0 ? "warning" : "success",
      slotsFound: 0,
      clientsProcessed: 2 + (ci % 4),
      resultMessage: `${country.nameBn}: ${2 + (ci % 4)} টি ফাইলের পাসপোর্ট নম্বর ইনজেক্ট করে স্ট্যাটাস সিঙ্ক করা হয়েছে${ci % 5 === 0 ? " — ১টি সেশনে ক্যাপচা চ্যালেঞ্জ, প্রক্সি রোটেশনে রিট্রাই" : ""}`,
      startedAt: ts(-1, ci),
      finishedAt: new Date(ts(-1, ci).getTime() + 95_000),
    });
  });
  await db.insert(automationJobs).values(automationRows);

  const alertRows = insertedClients.flatMap((client, index) => {
    const stalled = clientRows[index].clientRow.stageUpdatedAt;
    const stalledDays = Math.floor((now() - stalled.getTime()) / DAY);
    const blockedDoc = clientRows[index].enforcement.checks.some((c) => !c.passed && c.severity === "block");
    if (stalledDays < 7 && !blockedDoc) return [];
    return [
      {
        clientId: client.id,
        stage: client.stage,
        stalledDays: Math.max(stalledDays, 8),
        severity: blockedDoc ? "critical" : "watch",
        resolved: false,
      },
    ];
  });
  await db.insert(slaAlerts).values(alertRows);
}
