import { ensureSeeded } from "@/lib/seed";
import { getAutomationFeed, getPlatformSnapshot } from "@/lib/automation";
import { AutomationConsole } from "@/components/automation-console";
import { BottomNav, Breadcrumbs, PageHero, SiteFooter, TopNav } from "@/components/site-shell";
import { Chip, Reveal, SectionTitle, StatTile } from "@/components/ui";
import { AUTOMATION_SCHEDULE, COUNTRIES, TOOL_STACK } from "@/lib/reference-data";

export const dynamic = "force-dynamic";

const AGENT_FUNCTIONS = [
  {
    signature: "apply_work_permit(country, employer_id, client_id)",
    returns: "{ portal_session, form_fields[], attachments[], tracking_slip }",
    detail: "নিয়োগকর্তার ট্যাক্স ডাটা ও ক্লায়েন্টের ডকুমেন্ট মেটাডাটা পড়ে পোর্টালের সংশ্লিষ্ট ফিল্ডে পুশ করে, আবেদন ফি সাবমিট করে এবং ট্র্যাকিং স্লিপ ডাউনলোড করে সিআরএমে সংযুক্ত করে।",
  },
  {
    signature: "scrape_visa_status(passport_no, gov_tracking_code)",
    returns: "{ stage, raw_response, synced_at }",
    detail: "পাসপোর্ট নম্বর ও রেফারেন্স কোড পোর্টালের স্ট্যাটাস চেক পেজে ইনজেক্ট করে সর্বশেষ অবস্থান স্ক্র্যাপ করে এবং রিয়েল-টাইমে ডাটাবেজে সিঙ্ক করে।",
  },
  {
    signature: "monitor_appointment_slots(iso3, tier)",
    returns: "{ slots_found[], locked_client_ids[] }",
    detail: "তিন শিফটে (০৯:০০ / ১৪:০০ / ২১:০০ BST) ক্যালেন্ডার ডম ট্রি স্ক্যান করে নতুন স্লট শনাক্ত করলে ওয়েটিং পুলের প্রার্থীর জন্য তাৎক্ষণিক লক করে।",
  },
  {
    signature: "screen_employer(tax_id, trade_license_no, website)",
    returns: "{ verification_status, blacklist_hits[], domain_flag }",
    detail: "ট্যাক্স আইডি ও লাইসেন্স নম্বর ব্ল্যাকলিস্ট ডাটাবেজে ক্রস-ম্যাচ করে; সন্দেহজনক ডোমেইন প্যাটার্ন ধরা পড়লে ডিমান্ড স্থগিত ও অ্যাডমিন অ্যালার্ট।",
  },
  {
    signature: "dispatch_email(trigger_type, context)",
    returns: "{ subject, recipient, sent_status }",
    detail: "ইনলাইন CSS টেবিল টেমপ্লেটে ডাইনামিক ভ্যারিয়েবল বসিয়ে ইমেইল প্রস্তুত করে, প্রেরণ করে এবং ডিসপ্যাচ লগে রেকর্ড রাখে।",
  },
  {
    signature: "credit_affiliate_commission(client_id, visa_code)",
    returns: "{ amount, wallet_balance_after }",
    detail: "ভিসা অনুমোদনের ইভেন্টে কমিশন রেকর্ড তৈরি করে, ওয়ালেট ব্যালেন্স আপডেট করে এবং এজেন্টকে নিশ্চিতকরণ ইমেইল পাঠায়।",
  },
];

