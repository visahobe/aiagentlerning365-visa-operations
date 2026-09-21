import Link from "next/link";
import { ensureSeeded } from "@/lib/seed";
import { BottomNav, Breadcrumbs, PageHero, SiteFooter, TopNav } from "@/components/site-shell";
import { Bar, Chip, Reveal, SectionTitle, StatTile } from "@/components/ui";
import { IMPACT_KPIS, LEARNING_MODULES, ROADMAP_PHASES } from "@/lib/reference-data";

export const dynamic = "force-dynamic";

const COMPLIANCE_ITEMS = [
  { title: "তথ্য সুরক্ষা ও সম্মতি", body: "ক্লায়েন্টের পাসপোর্ট ও আর্থিক ডকুমেন্ট এনক্রিপটেড স্টোরেজে রাখা হয়; কে কখন কোন ডকুমেন্ট দেখেছেন তা অ্যাক্সেস লগে সংরক্ষিত।" },
  { title: "সরকারি সাবমিশন নীতি", body: "প্রত্যেক দেশের পোর্টাল ব্যবহারের শর্ত, রেট লিমিট ও সেশন নীতি মেনে এজেন্ট চলে; কোনো লুপহোল বাইপাস বা ভুল তথ্য পুশ করা হয় না।" },
  { title: "ক্লায়েন্ট যোগাযোগ নির্দেশিকা", body: "প্রত্যেক রিজেকশন বা অতিরিক্ত ডকুমেন্টের অনুরোধে লিখিত কারণ ও পরবর্তী ধাপ স্পষ্টভাবে জানানো হয়।" },
  { title: "নিয়োগকর্তা যাচাই", body: "ট্যাক্স আইডি, ট্রেড লাইসেন্স, ডোমেইন ও রেফারেন্স যাচাই ছাড়া কোনো ডিমান্ড লাইভ হয় না; ব্ল্যাকলিস্ট হিটে তাৎক্ষণিক স্থগিতাদেশ।" },
  { title: "আর্থিক স্বচ্ছতা", body: "সব লেনদেন ইনভয়েস ও রেফারেন্সসহ লেজারে যায়; সরকারি ফি ক্লায়েন্টের সামনে সরাসরি পাস-থ্রু হিসেবে দেখানো হয়।" },
  { title: "নিয়ম পরিবর্তন পর্যবেক্ষণ", body: "প্রতি দেশের মন্ত্রণালয় নোটিশ ও পোর্টাল আপডেট সাপ্তাহিক রিভিউ করে প্লেবুক ও ফিল্ড ম্যাপিং হালনাগাদ করা হয়।" },
];

const TEAM_ROLES = [
  { role: "অটোমেশন সুপারভাইজার", duty: "এজেন্ট সাইকেল মনিটর, ব্যর্থ জব হস্তক্ষেপ, ক্যাপচা এস্কেলেশন ব্যবস্থাপনা", skill: "সিস্টেম অপারেশন + লগ বিশ্লেষণ" },
  { role: "ডকুমেন্ট কমপ্লায়েন্স অফিসার", duty: "OCR/CV রিজেকশন বিশ্লেষণ, ক্লায়েন্ট কমিউনিকেশন, সংশোধিত নথি গ্রহণ", skill: "ইমিগ্রেশন নিয়ম + ক্লায়েন্ট হ্যান্ডলিং" },
  { role: "কান্ট্রি স্পেশালিস্ট (৮ দেশ)", duty: "দেশভিত্তিক পোর্টাল নিয়ম হালনাগাদ, কনস্যুলার সমন্বয়, ঝুঁকি নোট", skill: "স্থানীয় শ্রম আইন + ভাষা সমর্থন" },
  { role: "ফাইন্যান্স ও কমিশন ডেস্ক", duty: "পেমেন্ট রিকনসিলিয়েশন, অ্যাফিলিয়েট উইথড্রয়াল অনুমোদন, পার্টনার পেআউট", duty_en: "", skill: "হিসাবরক্ষণ + bKash/ব্যাংক এপিআই" } as { role: string; duty: string; skill: string },
  { role: "ক্লায়েন্ট সাকসেস", duty: "ট্র্যাকিং আপডেট, প্রি-ডিপার্চার ব্রিফিং, অভিযোগ নিষ্পত্তি", skill: "বাংলা/ইংরেজি যোগাযোগ" },
  { role: "নেটওয়ার্ক ম্যানেজার", duty: "সাব-এজেন্ট অনবোর্ডিং, প্রশিক্ষণ, কমপ্লায়েন্স অডিট", skill: "নেটওয়ার্ক গভর্নেন্স" },
];

