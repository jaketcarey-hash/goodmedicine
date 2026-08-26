/**
 * The cash-flow forecast.
 *
 * Every other money tool on this site answers a question about a month or a
 * total. This one answers the question people actually lose sleep over:
 * *does the money last until the next money?* It walks the next eight weeks
 * day by day — her paydays on their real Fridays, CCB on the date CRA
 * publishes, rent on the day it comes out — and names the week it gets tight
 * before she arrives in it.
 *
 * Nothing here connects to a bank. It runs on what she has already entered,
 * offline, on her phone.
 *
 * Four rules hold this honest, and each one costs the forecast something:
 *
 * 1. **No invented dates.** An item without an anchor is a monthly average,
 *    not an event, and it stays out of the walk and into `unplaced` — which
 *    the surface must show. A forecast that guessed at dates would be
 *    confident and wrong, and the weeks it moved money into are exactly the
 *    weeks she would be planning around.
 *
 * 2. **Her amounts, the government's dates.** Benefit payment dates are
 *    published; benefit *amounts* are not knowable from anything on this
 *    device. So a benefit only enters the forecast when she has entered
 *    what she receives — and then it lands on the real date instead of a
 *    guessed day-of-month. A series she likely qualifies for but has not
 *    entered is reported in `unentered`, never estimated.
 *
 * 3. **The record corrects the plan.** Where complete months of recorded
 *    spending exist, a category's planned total is scaled to what she
 *    actually spends, and the event says so. A plan alone forecasts the
 *    plan.
 *
 * 4. **A running balance needs a starting number.** Without one, the weeks
 *    still show what moves, but every closing balance is null and no week
 *    is called tight. "Tight" is a claim about a balance; inventing the
 *    balance to make the claim would be the worst thing this file could do.
 */

import {
  fromISO,
  toISO,
  occurrencesBetween,
  weeksFrom,
  shortLabel,
  type Frequency,
} from './dates';
import {
  getBudget,
  getAllBudgetMonths,
  averageRecordedSpending,
  toMonthly,
  type BudgetEntry,
  type IncomeItem,
  type ExpenseItem,
} from './budget-store';
import { getProfile, hasProfile, type CalendarProfile } from './calendar-store';
import { STORAGE_KEYS } from './storage-keys';
import benefitDates from '../data/benefit-dates/2026.json';

/** Weeks shown. Eight is two pay cycles — far enough that a tight week can
 *  still be acted on, near enough that the dates are real rather than
 *  projected. */
export const FORECAST_WEEKS = 8;

/** A balance goes stale fast. Past this it is still used, and flagged.
 *
 *  This lives here rather than in the component because the forecast page is
 *  no longer the only surface that judges a balance — the money picture reads
 *  the same stored number, and two surfaces disagreeing about when a balance
 *  stops being current is the kind of drift nobody notices until one of them
 *  calls a week tight that the other does not. */
export const STALE_AFTER_DAYS = 7;

/** What she said was in the account, and when she said it. */
export interface StartBalance {
  amount: number;
  /** ISO date. A balance is a claim about a moment, so the moment is stored. */
  recordedOn: string;
}

/** The saved starting balance, or null. Read-only — the forecast page owns
 *  the write, because it owns the field she types into. */
export function getStartBalance(): StartBalance | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FORECAST_BALANCE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.amount !== 'number' || !parsed?.recordedOn) return null;
    return { amount: parsed.amount, recordedOn: parsed.recordedOn };
  } catch {
    return null;
  }
}

/** Whole days since a balance was entered. Null for no balance. */
export function balanceAgeDays(recordedOn: string | null, today: Date = new Date()): number | null {
  if (!recordedOn) return null;
  return Math.floor((today.getTime() - fromISO(recordedOn).getTime()) / 86_400_000);
}

/** Below this share of difference, a recorded average is not worth
 *  overriding the plan with — it is noise, and the correction note would
 *  cost more attention than the accuracy buys. */
const MATERIAL_GAP = 0.1;

