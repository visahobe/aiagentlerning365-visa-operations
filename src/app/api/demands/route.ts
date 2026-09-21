import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { demands, employers, visaTypes } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";

export async function GET() {
  await ensureSeeded();
  const rows = await db.select().from(demands);
  const employerRows = await db.select().from(employers);
  return NextResponse.json({
    demands: rows.map((demand) => ({
      ...demand,
      employerName: employerRows.find((e) => e.id === demand.employerId)?.companyName ?? "—",
    })),
  });
}

export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json()) as Record<string, unknown>;
  const employerId = String(body.employerId ?? "");
  if (!employerId) return NextResponse.json({ error: "employerId প্রয়োজন" }, { status: 400 });

  const [employer] = await db.select().from(employers).where(eq(employers.id, employerId)).limit(1);
  if (!employer) return NextResponse.json({ error: "নিয়োগকর্তা পাওয়া যায়নি" }, { status: 404 });

  if (employer.verificationStatus === "Blacklisted") {
    return NextResponse.json(
      {
        status: "blocked",
        message:
          "সিকিউরিটি অ্যালার্ট: কালো তালিকাভুক্ত নিয়োগকর্তার বিরুদ্ধে নতুন ডিমান্ড তৈরি করা যাবে না। অ্যাডমিন প্যানেলে এস্কেলেশন নোট প্রেরিত হয়েছে।",
      },
      { status: 403 },
    );
  }

  const [created] = await db
    .insert(demands)
    .values({
      employerId,
      jobTitle: String(body.jobTitle ?? "General Worker"),
      jobCategory: String(body.jobCategory ?? "Factory Worker"),
      requiredWorkers: Number(body.requiredWorkers ?? 1),
      salary: Number(body.salary ?? 1000).toFixed(2),
      currency: String(body.currency ?? "EUR"),
      workingHours: String(body.workingHours ?? "৮ ঘণ্টা / দৈনিক"),
      overtimePolicy: String(body.overtimePolicy ?? "১২৫% ওভারটাইম হার"),
      accommodation: String(body.accommodation ?? "কোম্পানি প্রদত্ত"),
      medicalInsurance: String(body.medicalInsurance ?? "সম্পূর্ণ কভারেজ"),
      foodAllowance: String(body.foodAllowance ?? "খাদ্য ভাতা প্রযোজ্য"),
      status: employer.verificationStatus === "Verified" ? "Open" : "Paused",
    })
    .returning();

  return NextResponse.json({
    status: employer.verificationStatus === "Verified" ? "published" : "pending_review",
    demand: created,
    screening: {
      employerStatus: employer.verificationStatus,
      agreementSigned: Boolean(employer.agreementSignedAt),
      templateLibrary: (await db.select().from(visaTypes)).length,
    },
  });
}
