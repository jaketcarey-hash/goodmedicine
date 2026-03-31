/* ============================================================
   Settlement Decision Simulator — Pure Math
   Models the long-term impact of distribute-vs-invest decisions
   for First Nations settlement funds over seven generations.
   ============================================================ */

export interface GenerationResult {
  generation: number;         // 0 = today, 1–7 = future
  year: number;               // calendar year
  trustBalance: number;
  annualDistribution: number; // what the trust pays out that year
  perMemberAnnual: number;    // annual distribution / members
  cumulativeDistributed: number;
  members: number;            // population at this snapshot
}

export interface SimulationResult {
  initialPerCap: number;
  investedAmount: number;
  distributedAmount: number;
  generations: GenerationResult[];
  totalDistributedOver175Years: number;
  multiplierVsPureDist: number;
  depletionYear: number | null; // year the trust hits zero, or null if perpetual
}

const CURRENT_YEAR = 2026;
const GENERATION_SPAN = 25;
const TOTAL_GENERATIONS = 7;
const TOTAL_YEARS = GENERATION_SPAN * TOTAL_GENERATIONS; // 175

/**
 * Simulates a settlement decision across seven generations.
 *
 * @param totalAmount     Total settlement in dollars
 * @param members         Current community population
 * @param distributePercent  0–100: percentage distributed as per-cap today
 * @param annualReturn    Expected annual return (e.g. 0.06 for 6%)
 * @param spendingRate    Annual trust payout rate (e.g. 0.04 for 4%)
 * @param populationGrowth Annual population growth (e.g. 0.015 for 1.5%)
 */
export function simulateSettlement(
  totalAmount: number,
  members: number,
  distributePercent: number,
  annualReturn: number = 0.06,
  spendingRate: number = 0.04,
  populationGrowth: number = 0.015,
): SimulationResult {
  const distributedAmount = totalAmount * (distributePercent / 100);
  const investedAmount = totalAmount - distributedAmount;
  const initialPerCap = members > 0 ? distributedAmount / members : 0;

  let balance = investedAmount;
  let cumulativeDistributed = distributedAmount;
  let depletionYear: number | null = null;
  let population = members;

  // Snapshot generation 0 (today)
  const generations: GenerationResult[] = [
    {
      generation: 0,
      year: CURRENT_YEAR,
      trustBalance: balance,
      annualDistribution: 0,
      perMemberAnnual: 0,
      cumulativeDistributed: distributedAmount,
      members: population,
    },
  ];

  // Simulate year by year, capturing snapshots at generation boundaries
  for (let y = 1; y <= TOTAL_YEARS; y++) {
    population = members * Math.pow(1 + populationGrowth, y);

    if (balance > 0) {
      const growth = balance * annualReturn;
      const payout = balance * spendingRate;
      const newBalance = balance + growth - payout;

      if (newBalance <= 0) {
        // Trust depleted — the actual payout is whatever was left plus growth
        cumulativeDistributed += balance + growth;
        balance = 0;
        if (depletionYear === null) depletionYear = CURRENT_YEAR + y;
      } else {
        balance = newBalance;
        cumulativeDistributed += payout;
      }
    }

    // Capture at generation boundaries
    if (y % GENERATION_SPAN === 0) {
      const gen = y / GENERATION_SPAN;
      const annualDist = balance > 0 ? balance * spendingRate : 0;
      const perMember = population > 0 ? annualDist / population : 0;

      generations.push({
        generation: gen,
        year: CURRENT_YEAR + y,
        trustBalance: balance,
        annualDistribution: annualDist,
        perMemberAnnual: perMember,
        cumulativeDistributed,
        members: Math.round(population),
      });
    }
  }

  const totalDistributedOver175Years = cumulativeDistributed;
  const multiplierVsPureDist = totalAmount > 0
    ? totalDistributedOver175Years / totalAmount
    : 0;

  return {
    initialPerCap,
    investedAmount,
    distributedAmount,
    generations,
    totalDistributedOver175Years,
    multiplierVsPureDist,
    depletionYear,
  };
}

/**
 * Format a dollar amount with human-readable abbreviation.
 * $1.2B, $450M, $52K, $3,200 — Canadian dollars.
 */
export function formatCurrency(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    const val = abs / 1_000_000_000;
    return `${sign}$${val >= 100 ? val.toFixed(0) : val >= 10 ? val.toFixed(1) : val.toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    const val = abs / 1_000_000;
    return `${sign}$${val >= 100 ? val.toFixed(0) : val >= 10 ? val.toFixed(1) : val.toFixed(2)}M`;
  }
  if (abs >= 10_000) {
    const val = abs / 1_000;
    return `${sign}$${val >= 100 ? val.toFixed(0) : val.toFixed(1)}K`;
  }
  if (abs >= 1_000) {
    return `${sign}$${abs.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  return `${sign}$${abs.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Format a multiplier cleanly: 12.4x, 1.0x, etc.
 */
export function formatMultiplier(n: number): string {
  if (n >= 100) return `${n.toFixed(0)}x`;
  if (n >= 10) return `${n.toFixed(1)}x`;
  return `${n.toFixed(1)}x`;
}
