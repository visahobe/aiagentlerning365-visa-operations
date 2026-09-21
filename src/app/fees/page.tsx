import Link from "next/link";
import { ensureSeeded } from "@/lib/seed";
import { BottomNav, Breadcrumbs, PageHero, SiteFooter, TopNav } from "@/components/site-shell";
import { Bar, Chip, Reveal, SectionTitle, StatTile } from "@/components/ui";
import { BRAND, COUNTRIES, VISA_TYPES } from "@/lib/reference-data";

export const dynamic = "force-dynamic";

const PAYMENT_STAGES = [
  {
    stage: "ধাপ ১ — বুকিং অ্যাডভান্স",
    share: "৩০%",
    timing: "ফাইল ওপেন ও ডকুমেন্ট প্রি-ভ্যালিডেশনের সময়",
    method: "বিকাশ / নগদ / করপোরেট ব্যাংক",
    deliverable: "ইউনিক ক্লায়েন্ট আইডি, স্বাগতম ইমেইল, প্রাথমিক ইনভয়েস",
  },
  {
    stage: "ধাপ ২ — ওয়ার্ক পারমিট / দূতাবাস সাবমিশন",
    share: "৪০%",
    timing: "সরকারি পোর্টালে পারমিট আবেদন বা দূতাবাসে ফাইল জমার সময়",
    method: "ব্যাংক ট্রান্সফার / অনলাইন গেটওয়ে",
    deliverable: "গভর্নমেন্ট ট্র্যাকিং কোড, সাবমিশন নিশ্চিতকরণ ইমেইল",
  },
  {
    stage: "ধাপ ৩ — ভিসা স্ট্যাম্পিং পরবর্তী বকেয়া",
    share: "৩০%",
    timing: "ভিসা অনুমোদন ও পাসপোর্ট হস্তান্তরের পর",
    method: "যেকোনো অনুমোদিত চ্যানেল",
    deliverable: "ফাইনাল ইনভয়েস, ডিপ্লয়মেন্ট ব্রিফিং ও ফ্লাইট নোটিশ",
  },
];

const ADDITIONAL = [
  { title: "সরকারি ফি (পাস-থ্রু)", body: "ভিসা ফি, ওয়ার্ক পারমিট ফি, স্ট্যাম্পিং, বায়োমেট্রিক ও মেডিকেল টেস্ট ফি সরাসরি সরকারি স্ল্যাব অনুযায়ী এবং অফিশিয়াল রসিদসহ নিষ্পন্ন হয়।" },
  { title: "ডকুমেন্ট অনুবাদ ও নোটারি", body: "আইনি অনুবাদ, নোটারি অ্যাটেস্টেশন ও দূতাবাস সত্যায়নের প্রকৃত খরচ আলাদা মোডে হিসাবভুক্ত হয়।" },
  { title: "কুরিয়ার ও লজিস্টিকস", body: "পাসপোর্ট ও মূল অনুমতিপত্র কুরিয়ার ট্র্যাকিংসহ প্রেরণ — প্রতিটি ধাপে পিকআপ কোড সংরক্ষিত।" },
];

