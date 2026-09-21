"use client";

import { useMemo, useState } from "react";
import { Badge, Bar, Chip, Reveal, StatTile } from "./ui";

export interface DemandView {
  id: string;
  jobTitle: string;
  jobCategory: string;
  requiredWorkers: number;
  fulfilledCount: number;
  salary: number;
  currency: string;
  workingHours: string;
  overtimePolicy: string;
  accommodation: string;
  medicalInsurance: string;
  foodAllowance: string;
  status: string;
  blacklistFlag: boolean;
}

export interface EmployerView {
  id: string;
  companyName: string;
  countryIso: string;
  tradeLicenseNo: string;
  taxId: string;
  contactPerson: string;
  contactTitle: string;
  email: string;
  phone: string;
  website: string;
  verificationStatus: string;
  screeningNote: string;
  agreementPdfUrl: string | null;
  demands: DemandView[];
}

const ISO_OPTIONS = ["SRB", "TUR", "SAU", "MYS", "MLT", "MDA", "BHR", "BLR"];
const FLAGS: Record<string, string> = { TUR: "🇹🇷", MLT: "🇲🇹", SRB: "🇷🇸", MDA: "🇲🇩", BLR: "🇧🇾", SAU: "🇸🇦", BHR: "🇧🇭", MYS: "🇲🇾" };

