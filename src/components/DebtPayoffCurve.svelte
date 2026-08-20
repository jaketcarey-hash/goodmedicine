<script lang="ts">
  /**
   * What the debt actually does, drawn.
   *
   * `calculatePayoff()` has always returned a full month-by-month
   * amortization and the planner rendered only its last row. This is that
   * series, plotted — the first real chart on the site, and the reason
   * `chart.ts` exists.
   *
   * Two figures, two lessons, deliberately kept apart:
   *
   * - **When you are free.** Both strategies from one starting balance down
   *   to zero. The horizontal gap between where the two curves land is the
   *   months saved; the vertical distance between them at any point is what
   *   you still owe under the slower one.
   * - **What it costs.** Everything paid, stacked into principal against
   *   interest. The hatched wedge is what 21% does — it is not a colour
   *   choice, it is the point of the chart.
   *
   * Identity is solid against dashed and solid against hatched, never a
   * second hue: the palette keeps colour for status, and this has to survive
   * being printed in black and white.
   */
  import type { PayoffMonth } from '../lib/debt-store';
  import {
    VIEW, normalise, linePath, areaPath, bandPath, thin, labelStyle, monthLabel,
    type Point,
  } from '../lib/chart';

  interface Props {
    timeline: PayoffMonth[];
    altTimeline: PayoffMonth[];
    strategy: 'avalanche' | 'snowball';
    altStrategy: 'avalanche' | 'snowball';
    totalOwed: number;
  }
  let { timeline, altTimeline, strategy, altStrategy, totalOwed }: Props = $props();

  const names = { avalanche: 'Avalanche', snowball: 'Snowball' };

  /** A timeline only "clears" if it actually reaches zero. Hitting the 600-month
   *  safety cap still owing is not a payoff date, and must never be shown as one. */
  function clears(t: PayoffMonth[]): boolean {
    return t.length > 0 && t[t.length - 1].totalBalance <= 0.01;
  }

  let mineClears = $derived(clears(timeline));
  let altClears = $derived(clears(altTimeline));

  // ---- Figure 1: the balance curves ----
  // Month 0 is prepended so the curve starts at the full balance rather than
  // after the first payment. Both series are normalised against one shared
  // maximum and one shared month count, or the gap between them would be a
  // drawing artefact instead of a fact.
  let mineBalances = $derived([totalOwed, ...timeline.map((m) => m.totalBalance)]);
  let altBalances = $derived([totalOwed, ...altTimeline.map((m) => m.totalBalance)]);
  let months = $derived(Math.max(mineBalances.length, altBalances.length));
  // 8% headroom above the highest balance. Both series share it, so the gap
  // between them is untouched — it only buys the starting-balance label room
  // to sit above the curve instead of on top of it.
  let peak = $derived(Math.max(...mineBalances, ...altBalances, 1) * 1.08);

  let minePts = $derived(thin(normalise(mineBalances, peak, months)));
  let altPts = $derived(thin(normalise(altBalances, peak, months)));
  let mineEnd = $derived(minePts[minePts.length - 1] as Point | undefined);
  let altEnd = $derived(altPts[altPts.length - 1] as Point | undefined);

  let monthsSaved = $derived(
    mineClears && altClears ? Math.abs(timeline.length - altTimeline.length) : 0,
  );
  let mineIsFaster = $derived(timeline.length <= altTimeline.length);

  // ---- Figure 2: everything paid, split ----
  let cumulative = $derived.by(() => {
    let principal = 0;
    let interest = 0;
    const principalSeries: number[] = [0];
    const totalSeries: number[] = [0];
    for (const m of timeline) {
      // principalPaid in the store counts the whole payment; the part that is
      // not interest is what actually reduced the balance.
      principal += Math.max(0, m.principalPaid - m.interestPaid);
      interest += m.interestPaid;
      principalSeries.push(principal);
      totalSeries.push(principal + interest);
    }
    return { principalSeries, totalSeries, principal, interest };
  });

  let paidPeak = $derived(Math.max(...cumulative.totalSeries, 1));
  let principalPts = $derived(thin(normalise(cumulative.principalSeries, paidPeak)));
  let totalPts = $derived(thin(normalise(cumulative.totalSeries, paidPeak)));
  let interestShare = $derived(
    cumulative.principal + cumulative.interest > 0
      ? cumulative.interest / (cumulative.principal + cumulative.interest)
      : 0,
  );

  /** A label centred on a point near the right edge hangs off it. Past 85%
   *  it right-aligns to the point instead — checked at 375px, where a
   *  centred payoff date overflowed by 25px. */
  function anchor(p: Point | undefined): string {
    if (!p) return '-translate-x-1/2';
    if (p.x > 0.85) return '-translate-x-full';
    if (p.x < 0.15) return 'translate-x-0';
    return '-translate-x-1/2';
  }

  const money = (n: number) => '$' + Math.round(n).toLocaleString('en-CA');

  // Pattern ids must be unique per instance — two charts on one page would
  // otherwise share, and the second would silently take the first's fill.
  const uid = Math.random().toString(36).slice(2, 8);
</script>

