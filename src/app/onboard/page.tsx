import { sql } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { OnboardForm } from "@/components/onboard-form";
import { BottomNav, Breadcrumbs, PageHero, SiteFooter, TopNav } from "@/components/site-shell";
import { Chip, Reveal, SectionTitle } from "@/components/ui";
import { COUNTRIES, VALIDATION_MATRIX, VISA_TYPES } from "@/lib/reference-data";

export const dynamic = "force-dynamic";

export default async function OnboardPage() {
  await ensureSeeded();
  const rows = await db
    .select({ iso: clients.countryIso, visa: clients.visaCode, count: sql<number>`count(*)::int` })
    .from(clients)
    .where(sql`extract(year from ${clients.createdAt}) = ${new Date().getFullYear()}`)
    .groupBy(clients.countryIso, clients.visaCode);

  const nextSequence: Record<string, number> = {};
  rows.forEach((row) => {
    nextSequence[`${row.iso}-${row.visa}`] = row.count + 1;
  });

  return (
    <div className="min-h-screen bg-app pb-20 lg:pb-0">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <Breadcrumbs trail={[{ label: "হোম", href: "/" }, { label: "ক্লায়েন্ট অনবোর্ডিং" }]} />
      </div>
      <PageHero
        eyebrow="ক্লায়েন্ট অনবোর্ডিং মডিউল"
        title="চার ধাপে ফাইল ইনটেক — প্রি-ভ্যালিডেশন চালিয়ে তাৎক্ষণিক ইউনিক আইডি"
        subtitle="নাম, পাসপোর্ট নম্বর, ফোন, বয়স, কাজের দক্ষতা, গন্তব্য দেশ ও ভিসা শ্রেণি নির্বাচন করে নথি আপলোড করুন। সাবমিশনের আগেই MRZ মেয়াদ, ICAO ছবি, পুলিশ ক্লিয়ারেন্স ও আর্থিক প্রমাণ — চার স্তরের ভ্যালিডেশন সম্পন্ন হবে এবং মানদণ্ড না মিললে সিস্টেম ফাইল ব্লক করবে।"
      >
        <div className="flex flex-wrap gap-1.5">
          <Chip tone="accent">আইডি ফরম্যাট: WVC-[দেশ]-[ভিসা]-[সাল]-[ক্রমিক]</Chip>
          <Chip tone="teal">৬ স্তরের ডকুমেন্ট ফিল্টার</Chip>
          <Chip tone="brand">৩ ধাপের পেমেন্ট লেজার</Chip>
          <Chip tone="accent">স্বয়ংক্রিয় স্বাগতম ইমেইল</Chip>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <OnboardForm nextSequence={nextSequence} />
      </section>

      <section className="border-t border-line bg-surface2 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="স্বয়ংক্রিয় ব্লকিং বিধি"
              title="কোন পরিস্থিতিতে সিস্টেম ফাইল গ্রহণ করে না"
              subtitle="আন্তর্জাতিক ইমিগ্রেশন নিয়ম ও দূতাবাসের শর্ত অনুযায়ী নির্দিষ্ট মানদণ্ড পূরণ না হলে প্ল্যাটফর্ম পোর্টালে সাবমিশন আটকে দেয় এবং ক্লায়েন্টকে রিজেকশন বা হালনাগাদ সতর্কবার্তা প্রদর্শন করে।"
            />
          </Reveal>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {VALIDATION_MATRIX.map((row, index) => (
              <Reveal key={row.doc} dir="zoom" delay={index * 45}>
                <div className="card h-full p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12.5px] font-bold text-ink">{row.doc}</p>
                    <Chip tone={row.severity === "ব্লকিং" ? "danger" : "accent"}>{row.severity}</Chip>
                  </div>
                  <p className="mono mt-2 text-[10px] text-mute">{row.parameter}</p>
                  <p className="mono mt-1.5 text-[10.5px] text-tealx">{row.standard}</p>
                  <p className="mt-2 text-[11px] leading-relaxed text-mute">⚠ {row.reaction}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={60}>
            <div className="card mt-6 p-4 sm:p-5">
              <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">ভিসা ক্যাটাগরি ও দেশভিত্তিক প্রক্রিয়াকরণ সময়</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {VISA_TYPES.map((visa) => (
                  <div key={visa.code} className="soft p-3">
                    <p className="text-[12px] font-bold text-ink">{visa.labelBn}</p>
                    <p className="mono mt-1 text-[10.5px] text-accent">৳{Number(visa.baseProcessingFee).toLocaleString("en-US")} · SLA {visa.slaDays} দিন</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {COUNTRIES.map((country) => (
                  <div key={country.iso3} className="soft p-3">
                    <p className="text-[12px] font-bold text-ink">
                      {country.flag} {country.nameBn}
                    </p>
                    <p className="mono mt-1 text-[10px] text-mute">{country.processingWindow}</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-mute">{country.documents.length} টি বাধ্যতামূলক ডকুমেন্ট</p>
                  </div>
                ))}
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
