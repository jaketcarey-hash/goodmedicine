/**
 * Debt payoff planner — stored entirely on-device.
 * See exactly when you'll be debt-free.
 */

export interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
}

export interface DebtPlan {
  debts: Debt[];
  extraMonthly: number;
  strategy: 'avalanche' | 'snowball';
}

export interface PayoffMonth {
  month: number;
  balances: Record<string, number>;
  totalBalance: number;
  interestPaid: number;
  principalPaid: number;
  debtsPaidOff: string[];
}

const STORAGE_KEY = 'gm_debt_plan';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Save the current debt plan. */
export function savePlan(plan: DebtPlan): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}

/** Load the current debt plan, or a default. */
export function getPlan(): DebtPlan {
  if (typeof window === 'undefined') return { debts: [], extraMonthly: 0, strategy: 'avalanche' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through
  }
  return { debts: [], extraMonthly: 0, strategy: 'avalanche' };
}

/** Create a new debt with a generated ID. */
export function createDebt(name: string, balance: number, interestRate: number, minimumPayment: number): Debt {
  return { id: generateId(), name, balance, interestRate, minimumPayment };
}

/**
 * Simulate month-by-month payoff.
 * Returns an array of monthly states. Caps at 600 months (50 years) as a safety valve.
 */
export function calculatePayoff(plan: DebtPlan): PayoffMonth[] {
  if (plan.debts.length === 0) return [];

  const balances: Record<string, number> = {};
  const minimums: Record<string, number> = {};
  const rates: Record<string, number> = {};
  const activeIds = new Set<string>();

  for (const d of plan.debts) {
    balances[d.id] = d.balance;
    minimums[d.id] = d.minimumPayment;
    rates[d.id] = d.interestRate / 100 / 12; // monthly rate
    if (d.balance > 0) activeIds.add(d.id);
  }

  const timeline: PayoffMonth[] = [];
  let month = 0;

  // Track rolled-over minimums from paid-off debts
  let rolledMinimums = 0;

  while (activeIds.size > 0 && month < 600) {
    month++;
    let monthInterest = 0;
    let monthPrincipal = 0;
    const paidOff: string[] = [];

    // Apply interest
    for (const id of activeIds) {
      const interest = balances[id] * rates[id];
      balances[id] += interest;
      monthInterest += interest;
    }

    // Apply minimum payments to all active debts
    let surplusFromPayoffs = 0;
    for (const id of [...activeIds]) {
      const payment = Math.min(minimums[id], balances[id]);
      balances[id] -= payment;
      monthPrincipal += payment;
      if (balances[id] <= 0.01) {
        surplusFromPayoffs += minimums[id] - payment;
        rolledMinimums += minimums[id];
        balances[id] = 0;
        activeIds.delete(id);
        paidOff.push(id);
      }
    }

    // Extra = user's extra + rolled minimums from previously paid debts + surplus from this month
    let remaining = plan.extraMonthly + rolledMinimums + surplusFromPayoffs;

    // Apply extra to target debts in priority order
    while (remaining > 0.01 && activeIds.size > 0) {
      const targetId = getTargetDebt(plan.strategy, activeIds, balances, rates);
      if (!targetId) break;
      const payment = Math.min(remaining, balances[targetId]);
      balances[targetId] -= payment;
      monthPrincipal += payment;
      remaining -= payment;
      if (balances[targetId] <= 0.01) {
        rolledMinimums += minimums[targetId];
        balances[targetId] = 0;
        activeIds.delete(targetId);
        paidOff.push(targetId);
      }
    }

    const totalBalance = Object.values(balances).reduce((s, b) => s + b, 0);

    timeline.push({
      month,
      balances: { ...balances },
      totalBalance,
      interestPaid: monthInterest,
      principalPaid: monthPrincipal,
      debtsPaidOff: paidOff,
    });

    if (totalBalance <= 0.01) break;
  }

  return timeline;
}

function getTargetDebt(
  strategy: 'avalanche' | 'snowball',
  activeIds: Set<string>,
  balances: Record<string, number>,
  rates: Record<string, number>,
): string | null {
  const ids = [...activeIds];
  if (ids.length === 0) return null;

  if (strategy === 'avalanche') {
    // Highest interest rate first
    ids.sort((a, b) => rates[b] - rates[a]);
  } else {
    // Lowest balance first
    ids.sort((a, b) => balances[a] - balances[b]);
  }
  return ids[0];
}

/** Calculate total interest paid over the full payoff timeline. */
export function calculateTotalInterest(timeline: PayoffMonth[]): number {
  return timeline.reduce((sum, m) => sum + m.interestPaid, 0);
}

/** Get the payoff date from today, given a timeline. */
export function getPayoffDate(timeline: PayoffMonth[]): Date | null {
  if (timeline.length === 0) return null;
  const months = timeline.length;
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
}
