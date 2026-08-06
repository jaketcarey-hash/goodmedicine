#!/usr/bin/env node
/**
 * Fail the build on a page-level provenance claim that cannot be trusted.
 *
 * The answer pages carry hand-typed provenance — answer, checked, sourceUrl,
 * unsettled — straight on the <Article> tag. Co-location is deliberate: the
 * person editing the content is looking at the date. This script is the other
 * half of that deal. A provenance claim nothing verifies is worse than none;
 * it converts "we don't know" into "we checked".
 *
 * Runs before `astro build`, alongside check-figures.js. It fails when:
 *   - a page sets `answer` or `checked` but no source (sourceUrl + sourceLabel)
 *   - a page sets `answer` but no `checked` date — an undated claim would
 *     silently dodge the staleness gate below
 *   - a `checked` date is more than 12 months old (warns from 10)
 *   - a `checked` date cannot be parsed — unreadable must fail, not pass
 *
 * It never touches the network. Builds work offline and do not depend on a
 * government site being up; link health is a separate, occasional job.
 * `unsettled` is free text and stays free text.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const pagesDir = join(root, 'src', 'pages');

const STALE_MONTHS = 12;
const WARN_MONTHS = 10;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Every .astro file under src/pages, depth-first. */
function astroFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...astroFiles(path));
    else if (name.endsWith('.astro')) out.push(path);
  }
  return out;
}

/**
 * The opening <Article …> tag, quote- and brace-aware. A plain regex to the
 * first `>` breaks on an answer that contains one; this walks the characters.
 * Returns null when the file has no <Article> tag.
 */
function articleTag(source) {
  const start = source.search(/<Article[\s/>]/);
  if (start === -1) return null;
  let quote = null;
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
    } else if (ch === '>' && depth === 0) {
      return source.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Attributes of the tag as { name: value }. A literal string keeps its text;
 * an {expression} becomes the EXPRESSION symbol — present, but unreadable.
 */
const EXPRESSION = Symbol('expression');

function attributes(tag) {
  const attrs = {};
  const re = /([A-Za-z_][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\{))/g;
  let m;
  while ((m = re.exec(tag))) {
    attrs[m[1]] = m[4] ? EXPRESSION : (m[2] ?? m[3]);
  }
  return attrs;
}

/**
 * A `checked` value as { year, month } (month 1–12), or null when it cannot
 * be read. Accepts the display form "August 2026" and ISO "2026-08[-04]".
 */
function parseChecked(value) {
  if (typeof value !== 'string') return null;
  const display = value.trim().match(/^([A-Z][a-z]+)\s+(\d{4})$/);
  if (display) {
    const month = MONTHS.indexOf(display[1]) + 1;
    if (month > 0) return { year: Number(display[2]), month };
    return null;
  }
  const iso = value.trim().match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (iso) {
    const month = Number(iso[2]);
    if (month >= 1 && month <= 12) return { year: Number(iso[1]), month };
  }
  return null;
}

/** Whole months from a checked month to today. August checked in August is 0. */
function monthsOld({ year, month }, now) {
  return (now.getFullYear() * 12 + now.getMonth() + 1) - (year * 12 + month);
}

const failures = [];
const warnings = [];
let claimed = 0;
let checkedFiles = 0;

const now = new Date();

for (const path of astroFiles(pagesDir)) {
  const source = readFileSync(path, 'utf-8');
  if (!/from\s+['"][^'"]*layouts\/Article\.astro['"]/.test(source)) continue;
  checkedFiles++;

  const page = relative(root, path);
  const tag = articleTag(source);
  if (!tag) {
    failures.push({ page, why: 'imports the Article layout but the <Article> tag could not be read' });
    continue;
  }

  const attrs = attributes(tag);
  const has = (name) => attrs[name] !== undefined;
  if (!has('answer') && !has('checked')) continue;
  claimed++;

  if (!has('sourceUrl') || !has('sourceLabel')) {
    const missing = ['sourceUrl', 'sourceLabel'].filter((a) => !has(a));
    failures.push({ page, why: `makes a claim but has no source — missing ${missing.join(' and ')}` });
  }

  if (has('answer') && !has('checked')) {
    failures.push({ page, why: 'has an answer but no checked date — an undated claim cannot go stale, which is the point of dating it' });
  }

  if (has('checked')) {
    const date = parseChecked(attrs.checked);
    if (!date) {
      const shown = attrs.checked === EXPRESSION ? 'an {expression}' : `"${attrs.checked}"`;
      failures.push({ page, why: `checked is ${shown} — use a literal like "August 2026" so the date can be verified` });
    } else {
      const age = monthsOld(date, now);
      if (age > STALE_MONTHS) {
        failures.push({ page, why: `checked "${attrs.checked}" is ${age} months old — re-verify against the source, then update checked` });
      } else if (age >= WARN_MONTHS) {
        warnings.push({ page, why: `checked "${attrs.checked}" is ${age} months old — due for re-verification` });
      }
    }
  }
}

if (failures.length) {
  console.error(`\n  ${failures.length} page provenance claim(s) cannot be trusted.\n`);
  for (const { page, why } of failures) {
    console.error(`    ${page}`);
    console.error(`      ${why}`);
    console.error('');
  }
  console.error('  Re-check the page against its source, then set answer, checked,');
  console.error('  sourceLabel and sourceUrl together on the <Article> tag — or remove');
  console.error('  the claim. A page with no strip is honest; a stale one is not.\n');
  process.exit(1);
}

if (warnings.length) {
  console.log(`[provenance] ${warnings.length} due for re-verification:`);
  for (const { page, why } of warnings) {
    console.log(`  ${page} — ${why}`);
  }
}

console.log(`[provenance] ${checkedFiles} answer pages checked, ${claimed} carry claims, all sourced and in date`);
