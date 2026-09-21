"use client";

import { useMemo, useState } from "react";
import { Badge, Bar, Chip, ProgressRing, Reveal } from "./ui";
import { evaluateOnboarding, MIN_BANK_BALANCE, simulateSharpness, type DocCheckResult } from "@/lib/validation";
import { buildClientCode } from "@/lib/client-code";
import { COUNTRIES } from "@/lib/reference-data";

const STEPS = ["শনাক্তকরণ ও পাসপোর্ট", "গন্তব্য ও বায়োমেট্রিক", "কমপ্লায়েন্স প্রমাণ", "রিভিউ ও সাবমিশন"];

const SKILLS = [
  "ওয়েল্ডার (6G)",
  "ফ্যাক্টরি কর্মী",
  "নির্মাণ সহকারী",
  "ভারী যানবাহন চালক",
  "হসপিটালিটি ক্রু",
  "আইটি প্রফেশনাল",
  "নার্স / কেয়ার গিভার",
  "কৃষি কর্মী",
  "টেক্সটাইল অপারেটর",
  "ব্যবসায়িক ভ্রমণকারী",
  "উদ্যোক্তা / ইনভেস্টর",
];

interface SubmitResponse {
  status: string;
  clientCode?: string;
  message?: string;
  checks?: DocCheckResult[];
  blockers?: string[];
  warnings?: string[];
  invoiceNo?: string;
  advancePaid?: number;
  emailPreview?: { subject: string; html: string };
  error?: string;
}

