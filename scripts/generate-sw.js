/**
 * Post-build script: generates the service worker precache list
 * by scanning dist/ for HTML files.
 *
 * Reads public/sw.js as a template, replaces the PRECACHE_URLS
 * placeholder, and writes the result to dist/sw.js.
 */

import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST_DIR = new URL('../dist', import.meta.url).pathname;
const TEMPLATE_PATH = new URL('../public/sw.js', import.meta.url).pathname;

async function collectHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  const urls = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;

    const fullPath = join(entry.parentPath ?? entry.path, entry.name);
    let urlPath = '/' + relative(DIST_DIR, fullPath);

    // Convert /index.html -> /
    // Convert /money/banking/index.html -> /money/banking
    if (urlPath.endsWith('/index.html')) {
      urlPath = urlPath.slice(0, -'/index.html'.length) || '/';
    } else if (urlPath.endsWith('.html')) {
      urlPath = urlPath.slice(0, -'.html'.length);
    }

    urls.push(urlPath);
  }

  return urls.sort();
}

async function main() {
  const htmlUrls = await collectHtmlFiles(DIST_DIR);

  // Static assets to always include.
  // search-index.json is here so search keeps working offline — the search page
  // fetches it at runtime, so precaching the HTML alone would leave it dead
  // without a connection.
  const staticAssets = ['/favicon.svg', '/manifest.json', '/search-index.json'];
  const allUrls = [...htmlUrls, ...staticAssets];

  // Format as JS array
  const urlsArray = allUrls.map((u) => `  '${u}'`).join(',\n');

  // Read template
  const template = await readFile(TEMPLATE_PATH, 'utf-8');

  /* The cache name has to move when the build does.
   *
   * It used to be a constant typed into the template, so `activate` — which
   * deletes every cache whose key is not the current one — deleted nothing,
   * ever. Combined with cache-first navigation that served returning visitors
   * the previous version of the site in full.
   *
   * Hashing the precache list gives an id that changes exactly when the built
   * output does, because the list is full of content-hashed filenames. An
   * identical build keeps its cache and its offline copy; a changed one gets a
   * fresh cache and the old one is genuinely cleared.
   *
   * Note what this deliberately does not do: a change to page *text* alone
   * leaves the URL list identical, so the cache name holds and the precache is
   * not rebuilt. That is the intended trade. Busting a 500-file precache on
   * every wording change means re-downloading the site on a bad connection,
   * which is precisely the connection this cache exists for — and it is
   * unnecessary, because navigations now go to the network first and only fall
   * back to the cache when there isn't one. Text is fresh from the network;
   * the cache moves when the assets do. */
  const buildId = createHash('sha256')
    .update(allUrls.join('\n'))
    .digest('hex')
    .slice(0, 12);

  const output = template
    .replace("'__PRECACHE_URLS__'", `\n${urlsArray}\n`)
    .replace('__BUILD_ID__', buildId);

  // Write to dist
  await writeFile(join(DIST_DIR, 'sw.js'), output, 'utf-8');

  console.log(
    `[generate-sw] Wrote ${allUrls.length} URLs to dist/sw.js · cache gm-${buildId}`,
  );
}

main().catch((err) => {
  console.error('[generate-sw] Failed:', err);
  process.exit(1);
});
