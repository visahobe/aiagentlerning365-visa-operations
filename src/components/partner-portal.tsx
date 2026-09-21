"use client";

import { useMemo, useState } from "react";
import { Badge, Bar, Chip, Reveal, StatTile } from "./ui";
import { STAGE_COLUMNS } from "@/lib/reference-data";

interface PartnerRow {
  partner: {
    id: string;
    partnerName: string;
    countryIso: string;
    commissionRate: number;
    agreementPdfUrl: string | null;
    profitShareBalance: number;
  };
  employer: { id: string; companyName: string; countryIso: string; verificationStatus: string } | undefined;
  pipeline: { id: string; clientCode: string; fullName: string; stage: string; skill: string; contractValue: number }[];
  stats: {
    total: number;
    medical: number;
    permitsIssued: number;
    ticketed: number;
    flightDates: { clientId: string; flightDate: string; airline: string; pnr: string }[];
  };
}

const FLAGS: Record<string, string> = { TUR: "🇹🇷", MLT: "🇲🇹", SRB: "🇷🇸", MDA: "🇲🇩", BLR: "🇧🇾", SAU: "🇸🇦", BHR: "🇧🇭", MYS: "🇲🇾" };

export function PartnerPortal({
  partners,
  weeklyReport,
}: {
  partners: PartnerRow[];
  weeklyReport: { subject: string; html: string };
}) {
  const [activeId, setActiveId] = useState(partners[0]?.partner.id ?? "");
  const [showAgreement, setShowAgreement] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const active = useMemo(() => partners.find((p) => p.partner.id === activeId) ?? partners[0], [partners, activeId]);

  if (!active) return null;

  const recurringFee = 1850;
  const sharedValue = active.stats.permitsIssued * recurringFee;
  const profitShare = (sharedValue * active.partner.commissionRate) / 100;
  const weeklySettlement = profitShare * 0.35;

  return (
    <div className="grid gap-6">
      <Reveal>
        <div className="card kb-scroll flex gap-2 overflow-x-auto p-3" data-native-scroll>
          {partners.map((row) => (
            <button
              key={row.partner.id}
              type="button"
              onClick={() => setActiveId(row.partner.id)}
              className={`min-w-[230px] rounded-2xl border p-3 text-left transition-all ${
                row.partner.id === active.partner.id ? "border-accent2 bg-accentsoft" : "border-line bg-surface2"
              }`}
            >
              <p className="text-[12px] font-bold text-ink">{row.employer?.companyName ?? row.partner.partnerName}</p>
              <p className="mono mt-0.5 text-[10px] text-mute">
                {FLAGS[row.partner.countryIso] ?? "🌐"} {row.partner.countryIso} · কমিশন {row.partner.commissionRate}%
              </p>
              <p className="mono mt-1 text-[12px] font-bold text-accent">৳{row.partner.profitShareBalance.toLocaleString("en-US")}</p>
            </button>
          ))}
        </div>
      </Reveal>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="সক্রিয় মোতায়েন পাইপলাইন" value={active.stats.total.toLocaleString("en-US")} tone="brand" hint="ডিমান্ডের বিপরীতে নথিভুক্ত কর্মী" />
        <StatTile label="মেডিকেল / পারমিট প্রসেসে" value={active.stats.medical.toLocaleString("en-US")} tone="accent" hint="ফিটনেস ও ওয়ার্ক পারমিট ধাপে" />
        <StatTile label="ইস্যুকৃত ওয়ার্ক পারমিট" value={active.stats.permitsIssued.toLocaleString("en-US")} tone="teal" hint="সরকারি পোর্টালে অনুমোদিত" />
        <StatTile label="টিকিটেড ও রেড-টু-ফ্লাই" value={active.stats.ticketed.toLocaleString("en-US")} tone="teal" hint="PNR ইস্যু সম্পন্ন" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Reveal dir="left">
          <div className="card p-4 sm:p-5">
            <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">রিয়েল-টাইম ডিপ্লয়মেন্ট ওভারভিউ</p>
            <h3 className="h3 mt-2 text-ink">
              {active.employer?.companyName} · {FLAGS[active.partner.countryIso]} {active.partner.countryIso}
            </h3>
            <div className="mt-3 grid gap-2">
              {active.pipeline.map((worker) => {
                const stageIndex = STAGE_COLUMNS.findIndex((c) => c.key === worker.stage);
                return (
                  <div key={worker.id} className="soft p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="mono text-[10.5px] text-accent">{worker.clientCode}</p>
                        <p className="truncate text-[12px] font-bold text-ink">
                          {worker.fullName} · <span className="font-medium text-mute">{worker.skill}</span>
                        </p>
                      </div>
                      <Badge tone={worker.stage === "Rejected" ? "red" : worker.stage === "Flight_Deployed" ? "teal" : "gold"}>
                        {STAGE_COLUMNS.find((c) => c.key === worker.stage)?.labelBn ?? "প্রত্যাখ্যাত"}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <Bar value={((stageIndex + 1) / 7) * 100} tone="teal" />
                    </div>
                  </div>
                );
              })}
              {active.stats.flightDates.length ? (
                <div className="rounded-2xl border border-tealx/40 bg-tealsoft p-3">
                  <p className="text-[11.5px] font-bold text-tealx">ফ্লাইট শিডিউল সিঙ্ক</p>
                  {active.stats.flightDates.map((flight) => (
                    <p key={`${flight.clientId}-${flight.pnr}`} className="mono mt-1 text-[10.5px] text-mute">
                      {new Date(flight.flightDate).toLocaleDateString("en-GB")} · {flight.airline} · {flight.pnr}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </Reveal>

        <Reveal dir="right" delay={70} className="grid gap-4">
          <div className="card p-4 sm:p-5">
            <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">প্রফিট শেয়ারিং ড্যাশবোর্ড</p>
            <div className="mt-3 grid gap-2">
              {[
                ["পার্টনার কমিশন হার", `${active.partner.commissionRate}%`],
                ["প্রতি মোতায়েনে নির্ধারিত সার্ভিস ফি", `৳${recurringFee.toLocaleString("en-US")}`],
                ["এই চক্রে শেয়ারযোগ্য ভ্যালু", `৳${sharedValue.toLocaleString("en-US")}`],
                ["নিট প্রফিট শেয়ার", `৳${Math.round(profitShare).toLocaleString("en-US")}`],
                ["সাপ্তাহিক সেটেলমেন্ট প্রস্তাব", `৳${Math.round(weeklySettlement).toLocaleString("en-US")}`],
                ["সংরক্ষিত ব্যালেন্স", `৳${active.partner.profitShareBalance.toLocaleString("en-US")}`],
              ].map(([label, value]) => (
                <div key={label} className="soft flex items-center justify-between px-3 py-2">
                  <p className="text-[11px] text-mute">{label}</p>
                  <p className="mono text-[12px] font-bold text-accent">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Bar value={profitShare} max={Math.max(profitShare, active.partner.profitShareBalance)} tone="accent" />
            </div>
            <p className="mt-3 rounded-2xl border border-brand2/30 bg-[color-mix(in_srgb,var(--c-brand2)_10%,var(--c-surface))] p-3 text-[11px] leading-relaxed text-mute">
              আন্তর্জাতিক লেনদেনের স্বচ্ছতা নিশ্চিত করতে প্রতিটি মার্জিন ও কমিশন বণ্টনের হিসাব কেন্দ্রীয় লেজারে সংরক্ষিত থাকে
              এবং সাপ্তাহিক প্রফিট শেয়ারিং ড্যাশবোর্ডে স্বয়ংক্রিয়ভাবে প্রতিফলিত হয়।
            </p>
          </div>

          <div className="card p-4 sm:p-5">
            <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">স্বয়ংক্রিয় চুক্তি ও রিপোর্ট জেনারেটর</p>
            <div className="mt-3 grid gap-2">
              <button type="button" onClick={() => setShowAgreement((v) => !v)} className="btn w-full !py-2.5 text-[11.5px]">
                {showAgreement ? "চুক্তির ক্লজ লুকান" : "পার্টনারশিপ অ্যাগ্রিমেন্ট ক্লজ দেখুন"}
              </button>
              <button type="button" onClick={() => setShowReport((v) => !v)} className="btn btn-brand w-full !py-2.5 text-[11.5px]">
                {showReport ? "রিপোর্ট প্রিভিউ লুকান" : "সাপ্তাহিক ডিপ্লয়মেন্ট রিপোর্ট প্রিভিউ"}
              </button>
            </div>
            {showAgreement ? (
              <div className="mono mt-3 grid gap-1.5 rounded-2xl border border-line bg-surface2 p-3 text-[10.5px] leading-relaxed text-mute">
                <p>১. প্রতিষ্ঠান: {active.employer?.companyName}</p>
                <p>২. প্রদেয় রিক্রুটিং ফি: ৳{recurringFee.toLocaleString("en-US")} / কর্মী</p>
                <p>৩. কমিশন বণ্টন: {active.partner.commissionRate}% প্রফিট শেয়ার</p>
                <p>৪. দায়বদ্ধতা: গন্তব্য দেশের শ্রম আইন ও কনস্যুলার নিয়মাবলী মেনে চলা অপরিহার্য</p>
                <p>৫. কমপ্লায়েন্স: BMET/ইমিগ্রেশন অনুমোদন ও ভেরিফাইড ডিমান্ড লেটার ছাড়া কোনো মোতায়েন নয়</p>
                <p>৬. পেআউট: আন্তর্জাতিক ওয়্যার ট্রান্সফার, সাপ্তাহিক ক্লিয়ারিং সাইকেল</p>
                <p className="text-tealx">ই-সাইন স্ট্যাটাস: ডিজিটাল স্বাক্ষর সংরক্ষিত ({active.partner.agreementPdfUrl ?? "খসড়া"})</p>
              </div>
            ) : null}
            {showReport ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-white">
                <iframe title="weekly-report" srcDoc={weeklyReport.html} className="h-[420px] w-full border-0" sandbox="" />
              </div>
            ) : null}
            <p className="mono mt-3 text-[10.5px] text-mute">রিপোর্ট সাবজেক্ট: {weeklyReport.subject}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip tone="teal">সাপ্তাহিক অটো-প্রেরণ</Chip>
              <Chip tone="brand">ওয়্যার ট্রান্সফার সাইকেল</Chip>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
