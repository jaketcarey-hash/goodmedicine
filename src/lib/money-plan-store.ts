/**
 * The money plan — vision and intentions, stored entirely on-device.
 *
 * Deliberately small. The plan surface derives everything else (income,
 * debts, savings, suggestions) live from the other stores through
 * money-picture.ts, so this store holds only what cannot be derived:
 * where you're headed, and what you've decided to work toward. Dollar
 * goals stay in savings-store; an intention may point at one by id
 * rather than duplicating it.
 */

import { STORAGE_KEYS } from './storage-keys';

export interface Intention {
  id: string;
  label: string;
  /** Optional link to a SavingsGoal that gives this intention a number. */
  savingsGoalId?: string;
}

export interface MoneyPlan {
  vision: string;
  intentions: Intention[];
  createdAt: string;
  updatedAt: string;
}

export function generateIntentionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getMoneyPlan(): MoneyPlan | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MONEY_PLAN);
    return raw ? (JSON.parse(raw) as MoneyPlan) : null;
  } catch {
    return null;
  }
}

export function saveMoneyPlan(vision: string, intentions: Intention[]): void {
  if (typeof window === 'undefined') return;
  const existing = getMoneyPlan();
  const plan: MoneyPlan = {
    vision,
    intentions,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.MONEY_PLAN, JSON.stringify(plan));
}
