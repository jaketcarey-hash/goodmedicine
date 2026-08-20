/**
 * Savings goals — stored entirely on-device.
 * No server, no tracking, no accounts. Just you.
 */

import { STORAGE_KEYS } from './storage-keys';

export interface SavingsDeposit {
  date: string;
  amount: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
  deposits: SavingsDeposit[];
  category: 'emergency' | 'education' | 'housing' | 'vehicle' | 'family' | 'travel' | 'custom';
}

const STORAGE_KEY = STORAGE_KEYS.SAVINGS_GOALS;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getAll(): SavingsGoal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(goals: SavingsGoal[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

/** Get all savings goals. */
export function getGoals(): SavingsGoal[] {
  return getAll();
}

/** Save (create or update) a savings goal. */
export function saveGoal(goal: SavingsGoal): void {
  const all = getAll();
  const idx = all.findIndex((g) => g.id === goal.id);
  if (idx >= 0) {
    all[idx] = goal;
  } else {
    all.push(goal);
  }
  saveAll(all);
}

/** Create a new savings goal. */
export function createGoal(
  name: string,
  targetAmount: number,
  category: SavingsGoal['category'],
): SavingsGoal {
  const goal: SavingsGoal = {
    id: generateId(),
    name,
    targetAmount,
    currentAmount: 0,
    createdAt: new Date().toISOString(),
    deposits: [],
    category,
  };
  const all = getAll();
  all.push(goal);
  saveAll(all);
  return goal;
}

/** Add a deposit to a goal. Returns the updated goal. */
export function addDeposit(goalId: string, amount: number): SavingsGoal | null {
  const all = getAll();
  const goal = all.find((g) => g.id === goalId);
  if (!goal) return null;

  goal.deposits.push({
    date: new Date().toISOString(),
    amount,
  });
  goal.currentAmount += amount;

  saveAll(all);
  return goal;
}

/** Delete a savings goal. */
export function deleteGoal(goalId: string): void {
  const all = getAll().filter((g) => g.id !== goalId);
  saveAll(all);
}

/** Get total saved across all goals. */
export function getTotalSaved(): number {
  return getAll().reduce((sum, g) => sum + g.currentAmount, 0);
}

/**
 * When this goal arrives at the rate the deposits actually show.
 *
 * Extracted so the pace chart and the plan document cannot disagree about a
 * date. Two deposits are the floor — one deposit is a balance, not a pace,
 * and a rate derived from it would be invention. Returns null when there is
 * no honest projection to make.
 */
export interface GoalProjection {
  perDay: number;
  perMonth: number;
  daysToGo: number;
  /** Null when already reached, or when the date is too far out to mean anything. */
  arrival: Date | null;
  done: boolean;
  /** Beyond ten years a date stops being a plan and becomes discouragement. */
  beyondHorizon: boolean;
}

export function projectGoal(goal: SavingsGoal): GoalProjection | null {
  const DAY = 86_400_000;
  const dated = [...goal.deposits]
    .filter((d) => d.date && Number.isFinite(d.amount))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (dated.length < 2) return null;

  const first = Date.parse(dated[0].date);
  const last = Date.parse(dated[dated.length - 1].date);
  const spanDays = Math.max((last - first) / DAY, 1);
  const saved = dated.reduce((s, d) => s + d.amount, 0);
  const perDay = saved / spanDays;
  if (perDay <= 0) return null;

  const remaining = goal.targetAmount - goal.currentAmount;
  if (remaining <= 0) {
    return { perDay, perMonth: perDay * 30, daysToGo: 0, arrival: null, done: true, beyondHorizon: false };
  }

  const daysToGo = remaining / perDay;
  const beyondHorizon = daysToGo > 3650;
  return {
    perDay,
    perMonth: perDay * 30,
    daysToGo,
    arrival: beyondHorizon ? null : new Date(last + daysToGo * DAY),
    done: false,
    beyondHorizon,
  };
}