export default async function AutomationPage() {
  await ensureSeeded();
  const [feed, snapshot] = await Promise.all([getAutomationFeed(16), getPlatformSnapshot()]);
  const jobs = feed.map((job) => ({ ...job, startedAt: job.startedAt.toISOString() }));

  return (
    <div className="min-h-screen bg-app pb-20 lg:pb-0">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <Breadcrumbs trail={[{ label: "হোম", href: "/" }, { label: "এআই এজেন্ট কনসোল" }]} />
      </div>
      <PageHero
        eyebrow="ব্রাউজার এআই এজেন্ট ও হেডলেস অটোমেশন কনসোল"
        title="আট দেশের সরকারি পোর্টালে সমান্তরাল ব্রাউজার সেশন ও স্বয়ংক্রিয় সাবমিশন"
        subtitle="হেডলেস Chromium ক্লাস্টার আইসোলেটেড ব্রাউজার ইনস্ট্যান্সে সমান্তরাল থ্রেড পরিচালনা করে। প্রতিটি পোর্টালের জন্য স্বতন্ত্র সেশন কুকিজ, লোকাল স্টোরেজ স্টেট ও ডাইনামিক আইপি রোটেশন সংরক্ষিত থাকে, যা ক্লাউডফেয়ার বা অ্যান্টি-বট ফিল্টার এড়িয়ে স্বয়ংক্রিয় কাজ সম্পাদনে সক্ষম করে। নিচের ‘সাইকেল চালান’ বোতাম দিয়ে বাস্তব ওয়ার্কফ্লো ট্রিগার করুন।"
      >
        <div className="flex flex-wrap gap-1.5">
          <Chip tone="accent">মোট এক্সিকিউশন {snapshot.automationJobs}</Chip>
          <Chip tone="teal">ইমেইল ডিসপ্যাচ {snapshot.emailsDispatched}</Chip>
          <Chip tone="brand">তিন শিফট: ০৯:০০ · ১৪:০০ · ২১:০০ BST</Chip>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <AutomationConsole
          initialFeed={jobs}
          snapshot={{
            automationJobs: snapshot.automationJobs,
            emailsDispatched: snapshot.emailsDispatched,
            validationPassRate: snapshot.validationPassRate,
            approved: snapshot.approved,
          }}
        />
      </section>

      <section className="border-y border-line bg-surface2 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="এজেন্ট ফাংশন কনট্রাক্ট"
              title="ছয়টি মূল অটোমেশন ফাংশন ও তাদের রিটার্ন স্ট্রাকচার"
              subtitle="প্রতিটি ফাংশন স্বাধীনভাবে টেস্টযোগ্য, ডাকার আগে ও পরে অডিট লগ তৈরি হয় এবং ব্যর্থ হলে রিট্রাই পলিসি ও এস্কেলেশন প্রোটোকল প্রযোজ্য হয়।"
            />
          </Reveal>
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {AGENT_FUNCTIONS.map((fn, index) => (
              <Reveal key={fn.signature} dir={index % 2 === 0 ? "left" : "right"} delay={index * 40}>
                <div className="card h-full p-4">
                  <code className="mono block text-[11px] font-bold break-words text-tealx">{fn.signature}</code>
                  <code className="mono mt-1.5 block text-[10px] break-words text-accent">→ {fn.returns}</code>
                  <p className="mt-2 text-[11px] leading-relaxed text-mute">{fn.detail}</p>
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
              eyebrow="টাস্ক সময়সূচি"
              title="কখন কোন এজেন্ট কাজ করে"
              subtitle="সময়সূচি বাংলাদেশ মান সময় অনুযায়ী নির্ধারিত; গন্তব্য দেশের অফিস আওয়ার ও পোর্টাল মেইনটেন্যান্স উইন্ডো বিবেচনায় স্লট নির্বাচন করা হয়েছে।"
            />
            <div className="mt-4 grid gap-3">
              {AUTOMATION_SCHEDULE.map((task) => (
                <div key={task.task} className="card p-4">
                  <p className="text-[12.5px] font-bold text-ink">{task.task}</p>
                  <p className="mono mt-1.5 text-[10.5px] text-accent">{task.trigger}</p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-mute">মেকানিজম: {task.mechanism}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-tealx">ফলাফল: {task.outcome}</p>
                </div>
              ))}
            </div>
            <div className="card mt-4 p-4">
              <p className="text-[11px] font-bold tracking-wide text-accent uppercase">ক্যাপচা ও অ্যান্টি-বট এস্কেলেশন</p>
              <ul className="mt-2.5 grid gap-1.5">
                {[
                  "প্রথম ব্যর্থতায় প্রক্সি রোটেশন ও কুকি রিফ্রেশ",
                  "দ্বিতীয় ব্যর্থতায় কার্যকর স্ট্র্যাটেজি সুইচ (রিকোয়েস্ট হেডার হিউম্যানাইজেশন)",
                  "তৃতীয় ব্যর্থতায় ক্যাপচা সলভিং সার্ভিসে কর্তৃত্ব হস্তান্তর",
                  "চতুর্থ ব্যর্থতায় জব স্থগিত, অ্যাডমিন অ্যালার্ট ও ম্যানুয়াল টাস্ক তৈরি",
                ].map((rule, index) => (
                  <li key={rule} className="flex gap-2 text-[11px] leading-relaxed text-mute">
                    <span className="mono text-accent">{index + 1}.</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal dir="right" delay={60}>
            <SectionTitle eyebrow="দেশভিত্তিক সেশন প্রোফাইল" title="আট পোর্টালের জন্য আলাদা সেশন কনফিগারেশন" />
            <div className="mt-4 grid gap-2.5">
              {COUNTRIES.map((country) => (
                <div key={country.iso3} className="card p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12px] font-bold text-ink">
                      {country.flag} {country.nameBn}
                    </p>
                    <Chip tone="brand">{country.iso3} প্রোফাইল</Chip>
                  </div>
                  <p className="mono mt-1.5 text-[10px] break-words text-mute">{country.adminPortal}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {country.automationSteps.slice(0, 3).map((step) => (
                      <span key={step} className="rounded-lg border border-line bg-surface2 px-2 py-1 text-[9.5px] text-mute">
                        {step}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile label="স্লট বুকিং সাফল্য" value="৩×২৪ / দিন" tone="accent" hint="তিন শিফটে DOM মনিটরিং" />
              <StatTile label="রিট্রাই সাকসেস রেট" value="৯৬.৪%" tone="teal" hint="প্রক্সি ও স্ট্র্যাটেজি সুইচিংসহ" />
            </div>
          </Reveal>
        </div>

        <Reveal delay={70}>
          <div className="card mt-6 p-4 sm:p-5">
            <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">এজেন্টে ব্যবহৃত টুলস</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {TOOL_STACK.map((tool) => (
                <div key={tool.name} className="soft p-3">
                  <p className="mono text-[11px] font-bold text-ink">{tool.name}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-mute">{tool.roleBn}</p>
                </div>
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
