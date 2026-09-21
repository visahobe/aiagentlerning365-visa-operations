"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ThemeToggle } from "./ui";
import { BRAND } from "@/lib/reference-data";

interface NavItem {
  href: string;
  label: string;
  desc: string;
  group: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "হোম", desc: "প্ল্যাটফর্ম ব্লুপ্রিন্ট", group: "মূল" },
  { href: "/countries", label: "দেশ ও পাথওয়ে", desc: "৮ দেশের ভিসা ফ্রেমওয়ার্ক", group: "মূল" },
  { href: "/onboard", label: "অনবোর্ডিং", desc: "ক্লায়েন্ট ফাইল ইনটেক", group: "সেবা" },
  { href: "/track", label: "ফাইল ট্র্যাকিং", desc: "আইডি দিয়ে অবস্থান জানুন", group: "সেবা" },
  { href: "/fees", label: "ফি ও পেমেন্ট", desc: "প্যাকেজ ও তিন ধাপের পরিশোধ", group: "সেবা" },
  { href: "/employers", label: "এমপ্লয়ার হাব", desc: "ভেরিফাইড নিয়োগকর্তা ও ডিমান্ড", group: "নেটওয়ার্ক" },
  { href: "/affiliates", label: "বিটুবি অ্যাফিলিয়েট", desc: "সাব-এজেন্ট ও কমিশন লেজার", group: "নেটওয়ার্ক" },
  { href: "/partners", label: "ফরেন পার্টনার", desc: "ডিপ্লয়মেন্ট ও প্রফিট শেয়ার", group: "নেটওয়ার্ক" },
  { href: "/dashboard", label: "অ্যাডমিন কনসোল", desc: "কানবান ও ফিনান্সিয়াল প্যানেল", group: "ইঞ্জিন" },
  { href: "/pipeline", label: "পাইপলাইন ও SLA", desc: "সাত ধাপ ও স্থবিরতা অ্যালার্ম", group: "ইঞ্জিন" },
  { href: "/automation", label: "এআই এজেন্ট", desc: "ব্রাউজার অটোমেশন কনসোল", group: "ইঞ্জিন" },
  { href: "/email-engine", label: "ইমেইল ইঞ্জিন", desc: "আটটি ট্রিগার ও টেমপ্লেট", group: "ইঞ্জিন" },
  { href: "/database", label: "ডাটাবেজ স্কিমা", desc: "১৫ টেবিল ও সম্পর্ক", group: "ইঞ্জিন" },
  { href: "/roadmap", label: "রোডম্যাপ ও প্রশিক্ষণ", desc: "বাস্তবায়ন পরিকল্পনা", group: "প্রতিষ্ঠান" },
  { href: "/guide", label: "নির্দেশিকা ও জিজ্ঞাসা", desc: "পরিভাষা, ফিল্টার ও প্রশ্নোত্তর", group: "প্রতিষ্ঠান" },
];

const GROUPS = ["মূল", "সেবা", "নেটওয়ার্ক", "ইঞ্জিন", "প্রতিষ্ঠান"];