export function EmployerHub({ initialEmployers }: { initialEmployers: EmployerView[] }) {
  const [employers, setEmployers] = useState(initialEmployers);
  const [country, setCountry] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(initialEmployers[0]?.id ?? null);
  const [form, setForm] = useState({
    companyName: "",
    countryIso: "SRB",
    tradeLicenseNo: "",
    taxId: "",
    contactPerson: "",
    contactTitle: "এইচআর ডিরেক্টর",
    email: "",
    phone: "",
    website: "",
  });
  const [screening, setScreening] = useState<{ status: string; message: string; hits?: string[] } | null>(null);
  const [demandForm, setDemandForm] = useState({
    employerId: initialEmployers[0]?.id ?? "",
    jobTitle: "",
    jobCategory: "ফ্যাক্টরি কর্মী",
    requiredWorkers: 10,
    salary: 1200,
    currency: "EUR",
  });
  const [demandResult, setDemandResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(
    () =>
      employers.filter((employer) => {
        if (country !== "all" && employer.countryIso !== country) return false;
        if (statusFilter !== "all" && employer.verificationStatus !== statusFilter) return false;
        if (search) {
          const hay = `${employer.companyName} ${employer.taxId} ${employer.tradeLicenseNo} ${employer.contactPerson}`.toLowerCase();
          if (!hay.includes(search.toLowerCase())) return false;
        }
        return true;
      }),
    [employers, country, statusFilter, search],
  );

  const submitEmployer = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/employers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { status: string; message: string; employer: EmployerView; screening?: { blacklistHits: string[] } };
      setScreening({ status: data.status, message: data.message, hits: data.screening?.blacklistHits });
      const refreshed = await fetch("/api/employers").then((r) => r.json());
      if (Array.isArray(refreshed?.employers)) setEmployers(refreshed.employers as EmployerView[]);
    } catch {
      setScreening({ status: "error", message: "স্ক্রিনিং ইঞ্জিনে সংযোগ ব্যর্থ হয়েছে" });
    } finally {
      setBusy(false);
    }
  };

  const submitDemand = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/demands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demandForm),
      });
      const data = (await res.json()) as { status?: string; message?: string; demand?: DemandView };
      setDemandResult(
        data.demand
          ? `${data.status === "published" ? "ডিমান্ড প্রকাশিত" : "পেন্ডিং রিভিউ"} · ${data.demand.jobTitle} — ${data.demand.requiredWorkers} জন (${data.demand.currency} ${Number(data.demand.salary).toLocaleString("en-US")})`
          : (data.message ?? "ডিমান্ড তৈরি করা যায়নি"),
      );
      if (data.demand) {
        const refreshed = await fetch("/api/employers").then((r) => r.json());
        if (Array.isArray(refreshed?.employers)) setEmployers(refreshed.employers as EmployerView[]);
      }
    } catch {
      setDemandResult("ডিমান্ড সাবমিশনে নেটওয়ার্ক ত্রুটি");
    } finally {
      setBusy(false);
    }
  };

  const totalQuota = filtered.reduce((sum, e) => sum + e.demands.reduce((s, d) => s + d.requiredWorkers, 0), 0);
  const totalFilled = filtered.reduce((sum, e) => sum + e.demands.reduce((s, d) => s + d.fulfilledCount, 0), 0);

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="ভেরিফাইড নিয়োগকর্তা" value={employers.filter((e) => e.verificationStatus === "Verified").length} tone="teal" />
        <StatTile label="তদন্তাধীন (Pending)" value={employers.filter((e) => e.verificationStatus === "Pending").length} tone="accent" />
        <StatTile label="ব্ল্যাকলিস্টেড" value={employers.filter((e) => e.verificationStatus === "Blacklisted").length} tone="danger" />
        <StatTile label="ওপেন চাহিদা কোটা" value={`${totalFilled} / ${totalQuota}`} tone="brand" hint="পূরণকৃত / মোট কোটা" />
      </div>

      <Reveal>
        <div className="card p-3.5">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <input className="field lg:col-span-2" placeholder="কোম্পানি, ট্যাক্স আইডি বা ট্রেড লাইসেন্স…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="field" value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="all">সব দেশ</option>
              {ISO_OPTIONS.map((iso) => (
                <option key={iso} value={iso}>
                  {FLAGS[iso]} {iso}
                </option>
              ))}
            </select>
            <select className="field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">সব যাচাইকরণ স্ট্যাটাস</option>
              <option value="Verified">ভেরিফাইড</option>
              <option value="Pending">তদন্তাধীন</option>
              <option value="Blacklisted">ব্ল্যাকলিস্টেড</option>
            </select>
          </div>
          <p className="mono mt-2.5 text-[10.5px] text-mute">
            {filtered.length} নিয়োগকর্তা · {filtered.reduce((s, e) => s + e.demands.length, 0)} ডিমান্ড লেটার
          </p>
        </div>
      </Reveal>

      <div className="grid gap-3 lg:grid-cols-2">
        {filtered.map((employer, index) => (
          <Reveal key={employer.id} delay={index * 25} dir={index % 2 === 0 ? "left" : "right"}>
            <article
              className={`card card-hover h-full border-2 p-4 ${
                employer.verificationStatus === "Blacklisted"
                  ? "!border-danger/60"
                  : employer.verificationStatus === "Pending"
                    ? "!border-accent2"
                    : "!border-tealx/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-ink">{employer.companyName}</p>
                  <p className="mono mt-1 text-[10px] break-words text-mute">
                    {FLAGS[employer.countryIso]} {employer.countryIso} · লাইসেন্স {employer.tradeLicenseNo} · ট্যাক্স {employer.taxId}
                  </p>
                </div>
                <Badge tone={employer.verificationStatus === "Verified" ? "teal" : employer.verificationStatus === "Pending" ? "gold" : "red"}>
                  {employer.verificationStatus === "Verified" ? "ভেরিফাইড" : employer.verificationStatus === "Pending" ? "তদন্তাধীন" : "ব্ল্যাকলিস্টেড"}
                </Badge>
              </div>

              <div className="mt-2.5 grid gap-1 text-[11px] text-mute">
                <p>
                  {employer.contactPerson} · {employer.contactTitle}
                </p>
                <p className="mono break-words">
                  {employer.email} · {employer.phone}
                </p>
                <p className="mono text-brand2">{employer.website}</p>
              </div>

              <p className="mt-2.5 rounded-xl border border-line bg-surface2 p-2.5 text-[11px] leading-relaxed text-mute">{employer.screeningNote}</p>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setOpenId(openId === employer.id ? null : employer.id)}
                  className="rounded-xl border border-line bg-surface2 px-3 py-1.5 text-[11px] font-bold text-ink"
                >
                  {openId === employer.id ? "ডিমান্ড লুকান" : `${employer.demands.length} টি ডিমান্ড দেখুন`}
                </button>
                {employer.agreementPdfUrl ? (
                  <Chip tone="teal">NDA + সার্ভিস চুক্তি ই-সাইনকৃত ✓</Chip>
                ) : (
                  <Chip tone="danger">চুক্তিপত্র ব্লকড</Chip>
                )}
              </div>

              {openId === employer.id ? (
                <div className="mt-3 grid gap-2">
                  {employer.demands.map((demand) => (
                    <div key={demand.id} className="soft p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[12px] font-bold text-ink">{demand.jobTitle}</p>
                        <Badge tone={demand.status === "Open" ? "teal" : demand.blacklistFlag ? "red" : "gold"}>
                          {demand.status === "Open" ? "চালু" : demand.blacklistFlag ? "স্থগিত (ব্ল্যাকলিস্ট)" : "বিরত"}
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10.5px] text-mute sm:grid-cols-3">
                        <p>দক্ষতা: {demand.jobCategory}</p>
                        <p>কোটা: {demand.requiredWorkers} জন</p>
                        <p>পূরণ: {demand.fulfilledCount}</p>
                        <p className="mono text-accent">
                          বেতন: {demand.currency} {demand.salary.toLocaleString("en-US")}
                        </p>
                        <p>ঘণ্টা: {demand.workingHours}</p>
                        <p>ওভারটাইম: {demand.overtimePolicy}</p>
                        <p>আবাসন: {demand.accommodation}</p>
                        <p>বীমা: {demand.medicalInsurance}</p>
                        <p>খাদ্য: {demand.foodAllowance}</p>
                      </div>
                      <div className="mt-2">
                        <Bar value={demand.fulfilledCount} max={demand.requiredWorkers} tone="teal" />
                      </div>
                    </div>
                  ))}
                  {employer.demands.length === 0 ? (
                    <p className="soft p-3 text-[11px] text-mute">এখনো কোনো ডিমান্ড লেটার আপলোড করা হয়নি।</p>
                  ) : null}
                </div>
              ) : null}
            </article>
          </Reveal>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal dir="left">
          <div className="card h-full p-4 sm:p-5">
            <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">নিয়োগকর্তা অনবোর্ডিং ও ব্ল্যাকলিস্ট স্ক্রিনিং</p>
            <h3 className="h3 mt-2 text-ink">ইন্টেলিজেন্ট ইঞ্জিন ট্যাক্স আইডি ক্রস-ম্যাচ করে</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[11px] font-bold text-ink">কোম্পানির পূর্ণ নাম</label>
                <input className="field" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Baltic Steel DOO" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-ink">দেশ</label>
                <select className="field" value={form.countryIso} onChange={(e) => setForm({ ...form, countryIso: e.target.value })}>
                  {ISO_OPTIONS.map((iso) => (
                    <option key={iso} value={iso}>
                      {FLAGS[iso]} {iso}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-ink">ট্রেড লাইসেন্স / রেজিস্ট্রেশন</label>
                <input className="field" value={form.tradeLicenseNo} onChange={(e) => setForm({ ...form, tradeLicenseNo: e.target.value })} placeholder="RS-APR-9988771" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-ink">ট্যাক্স আইডি / ভ্যাট</label>
                <input className="field" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} placeholder="RS-TAX-110234578" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-ink">কর্পোরেট ডোমেইন</label>
                <input className="field" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="balticsteel.rs" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-ink">যোগাযোগকারী ব্যক্তি</label>
                <input className="field" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Milos Petrovic" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-ink">পদবি</label>
                <input className="field" value={form.contactTitle} onChange={(e) => setForm({ ...form, contactTitle: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-ink">অফিশিয়াল ইমেইল</label>
                <input className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="hr@balticsteel.rs" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-ink">অফিশিয়াল ফোন</label>
                <input className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+381 11 000 1122" />
              </div>
            </div>
            <button type="button" onClick={submitEmployer} disabled={busy} className="btn btn-primary mt-4 w-full disabled:opacity-60">
              {busy ? "স্ক্রিনিং চলছে…" : "স্ক্রিনিং চালিয়ে অনবোর্ড করুন"}
            </button>
            <p className="mt-2 text-[11px] text-mute">
              ডেমো: সন্দেহজনক ডোমেইন হিউরিস্টিক পরীক্ষা করতে ওয়েবসাইটে <span className="mono text-danger">example-now.top</span> লিখুন।
            </p>
            {screening ? (
              <div className={`mt-3 rounded-2xl border p-3.5 ${screening.status === "verified" ? "border-tealx/40 bg-tealsoft" : "border-danger/40 bg-[color-mix(in_srgb,var(--c-danger)_8%,var(--c-surface))]"}`}>
                <p className="text-[12px] font-bold text-ink">{screening.message}</p>
                {screening.hits?.length ? <p className="mono mt-1.5 text-[10.5px] text-danger">ব্ল্যাকলিস্ট হিট: {screening.hits.join(", ")}</p> : null}
              </div>
            ) : null}
          </div>
        </Reveal>

        <Reveal dir="right" delay={70}>
          <div className="card h-full p-4 sm:p-5">
            <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">ডিমান্ড লেটার পাবলিশ (demands টেবিল)</p>
            <h3 className="h3 mt-2 text-ink">ভেরিফাইড নিয়োগকর্তার অনুকূলে নতুন চাহিদা</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[11px] font-bold text-ink">নিয়োগকর্তা নির্বাচন</label>
                <select className="field" value={demandForm.employerId} onChange={(e) => setDemandForm({ ...demandForm, employerId: e.target.value })}>
                  <option value="">— নির্বাচন করুন —</option>
                  {employers.map((employer) => (
                    <option key={employer.id} value={employer.id}>
                      {employer.verificationStatus === "Blacklisted" ? "🚫 " : ""}
                      {FLAGS[employer.countryIso]} {employer.companyName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[11px] font-bold text-ink">পদের বিবরণ</label>
                <input className="field" value={demandForm.jobTitle} onChange={(e) => setDemandForm({ ...demandForm, jobTitle: e.target.value })} placeholder="ওয়েল্ডার (MIG/TIG) — সিজন ১" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-ink">জনবল ক্যাটাগরি</label>
                <select className="field" value={demandForm.jobCategory} onChange={(e) => setDemandForm({ ...demandForm, jobCategory: e.target.value })}>
                  {["ফ্যাক্টরি কর্মী", "ওয়েল্ডার", "চালক", "নির্মাণ সহকারী", "হসপিটালিটি", "আইটি প্রফেশনাল", "কৃষি কর্মী"].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-ink">চাহিদা কোটা (জন)</label>
                <input type="number" className="field" value={demandForm.requiredWorkers} onChange={(e) => setDemandForm({ ...demandForm, requiredWorkers: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-ink">মাসিক মূল বেতন</label>
                <input type="number" className="field" value={demandForm.salary} onChange={(e) => setDemandForm({ ...demandForm, salary: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-ink">মুদ্রা</label>
                <select className="field" value={demandForm.currency} onChange={(e) => setDemandForm({ ...demandForm, currency: e.target.value })}>
                  {["EUR", "USD", "SAR", "BHD", "MYR", "TRY", "RSD", "MDL"].map((cur) => (
                    <option key={cur} value={cur}>
                      {cur}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="button" onClick={submitDemand} disabled={busy} className="btn btn-brand mt-4 w-full disabled:opacity-60">
              ডিমান্ড পাবলিশ করুন
            </button>
            {demandResult ? <p className="mono mt-3 rounded-2xl border border-line bg-surface2 p-3 text-[11px] text-tealx">{demandResult}</p> : null}
            <div className="soft mt-3 p-3.5 text-[11px] leading-relaxed text-mute">
              ভেরিফাইড প্রতিষ্ঠানের ক্ষেত্রে সিস্টেম সাথে সাথেই আন্তর্জাতিক মানসম্পন্ন NDA ও Recruitment Service Agreement
              পিডিএফ প্রস্তুত করে এবং ই-সাইনে উভয় পক্ষের ডিজিটাল স্বাক্ষর সংরক্ষণ করে। ব্ল্যাকলিস্টেড প্রতিষ্ঠানের ক্ষেত্রে
              ডিমান্ড স্বয়ংক্রিয়ভাবে ব্লক ও সিকিউরিটি অ্যালার্ট জেনারেট হয়।
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
