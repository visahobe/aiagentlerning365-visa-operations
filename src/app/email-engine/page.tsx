import { ensureSeeded } from "@/lib/seed";
import { getEmailFeed, getPlatformSnapshot } from "@/lib/automation";
import { EmailGallery } from "@/components/email-gallery";
import { BottomNav, Breadcrumbs, PageHero, SiteFooter, TopNav } from "@/components/site-shell";
import { Chip, Reveal, SectionTitle, StatTile } from "@/components/ui";
import { BRAND, EMAIL_TRIGGERS } from "@/lib/reference-data";

export const dynamic = "force-dynamic";

const DELIVERY_RULES = [
  { title: "প্রেরকের কেন্দ্রীয় ঠিকানা", body: `সব ইমেইল ${BRAND.email} থেকে প্রেরিত হয়; অপারেশনাল উত্তর ${BRAND.emailOps} এবং আর্থিক নোটিশ ${BRAND.emailAccounts} থেকে যায়।` },
  { title: "রেসপনসিভ টেবিল আর্কিটেকচার", body: "ইনলাইন CSS সহ HTML টেবিল ফ্রেমওয়ার্ক ব্যবহৃত — মোবাইল ও ডেস্কটপ উভয় ইকোসিস্টেমে শতভাগ সামঞ্জস্যপূর্ণ।" },
  { title: "ডাইনামিক ভ্যারিয়েবল প্রতিস্থাপন", body: "টেমপ্লেটে {{client_id}}, {{gov_code}}, {{commission}} ইত্যাদি প্লেসহোল্ডার ইভেন্ট কনটেক্সট থেকে রিয়েল মান দ্বারা প্রতিস্থাপিত হয়।" },
  { title: "ডেলিভারি ও ব্যর্থতা লগ", body: "প্রতিটি প্রেরণের সাবজেক্ট, প্রাপক, ট্রিগার টাইপ, সময় ও স্ট্যাটাস ডাটাবেজে সংরক্ষিত — ব্যর্থ হলে রিট্রাই কিউ।" },
];

export default async function EmailEnginePage() {
  await ensureSeeded();
  const [feed, snapshot] = await Promise.all([getEmailFeed(28), getPlatformSnapshot()]);
  const rows = feed.map((row) => ({ ...row, sentAt: row.sentAt.toISOString() }));

  return (
    <div className="min-h-screen bg-app pb-20 lg:pb-0">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <Breadcrumbs trail={[{ label: "হোম", href: "/" }, { label: "ইমেইল ইঞ্জিন" }]} />
      </div>
      <PageHero
        eyebrow="এআই ট্রানজ্যাকশনাল ইমেইল অটোমেশন ইঞ্জিন"
        title="আটটি লজিক্যাল ট্রিগার — সম্পূর্ণ রেন্ডারযোগ্য টেমপ্লেট ও ডিসপ্যাচ লগ"
        subtitle="ডাটাবেজে প্রতিটি ইভেন্ট ট্রিগার হওয়ার সাথে সাথে ব্যাকএন্ড মাইক্রোসার্ভিস নির্দিষ্ট টেমপ্লেটে ডাইনামিক ভ্যারিয়েবল প্রতিস্থাপন করে ইমেইল প্রেরণ করে। নিচে প্রতিটি ট্রিগারের বাস্তব রেন্ডার করা রেসপনসিভ প্রিভিউ, HTML সোর্স এবং লাইভ ডিসপ্যাচ লগ দেখা যাচ্ছে।"
      >
        <div className="flex flex-wrap gap-1.5">
          <Chip tone="accent">মোট ডিসপ্যাচ {snapshot.emailsDispatched}</Chip>
          <Chip tone="teal">{EMAIL_TRIGGERS.length} টি ট্রিগার সক্রিয়</Chip>
          <Chip tone="brand">প্রেরক: {BRAND.email}</Chip>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <EmailGallery triggers={EMAIL_TRIGGERS} feed={rows} />
      </section>

      <section className="border-y border-line bg-surface2 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="ট্রিগার তালিকা ও লজিক্যাল কাজ"
              title="কোন ইভেন্টে কে ইমেইল পায় ও কী তথ্য থাকে"
              subtitle="প্রতিটি ট্রিগারের প্রাপক, সময়, ভ্যারিয়েবল ও লজিক নির্দিষ্ট — ফলে ক্লায়েন্ট, নিয়োগকর্তা ও এজেন্ট প্রত্যেকে সময়মতো সঠিক তথ্য পান।"
            />
          </Reveal>
          <div className="card kb-scroll mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-[11px]">
              <thead>
                <tr className="bg-surface text-[10px] tracking-wide text-mute uppercase">
                  <th className="px-3 py-2.5">ট্রিগার</th>
                  <th className="px-3 py-2.5">প্রাপক</th>
                  <th className="px-3 py-2.5">সাবজেক্ট ফরম্যাট</th>
                  <th className="px-3 py-2.5">ভ্যারিয়েবল</th>
                  <th className="px-3 py-2.5">টাইমিং</th>
                </tr>
              </thead>
              <tbody>
                {EMAIL_TRIGGERS.map((trigger) => (
                  <tr key={trigger.key} className="border-t border-line align-top">
                    <td className="px-3 py-2.5 font-bold text-ink">{trigger.labelBn}</td>
                    <td className="px-3 py-2.5 text-mute">{trigger.recipient}</td>
                    <td className="mono px-3 py-2.5 text-[10px] text-mute">{trigger.subject}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {trigger.variables.map((variable) => (
                          <span key={variable} className="mono rounded-md border border-line bg-surface2 px-1.5 py-0.5 text-[9px] text-brand2">
                            {variable}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-mute">{trigger.timingBn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DELIVERY_RULES.map((rule, index) => (
              <Reveal key={rule.title} dir="zoom" delay={index * 40}>
                <div className="card h-full p-4">
                  <p className="text-[12px] font-bold text-accent">{rule.title}</p>
                  <p className="mt-2 text-[11px] leading-relaxed text-mute">{rule.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="সফল ডিসপ্যাচ" value={rows.filter((r) => r.sentStatus).length} tone="teal" />
            <StatTile label="ব্যর্থ ডিসপ্যাচ" value={rows.filter((r) => !r.sentStatus).length} tone="danger" />
            <StatTile label="সর্বাধিক ব্যবহৃত ট্রিগার" value="onboarding_welcome" tone="brand" />
            <StatTile label="টেমপ্লেট সংস্করণ" value="inline-css-v1" tone="accent" />
          </div>
        </div>
      </section>

      <SiteFooter />
      <BottomNav />
    </div>
  );
}
