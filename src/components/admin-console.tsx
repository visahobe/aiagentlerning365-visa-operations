"use client";

import { useMemo, useState } from "react";
import { Badge, Bar, Chip, Reveal, StatTile } from "./ui";
import { REJECTED_STAGE, STAGE_COLUMNS } from "@/lib/reference-data";

export interface AdminClientRow {
  id: string;
  clientCode: string;
  fullName: string;
  passportNo: string;
  phone: string;
  email: string;
  skill: string;
  age: number;
  countryIso: string;
  visaCode: string;
  stage: string;
  contractValue: number;
  paidAmount: number;
  dueBalance: number;
  affiliateName: string | null;
  affiliateDistrict: string | null;
  employerName: string | null;
  jobTitle: string | null;
  govTrackingCode: string;
  governmentPortal: string;
  scraperStatus: string;
  appointmentSlot: string | null;
  slaBreach: boolean;
  stalledDays: number;
  docsVerified: boolean;
}

export interface Financials {
  contractValue: number;
  received: number;
  due: number;
  commissionsPayable: number;
  partnerShare: number;
  operatingCostEstimate: number;
  visaRevenue: { code: string; label: string; total: number; count: number }[];
}

const FLAGS: Record<string, string> = {
  TUR: "🇹🇷",
  MLT: "🇲🇹",
  SRB: "🇷🇸",
  MDA: "🇲🇩",
  BLR: "🇧🇾",
  SAU: "🇸🇦",
  BHR: "🇧🇭",
  MYS: "🇲🇾",
};

const money = (value: number) => `৳${Math.round(value).toLocaleString("en-US")}`;

