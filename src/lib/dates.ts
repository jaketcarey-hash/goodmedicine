/**
 * Date arithmetic, in one place.
 *
 * Until the cash-flow forecast, this app needed no real date math — a month
 * index got you the calendar page and a frequency got you a monthly average.
 * A forecast needs actual days: which Friday the biweekly pay lands, what
 * "the 1st" means in a six-week window, which week a payment falls into.
 *
 * Everything here works on local-time dates at midnight and ISO day strings
 * ("2026-08-10"). No timezones beyond the device's own — the reader's money
 * arrives in her timezone, and the maths must agree with her wall calendar.
 */

/** Local-midnight Date from an ISO day string ("2026-08-10"). */
export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** ISO day string from a Date, in local time. */
export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Whole days from a to b (positive when b is later). DST-safe: both ends
 *  are local midnights, so rounding absorbs the shifted hour. */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'irregular';

/**
 * Every occurrence of a recurring item inside [from, to], inclusive.
 *
 * The anchor is any known date the item actually landed on — last payday,
 * the 1st the rent came out. Weekly/biweekly walk in exact 7/14-day steps
 * from the anchor, so the phase is preserved. Monthly keeps the anchor's
 * day-of-month, clamping to the last day of shorter months (an anchor on
 * the 31st lands on Feb 28). Irregular yields nothing — a forecast that
 * invented dates for irregular income would be a guess wearing a schedule.
 */
export function occurrencesBetween(
  anchor: Date,
  frequency: Frequency,
  from: Date,
  to: Date,
): Date[] {
  if (frequency === 'irregular') return [];
  const out: Date[] = [];

  if (frequency === 'weekly' || frequency === 'biweekly') {
    const step = frequency === 'weekly' ? 7 : 14;
    // Jump close to the window start in one hop, then walk.
    const behind = daysBetween(anchor, from);
    const steps = behind > 0 ? Math.floor(behind / step) : Math.ceil(behind / step);
    let cursor = addDays(anchor, steps * step);
    while (cursor < from) cursor = addDays(cursor, step);
    while (cursor <= to) {
      out.push(cursor);
      cursor = addDays(cursor, step);
    }
    return out;
  }

  // Monthly: anchor's day-of-month, clamped to each month's length.
  const day = anchor.getDate();
  let y = from.getFullYear();
  let m = from.getMonth();
  while (true) {
    const lastDay = new Date(y, m + 1, 0).getDate();
    const candidate = new Date(y, m, Math.min(day, lastDay));
    if (candidate > to) break;
    if (candidate >= from) out.push(candidate);
    m += 1;
    if (m > 11) { m = 0; y += 1; }
  }
  return out;
}

/** The Monday on or before the given date — weeks run Monday to Sunday. */
export function startOfWeek(date: Date): Date {
  const dow = date.getDay(); // 0 = Sunday
  return addDays(date, dow === 0 ? -6 : 1 - dow);
}

export interface Week {
  start: Date;
  end: Date; // inclusive Sunday
}

/** `count` consecutive Monday-to-Sunday weeks covering `from` onward. */
export function weeksFrom(from: Date, count: number): Week[] {
  const weeks: Week[] = [];
  let start = startOfWeek(from);
  for (let i = 0; i < count; i++) {
    weeks.push({ start, end: addDays(start, 6) });
    start = addDays(start, 7);
  }
  return weeks;
}

/** "Aug 10" — short label for strips and axes. */
export function shortLabel(date: Date): string {
  return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

/** "Monday, August 10" — full label for detail rows. */
export function longLabel(date: Date): string {
  return date.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' });
}
