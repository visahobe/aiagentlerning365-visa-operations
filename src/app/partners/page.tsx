import { ensureSeeded } from "@/lib/seed";
import { getPartnerOverview, getPlatformSnapshot } from "@/lib/automation";
import { renderTrigger } from "@/lib/email-templates";
import { PartnerPortal } from "@/components/partner-portal";
import { BottomNav, Breadcrumbs, PageHero, SiteFooter, TopNav } from "@/components/site-shell";
import { Chip, Reveal, SectionTitle, StatTile } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  await ensureSeeded();
  const [overview, snapshot] = await Promise.all([getPartnerOverview(), getPlatformSnapshot()]);

  const partners = overview.map((row) => ({
    partner: {
      id: row.partner.id,
      partnerName: row.partner.partnerName,
      countryIso: row.partner.countryIso,
      commissionRate: row.partner.commissionRate,
      agreementPdfUrl: row.partner.agreementPdfUrl,
      profitShareBalance: row.partner.profitShareBalance,
    },
    employer: row.employer
      ? {
          id: row.employer.id,
          companyName: row.employer.companyName,
          countryIso: row.employer.countryIso,
          verificationStatus: row.employer.verificationStatus,
        }
      : undefined,
    pipeline: row.pipeline.map((client) => ({
      id: client.id,
      clientCode: client.clientCode,
      fullName: client.fullName,
      stage: client.stage,
      skill: client.skill,
      contractValue: Number(client.contractValue),
    })),
    stats: {
      total: row.stats.total,
      medical: row.stats.medical,
      permitsIssued: row.stats.permitsIssued,
      ticketed: row.stats.ticketed,
      flightDates: row.stats.flightDates.map((flight) => ({
        clientId: flight.clientId,
        flightDate: flight.flightDate.toISOString(),
        airline: flight.airline,
        pnr: flight.pnr,
      })),
    },
  }));

  const weekLabel = `সপ্তাহ ${Math.ceil(((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86_400_000 + 1) / 7)} · ${new Date().getFullYear()}`;
  const weekly = renderTrigger("employer_weekly", {
    employerName: partners[0]?.employer?.companyName ?? "পার্টনার একাউন্ট",
    weekLabel,
    inProgress: partners.reduce((s, p) => s + p.stats.medical, 0),
    deployedWorkers: partners.reduce((s, p) => s + p.stats.ticketed, 0),
  });

  return (
    <div className="min-h-screen bg-app pb-20 lg:pb-0">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <Breadcrumbs trail={[{ label: "হোম", href: "/" }, { label: "ফরেন পার্টনার পোর্টাল" }]} />
      </div>
      <PageHero
        eyebrow="আন্তর্জাতিক নিয়োগকর্তা ও পার্টনার ইকোসিস্টেম"
        title="রিয়েল-টাইম মোতায়েন ট্র্যাকিং, সাপ্তাহিক রিপোর্ট ও প্রফিট শেয়ারিং"
        subtitle="আন্তর্জাতিক সহযোগী রিক্রুটিং এজেন্সি এবং কর্পোরেট নিয়োগকর্তাদের জন্য উন্মুক্ত এই পোর্টালে কর্মী মোতায়েনের সম্পূর্ণ অগ্রগতি দৃশ্যমান — কতজনের মেডিকেল বা ফিটনেস সম্পন্ন হয়েছে, কার ওয়ার্ক পারমিট ইস্যু হয়েছে এবং কারা ফ্লাইটের টিকিট পেয়েছেন।"
      >
        <div className="flex flex-wrap gap-1.5">
          <Chip tone="accent">{partners.length} পার্টনার একাউন্ট</Chip>
          <Chip tone="teal">মোতায়েন পাইপলাইন {partners.reduce((s, p) => s + p.stats.total, 0)} জন</Chip>
          <Chip tone="brand">ভেরিফাইড নিয়োগকর্তা {snapshot.verifiedEmployers}</Chip>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <PartnerPortal partners={partners} weeklyReport={{ subject: weekly.subject, html: weekly.html }} />
      </section>

      <section className="border-t border-line bg-surface2 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="সাপ্তাহিক ডিসপ্যাচ রিপোর্ট" value={partners.length} tone="brand" hint="প্রতি নিয়োগকর্তাকে স্বয়ংক্রিয় প্রেরণ" />
            <StatTile label="ফ্লাইট শিডিউল সিঙ্ক" value={partners.reduce((s, p) => s + p.stats.flightDates.length, 0)} tone="teal" hint="PNR ও এয়ারলাইন তথ্যসহ" />
            <StatTile label="রেড-টু-ফ্লাই কর্মী" value={partners.reduce((s, p) => s + p.stats.ticketed, 0)} tone="accent" hint="টিকিট ইস্যু সম্পন্ন" />
            <StatTile label="ওয়ার্ক পারমিট ইস্যু" value={partners.reduce((s, p) => s + p.stats.permitsIssued, 0)} tone="teal" hint="সরকারি পোর্টালে অনুমোদিত" />
          </div>
          <Reveal delay={60}>
            <div className="card mt-6 p-4 sm:p-5">
              <SectionTitle
                eyebrow="অংশীদারিত্ব ব্যবস্থাপনা"
                title="অটোমেটেড চুক্তি, আন্তর্জাতিক পেআউট ও সাপ্তাহিক রিপোর্টিং"
                subtitle="কোম্পানির নাম, প্রদেয় রিক্রুটিং ফি, দায়বদ্ধতা ও কমপ্লায়েন্স শর্ত সন্নিবেশ করে সিস্টেম স্বয়ংক্রিয়ভাবে পার্টনারশিপ অ্যাগ্রিমেন্ট পিডিএফ তৈরি করে; যৌথ নিয়োগ কার্যক্রমে আর্থিক মার্জিন ও কমিশন বণ্টনের হিসাব কেন্দ্রীয় ড্যাশবোর্ডে সংরক্ষিত থাকে।"
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { title: "ডিপ্লয়মেন্ট ওভারভিউ", body: "মেডিকেল, ওয়ার্ক পারমিট, টিকিট — প্রতিটি ধাপের সংখ্যা পার্টনার নিজেই যাচাই করতে পারেন।" },
                  { title: "সাপ্তাহিক সামারি", body: "প্রসেসিংয়ে থাকা সকল কর্মীর স্ট্যাটাস সংবলিত একীভূত রিপোর্ট স্বয়ংক্রিয়ভাবে প্রেরিত।" },
                  { title: "প্রফিট শেয়ারিং", body: "কমিশন হার, শেয়ারযোগ্য ভ্যালু, নিট শেয়ার ও সাপ্তাহিক সেটেলমেন্ট প্রস্তাব স্বয়ংক্রিয় হিসাব।" },
                  { title: "ওয়্যার ট্রান্সফার", body: "কেন্দ্রীয় লেজারভিত্তিক ক্লিয়ারিং সাইকেল, প্রতিটি এন্ট্রির অডিট রেফারেন্সসহ।" },
                ].map((item, index) => (
                  <div key={item.title} className="soft p-3.5">
                    <p className="text-[11.5px] font-bold text-accent">{item.title}</p>
                    <p className="mt-1.5 text-[10.5px] leading-relaxed text-mute">{item.body}</p>
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