export function AdminConsole({
  initialClients,
  financials,
  affiliateOptions,
  employerOptions,
}: {
  initialClients: AdminClientRow[];
  financials: Financials;
  affiliateOptions: { id: string; label: string }[];
  employerOptions: { id: string; label: string }[];
}) {
  const [rows, setRows] = useState(initialClients);
  const [country, setCountry] = useState("all");
  const [visa, setVisa] = useState("all");
  const [affiliate, setAffiliate] = useState("all");
  const [employer, setEmployer] = useState("all");
  const [slaOnly, setSlaOnly] = useState(false);
  const [term, setTerm] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (country !== "all" && row.countryIso !== country) return false;
        if (visa !== "all" && row.visaCode !== visa) return false;
        if (affiliate !== "all" && row.affiliateName !== affiliate) return false;
        if (employer !== "all" && row.employerName !== employer) return false;
        if (slaOnly && !row.slaBreach) return false;
        if (term) {
          const hay = `${row.clientCode} ${row.fullName} ${row.passportNo} ${row.skill} ${row.employerName ?? ""}`.toLowerCase();
          if (!hay.includes(term.toLowerCase())) return false;
        }
        return true;
      }),
    [rows, country, visa, affiliate, employer, slaOnly, term],
  );

  const move = async (id: string, target: "next" | "prev" | "reject") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data = (await res.json()) as { stage: string; trigger: string | null };
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, stage: data.stage, slaBreach: false, stalledDays: 0 } : row)));
      setFlash(
        `ফাইল আপডেট হয়েছে → ${STAGE_COLUMNS.find((c) => c.key === data.stage)?.labelBn ?? REJECTED_STAGE.labelBn}${
          data.trigger ? ` · ইমেইল ট্রিগার প্রেরিত: ${data.trigger}` : ""
        }`,
      );
      window.setTimeout(() => setFlash(null), 4200);
    } catch {
      setFlash("ধাপ পরিবর্তন ব্যর্থ হয়েছে — পুনরায় চেষ্টা করুন");
    } finally {
      setBusyId(null);
    }
  };

  const countryOptions = Array.from(new Set(initialClients.map((c) => c.countryIso))).sort();
  const columns = [...STAGE_COLUMNS, REJECTED_STAGE];
  const maxRejected = Math.max(...columns.map((c) => filtered.filter((r) => r.stage === c.key).length), 1);

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="মোট চুক্তিমূল্য" value={money(financials.contractValue)} tone="brand" hint="সকল সক্রিয় ফাইলের সম্মিলিত মূল্য" />
        <StatTile label="আদায়কৃত (তিন ধাপে)" value={money(financials.received)} tone="teal" hint="বিকাশ · নগদ · কর্পোরেট ব্যাংক API" />
        <StatTile label="বকেয়া (Due Balance)" value={money(financials.due)} tone="accent" hint="Due = Total − (Advance + Interim)" />
        <StatTile label="SLA অ্যালার্ম" value={rows.filter((r) => r.slaBreach).length.toLocaleString("en-US")} tone="danger" hint="৭+ কার্যদিবস স্থবির ফাইল" />
      </div>

      {flash ? <div className="shimmer rounded-2xl border border-tealx/50 bg-tealsoft px-4 py-3 text-[12px] font-semibold text-tealx">{flash}</div> : null}

      <Reveal>
        <div className="card p-3.5">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <input
              className="field lg:col-span-2"
              placeholder="আইডি, নাম, পাসপোর্ট বা দক্ষতা দিয়ে খুঁজুন…"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
            <select className="field" value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="all">সব দেশ</option>
              {countryOptions.map((iso) => (
                <option key={iso} value={iso}>
                  {FLAGS[iso] ?? ""} {iso}
                </option>
              ))}
            </select>
            <select className="field" value={visa} onChange={(e) => setVisa(e.target.value)}>
              <option value="all">সব ভিসা ক্যাটাগরি</option>
              <option value="WRK">WRK — ওয়ার্ক</option>
              <option value="VIS">VIS — ভিজিটর</option>
              <option value="SLF">SLF — সেলফ</option>
            </select>
            <select className="field" value={employer} onChange={(e) => setEmployer(e.target.value)}>
              <option value="all">সব নিয়োগকর্তা</option>
              {employerOptions.map((o) => (
                <option key={o.id} value={o.label}>
                  {o.label}
                </option>
              ))}
            </select>
            <select className="field" value={affiliate} onChange={(e) => setAffiliate(e.target.value)}>
              <option value="all">সব সাব-এজেন্ট</option>
              {affiliateOptions.map((o) => (
                <option key={o.id} value={o.label}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSlaOnly((v) => !v)}
                className={`rounded-xl border px-3 py-2 text-[11.5px] font-bold transition-colors ${
                  slaOnly ? "border-danger/60 bg-[color-mix(in_srgb,var(--c-danger)_14%,var(--c-surface))] text-danger" : "border-line bg-surface2 text-mute"
                }`}
              >
                🚨 শুধু SLA ব্রিচ
              </button>
              <button
                type="button"
                onClick={() => {
                  setCountry("all");
                  setVisa("all");
                  setAffiliate("all");
                  setEmployer("all");
                  setTerm("");
                  setSlaOnly(false);
                }}
                className="rounded-xl border border-line bg-surface2 px-3 py-2 text-[11.5px] font-bold text-mute"
              >
                ফিল্টার রিসেট
              </button>
            </div>
            <p className="mono text-[10.5px] text-mute">
              {filtered.length} / {rows.length} ফাইল দৃশ্যমান
            </p>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((column) => (
          <div key={column.key} className="soft p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] leading-tight font-bold text-ink">{column.labelBn}</p>
              <span className="mono text-[11px] font-bold text-accent">{filtered.filter((r) => r.stage === column.key).length}</span>
            </div>
            <div className="mt-2">
              <Bar value={filtered.filter((r) => r.stage === column.key).length} max={maxRejected} tone={column.key === "Rejected" ? "accent" : "brand"} />
            </div>
          </div>
        ))}
      </div>

      <Reveal dir="zoom">
        <div className="kb-scroll -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0" data-native-scroll>
          {columns.map((column) => {
            const columnRows = filtered.filter((row) => row.stage === column.key);
            const breaches = columnRows.filter((row) => row.slaBreach).length;
            return (
              <div key={column.key} className="w-[286px] shrink-0 snap-start sm:w-[306px]">
                <div className="card flex h-full flex-col">
                  <div className="border-b border-line px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-bold text-ink">{column.labelBn}</p>
                      <span className="mono rounded-lg bg-surface2 px-2 py-0.5 text-[10.5px] font-bold text-accent">{columnRows.length}</span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <p className="text-[10px] text-mute">{column.hint}</p>
                      {breaches > 0 ? (
                        <span className="animate-pulse-soft rounded-full bg-[color-mix(in_srgb,var(--c-danger)_16%,var(--c-surface))] px-2 py-0.5 text-[9.5px] font-bold text-danger">
                          {breaches} SLA
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="kb-scroll grid max-h-[540px] gap-2 overflow-y-auto p-2">
                    {columnRows.length === 0 ? (
                      <p className="px-2 py-6 text-center text-[11px] text-mute">এই কলামে কোনো ফাইল নেই</p>
                    ) : null}
                    {columnRows.map((row) => (
                      <article
                        key={row.id}
                        className={`card-hover rounded-xl border p-2.5 ${row.slaBreach ? "border-danger/50 bg-[color-mix(in_srgb,var(--c-danger)_8%,var(--c-surface))]" : "border-line bg-surface"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="mono text-[10.5px] text-accent">{row.clientCode}</p>
                            <p className="mt-0.5 truncate text-[12px] font-bold text-ink">{row.fullName}</p>
                          </div>
                          <span className="text-base">{FLAGS[row.countryIso] ?? "🌐"}</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <Badge tone="navy">{row.visaCode}</Badge>
                          {row.slaBreach ? <Badge tone="red">🚨 {row.stalledDays} দিন</Badge> : null}
                          {row.docsVerified ? <Badge tone="teal">ডকুমেন্ট ✓</Badge> : <Badge tone="slate">ডকুমেন্ট ✗</Badge>}
                        </div>
                        <p className="mt-1.5 truncate text-[11px] text-mute">{row.employerName ?? "নিয়োগকর্তা নির্ধারিত হয়নি"}</p>
                        <p className="truncate text-[10.5px] text-mute">{row.jobTitle ?? row.skill}</p>
                        <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px] text-mute">
                          <p>
                            চুক্তি: <span className="mono text-ink">{money(row.contractValue)}</span>
                          </p>
                          <p>
                            বকেয়া: <span className="mono text-accent">{money(row.dueBalance)}</span>
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <button type="button" disabled={busyId === row.id} onClick={() => move(row.id, "prev")} className="rounded-lg border border-line bg-surface2 px-2 py-1 text-[10.5px] text-mute disabled:opacity-50">
                            ◀
                          </button>
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            onClick={() => move(row.id, "next")}
                            className="flex-1 rounded-lg bg-gradient-to-r from-brand2 to-brand px-2 py-1.5 text-[10.5px] font-bold text-white disabled:opacity-50"
                          >
                            {busyId === row.id ? "…" : "পরবর্তী ধাপ ▶"}
                          </button>
                          <button type="button" disabled={busyId === row.id} onClick={() => move(row.id, "reject")} className="rounded-lg border border-danger/50 px-2 py-1 text-[10.5px] text-danger disabled:opacity-50">
                            ✕
                          </button>
                          <button type="button" onClick={() => setExpanded(expanded === row.id ? null : row.id)} className="rounded-lg border border-line bg-surface2 px-2 py-1 text-[10.5px] text-mute">
                            {expanded === row.id ? "▲" : "◉"}
                          </button>
                        </div>
                        {expanded === row.id ? (
                          <div className="mono mt-2 grid gap-1 rounded-xl border border-line bg-surface2 p-2 text-[10px] leading-relaxed text-mute">
                            <p>পাসপোর্ট: {row.passportNo} · বয়স {row.age}</p>
                            <p>পোর্টাল: {row.governmentPortal || "—"}</p>
                            <p>ট্র্যাকিং কোড: {row.govTrackingCode || "—"}</p>
                            <p>অ্যাপয়েন্টমেন্ট: {row.appointmentSlot ?? "—"}</p>
                            <p className="text-tealx">স্ক্র্যাপার: {row.scraperStatus}</p>
                            <p>
                              অ্যাফিলিয়েট: {row.affiliateName ?? "ডাইরেক্ট ফাইল"} {row.affiliateDistrict ? `(${row.affiliateDistrict})` : ""}
                            </p>
                            <p>ফোন: {row.phone}</p>
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
        <Reveal dir="left">
          <div className="card h-full p-4 sm:p-5">
            <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">ফিনান্সিয়াল ম্যানেজমেন্ট অ্যানালিটিক্স</p>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {[
                ["মোট চুক্তিমূল্য", money(financials.contractValue), "text-ink"],
                ["আদায়কৃত নগদ", money(financials.received), "text-tealx"],
                ["ক্লায়েন্ট বকেয়া", money(financials.due), "text-accent"],
                ["অ্যাফিলিয়েট প্রদেয় কমিশন", money(financials.commissionsPayable), "text-accent"],
                ["পার্টনার প্রফিট শেয়ার", money(financials.partnerShare), "text-brand2"],
                ["আনুমানিক অপারেটিং কস্ট", money(financials.operatingCostEstimate), "text-danger"],
              ].map(([label, value, tone]) => (
                <div key={label} className="soft p-3">
                  <p className="text-[10.5px] text-mute">{label}</p>
                  <p className={`mono mt-1 text-[14px] font-bold ${tone}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="mono mt-3 rounded-2xl border border-accent2 bg-accentsoft p-3 text-[11px] text-accent">
              Due Balance = মোট চুক্তিমূল্য − (অ্যাডভান্স + স্টেজ পেমেন্ট)
              <br />= {money(financials.contractValue)} − {money(financials.received)} = {money(financials.due)}
            </div>
            <div className="mt-3 grid gap-2">
              {financials.visaRevenue.map((row) => (
                <div key={row.code}>
                  <div className="flex items-center justify-between text-[11px] text-mute">
                    <span>
                      {row.label} · {row.count} ফাইল
                    </span>
                    <span className="mono text-accent">{money(row.total)}</span>
                  </div>
                  <div className="mt-1">
                    <Bar value={row.total} max={Math.max(...financials.visaRevenue.map((r) => r.total), 1)} tone="accent" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal dir="right" delay={70}>
          <div className="card h-full p-4 sm:p-5">
            <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">কানবান ধাপ ব্যাখ্যা ও SLA প্রোটোকল</p>
            <ol className="mt-3 grid gap-2">
              {columns.map((column, index) => (
                <li key={column.key} className="soft flex items-start gap-2.5 p-3">
                  <span className="mono grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-brand2 text-[10px] font-bold text-white">{index + 1}</span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-bold text-ink">{column.labelBn}</span>
                    <span className="block text-[10.5px] text-mute">
                      {"detail" in column ? column.detail : column.hint}
                    </span>
                  </span>
                  <span className="mono ml-auto text-[12px] text-accent">{filtered.filter((r) => r.stage === column.key).length}</span>
                </li>
              ))}
            </ol>
            <div className="mt-3 rounded-2xl border border-danger/40 bg-[color-mix(in_srgb,var(--c-danger)_8%,var(--c-surface))] p-3.5">
              <p className="text-[12px] font-bold text-danger">ইন্টেলিজেন্ট SLA অ্যালার্ম</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-mute">
                কোনো ফাইল যেকোনো ধাপে টানা ৭ কার্যদিবস অগ্রগতিহীন থাকলে ড্যাশবোর্ডে লাল ব্যাজ জেনারেট হয় এবং
                সুপারভাইজারের ইনবক্সে এস্কেলেশন যায় (বর্তমানে {rows.filter((r) => r.slaBreach).length} টি ফাইল নজরদারিতে)।
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Chip tone="danger">অ্যালার্ম: {rows.filter((r) => r.slaBreach).length}</Chip>
                <Chip tone="teal">ভিসা অনুমোদিত: {rows.filter((r) => ["Visa_Approved", "Flight_Deployed"].includes(r.stage)).length}</Chip>
                <Chip tone="accent">প্রত্যাখ্যাত: {rows.filter((r) => r.stage === "Rejected").length}</Chip>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
