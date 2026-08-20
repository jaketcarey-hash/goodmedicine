#!/usr/bin/env node
/**
 * Render a claims register into a document a professional can actually review.
 *
 * The bottleneck on ROADMAP's "Section 87 content reviewed by a tax
 * professional" was never willingness — it was that asking someone to review
 * a website means asking them to read sixteen hundred words and work out for
 * themselves what is being asserted. Nobody does that for free.
 *
 * This turns the ask into a numbered list of statements with a box beside
 * each one. The claims already checked against a named authority are marked,
 * so the reviewer confirms those at a glance and spends their attention on
 * the judgement calls, which is the only part that needs them.
 *
 * Not part of the build. Run it when a register changes:
 *   node scripts/build-review-pack.js
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const claimsDir = join(root, 'src', 'data', 'claims');
const outDir = join(root, 'docs', 'review');

mkdirSync(outDir, { recursive: true });

const files = readdirSync(claimsDir).filter((f) => f.endsWith('.json'));
if (files.length === 0) {
  console.log('[review] no claim registers found');
  process.exit(0);
}

for (const file of files) {
  const reg = JSON.parse(readFileSync(join(claimsDir, file), 'utf8'));
  const needs = reg.claims.filter((c) => c.status === 'needs-practitioner');
  const sourced = reg.claims.filter((c) => c.status === 'sourced');

  const lines = [];
  lines.push(`# Review pack — ${reg.pageTitle}`);
  lines.push('');
  lines.push(`**Page:** strongfire.ca${reg.page}`);
  lines.push(`**Claims extracted:** ${reg.claims.length} · ${new Date(reg.extractedOn + 'T00:00').toLocaleDateString('en-CA', { day: 'numeric', month: 'long', year: 'numeric' })}`);
  lines.push(`**Reviewed by:** ${reg.reviewedBy ?? '— not yet —'}`);
  lines.push('');
  lines.push('## What is being asked');
  lines.push('');
  lines.push('Strong Fire is a free, independent information site for First Nations people.');
  lines.push('It is not affiliated with any bank, firm or government agency, and it carries no');
  lines.push('advertising and no accounts. The page below explains the on-reserve tax exemption');
  lines.push('in plain language, and it tells readers in its own words that it has not been');
  lines.push('reviewed by a tax professional.');
  lines.push('');
  lines.push('This asks you to mark each statement **Correct**, **Needs changing**, or');
  lines.push('**Cannot say in general** — the last one being a real and useful answer.');
  lines.push('There is no request to endorse the site or to be named on it.');
  lines.push('');
  lines.push(`## The ${needs.length} that need you`);
  lines.push('');
  lines.push('These are judgement calls, not lookups.');
  lines.push('');
  needs.forEach((c, i) => {
    lines.push(`### ${i + 1}. ${c.claim}`);
    lines.push('');
    if (c.note) lines.push(`> ${c.note}`);
    if (c.authority) lines.push(`*Rests on:* ${c.authority}`);
    lines.push('');
    lines.push('- [ ] Correct as written');
    lines.push('- [ ] Needs changing — how: ');
    lines.push('- [ ] Cannot be stated in general');
    lines.push('');
  });
  lines.push(`## The ${sourced.length} already checked against a source`);
  lines.push('');
  lines.push('Skim these. Flag only what is wrong.');
  lines.push('');
  sourced.forEach((c) => {
    lines.push(`- **${c.claim}**`);
    lines.push(`  ${c.authority ?? ''}${c.source ? ` — ${c.source}` : ''}`);
    lines.push('  - [ ] Wrong or out of date');
  });
  lines.push('');
  lines.push('## Anything the page should say and does not');
  lines.push('');
  lines.push('The most useful thing a reviewer usually returns is the omission.');
  lines.push('');
  lines.push('');

  const out = join(outDir, file.replace(/\.json$/, '.md'));
  writeFileSync(out, lines.join('\n'));
  console.log(`[review] ${reg.claims.length} claims → docs/review/${file.replace(/\.json$/, '.md')} (${needs.length} need a practitioner)`);
}
