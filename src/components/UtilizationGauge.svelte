<script lang="ts">
  /**
   * How much of your credit you are using, against the guideline.
   *
   * Deliberately not a score. The article already says, correctly, that
   * scoring formulas are not published and differ by bureau and lender — so
   * this shows the one input a person actually controls and can compute
   * exactly, and stops there. FCAC's own framing is a tip ("try to use less
   * than 30%"), and the wording here keeps it a target to aim at rather than
   * a line that flips something.
   *
   * Nothing is stored. A card balance is not a thing to leave on a device
   * for a tool that only teaches a ratio, and there is no second visit this
   * needs to remember.
   */
  interface Props {
    /** The guideline, from the figure registry — never typed here. */
    guideline: number;
    guidelineSource: string;
  }
  let { guideline, guidelineSource }: Props = $props();

  // `bind:value` on a number input yields a number (or null when empty), not
  // a string — so these are typed loosely and normalised, never string-method'd.
  let limit = $state<number | string | null>('');
  let balance = $state<number | string | null>('');

  const num = (v: number | string | null): number =>
    typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  const entered = (v: number | string | null): boolean =>
    v !== null && v !== undefined && String(v) !== '';

  let limitNum = $derived(num(limit) || 0);
  let balanceNum = $derived(num(balance) || 0);
  let ready = $derived(limitNum > 0 && entered(balance) && Number.isFinite(balanceNum));
  let rate = $derived(ready ? (balanceNum / limitNum) * 100 : 0);
  /** Over the limit is possible and worth drawing honestly. */
  let capped = $derived(Math.min(rate, 100));
  let over = $derived(rate > 100);
  let within = $derived(rate <= guideline);

  /** What would have to come off to reach the guideline. */
  let toGuideline = $derived(Math.max(0, balanceNum - limitNum * (guideline / 100)));

  const money = (n: number) => '$' + Math.round(n).toLocaleString('en-CA');
</script>

<div class="rounded-sm border border-rule bg-white p-5">
  <p class="apparatus-label mb-3">Your utilization</p>

  <div class="flex flex-wrap gap-3">
    <label class="min-w-0 flex-1">
      <span class="mb-1 block text-xs font-medium text-text-muted">Card limit</span>
      <input
        bind:value={limit} type="number" inputmode="decimal" placeholder="1,000" min="0"
        class="w-full rounded-sm border border-rule bg-ground px-3 py-2.5 text-sm tabular-nums focus:border-ink focus:outline-none"
      />
    </label>
    <label class="min-w-0 flex-1">
      <span class="mb-1 block text-xs font-medium text-text-muted">Balance on it</span>
      <input
        bind:value={balance} type="number" inputmode="decimal" placeholder="450" min="0"
        class="w-full rounded-sm border border-rule bg-ground px-3 py-2.5 text-sm tabular-nums focus:border-ink focus:outline-none"
      />
    </label>
  </div>

  {#if ready}
    <!-- The track is the limit. The guideline is a marked position on it,
         not a colour change — a ratio two points over is not a different
         kind of thing from one two points under. -->
    <div class="relative mt-5">
      <div class="relative h-7 w-full overflow-hidden bg-rule">
        <div
          class="h-full {within ? 'bg-quiet' : 'bg-unsettled'}"
          style="width: {capped}%"
        ></div>
      </div>
      <!-- guideline marker, drawn over the track -->
      <div
        class="pointer-events-none absolute inset-y-0 border-l border-dashed border-ink"
        style="left: {guideline}%"
      ></div>
      <p
        class="apparatus absolute mt-1 -translate-x-1/2 whitespace-nowrap text-[10px] leading-none text-faint"
        style="left: {guideline}%; top: 100%"
      >{guideline}% guideline</p>
    </div>

    <p class="mt-8 text-sm leading-relaxed text-quiet">
      You are using
      <span class="apparatus font-medium text-ink tabular-nums">{rate.toFixed(0)}%</span>
      of this card's limit.
      {#if over}
        That is over the limit, which usually costs a fee on top of everything else.
      {:else if within}
        That is inside the {guideline}% {guidelineSource} suggests aiming for.
      {:else}
        Bringing the balance down by {money(toGuideline)} would put you at {guideline}%.
      {/if}
    </p>

    <p class="apparatus mt-2 text-[11px] leading-snug text-faint">
      Utilization is recalculated from the balance your statement reports, so
      paying before the statement date is what changes the number the bureau
      sees. Nothing here is stored or sent anywhere.
    </p>
  {:else}
    <p class="mt-4 text-sm leading-relaxed text-quiet">
      Put in one card's limit and what is on it. The bar shows where you sit
      against the {guideline}% {guidelineSource} suggests aiming for.
    </p>
  {/if}
</div>
