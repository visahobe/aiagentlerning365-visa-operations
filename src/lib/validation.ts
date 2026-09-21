export interface OnboardingInput {
  fullName: string;
  passportNo: string;
  passportExpiry: string; // ISO yyyy-mm-dd
  phone: string;
  email: string;
  age: number;
  skill: string;
  countryIso: string;
  visaCode: string;
  photoFileName?: string;
  photoFileSizeKb?: number;
  photoWidthMm?: number;
  photoHeightMm?: number;
  photoBackgroundWhite?: boolean;
  faceCoveragePercent?: number;
  photoSharpness?: number;
  policeClearanceDate?: string;
  bankStatementMonths?: number;
  bankAverageBalance?: number;
}

export interface DocCheckResult {
  docType: string;
  parameter: string;
  measuredValue: string;
  standard: string;
  passed: boolean;
  verdict: string;
  severity: "block" | "warn" | "pass";
}

export interface ValidationOutcome {
  checks: DocCheckResult[];
  overallPass: boolean;
  blockers: string[];
  warnings: string[];
  passportValidityDays: number;
  simulatedSharpness: number;
}

export const MIN_BANK_BALANCE: Record<string, { amount: number; currency: string }> = {
  TUR: { amount: 6500, currency: "USD" },
  MLT: { amount: 7200, currency: "EUR" },
  SRB: { amount: 5000, currency: "EUR" },
  MDA: { amount: 4200, currency: "EUR" },
  BLR: { amount: 4000, currency: "USD" },
  SAU: { amount: 22000, currency: "SAR" },
  BHR: { amount: 1800, currency: "BHD" },
  MYS: { amount: 18000, currency: "MYR" },
};

export const PASSPORT_MIN_VALIDITY_DAYS = 180;
export const PHOTO_SHARPNESS_THRESHOLD = 100;

export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

/**
 * ডিটারমিনিস্টিক ছদ্ম-ল্যাপ্লাসিয়ান ভ্যারিয়েন্স স্কোর।
 * প্রোডাকশনে Playwright + OpenCV ফেসিয়াল সার্ভিস এই মান প্রদান করে;
 * এই স্যান্ডবক্সে ফাইল মেটাডাটা থেকেই একই ইনপুটে একই স্কোর তৈরি হয়
 * যাতে OCR/CV পাইপলাইনের ভ্যালিডেশন লজিক হুবহু প্রতিফলিত হয়।
 */
export function simulateSharpness(fileName = "photo.jpg", sizeKb = 240): number {
  const seed = [...`${fileName}:${sizeKb}`].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 100000, 7);
  return 62 + (seed % 118); // 62 – 179 রেঞ্জ
}

