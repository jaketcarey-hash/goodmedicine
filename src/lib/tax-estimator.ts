/**
 * Canadian tax estimator — 2026 rates.
 * These are estimates only. Not tax advice.
 */

// ---- Federal brackets (2026) ----
const FEDERAL_BRACKETS: [number, number][] = [
  [58_523, 0.14],
  [58_522, 0.205],   // 58,523 to 117,045
  [64_395, 0.26],    // 117,045 to 181,440
  [77_042, 0.29],    // 181,440 to 258,482
  [Infinity, 0.33],  // above 258,482
];

const FEDERAL_BASIC_PERSONAL = 16_452;

// ---- Provincial first-bracket rates and basic personal amounts ----
interface ProvincialInfo {
  label: string;
  rate: number;
  basicPersonal: number;
}

export const PROVINCES: Record<string, ProvincialInfo> = {
  BC: { label: 'British Columbia', rate: 0.056, basicPersonal: 13_216 },
  AB: { label: 'Alberta', rate: 0.10, basicPersonal: 22_769 },
  SK: { label: 'Saskatchewan', rate: 0.105, basicPersonal: 20_381 },
  MB: { label: 'Manitoba', rate: 0.108, basicPersonal: 15_780 },
  ON: { label: 'Ontario', rate: 0.0505, basicPersonal: 12_989 },
  QC: { label: 'Quebec', rate: 0.14, basicPersonal: 18_952 },
  NB: { label: 'New Brunswick', rate: 0.094, basicPersonal: 13_664 },
  NS: { label: 'Nova Scotia', rate: 0.0879, basicPersonal: 11_932 },
  PE: { label: 'Prince Edward Island', rate: 0.0965, basicPersonal: 15_000 },
  NL: { label: 'Newfoundland & Labrador', rate: 0.087, basicPersonal: 11_188 },
  YT: { label: 'Yukon', rate: 0.064, basicPersonal: 16_452 },
  NT: { label: 'Northwest Territories', rate: 0.059, basicPersonal: 18_198 },
  NU: { label: 'Nunavut', rate: 0.04, basicPersonal: 19_659 },
};

// ---- CPP / EI (2026) ----
const CPP_RATE = 0.0595;
const CPP_EXEMPTION = 3_500;
const CPP_MAX_PENSIONABLE = 74_600;

const EI_RATE = 0.0163;
const EI_MAX_INSURABLE = 68_900;

// ---- GST credit rough estimate (single adult, July 2025–June 2026) ----
const GST_CREDIT_SINGLE = 533;

// ---- Calculation functions ----

function applyBrackets(income: number, brackets: [number, number][], basicPersonal: number): number {
  const taxable = Math.max(income - basicPersonal, 0);
  let remaining = taxable;
  let tax = 0;

  for (const [width, rate] of brackets) {
    if (remaining <= 0) break;
    const amount = Math.min(remaining, width);
    tax += amount * rate;
    remaining -= amount;
  }

  return tax;
}

/** Estimate federal tax on employment income. */
export function estimateFederalTax(income: number): number {
  if (income <= 0) return 0;
  return applyBrackets(income, FEDERAL_BRACKETS, FEDERAL_BASIC_PERSONAL);
}

/** Estimate provincial tax using first-bracket approximation. */
export function estimateProvincialTax(income: number, province: string): number {
  if (income <= 0) return 0;
  const info = PROVINCES[province];
  if (!info) return 0;
  const taxable = Math.max(income - info.basicPersonal, 0);
  return taxable * info.rate;
}

/** Estimate CPP contributions. */
export function estimateCPP(income: number): number {
  if (income <= CPP_EXEMPTION) return 0;
  const pensionable = Math.min(income, CPP_MAX_PENSIONABLE) - CPP_EXEMPTION;
  return Math.max(pensionable * CPP_RATE, 0);
}

/** Estimate EI premiums. */
export function estimateEI(income: number): number {
  if (income <= 0) return 0;
  const insurable = Math.min(income, EI_MAX_INSURABLE);
  return insurable * EI_RATE;
}

export interface TaxEstimate {
  federal: number;
  provincial: number;
  cpp: number;
  ei: number;
  total: number;
  effectiveRate: number;
  monthlyTakeHome: number;
  annualTakeHome: number;
  gstCredit: number;
}

/**
 * Estimate total taxes and take-home pay.
 * exemptPercentage: 0 = not exempt, 100 = fully exempt (Section 87), or partial.
 * rrspContribution: reduces taxable income.
 */
export function estimateTotal(
  income: number,
  province: string,
  exemptPercentage: number = 0,
  rrspContribution: number = 0,
): TaxEstimate {
  if (income <= 0) {
    return {
      federal: 0, provincial: 0, cpp: 0, ei: 0, total: 0,
      effectiveRate: 0, monthlyTakeHome: 0, annualTakeHome: 0, gstCredit: GST_CREDIT_SINGLE,
    };
  }

  const exemptFraction = Math.min(Math.max(exemptPercentage, 0), 100) / 100;
  const taxableIncome = income * (1 - exemptFraction);
  const adjustedIncome = Math.max(taxableIncome - rrspContribution, 0);

  const federal = estimateFederalTax(adjustedIncome);
  const provincial = estimateProvincialTax(adjustedIncome, province);

  // CPP/EI apply to employment income even if tax-exempt under Section 87
  // when working off-reserve. For simplicity, apply to taxable portion.
  const cpp = estimateCPP(taxableIncome);
  const ei = estimateEI(taxableIncome);

  const total = federal + provincial + cpp + ei;
  const effectiveRate = income > 0 ? (total / income) * 100 : 0;
  const annualTakeHome = income - total;
  const monthlyTakeHome = annualTakeHome / 12;

  // GST credit estimate (rough — depends on net income)
  const gstCredit = adjustedIncome < 50_000 ? GST_CREDIT_SINGLE : 0;

  return {
    federal, provincial, cpp, ei, total,
    effectiveRate, monthlyTakeHome, annualTakeHome, gstCredit,
  };
}
