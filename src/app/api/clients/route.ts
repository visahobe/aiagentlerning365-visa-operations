import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { applications, clients, documentChecks, emailsLog, payments, visaTypes } from "@/db/schema";
import { buildClientCode, COUNTRY_CODES, VISA_CODES } from "@/lib/client-code";
import { evaluateOnboarding, type OnboardingInput } from "@/lib/validation";
import { renderTrigger } from "@/lib/email-templates";
import { ensureSeeded } from "@/lib/seed";

export async function GET(request: Request) {
  await ensureSeeded();
  const url = new URL(request.url);
  const iso = url.searchParams.get("country");
  const visa = url.searchParams.get("visa");

  const filters = [];
  if (iso) filters.push(eq(clients.countryIso, iso.toUpperCase()));
  if (visa) filters.push(eq(clients.visaCode, visa.toUpperCase()));

  const rows = await db
    .select()
    .from(clients)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(clients.createdAt);

  return NextResponse.json({ count: rows.length, clients: rows });
}

export async function POST(request: Request) {
  await ensureSeeded();
  let body: Partial<OnboardingInput>;

  try {
    body = (await request.json()) as Partial<OnboardingInput>;
  } catch {
    return NextResponse.json({ error: "অবৈধ JSON পেলোড" }, { status: 400 });
  }

  const required: (keyof OnboardingInput)[] = ["fullName", "passportNo", "passportExpiry", "countryIso", "visaCode"];
  const missing = required.filter((key) => !body[key]);
  if (missing.length) {
    return NextResponse.json({ error: `অসম্পূর্ণ ফিল্ড: ${missing.join(", ")}` }, { status: 400 });
  }
  if (!COUNTRY_CODES[body.countryIso as string]) {
    return NextResponse.json({ error: "অসমর্থিত গন্তব্য দেশ কোড" }, { status: 400 });
  }
  if (!VISA_CODES[body.visaCode as string]) {
    return NextResponse.json({ error: "অসমর্থিত ভিসা ক্যাটাগরি" }, { status: 400 });
  }

  const input: OnboardingInput = {
    fullName: body.fullName as string,
    passportNo: (body.passportNo as string).toUpperCase(),
    passportExpiry: body.passportExpiry as string,
    phone: body.phone ?? "+880 1700-000000",
    email: body.email ?? "client@example.com",
    age: Number(body.age ?? 26),
    skill: body.skill ?? "General Worker",
    countryIso: (body.countryIso as string).toUpperCase(),
    visaCode: (body.visaCode as string).toUpperCase(),
    photoFileName: body.photoFileName,
    photoFileSizeKb: body.photoFileSizeKb,
    photoWidthMm: body.photoWidthMm,
    photoHeightMm: body.photoHeightMm,
    photoBackgroundWhite: body.photoBackgroundWhite,
    faceCoveragePercent: body.faceCoveragePercent,
    photoSharpness: body.photoSharpness,
    policeClearanceDate: body.policeClearanceDate,
    bankStatementMonths: body.bankStatementMonths,
    bankAverageBalance: body.bankAverageBalance,
  };

  const outcome = evaluateOnboarding(input);
  const year = new Date().getFullYear();

  const [sequenceRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(clients)
    .where(
      and(
        eq(clients.countryIso, input.countryIso),
        eq(clients.visaCode, input.visaCode),
        sql`extract(year from ${clients.createdAt}) = ${year}`,
      ),
    );

  const sequence = (sequenceRow?.count ?? 0) + 1;
  const clientCode = buildClientCode(input.countryIso, input.visaCode, year, sequence);

  if (!outcome.overallPass) {
    return NextResponse.json(
      {
        status: "blocked",
        clientCode,
        message:
          "প্রি-ভ্যালিডেশন ইঞ্জিন ফাইলটি ব্লক করেছে। ভিসা ক্যাটাগরি বা দেশে সাবমিশনের আগে বাধ্যতামূলক নথিগুলো সংশোধন করতে হবে।",
        checks: outcome.checks,
        blockers: outcome.blockers,
      },
      { status: 422 },
    );
  }

  const [visaRecord] = await db.select().from(visaTypes).where(eq(visaTypes.code, input.visaCode)).limit(1);

  const [created] = await db
    .insert(clients)
    .values({
      clientCode,
      fullName: input.fullName,
      passportNo: input.passportNo,
      passportExpiry: input.passportExpiry,
      passportValidityDays: outcome.passportValidityDays,
      phone: input.phone,
      email: input.email,
      age: input.age,
      skill: input.skill,
      countryIso: input.countryIso,
      visaCode: input.visaCode,
      stage: outcome.warnings.length ? "New_Lead" : "Docs_Verified",
      validationReport: outcome.checks,
      docsVerified: outcome.warnings.length === 0,
      contractValue: visaRecord?.baseProcessingFee ?? "0",
    })
    .returning();

  await db.insert(applications).values({
    clientId: created.id,
    stage: created.stage,
    governmentPortal: "",
    scraperStatus: "PENDING — প্রথম স্ক্যান শিডিউলে অপেক্ষমাণ",
  });

  await db.insert(documentChecks).values(
    outcome.checks.map((check) => ({
      clientId: created.id,
      docType: check.docType,
      parameter: check.parameter,
      measuredValue: check.measuredValue,
      standard: check.standard,
      passed: check.passed,
      verdict: check.verdict,
    })),
  );

  const advance = Number(visaRecord?.baseProcessingFee ?? 0) * 0.3;
  const invoiceNo = `WVC-INV-${year}-${String(sequence + 500).padStart(4, "0")}`;
  await db.insert(payments).values({
    clientId: created.id,
    amount: advance.toFixed(2),
    paymentMethod: "bKash",
    paymentStage: "Advance",
    transactionRef: `TRX${Math.floor(10_000_000 + Math.random() * 8_999_999)}`,
    invoiceNo,
  });

  const welcome = renderTrigger("onboarding_welcome", {
    clientId: clientCode,
    clientName: input.fullName,
    countryBn: COUNTRY_CODES[input.countryIso],
    visaBn: VISA_CODES[input.visaCode],
  });
  await db.insert(emailsLog).values({
    clientId: created.id,
    recipientEmail: input.email,
    subject: `আপনার ফাইল সফলভাবে জমা হয়েছে - আইডি: ${clientCode}`,
    triggerType: "onboarding_welcome",
    sentStatus: true,
  });

  return NextResponse.json({
    status: "accepted",
    client: created,
    clientCode,
    invoiceNo,
    advancePaid: advance,
    checks: outcome.checks,
    warnings: outcome.warnings,
    emailPreview: welcome,
  });
}
