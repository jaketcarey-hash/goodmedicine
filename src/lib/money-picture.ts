/**
 * The money picture — one read-only view across every money store.
 *
 * Each tool on this site owns its own data and writes only that. This module
 * relaxes the other half of that convention: it reads across all of them and
 * never writes any. It exists so a surface can say "here is where you stand,
 * from what you've already entered" without asking anything twice.
 *
 * Two rules keep it honest:
 *
 * 1. Absence is stated, not zero-filled. Every field is null when the person
 *    has not entered that data. A picture with nulls is a true picture; a
 *    zero would be a claim.
 * 2. Suggestions derive from stated data only, and each one names the datum
 *    it rests on. "What usually helps", never "you should" — the same line
 *    situations.ts holds: this site is education, not advice, and it names
 *    kinds of professionals, never one.
 *
 * There is deliberately no score in here and never will be. A composite
 * number that can go down is advice wearing a costume, and it punishes
 * absence — both are lines this site does not cross.
 */

import { STORAGE_KEYS } from './storage-keys';
import {
  getBudget,
  getAllBudgetMonths,
  getMonthlyIncome,
  getMonthlyExpenses,
  type BudgetEntry,
} from './budget-store';
import { getPlan, calculatePayoff } from './debt-store';
import { getGoals } from './savings-store';
import { getSnapshots, getWorkingState, calcNetWorth } from './networth-store';
import { getProfile, hasProfile, type CalendarProfile } from './calendar-store';

export interface MoneyPicture {
  /** Latest month with budget entries; null if no month has any. */
  income: { monthly: number; month: string } | null;
  expenses: { monthly: number; month: string } | null;
  /** income minus expenses for that same month; null unless both exist. */
  surplus: number | null;
  debt: {
    total: number;
    /** Months to zero under the saved plan; null if the plan never gets there. */
    debtFreeMonths: number | null;
    extraMonthly: number;
    strategy: 'avalanche' | 'snowball';
    highestRate: number;
  } | null;
  savings: { goals: number; saved: number; target: number } | null;
  netWorth: {
    current: number;
    trend: 'up' | 'down' | 'flat' | null;
    snapshots: number;
    lastSnapshot: string | null;
  } | null;
  /** From the Section 87 Checker's saved verdict. */
  taxStatus: { outcome: string; checkedOn: string } | null;
  /** From the Benefits Finder's saved run. */
  benefits: { checkedOn: string; filedTaxes: boolean } | null;
  household: CalendarProfile | null;
}

export interface NextStep {
  id: string;
  title: string;
  /** Names the datum this step rests on. Never fires on a guess. */
  why: string;
  tool: { label: string; href: string };
  article?: { label: string; href: string };
}

/** "2026-03" → "March". */
function monthName(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-CA', { month: 'long' });
}

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** The latest month whose budget actually has entries. Read-only — unlike
 *  getCurrentBudget(), this never creates a month. */
function latestBudgetWithEntries(): BudgetEntry | null {
  for (const month of getAllBudgetMonths()) {
    const budget = getBudget(month);
    if (budget && (budget.income.length > 0 || budget.expenses.length > 0)) {
      return budget;
    }
  }
  return null;
}

