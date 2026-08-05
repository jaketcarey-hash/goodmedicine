/**
 * Every stated number, from one place.
 *
 * The problem this solves was live on the site until August 2026: the Canada
 * Child Benefit appeared as $8,157 in an article and $7,787 in the calculator
 * on the next page, because each had been typed in separately and only one got
 * updated. Numbers written in two places drift. Numbers read from one key
 * cannot.
 *
 * Every entry carries where it came from and when it was last checked, which
 * makes two other things possible: the site can show "verified 4 August 2026"
 * beside a figure, and the build can refuse to ship one that is past its
 * review date. See `scripts/check-figures.js`.
 */
import registry from '../data/figures/2026.json';

export interface Figure {
  value: number;
  unit: string;
  label: string;
  note?: string;
  effectiveFrom: string;
  reviewBy: string;
  source: string;
  sourceLabel: string;
  verifiedOn: string;
}

type Registry = Record<string, Figure>;

// The `_comment` key documents the file for anyone opening it; it is not a figure.
const { _comment, ...entries } = registry as unknown as Registry & { _comment: string };
const figures = entries as Registry;

export type FigureKey = keyof typeof figures & string;

/**
 * Look up a figure. Throws on an unknown key rather than returning undefined —
 * a typo should stop the build, not render "$NaN" to someone working out
 * whether they can afford rent.
 */
export function figure(key: FigureKey): Figure {
  const found = figures[key];
  if (!found) {
    throw new Error(
      `Unknown figure "${key}". Add it to src/data/figures/2026.json or fix the key.`,
    );
  }
  return found;
}

export function value(key: FigureKey): number {
  return figure(key).value;
}

/** "$8,157" — whole dollars, which is how benefit amounts are quoted. */
export function money(key: FigureKey): string {
  const { value: v } = figure(key);
  return `$${Math.round(v).toLocaleString('en-CA')}`;
}

/** "$751.97" — keeps the cents, for monthly pension figures that are quoted exactly. */
export function moneyExact(key: FigureKey): string {
  const { value: v } = figure(key);
  return `$${v.toLocaleString('en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** "14%" or "5.95%" — trailing zeroes dropped. */
export function percent(key: FigureKey): string {
  const pct = figure(key).value * 100;
  return `${parseFloat(pct.toFixed(2))}%`;
}

export function allFigures(): (Figure & { key: string })[] {
  return Object.entries(figures).map(([key, f]) => ({ key, ...f }));
}

/**
 * Anything past its review date. The build calls the same logic through
 * scripts/check-figures.js; this export lets a page surface it too.
 */
export function staleFigures(asOf = new Date()): (Figure & { key: string })[] {
  const today = asOf.toISOString().slice(0, 10);
  return allFigures().filter((f) => f.reviewBy < today);
}
