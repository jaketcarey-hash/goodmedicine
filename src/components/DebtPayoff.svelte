<script lang="ts">
  import {
    type Debt,
    type DebtPlan,
    type PayoffMonth,
    savePlan,
    getPlan,
    createDebt,
    calculatePayoff,
    calculateTotalInterest,
    getPayoffDate,
  } from '../lib/debt-store';
  import { fly, fade, slide } from 'svelte/transition';

  // ---- State ----
  let plan = $state<DebtPlan>({ debts: [], extraMonthly: 0, strategy: 'avalanche' });
  let showAddForm = $state(false);

  // ---- Form fields ----
  let newName = $state('');
  let newBalance = $state('');
  let newRate = $state('');
  let newMinimum = $state('');

  // ---- Init ----
  $effect(() => {
    plan = getPlan();
  });

  // ---- Auto-save ----
  let initialized = $state(false);
  $effect(() => {
    const _ = JSON.stringify(plan);
    if (!initialized) {
      initialized = true;
      return;
    }
    savePlan(plan);
  });

  // ---- Derived calculations ----
  let timeline = $derived(calculatePayoff(plan));
  let totalInterest = $derived(calculateTotalInterest(timeline));
  let payoffDate = $derived(getPayoffDate(timeline));
  let totalMonths = $derived(timeline.length);

  // Compare strategies
  let altStrategy = $derived<'avalanche' | 'snowball'>(
    plan.strategy === 'avalanche' ? 'snowball' : 'avalanche',
  );
  let altTimeline = $derived(
    calculatePayoff({ ...plan, strategy: altStrategy }),
  );
  let altTotalInterest = $derived(calculateTotalInterest(altTimeline));
  let interestSavings = $derived(Math.abs(totalInterest - altTotalInterest));
  let monthsSavings = $derived(Math.abs(timeline.length - altTimeline.length));

  // Extra payment comparison
  let baselineTimeline = $derived(
    plan.extraMonthly > 0
      ? calculatePayoff({ ...plan, extraMonthly: 0 })
      : null,
  );
  let baselineInterest = $derived(
    baselineTimeline ? calculateTotalInterest(baselineTimeline) : 0,
  );
  let baselineMonths = $derived(baselineTimeline ? baselineTimeline.length : 0);
  let extraSavings = $derived(
    baselineTimeline ? baselineInterest - totalInterest : 0,
  );
  let extraMonthsSaved = $derived(
    baselineTimeline ? baselineMonths - totalMonths : 0,
  );

  // High interest warning
  let hasHighInterest = $derived(plan.debts.some((d) => d.interestRate > 20));

  // Total owed
  let totalOwed = $derived(plan.debts.reduce((s, d) => s + d.balance, 0));

  // ---- Handlers ----
  function addDebt() {
    const balance = parseFloat(newBalance);
    const rate = parseFloat(newRate);
    const minimum = parseFloat(newMinimum);
    if (!newName.trim() || isNaN(balance) || balance <= 0) return;
    if (isNaN(rate) || rate < 0) return;
    if (isNaN(minimum) || minimum <= 0) return;

    const debt = createDebt(newName.trim(), balance, rate, minimum);
    plan.debts = [...plan.debts, debt];
    newName = '';
    newBalance = '';
    newRate = '';
    newMinimum = '';
    showAddForm = false;
  }

  let confirmingDeleteId = $state<string | null>(null);
  let confirmingDeleteTimer = $state<ReturnType<typeof setTimeout> | null>(null);

  function removeDebt(id: string) {
    if (confirmingDeleteId === id) {
      // Second tap — actually delete
      if (confirmingDeleteTimer) clearTimeout(confirmingDeleteTimer);
      confirmingDeleteId = null;
      confirmingDeleteTimer = null;
      plan.debts = plan.debts.filter((d) => d.id !== id);
    } else {
      // First tap — enter confirming state
      if (confirmingDeleteTimer) clearTimeout(confirmingDeleteTimer);
      confirmingDeleteId = id;
      confirmingDeleteTimer = setTimeout(() => {
        confirmingDeleteId = null;
        confirmingDeleteTimer = null;
      }, 3000);
    }
  }

  function setStrategy(s: 'avalanche' | 'snowball') {
    plan.strategy = s;
  }

  function setExtra(e: Event) {
    const target = e.target as HTMLInputElement;
    plan.extraMonthly = parseFloat(target.value) || 0;
  }

  // ---- Formatting ----
  function fmt(n: number): string {
    return Math.abs(n).toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function formatDate(d: Date): string {
    return d.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
  }

  function monthsToYearsMonths(m: number): string {
    if (m <= 0) return '0 months';
    const years = Math.floor(m / 12);
    const months = m % 12;
    const parts: string[] = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
    return parts.join(', ');
  }
</script>

<div class="space-y-5">
  <!-- Summary banner -->
  {#if plan.debts.length > 0 && timeline.length > 0}
    <div class="rounded-2xl bg-gradient-to-br from-sage-50 to-water-50 p-5 text-center">
      <p class="text-xs text-text-muted mb-1">Debt-free by</p>
      {#if payoffDate}
        <p class="text-2xl font-bold text-sage-600">{formatDate(payoffDate)}</p>
      {/if}
      <p class="text-sm text-text-muted mt-1">{monthsToYearsMonths(totalMonths)} to go</p>
      <div class="flex justify-center gap-4 mt-3 text-xs text-text-muted">
        <span>Total owed: ${fmt(totalOwed)}</span>
        <span>Interest: ${fmt(totalInterest)}</span>
      </div>
    </div>
  {:else if plan.debts.length > 0}
    <div class="rounded-2xl bg-gradient-to-br from-sage-50 to-water-50 p-5 text-center">
      <p class="text-xs text-text-muted mb-1">Total owed</p>
      <p class="text-2xl font-bold text-stone-700">${fmt(totalOwed)}</p>
      <p class="text-sm text-text-muted mt-1">Add minimum payments to see your payoff timeline</p>
    </div>
  {/if}

  <!-- High interest warning -->
  {#if hasHighInterest}
    <div class="rounded-xl bg-clay-50 border border-clay-200 px-4 py-3" in:fade={{ duration: 200 }}>
      <p class="text-sm font-medium text-clay-700 mb-1">High-interest debt detected</p>
      <p class="text-sm text-clay-600 leading-relaxed">
        Some of your debts have interest rates above 20%. If any of these are payday loans,
        there may be lower-cost alternatives available — credit unions, community lending
        programs, or band-administered emergency funds.
      </p>
    </div>
  {/if}

  <!-- Strategy toggle -->
  {#if plan.debts.length > 0}
    <div class="rounded-2xl bg-surface-card border border-stone-200 p-4 shadow-sm">
      <p class="text-xs font-semibold text-stone-400 tracking-widest uppercase mb-3">Strategy</p>
      <div class="grid grid-cols-2 gap-2 mb-3">
        <button
          onclick={() => setStrategy('avalanche')}
          class="py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer
            {plan.strategy === 'avalanche'
              ? 'bg-stone-900 text-white'
              : 'bg-surface-warm text-text-secondary hover:bg-stone-100'}"
        >
          Avalanche
        </button>
        <button
          onclick={() => setStrategy('snowball')}
          class="py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer
            {plan.strategy === 'snowball'
              ? 'bg-stone-900 text-white'
              : 'bg-surface-warm text-text-secondary hover:bg-stone-100'}"
        >
          Snowball
        </button>
      </div>
      <p class="text-xs text-text-muted leading-relaxed">
        {#if plan.strategy === 'avalanche'}
          Pay off the highest interest rate first. Saves the most money over time.
        {:else}
          Pay off the smallest balance first. Builds momentum with quick wins.
        {/if}
      </p>

      <!-- Strategy comparison -->
      {#if plan.debts.length >= 2 && interestSavings > 5}
        <div class="mt-3 pt-3 border-t border-stone-100">
          <p class="text-xs text-text-muted leading-relaxed">
            {#if totalInterest < altTotalInterest}
              {plan.strategy === 'avalanche' ? 'Avalanche' : 'Snowball'} saves you ${fmt(interestSavings)} in interest
              {#if monthsSavings > 0}
                and gets you debt-free {monthsSavings} {monthsSavings === 1 ? 'month' : 'months'} sooner
              {/if}
              compared to the other strategy.
            {:else if totalInterest > altTotalInterest}
              Switching to {altStrategy} would save you ${fmt(interestSavings)} in interest.
              {#if monthsSavings > 0}
                You'd also be debt-free {monthsSavings} {monthsSavings === 1 ? 'month' : 'months'} sooner.
              {/if}
              But if quick wins keep you motivated, that has value too.
            {:else}
              Both strategies cost about the same for your debts.
            {/if}
          </p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Extra monthly payment -->
  {#if plan.debts.length > 0}
    <div class="rounded-2xl bg-surface-card border border-stone-200 p-4 shadow-sm">
      <label for="extra-payment" class="block text-xs font-semibold text-stone-400 tracking-widest uppercase mb-3">
        Extra monthly payment
      </label>
      <div class="flex items-center gap-3 mb-2">
        <span class="text-sm text-text-muted">$0</span>
        <input
          id="extra-payment"
          type="range"
          min="0"
          max="500"
          step="10"
          value={plan.extraMonthly}
          oninput={setExtra}
          class="flex-1 h-2 appearance-none bg-stone-200 rounded-full cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stone-900
            [&::-webkit-slider-thumb]:cursor-pointer"
          aria-label="Extra monthly payment amount"
        />
        <span class="text-sm text-text-muted">$500</span>
      </div>
      <p class="text-center text-lg font-bold text-stone-900">${fmt(plan.extraMonthly)}/mo extra</p>

      {#if plan.extraMonthly > 0 && extraSavings > 0}
        <div class="mt-3 pt-3 border-t border-stone-100">
          <p class="text-sm text-sage-600 leading-relaxed text-center">
            Paying an extra ${fmt(plan.extraMonthly)}/month saves you ${fmt(extraSavings)} in interest
            {#if extraMonthsSaved > 0}
              and gets you debt-free {extraMonthsSaved} {extraMonthsSaved === 1 ? 'month' : 'months'} sooner
            {/if}.
          </p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Debt list -->
  <section>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-xs font-semibold text-stone-400 tracking-widest uppercase">Your debts</h3>
      {#if plan.debts.length > 0}
        <p class="text-sm font-medium text-stone-600">{plan.debts.length} {plan.debts.length === 1 ? 'debt' : 'debts'}</p>
      {/if}
    </div>

    {#if plan.debts.length > 0}
      <div class="space-y-2 mb-3">
        {#each plan.debts as debt (debt.id)}
          {@const paidSoFar = timeline.length > 0
            ? debt.balance - (timeline[timeline.length - 1].balances[debt.id] ?? 0)
            : 0}
          {@const pct = debt.balance > 0 ? Math.min(Math.round((paidSoFar / debt.balance) * 100), 100) : 0}
          {@const paidOffMonth = timeline.findIndex((m) => m.debtsPaidOff.includes(debt.id))}

          <div
            class="rounded-xl bg-surface-card border border-stone-200 overflow-hidden shadow-sm"
            in:fly={{ y: 10, duration: 200 }}
          >
            <div class="px-4 py-3">
              <div class="flex items-start justify-between mb-1">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">{debt.name}</p>
                  <p class="text-xs text-text-muted">
                    {debt.interestRate}% interest · ${fmt(debt.minimumPayment)}/mo minimum
                  </p>
                </div>
                <div class="text-right ml-3">
                  <p class="text-sm font-semibold text-stone-700">${fmt(debt.balance)}</p>
                  {#if paidOffMonth >= 0}
                    <p class="text-xs text-sage-600">Paid off in {monthsToYearsMonths(paidOffMonth + 1)}</p>
                  {/if}
                </div>
              </div>

              <!-- Progress bar -->
              {#if timeline.length > 0}
                <div class="h-2.5 bg-stone-100 rounded-full overflow-hidden mt-2">
                  <div
                    class="h-full bg-sage-400 rounded-full transition-all duration-700"
                    style="width: {pct}%"
                  ></div>
                </div>
              {/if}
            </div>

            <div class="px-4 pb-3 flex justify-end">
              {#if confirmingDeleteId === debt.id}
                <button
                  onclick={() => removeDebt(debt.id)}
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-berry-500 text-white
                    active:scale-95 transition-all cursor-pointer"
                  aria-label="Confirm remove {debt.name}"
                >
                  Tap again to delete
                </button>
              {:else}
                <button
                  onclick={() => removeDebt(debt.id)}
                  class="p-1.5 rounded-lg text-stone-400 hover:text-berry-500 hover:bg-berry-50 transition-colors cursor-pointer"
                  aria-label="Remove {debt.name}"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Add debt form -->
    {#if showAddForm}
      <div class="rounded-xl bg-surface-warm border border-stone-200 p-4 space-y-3" in:slide={{ duration: 200 }}>
        <h4 class="font-semibold text-sm">Add a debt</h4>
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label for="debt-name" class="block text-xs font-medium text-text-muted mb-1">What is it?</label>
            <input
              id="debt-name"
              type="text"
              bind:value={newName}
              placeholder="e.g. Visa, student loan"
              class="w-full rounded-lg border border-stone-200 bg-surface-card px-3 py-2.5 text-sm
                placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
                focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label for="debt-balance" class="block text-xs font-medium text-text-muted mb-1">Balance</label>
            <input
              id="debt-balance"
              type="number"
              inputmode="decimal"
              bind:value={newBalance}
              placeholder="0"
              min="0"
              class="w-full rounded-lg border border-stone-200 bg-surface-card px-3 py-2.5 text-sm
                placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
                focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label for="debt-rate" class="block text-xs font-medium text-text-muted mb-1">Interest rate (%)</label>
            <input
              id="debt-rate"
              type="number"
              inputmode="decimal"
              bind:value={newRate}
              placeholder="19.99"
              min="0"
              step="0.01"
              class="w-full rounded-lg border border-stone-200 bg-surface-card px-3 py-2.5 text-sm
                placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
                focus:outline-none transition-colors"
            />
          </div>
          <div class="col-span-2">
            <label for="debt-minimum" class="block text-xs font-medium text-text-muted mb-1">Minimum payment</label>
            <input
              id="debt-minimum"
              type="number"
              inputmode="decimal"
              bind:value={newMinimum}
              placeholder="0"
              min="0"
              class="w-full rounded-lg border border-stone-200 bg-surface-card px-3 py-2.5 text-sm
                placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
                focus:outline-none transition-colors"
            />
          </div>
        </div>
        <div class="flex gap-2">
          <button
            onclick={addDebt}
            class="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-stone-900 text-white
              hover:bg-stone-800 active:scale-95 transition-all cursor-pointer"
          >
            Add debt
          </button>
          <button
            onclick={() => { showAddForm = false; newName = ''; newBalance = ''; newRate = ''; newMinimum = ''; }}
            class="px-4 py-2.5 rounded-xl text-sm text-text-muted hover:text-text-secondary
              transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    {:else}
      <button
        onclick={() => showAddForm = true}
        class="w-full py-2.5 rounded-xl border-2 border-dashed border-stone-200 text-sm
          font-medium text-text-muted hover:border-sage-300 hover:text-sage-600
          transition-colors cursor-pointer"
      >
        + Add debt
      </button>
    {/if}
  </section>

  <!-- Empty state -->
  {#if plan.debts.length === 0}
    <div class="rounded-2xl bg-surface-card border border-stone-200 p-8 text-center">
      <div class="w-14 h-14 rounded-full bg-sage-50 flex items-center justify-center mx-auto mb-4">
        <svg class="w-7 h-7 text-sage-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      </div>
      <p class="text-lg font-semibold mb-2">Debt is a chapter, not the whole story</p>
      <p class="text-sm text-text-secondary">Add your debts to see exactly when you'll be free of them.</p>
    </div>
  {/if}

  <!-- Privacy note -->
  <p class="text-xs text-text-muted text-center pt-2 pb-4">
    Your debt data stays on this device. Nothing is sent anywhere.
  </p>
</div>
