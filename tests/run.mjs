#!/usr/bin/env node
/**
 * Bundle each engine against the real src/lib and run it under Node.
 *
 * The libraries import JSON registries and touch localStorage, so they cannot
 * simply be imported here. esbuild bundles the actual source — not a mock of
 * it — and shim.js supplies the one browser API involved. What runs is what
 * ships.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const tmp = join(here, '.build');

const SUITES = [
  { name: 'forecast', test: 'forecast.test.mjs', bundle: 'bundle.mjs',
    entry: ['forecast', 'budget-store', 'dates'] },
  { name: 'debt', test: 'debt.test.mjs', bundle: 'debt.mjs',
    entry: ['debt-store'] },
  { name: 'csv', test: 'csv.test.mjs', bundle: 'csv.mjs',
    entry: ['csv'] },
  { name: 'entitlements', test: 'entitlements.test.mjs', bundle: 'ent.mjs',
    entry: ['entitlements', 'household-store'] },
  { name: 'money-picture', test: 'money-picture.test.mjs', bundle: 'picture.mjs',
    entry: ['money-picture'] },
  { name: 'household', test: 'household.test.mjs', bundle: 'house.mjs',
    entry: ['calendar-store', 'household-store', 'household-draft'] },
];

mkdirSync(tmp, { recursive: true });
let failed = 0;

for (const suite of SUITES) {
  const entryFile = join(tmp, `${suite.name}.entry.ts`);
  writeFileSync(
    entryFile,
    suite.entry.map((m) => `export * from '${join(root, 'src/lib', m)}.ts';`).join('\n'),
  );
  execFileSync('npx', [
    'esbuild', entryFile, '--bundle', '--format=esm', '--platform=neutral',
    '--loader:.json=json', `--outfile=${join(here, suite.bundle)}`,
  ], { cwd: root, stdio: 'pipe' });

  try {
    const out = execFileSync('node', [join(here, suite.test)], { cwd: here, encoding: 'utf8' });
    const line = out.trim().split('\n').filter(Boolean).pop();
    console.log(`  ${suite.name.padEnd(14)} ${line}`);
  } catch (err) {
    failed++;
    console.log(`  ${suite.name.padEnd(14)} FAILED`);
    console.log(String(err.stdout ?? err.message).split('\n').filter((l) => /FAIL/.test(l)).join('\n'));
  } finally {
    rmSync(join(here, suite.bundle), { force: true });
  }
}

rmSync(tmp, { recursive: true, force: true });
if (failed) {
  console.log(`\n${failed} suite(s) failed\n`);
  process.exit(1);
}
console.log('\nall suites passed\n');