export function TopNav() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className={`fixed inset-x-0 top-0 z-50 ${scrolled ? "backdrop-blur-xl" : ""}`}>
      <div
        className={`top-safe transition-colors duration-300 ${
          scrolled ? "border-b border-line bg-surface/92" : "border-b border-transparent bg-surface/70"
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-5">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand2 to-brand text-[12px] font-black text-white shadow-sm">
              VM
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[14px] leading-tight font-extrabold text-ink sm:text-[15px]">
                VisaMotion365
              </span>
              <span className="block truncate text-[9.5px] font-semibold tracking-wide text-mute">
                এআই ভিসা সুপার এজেন্ট প্ল্যাটফর্ম
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-0.5 xl:flex">
            {["/", "/countries", "/onboard", "/track", "/employers", "/affiliates", "/dashboard", "/automation"].map(
              (href) => {
                const item = NAV_ITEMS.find((n) => n.href === href)!;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`rounded-xl px-2.5 py-2 text-[12px] font-semibold transition-colors ${
                      active(href) ? "bg-accentsoft text-accent" : "text-mute hover:bg-surface2 hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              },
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className={`rounded-xl px-2.5 py-2 text-[12px] font-semibold transition-colors ${
                  menuOpen ? "bg-accentsoft text-accent" : "text-mute hover:bg-surface2 hover:text-ink"
                }`}
              >
                আরও ▾
              </button>
              {menuOpen ? (
                <div className="absolute right-0 top-full mt-2 w-[520px] rounded-2xl border border-line bg-surface p-3 shadow-2xl">
                  <div className="grid grid-cols-2 gap-2">
                    {GROUPS.map((group) => (
                      <div key={group}>
                        <p className="px-2 pb-1 text-[10px] font-bold tracking-[0.2em] text-accent uppercase">{group}</p>
                        {NAV_ITEMS.filter((item) => item.group === group).map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block rounded-xl px-2 py-1.5 transition-colors hover:bg-surface2"
                          >
                            <span className="block text-[12px] font-semibold text-ink">{item.label}</span>
                            <span className="block text-[10.5px] text-mute">{item.desc}</span>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link href="/onboard" className="btn btn-primary hidden !px-3.5 !py-2 text-[11.5px] sm:inline-flex">
              ফাইল শুরু করুন
            </Link>
            <button
              type="button"
              aria-label="মেনু"
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface xl:hidden"
            >
              <span className="flex flex-col gap-1">
                <span className={`block h-0.5 w-5 bg-ink transition-transform ${open ? "translate-y-1.5 rotate-45" : ""}`} />
                <span className={`block h-0.5 w-5 bg-ink transition-opacity ${open ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 w-5 bg-ink transition-transform ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* মোবাইল ড্রয়ার */}
      <div
        className={`fixed inset-0 top-0 z-40 xl:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/45 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <div
          className={`absolute inset-x-0 top-0 max-h-[100dvh] overflow-y-auto bg-surface pb-8 transition-transform duration-300 ${
            open ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="top-safe sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
            <span className="text-[14px] font-extrabold text-ink">সকল পাতা</span>
            <button type="button" onClick={() => setOpen(false)} className="btn !px-3 !py-1.5 text-[12px]">
              বন্ধ ✕
            </button>
          </div>
          <div className="px-3 pt-3">
            {GROUPS.map((group) => (
              <div key={group} className="mb-4">
                <p className="px-2 pb-1.5 text-[10px] font-bold tracking-[0.22em] text-accent uppercase">{group}</p>
                <div className="grid gap-1.5">
                  {NAV_ITEMS.filter((item) => item.group === group).map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between rounded-2xl border px-3.5 py-3 transition-colors ${
                        active(item.href) ? "border-accent2 bg-accentsoft" : "border-line bg-surface"
                      }`}
                    >
                      <span>
                        <span className="block text-[13px] font-bold text-ink">{item.label}</span>
                        <span className="block text-[10.5px] text-mute">{item.desc}</span>
                      </span>
                      <span className="text-mute">›</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "হোম", icon: "🏠" },
    { href: "/countries", label: "দেশ", icon: "🌍" },
    { href: "/onboard", label: "ফাইল", icon: "📝" },
    { href: "/track", label: "ট্র্যাক", icon: "🔍" },
    { href: "/dashboard", label: "কনসোল", icon: "📊" },
  ];
  return (
    <nav className="safe-b fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/97 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const highlight = item.href === "/onboard";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition-colors ${
                active ? "text-accent" : "text-mute"
              }`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-xl text-[15px] ${
                  highlight
                    ? "bg-gradient-to-br from-accent2 to-accent text-white"
                    : active
                      ? "bg-accentsoft"
                      : "bg-surface2"
                }`}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface2 pb-24 lg:pb-0">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand2 to-brand text-[13px] font-black text-white">
              VM
            </span>
            <div>
              <p className="text-[16px] font-extrabold text-ink">{BRAND.name}</p>
              <p className="text-[11px] font-semibold text-mute">{BRAND.taglineBn}</p>
            </div>
          </div>
          <p className="body-text mt-4">{BRAND.addressBn}</p>
          <div className="mt-3 grid gap-1 text-[12.5px]">
            <p className="text-mute">
              যোগাযোগ: <span className="mono font-bold text-ink">{BRAND.phone}</span>
            </p>
            <p className="text-mute">
              ইমেইল: <span className="mono font-bold text-ink">{BRAND.email}</span>
            </p>
            <p className="text-mute">
              অফিস সময়: <span className="font-semibold text-ink">{BRAND.hoursBn}</span>
            </p>
          </div>
          <a href={`https://${BRAND.portal}`} className="mt-3 inline-block text-[12.5px] font-bold text-brand2 link-underline">
            {BRAND.portal}
          </a>
        </div>
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.22em] text-accent uppercase">সকল পাতা</p>
          <ul className="mt-3 grid gap-1.5 text-[12.5px]">
            {NAV_ITEMS.slice(0, 8).map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-mute link-underline hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.22em] text-accent uppercase">সিস্টেম ও প্রতিষ্ঠান</p>
          <ul className="mt-3 grid gap-1.5 text-[12.5px]">
            {NAV_ITEMS.slice(8).map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-mute link-underline hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mono mt-4 text-[10.5px] text-mute">
            সংস্করণ: {BRAND.founded}
            <br />
            ডেভেলপমেন্ট: Next.js + PostgreSQL
          </p>
        </div>
      </div>
      <div className="border-t border-line px-4 py-5 text-center text-[11px] text-mute sm:px-6">
        © {new Date().getFullYear()} {BRAND.name} — ডিপ অটোমেশন এআই সুপার এজেন্ট প্ল্যাটফর্ম। প্রতিটি ট্রিগার, অটোমেশন ও
        আর্থিক লেনদেন অডিটেবল।
      </div>
    </footer>
  );
}

export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <section className="spot-bg relative overflow-hidden border-b border-line pt-24 pb-10 sm:pt-28 sm:pb-14">
      <div className="grid-bg absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-[10.5px] font-bold tracking-[0.28em] text-accent uppercase">{eyebrow}</p>
        <h1 className="h1 mt-3 max-w-4xl text-ink">{title}</h1>
        <p className="body-text mt-3 max-w-3xl">{subtitle}</p>
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}

export function Breadcrumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-[11px] text-mute">
      {trail.map((crumb, index) => (
        <span key={crumb.label} className="flex items-center gap-1.5">
          {crumb.href ? (
            <Link href={crumb.href} className="link-underline hover:text-ink">
              {crumb.label}
            </Link>
          ) : (
            <span className="font-semibold text-ink">{crumb.label}</span>
          )}
          {index < trail.length - 1 ? <span className="text-line">/</span> : null}
        </span>
      ))}
    </nav>
  );
}
