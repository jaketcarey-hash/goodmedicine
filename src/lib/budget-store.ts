/**
 * Budget data — stored entirely on-device.
 * No server, no tracking, no accounts. Just you.
 */

export interface IncomeItem {
  id: string;
  label: string;
  amount: number;
  frequency: 'monthly' | 'biweekly' | 'weekly' | 'irregular';
  category: 'employment' | 'band' | 'benefits' | 'family' | 'other';
}

export interface ExpenseItem {
  id: string;
  label: string;
  amount: number;
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
}

const STORAGE_KEY = 'gm_budgets';

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

/** Get total monthly expenses for a budget. */
export function getMonthlyExpenses(budget: BudgetEntry): number {
  return budget.expenses.reduce((sum, item) => sum + item.amount, 0);
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
