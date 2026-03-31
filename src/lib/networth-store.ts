/**
 * Net worth snapshots — stored entirely on-device.
 * Track what you own vs what you owe over time.
 */

import { STORAGE_KEYS } from './storage-keys';

export interface NetWorthItem {
  label: string;
  amount: number;
  category: string;
}

export interface NetWorthSnapshot {
  id: string;
  date: string;
  assets: NetWorthItem[];
  debts: NetWorthItem[];
}

export interface NetWorthWorkingState {
  assets: NetWorthItem[];
  debts: NetWorthItem[];
}

const SNAPSHOTS_KEY = STORAGE_KEYS.NETWORTH_SNAPSHOTS;
const WORKING_KEY = STORAGE_KEYS.NETWORTH_WORKING;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getAllSnapshots(): NetWorthSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAllSnapshots(snapshots: NetWorthSnapshot[]): void {
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
}

/** Save a new snapshot of current net worth. */
export function saveSnapshot(assets: NetWorthItem[], debts: NetWorthItem[]): NetWorthSnapshot {
  const snapshot: NetWorthSnapshot = {
    id: generateId(),
    date: new Date().toISOString(),
    assets: [...assets],
    debts: [...debts],
  };
  const all = getAllSnapshots();
  all.push(snapshot);
  saveAllSnapshots(all);
  return snapshot;
}

/** Get all snapshots, oldest first. */
export function getSnapshots(): NetWorthSnapshot[] {
  return getAllSnapshots();
}

/** Get the most recent snapshot, or null. */
export function getLatestSnapshot(): NetWorthSnapshot | null {
  const all = getAllSnapshots();
  return all.length > 0 ? all[all.length - 1] : null;
}

/** Delete a snapshot by ID. */
export function deleteSnapshot(id: string): void {
  const all = getAllSnapshots().filter((s) => s.id !== id);
  saveAllSnapshots(all);
}

/** Save working state (current items being edited, not yet snapshotted). */
export function saveWorkingState(state: NetWorthWorkingState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WORKING_KEY, JSON.stringify(state));
}

/** Load working state, falling back to latest snapshot or empty. */
export function getWorkingState(): NetWorthWorkingState {
  if (typeof window === 'undefined') return { assets: [], debts: [] };
  try {
    const raw = localStorage.getItem(WORKING_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through
  }
  const latest = getLatestSnapshot();
  if (latest) return { assets: [...latest.assets], debts: [...latest.debts] };
  return { assets: [], debts: [] };
}

/** Calculate net worth from items. */
export function calcNetWorth(assets: NetWorthItem[], debts: NetWorthItem[]): number {
  const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0);
  const totalDebts = debts.reduce((sum, d) => sum + d.amount, 0);
  return totalAssets - totalDebts;
}
