import { NextResponse } from "next/server";
import { ensureSeeded } from "@/lib/seed";
import { getPlatformSnapshot } from "@/lib/automation";

export async function POST() {
  const result = await ensureSeeded();
  const snapshot = await getPlatformSnapshot();
  return NextResponse.json({
    seeded: result.seeded,
    message: result.seeded
      ? "ডাটাবেজ বুটস্ট্র্যাপ সম্পন্ন — আট দেশের মাস্টার ডাটা, ক্লায়েন্ট, নিয়োগকর্তা, ডিমান্ড, কমিশন ও অটোমেশন লেজার লোড হয়েছে।"
      : "ডাটাবেজে পূর্বেই ডাটা উপস্থিত রয়েছে — নতুন সিড প্রয়োজন হয়নি।",
    snapshot,
  });
}
