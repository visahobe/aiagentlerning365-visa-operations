import { ensureSeeded } from "@/lib/seed";
import { getVerifiedEmployersWithDemands } from "@/lib/automation";
import { EmployerHub, type EmployerView } from "@/components/employer-hub";
import { BottomNav, Breadcrumbs, PageHero, SiteFooter, TopNav } from "@/components/site-shell";
import { Chip, Reveal, SectionTitle } from "@/components/ui";
import { COUNTRIES } from "@/lib/reference-data";

export const dynamic = "force-dynamic";

export default async function EmployersPage() {
  await ensureSeeded();
  const rows = await getVerifiedEmployersWithDemands();

  const employers: EmployerView[] = rows.map((employer) => ({
    id: employer.id,
    companyName: employer.companyName,
    countryIso: employer.countryIso,
    tradeLicenseNo: employer.tradeLicenseNo,
    taxId: employer.taxId,
    contactPerson: employer.contactPerson,
    contactTitle: employer.contactTitle,
    email: employer.email,
    phone: employer.phone,
    website: employer.website,
    verificationStatus: employer.verificationStatus,
    screeningNote: employer.screeningNote,
    agreementPdfUrl: employer.agreementPdfUrl,
    demands: employer.demands.map((demand) => ({
      id: demand.id,
      jobTitle: demand.jobTitle,
      jobCategory: demand.jobCategory,
      requiredWorkers: demand.requiredWorkers,
      fulfilledCount: demand.fulfilledCount,
      salary: Number(demand.salary),
      currency: demand.currency,
      workingHours: demand.workingHours,
      overtimePolicy: demand.overtimePolicy,
      accommodation: demand.accommodation,
      medicalInsurance: demand.medicalInsurance,
      foodAllowance: demand.foodAllowance,
      status: demand.status,
      blacklistFlag: demand.blacklistFlag,
    })),
  }));

  const verified = employers.filter((e) => e.verificationStatus === "Verified");

  return (
    <div className="min-h-screen bg-app pb-20 lg:pb-0">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <Breadcrumbs trail={[{ label: "হোম", href: "/" }, { label: "এমপ্লয়ার হাব" }]} />
      </div>
      <PageHero
        eyebrow="ভেরিফাইড এমপ্লয়ার ডাটাবেজ ও কমপ্লায়েন্স অটোমেশন"
        title="আন্তর্জাতিক নিয়োগকর্তা ডিরেক্টরি, ডিমান্ড স্ক্রিনিং ও ই-সাইন চুক্তিপত্র"
        subtitle="প্রতিটি বিদেশি কোম্পানির কর্পোরেট রেজিস্ট্রেশন নম্বর, ট্যাক্স আইডি/ভ্যাট, যোগাযোগকারী ব্যক্তির পদবি, ডোমেইন ইমেইল, ফোন ও ডিমান্ড কোটা কেন্দ্রীয়ভাবে সংরক্ষিত থাকে। নতুন ডিমান্ড লেটার এলে সিস্টেম ব্ল্যাকলিস্ট ডাটাবেজের সাথে স্বয়ংক্রিয় ক্রস-ম্যাচ করে এবং সন্দেহ হলে ডিমান্ড স্থগিত করে।"
      >
        <div className="flex flex-wrap gap-1.5">
          <Chip tone="teal">ভেরিফাইড {verified.length}</Chip>
          <Chip tone="accent">তদন্তাধীন {employers.filter((e) => e.verificationStatus === "Pending").length}</Chip>
          <Chip tone="danger">ব্ল্যাকলিস্টেড {employers.filter((e) => e.verificationStatus === "Blacklisted").length}</Chip>
          <Chip tone="brand">
            মোট কোটা {employers.reduce((s, e) => s + e.demands.reduce((x, d) => x + d.requiredWorkers, 0), 0)} জন
          </Chip>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <EmployerHub initialEmployers={employers} />
      </section>

      <section className="border-t border-line bg-surface2 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="প্রতি দেশে চাহিদার প্রধান খাত"
              title="আটটি গন্তব্যে কোন খাতে কত জনশক্তি প্রয়োজন"
              subtitle="নিয়োগকর্তার ডিমান্ড লেটার এই খাত-বিন্যাস অনুযায়ী শ্রেণিবদ্ধ হয়, ফলে স্কিল ম্যাচিং ফিল্টার সঠিকভাবে কাজ করে।"
            />
          </Reveal>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {COUNTRIES.map((country, index) => (
              <Reveal key={country.iso3} dir="zoom" delay={index * 35}>
                <div className="card h-full p-4">
                  <p className="text-[12.5px] font-bold text-ink">
                    {country.flag} {country.nameBn}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-mute">{country.demandSectorsBn}</p>
                  <p className="mono mt-2 text-[10px] text-accent">{country.salaryBenchBn.split(":")[1]?.trim() ?? ""}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "ট্যাক্স আইডি ক্রস-ম্যাচ", body: "জাতীয় কর শনাক্তকারী নম্বর ব্ল্যাকলিস্ট ডাটাবেজের সাথে তাৎক্ষণিকভাবে মিলিয়ে দেখা হয়।" },
              { title: "ডোমেইন হিউরিস্টিক", body: "সন্দেহজনক ডোমেইন প্যাটার্ন (ফ্রি-ভিসা, .top আউটলায়ার) শনাক্ত হলে স্বয়ংক্রিয় স্থগিতাদেশ।" },
              { title: "সিকিউরিটি অ্যালার্ট", body: "কালো তালিকাভুক্ত কোম্পানির ডিমান্ডে অ্যাডমিন প্যানেলে লাল অ্যালার্ট ও ইনবক্স নোট।" },
              { title: "ডিরেক্টরি পাবলিশিং", body: "প্রতিটি দেশের জন্য আলাদা ভেরিফাইড এমপ্লয়ার ডিরেক্টরি — প্রার্থীরা সরাসরি যাচাই করতে পারেন।" },
            ].map((item, index) => (
              <Reveal key={item.title} dir="zoom" delay={index * 40}>
                <div className="card h-full p-4">
                  <p className="text-[12px] font-bold text-accent">{item.title}</p>
                  <p className="mt-2 text-[11px] leading-relaxed text-mute">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
      <BottomNav />
    </div>
  );
}
