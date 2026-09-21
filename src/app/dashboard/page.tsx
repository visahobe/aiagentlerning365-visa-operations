import { ensureSeeded } from "@/lib/seed";
import { getAdminConsoleData, getAutomationFeed, getEmailFeed } from "@/lib/automation";
import { AdminConsole, type AdminClientRow } from "@/components/admin-console";
import { BottomNav, Breadcrumbs, PageHero, SiteFooter, TopNav } from "@/components/site-shell";
import { Bar, Chip, Reveal, SectionTitle, StatTile } from "@/components/ui";
import { STAGE_COLUMNS } from "@/lib/reference-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await ensureSeeded();
  const [consoleData, automationFeed, emailFeed] = await Promise.all([
    getAdminConsoleData(),
    getAutomationFeed(8),
    getEmailFeed(10),
  ]);

  const clients: AdminClientRow[] = consoleData.clients.map((client) => ({
    id: client.id,
    clientCode: client.clientCode,
    fullName: client.fullName,
    passportNo: client.passportNo,
    phone: client.phone,
    email: client.email,
    skill: client.skill,
    age: client.age,
    countryIso: client.countryIso,
    visaCode: client.visaCode,
    stage: client.stage,
    contractValue: client.contractValue,
    paidAmount: client.paidAmount,
    dueBalance: client.dueBalance,
    affiliateName: client.affiliateName,
    affiliateDistrict: client.affiliateDistrict,
    employerName: client.employerName,
    jobTitle: client.jobTitle,
    govTrackingCode: client.govTrackingCode,
    governmentPortal: client.governmentPortal,
    scraperStatus: client.scraperStatus,
    appointmentSlot: client.appointmentSlot,
    slaBreach: client.slaBreach,
    stalledDays: client.stalledDays,
    docsVerified: client.docsVerified,
  }));

  const affiliateOptions = consoleData.affiliates.map((a) => ({ id: a.id, label: a.agentName }));
  const employerOptions = consoleData.employers.map((e) => ({ id: e.id, label: e.companyName }));

  return (
    <div className="min-h-screen bg-app pb-20 lg:pb-0">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <Breadcrumbs trail={[{ label: "হোম", href: "/" }, { label: "অ্যাডমিন কনসোল" }]} />
      </div>
      <PageHero
        eyebrow="অ্যাডমিন সুপার ড্যাশবোর্ড"
        title="আট ধাপের কানবান কনসোল, SLA অ্যালার্ম ও রিয়েল-টাইম ফিনান্সিয়াল প্যানেল"
        subtitle="প্রতিটি ফাইল নতুন লিড থেকে ফ্লাইট ও ডিপ্লয়মেন্ট পর্যন্ত ধাপে ধাপে পরিচালিত হয়। ফাইলের নিয়ন্ত্রণ বোতাম চাপলেই সংশ্লিষ্ট ইমেইল ট্রিগার স্বয়ংক্রিয়ভাবে ডিসপ্যাচ হয়, SLA অ্যালার্ম রিসেট হয় এবং ডাটাবেজে ধাপ টাইমস্ট্যাম্প আপডেট হয়।"
      >
        <div className="flex flex-wrap gap-1.5">
          <Chip tone="accent">মোট ফাইল {clients.length}</Chip>
          <Chip tone="danger">SLA ব্রিচ {clients.filter((c) => c.slaBreach).length}</Chip>
          <Chip tone="teal">ভিসা অনুমোদিত {clients.filter((c) => ["Visa_Approved", "Flight_Deployed"].includes(c.stage)).length}</Chip>
          <Chip tone="brand">প্রত্যাখ্যাত {clients.filter((c) => c.stage === "Rejected").length}</Chip>
        </div>
      </PageHero>

      <section className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6">
        <AdminConsole
          initialClients={clients}
          financials={consoleData.financials}
          affiliateOptions={affiliateOptions}
          employerOptions={employerOptions}
        />
      </section>

      <section className="border-t border-line bg-surface2 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="অপারেশনাল মনিটরিং"
              title="এজেন্ট এক্সিকিউশন, ইমেইল ডিসপ্যাচ ও ধাপ বিতরণ"
              subtitle="এজেন্ট প্রতিদিন তিনবার (০৯:০০ / ১৪:০০ / ২১:০০ BST) আট দেশের পোর্টালে লগইন করে DOM মিউটেশন স্ক্রিন করে এবং প্রতি ২৪ ঘণ্টায় পাসপোর্ট নম্বর ইনজেক্ট করে ভিসা স্ট্যাটাস সিঙ্ক করে।"
            />
          </Reveal>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Reveal dir="left">
              <div className="card h-full p-4">
                <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">সর্বশেষ এজেন্ট এক্সিকিউশন</p>
                <div className="mt-3 grid gap-2">
                  {automationFeed.map((job) => (
                    <div key={job.id} className="soft p-3">
                      <p className="mono text-[10.5px] text-ink">
                        {job.jobType === "appointment_scan" ? "স্লট স্ক্যান" : "স্ট্যাটাস স্ক্র্যাপ"} · {job.countryIso} · {job.scheduledSlot}
                      </p>
                      <p className="mt-1 text-[10.5px] leading-relaxed text-mute">{job.resultMessage}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal dir="right" delay={60}>
              <div className="card h-full p-4">
                <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">অটো-ডিসপ্যাচ ইমেইল ফিড</p>
                <div className="mt-3 grid gap-2">
                  {emailFeed.map((email) => (
                    <div key={email.id} className="soft p-3">
                      <p className="text-[11px] text-ink">{email.subject}</p>
                      <p className="mono mt-1 text-[10px] text-mute">
                        {email.recipientEmail} · {email.triggerType} · {email.sentAt.toLocaleString("en-GB")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
          <Reveal delay={70}>
            <div className="card mt-4 p-4 sm:p-5">
              <p className="text-[10px] font-bold tracking-[0.22em] text-accent uppercase">ধাপ বিতরণ ও SLA ঝুঁকি</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {STAGE_COLUMNS.map((column) => {
                  const count = clients.filter((c) => c.stage === column.key).length;
                  const breaches = clients.filter((c) => c.stage === column.key && c.slaBreach).length;
                  return (
                    <div key={column.key} className="soft p-3">
                      <p className="text-[11px] text-mute">{column.labelBn}</p>
                      <p className="mono mt-1 text-base font-bold text-accent">{count}</p>
                      <div className="mt-1.5">
                        <Bar value={count} max={Math.max(clients.length, 1)} tone={breaches > 0 ? "accent" : "brand"} />
                      </div>
                      {breaches > 0 ? <p className="mt-1.5 text-[10px] font-bold text-danger">🚨 {breaches} টি SLA ব্রিচ</p> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="মোট ফাইল" value={clients.length} tone="brand" />
            <StatTile label="ভেরিফাইড নিয়োগকর্তা" value={consoleData.employers.filter((e) => e.verificationStatus === "Verified").length} tone="teal" />
            <StatTile label="সক্রিয় ডিমান্ড" value={consoleData.demands.filter((d) => d.status === "Open").length} tone="accent" />
            <StatTile label="সাব-এজেন্ট ওয়ালেট দায়" value={`৳${consoleData.affiliates.reduce((s, a) => s + a.walletBalance, 0).toLocaleString("en-US")}`} tone="accent" />
          </div>
        </div>
      </section>

      <SiteFooter />
      <BottomNav />
    </div>
  );
}
