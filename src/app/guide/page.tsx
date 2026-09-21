import Link from "next/link";
import { ensureSeeded } from "@/lib/seed";
import { BottomNav, Breadcrumbs, PageHero, SiteFooter, TopNav } from "@/components/site-shell";
import { Accordion, Chip, Reveal, SectionTitle, StatTile } from "@/components/ui";
import { BRAND, COUNTRIES, FAQ_GENERAL, GLOSSARY, VALIDATION_MATRIX, VISA_TYPES } from "@/lib/reference-data";

export const dynamic = "force-dynamic";

const STEP_GUIDE = [
  { step: "১. ফাইল ওপেন করুন", detail: "অনবোর্ডিং পাতায় চার ধাপে তথ্য দিন — নাম, পাসপোর্ট, ফোন, বয়স, দক্ষতা, গন্তব্য ও ভিসা শ্রেণি। ফর্মেই লাইভ ভ্যালিডেশন দেখতে পাবেন।", link: "/onboard", cta: "অনবোর্ডিং পাতায় যান" },
  { step: "২. প্রি-ভ্যালিডেশন পাস করুন", detail: "পাসপোর্টের মেয়াদ, ছবির মানদণ্ড, পুলিশ ক্লিয়ারেন্স ও আর্থিক প্রমাণ পাস করলে সিস্টেম ইউনিক আইডি ও অ্যাডভান্স ইনভয়েস তৈরি করবে।", link: "/guide#validation", cta: "ভ্যালিডেশন বিধি দেখুন" },
  { step: "৩. নিয়োগকর্তা ম্যাচিং", detail: "ভেরিফাইড ডিমান্ডের বিপরীতে সিভি উপস্থাপিত হয়; নিয়োগকর্তা সম্মতি দিলে চুক্তিপত্র ও NDA সম্পাদিত হয়।", link: "/employers", cta: "এমপ্লয়ার হাব" },
  { step: "৪. সরকারি পোর্টাল সাবমিশন", detail: "ব্রাউজার এজেন্ট সংশ্লিষ্ট দেশের পোর্টালে ওয়ার্ক পারমিট বা ভিসা আবেদন দাখিল করে এবং ট্র্যাকিং কোড সংরক্ষণ করে।", link: "/automation", cta: "এজেন্ট কনসোল" },
  { step: "৫. দূতাবাস ও স্ট্যাম্পিং", detail: "ফাইল দূতাবাসে জমা হয়, অ্যাপয়েন্টমেন্ট স্লট লক হয় এবং ভিসা সিদ্ধান্ত জানার সাথে সাথে ইমেইল নোটিশ যায়।", link: "/pipeline", cta: "পাইপলাইন দেখুন" },
  { step: "৬. ফ্লাইট ও ডিপ্লয়মেন্ট", detail: "টিকিট ইস্যু, পিকআপ কনফার্মেশন এবং চূড়ান্ত ব্রিফিংসহ যাত্রা — সবকিছু ট্র্যাকিং পাতায় দৃশ্যমান।", link: "/track", cta: "ট্র্যাকিং পাতায় যান" },
];

