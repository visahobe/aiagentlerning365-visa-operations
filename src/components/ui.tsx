"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/* ======================= থিম টগল (হালকা / অন্ধকার) ======================= */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = useState(false);
  const [smooth, setSmooth] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setSmooth(document.documentElement.classList.contains("inertia-on"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try {
      localStorage.setItem("vm365-theme", next ? "dark" : "light");
    } catch {
      /* স্টোরেজ বন্ধ থাকলে উপেক্ষা */
    }
  };

  const toggleSmooth = () => {
    const next = !smooth;
    setSmooth(next);
    document.documentElement.classList.toggle("inertia-on", next);
    try {
      localStorage.setItem("vm365-smooth", next ? "on" : "off");
    } catch {
      /* উপেক্ষা */
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {!compact ? (
        <button
          type="button"
          onClick={toggleSmooth}
          title="মাউস স্ক্রল অ্যানিমেশন চালু/বন্ধ"
          aria-label="স্মুথ স্ক্রল টগল"
          className={`hidden h-9 items-center gap-1.5 rounded-xl border border-line px-2.5 text-[10.5px] font-bold sm:flex ${
            smooth ? "bg-tealsoft text-tealx" : "bg-surface text-mute"
          }`}
        >
          <span>{smooth ? "স্মুথ ✓" : "স্মুথ ✕"}</span>
        </button>
      ) : null}
      <button
        type="button"
        onClick={toggle}
        aria-label="থিম পরিবর্তন"
        className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-base"
      >
        <span>{dark ? "🌙" : "☀️"}</span>
      </button>
    </div>
  );
}

/* ============ গ্লোবাল ইফেক্ট: স্মুথ স্ক্রল · স্পটলাইট · প্রগ্রেস ============ */
export function GlobalEffects() {
  const [progress, setProgress] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const spotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("vm365-smooth");
    } catch {
      saved = null;
    }
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const on = saved ? saved === "on" && fine && !reduce : fine && !reduce;
    setEnabled(on);
    document.documentElement.classList.toggle("inertia-on", on);
  }, []);

  /* মাউস হুইল ভিত্তিক ইনর্শিয়া স্ক্রল */
  useEffect(() => {
    if (!enabled) return;
    let target = window.scrollY;
    let current = target;
    let frame = 0;
    let running = false;

    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

    const loop = () => {
      current += (target - current) * 0.14;
      if (Math.abs(target - current) < 0.5) {
        current = target;
        window.scrollTo(0, current);
        running = false;
        return;
      }
      window.scrollTo(0, current);
      frame = requestAnimationFrame(loop);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.defaultPrevented) return;
      const el = event.target as HTMLElement | null;
      if (el?.closest("[data-native-scroll]")) return;
      event.preventDefault();
      target = Math.min(Math.max(target + event.deltaY * 1.05, 0), maxScroll());
      if (!running) {
        running = true;
        frame = requestAnimationFrame(loop);
      }
    };

    const onScroll = () => {
      if (!running) {
        target = window.scrollY;
        current = target;
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [enabled]);

  /* স্ক্রল প্রগ্রেস + স্পটলাইট অবস্থান */
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const height = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(height > 0 ? Math.min((window.scrollY / height) * 100, 100) : 0);
      });
    };
    const onMove = (event: MouseEvent) => {
      const node = spotRef.current;
      if (!node) return;
      node.style.setProperty("--mx", `${(event.clientX / window.innerWidth) * 100}%`);
      node.style.setProperty("--my", `${event.clientY}px`);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        ref={spotRef}
        className="spot hidden lg:block"
        style={{ opacity: progress > 2 ? 0.9 : 0.4 }}
        aria-hidden
      />
      <div className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent" aria-hidden>
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-accent2 via-tealx to-brand2 transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>
    </>
  );
}

/* =========================== পেজ ট্রানজিশন =========================== */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [key, setKey] = useState(pathname);

  useEffect(() => {
    setKey(pathname);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div key={key} className="page-anim">
      {children}
    </div>
  );
}

