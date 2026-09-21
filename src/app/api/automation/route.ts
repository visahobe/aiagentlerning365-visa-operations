import { NextResponse } from "next/server";
import { getAutomationFeed, getPlatformSnapshot, runAgentCycle } from "@/lib/automation";
import { ensureSeeded } from "@/lib/seed";

export async function GET() {
  await ensureSeeded();
  const [feed, snapshot] = await Promise.all([getAutomationFeed(18), getPlatformSnapshot()]);
  return NextResponse.json({ feed, snapshot });
}

export async function POST(request: Request) {
  await ensureSeeded();
  let slot = "ম্যানুয়াল সাইকেল";
  try {
    const body = (await request.json()) as { slot?: string };
    if (body?.slot) slot = body.slot;
  } catch {
    /* খালি বডি অনুমোদিত */
  }
  const summary = await runAgentCycle(slot);
  const feed = await getAutomationFeed(18);
  const snapshot = await getPlatformSnapshot();
  return NextResponse.json({ summary, feed, snapshot });
}