export interface ForecastEvent {
  date: string;
  label: string;
  /** Signed: positive comes in, negative goes out. */
  amount: number;
  kind: 'income' | 'expense' | 'benefit';
  /** Where this line came from, in the apparatus voice. Always present —
   *  no number appears in this forecast without saying where it got it. */
  provenance: string;
}

export interface ForecastWeek {
  start: string;
  end: string;
  /** "Aug 17" — the Monday. */
  label: string;
  events: ForecastEvent[];
  moneyIn: number;
  moneyOut: number;
  net: number;
  /** Balance at the end of the week; null when no starting balance was given. */
  closingBalance: number | null;
  /** Closing balance below zero. Null when there is no balance to judge. */
  tight: boolean | null;
  /** Band distributions fall in this month. Month-precision by design — the
   *  day is not knowable, so no amount and no spike, only the marker. */
  distributionMonth: boolean;
}

export interface Forecast {
  weeks: ForecastWeek[];
  startBalance: number | null;
  /** The first week whose closing balance goes below zero. */
  firstTightWeek: ForecastWeek | null;
  /**
   * Items the walk could not place: no anchor date, irregular, or a benefit
   * whose published schedule has run out from under us.
   *
   * `schedule-ended` is the one that is our fault rather than hers. It means
   * the site holds no further payment dates for a series she has entered — and
   * before it existed, that item silently produced no events and appeared
   * nowhere, so the running balance simply lost her money and called the
   * resulting weeks tight.
   */
  unplaced: {
    label: string;
    monthlyAmount: number;
    reason: 'no-date' | 'irregular' | 'schedule-ended';
  }[];
  /** Benefit series the household profile suggests, with nothing entered to pay out. */
  unentered: { key: string; label: string; nextDate: string }[];
  /** Categories whose planned amounts were corrected by the record. */
  corrections: { category: string; planned: number; recorded: number; months: number }[];
  /** Which month's budget the walk is built from. */
  basisMonth: string | null;
  /** True once at least one complete month of actuals has corrected the plan. */
  recordInformed: boolean;
  sourceLabel: string;
}

/* ------------------------------------------------------------------ *
 * Benefit series matching
 *
 * A budget income item labelled "CCB" and the CRA payment schedule are the
 * same money described twice. Matching them is what lets the forecast put
 * her real amount on the real day. The alias lists are deliberately narrow:
 * a wrong match moves money to the wrong week, which is worse than leaving
 * an item on its own monthly anchor.
 * ------------------------------------------------------------------ */

interface BenefitSeries {
  label: string;
  cadence: string;
  dates: string[];
  sourceLabel: string;
  verifiedOn: string;
}

const SERIES = benefitDates as unknown as Record<string, BenefitSeries>;

const ALIASES: Record<string, string[]> = {
  ccb: ['ccb', 'canada child benefit', 'child benefit', 'child tax benefit', 'baby bonus'],
  cgeb: [
    'cgeb',
    'canada groceries and essentials benefit',
    'groceries and essentials',
    'gst',
    'gst credit',
    'gst/hst credit',
    'hst credit',
  ],
  oas_gis: ['oas', 'old age security', 'gis', 'guaranteed income supplement'],
  cpp: ['cpp', 'canada pension plan', 'cpp retirement'],
};

/** Which published series an income item names, if any. */
export function matchBenefitSeries(label: string): string | null {
  const normal = label.toLowerCase().trim().replace(/\s+/g, ' ');
  for (const [key, aliases] of Object.entries(ALIASES)) {
    for (const alias of aliases) {
      if (normal === alias) return key;
      // Word-boundary containment, so "CCB payment" matches and
      // "Succble" cannot.
      if (new RegExp(`(^|[^a-z])${alias.replace(/[/]/g, '\\/')}([^a-z]|$)`).test(normal)) {
        return key;
      }
    }
  }
  return null;
}

