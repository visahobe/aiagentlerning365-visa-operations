import type { ReactNode } from "react";
import { PageTransition } from "@/components/ui";

/** প্রতিটি রুট নেভিগেশনে পেজ ট্রানজিশন অ্যানিমেশন প্রয়োগ করে */
export default function RootTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
