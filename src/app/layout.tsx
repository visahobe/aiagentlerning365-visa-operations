import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { GlobalEffects } from "@/components/ui";

export const metadata: Metadata = {
  title: "VisaMotion365 | এআই ভিসা সুপার এজেন্ট প্ল্যাটফর্ম",
  description:
    "VisaMotion365 — বাংলাদেশ থেকে আটটি কৌশলগত গন্তব্যে ওয়ার্ক ভিসা, ভিজিটর ভিসা ও সেলফ-স্পন্সরশিপ প্রসেসিংয়ের সম্পূর্ণ ডিপ অটোমেশন প্ল্যাটফর্ম। ব্রাউজার এআই এজেন্ট, ভেরিফাইড এমপ্লয়ার ডাটাবেজ, বিটুবি অ্যাফিলিয়েট নেটওয়ার্ক ও স্বয়ংক্রিয় ইমেইল ইঞ্জিন।",
  applicationName: "VisaMotion365",
  keywords: [
    "VisaMotion365",
    "ভিসা অটোমেশন প্ল্যাটফর্ম",
    "ওয়ার্ক পারমিট",
    "ভিসা সুপার এজেন্ট",
    "বাংলাদেশ ভিসা কনসালটেন্সি",
    "ইমিগ্রেশন অটোমেশন",
  ],
  authors: [{ name: "VisaMotion365" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#05121e" },
  ],
};

const themeInit = `
(function(){
  try {
    var saved = localStorage.getItem('vm365-theme');
    var dark = saved ? saved === 'dark' : false;
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-app text-ink antialiased">
        <GlobalEffects />
        {children}
      </body>
    </html>
  );
}