export default async function GuidePage() {
  await ensureSeeded();

  return (
    <div className="min-h-screen bg-app pb-20 lg:pb-0">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <Breadcrumbs trail={[{ label: "হোম", href: "/" }, { label: "নির্দেশিকা ও জিজ্ঞাসা" }]} />
      </div>
      <PageHero
        eyebrow="ব্যবহার নির্দেশিকা, পরিভাষা ও প্রশ্নোত্তর"
        title="শূন্য থেকে শুরু — ধাপে ধাপে সম্পূর্ণ গাইড"
        subtitle="এই পাতায় রয়েছে ক্লায়েন্ট ভ্রমণপথ (কী করতে হবে, কোন ক্রমে), প্রযুক্তিগত পরিভাষার ব্যাখ্যা, ডকুমেন্ট ভ্যালিডেশনের বিধি, দেশভিত্তিক সংক্ষিপ্ত চেকলিস্ট এবং সবচেয়ে বেশি জিজ্ঞাসিত প্রশ্নের উত্তর।"
      >
        <div className="flex flex-wrap gap-1.5">
          <Chip tone="accent">৬ ধাপে সম্পূর্ণ পথ</Chip>
          <Chip tone="teal">{GLOSSARY.length} টি পরিভাষা</Chip>
          <Chip tone="brand">{FAQ_GENERAL.length} টি প্রশ্নোত্তর</Chip>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Reveal>
          <SectionTitle eyebrow="ক্লায়েন্ট ভ্রমণপথ" title="ছয় ধাপে ফাইল থেকে ফ্লাইট" subtitle="প্রতিটি ধাপে আপনি কী করবেন এবং সিস্টেম আপনার হয়ে কী করবে — দুটোই স্পষ্ট।" />
        </Reveal>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STEP_GUIDE.map((item, index) => (
            <Reveal key={item.step} dir="zoom" delay={index * 40}>
              <div className="card card-hover flex h-full flex-col p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[12.5px] font-bold text-ink">{item.step}</p>
                  <span className="mono text-[10px] text-mute">ধাপ {index + 1}/6</span>
                </div>
                <p className="mt-2 flex-1 text-[11px] leading-relaxed text-mute">{item.detail}</p>
                <Link href={item.link} className="btn mt-3 w-full !py-2 text-[11px]">
                  {item.cta} →
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="validation" className="border-y border-line bg-surface2 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="ডকুমেন্ট ভ্যালিডেশন বিধি"
              title="কোন নথিতে কী যাচাই হয় ও কী প্রতিক্রিয়া আসে"
              subtitle="প্রতিটি ফাইলে ছয়টি স্বয়ংক্রিয় ফিল্টার অপরিহার্যভাবে প্রয়োগ হয়। ব্লকিং মানদণ্ড ব্যর্থ হলে পোর্টালে সাবমিশন আটকে যায়।"
            />
          </Reveal>
          <div className="card kb-scroll mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-[11px]">
              <thead>
                <tr className="bg-surface text-[10px] tracking-wide text-mute uppercase">
                  <th className="px-3 py-2.5">নথি</th>
                  <th className="px-3 py-2.5">যাচাই পদ্ধতি</th>
                  <th className="px-3 py-2.5">গ্রহণযোগ্য মানদণ্ড</th>
                  <th className="px-3 py-2.5">প্রতিক্রিয়া</th>
                  <th className="px-3 py-2.5">ধরন</th>
                </tr>
              </thead>
              <tbody>
                {VALIDATION_MATRIX.map((row) => (
                  <tr key={row.doc} className="border-t border-line align-top">
                    <td className="px-3 py-2.5 font-bold text-ink">{row.doc}</td>
                    <td className="px-3 py-2.5 text-mute">{row.parameter}</td>
                    <td className="mono px-3 py-2.5 text-[10px] text-tealx">{row.standard}</td>
                    <td className="px-3 py-2.5 text-mute">{row.reaction}</td>
                    <td className="px-3 py-2.5">
                      <Chip tone={row.severity === "ব্লকিং" ? "danger" : "accent"}>{row.severity}</Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {VISA_TYPES.map((visa) => (
              <div key={visa.code} className="card p-4">
                <div className="flex items-center justify-between">
                  <Chip tone="accent">{visa.code}</Chip>
                  <Chip tone="teal">SLA {visa.slaDays} দিন</Chip>
                </div>
                <p className="mt-2.5 text-[12px] font-bold text-ink">{visa.labelBn}</p>
                <p className="mono mt-1.5 text-[10px] leading-relaxed text-mute">{visa.stagesBn}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-mute">{visa.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Reveal dir="left">
            <SectionTitle eyebrow="পরিভাষা অভিধান" title="প্রযুক্তিগত ও আইনি শব্দের সহজ ব্যাখ্যা" />
            <div className="mt-4 grid gap-2.5">
              {GLOSSARY.map((item) => (
                <div key={item.term} className="card p-3.5">
                  <p className="text-[12px] font-bold accent-text text-accent">{item.term}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-mute">{item.meaning}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal dir="right" delay={60}>
            <SectionTitle eyebrow="দেশভিত্তিক সংক্ষিপ্ত চেকলিস্ট" title="প্রতিটি গন্তব্যের মূল বাধ্যবাধকতা" />
            <div className="mt-4 grid gap-2.5">
              {COUNTRIES.map((country) => (
                <div key={country.iso3} className="card p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12px] font-bold text-ink">
                      {country.flag} {country.nameBn}
                    </p>
                    <Link href={`/countries/${country.iso3.toLowerCase()}`} className="mono text-[10px] text-brand2 link-underline">
                      বিস্তারিত →
                    </Link>
                  </div>
                  <p className="mono mt-1.5 text-[10px] text-mute">{country.processingWindow} · {country.adminPortal}</p>
                  <ul className="mt-2 grid gap-1">
                    {country.riskNotes.slice(0, 2).map((note) => (
                      <li key={note} className="flex gap-2 text-[10.5px] leading-relaxed text-mute">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent2" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-line bg-surface2 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle eyebrow="প্রশ্নোত্তর" title="সচরাচর জিজ্ঞাসিত প্রশ্নের পূর্ণ উত্তর" />
          </Reveal>
          <div className="mt-6">
            <Accordion items={FAQ_GENERAL} />
          </div>

          <Reveal delay={50}>
            <div className="card mt-6 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[12.5px] font-bold text-ink">আরও সহায়তা প্রয়োজন?</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-mute">{BRAND.addressBn}</p>
                  <p className="text-[11px] text-mute">{BRAND.hoursBn}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="card mono px-3.5 py-2 text-[11px] font-bold text-ink">{BRAND.phone}</span>
                  <span className="card mono px-3.5 py-2 text-[11px] font-bold text-tealx">{BRAND.email}</span>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile label="সাপোর্ট লাইন" value={BRAND.phone2} tone="brand" />
                <StatTile label="অপারেশন ডেস্ক" value={BRAND.emailOps} tone="teal" />
                <StatTile label="অ্যাকাউন্টস" value={BRAND.emailAccounts} tone="accent" />
                <StatTile label="কমপ্লায়েন্স" value={BRAND.emailCompliance} tone="accent" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
      <BottomNav />
    </div>
  );
}
