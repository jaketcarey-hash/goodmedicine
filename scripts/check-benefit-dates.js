#!/usr/bin/env node
/**
 * Fail the build on a stale benefit payment schedule.
 *
 * The cash-flow forecast places real dollars on real dates. A forecast built
 * on last year's schedule is wrong silently — the worst kind of wrong for a
 * page whose argument is "we show our work."
 *
 * **Three levels, because they are three different problems.** Until 26 August
 * 2026 this checked one thing — `reviewBy` against today — and reported "all
 * schedules current" while the forecast was already walking eight weeks past
 * the end of the data.
 *
 * 1. **`reviewBy` has passed** → fail. The schedule is overdue for a look and
 *    nobody looked. This is neglect and it is fixable.
 * 2. **The last published payment is behind today** → fail. The series is
 *    exhausted right now; anyone who has entered it is already affected.
 * 3. **The last published payment falls inside the forecast's horizon** →
 *    warn, loudly, and do not block. This one is often not fixable: CGEB is
 *    quarterly and CRA publishes the following year's calendar in December, so
 *    from October there is a real stretch where the correct, complete schedule
 *    ends inside a window the forecast reads. Failing there would block every
 *    deploy for weeks over data nobody can supply, and a gate people have to
 *    bypass stops being a gate.
 *
 * Level 3 is safe to warn on only because `forecast.ts` now reports an
 * exhausted series as `unplaced` with reason `schedule-ended` instead of
 * silently dropping it out of the running balance. The runtime tells the
 * reader; this gate tells us.
 *
 * `FORECAST_WEEKS` is read out of `forecast.ts` rather than repeated here.
 * Two files disagreeing about how far ahead the forecast looks is the exact
 * failure this gate exists to catch, so it must not be possible to introduce
 * one by editing the other.
 *
 * Runs before `astro build`, beside the figure and provenance gates.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', 'src', 'data', 'benefit-dates');

/** How far ahead the forecast reads, in days — taken from the forecast itself. */
function forecastHorizonDays() {
  const src = readFileSync(join(here, '..', 'src', 'lib', 'forecast.ts'), 'utf-8');
  const match = src.match(/export const FORECAST_WEEKS\s*=\s*(\d+)/);
  if (!match) {
    console.error('\n  Could not read FORECAST_WEEKS from src/lib/forecast.ts.');
    console.error('  This gate needs the forecast\'s own horizon; guessing it would');
    console.error('  reintroduce the drift the gate exists to prevent.\n');
    process.exit(1);
  }
  return Number(match[1]) * 7;
}

const HORIZON_DAYS = forecastHorizonDays();

const REQUIRED = ['label', 'cadence', 'dates', 'source', 'sourceLabel', 'verifiedOn', 'reviewBy'];
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function daysUntil(iso, today) {
  return Math.round((Date.parse(iso) - Date.parse(today)) / 86_400_000);
}

const today = new Date().toISOString().slice(0, 10);
/** The furthest day the forecast will ask about on the day of this build. */
const horizon = new Date(Date.parse(today) + HORIZON_DAYS * 86_400_000)
  .toISOString()
  .slice(0, 10);
const failures = [];
const soon = [];
const exhausting = [];
let seriesCount = 0;

for (const file of readdirSync(dataDir).filter((f) => f.endsWith('.json'))) {
  const raw = JSON.parse(readFileSync(join(dataDir, file), 'utf-8'));

  for (const [key, series] of Object.entries(raw)) {
    if (key === '_comment') continue;
    seriesCount++;

    const missing = REQUIRED.filter((field) => series[field] === undefined);
    if (missing.length) {
      failures.push(`${file} › ${key} — missing ${missing.join(', ')}`);
      continue;
    }

    const badDates = series.dates.filter((d) => !ISO_DAY.test(d) || Number.isNaN(Date.parse(d)));
    if (badDates.length) {
      failures.push(`${file} › ${key} — unparseable dates: ${badDates.join(', ')}`);
      continue;
    }

    // 1 — overdue for a look.
    const remaining = daysUntil(series.reviewBy, today);
    if (remaining < 0) {
      failures.push(
        `${file} › ${key} — schedule expired ${-remaining} days ago (reviewBy ${series.reviewBy}). ` +
          `Fetch the new dates from ${series.source} before the forecast misleads anyone.`,
      );
      continue;
    }

    const lastDate = [...series.dates].sort().pop();

    // 2 — exhausted right now. Anyone who has entered it is already affected.
    if (lastDate && lastDate < today) {
      failures.push(
        `${file} › ${key} — last published payment was ${lastDate}, already in the past. ` +
          `Anyone who has entered this benefit has it dropping out of their balance today. ` +
          `Fetch the next dates from ${series.source}.`,
      );
      continue;
    }

    // 3 — runs out inside the window the forecast walks. Often not fixable yet.
    if (lastDate && lastDate < horizon) {
      exhausting.push(
        `${key} — last payment ${lastDate}, inside the forecast's horizon (${horizon}). ` +
          `Readers who entered it will see it reported as unplaceable after that date.`,
      );
    }

    if (remaining <= 30) {
      soon.push(`${key} — expires ${series.reviewBy} (${remaining} days)`);
    }
  }
}

if (failures.length) {
  console.error(`\n  ${failures.length} benefit payment schedule problem(s):\n`);
  for (const f of failures) console.error(`    ${f}`);
  console.error('\n  Fetch the current schedules live (canada.ca blocks curl — use a');
  console.error('  browser), update the data file, and set verifiedOn and reviewBy.\n');
  process.exit(1);
}

if (exhausting.length) {
  console.log(
    `\n[benefit-dates] ${exhausting.length} schedule(s) run out inside the forecast's ` +
      `${HORIZON_DAYS}-day horizon:`,
  );
  for (const e of exhausting) console.log(`  ${e}`);
  console.log(
    '  Not a build failure — the next year\'s calendar may not be published yet, and\n' +
      '  forecast.ts reports an exhausted series rather than dropping it silently.\n' +
      '  Check whether the next schedule has been released.\n',
  );
}

if (soon.length) {
  console.log(`[benefit-dates] ${soon.length} schedule(s) expire within 30 days:`);
  for (const s of soon) console.log(`  ${s}`);
}

console.log(
  `[benefit-dates] ${seriesCount} series checked, all current through ${horizon} ` +
    `(today + ${HORIZON_DAYS} days, the forecast's horizon)`,
);
