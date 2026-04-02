import { STORAGE_KEYS } from './storage-keys';

interface LastVisited {
  path: string;
  title: string;
  timestamp: string;
}

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function saveLastVisited(path: string, title: string): void {
  const data: LastVisited = {
    path,
    title,
    timestamp: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_VISITED, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function getLastVisited(): LastVisited | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_VISITED);
    if (!raw) return null;

    const data: LastVisited = JSON.parse(raw);

    // Expire after 24 hours
    const age = Date.now() - new Date(data.timestamp).getTime();
    if (age > TWENTY_FOUR_HOURS) {
      localStorage.removeItem(STORAGE_KEYS.LAST_VISITED);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
