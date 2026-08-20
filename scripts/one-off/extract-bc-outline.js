#!/usr/bin/env node
/**
 * Turn a BC boundary into an SVG path this site can ship offline.
 *
 * Run once, by hand, against a downloaded GeoJSON. The output is committed to
 * src/data/bc/outline.json and never fetched again — the site makes no
 * external requests at runtime, and builds must work with no network at all.
 * Same discipline as the figure registry: fetch once, record the source, keep
 * the bytes.
 *
 *   node scripts/one-off/extract-bc-outline.js /tmp/canada.geojson
 */
import { readFileSync, writeFileSync } from 'node:fs';

const src = process.argv[2];
if (!src) { console.error('usage: extract-bc-outline.js <canada.geojson>'); process.exit(1); }

const geo = JSON.parse(readFileSync(src, 'utf8'));
const bc = geo.features.find((f) => (f.properties.name || f.properties.NAME) === 'British Columbia');
if (!bc) { console.error('British Columbia not found'); process.exit(1); }

/* ---- Projection ----
 * BC runs from 48°N to 60°N, so plotting raw longitude would stretch the
 * north badly — a degree of longitude at 60°N is half the ground distance it
 * is at 48°N. Longitude is therefore scaled by the cosine of ONE standard
 * parallel for the whole map, not per point. Scaling per point shears the
 * province: the Alberta border is a straight meridian at -114°, and a
 * per-point cosine maps it to a different x at every latitude, bending a
 * straight line into a diagonal and stretching the map to nearly twice its
 * true width. Equirectangular with a standard parallel, which is what this
 * is, keeps meridians straight.
 *
 * This is a picture of BC, not a survey; nothing is measured off it. */
const STANDARD_PARALLEL = 54; // mid-BC
const K = Math.cos((STANDARD_PARALLEL * Math.PI) / 180);
const toXY = ([lon, lat]) => [lon * K, lat];

/* ---- Simplification (Douglas–Peucker) ----
 * The source is 705 KB. This renders at a few hundred pixels on a phone with
 * a bad connection, where every kilobyte is a real cost. */
function perpendicular(p, a, b) {
  const [x, y] = p, [x1, y1] = a, [x2, y2] = b;
  const dx = x2 - x1, dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  const cx = x1 + Math.max(0, Math.min(1, t)) * dx;
  const cy = y1 + Math.max(0, Math.min(1, t)) * dy;
  return Math.hypot(x - cx, y - cy);
}
function simplify(points, tol) {
  if (points.length < 3) return points;
  let maxD = 0, idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicular(points[i], points[0], points[points.length - 1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= tol) return [points[0], points[points.length - 1]];
  return [
    ...simplify(points.slice(0, idx + 1), tol).slice(0, -1),
    ...simplify(points.slice(idx), tol),
  ];
}

const ringArea = (r) => {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    a += (r[j][0] * r[i][1]) - (r[i][0] * r[j][1]);
  }
  return Math.abs(a / 2);
};

const polys = bc.geometry.type === 'MultiPolygon' ? bc.geometry.coordinates : [bc.geometry.coordinates];
const TOLERANCE = 0.02;   // degrees-ish, in projected units
const MIN_AREA = 0.02;    // drop specks; Haida Gwaii and Vancouver Island survive

const rings = [];
for (const poly of polys) {
  const outer = poly[0].map(toXY);
  if (ringArea(outer) < MIN_AREA) continue;
  rings.push(simplify(outer, TOLERANCE));
}
rings.sort((a, b) => ringArea(b) - ringArea(a));

// Normalise into a 0..1000 box, y flipped for SVG.
const all = rings.flat();
const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minY = Math.min(...ys), maxY = Math.max(...ys);
const span = Math.max(maxX - minX, maxY - minY);
const W = 1000, H = Math.round(((maxY - minY) / (maxX - minX)) * W);

const project = ([x, y]) => [
  ((x - minX) / (maxX - minX)) * W,
  H - ((y - minY) / (maxY - minY)) * H,
];

const d = rings
  .map((ring) => ring.map(project).map(([x, y], i) =>
    `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join('') + 'Z')
  .join('');

const out = {
  _comment:
    'BC outline as one SVG path, extracted once by scripts/one-off/extract-bc-outline.js and committed. The site makes no external requests at runtime and its builds do not depend on any host being up. Longitude is scaled by cos(latitude) so the north is not stretched; this is a picture, not a survey, and nothing is measured off it. `bounds` is what plots a Nation onto it.',
  source: 'Natural Earth via click_that_hood/canada.geojson',
  sourceUrl: 'https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/canada.geojson',
  licence: 'Natural Earth — public domain',
  extractedOn: '2026-08-20',
  viewBox: `0 0 ${W} ${H}`,
  width: W,
  height: H,
  bounds: { minX, maxX, minY, maxY },
  rings: rings.length,
  path: d,
};
writeFileSync('src/data/bc/outline.json', JSON.stringify(out, null, 2) + '\n');
console.log(`[bc-outline] ${rings.length} rings · ${(d.length / 1024).toFixed(1)} KB path · viewBox ${out.viewBox}`);
