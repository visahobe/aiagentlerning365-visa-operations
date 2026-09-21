import { desc } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { TrackConsole } from "@/components/track-console";
import { BottomNav, Breadcrumbs, PageHero, SiteFooter, TopNav } from "@/components/site-shell";
import { Chip, Reveal, SectionTitle } from "@/components/ui";
import { STAGE_COLUMNS } from "@/lib/reference-data";

export const dynamic = "force-dynamic";

export default async function TrackPage() {
  await ensureSeeded();
  const rows = await db
    .select({ code: clients.clientCode })
    .from(clients)
    .orderBy(desc(clients.createdAt))
    .limit(8);

  return (
    <div className="min-h-screen bg-app pb-20 lg:pb-0">
      <TopNav />
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6">
        <Breadcrumbs trail={[{ label: "হোম", href: "/" }, { label: "ফাইল ট্র্যাকিং" }]} />
      </div>
      <PageHero
        eyebrow="ফাইল ট্র্যাকিং ও অগ্রগতি প্যানেল"
        title="আপনার ইউনিক ক্লায়েন্ট আইডি দিয়ে রিয়েল-টাইম অবস্থান জানুন"
        subtitle="ইউনিক আইডি প্রবেশ করালে সিস্টেম দেখাবে ফাইলটি কোন ধাপে আছে, সরকারি পোর্টালে কী ট্র্যাকিং কোড সংরক্ষিত হয়েছে, কোন তারিখে দূতাবাসে জমা হয়েছে, কত পেমেন্ট পরিশোধিত ও কত বকেয়া এবং পর্যন্ত প্রতিটি স্বয়ংক্রিয় ইমেইল কবে প্রেরিত হয়েছে।"
      >
        <div className="flex flex-wrap gap-1.5">
          <Chip tone="accent">৮ ধাপের ধাপ-প্রমাণ প্রগ্রেস</Chip>
          <Chip tone="teal">পেমেন্ট ও বকেয়া হিসাব</Chip>
          <Chip tone="brand">ইমেইল নোটিফিকেশন লগ</Chip>
        </div>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <TrackConsole samples={rows.map((row) => row.code)} />
      </section>

      <section className="border-t border-line bg-surface2 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              eyebrow="সাত ধাপের অর্থ"
              title="প্রতিটি ধাপে ঠিক কী ঘটে ও কোন প্রমাণ তৈরি হয়"
              subtitle="স্বচ্ছতা নিশ্চিত করতে প্রতিটি ধাপের সংজ্ঞা, দায়িত্ব ও অগ্রগতির প্রমাণ নির্দিষ্ট করা আছে।"
            />
          </Reveal>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STAGE_COLUMNS.map((column, index) => (
              <Reveal key={column.key} dir="zoom" delay={index * 35}>
                <div className="card h-full p-4">
                  <div className="flex items-center justify-between">
                    <span className="mono grid h-6 w-6 place-items-center rounded-lg bg-accentsoft text-[10px] font-bold text-accent">
                      {index + 1}
                    </span>
                    <Chip>{column.hint}</Chip>
                  </div>
                  <p className="mt-2.5 text-[12px] font-bold text-ink">{column.labelBn}</p>
                  <p className="mt-1.5 text-[10.5px] leading-relaxed text-mute">{column.detail}</p>
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
