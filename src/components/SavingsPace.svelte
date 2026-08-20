<script lang="ts">
  /**
   * At your pace, when?
   *
   * A progress bar answers "how far along" and stops there. The question
   * underneath it is when the thing actually happens, and the deposits
   * already carry the answer — every one is dated, and nobody has ever
   * plotted them.
   *
   * The projection is her own observed rate carried forward, not a target
   * she was never asked for. `SavingsGoal` has no target date on purpose:
   * a deadline she did not set is a deadline to fail, and this site's
   * progress only goes up.
   *
   * Two deposits are the floor. One deposit is a balance, not a pace, and
   * a line drawn through it would be invention.
   */
  import type { SavingsGoal } from '../lib/savings-store';
  import { VIEW, normalise, linePath, labelStyle, type Point } from '../lib/chart';

  interface Props { goal: SavingsGoal }
  let { goal }: Props = $props();

  const DAY = 86_400_000;

  let dated = $derived(
    [...goal.deposits]
      .filter((d) => d.date && Number.isFinite(d.amount))
      .sort((a, b) => a.date.localeCompare(b.date)),
  );

  let analysis = $derived.by(() => {
    if (dated.length < 2) return null;

    const first = Date.parse(dated[0].date);
    const last = Date.parse(dated[dated.length - 1].date);
    const spanDays = Math.max((last - first) / DAY, 1);

    // Cumulative saved at each deposit, as (daysFromFirst, amount).
    let running = 0;
    const actual: { day: number; amount: number }[] = [];
    for (const d of dated) {
      running += d.amount;
      actual.push({ day: (Date.parse(d.date) - first) / DAY, amount: running });
    }

    const perDay = running / spanDays;
    const remaining = goal.targetAmount - goal.currentAmount;
    if (perDay <= 0) return null;
    if (remaining <= 0) return { actual, spanDays, perDay, daysToGo: 0, arrival: null, done: true };

    const daysToGo = remaining / perDay;
    // Beyond a decade the projection stops meaning anything; say so instead.
    if (daysToGo > 3650) return { actual, spanDays, perDay, daysToGo, arrival: null, done: false };

    const arrival = new Date(last + daysToGo * DAY);
    return { actual, spanDays, perDay, daysToGo, arrival, done: false };
  });

  // One scale for both series: days across, dollars up to the target.
  let totalDays = $derived(analysis ? analysis.spanDays + analysis.daysToGo : 1);
  // 6% headroom so the target line and its label are not flush with the top
  // edge. Both series share it, so the shape is untouched.
  let peak = $derived(Math.max(goal.targetAmount, goal.currentAmount, 1) * 1.06);

  function pointFor(day: number, amount: number): Point {
    return { x: Math.min(day / Math.max(totalDays, 1), 1), y: Math.min(amount / peak, 1) };
  }

  let actualPts = $derived(
    analysis ? analysis.actual.map((p) => pointFor(p.day, p.amount)) : [],
  );
  let projectionPts = $derived.by(() => {
    if (!analysis || analysis.done || !analysis.arrival) return [];
    const lastActual = analysis.actual[analysis.actual.length - 1];
    return [
      pointFor(lastActual.day, lastActual.amount),
      pointFor(analysis.spanDays + analysis.daysToGo, goal.targetAmount),
    ];
  });
  let arrivalPoint = $derived(projectionPts[projectionPts.length - 1] as Point | undefined);

  const money = (n: number) => '$' + Math.round(n).toLocaleString('en-CA');
  const when = (d: Date) => d.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
</script>

{#if dated.length < 2}
  <p class="apparatus text-[11px] leading-snug text-faint">
    Two deposits set a pace. After the second one, this shows when the goal
    arrives at the rate you are actually going.
  </p>
{:else if analysis}
  <figure class="not-prose m-0">
    <figcaption class="apparatus-label mb-3 border-b border-rule pb-2.5">
      At your pace
    </figcaption>

    <div class="relative">
      <svg
        viewBox="0 0 {VIEW.w} {VIEW.h}"
        class="block h-auto w-full overflow-visible"
        role="img"
        aria-label="Deposits so far, projected forward to {goal.name}"
      >
        <!-- the target -->
        <line
          x1="0" y1={VIEW.h - (goal.targetAmount / peak) * VIEW.h}
          x2={VIEW.w} y2={VIEW.h - (goal.targetAmount / peak) * VIEW.h}
          class="stroke-rule" stroke-width="1" stroke-dasharray="2 4"
        />
        <line x1="0" y1={VIEW.h} x2={VIEW.w} y2={VIEW.h} class="stroke-rule" stroke-width="1" />
        <!-- where you are going, if nothing changes -->
        {#if projectionPts.length === 2}
          <path
            d={linePath(projectionPts)} fill="none"
            class="stroke-quiet" stroke-width="2" stroke-dasharray="6 5" stroke-linecap="round"
          />
        {/if}
        <!-- what you have actually done -->
        <path
          d={linePath(actualPts)} fill="none"
          class="stroke-ink" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
        />
        {#each actualPts as p}
          <circle cx={p.x * VIEW.w} cy={VIEW.h - p.y * VIEW.h} r="4" class="fill-ink" />
        {/each}
      </svg>

      <p
        class="apparatus absolute left-0 whitespace-nowrap text-[10px] leading-none text-faint tabular-nums"
        style="bottom: {(goal.targetAmount / peak) * 100}%; margin-bottom: 4px"
      >{money(goal.targetAmount)}</p>

      {#if arrivalPoint && analysis.arrival}
        <p
          class="apparatus absolute -translate-x-full whitespace-nowrap text-[10px] leading-none text-ink tabular-nums"
          style="{labelStyle(arrivalPoint)}; margin-bottom: 8px"
        >{when(analysis.arrival)}</p>
      {/if}
    </div>

    <p class="mt-3 max-w-prose text-sm leading-relaxed text-quiet">
      {#if analysis.done}
        You are there. {money(goal.currentAmount)} of {money(goal.targetAmount)}.
      {:else if analysis.arrival}
        You have been putting away about {money(analysis.perDay * 30)} a month.
        At that rate {goal.name} arrives around
        <span class="font-medium text-ink">{when(analysis.arrival)}</span>.
        Deposit more often and the dashed line gets shorter.
      {:else}
        At about {money(analysis.perDay * 30)} a month this goal is more than ten
        years out, so no date is shown. A bigger regular amount is what moves it.
      {/if}
    </p>
  </figure>
{/if}
