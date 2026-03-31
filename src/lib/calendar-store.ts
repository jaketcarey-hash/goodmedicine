/**
 * Financial calendar data — stored entirely on-device.
 * No server, no tracking, no accounts. Just you.
 */

import { STORAGE_KEYS } from './storage-keys';

export interface CalendarProfile {
  treatyArea: string | null;
  province: string | null;
  hasChildren: boolean;
  isStudent: boolean;
  isEmployed: boolean;
  incomeExempt: boolean;
  isElder: boolean;
  bandDistributionMonths: number[];
  customReminders: CustomReminder[];
}

export interface CustomReminder {
  label: string;
  month: number;
  day?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  month: number;
  day?: number;
  category: 'tax' | 'benefits' | 'education' | 'band' | 'health' | 'custom';
  relevantIf: (profile: CalendarProfile) => boolean;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
}

const PROFILE_KEY = STORAGE_KEYS.CALENDAR_PROFILE;

const DEFAULT_PROFILE: CalendarProfile = {
  treatyArea: null,
  province: null,
  hasChildren: false,
  isStudent: false,
  isEmployed: false,
  incomeExempt: false,
  isElder: false,
  bandDistributionMonths: [],
  customReminders: [],
};

export const TREATY_AREAS = [
  'Treaty 1',
  'Treaty 2',
  'Treaty 3',
  'Treaty 4',
  'Treaty 5',
  'Treaty 6',
  'Treaty 7',
  'Treaty 8',
  'Treaty 9',
  'Treaty 10',
  'Treaty 11',
  'Williams Treaties',
  'Robinson-Superior',
  'Robinson-Huron',
  'Douglas Treaties',
  "Nisga'a",
  'Tsawwassen',
  'Maa-nulth',
  "Tla'amin",
  'Unceded territory',
  'Other / not sure',
] as const;

export const PROVINCES = [
  'British Columbia',
  'Alberta',
  'Saskatchewan',
  'Manitoba',
  'Ontario',
  'Quebec',
  'New Brunswick',
  'Nova Scotia',
  'Prince Edward Island',
  'Newfoundland and Labrador',
  'Yukon',
  'Northwest Territories',
  'Nunavut',
] as const;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export function getProfile(): CalendarProfile {
  if (typeof window === 'undefined') return { ...DEFAULT_PROFILE };
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: CalendarProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function hasProfile(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(PROFILE_KEY) !== null;
}

export function clearProfile(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PROFILE_KEY);
}

/**
 * Returns events for a specific month, filtered by profile relevance.
 * Includes custom reminders converted to events.
 */
export function getEventsForMonth(
  allEvents: CalendarEvent[],
  month: number,
  profile: CalendarProfile,
): CalendarEvent[] {
  const matched = allEvents
    .filter((e) => e.month === month && e.relevantIf(profile))
    .sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority));

  const custom = customRemindersForMonth(profile, month);
  return [...matched, ...custom];
}

/**
 * Returns events for the next 30 days, filtered by profile.
 */
export function getUpcomingEvents(
  allEvents: CalendarEvent[],
  profile: CalendarProfile,
): CalendarEvent[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  const upcoming: CalendarEvent[] = [];

  for (let offset = 0; offset <= 30; offset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    const month = date.getMonth();
    const day = date.getDate();

    const dayEvents = allEvents.filter((e) => {
      if (e.month !== month) return false;
      if (!e.relevantIf(profile)) return false;
      // If the event has a specific day, only include if it's that day
      if (e.day !== undefined) return e.day === day;
      // If no specific day, include once on the first day we encounter this month
      if (offset === 0) return true;
      // For month-long events, include on the 1st of that month only
      return day === 1;
    });

    upcoming.push(...dayEvents);
  }

  // Deduplicate by id
  const seen = new Set<string>();
  const deduped = upcoming.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  const custom = customRemindersUpcoming(profile, now);
  return [...deduped, ...custom].sort(
    (a, b) => priorityWeight(a.priority) - priorityWeight(b.priority),
  );
}

/**
 * Convenience: events for the current month.
 */
export function getCurrentMonthEvents(
  allEvents: CalendarEvent[],
  profile: CalendarProfile,
): CalendarEvent[] {
  return getEventsForMonth(allEvents, new Date().getMonth(), profile);
}

// --- Internal helpers ---

function priorityWeight(p: 'high' | 'medium' | 'low'): number {
  if (p === 'high') return 0;
  if (p === 'medium') return 1;
  return 2;
}

function customRemindersForMonth(
  profile: CalendarProfile,
  month: number,
): CalendarEvent[] {
  return profile.customReminders
    .filter((r) => r.month === month)
    .map((r, i) => ({
      id: `custom-${month}-${i}`,
      title: r.label,
      description: 'Your custom reminder',
      month: r.month,
      day: r.day,
      category: 'custom' as const,
      relevantIf: () => true,
      priority: 'medium' as const,
    }));
}

function customRemindersUpcoming(
  profile: CalendarProfile,
  from: Date,
): CalendarEvent[] {
  const results: CalendarEvent[] = [];

  for (let offset = 0; offset <= 30; offset++) {
    const date = new Date(from);
    date.setDate(date.getDate() + offset);
    const month = date.getMonth();
    const day = date.getDate();

    profile.customReminders
      .filter((r) => {
        if (r.month !== month) return false;
        if (r.day !== undefined) return r.day === day;
        return day === 1 || offset === 0;
      })
      .forEach((r, i) => {
        results.push({
          id: `custom-upcoming-${month}-${day}-${i}`,
          title: r.label,
          description: 'Your custom reminder',
          month: r.month,
          day: r.day,
          category: 'custom' as const,
          relevantIf: () => true,
          priority: 'medium' as const,
        });
      });
  }

  return results;
}
