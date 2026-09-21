"use client";

import { useEffect, useState } from "react";
import { Badge, Chip, Reveal } from "./ui";
import { BRAND } from "@/lib/reference-data";

interface TriggerDef {
  key: string;
  labelBn: string;
  subject: string;
  recipient: string;
  timingBn: string;
  variables: readonly string[];
  logic: string;
}

interface EmailPreview {
  subject: string;
  html: string;
  recipientKind: string;
  triggerType: string;
  sender: string;
}

interface EmailRow {
  id: string;
  recipientEmail: string;
  subject: string;
  triggerType: string;
  sentStatus: boolean;
  sentAt: string;
}

export function EmailGallery({
  triggers,
  feed,
}: {
  triggers: readonly TriggerDef[];
  feed: EmailRow[];
}) {
  const [activeKey, setActiveKey] = useState(triggers[0]?.key ?? "onboarding_welcome");
  const [preview, setPreview] = useState<EmailPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "source">("preview");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        triggerType: activeKey,
        context: {
          clientId: "WVC-SRB-WRK-2026-0001",
          clientName: "মোঃ জাহিদুল হাসান",
          jobCategory: "Welder (6G)",
          countryBn: "সার্বিয়া",
          visaBn: "ওয়ার্ক ভিসা",
          employerName: "Belgrade Metal Works DOO",
          govCode: "SRB-4821037-WRK",
          commission: "10,000",
          weekLabel: "সপ্তাহ ৩২ · ২০২৬",
          decision: "ভিসা অনুমোদিত",
          flightDate: "১২ জুন ২০২৬",
          pnr: "PNR700029",
          airline: "Turkish Airlines",
          inProgress: 12,
          deployedWorkers: 6,
        },
      }),
    })
      .then((res) => res.json())
      .then((data: EmailPreview) => {
        if (!cancelled) setPreview(data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeKey]);

  const currentDef = triggers.find((t) => t.key === activeKey);

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <Reveal dir="left" className="grid gap-2.5">
        {triggers.map((trigger) => {
          const isActive = trigger.key === activeKey;
          return (
            <button
              key={trigger.key}
              type="button"
              onClick={() => setActiveKey(trigger.key)}
              className={`card card-hover p-3.5 text-left ${isActive ? "!border-accent2" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12.5px] font-bold text-ink">{trigger.labelBn}</p>
                <Badge tone={isActive ? "gold" : "slate"}>{trigger.recipient}</Badge>
              </div>
              <p className="mono mt-1.5 text-[10.5px] leading-relaxed break-words text-mute">{trigger.subject}</p>
              <p className="mt-1.5 text-[11px] text-accent">⏱ {trigger.timingBn}</p>
            </button>
          );
        })}
      </Reveal>

      <Reveal dir="right" delay={70} className="grid gap-4">
        <div className="card p-3.5 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">রেন্ডার করা সাবজেক্ট</p>
              <p className="mono mt-1 text-[12px] break-words text-ink">{preview?.subject ?? "লোড হচ্ছে…"}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="teal">{BRAND.email}</Badge>
              <Badge tone="navy">Inline CSS v1</Badge>
            </div>
          </div>

          {currentDef ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {currentDef.variables.map((variable) => (
                <Chip key={variable}>{`{{${variable}}}`}</Chip>
              ))}
            </div>
          ) : null}

          <div className="mt-3 flex gap-1.5">
            {(["preview", "source"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold ${
                  viewMode === mode ? "border-accent2 bg-accentsoft text-accent" : "border-line bg-surface2 text-mute"
                }`}
              >
                {mode === "preview" ? "ভিজ্যুয়াল প্রিভিউ" : "HTML সোর্স"}
              </button>
            ))}
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-white">
            {loading && !preview ? (
              <div className="grid h-[520px] place-items-center bg-surface2 text-[12px] text-mute">টেমপ্লেট রেন্ডার হচ্ছে…</div>
            ) : viewMode === "preview" ? (
              <iframe title={`email-${activeKey}`} srcDoc={preview?.html ?? ""} className="h-[560px] w-full border-0 bg-white" sandbox="" />
            ) : (
              <pre
                data-native-scroll
                className="mono kb-scroll h-[560px] overflow-auto bg-[#0b2033] p-4 text-[10.5px] leading-relaxed text-[#c7e3f5]"
              >
                {preview?.html ?? ""}
              </pre>
            )}
          </div>
          <p className="body-text mt-3 text-[11.5px]">{currentDef?.logic}</p>
        </div>

        <div className="card p-3.5 sm:p-5">
          <p className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">লাইভ ডিসপ্যাচ লগ</p>
          <div className="mt-3 grid max-h-[280px] gap-2 overflow-y-auto pr-1" data-native-scroll>
            {feed.slice(0, 14).map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface2 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[11.5px] text-ink">{row.subject}</p>
                  <p className="mono text-[10px] text-mute">
                    {row.recipientEmail} · {row.triggerType} · {new Date(row.sentAt).toLocaleString("en-GB")}
                  </p>
                </div>
                <Badge tone={row.sentStatus ? "teal" : "red"}>{row.sentStatus ? "প্রেরিত" : "ব্যর্থ"}</Badge>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
