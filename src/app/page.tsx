import Link from "next/link";
import Image from "next/image";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { clients, countries as countriesTable } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { getAutomationFeed, getEmailFeed, getPlatformSnapshot } from "@/lib/automation";
import {
  AUTOMATION_SCHEDULE,
  BRAND,
  COUNTRIES,
  EMAIL_TRIGGERS,
  EXECUTIVE_SUMMARY,
  FAQ_GENERAL,
  IMPACT_KPIS,
  IMAGES,
  LEARNING_MODULES,
  OPERATIONAL_DOCTRINE,
  ROADMAP_PHASES,
  STAGE_COLUMNS,
  TOOL_STACK,
  VISA_TYPES,
} from "@/lib/reference-data";
import { AutomationConsole } from "@/components/automation-console";
import { CountryExplorer } from "@/components/country-explorer";
import { Accordion, Bar, Chip, Counter, ProgressRing, Reveal, SectionTitle, StatTile, TiltCard } from "@/components/ui";
import { BottomNav, SiteFooter, TopNav } from "@/components/site-shell";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSeeded();
  const snapshot = await getPlatformSnapshot();
  const [automationFeedRaw, emailFeedRaw] = await Promise.all([getAutomationFeed(8), getEmailFeed(10)]);
  const countryRows = await db.select().from(countriesTable).orderBy(countriesTable.id);
  const countRows = await db
    .select({ iso: clients.countryIso, count: sql<number>`count(*)::int` })
    .from(clients)
    .groupBy(clients.countryIso);
  const stageRows = await db
    .select({ stage: clients.stage, count: sql<number>`count(*)::int` })
    .from(clients)
    .groupBy(clients.stage);

  const clientCounts: Record<string, number> = {};
  countRows.forEach((row) => {
    clientCounts[row.iso] = row.count;
  });

  const countries = COUNTRIES.map((blueprint) => {
    const dbRow = countryRows.find((r) => r.iso3 === blueprint.iso3);
    return {
      ...blueprint,
      adminPortal: dbRow?.adminPortal ?? blueprint.adminPortal,
      legalBasis: dbRow?.legalBasis ?? blueprint.legalBasis,
      processingWindow: dbRow?.processingWindow ?? blueprint.processingWindow,
    };
  });

  const automationFeed = automationFeedRaw.map((job) => ({ ...job, startedAt: job.startedAt.toISOString() }));
  const emailFeed = emailFeedRaw.map((row) => ({ ...row, sentAt: row.sentAt.toISOString() }));
  const stageCounts: Record<string, number> = {};
  STAGE_COLUMNS.forEach((column) => {
    stageCounts[column.key] = stageRows.find((row) => row.stage === column.key)?.count ?? 0;
  });

  return (
    <div className="min-h-screen bg-app pb-20 lg:pb-0">
      <TopNav />

      {/* ============================== হিরো ============================== */}
      <section className="spot-bg relative overflow-hidden pt-24 pb-12 sm:pt-28 sm:pb-16">
        <div className="grid-bg absolute inset-0 opacity-70" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <Reveal>
                <div className="flex flex-wrap gap-1.5">
                  <Chip tone="accent">ডিপ অটোমেশন ব্লুপ্রিন্ট · ২০২৬</Chip>
                  <Chip tone="teal">৮ কৌশলগত গন্তব্য · ৩ ভিসা পাথওয়ে</Chip>
                  <Chip tone="brand">১৫ টেবিল রিলেশনাল কোর</Chip>
                </div>
              </Reveal>
              <Reveal delay={70}>
                <h1 className="h1 mt-4 text-ink">
                  <span className="aurora-text">VisaMotion365</span>
                  <span className="mt-1 block">এআই ভিসা সুপার এজেন্ট প্ল্যাটফর্ম</span>
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="body-text mt-4 max-w-2xl">
                  বাংলাদেশ থেকে আটটি কৌশলগত গন্তব্যে <strong className="text-ink">ওয়ার্ক ভিসা</strong>,{" "}
                  <strong className="text-ink">ভিজিটর ভিসা</strong> ও <strong className="text-ink">সেলফ-স্পন্সরশিপ</strong>{" "}
                  প্রসেসিংয়ের সম্পূর্ণ চেইন — ক্লায়েন্ট অনবোর্ডিং, ডকুমেন্ট ভ্যালিডেশন, ভেরিফাইড এমপ্লয়ার ম্যাচিং, সরকারি
                  পোর্টাল সাবমিশন, দূতাবাস ট্র্যাকিং, ভিসা অনুমোদন ও ফ্লাইট ডিপ্লয়মেন্ট — একটি সমন্বিত অটোমেটেড পাইপলাইনে।
                </p>
              </Reveal>
              <Reveal delay={170}>
                <div className="mt-6 flex flex-wrap gap-2.5">
                  <Link href="/onboard" className="btn btn-primary animate-ring">
                    ফাইল অনবোর্ডিং শুরু করুন
                  </Link>
                  <Link href="/track" className="btn btn-brand">
                    ফাইল ট্র্যাক করুন
                  </Link>
                  <Link href="/automation" className="btn">
                    এআই এজেন্ট চালান
                  </Link>
                </div>
              </Reveal>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "সক্রিয় ফাইল", value: snapshot.clients },
                  { label: "ভেরিফাইড এমপ্লয়ার", value: snapshot.verifiedEmployers },
                  { label: "অটোমেশন জব", value: snapshot.automationJobs },
                  { label: "ইমেইল ডিসপ্যাচ", value: snapshot.emailsDispatched },
                ].map((stat, index) => (
                  <Reveal key={stat.label} dir="zoom" delay={index * 60}>
                    <div className="card p-3.5">
                      <p className="mono text-xl font-bold text-accent">
                        <Counter to={stat.value} />
                      </p>
                      <p className="mt-1 text-[10.5px] leading-relaxed text-mute">{stat.label}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            <Reveal dir="right" delay={110}>
              <TiltCard>
                <div className="card relative overflow-hidden">
                  <Image
                    src={IMAGES.passports}
                    alt="পাসপোর্ট ও ভিসা ডকুমেন্ট"
                    width={1200}
                    height={627}
                    unoptimized
                    className="h-40 w-full object-cover sm:h-48"
                  />
                  <div className="p-4 sm:p-5">
                    <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">ইউনিক ক্লায়েন্ট আইডি ফরম্যাট</p>
                    <p className="mono mt-2 text-[13px] font-bold text-ink sm:text-[15px]">
                      WVC-[দেশ]-[ভিসা]-[সাল]-[ক্রমিক]
                    </p>
                    <div className="mt-3 grid gap-1.5">
                      {[
                        ["WVC", "প্রতিষ্ঠানের স্থায়ী আন্তর্জাতিক প্রিফিক্স"],
                        ["SRB / TUR / SAU / MYS", "আইএসও তিন অক্ষরের দেশ কোড"],
                        ["WRK / VIS / SLF", "ভিসা ক্যাটাগরি কোড"],
                        ["2026", "আবেদন দাখিলের চলতি সাল"],
                        ["0001", "প্রতি দেশ ও ক্যাটাগরির চার অঙ্কের ক্রমিক"],
                      ].map(([part, meaning]) => (
                        <div key={part} className="soft flex items-start gap-2.5 px-2.5 py-2">
                          <code className="mono shrink-0 text-[11px] font-bold text-tealx">{part}</code>
                          <p className="text-[10.5px] leading-relaxed text-mute">{meaning}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-2xl border border-accent2 bg-accentsoft p-3 text-center">
                      <p className="text-[10.5px] text-mute">উদাহরণ — সার্বিয়ায় কাজের ভিসার প্রথম ২০২৬ ক্লায়েন্ট</p>
                      <p className="mono mt-1 text-[14px] font-bold text-accent">WVC-SRB-WRK-2026-0001</p>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-7">
                      {STAGE_COLUMNS.map((column) => (
                        <div key={column.key} className="soft px-1 py-2 text-center">
                          <p className="mono text-[11.5px] font-bold text-tealx">{stageCounts[column.key]}</p>
                          <p className="mt-0.5 text-[9px] leading-tight text-mute">{column.labelBn.split(" ")[0]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================ মার্কি ============================ */}
      <div className="border-y border-line bg-surface2 py-2.5">
        <div className="marquee-track gap-8">
          {[...countries, ...countries].map((country, index) => (
            <span key={`${country.iso3}-${index}`} className="flex shrink-0 items-center gap-2 text-[11.5px] whitespace-nowrap text-mute">
              <span className="text-base">{country.flag}</span>
              {country.nameBn}
              <span className="mono text-[10px] text-accent">{country.processingWindow}</span>
              <span className="text-line">•</span>
              <span className="mono text-[10px]">{country.adminPortal.split("·")[0]}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ========================= নিয়ন্ত্রণ কক্ষ ========================= */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <Reveal>
          <SectionTitle
            eyebrow="লাইভ কন্ট্রোল রুম"
            title="প্ল্যাটফর্মের বর্তমান অবস্থা — ডাটাবেজ থেকে সরাসরি"
            subtitle="নিচের সূচকগুলো প্রতি রিকোয়েস্টে PostgreSQL থেকে পড়া হয়। ফাইল ইনটেক, অটোমেশন সাইকেল বা কমিশন পোস্টিং করলে সাথে সাথে এই মান পরিবর্তিত হয়।"
          />
        </Reveal>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="মোট চুক্তিমূল্য" value={`৳${Math.round(snapshot.contractValue).toLocaleString("en-US")}`} tone="brand" hint="সকল ফাইলের সম্মিলিত প্যাকেজ মূল্য" />
          <StatTile label="আদায়কৃত" value={`৳${Math.round(snapshot.received).toLocaleString("en-US")}`} tone="teal" hint="অ্যাডভান্স + স্টেজ-২ + ফাইনাল" />
          <StatTile label="বকেয়া (Due)" value={`৳${Math.round(snapshot.dueBalance).toLocaleString("en-US")}`} tone="accent" hint="মোট − আদায়কৃত" />
          <StatTile label="অ্যাফিলিয়েট কমিশন" value={`৳${Math.round(snapshot.commissionsPaid).toLocaleString("en-US")}`} tone="accent" hint="স্বয়ংক্রিয় ক্রেডিট সম্পন্ন" />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Reveal dir="left" className="lg:col-span-2">
            <div className="card h-full p-4 sm:p-5">
              <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">পাইপলাইন ধাপে ফাইল বিতরণ</p>
              <div className="mt-4 grid gap-3">
                {STAGE_COLUMNS.map((column) => (
                  <div key={column.key}>
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="text-mute">{column.labelBn}</span>
                      <span className="mono text-ink">{stageCounts[column.key]} ফাইল</span>
                    </div>
                    <div className="mt-1">
                      <Bar value={stageCounts[column.key]} max={Math.max(...Object.values(stageCounts), 1)} tone="brand" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal dir="right" delay={70}>
            <div className="card grid h-full gap-4 p-4 sm:p-5">
              <ProgressRing value={snapshot.validationPassRate} label="ডকুমেন্ট ভ্যালিডেশনের সামগ্রিক পাস রেট (OCR + CV + QR + ব্যাংক + চুক্তি)" />
              <div className="grid gap-2">
                <div className="soft flex items-center justify-between px-3 py-2">
                  <p className="text-[11px] text-mute">ব্ল্যাকলিস্টেড নিয়োগকর্তা</p>
                  <p className="mono text-[12px] font-bold text-danger">{snapshot.blacklistedEmployers}</p>
                </div>
                <div className="soft flex items-center justify-between px-3 py-2">
                  <p className="text-[11px] text-mute">SLA অ্যালার্ম সক্রিয়</p>
                  <p className="mono text-[12px] font-bold text-accent">{snapshot.slaAlerts}</p>
                </div>
                <div className="soft flex items-center justify-between px-3 py-2">
                  <p className="text-[11px] text-mute">ওপেন ডিমান্ড কোটা</p>
                  <p className="mono text-[12px] font-bold text-tealx">{snapshot.openQuota}</p>
                </div>
                <div className="soft flex items-center justify-between px-3 py-2">
                  <p className="text-[11px] text-mute">ভিসা অনুমোদিত</p>
                  <p className="mono text-[12px] font-bold text-tealx">{snapshot.approved}</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========================= নির্বাহী সারসংক্ষেপ ========================= */}
      <section className="border-y border-line bg-surface2 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="নির্বাহী সারসংক্ষেপ"
              title="ম্যানুয়াল ভিসা প্রসেসিংয়ের দীর্ঘসূত্রতা থেকে ডিপ অটোমেশন"
              subtitle="জটিল আইনি অনুশাসন, শ্রমঘন ডাটা এন্ট্রি, বহুস্তরীয় যাচাইকরণ ও পরিবর্তনশীল নিয়ম — এই চার প্রতিবন্ধকতাকে প্রযুক্তিগত সক্ষমতায় রূপান্তরের রূপরেখা।"
            />
          </Reveal>
          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            {EXECUTIVE_SUMMARY.map((paragraph, index) => (
              <Reveal key={paragraph.slice(0, 20)} dir={index % 2 === 0 ? "left" : "right"} delay={index * 50}>
                <p className="card body-text h-full p-4 sm:p-5">{paragraph}</p>
              </Reveal>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {OPERATIONAL_DOCTRINE.map((item, index) => (
              <Reveal key={item.title} dir="zoom" delay={index * 50}>
                <div className="card card-hover h-full p-4">
                  <p className="text-[12.5px] font-bold text-accent">{item.title}</p>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-mute">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {IMPACT_KPIS.map((kpi, index) => (
              <Reveal key={kpi.label} dir="zoom" delay={index * 40}>
                <div className="card flex items-center gap-4 p-4">
                  <p className="mono shrink-0 text-lg font-bold text-tealx">{kpi.value}</p>
                  <div>
                    <p className="text-[12px] font-bold text-ink">{kpi.label}</p>
                    <p className="text-[10.5px] leading-relaxed text-mute">{kpi.note}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== দেশভিত্তিক ফ্রেমওয়ার্ক ======================== */}
      <section id="countries" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <Reveal>
          <SectionTitle
            eyebrow="দেশভিত্তিক ভিসা ফ্রেমওয়ার্ক"
            title="আটটি গন্তব্যের তিনটি পাথওয়ে ও পোর্টাল অটোমেশন"
            subtitle="প্রতিটি দেশের আইনি ভিত্তি, প্রশাসনিক পোর্টাল, ডকুমেন্ট চেকলিস্ট ও ঝুঁকি নোট আলাদা। নিচে দেশ নির্বাচন করে ওয়ার্ক / ভিজিটর / সেলফ-স্পন্সরশিপ পাথওয়ে ও এজেন্টের ধাপভিত্তিক অপারেশন দেখুন।"
          />
        </Reveal>
        <div className="mt-7">
          <CountryExplorer countries={countries} clientCounts={clientCounts} />
        </div>
        <Reveal delay={60}>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/countries" className="card card-hover p-4">
              <p className="text-[12.5px] font-bold text-ink">তুলনামূলক ম্যাট্রিক্স</p>
              <p className="mt-1.5 text-[11px] text-mute">আট দেশের আইনি ভিত্তি, পোর্টাল ও সময়কাল এক পাতায়</p>
            </Link>
            {countries.slice(0, 3).map((country) => (
              <Link key={country.iso3} href={`/countries/${country.iso3.toLowerCase()}`} className="card card-hover p-4">
                <p className="text-[12.5px] font-bold text-ink">
                  {country.flag} {country.nameBn} — বিস্তারিত পাতা
                </p>
                <p className="mt-1.5 text-[11px] text-mute">{country.adminPortal}</p>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ======================== ভিসা ক্যাটাগরি মাস্টার ======================== */}
      <section className="border-y border-line bg-surface2 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="ভিসা ক্যাটাগরি মাস্টার ডাটা"
              title="তিনটি ট্র্যাক — প্রতিটি নিজস্ব ফি, SLA ও কমিশন কাঠামোসহ"
            />
          </Reveal>
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {VISA_TYPES.map((visa, index) => (
              <Reveal key={visa.code} dir={index === 1 ? "zoom" : index === 0 ? "left" : "right"} delay={index * 60}>
                <div className="card card-hover h-full p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <Chip tone="accent">{visa.code}</Chip>
                    <Chip tone="teal">{visa.shortBn}</Chip>
                  </div>
                  <h3 className="h3 mt-3 text-ink">{visa.labelBn}</h3>
                  <p className="body-text mt-2 text-[12px]">{visa.description}</p>
                  <p className="mono mt-2 text-[10.5px] text-tealx">{visa.stagesBn}</p>
                  <div className="mt-3 grid gap-2 text-[11px]">
                    <div className="soft flex items-center justify-between px-3 py-2">
                      <span className="text-mute">বেস প্রসেসিং ফি</span>
                      <span className="mono font-bold text-accent">৳{Number(visa.baseProcessingFee).toLocaleString("en-US")}</span>
                    </div>
                    <div className="soft flex items-center justify-between px-3 py-2">
                      <span className="text-mute">অ্যাফিলিয়েট কমিশন</span>
                      <span className="mono font-bold text-tealx">৳{Number(visa.affiliateCommission).toLocaleString("en-US")}</span>
                    </div>
                    <div className="soft flex items-center justify-between px-3 py-2">
                      <span className="text-mute">SLA এস্কেলেশন</span>
                      <span className="mono font-bold text-ink">{visa.slaDays} কার্যদিবস</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== ব্রাউজার এআই এজেন্ট ==================== */}
      <section id="agent" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <Reveal>
          <SectionTitle
            eyebrow="ব্রাউজার এআই এজেন্ট ও হেডলেস অটোমেশন"
            title="মাল্টি-ট্যাব কনকারেন্ট এক্সিকিউশন ও তিন শিফটের স্লট মনিটরিং"
            subtitle="হেডলেস Chromium ক্লাস্টার আইসোলেটেড ব্রাউজার ইনস্ট্যান্সে একসাথে আট দেশের সরকারি পোর্টালে সমান্তরাল থ্রেডে কাজ করে। প্রতিটি পোর্টালের জন্য স্বতন্ত্র সেশন কুকিজ, লোকাল স্টোরেজ স্টেট ও ডাইনামিক আইপি রোটেশন সংরক্ষিত থাকে। ‘সাইকেল চালান’ বোতাম চেপে বাস্তব ওয়ার্কফ্লো ট্রিগার করুন।"
          />
        </Reveal>
        <div className="mt-7">
          <AutomationConsole
            initialFeed={automationFeed}
            snapshot={{
              automationJobs: snapshot.automationJobs,
              emailsDispatched: snapshot.emailsDispatched,
              validationPassRate: snapshot.validationPassRate,
              approved: snapshot.approved,
            }}
          />
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {AUTOMATION_SCHEDULE.map((task, index) => (
            <Reveal key={task.task} dir="zoom" delay={index * 60}>
              <div className="card h-full p-4">
                <p className="text-[12px] font-bold text-ink">{task.task}</p>
                <p className="mono mt-1.5 text-[10.5px] text-accent">{task.trigger}</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-mute">{task.mechanism}</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-tealx">→ {task.outcome}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ======================= ইমেইল অটোমেশন প্রিভিউ ======================= */}
      <section className="border-y border-line bg-surface2 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="ট্রানজ্যাকশনাল ইমেইল অটোমেশন"
              title="আটটি লজিক্যাল ট্রিগার — কেন্দ্রীয় ঠিকানা থেকে স্বয়ংক্রিয় ডিসপ্যাচ"
              subtitle="প্রতিটি ইভেন্টে ব্যাকএন্ড মাইক্রোসার্ভিস ইনলাইন CSS টেবিল টেমপ্লেটে ডাইনামিক ভ্যারিয়েবল প্রতিস্থাপন করে ইমেইল প্রেরণ করে। সম্পূর্ণ গ্যালারি, HTML সোর্স ও লগ দেখতে ইমেইল ইঞ্জিন পাতায় যান।"
            />
          </Reveal>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {EMAIL_TRIGGERS.map((trigger, index) => (
              <Reveal key={trigger.key} dir="zoom" delay={index * 40}>
                <div className="card h-full p-3.5">
                  <p className="text-[12px] font-bold text-ink">{trigger.labelBn}</p>
                  <p className="mt-1.5 text-[10.5px] text-accent">প্রাপক: {trigger.recipient}</p>
                  <p className="mono mt-2 text-[10px] leading-relaxed break-words text-mute">{trigger.subject}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={60}>
            <div className="mt-4 grid gap-2">
              {emailFeed.slice(0, 4).map((row) => (
                <div key={row.id} className="card flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5">
                  <p className="truncate text-[11.5px] text-ink">{row.subject}</p>
                  <p className="mono text-[10px] text-mute">
                    {row.recipientEmail} · {row.triggerType}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/email-engine" className="btn btn-brand">
                পূর্ণ ইমেইল ইঞ্জিন ও প্রিভিউ →
              </Link>
              <Link href="/dashboard" className="btn">
                অ্যাডমিন কানবান কনসোল →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ======================== টুল স্ট্যাক ও দলিল ======================== */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Reveal dir="left">
            <SectionTitle
              eyebrow="প্রযুক্তি স্ট্যাক ও টুলস"
              title="প্ল্যাটফর্মে সংযুক্ত প্রমাণিত ১২টি টুল"
              subtitle="প্রতিটি স্তর স্বাধীনভাবে স্কেলযোগ্য, কিন্তু ডেটা প্রবাহে একীভূত। নিচের টুলগুলো বাস্তব অপারেশনে ব্যবহৃত হয়।"
            />
            <div className="mt-5 grid gap-2">
              {TOOL_STACK.map((tool, index) => (
                <div key={tool.name} className="card flex items-start gap-3 p-3">
                  <span className="mono grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-surface2 text-[10px] font-bold text-accent">
                    {index + 1}
                  </span>
                  <div>
                    <p className="mono text-[11.5px] font-bold text-ink">{tool.name}</p>
                    <p className="text-[10.5px] leading-relaxed text-mute">{tool.roleBn}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal dir="right" delay={70}>
            <div className="card overflow-hidden">
              <Image src={IMAGES.documents} alt="ভিসা ডকুমেন্ট যাচাই" width={1200} height={627} unoptimized className="h-44 w-full object-cover" />
              <div className="p-4 sm:p-5">
                <SectionTitle eyebrow="ডকুমেন্ট ভ্যালিডেশন ইঞ্জিন" title="ভুয়া নথি ও ঘোলা ছবি শুরুতেই প্রতিরোধ" />
                <div className="mt-4 grid gap-2">
                  {[
                    ["পাসপোর্ট MRZ", "মেয়াদ ≥ ১৮০ দিন", "ব্লকিং"],
                    ["ICAO ছবি", "৩৫x৪৫ মিমি · σ² ≥ ১০০", "সতর্কতা"],
                    ["পুলিশ ক্লিয়ারেন্স", "ইস্যুর ৯০ দিনের মধ্যে", "ব্লকিং"],
                    ["ব্যাংক স্টেটমেন্ট", "৬ মাস · দেশভিত্তিক থ্রেশহোল্ড", "সতর্কতা"],
                    ["চিকিৎসা ফিটনেস", "Wafid/GAMCA · ৩ মাস", "ব্লকিং"],
                    ["নিয়োগ চুক্তি", "ভেরিফাইড নিয়োগকর্তা + কোটা", "ব্লকিং"],
                  ].map(([doc, standard, severity]) => (
                    <div key={doc} className="soft flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <div>
                        <p className="text-[11.5px] font-bold text-ink">{doc}</p>
                        <p className="mono text-[10px] text-mute">{standard}</p>
                      </div>
                      <Chip tone={severity === "ব্লকিং" ? "danger" : "accent"}>{severity}</Chip>
                    </div>
                  ))}
                </div>
                <Link href="/onboard" className="btn btn-primary mt-4 w-full">
                  লাইভ ভ্যালিডেশন ইঞ্জিন চালান →
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================== রোডম্যাপ ও প্রশিক্ষণ টিজার ==================== */}
      <section className="border-y border-line bg-surface2 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="বাস্তবায়ন রোডম্যাপ"
              title="চার পর্যায়ের রোলআউট ও প্রশিক্ষণ কারিকুলাম"
              subtitle="ডাটাবেজ প্রতিষ্ঠা থেকে ব্রাউজার অটোমেশন লাইভ অপারেশন এবং কমপ্লায়েন্স অডিট — প্রতিটি পর্যায়ে সুনির্দিষ্ট ডেলিভারেবল রয়েছে।"
            />
          </Reveal>
          <div className="mt-7 grid gap-4 lg:grid-cols-4">
            {ROADMAP_PHASES.map((phase, index) => (
              <Reveal key={phase.phase} delay={index * 50}>
                <div className="card card-hover h-full p-4">
                  <div className="flex items-center justify-between">
                    <Chip tone={index % 2 === 0 ? "accent" : "teal"}>{phase.phase}</Chip>
                    <span className="mono text-[10px] text-mute">{phase.span}</span>
                  </div>
                  <p className="mt-3 text-[12.5px] font-bold text-ink">{phase.title}</p>
                  <ul className="mt-2.5 grid gap-1.5">
                    {phase.items.map((item) => (
                      <li key={item} className="flex gap-2 text-[11px] leading-relaxed text-mute">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {LEARNING_MODULES.map((module, index) => (
              <Reveal key={module.title} dir="zoom" delay={index * 40}>
                <div className="card h-full border-tealx/30 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11.5px] font-bold text-tealx">{module.title}</p>
                    <Chip>{module.duration}</Chip>
                  </div>
                  <ul className="mt-2.5 grid gap-1.5">
                    {module.items.map((item) => (
                      <li key={item} className="flex gap-2 text-[10.5px] leading-relaxed text-mute">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-tealx" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-4">
            <Link href="/roadmap" className="btn btn-brand">
              সম্পূর্ণ রোডম্যাপ ও প্রশিক্ষণ পাতা →
            </Link>
          </div>
        </div>
      </section>

      {/* =========================== সাধারণ জিজ্ঞাসা =========================== */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <Reveal>
          <SectionTitle
            eyebrow="সাধারণ জিজ্ঞাসা"
            title="প্ল্যাটফর্ম কীভাবে কাজ করে — সংক্ষেপে উত্তর"
            subtitle="আরও গভীর ব্যাখ্যা, পরিভাষা ও ডকুমেন্ট চেকলিস্ট দেখতে নির্দেশিকা পাতায় যান।"
          />
        </Reveal>
        <div className="mt-6">
          <Accordion items={FAQ_GENERAL.slice(0, 6)} />
        </div>
        <Reveal delay={50}>
          <div className="mt-4">
            <Link href="/guide" className="btn btn-brand">
              নির্দেশিকা, পরিভাষা ও সব প্রশ্নোত্তর →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ============================== CTA ============================== */}
      <section className="spot-bg border-t border-line py-14">
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="text-[10.5px] font-bold tracking-[0.28em] text-accent uppercase">প্রাতিষ্ঠানিক পরিচিতি ও যোগাযোগ</p>
            <h2 className="h2 mt-4 text-ink">{BRAND.name} — দ্রুততম সময়ে কাঙ্ক্ষিত অভিবাসন সেবা</h2>
            <p className="body-text mt-3">{BRAND.addressBn}</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <span className="card mono px-4 py-2.5 text-[11.5px] font-bold text-ink">{BRAND.phone}</span>
              <span className="card mono px-4 py-2.5 text-[11.5px] font-bold text-tealx">{BRAND.email}</span>
              <a href={`https://${BRAND.portal}`} className="btn btn-primary">
                {BRAND.portal}
              </a>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link href="/onboard" className="btn btn-brand">
                ফাইল শুরু করুন
              </Link>
              <Link href="/fees" className="btn">
                ফি ও পেমেন্ট ধাপ
              </Link>
              <Link href="/countries" className="btn">
                দেশভিত্তিক পাথওয়ে
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
      <BottomNav />
    </div>
  );
}
