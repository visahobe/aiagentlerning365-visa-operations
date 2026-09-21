"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Bar, Chip, Reveal } from "./ui";
import { STAGE_COLUMNS } from "@/lib/reference-data";

interface TrackApplication {
  governmentPortal: string;
  govTrackingCode: string;
  permitSubmissionDate: string | null;
  embassyDate: string | null;
  appointmentSlot: string | null;
  scraperStatus: string;
  lastStatusSync: string | null;
}

interface TrackPayment {
  amount: string;
  paymentMethod: string;
  paymentStage: string;
  invoiceNo: string;
  createdAt: string;
}

interface TrackEmail {
  subject: string;
  triggerType: string;
  sentAt: string;
}

interface TrackResult {
  client: {
    clientCode: string;
    fullName: string;
    passportNo: string;
    countryIso: string;
    visaCode: string;
    stage: string;
    skill: string;
    contractValue: string;
    createdAt: string;
  };
  employer: { companyName: string; countryIso: string } | null;
  application: TrackApplication | null;
  payments: TrackPayment[];
  emails: TrackEmail[];
  deployment: { flightDate: string; airline: string; pnrNumber: string; destinationAirport: string } | null;
  financials: { paid: number; contractValue: number; due: number };
}

const STAGE_LABEL: Record<string, string> = {
  New_Lead: "নতুন লিড ও আবেদন",
  Docs_Verified: "ডকুমেন্ট যাচাইকৃত",
  Employer_Matched: "নিয়োগকর্তা নির্বাচন",
  Work_Permit_Submitted: "ওয়ার্ক পারমিট সাবমিশন",
  Consular_Review: "কনস্যুলার পর্যালোচনা",
  Visa_Approved: "ভিসা অনুমোদিত",
  Flight_Deployed: "ফ্লাইট ও ডিপ্লয়মেন্ট",
  Rejected: "প্রত্যাখ্যাত ও আপিল",
};