export default async function RoadmapPage() {
  await ensureSeeded();

  return (
    <div className="min-h-screen bg-app pb-20 lg:pb-0">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <Breadcrumbs trail={[{ label: "হোম", href: "/" }, { label: "রোডম্যাপ ও প্রশিক্ষণ" }]} />
      </div>
      <PageHero
        eyebrow="বাস্তবায়ন রোডম্যাপ, প্রশিক্ষণ ও কমপ্লায়েন্স"
        title="চার পর্যায়ে রোলআউট — ডাটাবেজ প্রতিষ্ঠা থেকে লাইভ অটোমেশন অপারেশন"
        subtitle="প্রতিটি পর্যায়ে সুনির্দিষ্ট ডেলিভারেবল, দায়িত্বপ্রাপ্ত ভূমিকা ও যাচাইয়ের মানদণ্ড নির্ধারিত। প্রশিক্ষণ কারিকুলাম শেষে এজেন্ট, কনসালটেন্ট ও কমপ্লায়েন্স অফিসার প্রত্যেকে সিস্টেম সার্টিফিকেশন পাবেন।"
      >
        <div className="flex flex-wrap gap-1.5">
          <Chip tone="accent">৪ পর্যায় · ২০ সপ্তাহ</Chip>
          <Chip tone="teal">৪ প্রশিক্ষণ মডিউল</Chip>
          <Chip tone="brand">৬ কমপ্লায়েন্স স্তম্ভ</Chip>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-4">
          {ROADMAP_PHASES.map((phase, index) => (
            <Reveal key={phase.phase} dir={index % 2 === 0 ? "left" : "right"} delay={index * 50}>
              <div className="card card-hover h-full p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <Chip tone={index % 2 === 0 ? "accent" : "teal"}>{phase.phase}</Chip>
                  <span className="mono text-[10px] text-mute">{phase.span}</span>
                </div>
                <p className="mt-3 text-[13px] font-bold text-ink">{phase.title}</p>
                <div className="mt-2">
                  <Bar value={(index + 1) * 25} tone="accent" />
                </div>
                <ul className="mt-3 grid gap-2">
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LEARNING_MODULES.map((module, index) => (
            <Reveal key={module.title} dir="zoom" delay={index * 40}>
              <div className="card h-full border-tealx/30 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-bold text-tealx">{module.title}</p>
                  <Chip>{module.duration}</Chip>
                </div>
                <ul className="mt-3 grid gap-2">
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
      </section>

      <section className="border-y border-line bg-surface2 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="টিম ভূমিকা ও দায়িত্ব বিভাজন"
              title="কে কোন স্তর পরিচালনা করবেন"
              subtitle="প্ল্যাটফর্ম প্রযুক্তি সরবরাহ করে, কিন্তু প্রতিটি ভূমিকার জন্য নির্দিষ্ট যোগ্যতা ও দায়িত্ব থাকলে অপারেশন দীর্ঘমেয়াদে টেকসই হয়।"
            />
          </Reveal>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM_ROLES.map((role, index) => (
              <Reveal key={role.role} dir="zoom" delay={index * 35}>
                <div className="card h-full p-4">
                  <p className="text-[12.5px] font-bold text-ink">{role.role}</p>
                  <p className="mt-2 text-[11px] leading-relaxed text-mute">{role.duty}</p>
                  <p className="mono mt-2 text-[10px] text-accent">যোগ্যতা: {role.skill}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Reveal dir="left">
            <SectionTitle
              eyebrow="লিগ্যাল কমপ্লায়েন্স স্তম্ভ"
              title="ছয়টি ক্ষেত্রে কঠোর নীতি মেনে অপারেশন"
              subtitle="আন্তর্জাতিক রিক্রুটিংয়ে সুনাম ও টেকসইতা নির্ভর করে কমপ্লায়েন্সের ওপর। তাই প্রতিটি স্তরে লিখিত নীতি, অডিট ট্রেইল ও প্রতিকার পথ রাখা হয়েছে।"
            />
            <div className="mt-4 grid gap-2.5">
              {COMPLIANCE_ITEMS.map((item, index) => (
                <div key={item.title} className="card flex items-start gap-3 p-3.5">
                  <span className="mono grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-accentsoft text-[10px] font-bold text-accent">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[12px] font-bold text-ink">{item.title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-mute">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal dir="right" delay={60}>
            <SectionTitle
              eyebrow="প্রভাব মাপকাঠি"
              title="রোলআউট শেষে কোন সূচকে উন্নতি প্রত্যাশিত"
              subtitle="নিচের প্রত্যাশিত প্রভাব ধাপ ৪-এ পরিমাপ ও রিপোর্ট করা হয়; কোন সূচক লক্ষ্যের নিচে থাকলে সংশ্লিষ্ট মডিউল পুনর্বিবেচনা করা হয়।"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {IMPACT_KPIS.map((kpi) => (
                <div key={kpi.label} className="card p-4">
                  <p className="mono text-lg font-bold text-tealx">{kpi.value}</p>
                  <p className="mt-1 text-[11.5px] font-bold text-ink">{kpi.label}</p>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-mute">{kpi.note}</p>
                </div>
              ))}
            </div>
            <div className="card mt-4 p-4">
              <p className="text-[12px] font-bold text-ink">পরবর্তী করণীয়</p>
              <p className="mt-2 text-[11px] leading-relaxed text-mute">
                রোডম্যাপ শুরু করতে প্রথমে ডাটাবেজ ও অনবোর্ডিং স্তর যাচাই করুন — অনবোর্ডিং পাতায় একটি টেস্ট ফাইল তৈরি করে দেখুন
                প্রি-ভ্যালিডেশন ইঞ্জিন কীভাবে অসম্পূর্ণ নথি ব্লক করে, তারপর কানবান কনসোলে ধাপ পরিবর্তন করে ইমেইল ট্রিগার
                যাচাই করুন।
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/onboard" className="btn btn-primary">
                  অনবোর্ডিং পরীক্ষা করুন
                </Link>
                <Link href="/dashboard" className="btn btn-brand">
                  কানবান কনসোল
                </Link>
                <Link href="/guide" className="btn">
                  নির্দেশিকা ও জিজ্ঞাসা
                </Link>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <StatTile label="মডিউল মোট সময়" value="১২ ঘণ্টা" tone="accent" />
              <StatTile label="সার্টিফিকেশন স্তর" value="৩ স্তর" tone="teal" hint="বেসিক · অ্যাডভান্সড · অডিটর" />
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
      <BottomNav />
    </div>
  );
}
