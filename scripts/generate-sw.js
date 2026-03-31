/**
 * Post-build script: generates the service worker precache list
 * by scanning dist/ for HTML files.
 *
 * Reads public/sw.js as a template, replaces the PRECACHE_URLS
 * placeholder, and writes the result to dist/sw.js.
 */

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

  // Static assets to always include
  const staticAssets = ['/favicon.svg', '/manifest.json'];
  const allUrls = [...htmlUrls, ...staticAssets];

  // Format as JS array
  const urlsArray = allUrls.map((u) => `  '${u}'`).join(',\n');

  // Read template
  const template = await readFile(TEMPLATE_PATH, 'utf-8');

  // Replace placeholder
  const output = template.replace(
    "'__PRECACHE_URLS__'",
    `\n${urlsArray}\n`,
  );

  // Write to dist
  await writeFile(join(DIST_DIR, 'sw.js'), output, 'utf-8');

  console.log(`[generate-sw] Wrote ${allUrls.length} URLs to dist/sw.js`);
}

main().catch((err) => {
  console.error('[generate-sw] Failed:', err);
  process.exit(1);
});
