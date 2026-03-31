<script lang="ts">
  import {
    simulateSettlement,
    formatCurrency,
    formatMultiplier,
    type SimulationResult,
    type GenerationResult,
  } from '../lib/settlement-math';
  import { slide } from 'svelte/transition';

  // ---- Inputs ----

  let totalAmount = $state(50_000_000);
  let members = $state(2000);
  let distributePercent = $state(30);
  let annualReturn = $state(0.06);
  let spendingRate = $state(0.04);
  let populationGrowth = $state(0.015);
  let showAdvanced = $state(false);
  let customAmountStr = $state('');
  let customMembersStr = $state('');

  // ---- Presets ----

  const amountPresets = [10_000_000, 25_000_000, 50_000_000, 100_000_000, 250_000_000];
  const memberPresets = [500, 1000, 2500, 5000, 10000];

  // ---- Derived ----

  let result = $derived(
    simulateSettlement(totalAmount, members, distributePercent, annualReturn, spendingRate, populationGrowth)
  );

  let maxTrustBalance = $derived(
    Math.max(...result.generations.map(g => g.trustBalance), 1)
  );

  let maxAnnualDist = $derived(
    Math.max(...result.generations.map(g => g.annualDistribution), 1)
  );

  let generationLabels = $derived(
    result.generations.map(g => {
      if (g.generation === 0) return 'Today';
      return `Gen ${g.generation + 1}`;
    })
  );

  let generationSublabels = $derived(
    result.generations.map(g => {
      if (g.generation === 0) return `Year 0`;
      return `Year ${g.generation * 25}`;
    })
  );

  let insightText = $derived(buildInsight(result));

  // ---- Handlers ----

  function selectAmount(amount: number) {
    totalAmount = amount;
    customAmountStr = '';
  }

  function applyCustomAmount() {
    const parsed = parseFloat(customAmountStr.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      totalAmount = parsed * 1_000_000; // input is in millions
    }
  }

  function selectMembers(count: number) {
    members = count;
    customMembersStr = '';
  }

  function applyCustomMembers() {
    const parsed = parseInt(customMembersStr.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      members = parsed;
    }
  }

  // ---- Insight generator ----

  function buildInsight(r: SimulationResult): string[] {
    const insights: string[] = [];

    if (distributePercent === 100) {
      insights.push(
        `Every member receives ${formatCurrency(r.initialPerCap)} today. The trust is empty. Future generations receive nothing from this settlement.`
      );
      return insights;
    }

    if (distributePercent === 0) {
      insights.push(
        `Nobody receives a per-capita payment today. The full ${formatCurrency(totalAmount)} is invested for the future.`
      );
      // Find when per-member distribution exceeds what full per-cap would have been
      const fullPerCap = totalAmount / members;
      const crossoverGen = r.generations.find(g => g.perMemberAnnual > fullPerCap);
      if (crossoverGen) {
        insights.push(
          `By Generation ${crossoverGen.generation + 1} (Year ${crossoverGen.generation * 25}), annual per-member distributions exceed what the full per-capita payment would have been — and they never stop.`
        );
      }
    } else {
      insights.push(
        `Each member receives ${formatCurrency(r.initialPerCap)} today. The remaining ${formatCurrency(r.investedAmount)} goes into the trust.`
      );
    }

    if (r.depletionYear !== null) {
      const depletionGeneration = Math.ceil((r.depletionYear - 2026) / 25);
      insights.push(
        `At this rate, the trust runs out by Year ${r.depletionYear - 2026}. Generations ${depletionGeneration + 1} through 7 receive nothing.`
      );
    } else if (distributePercent < 100) {
      insights.push(
        `Over 175 years, the trust generates ${formatCurrency(r.totalDistributedOver175Years)} in total community benefit — ${formatMultiplier(r.multiplierVsPureDist)} the original settlement.`
      );
    }

    return insights;
  }

  // ---- Sustainability check ----

  function barHealthColour(gen: GenerationResult, prevGen: GenerationResult | null): string {
    if (gen.trustBalance <= 0) return 'bg-berry-400';
    if (prevGen && gen.trustBalance < prevGen.trustBalance * 0.7) return 'bg-clay-400';
    return 'bg-sage-400';
  }
</script>