{#if timeline.length > 0}
  <!-- ================= When you are free ================= -->
  <figure class="not-prose m-0">
    <figcaption class="apparatus-label mb-3 border-b border-rule pb-2.5">
      What you still owe, month by month
    </figcaption>

    <div class="relative">
      <svg
        viewBox="0 0 {VIEW.w} {VIEW.h}"
        class="block h-auto w-full overflow-visible"
        role="img"
        aria-label="Balance falling to zero under {names[strategy]} compared with {names[altStrategy]}"
      >
        <!-- zero -->
        <line x1="0" y1={VIEW.h} x2={VIEW.w} y2={VIEW.h} class="stroke-rule" stroke-width="1" />
        <!-- the alternative -->
        <path
          d={linePath(altPts)}
          fill="none"
          class="stroke-quiet"
          stroke-width="2"
          stroke-dasharray="6 5"
          stroke-linecap="round"
        />
        <!-- yours -->
        <path
          d={linePath(minePts)}
          fill="none"
          class="stroke-ink"
          stroke-width="2.5"
          stroke-linecap="round"
        />
      </svg>

      <!-- One label anchors the scale; an axis would cost more than it teaches. -->
      <p class="apparatus absolute left-0 top-0 -translate-y-1/2 whitespace-nowrap text-[10px] leading-none text-faint tabular-nums">
        {money(totalOwed)}
      </p>

      <!-- Direct labels: the moment each plan lands. -->
      {#if mineEnd && mineClears}
        <p
          class="apparatus absolute {anchor(mineEnd)} translate-y-1/2 whitespace-nowrap text-[10px] leading-none text-ink tabular-nums"
          style="{labelStyle(mineEnd)}; margin-bottom: -14px"

        >{monthLabel(timeline.length)}</p>
      {/if}
      {#if altEnd && altClears && altTimeline.length !== timeline.length}
        <p
          class="apparatus absolute {anchor(altEnd)} whitespace-nowrap text-[10px] leading-none text-faint tabular-nums"
          style="{labelStyle(altEnd)}; margin-bottom: -28px"
        >{monthLabel(altTimeline.length)}</p>
      {/if}
    </div>

    <!-- Legend. Two series, so it is not optional. -->
    <div class="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
      <span class="flex items-center gap-2 text-ink">
        <svg width="22" height="6" aria-hidden="true" class="flex-shrink-0">
          <line x1="0" y1="3" x2="22" y2="3" class="stroke-ink" stroke-width="2.5" />
        </svg>
        {names[strategy]} — your plan
      </span>
      <span class="flex items-center gap-2 text-quiet">
        <svg width="22" height="6" aria-hidden="true" class="flex-shrink-0">
          <line x1="0" y1="3" x2="22" y2="3" class="stroke-quiet" stroke-width="2" stroke-dasharray="6 5" />
        </svg>
        {names[altStrategy]}
      </span>
    </div>

    <p class="mt-3 max-w-prose text-sm leading-relaxed text-quiet">
      {#if !mineClears}
        Under this plan the balance never reaches zero — the minimum payments do
        not cover what the interest adds each month. Raising a minimum or adding
        an extra payment is what changes that.
      {:else if monthsSaved > 0}
        {mineIsFaster ? names[strategy] : names[altStrategy]} clears the debt
        {monthsSaved} {monthsSaved === 1 ? 'month' : 'months'} sooner. That gap on
        the right is those months.
      {:else}
        Both orders clear the debt in the same month. Where they differ is
        interest, below.
      {/if}
    </p>
  </figure>

  <!-- ================= What it costs ================= -->
  {#if mineClears && cumulative.interest > 1}
    <figure class="not-prose m-0 mt-10">
      <figcaption class="apparatus-label mb-3 border-b border-rule pb-2.5">
        Everything you pay, split
      </figcaption>

      <div class="relative">
        <svg
          viewBox="0 0 {VIEW.w} {VIEW.h}"
          class="block h-auto w-full overflow-visible"
          role="img"
          aria-label="Total paid over time, split into principal and interest"
        >
          <defs>
            <pattern
              id="hatch-{uid}" width="7" height="7"
              patternUnits="userSpaceOnUse" patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="7" class="stroke-quiet" stroke-width="2.5" />
            </pattern>
          </defs>

          <!-- interest sits on top of principal -->
          <path d={bandPath(totalPts, principalPts)} fill="url(#hatch-{uid})" />
          <!-- Principal recedes: it is the part that was always going to be
               paid. The hatched interest above it is what the chart is for. -->
          <path d={areaPath(principalPts)} class="fill-rule" />
          <!-- the boundary between the two fills, doing the job of a surface gap -->
          <path
            d={linePath(principalPts)}
            fill="none"
            class="stroke-quiet"
            stroke-width="1.5"
          />
          <line x1="0" y1={VIEW.h} x2={VIEW.w} y2={VIEW.h} class="stroke-rule" stroke-width="1" />
        </svg>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span class="flex items-center gap-2 text-ink">
          <svg width="16" height="12" aria-hidden="true" class="flex-shrink-0">
            <rect width="16" height="12" class="fill-rule" />
            <rect width="16" height="12" fill="none" class="stroke-quiet" stroke-width="1.5" />
          </svg>
          What you borrowed — {money(cumulative.principal)}
        </span>
        <span class="flex items-center gap-2 text-ink">
          <svg width="16" height="12" aria-hidden="true" class="flex-shrink-0">
            <rect width="16" height="12" fill="url(#hatch-{uid})" />
          </svg>
          Interest — {money(cumulative.interest)}
        </span>
      </div>

      <p class="mt-3 max-w-prose text-sm leading-relaxed text-quiet">
        Of the {money(cumulative.principal + cumulative.interest)} this plan pays out,
        {money(cumulative.interest)} is interest — {Math.round(interestShare * 100)} cents
        of every dollar. The hatched part never touches what you owe.
      </p>
    </figure>
  {/if}
{/if}
