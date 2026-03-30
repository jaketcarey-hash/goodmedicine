/**
 * Wellness check-in data — stored entirely on-device.
 * No server, no tracking, no accounts. Just you.
 */

export interface CheckInEntry {
  id: string;
  timestamp: string;
  feeling: number; // 1-5 scale
  areas: string[]; // what's on their mind
  reflection: string; // free-text
  gratitude: string; // one thing
}

const STORAGE_KEY = 'gm_checkins';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getCheckIns(): CheckInEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLatestCheckIn(): CheckInEntry | null {
  const all = getCheckIns();
  return all.length > 0 ? all[all.length - 1] : null;
}

export function getTodayCheckIn(): CheckInEntry | null {
  const today = new Date().toISOString().slice(0, 10);
  const all = getCheckIns();
  return all.find((c) => c.timestamp.slice(0, 10) === today) ?? null;
}

export function getRecentCheckIns(count: number = 7): CheckInEntry[] {
  return getCheckIns().slice(-count);
}

export function saveCheckIn(entry: Omit<CheckInEntry, 'id' | 'timestamp'>): CheckInEntry {
  const full: CheckInEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  const all = getCheckIns();
  all.push(full);

  // Keep last 90 days max
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const filtered = all.filter((c) => new Date(c.timestamp) >= cutoff);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return full;
}

export function getStreak(): number {
  const all = getCheckIns();
  if (all.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i <= 90; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().slice(0, 10);
    const hasEntry = all.some((c) => c.timestamp.slice(0, 10) === dateStr);

    if (hasEntry) {
      streak++;
    } else if (i === 0) {
      // Today hasn't been done yet — that's okay, don't break streak
      continue;
    } else {
      break;
    }
  }

  return streak;
}

export function getAverageFeeling(days: number = 7): number | null {
  const recent = getCheckIns().slice(-days);
  if (recent.length === 0) return null;
  const sum = recent.reduce((acc, c) => acc + c.feeling, 0);
  return Math.round((sum / recent.length) * 10) / 10;
}
