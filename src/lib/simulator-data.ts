/* ============================================================
   Life Change Simulator — Cost of Living Data & Tax Helpers
   Canadian cities, federal/provincial tax brackets, CPP/EI.
   All figures are 2025 estimates for illustration only.
   ============================================================ */

export interface CityData {
  name: string;
  province: string;
  rent: number;       // avg 1-bedroom monthly
  groceries: number;
  transit: number;
  utilities: number;
  phone: number;
}

// Province codes mapped to full names
export const provinceNames: Record<string, string> = {
  BC: 'British Columbia',
  AB: 'Alberta',
  SK: 'Saskatchewan',
  MB: 'Manitoba',
  ON: 'Ontario',
  QC: 'Quebec',
  NB: 'New Brunswick',
  NS: 'Nova Scotia',
  PE: 'Prince Edward Island',
  NL: 'Newfoundland and Labrador',
  YT: 'Yukon',
  NT: 'Northwest Territories',
  NU: 'Nunavut',
};

const cities: CityData[] = [
  { name: 'Vancouver',    province: 'BC', rent: 2400, groceries: 450, transit: 110, utilities: 80,  phone: 70 },
  { name: 'Victoria',     province: 'BC', rent: 1900, groceries: 420, transit: 85,  utilities: 75,  phone: 70 },
  { name: 'Kelowna',      province: 'BC', rent: 1700, groceries: 400, transit: 60,  utilities: 75,  phone: 70 },
  { name: 'Edmonton',     province: 'AB', rent: 1300, groceries: 380, transit: 100, utilities: 120, phone: 70 },
  { name: 'Calgary',      province: 'AB', rent: 1500, groceries: 400, transit: 110, utilities: 110, phone: 70 },
  { name: 'Saskatoon',    province: 'SK', rent: 1100, groceries: 370, transit: 75,  utilities: 130, phone: 70 },
  { name: 'Regina',       province: 'SK', rent: 1050, groceries: 370, transit: 75,  utilities: 140, phone: 70 },
  { name: 'Winnipeg',     province: 'MB', rent: 1150, groceries: 380, transit: 100, utilities: 120, phone: 70 },
  { name: 'Thunder Bay',  province: 'ON', rent: 1100, groceries: 400, transit: 70,  utilities: 120, phone: 70 },
  { name: 'Toronto',      province: 'ON', rent: 2300, groceries: 450, transit: 160, utilities: 80,  phone: 70 },
  { name: 'Ottawa',       province: 'ON', rent: 1700, groceries: 420, transit: 125, utilities: 90,  phone: 70 },
  { name: 'Montreal',     province: 'QC', rent: 1400, groceries: 380, transit: 94,  utilities: 70,  phone: 65 },
  { name: 'Quebec City',  province: 'QC', rent: 1100, groceries: 370, transit: 90,  utilities: 70,  phone: 65 },
  { name: 'Halifax',      province: 'NS', rent: 1600, groceries: 400, transit: 82,  utilities: 100, phone: 70 },
  { name: 'Moncton',      province: 'NB', rent: 1200, groceries: 370, transit: 65,  utilities: 110, phone: 70 },
  { name: 'Whitehorse',   province: 'YT', rent: 1400, groceries: 500, transit: 0,   utilities: 150, phone: 80 },
  { name: 'Yellowknife',  province: 'NT', rent: 1600, groceries: 550, transit: 0,   utilities: 180, phone: 80 },
];

// ---- Public accessors ----

export function getCities(): CityData[] {
  return cities;
}

export function getCityByName(name: string): CityData | undefined {
  return cities.find((c) => c.name === name);
}

export function estimateMonthlyCosts(city: CityData): number {
  return city.rent + city.groceries + city.transit + city.utilities + city.phone;
}

// ---- Federal tax brackets (2025) ----

const federalBrackets = [
  { limit: 57_375,  rate: 0.15 },
  { limit: 114_750, rate: 0.205 },
  { limit: 158_468, rate: 0.26 },
  { limit: 220_000, rate: 0.29 },
  { limit: Infinity, rate: 0.33 },
];

const federalPersonalAmount = 16_129;

// Simplified provincial rates (first bracket only — estimation)
const provincialRates: Record<string, number> = {
  BC: 0.0506,
  AB: 0.10,
  SK: 0.105,
  MB: 0.108,
  ON: 0.0505,
  QC: 0.14,
  NB: 0.094,
  NS: 0.0879,
  PE: 0.0965,
  NL: 0.087,
  YT: 0.064,
  NT: 0.059,
  NU: 0.04,
};

function calcFederalTax(taxableIncome: number): number {
  const income = Math.max(0, taxableIncome - federalPersonalAmount);
  let tax = 0;
  let prev = 0;

  for (const bracket of federalBrackets) {
    const taxable = Math.min(income, bracket.limit) - prev;
    if (taxable <= 0) break;
    tax += taxable * bracket.rate;
    prev = bracket.limit;
  }

  return tax;
}

function calcProvincialTax(taxableIncome: number, province: string): number {
  // Simplified: flat first-bracket rate on full income above a basic personal amount
  // Using ~$11,000 as a rough average provincial personal amount
  const provincialPersonal = 11_000;
  const rate = provincialRates[province] ?? 0.05;
  return Math.max(0, (taxableIncome - provincialPersonal) * rate);
}

/**
 * Estimate monthly income tax. If isExempt is true (Section 87), returns 0.
 * This is a simplified estimate — not tax advice.
 */
export function estimateMonthlyTax(annualIncome: number, province: string, isExempt: boolean): number {
  if (isExempt || annualIncome <= 0) return 0;

  const federal = calcFederalTax(annualIncome);
  const provincial = calcProvincialTax(annualIncome, province);

  return Math.round((federal + provincial) / 12);
}

/**
 * Estimate annual federal tax (for breakdown displays).
 */
export function estimateAnnualFederalTax(annualIncome: number): number {
  if (annualIncome <= 0) return 0;
  return Math.round(calcFederalTax(annualIncome));
}

/**
 * Estimate annual provincial tax (for breakdown displays).
 */
export function estimateAnnualProvincialTax(annualIncome: number, province: string): number {
  if (annualIncome <= 0) return 0;
  return Math.round(calcProvincialTax(annualIncome, province));
}

// ---- CPP & EI ----

const CPP_RATE = 0.0595;
const CPP_MAX_PENSIONABLE = 71_300;
const CPP_EXEMPTION = 3_500;

const EI_RATE = 0.0163;
const EI_MAX_INSURABLE = 65_700;

/**
 * Estimate annual CPP and EI contributions.
 */
export function estimateCPPEI(annualIncome: number): { cpp: number; ei: number } {
  const cppPensionable = Math.min(annualIncome, CPP_MAX_PENSIONABLE) - CPP_EXEMPTION;
  const cpp = Math.max(0, Math.round(cppPensionable * CPP_RATE));

  const eiInsurable = Math.min(annualIncome, EI_MAX_INSURABLE);
  const ei = Math.max(0, Math.round(eiInsurable * EI_RATE));

  return { cpp, ei };
}

/**
 * Monthly CPP + EI deductions combined.
 */
export function estimateMonthlyCPPEI(annualIncome: number): number {
  const { cpp, ei } = estimateCPPEI(annualIncome);
  return Math.round((cpp + ei) / 12);
}
