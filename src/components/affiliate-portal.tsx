"use client";

import { useEffect, useState } from "react";
import { Badge, Bar, Chip, Reveal, StatTile } from "./ui";
import { STAGE_COLUMNS } from "@/lib/reference-data";

interface AffiliateSummary {
  id: string;
  agentName: string;
  district: string;
  upazila: string;
  phone: string;
  referralCode: string;
  walletBalance: number;
  totalEarned: number;
}

interface Referral {
  id: string;
  clientCode: string;
  fullName: string;
  stage: string;
  countryIso: string;
  visaCode: string;
  contractValue: number;
  createdAt: string;
}

interface LedgerRow {
  id: string;
  visaCode: string;
  amount: number;
  note: string;
  createdAt: string;
}

interface WithdrawalRow {
  id: string;
  amount: string;
  method: string;
  status: string;
  createdAt: string;
}

const COMMISSION_TABLE = [
  { visa: "ওয়ার্ক ভিসা (WRK)", amount: "১০,০০০ ৳", note: "সরকারি পোর্টাল সাবমিশন থেকে ভিসা অনুমোদন পর্যন্ত" },
  { visa: "ভিজিটর ভিসা (VIS)", amount: "৩,০০০ ৳", note: "কনস্যুলার সাবমিশন ও স্ট্যাম্পিং সম্পন্ন হলে" },
  { visa: "সেলফ-স্পন্সরশিপ (SLF)", amount: "১৫,০০০ ৳", note: "রেসিডেন্স পারমিট ইস্যুর পর" },
];