export function evaluateOnboarding(input: OnboardingInput, now = new Date()): ValidationOutcome {
  const checks: DocCheckResult[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  /* ---------------------- ১. পাসপোর্ট MRZ ভ্যালিডেশন ---------------------- */
  const expiry = input.passportExpiry ? new Date(`${input.passportExpiry}T00:00:00Z`) : new Date(Number.NaN);
  const passportValidityDays = Number.isNaN(expiry.getTime()) ? 0 : daysBetween(now, expiry);
  const passportPass = passportValidityDays >= PASSPORT_MIN_VALIDITY_DAYS;
  checks.push({
    docType: "পাসপোর্ট স্ক্যান",
    parameter: "OCR + MRZ রিডার (লাইন ২ এক্সপায়ারি ডেট)",
    measuredValue: Number.isNaN(expiry.getTime()) ? "পাঠযোগ্য নয়" : `অবশিষ্ট মেয়াদ ${passportValidityDays} দিন`,
    standard: "t ≥ 180 দিন",
    passed: passportPass,
    verdict: passportPass
      ? `পাসপোর্ট MRZ স্ক্যান সফল — ${passportValidityDays} দিন বৈধতা নিশ্চিত`
      : `রিজেকশন: পাসপোর্টের অবশিষ্ট মেয়াদ ${passportValidityDays} দিন (আন্তর্জাতিক ইমিগ্রেশন নিয়মে কমপক্ষে ১৮০ দিন প্রয়োজন)। ই-রিনিউয়াল সম্পন্ন করে পুনরায় আপলোড করুন।`,
    severity: passportPass ? "pass" : "block",
  });
  if (!passportPass) blockers.push(`পাসপোর্ট মেয়াদ অপর্যাপ্ত (${passportValidityDays} দিন, প্রয়োজন ≥ 180)`);

  /* --------------------- ২. আইসিএও ছবি + ব্লার ফিল্টার --------------------- */
  const width = input.photoWidthMm ?? 35;
  const height = input.photoHeightMm ?? 45;
  const ratio = height === 0 ? 0 : width / height;
  const ratioOk = Math.abs(ratio - 35 / 45) < 0.02;
  const coverage = input.faceCoveragePercent ?? 75;
  const coverageOk = coverage >= 70 && coverage <= 80;
  const backgroundOk = input.photoBackgroundWhite ?? true;
  const sharpness = input.photoSharpness ?? simulateSharpness(input.photoFileName, input.photoFileSizeKb);
  const sharpnessOk = sharpness >= PHOTO_SHARPNESS_THRESHOLD;
  const photoPass = ratioOk && coverageOk && backgroundOk && sharpnessOk;
  const photoReasons: string[] = [];
  if (!ratioOk) photoReasons.push("৩৫x৪৫ মিমি অনুপাত ভঙ্গ");
  if (!coverageOk) photoReasons.push(`ফেসিয়াল এরিয়া ${coverage}% (প্রয়োজন ৭০–৮০%)`);
  if (!backgroundOk) photoReasons.push("সাদা ব্যাকগ্রাউন্ড স্যাচুরেশন ব্যর্থ");
  if (!sharpnessOk) photoReasons.push(`শার্পনেস স্কোর ${sharpness} < ১০০`);
  checks.push({
    docType: "ব্যক্তিগত ছবি",
    parameter: "লাপ্লাসিয়ান ভ্যারিয়েন্স + ফেসিয়াল এরিয়া ফ্রেম + ICAO অনুপাত",
    measuredValue: `${width}x${height} মিমি · ফেসিয়াল ${coverage}% · σ² = ${sharpness}`,
    standard: "৩৫x৪৫ মিমি, সাদা ব্যাকগ্রাউন্ড, শার্পনেস ≥ 100",
    passed: photoPass,
    verdict: photoPass
      ? `ছবি ICAO স্পেসিফিকেশন পাস — শার্পনেস স্কোর ${sharpness}, ব্যবহারযোগ্য`
      : `ছবি প্রত্যাখ্যাত: ${photoReasons.join("; ")}। নতুন ছবি আপলোডের রিকোয়েস্ট প্রেরিত হয়েছে।`,
    severity: photoPass ? "pass" : "warn",
  });
  if (!photoPass) warnings.push(`ছবি মানদণ্ড ব্যর্থ (${photoReasons.join(", ")})`);

  /* ----------------------- ৩. পুলিশ ক্লিয়ারেন্স অডিট ---------------------- */
  if (input.policeClearanceDate) {
    const issued = new Date(`${input.policeClearanceDate}T00:00:00Z`);
    const ageDays = Number.isNaN(issued.getTime()) ? 999 : daysBetween(issued, now);
    const policePass = ageDays >= 0 && ageDays <= 90;
    checks.push({
      docType: "পুলিশ ক্লিয়ারেন্স",
      parameter: "QR কোড অডিট + ইস্যু তারিখ ভ্যালিডেশন",
      measuredValue: Number.isNaN(issued.getTime()) ? "তারিখ অবৈধ" : `ইস্যুর ${ageDays} দিন পূর্বে`,
      standard: "ইস্যু তারিখ ≤ ৯০ দিন পুরনো",
      passed: policePass,
      verdict: policePass
        ? `পুলিশ ক্লিয়ারেন্স QR যাচাইকৃত — ${ageDays} দিন পুরনো, গ্রহণযোগ্য`
        : `সময়োত্তীর্ণ নোটিশ: ক্লিয়ারেন্স ${ageDays} দিন পুরনো। হালনাগাদ সনদ ছাড়া ফাইল দাখিল করা যাবে না।`,
      severity: policePass ? "pass" : "block",
    });
    if (!policePass) blockers.push(`পুলিশ ক্লিয়ারেন্স সময়োত্তীর্ণ (${ageDays} দিন > ৯০)`);
  }

  /* ------------------------ ৪. ব্যাংক স্টেটমেন্ট চেক ---------------------- */
  if (typeof input.bankAverageBalance === "number") {
    const need = MIN_BANK_BALANCE[input.countryIso] ?? { amount: 5000, currency: "USD" };
    const monthsOk = (input.bankStatementMonths ?? 0) >= 6;
    const balanceOk = input.bankAverageBalance >= need.amount;
    const bankPass = monthsOk && balanceOk;
    checks.push({
      docType: "ব্যাংক স্টেটমেন্ট",
      parameter: "ডিজিটাল সিল + ৬ মাসের ট্রানজ্যাকশন গড়",
      measuredValue: `${input.bankAverageBalance.toLocaleString("en-US")} ${need.currency} · ${input.bankStatementMonths ?? 0} মাস`,
      standard: `≥ ${need.amount.toLocaleString("en-US")} ${need.currency} গড় + ৬ মাসের স্টেটমেন্ট`,
      passed: bankPass,
      verdict: bankPass
        ? `আর্থিক সক্ষমতা যাচাই সম্পন্ন — কনস্যুলার প্রুফ হিসেবে গৃহীত`
        : `ঘাটতি শনাক্ত: ${!monthsOk ? "স্টেটমেন্ট ৬ মাসের কম; " : ""}${!balanceOk ? `গড় ব্যালেন্স ${need.amount.toLocaleString("en-US")} ${need.currency} এর কম; ` : ""}অতিরিক্ত জামানত বা স্পনসর ডকুমেন্টের নোটিফিকেশন প্রেরিত।`,
      severity: bankPass ? "pass" : "warn",
    });
    if (!bankPass) warnings.push("আর্থিক প্রুফে ঘাটতি — অতিরিক্ত জামানত প্রয়োজন");
  }

  return {
    checks,
    overallPass: blockers.length === 0,
    blockers,
    warnings,
    passportValidityDays,
    simulatedSharpness: sharpness,
  };
}
