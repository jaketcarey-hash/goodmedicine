/**
 * The plotting primitive.
 *
 * Until M8 this site had no plotted SVG at all — every chart was a
 * width-driven or height-driven div (StageDistribution, WellnessHistory, the
 * forecast strip). Those stay: a bar is right whenever the data is buckets.
 * This file exists for the shape a bar cannot carry — a quantity moving
 * continuously through time, like a debt balance falling month by month.
 *
 * Three decisions hold across every chart built on it:
 *
 * 1. **Marks in SVG, words in HTML.** The `<svg>` carries only paths, at a
 *    fixed viewBox scaled with `w-full h-auto`. Every label is an absolutely
 *    positioned HTML element using the same normalised coordinates. Text in
 *    SVG shrinks with the viewport; text in HTML does not, and this site is
 *    read at 375px on a low-end Android.
 *
 * 2. **Identity comes from texture and dash, never from a second hue.** The
 *    palette is one neutral plus three reserved status colours, and colour
 *    never appears without its text label. So two series on one chart are
 *    solid against dashed, or solid against hatched — which is also what
 *    survives being printed in black and white, and what a colour-blind
 *    reader gets for free.
 *
 * 3. **Normalised coordinates, computed once.** Everything returns points in
 *    0..1 with y measured up from the bottom, so the same numbers drive the
 *    SVG path and the CSS percentage of a label.
 */

/** A point in normalised space: x and y both 0..1, y measured from the bottom. */
export interface Point {
  x: number;
  y: number;
}

/** The viewBox every chart on this site draws into. Aspect, not pixels. */
export const VIEW = { w: 720, h: 220 } as const;

/**
 * Normalise a series against a shared maximum.
 *
 * `max` is passed in rather than derived so that two series plotted together
 * share one scale — deriving it per-series would silently rescale each curve
 * to its own height and make the gap between them meaningless.
 */
export function normalise(values: number[], max: number, count = values.length): Point[] {
  if (values.length === 0 || max <= 0) return [];
  const lastX = Math.max(count - 1, 1);
  return values.map((v, i) => ({
    x: i / lastX,
    y: Math.max(0, Math.min(1, v / max)),
  }));
}

/** Normalised point → viewBox coordinates. SVG y grows downward; ours does not. */
function toView(p: Point): [number, number] {
  return [p.x * VIEW.w, VIEW.h - p.y * VIEW.h];
}

/** An open path through the points — the curve itself. */
export function linePath(points: Point[]): string {
  if (points.length === 0) return '';
  return points
    .map((p, i) => {
      const [x, y] = toView(p);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

/**
 * A closed path from the points down to `floor` — the filled band.
 *
 * `floor` is a normalised height, so stacking two bands means passing the
 * lower band's points as the upper band's floor via `bandPath`.
 */
export function areaPath(points: Point[], floor = 0): string {
  if (points.length === 0) return '';
  const [fx0] = toView({ x: points[0].x, y: floor });
  const floorY = VIEW.h - floor * VIEW.h;
  const [lx] = toView(points[points.length - 1]);
  return `${linePath(points)} L${lx.toFixed(2)} ${floorY.toFixed(2)} L${fx0.toFixed(2)} ${floorY.toFixed(2)} Z`;
}

/** A band between two series — the upper traced forward, the lower back. */
export function bandPath(upper: Point[], lower: Point[]): string {
  if (upper.length === 0 || lower.length === 0) return '';
  const back = [...lower].reverse();
  const forward = linePath(upper);
  const rest = back
    .map((p) => {
      const [x, y] = toView(p);
      return `L${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
  return `${forward} ${rest} Z`;
}

/**
 * Thin a series to at most `limit` points, always keeping the first and last.
 *
 * A 30-year payoff is 360 months; a 720-unit-wide path does not need 360
 * commands, and a phone does not need to parse them. The endpoints are kept
 * because the last one is the payoff — the whole point of the chart.
 */
export function thin<T>(series: T[], limit = 120): T[] {
  if (series.length <= limit) return series;
  const step = (series.length - 1) / (limit - 1);
  const out: T[] = [];
  for (let i = 0; i < limit; i++) out.push(series[Math.round(i * step)]);
  out[out.length - 1] = series[series.length - 1];
  return out;
}

/** Position a label in CSS percentages from a normalised point. */
export function labelStyle(p: Point): string {
  return `left: ${(p.x * 100).toFixed(2)}%; bottom: ${(p.y * 100).toFixed(2)}%`;
}

/** Month index → "Mar 2028", for axis ends and payoff markers. */
export function monthLabel(monthsFromNow: number, from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth() + monthsFromNow, 1);
  return d.toLocaleDateString('en-CA', { month: 'short', year: 'numeric' });
}
