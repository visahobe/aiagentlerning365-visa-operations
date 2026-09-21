import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { affiliates, commissions, emailsLog, withdrawals } from "@/db/schema";
import { getAffiliateDirectory, getAffiliatePortal } from "@/lib/automation";
import { ensureSeeded } from "@/lib/seed";

export async function GET(request: Request) {
  await ensureSeeded();
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id) {
    const portal = await getAffiliatePortal(id);
    if (!portal) return NextResponse.json({ error: "অ্যাফিলিয়েট পাওয়া যায়নি" }, { status: 404 });
    const ledger = await db.select().from(withdrawals).where(eq(withdrawals.affiliateId, id)).orderBy(desc(withdrawals.createdAt));
    return NextResponse.json({
      affiliate: portal.affiliate,
      referrals: portal.referrals,
      ledger: portal.ledger,
      withdrawals: ledger,
    });
  }
  const directory = await getAffiliateDirectory();
  return NextResponse.json({ affiliates: directory });
}

export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json()) as { affiliateId?: string; amount?: number; method?: "bKash" | "Nagad" | "Bank"; accountRef?: string };
  if (!body.affiliateId || !body.amount) {
    return NextResponse.json({ error: "affiliateId ও amount প্রয়োজন" }, { status: 400 });
  }
  const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.id, body.affiliateId)).limit(1);
  if (!affiliate) return NextResponse.json({ error: "অ্যাফিলিয়েট পাওয়া যায়নি" }, { status: 404 });

  const balance = Number(affiliate.walletBalance);
  if (body.amount > balance) {
    return NextResponse.json(
      { error: `অপর্যাপ্ত ব্যালেন্স: বর্তমান ওয়ালেট ৳${balance.toLocaleString("en-US")}` },
      { status: 422 },
    );
  }

  const [created] = await db
    .insert(withdrawals)
    .values({
      affiliateId: affiliate.id,
      amount: Number(body.amount).toFixed(2),
      method: body.method ?? "bKash",
      accountRef: body.accountRef ?? affiliate.phone,
      status: "Pending",
    })
    .returning();

  await db.update(affiliates).set({ walletBalance: (balance - Number(body.amount)).toFixed(2) }).where(eq(affiliates.id, affiliate.id));

  await db.insert(emailsLog).values({
    recipientEmail: "accounts@visamotion365.com",
    subject: `অ্যাফিলিয়েট উইথড্রয়াল রিকোয়েস্ট — ${affiliate.agentName} (৳${Number(body.amount).toLocaleString("en-US")})`,
    triggerType: "withdrawal_request",
    sentStatus: true,
  });

  const [commissionRows] = await db.select().from(commissions).where(eq(commissions.affiliateId, affiliate.id)).limit(1);

  return NextResponse.json({
    status: "pending_admin_approval",
    withdrawal: created,
    remainingBalance: balance - Number(body.amount),
    ledgerSample: commissionRows ?? null,
    message: "উইথড্রয়াল রিকোয়েস্ট অ্যাডমিন প্যানেলে প্রেরিত হয়েছে; অনুমোদনের পর বিকাশ/নগদ/ব্যাংক ট্রান্সফার নিষ্পন্ন হবে।",
  });
}