export function getMoneyPicture(): MoneyPicture {
  const picture: MoneyPicture = {
    income: null,
    expenses: null,
    surplus: null,
    debt: null,
    savings: null,
    netWorth: null,
    taxStatus: null,
    benefits: null,
    household: null,
  };

  if (typeof window === 'undefined') return picture;

  const budget = latestBudgetWithEntries();
  if (budget) {
    if (budget.income.length > 0) {
      picture.income = { monthly: getMonthlyIncome(budget), month: budget.month };
    }
    if (budget.expenses.length > 0) {
      picture.expenses = { monthly: getMonthlyExpenses(budget), month: budget.month };
    }
    if (picture.income && picture.expenses) {
      picture.surplus = picture.income.monthly - picture.expenses.monthly;
    }
  }

  const debtPlan = getPlan();
  if (debtPlan.debts.length > 0) {
    const timeline = calculatePayoff(debtPlan);
    const last = timeline[timeline.length - 1];
    picture.debt = {
      total: debtPlan.debts.reduce((sum, d) => sum + d.balance, 0),
      debtFreeMonths: last && last.totalBalance <= 0 ? timeline.length : null,
      extraMonthly: debtPlan.extraMonthly,
      strategy: debtPlan.strategy,
      highestRate: Math.max(...debtPlan.debts.map((d) => d.interestRate)),
    };
  }

  const goals = getGoals();
  if (goals.length > 0) {
    picture.savings = {
      goals: goals.length,
      saved: goals.reduce((sum, g) => sum + g.currentAmount, 0),
      target: goals.reduce((sum, g) => sum + g.targetAmount, 0),
    };
  }

  const snapshots = getSnapshots();
  const working = getWorkingState();
  if (snapshots.length > 0 || working.assets.length > 0 || working.debts.length > 0) {
    const current = calcNetWorth(working.assets, working.debts);
    let trend: 'up' | 'down' | 'flat' | null = null;
    if (snapshots.length >= 2) {
      const prev = snapshots[snapshots.length - 2];
      const latest = snapshots[snapshots.length - 1];
      const delta = calcNetWorth(latest.assets, latest.debts) - calcNetWorth(prev.assets, prev.debts);
      trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
    }
    picture.netWorth = {
      current,
      trend,
      snapshots: snapshots.length,
      lastSnapshot: snapshots[snapshots.length - 1]?.date ?? null,
    };
  }

  const s87 = readJson<{ outcome?: string; timestamp?: string }>(STORAGE_KEYS.SECTION87_RESULT);
  if (s87?.outcome && s87.timestamp) {
    picture.taxStatus = { outcome: s87.outcome, checkedOn: s87.timestamp };
  }

  const benefits = readJson<{ timestamp?: string; answers?: { filedTaxes?: string } }>(
    STORAGE_KEYS.BENEFITS_RESULTS,
  );
  if (benefits?.timestamp && benefits.answers) {
    picture.benefits = {
      checkedOn: benefits.timestamp,
      filedTaxes: benefits.answers.filedTaxes === 'yes',
    };
  }

  if (hasProfile()) {
    picture.household = getProfile();
  }

  return picture;
}

/**
 * What usually helps next, from the picture alone.
 *
 * A fixed, hand-written rule list — not a model, not a score. Rules fire
 * only on data the person entered, each `why` states that datum, and the
 * order below is the display order: the earlier the rule, the more it
 * usually matters. Copy here is reviewed against the situations.ts
 * boundary before any change ships.
 */
