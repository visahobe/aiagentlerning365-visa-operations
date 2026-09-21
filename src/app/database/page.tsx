import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  affiliates,
  applications,
  automationJobs,
  clients,
  commissions,
  countries,
  demands,
  deployments,
  documentChecks,
  emailsLog,
  employers,
  partners,
  payments,
  slaAlerts,
  visaTypes,
  withdrawals,
} from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { getAdminConsoleData } from "@/lib/automation";
import { BottomNav, Breadcrumbs, PageHero, SiteFooter, TopNav } from "@/components/site-shell";
import { Bar, Chip, Reveal, SectionTitle, StatTile } from "@/components/ui";
import { DB_ENTITIES } from "@/lib/reference-data";

export const dynamic = "force-dynamic";

export default async function DatabasePage() {
  await ensureSeeded();
  const [consoleData] = await Promise.all([getAdminConsoleData()]);
  const counts = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(countries),
    db.select({ c: sql<number>`count(*)::int` }).from(visaTypes),
    db.select({ c: sql<number>`count(*)::int` }).from(clients),
    db.select({ c: sql<number>`count(*)::int` }).from(employers),
    db.select({ c: sql<number>`count(*)::int` }).from(demands),
    db.select({ c: sql<number>`count(*)::int` }).from(applications),
    db.select({ c: sql<number>`count(*)::int` }).from(documentChecks),
    db.select({ c: sql<number>`count(*)::int` }).from(affiliates),
    db.select({ c: sql<number>`count(*)::int` }).from(commissions),
    db.select({ c: sql<number>`count(*)::int` }).from(withdrawals),
    db.select({ c: sql<number>`count(*)::int` }).from(partners),
    db.select({ c: sql<number>`count(*)::int` }).from(payments),
    db.select({ c: sql<number>`count(*)::int` }).from(emailsLog),
    db.select({ c: sql<number>`count(*)::int` }).from(deployments),
    db.select({ c: sql<number>`count(*)::int` }).from(automationJobs),
    db.select({ c: sql<number>`count(*)::int` }).from(slaAlerts),
  ]);

  const tableNames = [
    "countries",
    "visa_types",
    "clients",
    "employers",
    "demands",
    "applications",
    "document_checks",
    "affiliates",
    "commissions",
    "withdrawals",
    "partners",
    "payments",
    "emails_log",
    "deployments",
    "automation_jobs",
    "sla_alerts",
  ];

  const tableStats = tableNames.map((name, index) => ({
    name,
    rows: counts[index]?.[0]?.c ?? 0,
    entity: DB_ENTITIES.find((e) => e.entity.toLowerCase().replace(/_/g, "_") === name || e.entity === name)?.entity,
  }));
  const maxRows = Math.max(...tableStats.map((t) => t.rows), 1);

  const relations = [
    { from: "employers", to: "demands", type: "এক → অনেক", note: "এক নিয়োগকর্তা একাধিক চাহিদাপত্র প্রকাশ করতে পারেন" },
    { from: "demands", to: "clients", type: "এক → অনেক", note: "প্রতিটি চাহিদাপত্রের অধীনে একাধিক ক্লায়েন্ট নথিভুক্ত" },
    { from: "affiliates", to: "clients", type: "এক → অনেক", note: "প্রতিটি ক্লায়েন্ট এক নির্দিষ্ট রেফারেল এজেন্টের সাথে যুক্ত" },
    { from: "clients", to: "applications", type: "এক → এক", note: "প্রতি ক্লায়েন্টের একটি রিয়েল-টাইম অ্যাপ্লিকেশন ট্র্যাক" },
    { from: "clients", to: "document_checks", type: "এক → অনেক", note: "প্রতিটি ভ্যালিডেশন ফিল্টারের আলাদা রেকর্ড" },
    { from: "clients", to: "payments", type: "এক → অনেক", note: "তিন ধাপের পেমেন্ট ও ইনভয়েস" },
    { from: "clients", to: "emails_log", type: "এক → অনেক", note: "প্রত্যেক প্রেরিত ইমেইলের অডিট লগ" },
    { from: "clients", to: "deployments", type: "এক → এক", note: "ফ্লাইট, PNR ও পিকআপ তথ্য" },
    { from: "affiliates", to: "commissions", type: "এক → অনেক", note: "প্রতিটি কমিশন ক্রেডিটের কারণ ও ক্লায়েন্ট রেফারেন্স" },
    { from: "employers", to: "partners", type: "এক → অনেক", note: "আন্তর্জাতিক অংশীদারিত্ব ও প্রফিট শেয়ার" },
    { from: "clients", to: "sla_alerts", type: "এক → অনেক", note: "স্থবিরতার সতর্কবার্তা ও সমাধানের রেকর্ড" },
    { from: "countries", to: "clients", type: "এক → অনেক", note: "কান্ট্রি মাস্টার ডাটার সাথে আইএসও কোড ম্যাপিং" },
  ];

  return (
    <div className="min-h-screen bg-app pb-20 lg:pb-0">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <Breadcrumbs trail={[{ label: "হোম", href: "/" }, { label: "ডাটাবেজ স্কিমা" }]} />
      </div>
      <PageHero
        eyebrow="রিলেশনাল ডাটাবেজ আর্কিটেকচার"
        title="১৬ টেবিলের সমন্বিত স্কিমা — প্রতি সম্পর্ক ডাটা অখণ্ডতা নিশ্চিত করে"
        subtitle="PostgreSQL-এ Drizzle ORM দিয়ে টাইপ-সেফ স্কিমা পরিচালিত। প্রতিটি টেবিলে প্রাইমারি কী, ফরেন কী কনস্ট্রেইন্ট, ইউনিক ইনডেক্স ও এনাম টাইপ নির্ধারিত — ফলে ডুপ্লিকেট আইডি, অনাথ রেকর্ড বা অসম্পূর্ণ সম্পর্ক তৈরি হওয়া অসম্ভব।"
      >
        <div className="flex flex-wrap gap-1.5">
          <Chip tone="accent">১৬ টেবিল · ৮ এনাম টাইপ</Chip>
          <Chip tone="teal">UUID প্রাইমারি কী</Chip>
          <Chip tone="brand">JSONB ভ্যালিডেশন রিপোর্ট</Chip>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="ক্লায়েন্ট রেকর্ড" value={tableStats[2].rows} tone="brand" />
          <StatTile label="নিয়োগকর্তা রেকর্ড" value={tableStats[3].rows} tone="teal" />
          <StatTile label="ভ্যালিডেশন চেক" value={tableStats[6].rows} tone="accent" hint="OCR · CV · QR · ব্যাংক · চুক্তি" />
          <StatTile label="অটোমেশন লগ" value={tableStats[14].rows} tone="accent" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <Reveal dir="left">
            <div className="card h-full p-4 sm:p-5">
              <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">টেবিলভিত্তিক রেকর্ড সংখ্যা (লাইভ)</p>
              <div className="mt-3 grid gap-2">
                {tableStats.map((table) => (
                  <div key={table.name}>
                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="mono text-mute">{table.name}</span>
                      <span className="mono text-ink">{table.rows}</span>
                    </div>
                    <div className="mt-1">
                      <Bar value={table.rows} max={maxRows} tone={table.rows > 0 ? "brand" : "accent"} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal dir="right" delay={60}>
            <div className="card h-full p-4 sm:p-5">
              <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">সংশ্লিষ্টতা ম্যাপ (রিলেশনশিপ)</p>
              <div className="mt-3 grid gap-2">
                {relations.map((relation) => (
                  <div key={`${relation.from}-${relation.to}`} className="soft flex flex-wrap items-center gap-2 p-2.5">
                    <code className="mono text-[10.5px] font-bold text-tealx">{relation.from}</code>
                    <span className="text-mute">→</span>
                    <code className="mono text-[10.5px] font-bold text-accent">{relation.to}</code>
                    <Chip tone="brand">{relation.type}</Chip>
                    <p className="w-full text-[10.5px] leading-relaxed text-mute">{relation.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-line bg-surface2 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="এনটিটি ডিকশনারি"
              title="প্রতিটি টেবিলের ফিল্ড, ডাটা টাইপ ও ব্যবসায়িক ভূমিকা"
              subtitle="নিচের প্রতিটি এনটিটিতে প্রাইমারি কী, ফরেন কী, ইউনিক কনস্ট্রেইন্ট ও ব্যবহৃত এনাম তালিকাভুক্ত করা হয়েছে।"
            />
          </Reveal>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DB_ENTITIES.map((entity, index) => (
              <Reveal key={entity.entity} dir="zoom" delay={index * 30}>
                <div className="card h-full p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="mono text-[12px] font-bold text-accent">{entity.entity}</p>
                    <Chip tone="teal">PostgreSQL</Chip>
                  </div>
                  <p className="mono mt-2 text-[10px] leading-relaxed break-words text-mute">{entity.fields}</p>
                  <p className="mt-2 text-[10.5px] leading-relaxed text-ink">{entity.relation}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
          <Reveal dir="left">
            <SectionTitle
              eyebrow="এনাম ও কনস্ট্রেইন্ট"
              title="স্ট্যাটাস ভ্যালু ও কনস্ট্রেইন্ট ডিজাইন"
              subtitle="এনাম ব্যবহারের ফলে ভুল বা অপরিচিত মান ডাটাবেজ স্তরেই প্রত্যাখ্যাত হয়, ফলে রিপোর্টিং ও ফিল্টার সবসময় নির্ভরযোগ্য থাকে।"
            />
            <div className="mt-4 grid gap-2.5">
              {[
                ["visa_category", "Work · Visitor · Self_Sponsorship"],
                ["verification_status", "Verified · Pending · Blacklisted"],
                ["demand_status", "Open · Closed · Paused"],
                ["application_stage", "New_Lead · Docs_Verified · Employer_Matched · Work_Permit_Submitted · Consular_Review · Visa_Approved · Flight_Deployed · Rejected"],
                ["payment_method", "bKash · Nagad · Bank"],
                ["payment_stage", "Advance · Stage_2 · Final"],
                ["automation_status", "queued · running · success · warning · failed"],
                ["withdrawal_status", "Pending · Approved · Rejected"],
              ].map(([name, values]) => (
                <div key={name} className="card p-3.5">
                  <code className="mono text-[11px] font-bold text-tealx">{name}</code>
                  <p className="mono mt-1 text-[10px] leading-relaxed text-mute">{values}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal dir="right" delay={60}>
            <SectionTitle
              eyebrow="ডেটা অখণ্ডতা বিধি"
              title="কীভাবে অনাথ ও ডুপ্লিকেট রেকর্ড প্রতিরোধ হয়"
            />
            <div className="mt-4 grid gap-2.5">
              {[
                ["client_code UNIQUE", "একই ইউনিক আইডি দুবার তৈরি হতে পারে না — সিকোয়েন্স কাউন্টার বছর ও দেশ-ভিসা ভিত্তিক হিসাব করে।"],
                ["ON DELETE CASCADE", "ক্লায়েন্ট মুছে ফেললে তার ডকুমেন্ট চেক, পেমেন্ট, ইমেইল লগ ও ডিপ্লয়মেন্ট রেকর্ডও সঠিকভাবে ব্যবস্থাপিত হয়।"],
                ["ON DELETE SET NULL", "এজেন্ট নিষ্ক্রিয় হলে ক্লায়েন্ট রেকর্ড সংরক্ষিত থাকে, শুধু affiliate_id ফাঁকা হয়ে যায় — ইতিহাস হারায় না।"],
                ["UUID PK", "ক্লায়েন্ট ও চুক্তিপত্রের অনুমানযোগ্য আইডি ছড়িয়ে পড়া রোধ করে নিরাপত্তা বাড়ায়।"],
                ["jsonb validation_report", "প্রতিটি ফাইলের ডকুমেন্ট চেক ফলাফল কাঠামোবদ্ধভাবে সংরক্ষিত — পরে অডিট ও বিশ্লেষণ সম্ভব।"],
                ["denormalized contract_value", "চুক্তিমূল্য ক্লায়েন্ট রেকর্ডে সংরক্ষিত থাকায় ফিনান্সিয়াল রিপোর্ট দ্রুত হয়।"],
              ].map(([label, body]) => (
                <div key={label} className="card p-3.5">
                  <p className="mono text-[11px] font-bold text-accent">{label}</p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-mute">{body}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <StatTile label="মোট কমিশন লেজার এন্ট্রি" value={tableStats[8].rows} tone="accent" />
              <StatTile label="ফিনান্সিয়াল ডাটা সোর্স" value={`${consoleData.clients.length} ফাইল`} tone="brand" hint="contract_value + payments যোগফল" />
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
      <BottomNav />
    </div>
  );
}
