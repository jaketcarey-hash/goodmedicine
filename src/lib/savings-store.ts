/**
 * Savings goals — stored entirely on-device.
 * No server, no tracking, no accounts. Just you.
 */

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

const STORAGE_KEY = 'gm_savings';

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
