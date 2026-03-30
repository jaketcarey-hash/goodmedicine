/**
 * Canadian tax estimator — 2025 rates.
 * These are estimates only. Not tax advice.
 */

// ---- Federal brackets (2025) ----
const FEDERAL_BRACKETS: [number, number][] = [
  [57_375, 0.15],
  [57_375, 0.205],   // 57,375 to 114,750
  [43_718, 0.26],    // 114,750 to 158,468
  [61_532, 0.29],    // 158,468 to 220,000
  [Infinity, 0.33],  // above 220,000
];

const FEDERAL_BASIC_PERSONAL = 16_129;

// ---- Provincial first-bracket rates and basic personal amounts ----
interface ProvincialInfo {
  label: string;
  rate: number;
  basicPersonal: number;
}

export const PROVINCES: Record<string, ProvincialInfo> = {
  BC: { label: 'British Columbia', rate: 0.0506, basicPersonal: 12_580 },
  AB: { label: 'Alberta', rate: 0.10, basicPersonal: 21_885 },
  SK: { label: 'Saskatchewan', rate: 0.105, basicPersonal: 18_491 },
  MB: { label: 'Manitoba', rate: 0.108, basicPersonal: 15_780 },
  ON: { label: 'Ontario', rate: 0.0505, basicPersonal: 11_865 },
  QC: { label: 'Quebec', rate: 0.14, basicPersonal: 18_056 },
  NB: { label: 'New Brunswick', rate: 0.094, basicPersonal: 13_044 },
  NS: { label: 'Nova Scotia', rate: 0.0879, basicPersonal: 11_481 },
  PE: { label: 'Prince Edward Island', rate: 0.0965, basicPersonal: 13_500 },
  NL: { label: 'Newfoundland & Labrador', rate: 0.087, basicPersonal: 10_818 },
  YT: { label: 'Yukon', rate: 0.064, basicPersonal: 16_129 },
  NT: { label: 'Northwest Territories', rate: 0.059, basicPersonal: 16_593 },
  NU: { label: 'Nunavut', rate: 0.04, basicPersonal: 18_767 },
};

// ---- CPP / EI (2025) ----
const CPP_RATE = 0.0595;
const CPP_EXEMPTION = 3_500;
const CPP_MAX_PENSIONABLE = 68_500;

const EI_RATE = 0.0163;
const EI_MAX_INSURABLE = 65_700;

// ---- GST credit rough estimate (single adult, 2025) ----
const GST_CREDIT_SINGLE = 519;

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