export function AffiliatePortal({ directory }: { directory: AffiliateSummary[] }) {
  const [activeId, setActiveId] = useState(directory[0]?.id ?? "");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [affiliate, setAffiliate] = useState<AffiliateSummary | undefined>(directory[0]);
  const [amount, setAmount] = useState(5000);
  const [method, setMethod] = useState<"bKash" | "Nagad" | "Bank">("bKash");
  const [accountRef, setAccountRef] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stageFilter, setStageFilter] = useState("all");

  useEffect(() => {
    if (!activeId) return;
    fetch(`/api/affiliates?id=${activeId}`)
      .then((res) => res.json())
      .then((data) => {
        setAffiliate(data.affiliate);
        setReferrals(data.referrals ?? []);
        setLedger(data.ledger ?? []);
        setWithdrawals(data.withdrawals ?? []);
        setAccountRef(data.affiliate?.phone ?? "");
      })
      .catch(() => undefined);
  }, [activeId]);

  const referralLink = `https://visamotion365.com/onboard?ref=${affiliate?.referralCode ?? ""}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const requestWithdrawal = async () => {
    if (!affiliate) return;
    setBusy(true);
    try {
      const res = await fetch("/api/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId: affiliate.id, amount, method, accountRef }),
      });
      const data = (await res.json()) as { message?: string; error?: string; remainingBalance?: number };
      setFlash(data.message ?? data.error ?? "রিকোয়েস্ট প্রসেস করা যায়নি");
      if (typeof data.remainingBalance === "number") {
        setAffiliate({ ...affiliate, walletBalance: data.remainingBalance });
        const refreshed = await fetch(`/api/affiliates?id=${affiliate.id}`).then((r) => r.json());
        setWithdrawals(refreshed.withdrawals ?? []);
      }
      window.setTimeout(() => setFlash(null), 5200);
    } catch {
      setFlash("উইথড্রয়াল রিকোয়েস্ট পাঠানো যায়নি");
    } finally {
      setBusy(false);
    }
  };

  const visibleReferrals = referrals.filter((r) => stageFilter === "all" || r.stage === stageFilter);

  return (
    <div className="grid gap-6">
      <Reveal>
        <div className="card kb-scroll flex gap-2 overflow-x-auto p-3" data-native-scroll>
          {directory.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => setActiveId(agent.id)}
              className={`min-w-[196px] rounded-2xl border p-3 text-left transition-all ${
                agent.id === activeId ? "border-accent2 bg-accentsoft" : "border-line bg-surface2"
              }`}
            >
              <p className="text-[12px] font-bold text-ink">{agent.agentName}</p>
              <p className="mono mt-0.5 text-[10px] text-mute">
                {agent.district} · {agent.referralCode}
              </p>
              <p className="mono mt-1 text-[12px] font-bold text-accent">৳{agent.walletBalance.toLocaleString("en-US")}</p>
            </button>
          ))}
        </div>
      </Reveal>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="ওয়ালেট ব্যালেন্স" value={`৳${(affiliate?.walletBalance ?? 0).toLocaleString("en-US")}`} tone="accent" hint="অন-ডিমান্ড উইথড্রয়ালের জন্য উপলব্ধ" />
        <StatTile label="মোট অর্জিত কমিশন" value={`৳${(affiliate?.totalEarned ?? 0).toLocaleString("en-US")}`} tone="teal" hint="লাইফটাইম কমিশন লেজার" />
        <StatTile label="রেফার করা ফাইল" value={referrals.length.toLocaleString("en-US")} tone="brand" hint="ট্র্যাকিং আইডিসহ পাইপলাইন" />
        <StatTile
          label="ভিসা অনুমোদিত"
          value={referrals.filter((r) => ["Visa_Approved", "Flight_Deployed"].includes(r.stage)).length.toLocaleString("en-US")}
          tone="teal"
          hint="কমিশন স্বয়ংক্রিয়ভাবে জমা হয়েছে"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <Reveal dir="left">
          <div className="card p-4 sm:p-5">
            <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">রেফারেল ও পাইপলাইন ট্র্যাকিং</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="mono min-w-0 flex-1 truncate rounded-xl border border-line bg-surface2 px-3 py-2 text-[10.5px] text-tealx">{referralLink}</code>
              <button type="button" onClick={copyLink} className="btn !py-2 text-[11px]">
                {copied ? "কপি হয়েছে ✓" : "লিংক কপি"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setStageFilter("all")}
                className={`rounded-xl border px-2.5 py-1.5 text-[10.5px] font-bold ${stageFilter === "all" ? "border-accent2 bg-accentsoft text-accent" : "border-line bg-surface2 text-mute"}`}
              >
                সব ধাপ
              </button>
              {STAGE_COLUMNS.slice(0, 5).map((column) => (
                <button
                  key={column.key}
                  type="button"
                  onClick={() => setStageFilter(column.key)}
                  className={`rounded-xl border px-2.5 py-1.5 text-[10.5px] font-bold ${
                    stageFilter === column.key ? "border-accent2 bg-accentsoft text-accent" : "border-line bg-surface2 text-mute"
                  }`}
                >
                  {column.labelBn.split(" ").slice(1).join(" ")}
                </button>
              ))}
            </div>

            <div className="mt-3 grid gap-2">
              {visibleReferrals.map((referral) => {
                const stageIndex = STAGE_COLUMNS.findIndex((c) => c.key === referral.stage);
                return (
                  <div key={referral.id} className="soft p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="mono text-[10.5px] text-accent">{referral.clientCode}</p>
                        <p className="truncate text-[12px] font-bold text-ink">{referral.fullName}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge tone="navy">{referral.visaCode}</Badge>
                        <Badge tone={referral.stage === "Rejected" ? "red" : referral.stage === "Flight_Deployed" ? "teal" : "gold"}>
                          {STAGE_COLUMNS.find((c) => c.key === referral.stage)?.labelBn ?? "প্রত্যাখ্যাত"}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Bar value={referral.stage === "Rejected" ? 100 : ((stageIndex + 1) / 7) * 100} tone={referral.stage === "Rejected" ? "accent" : "teal"} />
                    </div>
                    <p className="mono mt-1.5 text-[10px] text-mute">
                      চুক্তিমূল্য ৳{referral.contractValue.toLocaleString("en-US")} · নিবন্ধন {new Date(referral.createdAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                );
              })}
              {visibleReferrals.length === 0 ? (
                <p className="soft p-4 text-[11.5px] text-mute">এই ধাপে কোনো রেফারেল ফাইল নেই।</p>
              ) : null}
            </div>
          </div>
        </Reveal>

        <Reveal dir="right" delay={70} className="grid gap-4">
          <div className="card p-4 sm:p-5">
            <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">স্বয়ংক্রিয় কমিশন হিসাবরক্ষণ</p>
            <div className="mt-3 grid gap-2">
              {COMMISSION_TABLE.map((row) => (
                <div key={row.visa} className="soft flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                  <div>
                    <p className="text-[11.5px] font-bold text-ink">{row.visa}</p>
                    <p className="text-[10px] text-mute">{row.note}</p>
                  </div>
                  <p className="mono text-[12px] font-bold text-accent">{row.amount}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid max-h-[200px] gap-1.5 overflow-y-auto pr-1" data-native-scroll>
              {ledger.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-tealx/30 bg-tealsoft px-3 py-2">
                  <p className="text-[11px] text-ink">{entry.note}</p>
                  <p className="mono text-[10px] text-tealx">
                    + ৳{entry.amount.toLocaleString("en-US")} · {entry.visaCode} · {new Date(entry.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">উইথড্রয়াল রিকোয়েস্ট ইঞ্জিন</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-ink">পরিমাণ (৳)</label>
                <input type="number" className="field" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-ink">পেআউট মেথড</label>
                <select className="field" value={method} onChange={(e) => setMethod(e.target.value as "bKash" | "Nagad" | "Bank")}>
                  <option value="bKash">বিকাশ (bKash)</option>
                  <option value="Nagad">নগদ (Nagad)</option>
                  <option value="Bank">ব্যাংক ট্রান্সফার</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[11px] font-bold text-ink">অ্যাকাউন্ট রেফারেন্স</label>
                <input className="field" value={accountRef} onChange={(e) => setAccountRef(e.target.value)} placeholder="+880 1711-223344" />
              </div>
            </div>
            <button type="button" onClick={requestWithdrawal} disabled={busy} className="btn btn-primary mt-3 w-full disabled:opacity-60">
              {busy ? "রিকোয়েস্ট পাঠানো হচ্ছে…" : "উইথড্রয়াল রিকোয়েস্ট পাঠান"}
            </button>
            {flash ? <p className="mt-3 rounded-2xl border border-tealx/40 bg-tealsoft p-3 text-[11px] text-tealx">{flash}</p> : null}
            <div className="mt-3 grid gap-1.5">
              {withdrawals.slice(0, 5).map((row) => (
                <div key={row.id} className="soft flex items-center justify-between px-3 py-2">
                  <p className="mono text-[10.5px] text-ink">
                    ৳{Number(row.amount).toLocaleString("en-US")} · {row.method}
                  </p>
                  <Badge tone={row.status === "Approved" ? "teal" : row.status === "Rejected" ? "red" : "gold"}>
                    {row.status === "Approved" ? "অনুমোদিত" : row.status === "Rejected" ? "প্রত্যাখ্যাত" : "পেন্ডিং"}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Chip tone="brand">বিকাশ / নগদ সেটেলমেন্ট</Chip>
              <Chip tone="accent">অ্যাডমিন অনুমোদন প্রয়োজন</Chip>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
