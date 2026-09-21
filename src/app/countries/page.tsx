import Link from "next/link";
import Image from "next/image";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { clients, employers } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { CountryExplorer, CountryMatrix } from "@/components/country-explorer";
import { BottomNav, Breadcrumbs, PageHero, SiteFooter, TopNav } from "@/components/site-shell";
import { Bar, Chip, Reveal, SectionTitle, StatTile } from "@/components/ui";
import { COUNTRIES, IMAGES, VISA_TYPES } from "@/lib/reference-data";

export const dynamic = "force-dynamic";

export default async function CountriesPage() {
  await ensureSeeded();
  const [countRows, employerRows] = await Promise.all([
    db.select({ iso: clients.countryIso, count: sql<number>`count(*)::int` }).from(clients).groupBy(clients.countryIso),
    db
      .select({ iso: employers.countryIso, count: sql<number>`count(*)::int` })
      .from(employers)
      .where(sql`${employers.verificationStatus} = 'Verified'`)
      .groupBy(employers.countryIso),
  ]);

  const clientCounts: Record<string, number> = {};
  countRows.forEach((row) => {
    clientCounts[row.iso] = row.count;
  });
  const employerCounts: Record<string, number> = {};
  employerRows.forEach((row) => {
    employerCounts[row.iso] = row.count;
  });

  return (
    <div className="min-h-screen bg-app pb-20 lg:pb-0">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <Breadcrumbs trail={[{ label: "হোম", href: "/" }, { label: "দেশ ও পাথওয়ে" }]} />
      </div>
      <PageHero
        eyebrow="দেশভিত্তিক ভিসা ফ্রেমওয়ার্ক হাব"
        title="আটটি কৌশলগত গন্তব্য — আইনি ভিত্তি, পোর্টাল, ফি ও ঝুঁকি বিশ্লেষণ"
        subtitle="প্রতিটি গন্তব্যের জন্য ওয়ার্ক ভিসা, ভিজিটর ভিসা ও সেলফ-স্পন্সরশিপ — তিনটি পাথওয়ের সম্পূর্ণ তথ্য, ধাপভিত্তিক সময়কাল, বাধ্যতামূলক ডকুমেন্ট চেকলিস্ট, সরকারি ফি নির্দেশিকা, অফিশিয়াল পোর্টাল লিংক এবং ঝুঁকি নোট এক জায়গায়।"
      >
        <div className="flex flex-wrap gap-1.5">
          {COUNTRIES.map((country) => (
            <Chip key={country.iso3} tone="brand">
              {country.flag} {country.nameBn} · {clientCounts[country.iso3] ?? 0} ফাইল
            </Chip>
          ))}
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <CountryExplorer countries={COUNTRIES} clientCounts={clientCounts} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <Reveal>
          <SectionTitle
            eyebrow="তুলনামূলক ম্যাট্রিক্স"
            title="আট দেশের পাশাপাশি প্রযুক্তিগত ও আইনি তুলনা"
            subtitle="কোন দেশে কোন ধাপে কত সময় লাগে এবং কোন পোর্টালে কাজ হয় — এক নজরে তুলনা করুন। প্রতিটি সারিতে ক্লিক করে বিস্তারিত পাতায় যান।"
          />
        </Reveal>
        <div className="mt-6">
          <CountryMatrix countries={COUNTRIES} />
        </div>
      </section>

      <section className="border-y border-line bg-surface2 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="প্রক্রিয়াকরণের বাস্তব চিত্র"
              title="নির্দেশক সময়কাল বনাম আমাদের ট্র্যাক রেকর্ড"
              subtitle="সরকারি আইনি সময়সীমা ও আমাদের বাস্তব প্রসেসিং উইন্ডো তুলনা করা হয়েছে। সরকারি ছুটি, কনস্যুলার স্লট সংকট বা অতিরিক্ত ডকুমেন্ট চাওয়া হলে সময় বাড়তে পারে।"
            />
          </Reveal>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {COUNTRIES.map((country, index) => (
              <Reveal key={country.iso3} dir={index % 2 === 0 ? "left" : "right"} delay={index * 30}>
                <div className="card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[13px] font-bold text-ink">
                      {country.flag} {country.nameBn}
                      <span className="ml-2 text-[11px] font-medium text-mute">{country.processingWindow}</span>
                    </p>
                    <Chip tone="teal">ভেরিফাইড এমপ্লয়ার {employerCounts[country.iso3] ?? 0}</Chip>
                  </div>
                  <div className="mt-2.5">
                    <Bar value={country.avgMaxDays} max={90} tone="brand" />
                  </div>
                  <div className="mono mt-2 flex flex-wrap gap-3 text-[10px] text-mute">
                    <span>সর্বনিম্ন {country.avgMinDays} দিন</span>
                    <span>সর্বোচ্চ {country.avgMaxDays} দিন</span>
                    <span className="text-accent">ভলিউম শেয়ার {country.volumeShare}%</span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-mute">{country.govFeeBn}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <Link href={`/countries/${country.iso3.toLowerCase()}`} className="btn !px-3 !py-1.5 text-[10.5px]">
                      বিস্তারিত পাতা →
                    </Link>
                    <a href={country.portalUrl} target="_blank" rel="noreferrer" className="btn !px-3 !py-1.5 text-[10.5px]">
                      পোর্টাল ↗
                    </a>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <Reveal dir="left">
            <SectionTitle
              eyebrow="পাথওয়ে নির্বাচনের নিয়ম"
              title="কার জন্য কোন পাথওয়ে উপযুক্ত"
              subtitle="ভিসা ক্যাটাগরি শুধু ফি ভিন্ন করে না — ডকুমেন্ট সেট, সময়কাল, ঝুঁকি প্রোফাইল ও কমিশন কাঠামোতেও পার্থক্য তৈরি করে।"
            />
            <div className="mt-5 grid gap-3">
              {VISA_TYPES.map((visa) => (
                <div key={visa.code} className="card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12.5px] font-bold text-ink">
                      <span className="mono mr-2 text-accent">{visa.code}</span>
                      {visa.labelBn}
                    </p>
                    <Chip tone="teal">SLA {visa.slaDays} কার্যদিবস</Chip>
                  </div>
                  <p className="body-text mt-2 text-[11.5px]">{visa.description}</p>
                  <div className="mono mt-2 flex flex-wrap gap-3 text-[10px]">
                    <span className="text-mute">
                      সেবা ফি <span className="text-ink">৳{Number(visa.baseProcessingFee).toLocaleString("en-US")}</span>
                    </span>
                    <span className="text-mute">
                      কমিশন <span className="text-tealx">৳{Number(visa.affiliateCommission).toLocaleString("en-US")}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal dir="right" delay={70}>
            <div className="card overflow-hidden">
              <Image src={IMAGES.map} alt="প্রতিটি গন্তব্যের ভৌগোলিক অবস্থান" width={1200} height={627} unoptimized className="h-52 w-full object-cover" />
              <div className="grid gap-3 p-4 sm:p-5">
                <p className="text-[12px] font-bold text-ink">মোট সক্রিয় ফাইল বিতরণ</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {COUNTRIES.map((country) => (
                    <div key={country.iso3} className="soft flex items-center justify-between px-3 py-2">
                      <span className="text-[11.5px] text-mute">
                        {country.flag} {country.nameBn}
                      </span>
                      <span className="mono text-[11.5px] font-bold text-accent">{clientCounts[country.iso3] ?? 0}</span>
                    </div>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <StatTile label="মোট নথিভুক্ত ফাইল" value={countRows.reduce((s, r) => s + r.count, 0)} tone="brand" />
                  <StatTile label="মোট ভেরিফাইড নিয়োগকর্তা" value={employerRows.reduce((s, r) => s + r.count, 0)} tone="teal" />
                </div>
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