/** Series the household profile suggests she may receive. */
function likelySeries(profile: CalendarProfile | null): string[] {
  if (!profile) return [];
  const keys: string[] = [];
  if (profile.hasChildren) keys.push('ccb');
  if (profile.isElder) keys.push('oas_gis', 'cpp');
  // CGEB reaches most low- and modest-income adults, but only after a return
  // is filed — it is suggested for everyone with a profile, and the surface
  // pairs it with the filing point rather than assuming eligibility.
  keys.push('cgeb');
  return keys;
}

/* ------------------------------------------------------------------ *
 * The walk
 * ------------------------------------------------------------------ */

/** The latest month holding any budget entries. Read-only — never creates. */
function latestBudget(): BudgetEntry | null {
  for (const month of getAllBudgetMonths()) {
    const budget = getBudget(month);
    if (budget && (budget.income.length > 0 || budget.expenses.length > 0)) return budget;
  }
  return null;
}

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-CA', { month: 'long' });
}

export interface ForecastOptions {
  /** Where the walk starts. Defaults to today. */
  today?: Date;
  /** What is in the account right now. Null means no running balance. */
  startBalance?: number | null;
  weeks?: number;
  /** Injected for testing; defaults to the stored profile. */
  profile?: CalendarProfile | null;
  budget?: BudgetEntry | null;
}

