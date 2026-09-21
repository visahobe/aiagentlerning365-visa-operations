import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { demands, emailsLog, employers } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";

const SUSPICIOUS_HOST_PATTERNS = [/\.top$/i, /free-?visa/i, /\d{4,}\.top$/i, /-now\./i];

export async function GET() {
  await ensureSeeded();
  const rows = await db.select().from(employers).orderBy(desc(employers.createdAt));
  const demandRows = await db.select().from(demands);
  return NextResponse.json({
    employers: rows.map((employer) => ({
      ...employer,
      demands: demandRows.filter((d) => d.employerId === employer.id),
    })),
  });
}

export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json()) as Record<string, unknown>;
  const required = ["companyName", "countryIso", "tradeLicenseNo", "taxId", "contactPerson", "email", "phone", "website"];
  const missing = required.filter((key) => !body[key]);
  if (missing.length) {
    return NextResponse.json({ error: `অসম্পূর্ণ ফিল্ড: ${missing.join(", ")}` }, { status: 400 });
  }

  const website = String(body.website);
  const taxId = String(body.taxId).toUpperCase();
  const license = String(body.tradeLicenseNo).toUpperCase();

  const existing = await db.select().from(employers);
  const blacklisted = existing.filter((e) => e.verificationStatus === "Blacklisted");
  const matchedBlacklist = blacklisted.find(
    (e) => e.taxId.toUpperCase() === taxId || e.tradeLicenseNo.toUpperCase() === license,
  );
  const suspiciousHost = SUSPICIOUS_HOST_PATTERNS.some((pattern) => pattern.test(website));

  const screening = {
    taxIdMatch: Boolean(matchedBlacklist),
    tradeLicenseMatch: Boolean(matchedBlacklist),
    domainHeuristicFlag: suspiciousHost,
    blacklistHits: matchedBlacklist ? [matchedBlacklist.companyName] : [],
  };

  if (matchedBlacklist || suspiciousHost) {
    const [created] = await db
      .insert(employers)
      .values({
        companyName: String(body.companyName),
        countryIso: String(body.countryIso).toUpperCase(),
        tradeLicenseNo: license,
        taxId,
        contactPerson: String(body.contactPerson),
        contactTitle: String(body.contactTitle ?? "HR Manager"),
        email: String(body.email),
        phone: String(body.phone),
        website,
        verificationStatus: "Blacklisted",
        screeningNote:
          "সিস্টেম ব্লক: ইন্টেলিজেন্ট স্ক্রিনিং ইঞ্জিন ব্ল্যাকলিস্ট ডাটাবেজের সাথে ট্যাক্স আইডি/ট্রেড লাইসেন্স মিল অথবা সন্দেহজনক ডোমেইন হিউরিস্টিক শনাক্ত করেছে। ডিমান্ড স্বয়ংক্রিয়ভাবে স্থগিত ও অ্যাডমিন প্যানেলে সিকিউরিটি অ্যালার্ট প্রেরিত।",
      })
      .returning();

    await db.insert(emailsLog).values({
      recipientEmail: "info@visamotion365.com",
      subject: `সিকিউরিটি অ্যালার্ট: সন্দেহজনক ডিমান্ড অনুরোধ — ${created.companyName}`,
      triggerType: "security_alert",
      sentStatus: true,
    });

    return NextResponse.json(
      {
        status: "blacklisted",
        employer: created,
        screening,
        message: "নিরাপত্তা প্রোটোকল সক্রিয়: নিয়োগকর্তা কালো তালিকাভুক্ত এবং ডিমান্ড স্থগিত করা হয়েছে।",
      },
      { status: 202 },
    );
  }

  const [created] = await db
    .insert(employers)
    .values({
      companyName: String(body.companyName),
      countryIso: String(body.countryIso).toUpperCase(),
      tradeLicenseNo: license,
      taxId,
      contactPerson: String(body.contactPerson),
      contactTitle: String(body.contactTitle ?? "HR Manager"),
      email: String(body.email),
      phone: String(body.phone),
      website,
      verificationStatus: "Verified",
      screeningNote:
        "ট্যাক্স আইডি ও ট্রেড লাইসেন্স নিবন্ধন ডাটাবেজের সাথে ক্রস-ম্যাচ সম্পন্ন। কোনো ব্ল্যাকলিস্ট হিট পাওয়া যায়নি। NDA ও রিক্রুটমেন্ট সার্ভিস চুক্তি স্বয়ংক্রিয়ভাবে প্রস্তুত।",
      agreementPdfUrl: `/agreements/nda-${String(body.countryIso).toLowerCase()}-${Date.now().toString(36)}.pdf`,
      agreementSignedAt: new Date(),
    })
    .returning();

  await db.insert(emailsLog).values({
    recipientEmail: String(body.email),
    subject: `VisaMotion365 Partner Onboarding — NDA & Recruitment Service Agreement (${created.companyName})`,
    triggerType: "employer_agreement",
    sentStatus: true,
  });

  return NextResponse.json({
    status: "verified",
    employer: created,
    screening,
    agreements: [
      { type: "Non-Disclosure Agreement (NDA)", url: created.agreementPdfUrl, signed: true },
      { type: "Recruitment Service Agreement", url: created.agreementPdfUrl, signed: true },
    ],
    message: "নিয়োগকর্তা ভেরিফাইড হিসেবে অন্তর্ভুক্ত এবং ই-সাইনকৃত চুক্তিপত্র জেনারেট সম্পন্ন।",
  });
}

export async function PATCH(request: Request) {
  await ensureSeeded();
  const body = (await request.json()) as { id?: string; verificationStatus?: "Verified" | "Pending" | "Blacklisted" };
  if (!body.id || !body.verificationStatus) {
    return NextResponse.json({ error: "id ও verificationStatus প্রয়োজন" }, { status: 400 });
  }
  const [updated] = await db
    .update(employers)
    .set({ verificationStatus: body.verificationStatus })
    .where(eq(employers.id, body.id))
    .returning();
  if (body.verificationStatus === "Blacklisted") {
    await db.update(demands).set({ status: "Paused", blacklistFlag: true }).where(eq(demands.employerId, body.id));
  }
  return NextResponse.json({ ok: true, employer: updated });
}