export function OnboardForm({ nextSequence }: { nextSequence: Record<string, number> }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullName: "",
    passportNo: "",
    passportExpiry: "",
    phone: "",
    email: "",
    age: 28,
    skill: SKILLS[0],
    countryIso: "SRB",
    visaCode: "WRK",
    photoFileName: "photo.jpg",
    photoFileSizeKb: 260,
    photoWidthMm: 35,
    photoHeightMm: 45,
    photoBackgroundWhite: true,
    faceCoveragePercent: 75,
    policeClearanceDate: new Date(Date.now() - 20 * 86_400_000).toISOString().slice(0, 10),
    bankStatementMonths: 6,
    bankAverageBalance: 5200,
  });
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const live = useMemo(() => evaluateOnboarding(form), [form]);
  const sharpness = useMemo(() => simulateSharpness(form.photoFileName, form.photoFileSizeKb), [form.photoFileName, form.photoFileSizeKb]);
  const bankNeed = MIN_BANK_BALANCE[form.countryIso];
  const previewCode = buildClientCode(
    form.countryIso,
    form.visaCode,
    new Date().getFullYear(),
    nextSequence[`${form.countryIso}-${form.visaCode}`] ?? 1,
  );
  const passRate = Math.round((live.checks.filter((c) => c.passed).length / Math.max(live.checks.length, 1)) * 100);
  const country = COUNTRIES.find((c) => c.iso3 === form.countryIso);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as SubmitResponse;
      setResult(data);
      if (data.status === "accepted") setStep(4);
    } catch {
      setResult({ status: "error", error: "নেটওয়ার্ক ত্রুটি — পুনরায় চেষ্টা করুন" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <Reveal dir="left">
        <div className="card p-4 sm:p-6">
          <div className="kb-scroll flex gap-2 overflow-x-auto pb-1">
            {STEPS.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                className={`shrink-0 rounded-xl border px-3 py-2 text-[11px] font-bold transition-all ${
                  step === index
                    ? "border-accent2 bg-accentsoft text-accent"
                    : step > index
                      ? "border-tealx/40 bg-tealsoft text-tealx"
                      : "border-line bg-surface2 text-mute"
                }`}
              >
                {index + 1}. {label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {step === 0 ? (
              <>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[11.5px] font-bold text-ink">পূর্ণ নাম (পাসপোর্ট অনুযায়ী)</label>
                  <input className="field" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="মোঃ জাহিদুল হাসান" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] font-bold text-ink">পাসপোর্ট নম্বর</label>
                  <input className="field mono uppercase" value={form.passportNo} onChange={(e) => update("passportNo", e.target.value)} placeholder="BP0912345" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] font-bold text-ink">পাসপোর্টের মেয়াদ শেষ (MRZ)</label>
                  <input type="date" className="field" value={form.passportExpiry} onChange={(e) => update("passportExpiry", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] font-bold text-ink">মোবাইল নম্বর</label>
                  <input className="field" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+880 1711-000000" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] font-bold text-ink">ইমেইল ঠিকানা</label>
                  <input className="field" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="client@example.com" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] font-bold text-ink">বয়স</label>
                  <input type="number" className="field" value={form.age} onChange={(e) => update("age", Number(e.target.value))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] font-bold text-ink">কাজের দক্ষতা / পেশা</label>
                  <select className="field" value={form.skill} onChange={(e) => update("skill", e.target.value)}>
                    {SKILLS.map((skill) => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <div>
                  <label className="mb-1.5 block text-[11.5px] font-bold text-ink">কাঙ্ক্ষিত গন্তব্য দেশ</label>
                  <select className="field" value={form.countryIso} onChange={(e) => update("countryIso", e.target.value)}>
                    {COUNTRIES.map((c) => (
                      <option key={c.iso3} value={c.iso3}>
                        {c.flag} {c.nameBn} ({c.iso3})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] font-bold text-ink">ভিসা শ্রেণি</label>
                  <select className="field" value={form.visaCode} onChange={(e) => update("visaCode", e.target.value)}>
                    <option value="WRK">WRK — ওয়ার্ক ভিসা</option>
                    <option value="VIS">VIS — ভিজিটর ভিসা</option>
                    <option value="SLF">SLF — সেলফ-স্পন্সরশিপ</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] font-bold text-ink">ছবির ফাইলনেম (CV ইঞ্জিন ইনপুট)</label>
                  <input className="field mono" value={form.photoFileName} onChange={(e) => update("photoFileName", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] font-bold text-ink">ছবির ফাইল সাইজ (KB)</label>
                  <input type="number" className="field" value={form.photoFileSizeKb} onChange={(e) => update("photoFileSizeKb", Number(e.target.value))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] font-bold text-ink">ছবির প্রস্থ (মিমি)</label>
                  <input type="number" className="field" value={form.photoWidthMm} onChange={(e) => update("photoWidthMm", Number(e.target.value))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] font-bold text-ink">ছবির উচ্চতা (মিমি)</label>
                  <input type="number" className="field" value={form.photoHeightMm} onChange={(e) => update("photoHeightMm", Number(e.target.value))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] font-bold text-ink">ফেসিয়াল এরিয়া কাভারেজ (%)</label>
                  <input type="number" className="field" value={form.faceCoveragePercent} onChange={(e) => update("faceCoveragePercent", Number(e.target.value))} />
                </div>
                <div className="flex items-center gap-2.5 pt-6">
                  <input
                    id="bgwhite"
                    type="checkbox"
                    checked={form.photoBackgroundWhite}
                    onChange={(e) => update("photoBackgroundWhite", e.target.checked)}
                    className="h-4 w-4 accent-[#d99a0c]"
                  />
                  <label htmlFor="bgwhite" className="text-[12px] text-mute">
                    ব্যাকগ্রাউন্ড সাদা (ICAO স্যাচুরেশন পাস)
                  </label>
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <div>
                  <label className="mb-1.5 block text-[11.5px] font-bold text-ink">পুলিশ ক্লিয়ারেন্স ইস্যু তারিখ</label>
                  <input type="date" className="field" value={form.policeClearanceDate} onChange={(e) => update("policeClearanceDate", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] font-bold text-ink">ব্যাংক স্টেটমেন্ট সময়কাল (মাস)</label>
                  <input type="number" className="field" value={form.bankStatementMonths} onChange={(e) => update("bankStatementMonths", Number(e.target.value))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[11.5px] font-bold text-ink">
                    ছয় মাসের গড় ব্যালেন্স ({bankNeed?.currency ?? "USD"} — নির্দেশক থ্রেশহোল্ড {bankNeed?.amount.toLocaleString("en-US") ?? "—"})
                  </label>
                  <input type="number" className="field" value={form.bankAverageBalance} onChange={(e) => update("bankAverageBalance", Number(e.target.value))} />
                </div>
                <div className="soft p-4 sm:col-span-2">
                  <p className="text-[11.5px] leading-relaxed text-mute">
                    ঘোষণা: আপলোডকৃত প্রতিটি নথি প্রকৃত এবং সংশ্লিষ্ট কর্তৃপক্ষ কর্তৃক ইস্যুকৃত। মিথ্যা তথ্য প্রমাণিত হলে ফাইল
                    তাৎক্ষণিকভাবে ব্ল্যাকলিস্ট ও দূতাবাস অ্যালার্টের আওতায় আসবে।
                  </p>
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <div className="sm:col-span-2">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {[
                    ["নাম", form.fullName || "—"],
                    ["পাসপোর্ট", form.passportNo || "—"],
                    ["পাসপোর্টের মেয়াদ", form.passportExpiry || "—"],
                    ["বয়স / দক্ষতা", `${form.age} · ${form.skill}`],
                    ["গন্তব্য", `${country?.flag ?? ""} ${form.countryIso} · ${form.visaCode}`],
                    ["যোগাযোগ", form.phone || "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="soft px-3 py-2">
                      <p className="text-[10.5px] font-bold tracking-wide text-mute uppercase">{label}</p>
                      <p className="mono text-[12.5px] text-ink">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-2xl border border-accent2 bg-accentsoft p-4">
                  <p className="text-[11.5px] text-mute">প্রস্তাবিত ইউনিক ক্লায়েন্ট আইডি (সাবমিশন মুহূর্তে লক হবে)</p>
                  <p className="mono mt-1 text-lg font-bold text-accent">{previewCode}</p>
                  <p className="mt-1 text-[11px] text-mute">
                    ফরম্যাট: WVC-[দেশ]-[ভিসা]-[সাল]-[ক্রমিক] · {country?.adminPortal}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep((s) => Math.max(s - 1, 0))} className="btn">
                ← পূর্ববর্তী
              </button>
              {step < 3 ? (
                <button type="button" onClick={() => setStep((s) => Math.min(s + 1, 3))} className="btn btn-brand">
                  পরবর্তী →
                </button>
              ) : null}
              {step === 4 ? (
                <button type="button" onClick={() => setStep(0)} className="btn">
                  নতুন ফাইল শুরু
                </button>
              ) : null}
            </div>
            {step === 3 ? (
              <button type="button" onClick={submit} disabled={busy} className="btn btn-primary animate-ring disabled:opacity-60">
                {busy ? "ভ্যালিডেশন চলছে…" : "প্রি-ভ্যালিডেশন চালিয়ে ফাইল জমা দিন"}
              </button>
            ) : null}
          </div>
        </div>
      </Reveal>

      <Reveal dir="right" delay={70} className="grid gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">লাইভ ভ্যালিডেশন ইঞ্জিন</p>
            <Badge tone={live.overallPass ? "teal" : "red"}>{live.overallPass ? "অনুমোদনযোগ্য" : "ব্লকড"}</Badge>
          </div>
          <div className="mt-3">
            <ProgressRing value={passRate} label={`${live.checks.filter((c) => c.passed).length} / ${live.checks.length} ফিল্টার পাস · প্রতিটি নথির মাপা মান নিচে দেখানো হয়েছে`} />
          </div>
          <div className="mt-3 grid gap-2">
            {live.checks.map((check) => (
              <div key={check.docType} className="soft p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-bold text-ink">{check.docType}</p>
                  <Badge tone={check.passed ? "teal" : check.severity === "block" ? "red" : "gold"}>
                    {check.passed ? "পাস" : check.severity === "block" ? "ব্লক" : "সতর্ক"}
                  </Badge>
                </div>
                <p className="mono mt-1 text-[10px] text-mute">{check.parameter}</p>
                <p className="mono mt-1 text-[10.5px] text-accent">{check.measuredValue}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-mute">{check.verdict}</p>
              </div>
            ))}
          </div>
          <div className="mono mt-3 rounded-2xl border border-line bg-surface2 p-3 text-[10.5px] text-mute">
            CV সিমুলেশন: Laplacian Variance σ² = {sharpness} (থ্রেশহোল্ড ≥ ১০০) · ফাইল {form.photoFileSizeKb} KB · পাসপোর্ট বৈধতা{" "}
            {live.passportValidityDays} দিন
          </div>
        </div>

        {result ? (
          <div className={`card border-2 p-4 ${result.status === "accepted" ? "!border-tealx/60" : "!border-danger/50"}`}>
            <p className="text-[10px] font-bold tracking-[0.22em] text-mute uppercase">সাবমিশন রেসপন্স</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink">
              {result.status === "accepted"
                ? "ফাইল গৃহীত হয়েছে ও পাইপলাইনে নথিভুক্ত হয়েছে।"
                : (result.message ?? result.error ?? "ফাইল প্রক্রিয়া করা যায়নি")}
            </p>
            {result.status === "accepted" ? (
              <div className="mt-3 grid gap-2 text-[11.5px] text-mute">
                <p>
                  ইউনিক ক্লায়েন্ট আইডি: <span className="mono font-bold text-accent">{result.clientCode}</span>
                </p>
                <p>
                  অ্যাডভান্স ইনভয়েস: <span className="mono text-ink">{result.invoiceNo}</span>
                </p>
                <p>
                  প্রাপ্ত অ্যাডভান্স: <span className="mono text-ink">৳{result.advancePaid?.toLocaleString("en-US")}</span> (bKash API সিঙ্ক)
                </p>
                {result.emailPreview ? <p className="mono text-[10.5px] text-tealx">✉ {result.emailPreview.subject}</p> : null}
                <div className="flex flex-wrap gap-1.5">
                  <Chip tone="brand">পরবর্তী: ০৯:০০ BST স্লট স্ক্যান</Chip>
                  <Chip tone="accent">ডকুমেন্ট ভেরিফিকেশন চলমান</Chip>
                </div>
              </div>
            ) : (
              <div className="mt-3 grid gap-1.5">
                {(result.blockers ?? []).map((blocker) => (
                  <p key={blocker} className="mono text-[11px] text-danger">
                    ▸ {blocker}
                  </p>
                ))}
              </div>
            )}
            {result.emailPreview ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-white">
                <iframe title="onboarding-email" srcDoc={result.emailPreview.html} className="h-[360px] w-full border-0" sandbox="" />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="card p-4">
          <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">ধাপভিত্তিক অগ্রগতি</p>
          <div className="mt-3 grid gap-2">
            {STEPS.map((label, index) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className={`mono grid h-6 w-6 place-items-center rounded-lg text-[10px] font-bold ${step > index ? "bg-tealsoft text-tealx" : step === index ? "bg-accentsoft text-accent" : "bg-surface2 text-mute"}`}>
                  {index + 1}
                </span>
                <p className="flex-1 text-[11.5px] text-mute">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Bar value={((step + 1) / 4) * 100} tone="accent" />
          </div>
        </div>
      </Reveal>
    </div>
  );
}
