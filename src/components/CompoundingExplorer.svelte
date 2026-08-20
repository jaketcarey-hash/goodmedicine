<script lang="ts">
  /**
   * Compounding, with her own numbers on it.
   *
   * The article states outcomes at ten, twenty and thirty years in prose. A
   * reader who does not recognise herself in "$50 a month" gets nothing from
   * those numbers, and the one thing compounding needs in order to land is
   * the shape: flat for years, then steep. Prose cannot draw that.
   *
   * The split is the same one the debt chart uses — solid for what you put
   * in, hatched for what the rate did — and pointing it out is the lesson.
   * Interest and growth are one mechanism with a sign: on a balance you owe
   * it takes the hatched part from you every month, and on a balance you own
   * it hands the hatched part back. Same picture, opposite direction.
   *
   * The rate is never typed here. It arrives from the figure registry, so
   * this explorer and every projection in the article are incapable of
   * quoting different numbers.
   */
  import { VIEW, normalise, linePath, areaPath, bandPath, type Point } from '../lib/chart';

  interface Props {
    /** Annual rate as a decimal, from the registry. */
    rate: number;
    rateLabel: string;
    sourceLabel: string;
  }
  let { rate, rateLabel, sourceLabel }: Props = $props();

  let monthly = $state(50);
  let years = $state(30);

  /** Month-end deposits, compounded monthly — the article's convention. */
  function futureValue(m: number, y: number): number {
    const i = rate / 12;
    const n = y * 12;
    if (i === 0) return m * n;
    return m * ((1 + i) ** n - 1) / i;
  }

  let series = $derived.by(() => {
    const contributed: number[] = [];
    const total: number[] = [];
    for (let y = 0; y <= years; y++) {
      contributed.push(monthly * 12 * y);
      total.push(futureValue(monthly, y));
    }
    return { contributed, total };
  });

  let finalTotal = $derived(series.total[series.total.length - 1] ?? 0);
  let finalContributed = $derived(series.contributed[series.contributed.length - 1] ?? 0);
  let growth = $derived(finalTotal - finalContributed);
  let growthShare = $derived(finalTotal > 0 ? growth / finalTotal : 0);
  /** The year growth first exceeds what was put in — the crossover, if it comes. */
  let crossover = $derived(
    series.total.findIndex((t, i) => t - series.contributed[i] > series.contributed[i] && i > 0),
  );

  let peak = $derived(Math.max(finalTotal, 1) * 1.06);
  let contributedPts = $derived(normalise(series.contributed, peak));
  let totalPts = $derived(normalise(series.total, peak));

  const money = (n: number) => '$' + Math.round(n).toLocaleString('en-CA');
  const uid = Math.random().toString(36).slice(2, 8);
</script>

<div class="rounded-sm border border-rule bg-white p-5">
  <figure class="not-prose m-0">
    <figcaption class="apparatus-label mb-4 border-b border-rule pb-2.5">
      Put in {money(monthly)} a month for {years} {years === 1 ? 'year' : 'years'}
    </figcaption>

    <div class="relative">
      <svg
        viewBox="0 0 {VIEW.w} {VIEW.h}"
        class="block h-auto w-full overflow-visible"
        role="img"
        aria-label="What {money(monthly)} a month becomes over {years} years at {rateLabel}"
      >
        <defs>
          <pattern
            id="grow-{uid}" width="7" height="7"
            patternUnits="userSpaceOnUse" patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="7" class="stroke-quiet" stroke-width="2.5" />
          </pattern>
        </defs>

        <!-- growth rides on top of what was contributed -->
        <path d={bandPath(totalPts, contributedPts)} fill="url(#grow-{uid})" />
        <path d={areaPath(contributedPts)} class="fill-rule" />
        <path d={linePath(contributedPts)} fill="none" class="stroke-quiet" stroke-width="1.5" />
        <line x1="0" y1={VIEW.h} x2={VIEW.w} y2={VIEW.h} class="stroke-rule" stroke-width="1" />
      </svg>

      <p class="apparatus absolute right-0 top-0 -translate-y-1/2 whitespace-nowrap text-[10px] leading-none text-ink tabular-nums">
        {money(finalTotal)}
      </p>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
      <span class="flex items-center gap-2 text-ink">
        <svg width="16" height="12" aria-hidden="true" class="flex-shrink-0">
          <rect width="16" height="12" class="fill-rule" />
          <rect width="16" height="12" fill="none" class="stroke-quiet" stroke-width="1.5" />
        </svg>
        What you put in — {money(finalContributed)}
      </span>
      <span class="flex items-center gap-2 text-ink">
        <svg width="16" height="12" aria-hidden="true" class="flex-shrink-0">
          <rect width="16" height="12" fill="url(#grow-{uid})" />
        </svg>
        What the rate added — {money(growth)}
      </span>
    </div>
  </figure>

  <!-- Controls under the chart: the chart is the answer, these are the question. -->
  <div class="mt-6 space-y-4 border-t border-rule pt-5">
    <label class="block">
      <span class="mb-2 flex items-baseline justify-between">
        <span class="text-sm font-medium text-ink">Every month</span>
        <span class="apparatus text-sm text-ink tabular-nums">{money(monthly)}</span>
      </span>
      <input
        type="range" min="10" max="1000" step="10" bind:value={monthly}
        class="w-full accent-ink"
      />
    </label>
    <label class="block">
      <span class="mb-2 flex items-baseline justify-between">
        <span class="text-sm font-medium text-ink">For</span>
        <span class="apparatus text-sm text-ink tabular-nums">{years} years</span>
      </span>
      <input
        type="range" min="1" max="45" step="1" bind:value={years}
        class="w-full accent-ink"
      />
    </label>
  </div>

  <p class="mt-5 max-w-prose text-sm leading-relaxed text-quiet">
    {money(monthly)} a month for {years} {years === 1 ? 'year' : 'years'} is
    {money(finalContributed)} out of your pocket. At {rateLabel} it would be worth
    about <span class="font-medium text-ink">{money(finalTotal)}</span> —
    {Math.round(growthShare * 100)} cents of every dollar in it never came from you.
    {#if crossover > 0}
      Around year {crossover} the growth passes what you have put in, and after that
      the account is earning more than you are adding.
    {/if}
  </p>

  <p class="apparatus mt-3 text-[11px] leading-snug text-faint">
    {rateLabel} a year, from the {sourceLabel}. A planning assumption for long
    horizons, not a forecast — real returns arrive unevenly and some years are
    negative. Fees and tax are not modelled here.
  </p>
</div>