export function suggestNextSteps(picture: MoneyPicture): NextStep[] {
  const steps: NextStep[] = [];
  const fmt = (n: number) =>
    '$' + Math.round(Math.abs(n)).toLocaleString('en-CA');

  // A month that doesn't balance usually matters before anything else.
  if (picture.surplus !== null && picture.surplus < 0 && picture.income) {
    steps.push({
      id: 'shortfall',
      title: 'Look at the month that does not balance',
      why: `Your ${monthName(picture.income.month)} budget shows about ${fmt(picture.surplus)} more going out than coming in.`,
      tool: { label: 'Budget Snapshot', href: '/money/budget-tool' },
      article: { label: 'When budgeting feels impossible', href: '/money/budgeting' },
    });
  }

  // Interest above 20% compounds faster than most plans can outrun.
  if (picture.debt && picture.debt.highestRate > 20) {
    steps.push({
      id: 'high-rate-debt',
      title: 'The highest-rate debt is the expensive one',
      why: `Your debt plan includes a rate of ${picture.debt.highestRate}% — above 20%, interest usually outruns everything else.`,
      tool: { label: 'Debt Planner', href: '/money/debt-planner' },
      article: { label: 'Dealing with debt', href: '/money/debt' },
    });
  }

  // No budget at all: seeing the month is where everything else starts.
  if (!picture.income && !picture.expenses) {
    steps.push({
      id: 'first-budget',
      title: 'See where a month actually goes',
      why: 'Nothing here yet — one month of income and spending is the foundation the other tools build on.',
      tool: { label: 'Budget Snapshot', href: '/money/budget-tool' },
      article: { label: 'Budgeting that works', href: '/money/budgeting' },
    });
  }

  // Filing unlocks benefits even when income is exempt.
  if (picture.benefits && !picture.benefits.filedTaxes) {
    steps.push({
      id: 'file-to-unlock',
      title: 'Filing a return unlocks money',
      why: 'Your Benefits Finder answers say taxes have not been filed recently — several benefits only pay out once a return is in.',
      tool: { label: 'Benefits Finder', href: '/self/benefits' },
      article: { label: 'Why filing matters', href: '/money/taxes' },
    });
  }

  // Surplus with no emergency cushion.
  if (
    picture.surplus !== null &&
    picture.surplus > 0 &&
    picture.income &&
    !(getGoals().some((g) => g.category === 'emergency'))
  ) {
    steps.push({
      id: 'emergency-cushion',
      title: 'A cushion turns a bad week into an inconvenience',
      why: `Your ${monthName(picture.income.month)} budget shows about ${fmt(picture.surplus)} unspent, and no emergency goal exists yet.`,
      tool: { label: 'Savings Tracker', href: '/money/savings-tracker' },
      article: { label: 'Saving and growing', href: '/money/saving' },
    });
  }

  // Debts recorded but the plan has no extra payment and the month has room.
  if (
    picture.debt &&
    picture.debt.extraMonthly === 0 &&
    picture.surplus !== null &&
    picture.surplus > 0
  ) {
    steps.push({
      id: 'extra-payment',
      title: 'See what an extra payment buys you',
      why: `Your debt plan has no extra monthly amount, and your ${picture.income ? monthName(picture.income.month) : ''} budget shows room — the planner shows the months and interest an extra payment removes.`,
      tool: { label: 'Debt Planner', href: '/money/debt-planner' },
      article: { label: 'Dealing with debt', href: '/money/debt' },
    });
  }

  // Working while the exemption question has never been checked.
  if (
    !picture.taxStatus &&
    (picture.household?.isEmployed ||
      (picture.income !== null && picture.income.monthly > 0))
  ) {
    steps.push({
      id: 'check-section-87',
      title: 'Ten questions settle most Section 87 cases',
      why: 'There is income in your picture and no saved Section 87 check — whether it is exempt turns on where the work happens.',
      tool: { label: 'Section 87 Checker', href: '/rights/section-87-checker' },
      article: { label: 'The Section 87 exemption', href: '/rights/section-87' },
    });
  }

  // Never run the Benefits Finder: entitlements go unclaimed silently.
  if (!picture.benefits) {
    steps.push({
      id: 'find-benefits',
      title: 'Six questions surface what you may be entitled to',
      why: 'No saved Benefits Finder run — most unclaimed benefits are unclaimed because nobody said they existed.',
      tool: { label: 'Benefits Finder', href: '/self/benefits' },
      article: { label: 'What am I entitled to?', href: '/what-applies' },
    });
  }

  // A stale net-worth series: one snapshot marks the trend. Only-up framing —
  // the step invites, it does not scold.
  if (picture.netWorth && picture.netWorth.snapshots > 0 && picture.netWorth.lastSnapshot) {
    const days = Math.floor(
      (Date.now() - Date.parse(picture.netWorth.lastSnapshot)) / 86_400_000,
    );
    if (days > 90) {
      steps.push({
        id: 'networth-snapshot',
        title: 'A fresh snapshot marks the trend',
        why: `Your last net-worth snapshot was ${days} days ago — a new one shows which way things moved.`,
        tool: { label: 'Net Worth', href: '/money/net-worth' },
      });
    }
  }

  return steps;
}
