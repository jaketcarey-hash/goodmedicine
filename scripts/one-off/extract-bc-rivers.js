#!/usr/bin/env node
/**
 * The rivers, so the map explains itself.
 *
 * Nations sit on water. Without the rivers, the clusters on this map read as
 * smudges of ink and the reader has to take the distribution on trust; with
 * them, the Fraser Canyon is visibly a canyon and the coast is visibly a coast.
 * This is the one piece of interior detail that earns its kilobytes, because it
 * is the reason the dots are where they are.
 *
 * Run once by hand, output committed. Same rule as the outline: no runtime
 * request, no build-time dependency on anyone's host being up.
 *
 *   node scripts/one-off/extract-bc-rivers.js /tmp/rivers.geojson
 */
import { readFileSync, writeFileSync } from 'node:fs';

const src = process.argv[2];
if (!src) { console.error('usage: extract-bc-rivers.js <rivers.geojson>'); process.exit(1); }

const outline = JSON.parse(readFileSync('src/data/bc/outline.json', 'utf8'));
const B = outline.bounds;
const STANDARD_PARALLEL = 54;
const K = Math.cos((STANDARD_PARALLEL * Math.PI) / 180);

// Same projection as the outline, or the rivers land in the wrong province.
const project = ([lon, lat]) => [
  ((lon * K - B.minX) / (B.maxX - B.minX)) * outline.width,
  outline.height - ((lat - B.minY) / (B.maxY - B.minY)) * outline.height,
];

const inBc = ([lon, lat]) => lon >= -139 && lon <= -114 && lat >= 48 && lat <= 60;

/** The rivers a person might actually name. Tributaries turn this into noise. */
const KEEP = new Set([
  'Fraser', 'Skeena', 'Columbia', 'Peace', 'Stikine', 'Liard', 'Finlay', 'Nass',
]);

const geo = JSON.parse(readFileSync(src, 'utf8'));
const paths = [];

for (const f of geo.features) {
  const name = f.properties.name || f.properties.name_en || '';
  if (!KEEP.has(name)) continue;
  const lines =
    f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const line of lines) {
    // Clip to BC rather than drawing a river across the whole continent.
    let run = [];
    for (const pt of line) {
      if (inBc(pt)) run.push(pt);
      else if (run.length) { if (run.length > 1) paths.push({ name, line: run }); run = []; }
    }
    if (run.length > 1) paths.push({ name, line: run });
  }
}

const d = paths
  .map(({ line }) =>
    line
      .map(project)
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(''),
  )
  .join('');

const names = [...new Set(paths.map((p) => p.name))].sort();
writeFileSync(
  'src/data/bc/rivers.json',
  JSON.stringify(
    {
      _comment:
        'Major BC rivers as one SVG path, projected to match outline.json exactly. Extracted once by scripts/one-off/extract-bc-rivers.js and committed. They are here because Nations sit on water: without them the clusters on the map are smudges the reader must take on trust, and with them the distribution explains itself. Tributaries are deliberately excluded — they turn the same picture into noise.',
      source: 'Natural Earth 50m rivers and lake centerlines',
      sourceUrl:
        'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_rivers_lake_centerlines.geojson',
      licence: 'Natural Earth — public domain',
      extractedOn: '2026-08-25',
      rivers: names,
      segments: paths.length,
      path: d,
    },
    null,
    2,
  ) + '\n',
);
console.log(`[bc-rivers] ${names.length} rivers · ${paths.length} segments · ${(d.length / 1024).toFixed(1)} KB — ${names.join(', ')}`);
