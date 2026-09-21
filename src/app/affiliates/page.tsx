import { ensureSeeded } from "@/lib/seed";
import { getAffiliateDirectory } from "@/lib/automation";
import { AffiliatePortal } from "@/components/affiliate-portal";
import { BottomNav, Breadcrumbs, PageHero, SiteFooter, TopNav } from "@/components/site-shell";
import { Chip, Reveal, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AffiliatesPage() {
  await ensureSeeded();
  const directory = await getAffiliateDirectory();

  return (
    <div className="min-h-screen bg-app pb-20 lg:pb-0">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <Breadcrumbs trail={[{ label: "হোম", href: "/" }, { label: "বিটুবি অ্যাফিলিয়েট নেটওয়ার্ক" }]} />
      </div>
      <PageHero
        eyebrow="বিটুবি অ্যাফিলিয়েট নেটওয়ার্ক পোর্টাল"
        title="উপজেলা ও জেলাভিত্তিক সাব-এজেন্ট ড্যাশবোর্ড, কমিশন লেজার ও উইথড্রয়াল ইঞ্জিন"
        subtitle="বাংলাদেশের তৃণমূল পর্যায় থেকে গ্রাহক সংযোগকারী এজেন্টদের স্বচ্ছ আইনি কাঠামোয় আনতে প্রত্যেক নিবন্ধিত অ্যাফিলিয়েট একটি ডেডিকেটেড ড্যাশবোর্ড ও ইউনিক রেফারেল লিংক পান। রেফারেল দিয়ে অনবোর্ড হওয়া প্রতিটি ক্লায়েন্টের ফাইল কোন ধাপে আছে তা রিয়েল-টাইমে দৃশ্যমান, এবং ভিসা অনুমোদনের সাথে সাথেই কমিশন স্বয়ংক্রিয়ভাবে ওয়ালেটে জমা হয়।"
      >
        <div className="flex flex-wrap gap-1.5">
          <Chip tone="accent">{directory.length} নিবন্ধিত অ্যাফিলিয়েট</Chip>
          <Chip tone="teal">মোট অর্জিত ৳{directory.reduce((s, a) => s + a.totalEarned, 0).toLocaleString("en-US")}</Chip>
          <Chip tone="brand">প্রদেয় ওয়ালেট ৳{directory.reduce((s, a) => s + a.walletBalance, 0).toLocaleString("en-US")}</Chip>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <AffiliatePortal directory={directory} />
      </section>

      <section className="border-t border-line bg-surface2 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="নেটওয়ার্ক গভর্নেন্স"
              title="কমিশন নীতিমালা, কমপ্লায়েন্স শর্ত ও পেআউট সাইকেল"
              subtitle="প্রতিটি অ্যাফিলিয়েটের ওয়ালেট লেজার সম্পূর্ণ অডিটেবল — কোন ক্লায়েন্টের কোন ট্র্যাক থেকে কত কমিশন জমা হয়েছে তা প্রতিটি এন্ট্রিতে নোটসহ সংরক্ষিত থাকে। উইথড্রয়াল রিকোয়েস্ট অ্যাডমিন অনুমোদনের পর বিকাশ, নগদ বা ব্যাংক ট্রান্সফারে নিষ্পন্ন হয়।"
            />
          </Reveal>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {[
              { title: "রেফারেল ট্র্যাকিং ও অ্যাট্রিবিউশন", body: "প্রতিটি ক্লায়েন্ট ফাইলে affiliate_id ফিল্ডে সাব-এজেন্টের রেফারেন্স সংরক্ষিত হয় — কমিশন বণ্টনে কোনো অস্পষ্টতা থাকে না।" },
              { title: "স্বয়ংক্রিয় কমিশন ট্রিগার", body: "ভিসা অনুমোদনের ইভেন্টে সিস্টেম কমিশন রেকর্ড তৈরি করে, ওয়ালেট ও total_earned আপডেট করে এবং এজেন্টকে নিশ্চিতকরণ ইমেইল প্রেরণ করে।" },
              { title: "গভর্নেন্স ও জবাবদিহিতা", body: "প্রতিটি রেফারেলের অগ্রগতি ধাপ-প্রমাণ আকারে দৃশ্যমান; এজেন্ট কোনো তথ্য পরিবর্তন করতে পারেন না, কেবল ট্র্যাক করেন।" },
            ].map((item, index) => (
              <Reveal key={item.title} dir="zoom" delay={index * 50}>
                <div className="card h-full p-4 sm:p-5">
                  <p className="text-[12.5px] font-bold text-accent">{item.title}</p>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-mute">{item.body}</p>
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
