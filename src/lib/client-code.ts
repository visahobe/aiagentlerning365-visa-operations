export const COUNTRY_CODES: Record<string, string> = {
  TUR: "তুরস্ক",
  MLT: "মাল্টা",
  SRB: "সার্বিয়া",
  MDA: "মলদোভা",
  BLR: "বেলারুশ",
  SAU: "সৌদি আরব",
  BHR: "বাহরাইন",
  MYS: "মালয়েশিয়া",
};

export const VISA_CODES: Record<string, string> = {
  WRK: "ওয়ার্ক ভিসা",
  VIS: "ভিজিটর ভিসা",
  SLF: "সেলফ-স্পন্সরশিপ",
};

/**
 * WVC-[COUNTRY CODE]-[VISA TYPE]-[YEAR]-[SEQUENCE_ID]
 * উদাহরণ: WVC-SRB-WRK-2026-0001
 */
export function buildClientCode(iso3: string, visaCode: string, year: number, sequence: number): string {
  if (!/^[A-Z]{3}$/.test(iso3)) throw new Error("INVALID_COUNTRY_CODE");
  if (!/^(WRK|VIS|SLF)$/.test(visaCode)) throw new Error("INVALID_VISA_CODE");
  if (!Number.isFinite(sequence) || sequence < 1) throw new Error("INVALID_SEQUENCE");
  return `WVC-${iso3}-${visaCode}-${year}-${String(sequence).padStart(4, "0")}`;
}

export function parseClientCode(code: string) {
  const match = /^WVC-([A-Z]{3})-(WRK|VIS|SLF)-(\d{4})-(\d{4})$/.exec(code.trim().toUpperCase());
  if (!match) return null;
  return {
    prefix: "WVC",
    countryIso: match[1],
    visaCode: match[2],
    year: Number(match[3]),
    sequence: Number(match[4]),
    countryBn: COUNTRY_CODES[match[1]] ?? "অজানা",
    visaBn: VISA_CODES[match[2]] ?? "অজানা",
  };
}
