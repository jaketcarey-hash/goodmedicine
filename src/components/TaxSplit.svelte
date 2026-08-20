<script lang="ts">
  /**
   * Where each dollar of pay actually goes.
   *
   * Replaces two disconnected tracks — one always full, one partial — that
   * never showed where the missing part went, and painted take-home in
   * `verified` green. Green means verified on this site; it does not mean
   * good. Colour stays reserved for status here as everywhere else, so the
   * split is solid against hatched: the same vocabulary the debt curves use,
   * and the same one that survives a black-and-white print.
   *
   * The second bar is the lesson. Seeing "you would keep $X" as a number is
   * not the same as seeing the hatched part disappear.
   */
  import { estimateTotal } from '../lib/tax-estimator';
  import type { TaxEstimate } from '../lib/tax-estimator';

  interface Props {
    estimate: TaxEstimate;
    income: number;
    province: string;
    /** 0 = fully taxable, 100 = fully exempt. */
    exemptPercentage: number;
  }
  let { estimate, income, province, exemptPercentage }: Props = $props();

  let keepShare = $derived(income > 0 ? (estimate.annualTakeHome / income) * 100 : 0);

  /** The counterfactual: the same income with none of it exempt. */
  let taxable = $derived(estimateTotal(income, province, 0));
  let taxableKeepShare = $derived(income > 0 ? (taxable.annualTakeHome / income) * 100 : 0);
  let difference = $derived(estimate.annualTakeHome - taxable.annualTakeHome);
  /** Only worth drawing when there is a gap to see. */
  let showComparison = $derived(exemptPercentage > 0 && difference > 1);

  const money = (n: number) => '$' + Math.round(n).toLocaleString('en-CA');
  const uid = Math.random().toString(36).slice(2, 8);
</script>

<figure class="not-prose m-0">
  <figcaption class="apparatus-label mb-3 border-b border-rule pb-2.5">
    Where each dollar goes
  </figcaption>

  <svg width="0" height="0" aria-hidden="true" class="absolute">
    <defs>
      <pattern id="tax-hatch-{uid}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="7" class="stroke-quiet" stroke-width="2.5" />
      </pattern>
    </defs>
  </svg>

  <!-- What actually happens to your pay -->
  <div class="mb-1.5 flex items-baseline justify-between gap-3">
    <span class="text-sm font-medium text-ink">{exemptPercentage > 0 ? 'As things stand' : 'Your pay'}</span>
    <span class="apparatus text-xs text-faint tabular-nums">{money(income)} gross</span>
  </div>
  <div class="flex h-7 w-full overflow-hidden bg-rule">
    <div class="h-full bg-quiet" style="width: {keepShare}%"></div>
    <div class="h-full flex-1">
      <svg width="100%" height="100%" aria-hidden="true">
        <rect width="100%" height="100%" fill="url(#tax-hatch-{uid})" />
      </svg>
    </div>
  </div>
  <div class="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
    <span class="flex items-center gap-2 text-ink">
      <span class="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-[2px] bg-quiet"></span>
      You keep — {money(estimate.annualTakeHome)}
    </span>
    <span class="flex items-center gap-2 text-ink">
      <svg width="16" height="12" aria-hidden="true" class="flex-shrink-0">
        <rect width="16" height="12" fill="url(#tax-hatch-{uid})" />
      </svg>
      Tax, CPP and EI — {money(estimate.total)}
    </span>
  </div>

  <!-- The exemption, drawn rather than stated -->
  {#if showComparison}
    <div class="mt-6 border-t border-rule pt-5">
      <div class="mb-1.5 flex items-baseline justify-between gap-3">
        <span class="text-sm font-medium text-ink">If none of it were exempt</span>
        <span class="apparatus text-xs text-faint tabular-nums">{money(income)} gross</span>
      </div>
      <div class="flex h-7 w-full overflow-hidden bg-rule">
        <div class="h-full bg-quiet" style="width: {taxableKeepShare}%"></div>
        <div class="h-full flex-1">
          <svg width="100%" height="100%" aria-hidden="true">
            <rect width="100%" height="100%" fill="url(#tax-hatch-{uid})" />
          </svg>
        </div>
      </div>
      <p class="mt-3 max-w-prose text-sm leading-relaxed text-quiet">
        The difference between the two bars is {money(difference)} a year —
        {money(difference / 12)} a month. That is what the exemption is worth on
        this income, and it is the reason the question of where the work happens
        matters more than most people are told.
      </p>
    </div>
  {/if}

  <p class="apparatus mt-4 text-[11px] leading-snug text-faint">
    An estimate on 2026 rates, not a return. CPP and EI are shown with tax
    because they come off the same cheque, though neither is a tax.
  </p>
</figure>
