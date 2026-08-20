/**
 * Budget data — stored entirely on-device.
 * No server, no tracking, no accounts. Just you.
 */

import { STORAGE_KEYS } from './storage-keys';

export interface IncomeItem {
  id: string;
  label: string;
  amount: number;
  frequency: 'monthly' | 'biweekly' | 'weekly' | 'irregular';
  category: 'employment' | 'band' | 'benefits' | 'family' | 'other';
  /** A date this item actually landed ("2026-08-07"). Optional — old items
   *  don't have one. With it, the forecast knows which Friday biweekly pay
   *  arrives and what "the 1st" means; without it, the item stays a monthly
   *  average and the forecast says so. */
  anchorDate?: string;
}

export interface ExpenseItem {
  id: string;
  label: string;
  amount: number;
  frequency?: 'monthly' | 'biweekly' | 'weekly';
  /** See IncomeItem.anchorDate. */
  anchorDate?: string;
  category:
    | 'housing'
    | 'food'
    | 'transport'
    | 'phone'
    | 'family-support'
    | 'health'
    | 'education'
    | 'personal'
    | 'savings'
    | 'debt'
    | 'other';
}

export interface BudgetEntry {
  id: string;
  month: string; // "2026-03"
  income: IncomeItem[];
  expenses: ExpenseItem[];
  /** What actually landed this month. Optional — months budgeted before
   *  the record existed have none, and a month can be planned and never
   *  recorded. See "What actually happened" at the foot of this file. */
  actuals?: ActualItem[];
}

const STORAGE_KEY = STORAGE_KEYS.BUDGET_DATA;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getAll(): BudgetEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(entries: BudgetEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/** Get a budget by month string (e.g. "2026-03"). */
export function getBudget(month: string): BudgetEntry | null {
  return getAll().find((b) => b.month === month) ?? null;
}

/** Get or create the budget for the current month. */
export function getCurrentBudget(): BudgetEntry {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const existing = getBudget(month);
  if (existing) return existing;

  const fresh: BudgetEntry = {
    id: generateId(),
    month,
    income: [],
    expenses: [],
  };
  const all = getAll();
  all.push(fresh);
  saveAll(all);
  return fresh;
}

/** Save (create or update) a budget entry. */
export function saveBudget(budget: BudgetEntry): void {
  const all = getAll();
  const idx = all.findIndex((b) => b.month === budget.month);
  if (idx >= 0) {
    all[idx] = budget;
  } else {
    all.push(budget);
  }
  saveAll(all);
}

/** Convert any income frequency to a monthly amount. */
export function toMonthly(amount: number, frequency: IncomeItem['frequency']): number {
  switch (frequency) {
    case 'weekly':
      return amount * 52 / 12;
    case 'biweekly':
      return amount * 26 / 12;
    case 'monthly':
    case 'irregular':
    default:
      return amount;
  }
}

/** Get total monthly income for a budget (normalized across frequencies). */
export function getMonthlyIncome(budget: BudgetEntry): number {
  return budget.income.reduce((sum, item) => sum + toMonthly(item.amount, item.frequency), 0);
}

/** Get total monthly expenses for a budget (normalized across frequencies). */
export function getMonthlyExpenses(budget: BudgetEntry): number {
  return budget.expenses.reduce((sum, item) => sum + toMonthly(item.amount, item.frequency ?? 'monthly'), 0);
}

/** Copy a previous month's budget structure into a new month. */
export function copyBudgetToMonth(sourceMonth: string, targetMonth: string): BudgetEntry | null {
  const source = getBudget(sourceMonth);
  if (!source) return null;

  const newBudget: BudgetEntry = {
    id: generateId(),
    month: targetMonth,
    income: source.income.map((item) => ({ ...item, id: generateId() })),
    expenses: source.expenses.map((item) => ({ ...item, id: generateId() })),
    // Actuals are deliberately not copied. The plan repeats; what happened
    // does not, and a copied record would be a fabricated month.
  };

  saveBudget(newBudget);
  return newBudget;
}

/** Get the most recent month that has a budget (before a given month). */
export function getPreviousMonth(beforeMonth: string): string | null {
  const all = getAll()
    .map((b) => b.month)
    .filter((m) => m < beforeMonth)
    .sort()
    .reverse();
  return all[0] ?? null;
}

/** List all months that have budgets, sorted newest first. */
export function getAllBudgetMonths(): string[] {
  return getAll()
    .map((b) => b.month)
    .sort()
    .reverse();
}

/* ------------------------------------------------------------------ *
 * What actually happened
 *
 * The items above are a plan: what she expects to come in and go out.
 * These are the record: what actually landed, on the day it landed.
 *
 * The two are kept apart on purpose. Editing the plan to match reality
 * loses the reality — and it is the gap between them that teaches. A
 * plan alone forecasts the plan; a plan the record has corrected
 * forecasts her life.
 *
 * Actuals hang off the month they fall in, so the month navigation the
 * budget already has carries them for free, and DataManager exports
 * them with everything else under the one budget key.
 * ------------------------------------------------------------------ */

export interface ActualItem {
  id: string;
  /** The day it landed ("2026-08-14"). Always present — an undated actual
   *  is just another planned number, and could not correct anything. */
  date: string;
  label: string;
  /** Always positive. `kind` carries the direction. */
  amount: number;
  kind: 'income' | 'expense';
  category: ExpenseItem['category'] | IncomeItem['category'];
}

/* Writes live in the component, not here: actuals hang off BudgetEntry, so
 * BudgetTool's existing auto-save persists them exactly as it does income and
 * expenses. One component, one writable store — this file only reads them. */

/** Every recorded actual for a month, oldest first. */
export function getActuals(month: string): ActualItem[] {
  const budget = getBudget(month);
  return [...(budget?.actuals ?? [])].sort((a, b) => a.date.localeCompare(b.date));
}

/** Months holding at least one actual, oldest first. */
export function getRecordedMonths(): string[] {
  return getAll()
    .filter((b) => (b.actuals?.length ?? 0) > 0)
    .map((b) => b.month)
    .sort();
}

/** Recorded totals for one month, by kind and category. */
export function actualTotals(month: string): {
  income: number;
  expenses: number;
  byCategory: Record<string, number>;
} {
  const totals = { income: 0, expenses: 0, byCategory: {} as Record<string, number> };
  for (const a of getActuals(month)) {
    if (a.kind === 'income') totals.income += a.amount;
    else {
      totals.expenses += a.amount;
      totals.byCategory[a.category] = (totals.byCategory[a.category] ?? 0) + a.amount;
    }
  }
  return totals;
}

/**
 * The average month's recorded spending per expense category.
 *
 * Only *complete* months count — the month in progress is excluded,
 * because a month recorded to the 12th averages out to a category that
 * looks half its real size, and a forecast built on that would tell her
 * she has room she does not have.
 *
 * Returns null when no complete month has been recorded. Absence stated,
 * never zero-filled: a category with no record is a category the forecast
 * must leave to the plan.
 */
export function averageRecordedSpending(today = new Date()): {
  byCategory: Record<string, number>;
  months: string[];
} | null {
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const complete = getRecordedMonths().filter((m) => m < thisMonth);
  if (complete.length === 0) return null;

  const sums: Record<string, number> = {};
  for (const month of complete) {
    for (const [category, amount] of Object.entries(actualTotals(month).byCategory)) {
      sums[category] = (sums[category] ?? 0) + amount;
    }
  }
  const byCategory: Record<string, number> = {};
  for (const [category, total] of Object.entries(sums)) {
    byCategory[category] = total / complete.length;
  }
  return { byCategory, months: complete };
}
