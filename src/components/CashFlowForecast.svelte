<script lang="ts">
  /**
   * The eight-week strip.
   *
   * Design notes, because this is the first surface on the site to plot a
   * running quantity:
   *
   * - **The zero line is the whole point.** It is drawn in `ink` across the
   *   full strip — the site's own structural hairline, promoted to mean
   *   something. Bars hang below it. Most cash-flow UIs draw a curve and let
   *   the reader find the low point; this draws the threshold and shows the
   *   week that crosses it.
   * - **Bars, not SVG.** Height-driven divs are the documented house
   *   primitive (StageDistribution's widths, WellnessHistory's heights). A
   *   week is a bucket, not a point on a continuum — the balance is only
   *   known at week's end, and a smooth curve would claim otherwise.
   * - **One neutral, one status.** Magnitude is `quiet`; only a week that
   *   closes below zero takes `unsettled`, and it takes the word "short"
   *   with it. Colour never carries meaning alone here, so the strip
   *   survives black and white.
   * - **Tap, not hover.** The reader is on a phone. Weeks expand through
   *   native `<details>`, which is keyboard-navigable and works with no
   *   JavaScript at all.
   */
  import { onMount } from 'svelte';
  import {
    buildForecast,
    getStartBalance,
    balanceAgeDays as ageInDays,
    FORECAST_WEEKS,
    STALE_AFTER_DAYS,
    type Forecast,
    type ForecastWeek,
  } from '../lib/forecast';
  import { STORAGE_KEYS } from '../lib/storage-keys';
  import { fromISO, longLabel, toISO } from '../lib/dates';

  interface Props {
    /** The plan document embeds the answer and the strip only — the balance
     *  field, the week list and the limits live on the forecast's own page,
     *  and duplicating them here would make the chapter a second tool rather
     *  than a chapter. */
    compact?: boolean;
  }
  let { compact = false }: Props = $props();

  let forecast = $state<Forecast | null>(null);
  let balanceInput = $state('');
  let balanceRecordedOn = $state<string | null>(null);
  let ready = $state(false);

  onMount(() => {
    const saved = getStartBalance();
    if (saved) {
      balanceInput = String(saved.amount);
      balanceRecordedOn = saved.recordedOn;
    }
    rebuild();
    ready = true;
  });

  function rebuild() {
    const amount = balanceInput.trim() === '' ? null : Number(balanceInput);
    forecast = buildForecast({
      startBalance: amount !== null && Number.isFinite(amount) ? amount : null,
    });
  }

  function saveBalance() {
    const amount = Number(balanceInput);
    if (balanceInput.trim() === '' || !Number.isFinite(amount)) {
      localStorage.removeItem(STORAGE_KEYS.FORECAST_BALANCE);
      balanceRecordedOn = null;
    } else {
      balanceRecordedOn = toISO(new Date());
      localStorage.setItem(
        STORAGE_KEYS.FORECAST_BALANCE,
        JSON.stringify({ amount, recordedOn: balanceRecordedOn }),
      );
    }
    rebuild();
  }

  let balanceAgeDays = $derived(ageInDays(balanceRecordedOn));
  let balanceStale = $derived(balanceAgeDays !== null && balanceAgeDays > STALE_AFTER_DAYS);

  // ---- Strip geometry ----
  // Bars are scaled against the largest movement in either direction, and the
  // zero line sits where those two shares meet. With no negative week the line
  // rests on the floor; with a deep one it rises to give the dip room.
  let hasBalance = $derived(forecast?.startBalance !== null && forecast?.startBalance !== undefined);
  let balances = $derived(
    (forecast?.weeks ?? []).map((w) => (hasBalance ? (w.closingBalance ?? 0) : w.net)),
  );
  let maxPos = $derived(Math.max(0, ...balances));
  let maxNeg = $derived(Math.max(0, ...balances.map((b) => -b)));
  let span = $derived(maxPos + maxNeg);
  let zeroPct = $derived(span === 0 ? 100 : (maxPos / span) * 100);

  function posShare(value: number): number {
    if (value <= 0 || maxPos === 0) return 0;
    return (value / maxPos) * 100;
  }
  function negShare(value: number): number {
    if (value >= 0 || maxNeg === 0) return 0;
    return (-value / maxNeg) * 100;
  }

  /** A share of zero draws nothing; any real movement draws at least 2px, so a
   *  week that is barely short can never round away to an empty column. */
  function barHeight(share: number): string {
    return share === 0 ? '0' : `max(2px, ${share}%)`;
  }

  /** A deep enough bar carries its own label; a shallow one puts it underneath,
   *  where there is room. Either way the number never lands on the week labels. */
  function labelInside(share: number): boolean {
    return share >= 30;
  }

  /** Value for a week under the current mode: balance if we have one, else net. */
  function weekValue(week: ForecastWeek): number {
    return hasBalance ? (week.closingBalance ?? 0) : week.net;
  }

  const money = (n: number) =>
    (n < 0 ? '−$' : '$') + Math.round(Math.abs(n)).toLocaleString('en-CA');

  function weekTitle(week: ForecastWeek): string {
    return longLabel(fromISO(week.start)).replace(/^\w+, /, '');
  }

  const categoryLabels: Record<string, string> = {
    housing: 'housing', food: 'food', transport: 'transport', phone: 'phone and internet',
    'family-support': 'family support', health: 'health', education: 'education',
    personal: 'personal', savings: 'savings', debt: 'debt payments', other: 'other',
  };

  // ---- Which weeks get a printed value ----
  // Never a number on every bar. The dip and the last week carry the story;
  // everything else is read off the shape and opened if it matters.
  function labelled(index: number): boolean {
    if (!forecast) return false;
    const week = forecast.weeks[index];
    if (week.tight === true && forecast.firstTightWeek?.start === week.start) return true;
    return index === forecast.weeks.length - 1;
  }

  let weeksAway = $derived(
    forecast?.firstTightWeek
      ? forecast.weeks.findIndex((w) => w.start === forecast!.firstTightWeek!.start)
      : null,
  );

  let hasAnything = $derived(
    !!forecast &&
      (forecast.weeks.some((w) => w.events.length > 0) ||
        forecast.unplaced.length > 0),
  );
