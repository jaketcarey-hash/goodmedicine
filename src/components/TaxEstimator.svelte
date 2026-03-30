<script lang="ts">
  import {
    PROVINCES,
    estimateTotal,
    type TaxEstimate,
  } from '../lib/tax-estimator';
  import { fade } from 'svelte/transition';

  // ---- Input mode ----
  let inputMode = $state<'annual' | 'hourly'>('annual');
  let annualIncome = $state('');
  let hourlyRate = $state('');
  let hoursPerWeek = $state('40');
  let province = $state('BC');
  let exemptStatus = $state<'no' | 'yes' | 'partial'>('no');
  let exemptPercentage = $state('100');
  let rrspContribution = $state('');

  // ---- Derived income ----
  let income = $derived(() => {
    if (inputMode === 'annual') {
      return parseFloat(annualIncome) || 0;
    }
    const rate = parseFloat(hourlyRate) || 0;
    const hours = parseFloat(hoursPerWeek) || 0;
    return rate * hours * 52;
  });

  // ---- Derived exempt percentage ----
  let effectiveExempt = $derived(() => {
    if (exemptStatus === 'yes') return 100;
    if (exemptStatus === 'partial') return parseFloat(exemptPercentage) || 0;
    return 0;
  });

  // ---- Tax estimate ----
  let estimate = $derived<TaxEstimate>(
    estimateTotal(
      income(),
      province,
      effectiveExempt(),
      parseFloat(rrspContribution) || 0,
    ),
  );

  let isFullyExempt = $derived(exemptStatus === 'yes');
  let hasIncome = $derived(income() > 0);

  // ---- Formatting ----
  function fmt(n: number): string {
    return Math.abs(n).toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function fmtPct(n: number): string {
    return n.toFixed(1);
  }

  const provinceOptions = Object.entries(PROVINCES).map(([code, info]) => ({
    value: code,
    label: info.label,
  }));
</script>

<div class="space-y-5">
  <!-- Income input -->
  <div class="rounded-2xl bg-surface-card border border-stone-200 p-4 shadow-sm">
    <p class="text-xs font-semibold text-stone-400 tracking-widest uppercase mb-3">Income</p>

    <!-- Annual vs hourly toggle -->
    <div class="grid grid-cols-2 gap-2 mb-4">
      <button
        onclick={() => inputMode = 'annual'}
        class="py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer
          {inputMode === 'annual'
            ? 'bg-stone-900 text-white'
            : 'bg-surface-warm text-text-secondary hover:bg-stone-100'}"
      >
        Annual salary
      </button>
      <button
        onclick={() => inputMode = 'hourly'}
        class="py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer
          {inputMode === 'hourly'
            ? 'bg-stone-900 text-white'
            : 'bg-surface-warm text-text-secondary hover:bg-stone-100'}"
      >
        Hourly rate
      </button>
    </div>

    {#if inputMode === 'annual'}
      <div>
        <label for="annual-income" class="block text-xs font-medium text-text-muted mb-1">Annual income (before tax)</label>
        <input
          id="annual-income"
          type="number"
          inputmode="decimal"
          bind:value={annualIncome}
          placeholder="50000"
          min="0"
          class="w-full rounded-lg border border-stone-200 bg-surface-warm px-3 py-2.5 text-sm
            placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
            focus:outline-none transition-colors"
        />
      </div>
    {:else}
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label for="hourly-rate" class="block text-xs font-medium text-text-muted mb-1">Hourly rate</label>
          <input
            id="hourly-rate"
            type="number"
            inputmode="decimal"
            bind:value={hourlyRate}
            placeholder="25"
            min="0"
            class="w-full rounded-lg border border-stone-200 bg-surface-warm px-3 py-2.5 text-sm
              placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
              focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label for="hours-week" class="block text-xs font-medium text-text-muted mb-1">Hours/week</label>
          <input
            id="hours-week"
            type="number"
            inputmode="decimal"
            bind:value={hoursPerWeek}
            placeholder="40"
            min="0"
            class="w-full rounded-lg border border-stone-200 bg-surface-warm px-3 py-2.5 text-sm
              placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
              focus:outline-none transition-colors"
          />
        </div>
      </div>
      {#if income() > 0}
        <p class="text-xs text-text-muted mt-2">That's about ${fmt(income())}/year</p>
      {/if}
    {/if}
  </div>

  <!-- Province -->
  <div class="rounded-2xl bg-surface-card border border-stone-200 p-4 shadow-sm">
    <label for="province" class="block text-xs font-semibold text-stone-400 tracking-widest uppercase mb-3">Province or territory</label>
    <select
      id="province"
      bind:value={province}
      class="w-full rounded-lg border border-stone-200 bg-surface-warm px-3 py-2.5 text-sm
        focus:border-sage-300 focus:ring-1 focus:ring-sage-200
        focus:outline-none transition-colors cursor-pointer"
    >
      {#each provinceOptions as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </select>
  </div>

  <!-- Section 87 -->
  <div class="rounded-2xl bg-surface-card border border-stone-200 p-4 shadow-sm">
    <p class="text-xs font-semibold text-stone-400 tracking-widest uppercase mb-3">Section 87 tax exemption</p>
    <div class="grid grid-cols-3 gap-2 mb-2">
      <button
        onclick={() => exemptStatus = 'no'}
        class="py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer
          {exemptStatus === 'no'
            ? 'bg-stone-900 text-white'
            : 'bg-surface-warm text-text-secondary hover:bg-stone-100'}"
      >
        No
      </button>
      <button
        onclick={() => exemptStatus = 'yes'}
        class="py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer
          {exemptStatus === 'yes'
            ? 'bg-stone-900 text-white'
            : 'bg-surface-warm text-text-secondary hover:bg-stone-100'}"
      >
        Yes
      </button>
      <button
        onclick={() => exemptStatus = 'partial'}
        class="py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer
          {exemptStatus === 'partial'
            ? 'bg-stone-900 text-white'
            : 'bg-surface-warm text-text-secondary hover:bg-stone-100'}"
      >
        Partial
      </button>
    </div>
    {#if exemptStatus === 'partial'}
      <div class="mt-3" in:slide={{ duration: 150 }}>
        <label for="exempt-pct" class="block text-xs font-medium text-text-muted mb-1">What percentage of your income is exempt?</label>
        <input
          id="exempt-pct"
          type="number"
          inputmode="decimal"
          bind:value={exemptPercentage}
          placeholder="50"
          min="0"
          max="100"
          class="w-full rounded-lg border border-stone-200 bg-surface-warm px-3 py-2.5 text-sm
            placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
            focus:outline-none transition-colors"
        />
      </div>
    {/if}
    <p class="text-xs text-text-muted mt-2 leading-relaxed">
      Income earned on-reserve by a Status Indian may be tax-exempt under Section 87 of the Indian Act.
    </p>
  </div>

  <!-- RRSP -->
  {#if !isFullyExempt}
    <div class="rounded-2xl bg-surface-card border border-stone-200 p-4 shadow-sm">
      <label for="rrsp" class="block text-xs font-semibold text-stone-400 tracking-widest uppercase mb-3">RRSP contributions</label>
      <input
        id="rrsp"
        type="number"
        inputmode="decimal"
        bind:value={rrspContribution}
        placeholder="0"
        min="0"
        class="w-full rounded-lg border border-stone-200 bg-surface-warm px-3 py-2.5 text-sm
          placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
          focus:outline-none transition-colors"
      />
      <p class="text-xs text-text-muted mt-2">RRSP contributions reduce your taxable income.</p>
    </div>
  {/if}

  <!-- Results -->
  {#if hasIncome}
    <div in:fade={{ duration: 200 }}>
      <!-- Fully exempt result -->
      {#if isFullyExempt}
        <div class="rounded-2xl bg-sage-50 border border-sage-200 p-5 text-center">
          <p class="text-3xl font-bold text-sage-600 mb-2">$0 tax</p>
          <p class="text-sm text-sage-700 leading-relaxed mb-3">
            Your income is exempt under Section 87 of the Indian Act.
          </p>
          <div class="rounded-xl bg-surface-card border border-sage-200 p-4 text-left">
            <p class="text-xs font-semibold text-stone-400 tracking-widest uppercase mb-2">File anyway</p>
            <p class="text-sm text-text-secondary leading-relaxed mb-2">
              Even with $0 tax owing, filing a return unlocks benefits you're entitled to:
            </p>
            <ul class="text-sm text-text-secondary space-y-1.5">
              <li class="flex gap-2">
                <span class="text-sage-500 mt-0.5">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                GST/HST credit — roughly ${fmt(estimate.gstCredit)}/year
              </li>
              <li class="flex gap-2">
                <span class="text-sage-500 mt-0.5">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                Canada Child Benefit (if you have kids under 18)
              </li>
              <li class="flex gap-2">
                <span class="text-sage-500 mt-0.5">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                RRSP contribution room builds each year you file
              </li>
            </ul>
          </div>
        </div>

      <!-- Non-exempt / partial result -->
      {:else}
        <div class="rounded-2xl bg-surface-card border border-stone-200 p-5 shadow-sm">
          <p class="text-xs font-semibold text-stone-400 tracking-widest uppercase mb-4">Your estimate</p>

          <!-- Visual bar: gross to take-home -->
          <div class="space-y-2 mb-5">
            <div class="flex items-center gap-2">
              <span class="text-xs text-text-muted w-20">Gross</span>
              <div class="flex-1 h-4 bg-stone-100 rounded-full overflow-hidden">
                <div class="h-full bg-sage-400 rounded-full" style="width: 100%"></div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-text-muted w-20">Take-home</span>
              <div class="flex-1 h-4 bg-stone-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-sage-500 rounded-full transition-all duration-500"
                  style="width: {income() > 0 ? (estimate.annualTakeHome / income()) * 100 : 0}%"
                ></div>
              </div>
            </div>
          </div>

          <!-- Breakdown -->
          <div class="space-y-2 mb-5">
            <div class="flex justify-between text-sm">
              <span class="text-text-secondary">Federal tax</span>
              <span class="font-medium">${fmt(estimate.federal)}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-text-secondary">Provincial tax ({province})</span>
              <span class="font-medium">${fmt(estimate.provincial)}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-text-secondary">CPP contributions</span>
              <span class="font-medium">${fmt(estimate.cpp)}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-text-secondary">EI premiums</span>
              <span class="font-medium">${fmt(estimate.ei)}</span>
            </div>
            <div class="border-t border-stone-200 pt-2 flex justify-between text-sm font-semibold">
              <span>Total deductions</span>
              <span>${fmt(estimate.total)}</span>
            </div>
          </div>

          <!-- Take-home highlight -->
          <div class="rounded-xl p-4 bg-sage-50 text-center mb-4">
            <p class="text-xs text-text-muted mb-1">Estimated take-home</p>
            <p class="text-2xl font-bold text-sage-600">${fmt(estimate.annualTakeHome)}/year</p>
            <p class="text-lg font-semibold text-sage-500">${fmt(estimate.monthlyTakeHome)}/month</p>
          </div>

          <!-- Effective rate callout -->
          <div class="rounded-xl bg-clay-50 border border-clay-200 px-4 py-3">
            <p class="text-sm text-clay-700 leading-relaxed">
              Effective rate: {fmtPct(estimate.effectiveRate)}% — for every $100 earned, you keep ${fmt(100 - estimate.effectiveRate)}.
            </p>
          </div>

          <!-- GST credit note -->
          {#if estimate.gstCredit > 0}
            <div class="rounded-xl bg-water-50 border border-water-200 px-4 py-3 mt-3">
              <p class="text-xs font-semibold text-water-700 mb-1">What filing gets you</p>
              <p class="text-sm text-water-600 leading-relaxed">
                Filing your return may qualify you for the GST/HST credit (roughly ${fmt(estimate.gstCredit)}/year)
                and the Canada Child Benefit if you have children.
              </p>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Disclaimer -->
  <div class="rounded-xl bg-surface-warm border border-stone-200 px-4 py-3">
    <p class="text-xs text-text-muted leading-relaxed">
      These are rough estimates based on 2025 federal and provincial rates.
      Your actual taxes depend on credits, deductions, and other income not captured here.
      This is not tax advice. For your specific situation, talk to a tax professional.
    </p>
  </div>

  <!-- Privacy note -->
  <p class="text-xs text-text-muted text-center pt-2 pb-4">
    Nothing you enter here is saved or sent anywhere.
  </p>
</div>
