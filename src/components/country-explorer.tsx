"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Bar, Chip, Reveal, TiltCard } from "./ui";
import type { CountryBlueprint } from "@/lib/reference-data";

const PATHWAYS = [
  { key: "work", label: "ওয়ার্ক ভিসা", icon: "🛠️" },
  { key: "visitor", label: "ভিজিটর ভিসা", icon: "🧭" },
  { key: "self", label: "সেলফ-স্পন্সরশিপ", icon: "🏛️" },
] as const;

export function CountryExplorer({
  countries,
  clientCounts,
}: {
  countries: CountryBlueprint[];
  clientCounts: Record<string, number>;
}) {
  const [activeIso, setActiveIso] = useState(countries[0]?.iso3 ?? "SRB");
  const [tab, setTab] = useState<(typeof PATHWAYS)[number]["key"]>("work");
  const active = useMemo(() => countries.find((c) => c.iso3 === activeIso) ?? countries[0], [activeIso, countries]);
  if (!active) return null;

  const maxVolume = Math.max(...countries.map((c) => c.volumeShare));

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <Reveal dir="left" className="kb-scroll flex gap-2 overflow-x-auto pb-2 lg:grid lg:gap-2 lg:overflow-visible lg:pb-0">
        {countries.map((country) => {
          const isActive = country.iso3 === active.iso3;
          return (
            <button
              key={country.iso3}
              type="button"
              onClick={() => setActiveIso(country.iso3)}
              className={`card card-hover flex min-w-[160px] items-center gap-2.5 p-3 text-left lg:min-w-0 ${
                isActive ? "!border-accent2 !bg-accentsoft" : ""
              }`}
            >
              <span className="text-xl">{country.flag}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-bold text-ink">{country.nameBn}</span>
                <span className="mono block text-[9.5px] tracking-wide text-mute">
                  {country.iso3} · {clientCounts[country.iso3] ?? 0} ফাইল
                </span>
              </span>
              <span className="text-[10px] font-bold text-accent">{country.volumeShare}%</span>
            </button>
          );
        })}
      </Reveal>

      <Reveal dir="right" delay={70}>
        <TiltCard>
          <div className="card overflow-hidden">
            <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1.35fr_1fr]">
              <div>
                <div className="flex flex-wrap gap-1.5">
                  <Chip tone="accent">{active.processingWindow}</Chip>
                  <Chip tone="brand">{active.capitalBn}</Chip>
                  <Chip tone="teal">{active.currencyBn}</Chip>
                </div>
                <h3 className="h3 mt-3 flex flex-wrap items-center gap-2 text-ink">
                  <span className="text-2xl">{active.flag}</span>
                  {active.nameBn}
                  <span className="text-[12px] font-medium text-mute">({active.nameEn})</span>
                </h3>
                <p className="body-text mt-2">
                  <span className="font-bold text-accent">আইনি ভিত্তি: </span>
                  {active.legalBasis}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {PATHWAYS.map((path) => (
                    <button
                      key={path.key}
                      type="button"
                      onClick={() => setTab(path.key)}
                      className={`rounded-xl border px-3 py-2 text-[11.5px] font-bold transition-all ${
                        tab === path.key
                          ? "border-accent2 bg-accentsoft text-accent"
                          : "border-line bg-surface2 text-mute hover:text-ink"
                      }`}
                    >
                      <span className="mr-1">{path.icon}</span>
                      {path.label}
                    </button>
                  ))}
                </div>

                <div className="soft mt-3 p-3.5">
                  <p className="text-[12px] leading-relaxed text-ink">
                    {tab === "work" ? active.workMethod : tab === "visitor" ? active.visitorCategory : active.selfSponsorPathway}
                  </p>
                </div>

                <div className="mt-3 grid gap-2">
                  {(tab === "visitor" ? active.visitorSteps : tab === "self" ? active.selfSponsorSteps.map((s) => s) : active.workSteps.map((s) => `${s.title} — ${s.span}`)).map(
                    (step, index) => (
                      <div key={`${index}-${step.slice(0, 12)}`} className="flex items-start gap-2.5 rounded-xl border border-line bg-surface2 p-2.5">
                        <span className="mono mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-brand2 text-[9.5px] font-bold text-white">
                          {index + 1}
                        </span>
                        <p className="text-[11.5px] leading-relaxed text-mute">{step}</p>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="soft p-3.5">
                  <p className="text-[10.5px] font-bold tracking-[0.2em] text-accent uppercase">দেশভিত্তিক তথ্যচিত্র</p>
                  <div className="mt-2.5 grid gap-1.5 text-[11.5px]">
                    {[
                      ["রাজধানী", active.capitalBn],
                      ["ভাষা", active.languageBn],
                      ["সময় অঞ্চল", active.timezoneBn],
                      ["কনস্যুলার রুট", active.missionBn],
                      ["প্রধান খাত", active.demandSectorsBn],
                    ].map(([label, value]) => (
                      <div key={label} className="flex gap-2">
                        <span className="w-[86px] shrink-0 font-bold text-mute">{label}</span>
                        <span className="text-ink">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="soft p-3.5">
                  <p className="text-[10.5px] font-bold tracking-[0.2em] text-accent uppercase">ভলিউম শেয়ার</p>
                  <div className="mt-2.5 grid gap-2">
                    {countries.map((country) => (
                      <div key={country.iso3}>
                        <div className="flex items-center justify-between text-[10.5px] text-mute">
                          <span>
                            {country.flag} {country.nameBn}
                          </span>
                          <span className="mono text-ink">{country.volumeShare}%</span>
                        </div>
                        <div className="mt-1">
                          <Bar value={country.volumeShare} max={maxVolume} tone={country.iso3 === active.iso3 ? "accent" : "brand"} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Link href={`/countries/${active.iso3.toLowerCase()}`} className="btn btn-brand w-full">
                    {active.nameBn}-এর বিস্তারিত পাতা →
                  </Link>
                  <a href={active.portalUrl} target="_blank" rel="noreferrer" className="btn w-full">
                    অফিশিয়াল পোর্টাল ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        </TiltCard>
      </Reveal>
    </div>
  );
}

export function CountryMatrix({ countries }: { countries: CountryBlueprint[] }) {
  return (
    <div className="card kb-scroll overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left text-[12px]">
        <thead>
          <tr className="bg-surface2 text-[10.5px] tracking-wider text-mute uppercase">
            <th className="sticky left-0 z-10 bg-surface2 px-3.5 py-3">দেশ</th>
            <th className="px-3.5 py-3">প্রশাসনিক পোর্টাল</th>
            <th className="px-3.5 py-3">ওয়ার্ক পারমিট ভিত্তি</th>
            <th className="px-3.5 py-3">ভিজিটর ক্যাটাগরি</th>
            <th className="px-3.5 py-3">সেলফ-স্পন্সরশিপ</th>
            <th className="px-3.5 py-3">প্রক্রিয়াকরণ সময়</th>
          </tr>
        </thead>
        <tbody>
          {countries.map((country) => (
            <tr key={country.iso3} className="border-t border-line align-top transition-colors hover:bg-surface2/60">
              <td className="sticky left-0 z-10 bg-surface px-3.5 py-3 font-bold text-ink">
                <span className="mr-1.5">{country.flag}</span>
                <Link href={`/countries/${country.iso3.toLowerCase()}`} className="link-underline">
                  {country.nameBn}
                </Link>
              </td>
              <td className="px-3.5 py-3 text-mute">{country.adminPortal}</td>
              <td className="max-w-[290px] px-3.5 py-3 text-mute">{country.workMethod.slice(0, 132)}…</td>
              <td className="px-3.5 py-3 text-mute">{country.visitorCategory.split("—")[0]}</td>
              <td className="px-3.5 py-3 text-mute">{country.selfSponsorPathway.split("→")[0]}</td>
              <td className="px-3.5 py-3">
                <Badge tone="gold">{country.processingWindow}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
