import { NextResponse } from "next/server";
import { getEmailFeed } from "@/lib/automation";
import { ensureSeeded } from "@/lib/seed";
import { EMAIL_TRIGGERS, ORG } from "@/lib/reference-data";
import { renderTrigger, type TriggerContext } from "@/lib/email-templates";

export async function GET() {
  await ensureSeeded();
  const feed = await getEmailFeed(30);
  return NextResponse.json({ feed, triggers: EMAIL_TRIGGERS, sender: ORG.email });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { triggerType?: string; context?: TriggerContext };
  if (!body.triggerType) {
    return NextResponse.json({ error: "triggerType প্রয়োজন" }, { status: 400 });
  }
  const preview = renderTrigger(body.triggerType, body.context ?? {});
  return NextResponse.json({
    ...preview,
    sender: ORG.email,
    template: "responsive-table-inline-css-v1",
    definition: EMAIL_TRIGGERS.find((t) => t.key === body.triggerType) ?? null,
  });
}
