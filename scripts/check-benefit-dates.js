#!/usr/bin/env node
/**
 * Fail the build on a stale benefit payment schedule.
 *
 * The cash-flow forecast places real dollars on real dates. A forecast built
 * on last year's schedule is wrong silently — the worst kind of wrong for a
 * page whose argument is "we show our work." Same spine as check-figures.js:
 * the 2027 schedule publishes in December; once a series passes its reviewBy,
 * the build stops until someone fetches the new dates.
 *
 * Runs before `astro build`, beside the figure and provenance gates.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', 'src', 'data', 'benefit-dates');

const REQUIRED = ['label', 'cadence', 'dates', 'source', 'sourceLabel', 'verifiedOn', 'reviewBy'];
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function daysUntil(iso, today) {
  return Math.round((Date.parse(iso) - Date.parse(today)) / 86_400_000);
}

const today = new Date().toISOString().slice(0, 10);
const failures = [];
const soon = [];
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

    const remaining = daysUntil(series.reviewBy, today);
    if (remaining < 0) {
      failures.push(
        `${file} › ${key} — schedule expired ${-remaining} days ago (reviewBy ${series.reviewBy}). ` +
          `Fetch the new dates from ${series.source} before the forecast misleads anyone.`,
      );
    } else if (remaining <= 30) {
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

if (soon.length) {
  console.log(`[benefit-dates] ${soon.length} schedule(s) expire within 30 days:`);
  for (const s of soon) console.log(`  ${s}`);
}

console.log(`[benefit-dates] ${seriesCount} series checked, all schedules current`);
