import Link from "next/link";
import { ensureSeeded } from "@/lib/seed";
import { getAdminConsoleData, getPlatformSnapshot } from "@/lib/automation";
import { BottomNav, Breadcrumbs, PageHero, SiteFooter, TopNav } from "@/components/site-shell";
import { Bar, Chip, ProgressRing, Reveal, SectionTitle, StatTile } from "@/components/ui";
import { OPERATIONAL_DOCTRINE, REJECTED_STAGE, STAGE_COLUMNS } from "@/lib/reference-data";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  await ensureSeeded();
  const [consoleData, snapshot] = await Promise.all([getAdminConsoleData(), getPlatformSnapshot()]);
  const rows = consoleData.clients;
  const breaches = rows.filter((r) => r.slaBreach);

  return (
    <div className="min-h-screen bg-app pb-20 lg:pb-0">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <Breadcrumbs trail={[{ label: "হোম", href: "/" }, { label: "পাইপলাইন ও SLA" }]} />
      </div>
      <PageHero
        eyebrow="পাইপলাইন ও SLA মনিটরিং"
        title="সাত ধাপের ফাইল প্রবাহ, স্থবিরতা অ্যালার্ম ও ঝুঁকি বিশ্লেষণ"
        subtitle="প্রতিটি ফাইল সাতটি বাধ্যতামূলক ধাপের মধ্য দিয়ে অগ্রসর হয় — কোনো ধাপ স্কিপ করা যায় না এবং প্রতিটি পরিবর্তনের টাইমস্ট্যাম্প অডিটেবল। কোনো ফাইল টানা ৭ কার্যদিবস নিষ্ক্রিয় থাকলে ইন্টেলিজেন্ট SLA অ্যালার্ম জেনারেট হয় এবং সুপারভাইজারের কাছে এস্কেলেশন নোটিশ যায়।"
      >
        <div className="flex flex-wrap gap-1.5">
          <Chip tone="accent">মোট ফাইল {rows.length}</Chip>
          <Chip tone="danger">সক্রিয় SLA অ্যালার্ম {breaches.length}</Chip>
          <Chip tone="teal">ভিসা অনুমোদিত {snapshot.approved}</Chip>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="গড় স্থবিরতা (কার্যদিবস)" value={rows.length ? Math.round(rows.reduce((s, r) => s + r.stalledDays, 0) / rows.length) : 0} tone="accent" />
          <StatTile label="৭+ দিন স্থবির" value={breaches.length} tone="danger" hint="লাল অ্যালার্ম ব্যাজ সক্রিয়" />
          <StatTile label="ডকুমেন্ট ভেরিফায়েড" value={rows.filter((r) => r.docsVerified).length} tone="teal" />
          <StatTile label="ভ্যালিডেশন পাস রেট" value={`${snapshot.validationPassRate}%`} tone="brand" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <Reveal dir="left">
            <div className="card h-full p-4 sm:p-5">
              <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">ধাপভিত্তিক ফাইল বিতরণ</p>
              <div className="mt-4 grid gap-3">
                {[...STAGE_COLUMNS, REJECTED_STAGE].map((column) => {
                  const count = rows.filter((r) => r.stage === column.key).length;
                  const breach = rows.filter((r) => r.stage === column.key && r.slaBreach).length;
                  return (
                    <div key={column.key}>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
                        <span className="text-mute">{column.labelBn}</span>
                        <span className="mono text-ink">
                          {count} ফাইল {breach > 0 ? <span className="ml-2 text-danger">· {breach} স্থবির</span> : null}
                        </span>
                      </div>
                      <div className="mt-1">
                        <Bar value={count} max={Math.max(rows.length, 1)} tone={column.key === "Rejected" ? "accent" : "brand"} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4">
                <ProgressRing value={rows.length ? Math.round(((rows.length - breaches.length) / rows.length) * 100) : 100} label="ফাইল সময়সূচিতে চলমান — SLA সীমার ভেতরে অগ্রসর হচ্ছে" />
              </div>
            </div>
          </Reveal>

          <Reveal dir="right" delay={60}>
            <div className="card h-full p-4 sm:p-5">
              <p className="text-[10px] font-bold tracking-[0.22em] text-danger uppercase">স্থবির ফাইল তালিকা (SLA ব্রিচ)</p>
              <div className="mt-3 grid max-h-[420px] gap-2 overflow-y-auto pr-1" data-native-scroll>
                {breaches.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-danger/40 bg-[color-mix(in_srgb,var(--c-danger)_7%,var(--c-surface))] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="mono text-[10.5px] text-danger">{row.clientCode}</p>
                      <Chip tone="danger">{row.stalledDays} কার্যদিবস</Chip>
                    </div>
                    <p className="mt-1 text-[11.5px] font-bold text-ink">{row.fullName}</p>
                    <p className="text-[10.5px] text-mute">
                      {STAGE_COLUMNS.find((c) => c.key === row.stage)?.labelBn ?? row.stage} · {row.employerName ?? "নিয়োগকর্তা নির্ধারিত হয়নি"}
                    </p>
                    <p className="mt-1 text-[10px] text-mute">
                      প্রয়োজনীয় ব্যবস্থা: {row.stage === "New_Lead" ? "ডকুমেন্ট সংশোধনে ক্লায়েন্ট যোগাযোগ" : "পোর্টালে পুনঃসাবমিশন বা কনস্যুলার ফলোআপ"}
                    </p>
                  </div>
                ))}
                {breaches.length === 0 ? (
                  <p className="soft p-4 text-[11.5px] text-mute">এই মুহূর্তে কোনো ফাইল ৭ কার্যদিবসের বেশি স্থবির নয়।</p>
                ) : null}
              </div>
              <Link href="/dashboard" className="btn btn-brand mt-4 w-full">
                কানবান কনসোলে স্থানান্তর করুন →
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal delay={60}>
          <div className="card mt-6 p-4 sm:p-5">
            <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">বর্তমান পাইপলাইনে ফাইলসমূহ</p>
            <div className="card kb-scroll mt-3 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-[11px]">
                <thead>
                  <tr className="bg-surface2 text-[10px] tracking-wide text-mute uppercase">
                    <th className="px-3 py-2.5">ফাইল আইডি</th>
                    <th className="px-3 py-2.5">নাম</th>
                    <th className="px-3 py-2.5">দেশ / ভিসা</th>
                    <th className="px-3 py-2.5">বর্তমান ধাপ</th>
                    <th className="px-3 py-2.5">স্থবিরতা</th>
                    <th className="px-3 py-2.5">বকেয়া</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 24).map((row) => (
                    <tr key={row.id} className="border-t border-line align-top">
                      <td className="mono px-3 py-2 text-accent">{row.clientCode}</td>
                      <td className="px-3 py-2 text-ink">{row.fullName}</td>
                      <td className="px-3 py-2 text-mute">
                        {row.countryIso} · {row.visaCode}
                      </td>
                      <td className="px-3 py-2 text-mute">{STAGE_COLUMNS.find((c) => c.key === row.stage)?.labelBn ?? "প্রত্যাখ্যাত"}</td>
                      <td className="px-3 py-2">
                        <span className={`mono ${row.slaBreach ? "text-danger" : "text-tealx"}`}>{row.stalledDays} দিন</span>
                      </td>
                      <td className="mono px-3 py-2 text-ink">৳{Math.round(row.dueBalance).toLocaleString("en-US")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {OPERATIONAL_DOCTRINE.map((item, index) => (
            <Reveal key={item.title} dir="zoom" delay={index * 40}>
              <div className="card h-full p-4">
                <p className="text-[12px] font-bold text-accent">{item.title}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-mute">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={70}>
          <div className="card mt-6 p-4 sm:p-5">
            <SectionTitle
              eyebrow="SLA সংজ্ঞা"
              title="কোন ধাপে কত কার্যদিবস স্বাভাবিক"
              subtitle="নিচের সময়সীমা অতিক্রম করলে সিস্টেম সতর্কতা জেনারেট করে। কনস্যুলার স্লট সংকট বা অতিরিক্ত ডকুমেন্ট চাওয়া হলে ব্যবস্থাপনা কর্তৃপক্ষ ব্যতিক্রম অনুমোদন করতে পারেন।"
            />
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["নতুন লিড → ডকুমেন্ট ভেরিফায়েড", "২ কার্যদিবস"],
                ["নিয়োগকর্তা ম্যাচিং", "৫ কার্যদিবস"],
                ["ওয়ার্ক পারমিট সাবমিশন", "৭ কার্যদিবস"],
                ["কনস্যুলার সাবমিশন", "১০ কার্যদিবস"],
                ["ভিসা সিদ্ধান্ত", "৭ কার্যদিবস"],
                ["ফ্লাইট ডিপ্লয়মেন্ট", "৫ কার্যদিবস"],
                ["প্রত্যাখ্যান আপিল প্রস্তুতি", "৩০ দিনের মধ্যে"],
                ["সাপ্তাহিক ডিপ্লয়মেন্ট রিপোর্ট", "প্রতি ৭ দিনে"],
              ].map(([stage, limit]) => (
                <div key={stage} className="soft flex items-center justify-between px-3 py-2">
                  <span className="text-[11px] text-mute">{stage}</span>
                  <span className="mono text-[10.5px] font-bold text-ink">{limit}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
      <BottomNav />
    </div>
  );
}
