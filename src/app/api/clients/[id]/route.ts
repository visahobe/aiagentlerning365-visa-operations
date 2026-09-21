import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, clients, emailsLog, slaAlerts } from "@/db/schema";
import { renderTrigger } from "@/lib/email-templates";
import { COUNTRIES } from "@/lib/reference-data";

type Stage = typeof clients.$inferSelect["stage"];

const STAGE_FLOW: Stage[] = [
  "New_Lead",
  "Docs_Verified",
  "Employer_Matched",
  "Work_Permit_Submitted",
  "Consular_Review",
  "Visa_Approved",
  "Flight_Deployed",
];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as { stage?: Stage; target?: "next" | "prev" | "reject"; resolveAlerts?: boolean };

  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) return NextResponse.json({ error: "ক্লায়েন্ট পাওয়া যায়নি" }, { status: 404 });

  let nextStage: Stage = client.stage as Stage;
  if (body.target === "reject") {
    nextStage = "Rejected";
  } else if (body.target === "next" || body.target === "prev") {
    const index = STAGE_FLOW.indexOf(client.stage as Stage);
    const targetIndex = body.target === "next" ? Math.min(index + 1, STAGE_FLOW.length - 1) : Math.max(index - 1, 0);
    nextStage = STAGE_FLOW[targetIndex];
  } else if (body.stage && STAGE_FLOW.includes(body.stage)) {
    nextStage = body.stage;
  }

  await db.update(clients).set({ stage: nextStage, stageUpdatedAt: new Date() }).where(eq(clients.id, id));
  await db.update(applications).set({ stage: nextStage, lastStatusSync: new Date() }).where(eq(applications.clientId, id));
  if (body.resolveAlerts !== false) {
    await db.update(slaAlerts).set({ resolved: true }).where(eq(slaAlerts.clientId, id));
  }

  const portal = COUNTRIES.find((c) => c.iso3 === client.countryIso);
  const triggerByStage: Partial<Record<Stage, string>> = {
    Employer_Matched: "candidate_match",
    Work_Permit_Submitted: "work_permit_submission",
    Consular_Review: "embassy_submission",
    Visa_Approved: "visa_decision",
    Flight_Deployed: "flight_briefing",
    Rejected: "visa_decision",
  };
  const trigger = triggerByStage[nextStage];
  if (trigger) {
    const rendered = renderTrigger(trigger, {
      clientId: client.clientCode,
      clientName: client.fullName,
      countryBn: portal?.nameBn,
      decision: nextStage === "Rejected" ? "ভিসা প্রত্যাখ্যাত" : "ভিসা অনুমোদিত",
      reason: nextStage === "Rejected" ? "অ্যাডমিন কর্তৃক ম্যানুয়াল রিভিউয়ের পর আপিল নোটিশ প্রেরিত।" : undefined,
    });
    await db.insert(emailsLog).values({
      clientId: client.id,
      recipientEmail: client.email || "info@visamotion365.com",
      subject: rendered.subject,
      triggerType: trigger,
      sentStatus: true,
    });
  }

  return NextResponse.json({ ok: true, stage: nextStage, trigger: trigger ?? null });
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) return NextResponse.json({ error: "ক্লায়েন্ট পাওয়া যায়নি" }, { status: 404 });
  const [application] = await db.select().from(applications).where(eq(applications.clientId, id)).limit(1);
  return NextResponse.json({ client, application });
}
