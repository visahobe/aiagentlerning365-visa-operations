import { NextResponse } from "next/server";
import { getAdminConsoleData, getAutomationFeed, getPlatformSnapshot } from "@/lib/automation";
import { ensureSeeded } from "@/lib/seed";
import { COUNTRIES, DB_ENTITIES, EMAIL_TRIGGERS, ROADMAP_PHASES, STAGE_COLUMNS } from "@/lib/reference-data";

export async function GET() {
  await ensureSeeded();
  const [snapshot, consoleData, feed] = await Promise.all([getPlatformSnapshot(), getAdminConsoleData(), getAutomationFeed(6)]);
  return NextResponse.json({
    snapshot,
    financials: consoleData.financials,
    automationFeed: feed,
    alerts: consoleData.alerts,
    masterData: {
      countries: COUNTRIES.map((c) => ({ iso3: c.iso3, nameBn: c.nameBn, processingWindow: c.processingWindow })),
      entities: DB_ENTITIES,
      emailTriggers: EMAIL_TRIGGERS.map((t) => ({ key: t.key, labelBn: t.labelBn })),
      roadmap: ROADMAP_PHASES,
      stages: STAGE_COLUMNS,
    },
  });
}
