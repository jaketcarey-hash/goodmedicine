#!/usr/bin/env node
/**
 * Make the site findable and shareable.
 *
 * The test this answers: someone hears about Strong Fire and texts a friend a
 * link to the NIHB page. Before this, that message rendered as a bare URL —
 * no title, no description, no picture — because the site had no Open Graph
 * tags. And nothing told a search engine any of the 512 pages existed: no
 * robots.txt, no sitemap.
 *
 * A site nobody can find is not a resource, however good the pages are.
 *
 * Runs after the search index and before the service worker, so sitemap and
 * robots are on disk in time to be precached.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DIST = join(here, '..', 'dist');
const ORIGIN = 'https://strongfire.ca';

/**
 * Whether search engines should index the site yet.
 *
 * Off while it is being built out and shared by hand. A half-finished page that
 * gets indexed is hard to un-index, and the snippet Google caches today is the
 * one it shows for months. Sharing still works — the Open Graph tags and share
 * card are unaffected, because those fire on a link in a message, not a crawl.
 *
 * Flip to true, rebuild, deploy, then submit the sitemap.
 */
const INDEXABLE = JSON.parse(
  readFileSync(new URL('../src/data/site.json', import.meta.url), 'utf8'),
).indexable;

/** Kept out of search results: shells, settings, legal, error pages. */
const NOINDEX = new Set(['/404', '/settings']);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

function urlFor(file) {
  const rel = relative(DIST, file).split(sep).join('/');
  const path = '/' + rel.replace(/\/?index\.html$/, '').replace(/\.html$/, '');
  return path === '/' || path === '' ? '/' : path;
}

/**
 * How often a page is worth re-crawling, and how much it matters relative to
 * the rest of the site. The brief changes daily; a glossary definition does not.
 */
function priorityFor(path) {
  if (path === '/') return { priority: '1.0', changefreq: 'daily' };
  if (path === '/nations') return { priority: '0.9', changefreq: 'daily' };
  if (/^\/(money|rights|path|self|moments)\//.test(path))
    return { priority: '0.8', changefreq: 'monthly' };
  if (path.startsWith('/nations/bc')) return { priority: '0.7', changefreq: 'monthly' };
  if (path.startsWith('/tools') || path === '/glossary')
    return { priority: '0.7', changefreq: 'monthly' };
  if (path.startsWith('/nations/archive')) return { priority: '0.5', changefreq: 'yearly' };
  return { priority: '0.6', changefreq: 'monthly' };
}

const files = walk(DIST);
const today = new Date().toISOString().slice(0, 10);

const entries = files
  .map(urlFor)
  .filter((p) => !NOINDEX.has(p))
  .sort();

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((path) => {
    const { priority, changefreq } = priorityFor(path);
    return `  <url>
    <loc>${ORIGIN}${path === '/' ? '/' : path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>
`;

writeFileSync(join(DIST, 'sitemap.xml'), sitemap);

writeFileSync(
  join(DIST, 'robots.txt'),
  INDEXABLE
    ? `# Strong Fire — free financial information for First Nations people.
# Everything here is meant to be found. Please index it.
User-agent: *
Allow: /
Disallow: /settings

Sitemap: ${ORIGIN}/sitemap.xml
`
    : `# Strong Fire is still being built. Not ready to be indexed yet.
# Shared by hand for now — see INDEXABLE in scripts/build-seo.js.
User-agent: *
Disallow: /
`,
);

console.log(
  `[seo] sitemap: ${entries.length} URLs · ${INDEXABLE ? 'INDEXABLE' : 'noindex — not discoverable yet'}`,
);
