#!/usr/bin/env node
/**
 * Build the site-wide search index from the rendered output.
 *
 * Reading `dist/` rather than the sources is deliberate. The content lives in
 * four different shapes — hand-written Astro pages, a TypeScript glossary
 * array, brief JSON, and the ledger — and indexing each at its source would
 * mean four extractors that drift. Every one of them ends up as HTML, so the
 * HTML is the one place they are all the same shape.
 *
 * It also means "one search box reaching all of it" is true by construction:
 * a page that exists is a page that is searchable, without anyone remembering
 * to register it.
 *
 * Runs after `astro build` and before `generate-sw.js`, so the service worker
 * precaches the index and search keeps working offline.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const DIST = join(here, '..', 'dist');

/**
 * Not worth returning as a result.
 *
 * `/` is excluded because it embeds today's brief and the ledger counts, so it
 * matched arbitrary content — searching "nickel" surfaced the home page. It is
 * one click away on the wordmark and nobody searches to find it.
 */
const EXCLUDE = new Set(['/', '/404', '/settings', '/search']);

/** How much of a page is shown in a result row, and where the indexed body starts. */
const EXCERPT_CHARS = 220;

/** Where a URL sits in the site, which becomes the filter facet in the UI. */
function classify(url) {
  if (url.startsWith('/nations/ledger')) return { kind: 'ledger', label: 'Ledger record' };
  if (url.startsWith('/nations/who')) return { kind: 'nation', label: 'Nation' };
  if (url.startsWith('/nations/bc')) return { kind: 'bc', label: 'BC First Nation' };
  if (url === '/nations/open') return { kind: 'open', label: 'Open questions' };
  if (url.startsWith('/nations/archive') || url === '/nations')
    return { kind: 'brief', label: 'Brief' };
  if (url.startsWith('/nations/ytd')) return { kind: 'ledger', label: 'Dossier' };
  // Must precede the branch checks: /glossary/<term> is a definition, not a page.
  if (url.startsWith('/glossary')) return { kind: 'glossary', label: 'Glossary' };
  if (url.startsWith('/money')) return { kind: 'money', label: 'Money' };
  if (url.startsWith('/rights')) return { kind: 'rights', label: 'Rights' };
  if (url.startsWith('/path')) return { kind: 'path', label: 'Path' };
  if (url.startsWith('/self')) return { kind: 'self', label: 'Self' };
  if (url.startsWith('/moments')) return { kind: 'moments', label: 'Moments' };
  if (url.startsWith('/tools') || url === '/calendar' || url === '/ask-ai')
    return { kind: 'tool', label: 'Tool' };
  if (url === '/glossary') return { kind: 'glossary', label: 'Glossary' };
  return { kind: 'page', label: 'Page' };
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

/** Strip everything that is markup or machinery, leaving readable text. */
function textOf(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&rsquo;|&apos;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&rarr;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstMatch(html, re) {
  const m = html.match(re);
  return m ? textOf(m[1]) : '';
}

const files = walk(DIST);
const entries = [];

for (const file of files) {
  const rel = relative(DIST, file).split(sep).join('/');
  const url = '/' + rel.replace(/\/?index\.html$/, '').replace(/\.html$/, '');
  const clean = url === '' ? '/' : url;

  if (EXCLUDE.has(clean)) continue;

  const html = readFileSync(file, 'utf-8');

  const title =
    firstMatch(html, /<title>([\s\S]*?)<\/title>/i).replace(/\s*—\s*Strong Fire$/, '') ||
    firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!title) continue;

  const description = firstMatch(html, /<meta name="description" content="([^"]*)"/i);

  // Index the main content only, so nav and footer text does not match everything.
  const mainHtml = firstMatch(html, /<main[^>]*>([\s\S]*?)<\/main>/i)
    ? html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)[1]
    : html;

  const body = textOf(mainHtml);
  const { kind, label } = classify(clean);

  entries.push({
    url: clean,
    title,
    kind,
    label,
    // Enough to show a useful result row without shipping the whole page.
    excerpt: (description || body).slice(0, EXCERPT_CHARS),
    // Matched against, never displayed. Starts where the excerpt ends, because
    // scoring already checks the excerpt and storing the same words twice just
    // makes the file bigger. Capped because it is fetched whole and precached,
    // and the app has to work on a slow connection — short pages like glossary
    // terms end up contributing nothing here, which is the point.
    text: body.slice(EXCERPT_CHARS, EXCERPT_CHARS + 700).toLowerCase(),
  });
}

entries.sort((a, b) => a.title.localeCompare(b.title));

const out = join(DIST, 'search-index.json');
writeFileSync(out, JSON.stringify({ built: null, entries }));

const kb = Math.round(Buffer.byteLength(JSON.stringify({ entries })) / 1024);
const byKind = entries.reduce((acc, e) => ({ ...acc, [e.kind]: (acc[e.kind] ?? 0) + 1 }), {});
console.log(`[search] indexed ${entries.length} pages (${kb} KB)`);
console.log(
  '[search] ' +
    Object.entries(byKind)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k}:${n}`)
      .join('  '),
);