/* ============================== স্ক্রল রিভিল ============================== */
export function Reveal({
  children,
  delay = 0,
  dir = "up",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  dir?: "up" | "left" | "right" | "zoom";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-dir={dir}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ============================== কাউন্টার ============================== */
export function Counter({
  to,
  prefix = "",
  suffix = "",
  duration = 1500,
  className = "",
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        const start = performance.now();
        const tick = (time: number) => {
          const p = Math.min((time - start) / duration, 1);
          setValue(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [to, duration]);

  const formatted = to % 1 === 0 ? Math.round(value).toLocaleString("en-US") : value.toFixed(2);
  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

/* ============================ সেকশন টাইটেল ============================ */
export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow ? (
        <div className={`mb-3 flex items-center gap-2 ${align === "center" ? "justify-center" : ""}`}>
          <span className="h-px w-8 bg-accent2" />
          <span className="text-[10.5px] font-bold tracking-[0.24em] text-accent uppercase">{eyebrow}</span>
        </div>
      ) : null}
      <h2 className="h2 text-ink">{title}</h2>
      {subtitle ? <p className="body-text mt-3">{subtitle}</p> : null}
    </div>
  );
}

export function Chip({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "brand" | "accent" | "teal" | "danger";
}) {
  const map: Record<string, string> = {
    default: "chip",
    brand: "chip chip-brand",
    accent: "chip chip-accent",
    teal: "chip chip-teal",
    danger: "chip chip-danger",
  };
  return <span className={map[tone]}>{children}</span>;
}

/** পুরোনো নামের সাথে সামঞ্জস্যরক্ষী ব্যাজ (navy/gold/teal/red/rose/slate) */
const LEGACY_TONES: Record<string, "default" | "brand" | "accent" | "teal" | "danger"> = {
  navy: "brand",
  gold: "accent",
  teal: "teal",
  red: "danger",
  rose: "danger",
  slate: "default",
};

export function Badge({ children, tone = "navy" }: { children: ReactNode; tone?: string }) {
  return <Chip tone={LEGACY_TONES[tone] ?? "default"}>{children}</Chip>;
}

export function StatTile({
  label,
  value,
  hint,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "brand" | "accent" | "teal" | "danger";
}) {
  const color: Record<string, string> = {
    brand: "text-brand2",
    accent: "text-accent",
    teal: "text-tealx",
    danger: "text-danger",
  };
  return (
    <div className="card card-hover h-full p-4">
      <p className="text-[10.5px] leading-snug font-semibold tracking-wide text-mute uppercase">{label}</p>
      <p className={`mono mt-2 text-lg font-bold sm:text-xl ${color[tone]}`}>{value}</p>
      {hint ? <p className="mt-1.5 text-[10.5px] leading-relaxed text-mute">{hint}</p> : null}
    </div>
  );
}

/* ============================ টিল্ট কার্ড (মাউস) ============================ */
export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  const onMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    node.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-4px)`;
  }, []);

  const onLeave = useCallback(() => {
    const node = ref.current;
    if (node) node.style.transform = "";
  }, []);

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`tilt ${className}`}>
      {children}
    </div>
  );
}

/* ============================== অ্যাকর্ডিয়ন ============================== */
export function Accordion({ items }: { items: readonly { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="grid gap-2.5">
      {items.map((item, index) => {
        const active = open === index;
        return (
          <div key={item.q} className={`card overflow-hidden transition-all ${active ? "border-accent2" : ""}`}>
            <button
              type="button"
              onClick={() => setOpen(active ? null : index)}
              className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
            >
              <span className="text-[12.5px] leading-relaxed font-bold text-ink sm:text-[13.5px]">{item.q}</span>
              <span
                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-line text-[13px] font-bold transition-transform ${
                  active ? "rotate-45 bg-accentsoft text-accent" : "bg-surface2 text-mute"
                }`}
              >
                +
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ${active ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <p className="body-text px-4 pb-4">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Bar({ value, max = 100, tone = "brand" }: { value: number; max?: number; tone?: "brand" | "accent" | "teal" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const bg: Record<string, string> = {
    brand: "from-brand2 to-brand",
    accent: "from-accent2 to-accent",
    teal: "from-tealx to-brand2",
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${bg[tone]} transition-[width] duration-1000`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ProgressRing({ value, label }: { value: number; label: string }) {
  const clamped = Math.max(0, Math.min(value, 100));
  return (
    <div className="flex items-center gap-3">
      <div
        className="grid h-16 w-16 shrink-0 place-items-center rounded-full"
        style={{
          background: `conic-gradient(var(--c-teal) ${clamped * 3.6}deg, var(--c-surface2) 0deg)`,
        }}
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-surface mono text-[12px] font-bold text-ink">
          {clamped}%
        </span>
      </div>
      <p className="text-[11.5px] leading-relaxed text-mute">{label}</p>
    </div>
  );
}

export function Marquee({ items }: { items: readonly string[] }) {
  return (
    <div className="overflow-hidden border-y border-line bg-surface2 py-2.5">
      <div className="marquee-track gap-8">
        {[...items, ...items].map((item, index) => (
          <span key={`${item}-${index}`} className="shrink-0 text-[12px] whitespace-nowrap text-mute">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