export function buildForecast(options: ForecastOptions = {}): Forecast {
  const today = options.today ?? new Date();
  const weekCount = options.weeks ?? FORECAST_WEEKS;
  const startBalance = options.startBalance ?? null;
  const budget = options.budget !== undefined ? options.budget : latestBudget();
  const profile =
    options.profile !== undefined ? options.profile : hasProfile() ? getProfile() : null;

  const weeks = weeksFrom(today, weekCount);
  const from = weeks[0].start;
  const to = weeks[weeks.length - 1].end;

  const events: ForecastEvent[] = [];
  const unplaced: Forecast['unplaced'] = [];
  const corrections: Forecast['corrections'] = [];
  const matched = new Set<string>();

  // --- The record's correction to the plan, per expense category ---
  const recorded = averageRecordedSpending(today);
  const factors: Record<string, { factor: number; planned: number; recorded: number }> = {};
  if (recorded && budget) {
    const plannedByCategory: Record<string, number> = {};
    for (const item of budget.expenses) {
      const monthly = toMonthly(item.amount, item.frequency ?? 'monthly');
      plannedByCategory[item.category] = (plannedByCategory[item.category] ?? 0) + monthly;
    }
    for (const [category, average] of Object.entries(recorded.byCategory)) {
      const planned = plannedByCategory[category];
      if (!planned || planned <= 0) continue;
      const gap = Math.abs(average - planned) / planned;
      if (gap < MATERIAL_GAP) continue;
      factors[category] = { factor: average / planned, planned, recorded: average };
      corrections.push({
        category,
        planned,
        recorded: average,
        months: recorded.months.length,
      });
    }
  }

  // --- Income ---
  for (const item of budget?.income ?? []) {
    if (item.frequency === 'irregular') {
      unplaced.push({
        label: item.label,
        monthlyAmount: item.amount,
        reason: 'irregular',
      });
      continue;
    }

    const seriesKey = item.category === 'benefits' ? matchBenefitSeries(item.label) : null;
    const series = seriesKey ? SERIES[seriesKey] : null;

    if (series) {
      matched.add(seriesKey!);
      const future = series.dates.map(fromISO).filter((d) => d >= from);
      const inWindow = future.filter((d) => d <= to);

      // No payment in these eight weeks is not the same as no payment left.
      // CGEB pays quarterly, so an eight-week window can legitimately contain
      // none of it — saying "the schedule ended" there would be a false alarm
      // on a perfectly good schedule. Only an empty *future* means we have run
      // out of dates, and that is ours to admit rather than hers to discover.
      if (inWindow.length === 0) {
        if (future.length === 0) {
          unplaced.push({
            label: item.label,
            monthlyAmount: toMonthly(item.amount, item.frequency),
            reason: 'schedule-ended',
          });
        }
        continue;
      }

      for (const date of inWindow) {
        events.push({
          date: toISO(date),
          label: item.label,
          amount: item.amount,
          kind: 'benefit',
          provenance: `Your amount, on the payment date published by ${series.sourceLabel.replace(' — Canada.ca', '')} — verified ${series.verifiedOn}`,
        });
      }
      continue;
    }

    if (!item.anchorDate) {
      unplaced.push({
        label: item.label,
        monthlyAmount: toMonthly(item.amount, item.frequency),
        reason: 'no-date',
      });
      continue;
    }

    for (const date of occurrencesBetween(
      fromISO(item.anchorDate),
      item.frequency as Frequency,
      from,
      to,
    )) {
      events.push({
        date: toISO(date),
        label: item.label,
        amount: item.amount,
        kind: 'income',
        provenance: `From your ${monthLabel(budget!.month)} budget`,
      });
    }
  }

  // --- Expenses ---
  for (const item of budget?.expenses ?? []) {
    const frequency = (item.frequency ?? 'monthly') as Frequency;
    const correction = factors[item.category];
    const amount = correction ? item.amount * correction.factor : item.amount;

    if (!item.anchorDate) {
      unplaced.push({
        label: item.label,
        monthlyAmount: toMonthly(amount, frequency),
        reason: 'no-date',
      });
      continue;
    }

    const provenance = correction
      ? `From your ${monthLabel(budget!.month)} budget, adjusted to what you actually spend on ${item.category}`
      : `From your ${monthLabel(budget!.month)} budget`;

    for (const date of occurrencesBetween(fromISO(item.anchorDate), frequency, from, to)) {
      events.push({
        date: toISO(date),
        label: item.label,
        amount: -amount,
        kind: 'expense',
        provenance,
      });
    }
  }

  // --- Benefit series she likely receives but has not entered ---
  const unentered: Forecast['unentered'] = [];
  for (const key of likelySeries(profile)) {
    if (matched.has(key)) continue;
    const series = SERIES[key];
    if (!series) continue;
    const next = series.dates.map(fromISO).find((d) => d >= from && d <= to);
    if (!next) continue;
    unentered.push({ key, label: series.label, nextDate: toISO(next) });
  }

  // --- Bucket into weeks and run the balance ---
  const distributionMonths = new Set(profile?.bandDistributionMonths ?? []);
  let running = startBalance;

  const built: ForecastWeek[] = weeks.map((week) => {
    const startISO = toISO(week.start);
    const endISO = toISO(week.end);
    const inWeek = events
      .filter((e) => e.date >= startISO && e.date <= endISO)
      .sort((a, b) => a.date.localeCompare(b.date) || b.amount - a.amount);

    const moneyIn = inWeek.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0);
    const moneyOut = inWeek.filter((e) => e.amount < 0).reduce((s, e) => s - e.amount, 0);
    const net = moneyIn - moneyOut;

    let closingBalance: number | null = null;
    if (running !== null) {
      running = running + net;
      closingBalance = running;
    }

    // A week touches a distribution month if either of its ends does — the
    // marker is about the month, so a week straddling two months carries it
    // from whichever side has one.
    const distributionMonth =
      distributionMonths.has(week.start.getMonth() + 1) ||
      distributionMonths.has(week.end.getMonth() + 1);

    return {
      start: startISO,
      end: endISO,
      label: shortLabel(week.start),
      events: inWeek,
      moneyIn,
      moneyOut,
      net,
      closingBalance,
      tight: closingBalance === null ? null : closingBalance < 0,
      distributionMonth,
    };
  });

  return {
    weeks: built,
    startBalance,
    firstTightWeek: built.find((w) => w.tight === true) ?? null,
    unplaced,
    unentered,
    corrections,
    basisMonth: budget?.month ?? null,
    recordInformed: corrections.length > 0,
    sourceLabel: 'Benefits payment dates — Canada.ca',
  };
}