export default async function FeesPage() {
  await ensureSeeded();

  return (
    <div className="min-h-screen bg-app pb-20 lg:pb-0">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <Breadcrumbs trail={[{ label: "হোম", href: "/" }, { label: "ফি ও পেমেন্ট" }]} />
      </div>
      <PageHero
        eyebrow="ফি, প্যাকেজ ও পেমেন্ট কাঠামো"
        title="তিন ধাপে পরিশোধ — সম্পূর্ণ স্বচ্ছ ইনভয়েস ও লেজারভিত্তিক লেনদেন"
        subtitle="মোট প্যাকেজ ফি বুকিং অ্যাডভান্স, ওয়ার্ক পারমিট বা দূতাবাস সাবমিশন অনুমোদন ফি এবং ভিসা স্ট্যাম্পিং পরবর্তী অবশিষ্ট বকেয়া — এই তিন ধাপে নিয়ন্ত্রিত। প্রতিটি লেনদেনের সাথে সিস্টেম ইনভয়েস জেনারেট করে ক্লায়েন্ট ও অ্যাডমিনকে স্বয়ংক্রিয়ভাবে প্রেরণ করে।"
      >
        <div className="flex flex-wrap gap-1.5">
          <Chip tone="accent">bKash এপিআই সিঙ্ক</Chip>
          <Chip tone="teal">নগদ ও করপোরেট ব্যাংক</Chip>
          <Chip tone="brand">Due = মোট − (অ্যাডভান্স + ইন্টেরিম)</Chip>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {VISA_TYPES.map((visa, index) => (
            <Reveal key={visa.code} dir={index === 1 ? "zoom" : index === 0 ? "left" : "right"} delay={index * 50}>
              <div className="card h-full border-2 !border-brand2/30 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <Chip tone="accent">{visa.code}</Chip>
                  <Chip tone="teal">{visa.shortBn}</Chip>
                </div>
                <p className="mono mt-3 text-xl font-bold text-ink">৳{Number(visa.baseProcessingFee).toLocaleString("en-US")}</p>
                <p className="mt-1 text-[11px] text-mute">{visa.labelBn}</p>
                <p className="body-text mt-2.5 text-[11.5px]">{visa.description}</p>
                <div className="mt-3 grid gap-2">
                  {PAYMENT_STAGES.map((stage, stageIndex) => (
                    <div key={stage.stage} className="soft flex items-center justify-between px-3 py-2">
                      <p className="text-[10.5px] text-mute">
                        ধাপ {stageIndex + 1} — {stage.share}
                      </p>
                      <p className="mono text-[11px] font-bold text-accent">
                        ৳{Math.round((Number(visa.baseProcessingFee) * [0.3, 0.4, 0.3][stageIndex])).toLocaleString("en-US")}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t border-line pt-3">
                  <p className="text-[10.5px] text-mute">
                    অ্যাফিলিয়েট কমিশন{" "}
                    <span className="mono font-bold text-tealx">৳{Number(visa.affiliateCommission).toLocaleString("en-US")}</span> · SLA{" "}
                    {visa.slaDays} কার্যদিবস
                  </p>
                </div>
                <Link href="/onboard" className="btn btn-primary mt-4 w-full">
                  এই ট্র্যাকে ফাইল খুলুন
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {PAYMENT_STAGES.map((stage, index) => (
            <Reveal key={stage.stage} delay={index * 50}>
              <div className="card h-full p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[12.5px] font-bold text-ink">{stage.stage}</p>
                  <Chip tone="brand">{stage.share}</Chip>
                </div>
                <div className="mt-2.5">
                  <Bar value={Number(stage.share.replace("%", ""))} tone={index === 1 ? "teal" : "accent"} />
                </div>
                <div className="mt-3 grid gap-1.5 text-[11px]">
                  <p className="text-mute">
                    <span className="font-bold text-ink">সময়: </span>
                    {stage.timing}
                  </p>
                  <p className="text-mute">
                    <span className="font-bold text-ink">মাধ্যম: </span>
                    {stage.method}
                  </p>
                  <p className="text-mute">
                    <span className="font-bold text-ink">ডেলিভারেবল: </span>
                    {stage.deliverable}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface2 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="প্যাকেজে কী অন্তর্ভুক্ত"
              title="সেবা ফি, সরকারি ফি ও অতিরিক্ত খরচ পৃথকভাবে হিসাবভুক্ত"
              subtitle="কোনো লুকানো চার্জ নেই — প্রতিটি খরচের ধরন, স্ল্যাব ও রসিদ কেন্দ্রীয় লেজারে সংরক্ষিত থাকে এবং ক্লায়েন্ট তার ট্র্যাকিং পাতায় দেখতে পারেন।"
            />
          </Reveal>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "ডকুমেন্ট যাচাই ও প্রি-ভ্যালিডেশন", body: "OCR/MRZ স্ক্যান, ICAO ছবি ফিল্টার, QR অডিট ও ব্যাংক স্টেটমেন্ট বিশ্লেষণ — প্যাকেজের অন্তর্ভুক্ত।" },
              { title: "ফাইল প্রস্তুতি ও অনুবাদ সমন্বয়", body: "সিভি, কভার লেটার, ডকুমেন্ট সেট সাজানো এবং অনুবাদ/নোটারি প্রক্রিয়ার সমন্বয়।" },
              { title: "পোর্টাল সাবমিশন ও ট্র্যাকিং", body: "সরকারি পোর্টালে এজেন্ট সাবমিশন, ট্র্যাকিং কোড সংরক্ষণ এবং দৈনিক স্ট্যাটাস সিঙ্ক।" },
              { title: "ইমেইল ও ড্যাশবোর্ড রিপোর্ট", body: "আটটি ইভেন্ট-ভিত্তিক ইমেইল, ট্র্যাকিং পেজ ও ধাপ-প্রমাণ রিপোর্ট — কোনো অতিরিক্ত ফি ছাড়া।" },
            ].map((item, index) => (
              <Reveal key={item.title} dir="zoom" delay={index * 40}>
                <div className="card h-full p-4">
                  <p className="text-[12px] font-bold text-accent">{item.title}</p>
                  <p className="mt-2 text-[11px] leading-relaxed text-mute">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {ADDITIONAL.map((item) => (
              <div key={item.title} className="card p-4">
                <p className="text-[12px] font-bold text-ink">{item.title}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-mute">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Reveal dir="left">
            <SectionTitle eyebrow="দেশভিত্তিক সরকারি ফি সংকেত" title="গন্তব্য অনুযায়ী আর্থিক প্রমাণ ও ফি" />
            <div className="mt-4 card kb-scroll overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-[11.5px]">
                <thead>
                  <tr className="bg-surface2 text-[10px] tracking-wide text-mute uppercase">
                    <th className="px-3 py-2.5">দেশ</th>
                    <th className="px-3 py-2.5">সরকারি ফি নির্দেশিকা</th>
                    <th className="px-3 py-2.5">ব্যাংক প্রমাণ</th>
                  </tr>
                </thead>
                <tbody>
                  {COUNTRIES.map((country) => (
                    <tr key={country.iso3} className="border-t border-line align-top">
                      <td className="px-3 py-2.5 font-bold text-ink">
                        {country.flag} {country.nameBn}
                      </td>
                      <td className="px-3 py-2.5 text-mute">{country.govFeeBn}</td>
                      <td className="px-3 py-2.5 text-mute">{country.bankProofBn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
          <Reveal dir="right" delay={60}>
            <SectionTitle eyebrow="ইনভয়েস ও রসিদ সিস্টেম" title="প্রতিটি লেনদেনের ডিজিটাল প্রমাণ" />
            <div className="mt-4 grid gap-2.5">
              {[
                ["ইনভয়েস নম্বর ফরম্যাট", "WVC-INV-[সাল]-[ক্রমিক] — ট্র্যাকিং আইডির সাথে সংযুক্ত ও অনন্য"],
                ["পেমেন্ট মেথড এনাম", "bKash / Nagad / Bank — প্রতিটি ট্রানজ্যাকশন রেফারেন্স সংরক্ষিত"],
                ["পেমেন্ট ধাপ এনাম", "Advance / Stage_2 / Final — ধাপ ছাড়া অতিরিক্ত চার্জ নেওয়া হয় না"],
                ["অ্যাডমিন কনসোল", "ক্লায়েন্ট বকেয়া, অ্যাফিলিয়েট ওয়ালেট ও পার্টনার শেয়ার এক প্যানেলে"],
                ["পুনঃপরিশোধ নীতি", "কোনো ধাপে অতিরিক্ত ডকুমেন্ট বা কনস্যুলার ফি প্রয়োজন হলে আগে অনুমোদন, পরে চার্জ"],
              ].map(([label, value]) => (
                <div key={label} className="card p-3.5">
                  <p className="text-[11.5px] font-bold text-ink">{label}</p>
                  <p className="mono mt-1 text-[10.5px] leading-relaxed text-mute">{value}</p>
                </div>
              ))}
            </div>
            <div className="card mt-4 p-4">
              <p className="text-[11px] text-mute">
                বিস্তারিত জানতে কল করুন{" "}
                <span className="mono font-bold text-ink">{BRAND.phone}</span> অথবা ইমেইল করুন{" "}
                <span className="mono font-bold text-tealx">{BRAND.emailAccounts}</span>
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <StatTile label="অফিস সময়" value={BRAND.hoursBn} tone="brand" />
                <StatTile label="সার্ভিস পোর্টাল" value={BRAND.portal} tone="teal" />
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
