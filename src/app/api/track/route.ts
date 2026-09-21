import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, clients, deployments, emailsLog, employers, payments } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";

export async function GET(request: Request) {
  await ensureSeeded();
  const url = new URL(request.url);
  const code = (url.searchParams.get("code") ?? "").trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: "ক্লায়েন্ট আইডি প্রয়োজন" }, { status: 400 });
  }

  const [client] = await db.select().from(clients).where(eq(clients.clientCode, code)).limit(1);
  if (!client) {
    return NextResponse.json(
      { error: `‘${code}’ আইডিতে কোনো ফাইল পাওয়া যায়নি। ফরম্যাট: WVC-[দেশ]-[ভিসা]-[সাল]-[ক্রমিক]` },
      { status: 404 },
    );
  }

  const [application] = await db.select().from(applications).where(eq(applications.clientId, client.id)).limit(1);
  const paymentRows = await db.select().from(payments).where(eq(payments.clientId, client.id));
  const emailRows = await db.select().from(emailsLog).where(eq(emailsLog.clientId, client.id)).orderBy(emailsLog.sentAt);
  const [deployment] = await db.select().from(deployments).where(eq(deployments.clientId, client.id)).limit(1);
  const employer = client.employerId
    ? (await db.select().from(employers).where(eq(employers.id, client.employerId)).limit(1))[0]
    : undefined;

  const paid = paymentRows.reduce((sum, row) => sum + Number(row.amount), 0);

  return NextResponse.json({
    client: {
      clientCode: client.clientCode,
      fullName: client.fullName,
      passportNo: client.passportNo,
      countryIso: client.countryIso,
      visaCode: client.visaCode,
      stage: client.stage,
      skill: client.skill,
      contractValue: client.contractValue,
      createdAt: client.createdAt.toISOString(),
    },
    employer: employer ? { companyName: employer.companyName, countryIso: employer.countryIso } : null,
    application: application
      ? {
          governmentPortal: application.governmentPortal,
          govTrackingCode: application.govTrackingCode,
          permitSubmissionDate: application.permitSubmissionDate?.toISOString() ?? null,
          embassyDate: application.embassyDate?.toISOString() ?? null,
          appointmentSlot: application.appointmentSlot,
          scraperStatus: application.scraperStatus,
          lastStatusSync: application.lastStatusSync?.toISOString() ?? null,
        }
      : null,
    payments: paymentRows.map((row) => ({
      amount: row.amount,
      paymentMethod: row.paymentMethod,
      paymentStage: row.paymentStage,
      invoiceNo: row.invoiceNo,
      createdAt: row.createdAt.toISOString(),
    })),
    emails: emailRows.map((row) => ({
      subject: row.subject,
      triggerType: row.triggerType,
      sentAt: row.sentAt.toISOString(),
    })),
    deployment: deployment
      ? {
          flightDate: deployment.flightDate.toISOString(),
          airline: deployment.airline,
          pnrNumber: deployment.pnrNumber,
          destinationAirport: deployment.destinationAirport,
        }
      : null,
    financials: {
      paid,
      contractValue: Number(client.contractValue),
      due: Number(client.contractValue) - paid,
    },
  });
}