export function TrackConsole({ samples }: { samples: string[] }) {
  const [code, setCode] = useState("");
  const [data, setData] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lookup = async (value: string) => {
    if (!value.trim()) {
      setError("অনুগ্রহ করে ক্লায়েন্ট আইডি লিখুন");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/track?code=${encodeURIComponent(value.trim())}`);
      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        setData(null);
        setError(payload.error ?? "এই আইডিতে কোনো ফাইল পাওয়া যায়নি");
        return;
      }
      const payload = (await res.json()) as TrackResult;
      setData(payload);
    } catch {
      setError("সার্ভারের সাথে সংযোগ ব্যর্থ হয়েছে");
    } finally {
      setBusy(false);
    }
  };

  const stageIndex = data ? STAGE_COLUMNS.findIndex((c) => c.key === data.client.stage) : -1;

  return (
    <div className="grid gap-5">
      <Reveal>
        <div className="card p-4 sm:p-5">
          <p className="text-[10px] font-bold tracking-[0.24em] text-accent uppercase">ক্লায়েন্ট আইডি দিয়ে ট্র্যাকিং</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              className="field mono flex-1 uppercase"
              placeholder="WVC-SRB-WRK-2026-0001"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void lookup(code);
              }}
            />
            <button type="button" onClick={() => void lookup(code)} disabled={busy} className="btn btn-primary disabled:opacity-60">
              {busy ? "খোঁজা হচ্ছে…" : "ফাইল খুঁজুন"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[10.5px] text-mute">নমুনা আইডি:</span>
            {samples.slice(0, 5).map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setCode(sample);
                  void lookup(sample);
                }}
                className="mono rounded-lg border border-line bg-surface2 px-2 py-1 text-[10px] text-brand2"
              >
                {sample}
              </button>
            ))}
          </div>
          {error ? <p className="mt-3 rounded-xl border border-danger/40 bg-[color-mix(in_srgb,var(--c-danger)_8%,var(--c-surface))] p-3 text-[11.5px] text-danger">{error}</p> : null}
        </div>
      </Reveal>

      {data ? (
        <div className="grid gap-4">
          <Reveal dir="zoom">
            <div className="card p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="mono text-[13px] font-bold text-accent">{data.client.clientCode}</p>
                  <p className="mt-0.5 text-[15px] font-bold text-ink">{data.client.fullName}</p>
                  <p className="mono mt-1 text-[10.5px] text-mute">
                    পাসপোর্ট {data.client.passportNo} · {data.client.countryIso} · {data.client.visaCode} · দক্ষতা {data.client.skill}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={data.client.stage === "Rejected" ? "red" : data.client.stage === "Flight_Deployed" ? "teal" : "gold"}>
                    {STAGE_LABEL[data.client.stage] ?? data.client.stage}
                  </Badge>
                  <Chip tone="brand">{data.employer?.companyName ?? "নিয়োগকর্তা নির্ধারিত হয়নি"}</Chip>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                {STAGE_COLUMNS.map((column, index) => {
                  const reached = stageIndex >= index;
                  return (
                    <div key={column.key} className="flex items-start gap-3">
                      <span
                        className={`mono grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[10px] font-bold ${
                          data.client.stage === "Rejected"
                            ? "bg-[color-mix(in_srgb,var(--c-danger)_18%,var(--c-surface))] text-danger"
                            : reached
                              ? "bg-tealsoft text-tealx"
                              : "bg-surface2 text-mute"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[12px] font-bold ${reached ? "text-ink" : "text-mute"}`}>{column.labelBn}</p>
                        <p className="text-[10.5px] leading-relaxed text-mute">{column.detail}</p>
                        <div className="mt-1">
                          <Bar value={reached ? 100 : 0} tone={reached ? "teal" : "brand"} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>

          <div className="grid gap-4 lg:grid-cols-2">
            <Reveal dir="left">
              <div className="card h-full p-4 sm:p-5">
                <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">সরকারি ও কনস্যুলার তথ্য</p>
                <div className="mt-3 grid gap-2 text-[11px]">
                  {[
                    ["প্রশাসনিক পোর্টাল", data.application?.governmentPortal || "—"],
                    ["গভর্নমেন্ট ট্র্যাকিং কোড", data.application?.govTrackingCode || "—"],
                    ["পারমিট সাবমিশন", data.application?.permitSubmissionDate ? new Date(data.application.permitSubmissionDate).toLocaleString("en-GB") : "—"],
                    ["দূতাবাস জমা", data.application?.embassyDate ? new Date(data.application.embassyDate).toLocaleString("en-GB") : "—"],
                    ["অ্যাপয়েন্টমেন্ট স্লট", data.application?.appointmentSlot ?? "—"],
                    ["স্ক্র্যাপার স্ট্যাটাস", data.application?.scraperStatus ?? "—"],
                    ["সর্বশেষ সিঙ্ক", data.application?.lastStatusSync ? new Date(data.application.lastStatusSync).toLocaleString("en-GB") : "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="soft flex flex-wrap items-start justify-between gap-2 px-3 py-2">
                      <span className="font-bold text-mute">{label}</span>
                      <span className="mono text-right text-ink">{value}</span>
                    </div>
                  ))}
                </div>

                {data.deployment ? (
                  <div className="mt-3 rounded-2xl border border-tealx/40 bg-tealsoft p-3.5">
                    <p className="text-[11.5px] font-bold text-tealx">ফ্লাইট ও ডিপ্লয়মেন্ট নিশ্চিতকৃত</p>
                    <p className="mono mt-1.5 text-[10.5px] text-mute">
                      {new Date(data.deployment.flightDate).toLocaleDateString("en-GB")} · {data.deployment.airline} · PNR{" "}
                      {data.deployment.pnrNumber}
                    </p>
                    <p className="text-[10.5px] text-mute">গন্তব্য: {data.deployment.destinationAirport}</p>
                  </div>
                ) : null}
              </div>
            </Reveal>

            <Reveal dir="right" delay={60}>
              <div className="card h-full p-4 sm:p-5">
                <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">পেমেন্ট ও বকেয়া হিসাব</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div className="soft p-3">
                    <p className="text-[10px] text-mute">চুক্তিমূল্য</p>
                    <p className="mono mt-1 text-[13px] font-bold text-ink">৳{data.financials.contractValue.toLocaleString("en-US")}</p>
                  </div>
                  <div className="soft p-3">
                    <p className="text-[10px] text-mute">পরিশোধিত</p>
                    <p className="mono mt-1 text-[13px] font-bold text-tealx">৳{data.financials.paid.toLocaleString("en-US")}</p>
                  </div>
                  <div className="soft p-3">
                    <p className="text-[10px] text-mute">বকেয়া</p>
                    <p className="mono mt-1 text-[13px] font-bold text-accent">৳{data.financials.due.toLocaleString("en-US")}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <Bar value={data.financials.paid} max={Math.max(data.financials.contractValue, 1)} tone="teal" />
                </div>
                <div className="mt-3 grid gap-1.5">
                  {data.payments.map((payment) => (
                    <div key={payment.invoiceNo} className="soft flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <p className="mono text-[10.5px] text-mute">
                        {payment.invoiceNo} · {payment.paymentMethod}
                      </p>
                      <p className="mono text-[11px] font-bold text-ink">৳{Number(payment.amount).toLocaleString("en-US")}</p>
                    </div>
                  ))}
                  {data.payments.length === 0 ? <p className="text-[11px] text-mute">এখনো কোনো পেমেন্ট নথিভুক্ত হয়নি।</p> : null}
                </div>

                <p className="mt-4 text-[10px] font-bold tracking-[0.22em] text-accent uppercase">ইমেইল নোটিফিকেশন লগ</p>
                <div className="mt-2 grid max-h-[180px] gap-1.5 overflow-y-auto pr-1" data-native-scroll>
                  {data.emails.map((email, index) => (
                    <div key={`${email.triggerType}-${index}`} className="soft px-3 py-2">
                      <p className="text-[10.5px] text-ink">{email.subject}</p>
                      <p className="mono mt-0.5 text-[9.5px] text-mute">
                        {email.triggerType} · {new Date(email.sentAt).toLocaleString("en-GB")}
                      </p>
                    </div>
                  ))}
                </div>

                <Link href="/guide" className="btn mt-4 w-full">
                  পরবর্তী করণীয় ও নির্দেশিকা →
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      ) : null}
    </div>
  );
}
