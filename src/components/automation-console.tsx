"use client";

import { useState } from "react";
import { Badge, Chip, Reveal, StatTile } from "./ui";
import { AUTOMATION_SCHEDULE } from "@/lib/reference-data";

interface JobRow {
  id: string;
  jobType: string;
  countryIso: string;
  scheduledSlot: string;
  status: string;
  slotsFound: number;
  clientsProcessed: number;
  resultMessage: string;
  startedAt: string;
}

interface CycleSummary {
  slot: string;
  jobsCreated: number;
  stagesAdvanced: number;
  emailsDispatched: number;
  commissionsCredited: number;
  commissionAmount: number;
  slotsLocked: number;
  slaAlerts: number;
  log: string[];
}

interface Snapshot {
  automationJobs: number;
  emailsDispatched: number;
  validationPassRate: number;
  approved: number;
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

const JOB_LABELS: Record<string, string> = {
  appointment_scan: "অ্যাপয়েন্টমেন্ট স্লট স্ক্যান",
  status_scrape: "ভিসা স্ট্যাটাস স্ক্র্যাপ",
};

export function AutomationConsole({
  initialFeed,
  snapshot,
  compact = false,
}: {
  initialFeed: JobRow[];
  snapshot: Snapshot;
  compact?: boolean;
}) {
  const [feed, setFeed] = useState(initialFeed);
  const [summary, setSummary] = useState<CycleSummary | null>(null);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState(snapshot);
  const [console_, setConsole] = useState<string[]>([
    "[INIT] Playwright হেডলেস ক্লাস্টার প্রস্তুত — ৮ দেশের সেশন প্রোফাইল লোড হয়েছে",
    "[READY] প্রক্সি পুল সক্রিয়: ডাইনামিক আইপি রোটেশন ও কুকি আইসোলেশন সক্রিয়",
  ]);

  const runCycle = async (slot: string) => {
    setRunning(true);
    setConsole((prev) => [`[RUN] ${slot} সাইকেল শুরু — পোর্টাল সেশন লোড হচ্ছে…`, ...prev].slice(0, 40));
    try {
      const res = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot }),
      });
      const data = (await res.json()) as { summary: CycleSummary; feed: JobRow[]; snapshot: Snapshot };
      setSummary(data.summary);
      setFeed(data.feed);
      setStats(data.snapshot);
      setConsole((prev) =>
        [
          ...data.summary.log.map((line: string) => `[OK] ${line}`),
          `[DONE] ${data.summary.jobsCreated} জব · ${data.summary.emailsDispatched} ইমেইল · ${data.summary.slotsLocked} স্লট`,
          ...prev,
        ].slice(0, 40),
      );
    } catch {
      setConsole((prev) => ["[ERR] সাইকেল ব্যর্থ — নেটওয়ার্ক ত্রুটি", ...prev].slice(0, 40));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="মোট অটোমেশন জব" value={stats.automationJobs.toLocaleString("en-US")} tone="brand" hint="হেডলেস এক্সিকিউশন অডিট ট্রেইল" />
        <StatTile label="ডিসপ্যাচ ইমেইল" value={stats.emailsDispatched.toLocaleString("en-US")} tone="accent" hint="আটটি ট্রানজ্যাকশনাল ট্রিগার" />
        <StatTile label="ভ্যালিডেশন পাস রেট" value={`${stats.validationPassRate}%`} tone="teal" hint="OCR + CV + QR অডিট" />
        <StatTile label="ভিসা অনুমোদিত" value={stats.approved.toLocaleString("en-US")} tone="accent" hint="স্ট্যাম্পিং ও ডেলিভারি সম্পন্ন" />
      </div>

      <Reveal>
        <div className="card p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-[10px] font-bold tracking-[0.24em] text-accent uppercase">ব্রাউজার এআই এজেন্ট অর্কেস্ট্রেটর</p>
              <h3 className="h3 mt-2 text-ink">Playwright হেডলেস ক্লাস্টার — আট দেশের পোর্টালে সমান্তরাল থ্রেড</h3>
              <p className="body-text mt-2">
                প্রতিটি সাইকেলে এজেন্ট আট দেশের কনস্যুলার ও সরকারি পোর্টালে সেশন কুকি আইসোলেশন ও ডাইনামিক আইপি রোটেশন
                ব্যবহার করে DOM মিউটেশন স্ক্যান চালায়, ওয়ার্ক পারমিট সাবমিট করে, স্লট লক করে এবং ফাইল অগ্রগতি
                সিআরএমে সিঙ্ক করে।
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["০৯:০০ BST", "১৪:০০ BST", "২১:০০ BST"].map((slot) => (
                <button
                  key={slot}
                  type="button"
                  disabled={running}
                  onClick={() => runCycle(slot)}
                  className="btn btn-primary animate-ring disabled:opacity-60"
                >
                  {running ? "এজেন্ট চলছে…" : `সাইকেল চালান ${slot}`}
                </button>
              ))}
            </div>
          </div>

          {!compact ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {AUTOMATION_SCHEDULE.map((task) => (
                <div key={task.task} className="soft p-3.5">
                  <p className="text-[12.5px] font-bold text-ink">{task.task}</p>
                  <p className="mono mt-1.5 text-[10.5px] text-accent">{task.trigger}</p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-mute">{task.mechanism}</p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-tealx">→ {task.outcome}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mono mt-4 h-[190px] overflow-y-auto rounded-2xl border border-line bg-[#081d2e] p-3.5 text-[10.5px] leading-relaxed text-[#a9d6ef]" data-native-scroll>
            {console_.map((line, index) => (
              <p key={`${line}-${index}`} className="whitespace-pre-wrap">
                {line}
              </p>
            ))}
            {running ? <p className="animate-pulse-soft mt-1 text-[#f7c145]">▌ এজেন্ট প্রতিক্রিয়ার অপেক্ষায়…</p> : null}
          </div>

          {summary ? (
            <div className="mt-4 rounded-2xl border border-tealx/40 bg-tealsoft p-3.5">
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="teal">সাইকেল সম্পন্ন · {summary.slot}</Chip>
                <Chip tone="accent">{summary.jobsCreated} জব</Chip>
                <Chip tone="brand">{summary.stagesAdvanced} ফাইল অগ্রসর</Chip>
                <Chip tone="accent">{summary.slotsLocked} স্লট লক</Chip>
                <Chip tone="teal">{summary.emailsDispatched} ইমেইল</Chip>
                <Chip tone="danger">{summary.slaAlerts} নতুন SLA অ্যালার্ম</Chip>
                {summary.commissionAmount > 0 ? <Chip tone="accent">কমিশন ৳{summary.commissionAmount.toLocaleString("en-US")}</Chip> : null}
              </div>
            </div>
          ) : null}
        </div>
      </Reveal>

      <Reveal dir="zoom">
        <div className="card p-4 sm:p-6">
          <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">এক্সিকিউশন অডিট ট্রেইল (automation_jobs টেবিল)</p>
          <div className="mt-3 grid gap-2">
            {feed.map((job) => (
              <div key={job.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-surface2 p-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="text-lg">{FLAGS[job.countryIso] ?? "🌐"}</span>
                  <div className="min-w-0">
                    <p className="mono text-[11px] text-ink">
                      {JOB_LABELS[job.jobType] ?? job.jobType} · {job.countryIso} · {job.scheduledSlot}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-mute">{job.resultMessage}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {job.slotsFound > 0 ? <Badge tone="gold">{job.slotsFound} স্লট</Badge> : null}
                  {job.clientsProcessed > 0 ? <Badge tone="navy">{job.clientsProcessed} ফাইল</Badge> : null}
                  <Badge tone={job.status === "success" ? "teal" : job.status === "warning" ? "gold" : "red"}>
                    {job.status === "success" ? "সফল" : job.status === "warning" ? "সতর্কতা" : "ব্যর্থ"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