<div class="space-y-6">

  <!-- ============================================================
       SETTLEMENT AMOUNT
       ============================================================ -->
  <div class="rounded-2xl bg-surface-card border border-stone-200 p-5 shadow-sm">
    <label class="block text-xs font-semibold text-text-muted tracking-wide uppercase mb-3">
      Settlement amount
    </label>
    <div class="flex flex-wrap gap-2 mb-3">
      {#each amountPresets as amount}
        <button
          onclick={() => selectAmount(amount)}
          class="px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-[var(--duration-fast)] cursor-pointer
            {totalAmount === amount && !customAmountStr
              ? 'bg-stone-900 text-white border-stone-900'
              : 'bg-surface-warm text-text-secondary border-stone-200 hover:border-stone-300 active:scale-95'}"
        >
          {formatCurrency(amount)}
        </button>
      {/each}
    </div>
    <div class="flex gap-2">
      <div class="relative flex-1">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
        <input
          type="number"
          inputmode="decimal"
          bind:value={customAmountStr}
          oninput={() => applyCustomAmount()}
          placeholder="Custom (millions)"
          class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-14 py-2.5 text-sm
            placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
            focus:outline-none transition-colors"
          aria-label="Custom settlement amount in millions"
        />
        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">million</span>
      </div>
    </div>
  </div>

  <!-- ============================================================
       COMMUNITY MEMBERS
       ============================================================ -->
  <div class="rounded-2xl bg-surface-card border border-stone-200 p-5 shadow-sm">
    <label class="block text-xs font-semibold text-text-muted tracking-wide uppercase mb-3">
      Community members
    </label>
    <div class="flex flex-wrap gap-2 mb-3">
      {#each memberPresets as count}
        <button
          onclick={() => selectMembers(count)}
          class="px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-[var(--duration-fast)] cursor-pointer
            {members === count && !customMembersStr
              ? 'bg-stone-900 text-white border-stone-900'
              : 'bg-surface-warm text-text-secondary border-stone-200 hover:border-stone-300 active:scale-95'}"
        >
          {count.toLocaleString('en-CA')}
        </button>
      {/each}
    </div>
    <input
      type="number"
      inputmode="numeric"
      bind:value={customMembersStr}
      oninput={() => applyCustomMembers()}
      placeholder="Custom member count"
      class="w-full rounded-lg border border-stone-200 bg-surface-warm px-3 py-2.5 text-sm
        placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
        focus:outline-none transition-colors"
      aria-label="Custom community member count"
    />
  </div>

  <!-- ============================================================
       THE BIG SLIDER
       ============================================================ -->
  <div class="rounded-2xl bg-surface-card border border-stone-200 p-5 shadow-sm">
    <label class="block text-sm font-semibold mb-1">
      How much to distribute now?
    </label>
    <p class="text-xs text-text-muted mb-4">
      Drag to decide the split between immediate per-capita distribution and long-term trust investment.
    </p>

    <div class="relative mb-2">
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        bind:value={distributePercent}
        class="settlement-slider w-full h-3 rounded-full appearance-none cursor-pointer"
        style="background: linear-gradient(to right, var(--color-sage-400) {100 - distributePercent}%, var(--color-clay-400) {100 - distributePercent}%);"
        aria-label="Percentage to distribute now"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={distributePercent}
      />
      <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-xs font-bold px-2.5 py-1 rounded-lg pointer-events-none">
        {distributePercent}%
      </div>
    </div>

    <div class="flex items-center justify-between text-xs">
      <span class="text-sage-600 font-medium">Invest for the future</span>
      <span class="text-clay-600 font-medium">Distribute now</span>
    </div>
  </div>

  <!-- ============================================================
       IMMEDIATE IMPACT CARDS
       ============================================================ -->
  <div class="grid grid-cols-2 gap-3">
    <!-- Distributed today -->
    <div class="rounded-2xl border border-clay-200 bg-gradient-to-br from-clay-50 to-clay-100/50 p-4 transition-all duration-[var(--duration-slow)]">
      <p class="text-xs font-semibold text-clay-600 uppercase tracking-wide mb-1">Distributed today</p>
      <p class="text-xl font-bold text-clay-700 leading-tight transition-all duration-[var(--duration-slow)]">
        {formatCurrency(result.distributedAmount)}
      </p>
      <p class="text-xs text-clay-500 mt-1">
        {formatCurrency(result.initialPerCap)} per member
      </p>
    </div>

    <!-- Invested in trust -->
    <div class="rounded-2xl border border-sage-200 bg-gradient-to-br from-sage-50 to-sage-100/50 p-4 transition-all duration-[var(--duration-slow)]">
      <p class="text-xs font-semibold text-sage-600 uppercase tracking-wide mb-1">Invested in trust</p>
      <p class="text-xl font-bold text-sage-700 leading-tight transition-all duration-[var(--duration-slow)]">
        {formatCurrency(result.investedAmount)}
      </p>
      <p class="text-xs text-sage-500 mt-1">
        For 7 generations
      </p>
    </div>
  </div>

  <!-- ============================================================
       MULTIPLIER STAT
       ============================================================ -->
  {#if distributePercent < 100}
    <div class="rounded-2xl border-2 p-5 text-center transition-all duration-[var(--duration-slow)]
      {result.multiplierVsPureDist >= 3 ? 'border-sage-300 bg-sage-50/50' : 'border-stone-200 bg-surface-warm'}">
      <p class="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
        Total community benefit over 7 generations
      </p>
      <p class="text-3xl font-bold leading-tight transition-all duration-[var(--duration-slow)]
        {result.multiplierVsPureDist >= 3 ? 'text-sage-700' : 'text-stone-700'}">
        {formatCurrency(result.totalDistributedOver175Years)}
      </p>
      <p class="text-lg font-semibold mt-1 transition-all duration-[var(--duration-slow)]
        {result.multiplierVsPureDist >= 3 ? 'text-sage-600' : 'text-stone-500'}">
        {formatMultiplier(result.multiplierVsPureDist)} the original settlement
      </p>
    </div>
  {/if}

  <!-- ============================================================
       TIMELINE VISUALIZATION
       ============================================================ -->
  <div class="rounded-2xl bg-surface-card border border-stone-200 p-5 shadow-sm">
    <h3 class="text-sm font-semibold mb-4">Seven generation projection</h3>

    <div class="space-y-4">
      {#each result.generations as gen, i}
        {@const prevGen = i > 0 ? result.generations[i - 1] : null}
        {@const trustBarWidth = maxTrustBalance > 0 ? (gen.trustBalance / maxTrustBalance) * 100 : 0}
        {@const distBarWidth = maxAnnualDist > 0 ? (gen.annualDistribution / maxAnnualDist) * 100 : 0}
        {@const healthColour = barHealthColour(gen, prevGen)}

        <div class="relative pl-8">
          <!-- Timeline dot + line -->
          <div class="absolute left-0 top-0 bottom-0 flex flex-col items-center">
            <div class="w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors duration-[var(--duration-slow)]
              {gen.trustBalance > 0 ? 'border-sage-400 bg-sage-100' : 'border-berry-300 bg-berry-50'}">
            </div>
            {#if i < result.generations.length - 1}
              <div class="w-0.5 flex-1 transition-colors duration-[var(--duration-slow)]
                {gen.trustBalance > 0 ? 'bg-sage-200' : 'bg-berry-200'}">
              </div>
            {/if}
          </div>

          <!-- Generation content -->
          <div class="pb-1">
            <div class="flex items-baseline gap-2 mb-2">
              <span class="text-sm font-semibold">{generationLabels[i]}</span>
              <span class="text-xs text-text-muted">{generationSublabels[i]}</span>
              {#if gen.generation > 0}
                <span class="text-xs text-text-muted ml-auto">{gen.members.toLocaleString('en-CA')} members</span>
              {/if}
            </div>

            {#if gen.generation === 0}
              <!-- Today: show the initial distribution -->
              <div class="text-xs text-text-secondary space-y-1">
                {#if result.distributedAmount > 0}
                  <p>Per-capita distribution: <span class="font-semibold">{formatCurrency(result.initialPerCap)}</span> per member</p>
                {/if}
                <p>Trust starting balance: <span class="font-semibold text-sage-600">{formatCurrency(result.investedAmount)}</span></p>
              </div>
            {:else}
              <!-- Future generations: bars + numbers -->
              <div class="space-y-2">
                <!-- Trust balance bar -->
                <div>
                  <div class="flex items-center justify-between text-xs mb-0.5">
                    <span class="text-text-muted">Trust balance</span>
                    <span class="font-semibold {gen.trustBalance > 0 ? 'text-sage-600' : 'text-berry-500'}">
                      {formatCurrency(gen.trustBalance)}
                    </span>
                  </div>
                  <div class="h-3.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-700 ease-[var(--ease-out)] {healthColour}"
                      style="width: {trustBarWidth}%"
                    ></div>
                  </div>
                </div>

                <!-- Annual per-member distribution -->
                <div>
                  <div class="flex items-center justify-between text-xs mb-0.5">
                    <span class="text-text-muted">Annual per member</span>
                    <span class="font-semibold text-water-600">{formatCurrency(gen.perMemberAnnual)}</span>
                  </div>
                  <div class="h-3.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full bg-water-400 transition-all duration-700 ease-[var(--ease-out)]"
                      style="width: {distBarWidth}%"
                    ></div>
                  </div>
                </div>

                <!-- Cumulative -->
                <p class="text-xs text-text-muted">
                  Cumulative distributed: <span class="font-medium">{formatCurrency(gen.cumulativeDistributed)}</span>
                </p>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Depletion warning -->
    {#if result.depletionYear}
      <div class="mt-4 rounded-xl bg-berry-50 border border-berry-200 p-3">
        <p class="text-xs font-semibold text-berry-600">
          Trust depleted by Year {result.depletionYear - 2026}
        </p>
        <p class="text-xs text-berry-500 mt-0.5">
          The spending rate exceeds growth. Future generations lose access to trust income.
        </p>
      </div>
    {/if}
  </div>

  <!-- ============================================================
       DYNAMIC INSIGHTS
       ============================================================ -->
  <div class="rounded-2xl bg-gradient-to-br from-stone-50 to-sage-50/30 border border-stone-200 p-5">
    <h3 class="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">What the numbers say</h3>
    <div class="space-y-2">
      {#each insightText as line}
        <p class="text-sm text-text-secondary leading-relaxed">{line}</p>
      {/each}
    </div>
  </div>

  <!-- ============================================================
       ADVANCED SETTINGS
       ============================================================ -->
  <div class="rounded-2xl bg-surface-card border border-stone-200 overflow-hidden shadow-sm">
    <button
      onclick={() => showAdvanced = !showAdvanced}
      class="w-full flex items-center justify-between p-4 text-sm font-semibold text-text-secondary
        hover:bg-stone-50 transition-colors cursor-pointer"
    >
      <span>Advanced assumptions</span>
      <svg
        class="w-4 h-4 text-text-muted transition-transform duration-[var(--duration-normal)]"
        class:rotate-180={showAdvanced}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>

    {#if showAdvanced}
      <div class="px-5 pb-5 space-y-5 border-t border-stone-100" transition:slide={{ duration: 200 }}>
        <!-- Annual return -->
        <div class="pt-4">
          <div class="flex items-center justify-between mb-1">
            <label for="annual-return" class="text-xs font-semibold text-text-muted">Annual return</label>
            <span class="text-sm font-bold text-sage-600">{(annualReturn * 100).toFixed(1)}%</span>
          </div>
          <input
            id="annual-return"
            type="range"
            min="0.04"
            max="0.08"
            step="0.005"
            bind:value={annualReturn}
            class="settings-slider w-full h-2 rounded-full appearance-none cursor-pointer bg-stone-200"
            aria-label="Annual return assumption"
          />
          <p class="text-xs text-text-muted mt-1">
            Long-term average for a diversified institutional portfolio. Most endowments target 6-7%.
          </p>
        </div>

        <!-- Spending rate -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label for="spending-rate" class="text-xs font-semibold text-text-muted">Spending rate</label>
            <span class="text-sm font-bold text-water-600">{(spendingRate * 100).toFixed(1)}%</span>
          </div>
          <input
            id="spending-rate"
            type="range"
            min="0.02"
            max="0.06"
            step="0.005"
            bind:value={spendingRate}
            class="settings-slider w-full h-2 rounded-full appearance-none cursor-pointer bg-stone-200"
            aria-label="Annual spending rate"
          />
          <p class="text-xs text-text-muted mt-1">
            The percentage of the trust distributed each year. Lower is more sustainable. Most endowments use 3-5%.
          </p>
        </div>

        <!-- Population growth -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label for="pop-growth" class="text-xs font-semibold text-text-muted">Population growth</label>
            <span class="text-sm font-bold text-clay-600">{(populationGrowth * 100).toFixed(1)}%</span>
          </div>
          <input
            id="pop-growth"
            type="range"
            min="0"
            max="0.03"
            step="0.005"
            bind:value={populationGrowth}
            class="settings-slider w-full h-2 rounded-full appearance-none cursor-pointer bg-stone-200"
            aria-label="Annual population growth rate"
          />
          <p class="text-xs text-text-muted mt-1">
            First Nations communities in Canada average 1-2% annual population growth. Higher growth means more members sharing each distribution.
          </p>
        </div>
      </div>
    {/if}
  </div>

  <!-- ============================================================
       EDUCATIONAL FOOTER
       ============================================================ -->
  <div class="space-y-4 px-1">
    <div class="rounded-2xl bg-surface-warm border border-stone-200 p-5">
      <h3 class="text-sm font-semibold mb-2">What does this mean?</h3>
      <div class="space-y-2 text-sm text-text-secondary leading-relaxed">
        <p>
          The endowment model — investing the principal and spending only a portion of returns each year — is
          how the world's most successful institutions preserve wealth across generations. Norway's sovereign
          wealth fund, the Canada Pension Plan, and every major university endowment use this approach.
        </p>
        <p>
          The spending rate is the key variable. At 4%, a well-invested fund can sustain payouts indefinitely
          while the principal continues to grow. The trade-off is real: a lower spending rate means less money
          today but more money for every generation that follows.
        </p>
        <p>
          Indigenous communities have practised long-term economic thinking for millennia. This tool translates
          that wisdom into modern financial terms — so communities can see the full picture when making
          decisions about settlement funds.
        </p>
      </div>
    </div>

    <!-- Navigation links -->
    <div class="flex flex-col gap-2">
      <a
        href="/money/seven-generations"
        class="flex items-center gap-3 rounded-xl bg-sage-50 border border-sage-200 hover:border-sage-300 p-4
          transition-all duration-[var(--duration-normal)] active:scale-[0.98]"
      >
        <div class="w-8 h-8 rounded-lg bg-sage-500 flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-semibold">Seven Generations</p>
          <p class="text-xs text-text-muted">The philosophy behind long-term community wealth</p>
        </div>
      </a>

      <a
        href="/rights/band-finances"
        class="flex items-center gap-3 rounded-xl bg-water-50 border border-water-200 hover:border-water-300 p-4
          transition-all duration-[var(--duration-normal)] active:scale-[0.98]"
      >
        <div class="w-8 h-8 rounded-lg bg-water-500 flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-semibold">Band Finances</p>
          <p class="text-xs text-text-muted">Understanding how your nation's money works</p>
        </div>
      </a>
    </div>

    <!-- Disclaimer -->
    <p class="text-xs text-text-muted text-center px-4 pb-4 leading-relaxed">
      This is a simplified model for educational purposes. Actual investment returns, management costs,
      inflation, tax implications, and governance structures vary significantly. This tool does not
      constitute financial advice. Your data stays on this device.
    </p>
  </div>
</div>

<style>
  /* ---- THE BIG SLIDER ---- */
  .settlement-slider {
    -webkit-appearance: none;
    appearance: none;
    outline: none;
    border-radius: 9999px;
  }

  .settlement-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: white;
    border: 3px solid var(--color-stone-800);
    box-shadow: 0 2px 8px rgba(35, 30, 23, 0.2);
    cursor: pointer;
    transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1),
                box-shadow 0.15s ease;
  }

  .settlement-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 3px 12px rgba(35, 30, 23, 0.25);
  }

  .settlement-slider::-webkit-slider-thumb:active {
    transform: scale(1.1);
  }

  .settlement-slider::-moz-range-thumb {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: white;
    border: 3px solid var(--color-stone-800);
    box-shadow: 0 2px 8px rgba(35, 30, 23, 0.2);
    cursor: pointer;
  }

  .settlement-slider::-moz-range-track {
    height: 12px;
    border-radius: 9999px;
    background: transparent;
  }

  /* ---- SETTINGS SLIDERS ---- */
  .settings-slider {
    -webkit-appearance: none;
    appearance: none;
    outline: none;
    border-radius: 9999px;
  }

  .settings-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    border: 2px solid var(--color-stone-600);
    box-shadow: 0 1px 4px rgba(35, 30, 23, 0.15);
    cursor: pointer;
    transition: transform 0.15s ease;
  }

  .settings-slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }

  .settings-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    border: 2px solid var(--color-stone-600);
    box-shadow: 0 1px 4px rgba(35, 30, 23, 0.15);
    cursor: pointer;
  }

  .settings-slider::-moz-range-track {
    height: 8px;
    border-radius: 9999px;
    background: var(--color-stone-200);
  }
</style>