</script>

{#if ready && forecast}
  {#if !hasAnything && compact}
    <!-- Inside a chapter, an empty forecast is one line. The chapter has
         already said the budget is missing and already offered the link; a
         second pitch here would be the page asking twice. -->
    <p class="apparatus text-[11px] leading-snug text-faint">
      The eight-week strip appears here once a budget month has dates on its items.
    </p>
  {:else if !hasAnything}
    <!-- On its own page, the empty state says exactly what unlocks it, and
         links the one place to do it. -->
    <section class="rounded-sm border border-rule bg-white p-6">
      <h2 class="text-lg font-semibold">Nothing to forecast yet</h2>
      <p class="mt-2 text-sm text-quiet leading-relaxed max-w-prose">
        This page walks the next eight weeks day by day — your pay on the Friday it
        actually lands, rent on the day it comes out, benefits on the dates the
        government publishes — and names the week money runs short before you get
        there.
      </p>
      <p class="mt-3 text-sm text-quiet leading-relaxed max-w-prose">
        It needs one month of your budget, with a date on each item. A date is what
        turns "$900 every two weeks" into which Friday.
      </p>
      <a
        href="/money/budget-tool"
        class="mt-5 inline-block rounded-sm bg-ink px-4 py-2.5 text-sm font-medium text-ground hover:bg-black transition-colors"
      >
        Start a budget month
      </a>
    </section>
  {:else}
    <!-- ---------- The answer, before the chart ---------- -->
    <section class="border-b border-rule pb-6">
      {#if !hasBalance}
        <p class="text-xl md:text-2xl font-semibold tracking-[-0.015em] leading-snug max-w-2xl">
          Eight weeks of money, on real dates.
        </p>
        <p class="mt-2 text-sm text-quiet leading-relaxed max-w-prose">
          Add what is in your account right now and these weeks become a running
          balance — that is what turns the strip below into an answer about whether
          the money lasts.
        </p>
      {:else if forecast.firstTightWeek}
        <p class="text-xl md:text-2xl font-semibold tracking-[-0.015em] leading-snug max-w-2xl">
          The week of {weekTitle(forecast.firstTightWeek)} comes up
          {money(Math.abs(forecast.firstTightWeek.closingBalance ?? 0))} short.
        </p>
        <p class="mt-2 text-sm text-quiet leading-relaxed max-w-prose">
          {#if weeksAway === 0}
            That is this week.
          {:else}
            That is {weeksAway} {weeksAway === 1 ? 'week' : 'weeks'} from now. Opening
            the week below shows what lands in it and when.
          {/if}
        </p>
      {:else}
        <p class="text-xl md:text-2xl font-semibold tracking-[-0.015em] leading-snug max-w-2xl">
          Nothing in the next eight weeks goes below zero.
        </p>
        <p class="mt-2 text-sm text-quiet leading-relaxed max-w-prose">
          On what you have entered. What this forecast cannot see is listed at the
          foot of the page — that list is part of the answer.
        </p>
      {/if}
    </section>

    <!-- ---------- What is in the account ---------- -->
    {#if !compact}
    <section class="mt-6">
      <label for="start-balance" class="apparatus-label block">What is in your account now</label>
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <div class="relative">
          <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-quiet">$</span>
          <input
            id="start-balance"
            type="number"
            inputmode="decimal"
            bind:value={balanceInput}
            onblur={saveBalance}
            onchange={saveBalance}
            placeholder="0"
            class="w-40 rounded-sm border border-rule bg-white py-2.5 pl-7 pr-3 tabular-nums focus:border-ink focus:outline-none"
          />
        </div>
        {#if balanceRecordedOn}
          <p class="apparatus text-xs {balanceStale ? 'text-unsettled' : 'text-faint'}">
            {#if balanceStale}
              Entered {balanceAgeDays} days ago — worth updating
            {:else}
              Entered {balanceAgeDays === 0 ? 'today' : `${balanceAgeDays} day${balanceAgeDays === 1 ? '' : 's'} ago`}
            {/if}
          </p>
        {/if}
      </div>
      <p class="mt-2 text-xs text-faint leading-relaxed max-w-prose">
        Stays on this device. Nothing here connects to a bank.
      </p>
    </section>
    {/if}

    <!-- ---------- The strip ---------- -->
    <figure class="not-prose mt-8 m-0">
      <figcaption class="apparatus-label mb-3 border-b border-rule pb-2.5">
        {hasBalance ? 'Balance at the end of each week' : 'What moves each week'}
      </figcaption>

      <!-- The label of a full-height bar sits in this margin, so the strip
           itself stays exactly 180px and the zero line lands where the maths
           says it does. -->
      <div class="relative mt-5" style="height: 180px">
        <div class="grid h-full grid-cols-8 gap-0.5">
          {#each forecast.weeks as week, i}
            {@const value = weekValue(week)}
            {@const isTight = week.tight === true}
            {@const up = posShare(value)}
            {@const down = negShare(value)}
            <div class="flex h-full flex-col" title="{weekTitle(week)} — {money(value)}">
              <!-- above the line -->
              <div class="relative" style="height: {zeroPct}%">
                <div
                  class="absolute inset-x-0 bottom-0 mx-auto max-w-[44px] rounded-t-[4px] bg-quiet"
                  style="height: {barHeight(up)}"
                ></div>
                {#if labelled(i) && value >= 0}
                  <p
                    class="apparatus absolute inset-x-0 text-center text-[10px] leading-none text-ink tabular-nums"
                    style="bottom: calc({up}% + 5px)"
                  >{money(value)}</p>
                {/if}
              </div>
              <!-- below the line -->
              <div class="relative" style="height: {100 - zeroPct}%">
                <div
                  class="absolute inset-x-0 top-0 mx-auto max-w-[44px] rounded-b-[4px] {isTight ? 'bg-unsettled' : 'bg-quiet'}"
                  style="height: {barHeight(down)}"
                ></div>
                {#if labelled(i) && value < 0}
                  <p
                    class="apparatus absolute inset-x-0 text-center text-[10px] leading-none tabular-nums
                      {labelInside(down) ? 'text-ground' : 'text-unsettled'}"
                    style={labelInside(down) ? 'top: 5px' : `top: calc(${down}% + 5px)`}
                  >{money(value)}</p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
        <!-- Zero. Drawn once, across everything. -->
        <div
          class="pointer-events-none absolute inset-x-0 border-t border-ink"
          style="top: {zeroPct}%"
        ></div>
      </div>

      <!-- Week labels, reading like a calendar -->
      <div class="mt-2 grid grid-cols-8 gap-0.5">
        {#each forecast.weeks as week}
          <p class="apparatus text-center text-[10px] leading-tight text-faint">
            {week.label.split(' ')[0]}<br />{week.label.split(' ')[1]}
          </p>
        {/each}
      </div>

      {#if forecast.firstTightWeek}
        <p class="mt-4 flex items-center gap-2 text-xs text-unsettled">
          <span class="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-[2px] bg-unsettled"></span>
          Short — the balance goes below zero this week
        </p>
      {/if}
      {#if forecast.weeks.some((w) => w.distributionMonth)}
        <p class="mt-2 text-xs text-faint leading-relaxed max-w-prose">
          A band distribution falls in one of these months, from your calendar
          profile. The month is marked; the amount is left to you, because none is
          published.
        </p>
      {/if}
    </figure>

    {#if compact}
      <a
        href="/money/forecast"
        class="mt-6 inline-block text-sm text-ink underline decoration-rule underline-offset-2 hover:decoration-ink"
      >Open the full eight weeks</a>
    {/if}

    <!-- ---------- The weeks ---------- -->
    {#if !compact}
    <section class="mt-10">
      <h2 class="apparatus-label border-b border-rule pb-2.5">Week by week</h2>
      <ul class="m-0 list-none space-y-0 pl-0">
        {#each forecast.weeks as week}
          {@const value = weekValue(week)}
          <li class="border-b border-rule">
            <details class="group">
              <summary
                class="flex cursor-pointer items-baseline justify-between gap-3 py-3.5 marker:content-none [&::-webkit-details-marker]:hidden"
              >
                <span class="flex items-baseline gap-2 min-w-0">
                  <svg
                    class="h-3 w-3 flex-shrink-0 self-center text-faint transition-transform group-open:rotate-90"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square"
                  ><path d="M9 6l6 6-6 6" /></svg>
                  <span class="text-sm font-medium text-ink">{weekTitle(week)}</span>
                  {#if week.tight === true}
                    <span class="apparatus-label text-unsettled">short</span>
                  {/if}
                </span>
                <span class="apparatus flex-shrink-0 text-sm tabular-nums {week.tight === true ? 'text-unsettled' : 'text-ink'}">
                  {money(value)}
                </span>
              </summary>

              <div class="pb-4 pl-5">
                {#if week.events.length === 0}
                  <p class="text-sm text-faint">Nothing dated lands this week.</p>
                {:else}
                  <ul class="m-0 list-none space-y-2.5 pl-0">
                    {#each week.events as event}
                      <li class="flex items-baseline justify-between gap-3">
                        <span class="min-w-0">
                          <span class="text-sm text-ink">{event.label}</span>
                          <span class="apparatus block text-[11px] leading-snug text-faint">
                            {longLabel(fromISO(event.date))} · {event.provenance}
                          </span>
                        </span>
                        <span class="apparatus flex-shrink-0 text-sm tabular-nums text-ink">
                          {money(event.amount)}
                        </span>
                      </li>
                    {/each}
                  </ul>
                  <p class="apparatus mt-3 border-t border-rule pt-2 text-[11px] text-faint">
                    In {money(week.moneyIn)} · Out {money(week.moneyOut)}
                    {#if hasBalance}· Ends {money(week.closingBalance ?? 0)}{/if}
                  </p>
                {/if}
                {#if week.distributionMonth}
                  <p class="apparatus mt-3 text-[11px] leading-snug text-faint">
                    A band distribution falls in this month. Only the month is
                    known, so only the month is marked.
                  </p>
                {/if}
              </div>
            </details>
          </li>
        {/each}
      </ul>
    </section>
    {/if}

    <!-- ---------- The limits, stated ---------- -->
    {#if !compact && (forecast.unplaced.length > 0 || forecast.unentered.length > 0 || forecast.corrections.length > 0)}
      <section class="mt-10">
        <h2 class="apparatus-label border-b border-rule pb-2.5">What this forecast cannot see</h2>

        {#if forecast.unplaced.length > 0}
          <div class="mt-5">
            <h3 class="text-sm font-medium text-ink">Not on the strip</h3>
            <ul class="mt-2 m-0 list-none space-y-2 pl-0">
              {#each forecast.unplaced as item}
                <li class="flex items-baseline justify-between gap-3">
                  <span class="min-w-0">
                    <span class="text-sm text-ink">{item.label}</span>
                    <span class="apparatus block text-[11px] leading-snug text-faint">
                      {item.reason === 'irregular'
                        ? 'Irregular income — no dates to place it on, and a guessed date is worse than none'
                        : item.reason === 'schedule-ended'
                          ? 'We have run out of published payment dates for this one — that is our gap, not yours. It is left out of the balance rather than guessed at, so the weeks below are short by this much.'
                          : 'No date on this item, so the weeks do not know when it lands'}
                    </span>
                  </span>
                  <span class="apparatus flex-shrink-0 text-sm tabular-nums text-quiet">
                    {money(item.monthlyAmount)}/mo
                  </span>
                </li>
              {/each}
            </ul>
            {#if forecast.unplaced.some((i) => i.reason === 'no-date')}
              <a href="/money/budget-tool" class="mt-3 inline-block text-sm text-ink underline decoration-rule underline-offset-2 hover:decoration-ink">
                Add dates in your budget
              </a>
            {/if}
          </div>
        {/if}

        {#if forecast.unentered.length > 0}
          <div class="mt-6">
            <h3 class="text-sm font-medium text-ink">Paying in this window, if you receive it</h3>
            <ul class="mt-2 m-0 list-none space-y-2 pl-0">
              {#each forecast.unentered as series}
                <li>
                  <span class="text-sm text-ink">{series.label}</span>
                  <span class="apparatus block text-[11px] leading-snug text-faint">
                    Next payment {longLabel(fromISO(series.nextDate))} · {forecast.sourceLabel}.
                    The date is published; the amount is yours to enter.
                  </span>
                </li>
              {/each}
            </ul>
            <a href="/self/benefits" class="mt-3 inline-block text-sm text-ink underline decoration-rule underline-offset-2 hover:decoration-ink">
              Check what you may be entitled to
            </a>
          </div>
        {/if}

        {#if forecast.corrections.length > 0}
          <div class="mt-6">
            <h3 class="text-sm font-medium text-ink">Corrected by what you recorded</h3>
            <ul class="mt-2 m-0 list-none space-y-2 pl-0">
              {#each forecast.corrections as fix}
                <li>
                  <span class="text-sm text-ink">
                    You planned {money(fix.planned)} for {categoryLabels[fix.category] ?? fix.category};
                    you averaged {money(fix.recorded)}.
                  </span>
                  <span class="apparatus block text-[11px] leading-snug text-faint">
                    The strip uses the recorded figure, over {fix.months} complete
                    {fix.months === 1 ? 'month' : 'months'} of what you logged.
                  </span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </section>
    {/if}
  {/if}
{/if}
