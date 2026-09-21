import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { clients, demands, employers } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { BottomNav, Breadcrumbs, SiteFooter, TopNav } from "@/components/site-shell";
import { Accordion, Bar, Chip, Reveal, SectionTitle, StatTile } from "@/components/ui";
import { COUNTRIES, IMAGES, VISA_TYPES } from "@/lib/reference-data";

export const dynamic = "force-dynamic";

export default async function CountryDetailPage({ params }: { params: Promise<{ iso: string }> }) {
  await ensureSeeded();
  const { iso } = await params;
  const country = COUNTRIES.find((c) => c.iso3.toLowerCase() === iso.toLowerCase());
  if (!country) notFound();

  const [clientRows, employerRows, demandRows] = await Promise.all([
    db.select().from(clients).where(eq(clients.countryIso, country.iso3)),
    db.select().from(employers).where(eq(employers.countryIso, country.iso3)),
    db.select().from(demands),
  ]);

  const employerIds = new Set(employerRows.map((e) => e.id));
  const countryDemands = demandRows.filter((d) => employerIds.has(d.employerId));
  const openQuota = countryDemands.filter((d) => d.status === "Open").reduce((s, d) => s + d.requiredWorkers, 0);
  const others = COUNTRIES.filter((c) => c.iso3 !== country.iso3);

  const pathwayBlocks = [
    {
      title: "ওয়ার্ক ভিসা পাথওয়ে",
      icon: "🛠️",
      body: country.workMethod,
      steps: country.workSteps,
      extra: VISA_TYPES[0],
    },
    {
      title: "ভিজিটর ভিসা পাথওয়ে",
      icon: "🧭",
      body: country.visitorCategory,
      steps: country.visitorSteps.map((s, i) => ({ title: `ধাপ ${i + 1}`, detail: s, span: "কনস্যুলার" })),
      extra: VISA_TYPES[1],
    },
    {
      title: "সেলফ-স্পন্সরশিপ পাথওয়ে",
      icon: "🏛️",
      body: country.selfSponsorPathway,
      steps: country.selfSponsorSteps.map((s, i) => ({ title: `ধাপ ${i + 1}`, detail: s, span: "ফরমেশন" })),
      extra: VISA_TYPES[2],
    },
  ];

  return (
    <div className="min-h-screen bg-app pb-20 lg:pb-0">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <Breadcrumbs
          trail={[{ label: "হোম", href: "/" }, { label: "দেশ ও পাথওয়ে", href: "/countries" }, { label: country.nameBn }]}
        />
      </div>

      <section className="spot-bg relative mt-4 overflow-hidden border-b border-line">
        <div className="grid-bg absolute inset-0 opacity-50" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-1.5">
              <Chip tone="accent">প্রক্রিয়াকরণ {country.processingWindow}</Chip>
              <Chip tone="teal">{country.iso3}</Chip>
              <Chip tone="brand">ভলিউম শেয়ার {country.volumeShare}%</Chip>
            </div>
            <h1 className="h1 mt-4 text-ink">
              <span className="mr-3">{country.flag}</span>
              {country.nameBn}
            </h1>
            <p className="mono mt-2 text-[12px] text-mute">{country.nameEn} · রাজধানী {country.capitalBn}</p>
            <p className="body-text mt-4">
              <span className="font-bold text-accent">আইনি ভিত্তি: </span>
              {country.legalBasis}
            </p>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {country.legalRefs.map((ref) => (
                <div key={ref.label} className="card p-3.5">
                  <p className="text-[11.5px] font-bold text-brand2">{ref.label}</p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-mute">{ref.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <Reveal dir="right">
            <div className="card overflow-hidden">
              <Image src={country.image || IMAGES.map} alt={country.nameBn} width={1200} height={627} unoptimized className="h-44 w-full object-cover" />
              <div className="grid gap-2 p-4">
                {[
                  ["মুদ্রা", country.currencyBn],
                  ["ভাষা", country.languageBn],
                  ["সময় অঞ্চল", country.timezoneBn],
                  ["কনস্যুলার রুট", country.missionBn],
                  ["প্রধান খাত", country.demandSectorsBn],
                  ["প্রশাসনিক পোর্টাল", country.adminPortal],
                ].map(([label, value]) => (
                  <div key={label} className="soft px-3 py-2">
                    <p className="text-[10px] font-bold tracking-wide text-mute uppercase">{label}</p>
                    <p className="text-[11.5px] text-ink">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="সক্রিয় ফাইল" value={clientRows.length} tone="brand" />
          <StatTile label="ভেরিফাইড নিয়োগকর্তা" value={employerRows.filter((e) => e.verificationStatus === "Verified").length} tone="teal" />
          <StatTile label="ওপেন চাহিদা কোটা" value={openQuota} tone="accent" hint={`${countryDemands.length} টি ডিমান্ড লেটার`} />
          <StatTile label="বাধ্যতামূলক ডকুমেন্ট" value={country.documents.length} tone="accent" />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {pathwayBlocks.map((pathway, index) => (
            <Reveal key={pathway.title} dir="up" delay={index * 60}>
              <div className="card h-full p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-ink">
                    <span className="mr-1.5">{pathway.icon}</span>
                    {pathway.title}
                  </p>
                  <Chip tone="accent">{pathway.extra.code}</Chip>
                </div>
                <p className="body-text mt-2.5 text-[11.5px]">{pathway.body}</p>
                <div className="mt-3 grid gap-2">
                  {pathway.steps.map((step, stepIndex) => (
                    <div key={`${step.title}-${stepIndex}`} className="soft flex items-start gap-2.5 p-2.5">
                      <span className="mono mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-brand2 text-[9.5px] font-bold text-white">
                        {stepIndex + 1}
                      </span>
                      <div>
                        <p className="text-[11.5px] font-bold text-ink">{step.title}</p>
                        <p className="text-[10.5px] leading-relaxed text-mute">{step.detail}</p>
                        <p className="mono mt-0.5 text-[9.5px] text-tealx">{step.span}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid gap-1.5 border-t border-line pt-3 text-[10.5px]">
                  <p className="text-mute">
                    সেবা ফি <span className="mono text-ink">৳{Number(pathway.extra.baseProcessingFee).toLocaleString("en-US")}</span>
                  </p>
                  <p className="text-mute">
                    অ্যাফিলিয়েট কমিশন{" "}
                    <span className="mono text-tealx">৳{Number(pathway.extra.affiliateCommission).toLocaleString("en-US")}</span>
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface2 py-12">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_1fr]">
          <Reveal dir="left">
            <SectionTitle eyebrow="ডকুমেন্ট চেকলিস্ট" title={`${country.nameBn}-এর জন্য বাধ্যতামূলক নথিসমূহ`} />
            <div className="mt-4 grid gap-2">
              {country.documents.map((doc, index) => (
                <div key={doc} className="card flex items-start gap-2.5 p-3">
                  <span className="mono grid h-5 w-5 shrink-0 place-items-center rounded-md bg-tealsoft text-[9.5px] font-bold text-tealx">
                    {index + 1}
                  </span>
                  <p className="text-[11.5px] leading-relaxed text-mute">{doc}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal dir="right" delay={60}>
            <SectionTitle eyebrow="এজেন্ট অটোমেশন ধাপ" title="ব্রাউজার এজেন্ট কী কী কাজ করে" />
            <div className="mt-4 grid gap-2">
              {country.automationSteps.map((step, index) => (
                <div key={step} className="card flex items-start gap-2.5 p-3">
                  <span className="mono grid h-5 w-5 shrink-0 place-items-center rounded-md bg-accentsoft text-[9.5px] font-bold text-accent">
                    {index + 1}
                  </span>
                  <p className="text-[11.5px] leading-relaxed text-mute">{step}</p>
                </div>
              ))}
            </div>

            <div className="card mt-4 p-4">
              <p className="text-[11px] font-bold tracking-wide text-accent uppercase">ফি ও আর্থিক প্রমাণ নির্দেশিকা</p>
              <div className="mt-3 grid gap-2 text-[11px]">
                <p className="text-mute">{country.govFeeBn}</p>
                <p className="text-mute">{country.serviceFeeBn}</p>
                <p className="text-mute">{country.salaryBenchBn}</p>
                <p className="text-mute">{country.bankProofBn}</p>
              </div>
            </div>

            <div className="card mt-4 border-danger/40 p-4">
              <p className="text-[11px] font-bold tracking-wide text-danger uppercase">ঝুঁকি নোট ও সতর্কতা</p>
              <ul className="mt-3 grid gap-2">
                {country.riskNotes.map((note) => (
                  <li key={note} className="flex gap-2 text-[11px] leading-relaxed text-mute">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card mt-4 p-4">
              <p className="text-[11px] font-bold tracking-wide text-accent uppercase">অফিশিয়াল পোর্টাল ও লিংক</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {country.officialLinks.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="soft block p-3 transition-colors hover:border-accent2">
                    <p className="text-[11.5px] font-bold text-ink">{link.label}</p>
                    <p className="mono mt-0.5 truncate text-[9.5px] text-brand2">{link.url}</p>
                  </a>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Reveal>
          <SectionTitle eyebrow="প্রশ্নোত্তর" title={`${country.nameBn} নিয়ে সচরাচর জিজ্ঞাসা`} />
        </Reveal>
        <div className="mt-5">
          <Accordion items={country.faq} />
        </div>

        <Reveal delay={50}>
          <div className="card mt-8 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[12.5px] font-bold text-ink">অন্য গন্তব্য দেখুন</p>
                <p className="text-[11px] text-mute">প্রতিটি দেশের নিজস্ব আইনি ভিত্তি, সময়কাল ও ঝুঁকি প্রোফাইল রয়েছে</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/countries" className="btn !px-3 !py-1.5 text-[11px]">
                  সব দেশ
                </Link>
                <Link href="/onboard" className="btn btn-primary !px-3 !py-1.5 text-[11px]">
                  {country.nameBn}-এর জন্য ফাইল খুলুন
                </Link>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((other) => (
                <Link key={other.iso3} href={`/countries/${other.iso3.toLowerCase()}`} className="soft p-3 transition-colors hover:border-accent2">
                  <p className="text-[12px] font-bold text-ink">
                    {other.flag} {other.nameBn}
                  </p>
                  <p className="mono mt-1 text-[10px] text-mute">{other.processingWindow}</p>
                  <div className="mt-1.5">
                    <Bar value={other.volumeShare} max={24} tone="brand" />
                  </div>
                </Link>
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
