#!/usr/bin/env node
/**
 * Fail the build on a figure that is past its review date.
 *
 * REVIEW.md used to be the mechanism for this: a monthly audit wrote down what
 * had gone stale, and then nothing happened, for three cycles running, while
 * the site served numbers that were two benefit years old. A document that
 * asks someone to act is not a control. A build that will not complete is.
 *
 * Runs before `astro build`. A figure inside its window is silent; one past it
 * prints what it is, where it came from, and stops.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const registryPath = join(here, '..', 'src', 'data', 'figures', '2026.json');

const REQUIRED = ['value', 'label', 'effectiveFrom', 'reviewBy', 'source', 'verifiedOn'];

/** Days from today until a date, negative once it has passed. */
function daysUntil(iso, today) {
  return Math.round((Date.parse(iso) - Date.parse(today)) / 86_400_000);
}

const raw = JSON.parse(readFileSync(registryPath, 'utf-8'));
const today = new Date().toISOString().slice(0, 10);

const stale = [];
const malformed = [];
const soon = [];

for (const [key, figure] of Object.entries(raw)) {
  if (key === '_comment') continue;

  const missing = REQUIRED.filter((field) => figure[field] === undefined);
  if (missing.length) {
    malformed.push({ key, missing });
    continue;
  }

  const remaining = daysUntil(figure.reviewBy, today);
  if (remaining < 0) stale.push({ key, figure, remaining });
  else if (remaining <= 30) soon.push({ key, figure, remaining });
}

if (malformed.length) {
  console.error('\n  Figures missing required fields:\n');
  for (const { key, missing } of malformed) {
    console.error(`    ${key} — missing ${missing.join(', ')}`);
  }
  console.error('');
  process.exit(1);
}

if (stale.length) {
  console.error(`\n  ${stale.length} figure(s) are past their review date.\n`);
  for (const { key, figure, remaining } of stale) {
    console.error(`    ${key}`);
    console.error(`      ${figure.label}: ${figure.value} ${figure.unit ?? ''}`.trimEnd());
    console.error(`      review was due ${figure.reviewBy} (${-remaining} days ago)`);
    console.error(`      last verified ${figure.verifiedOn} against ${figure.source}`);
    console.error('');
  }
  console.error('  Check each against its source, then update the value, verifiedOn');
  console.error('  and reviewBy in src/data/figures/2026.json.\n');
  process.exit(1);
}

if (soon.length) {
  console.log(`[figures] ${soon.length} due for review within 30 days:`);
  for (const { key, figure, remaining } of soon) {
    console.log(`  ${key} — ${figure.reviewBy} (${remaining} days)`);
  }
}

const counted = Object.keys(raw).length - ('_comment' in raw ? 1 : 0);
console.log(`[figures] ${counted} figures checked, all within their review window`);
