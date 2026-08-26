<script lang="ts">
  import {
    type BudgetEntry,
    type IncomeItem,
    type ExpenseItem,
    type ActualItem,
    getCurrentBudget,
    getBudget,
    saveBudget,
    getMonthlyIncome,
    getMonthlyExpenses,
    toMonthly,
    getPreviousMonth,
    copyBudgetToMonth,
    getAllBudgetMonths,
    budgetRows,
  } from '../lib/budget-store';
  import { downloadCsv, stamp } from '../lib/csv';
  import { fly, fade, slide } from 'svelte/transition';
  import FromWhatYouEntered from './FromWhatYouEntered.svelte';
  import { getMoneyPicture } from '../lib/money-picture';
  import { matchBenefitSeries } from '../lib/forecast';

  // ---- Month navigation ----
  let currentMonth = $state(formatMonth(new Date()));
  let budget = $state<BudgetEntry>(loadOrCreate(currentMonth));

  function formatMonth(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function displayMonth(m: string): string {
    const [y, mo] = m.split('-');
    const d = new Date(Number(y), Number(mo) - 1);
    return d.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
  }

  function loadOrCreate(month: string): BudgetEntry {
    const existing = getBudget(month);
    if (existing) return existing;
    return { id: '', month, income: [], expenses: [] };
  }

  function navigateMonth(delta: number) {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta);
    currentMonth = formatMonth(d);
    budget = loadOrCreate(currentMonth);
  }

  // ---- Derived totals ----
  let monthlyIncome = $derived(getMonthlyIncome(budget));
  let monthlyExpenses = $derived(getMonthlyExpenses(budget));
  let difference = $derived(monthlyIncome - monthlyExpenses);

  // ---- Auto-save ----
  let initialized = $state(false);
  $effect(() => {
    // Access reactive dependencies
    const _ = JSON.stringify(budget);
    if (!initialized) {
      initialized = true;
      return;
    }
    saveBudget(budget);
  });

  // ---- Copy last month ----
  let previousMonth = $derived(getPreviousMonth(currentMonth));

  function copyLastMonth() {
    if (!previousMonth) return;
    const copied = copyBudgetToMonth(previousMonth, currentMonth);
    if (copied) budget = copied;
  }

  // ---- Income helpers ----
  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  const incomeCategorySuggestions: { label: string; category: IncomeItem['category'] }[] = [
    { label: 'Employment', category: 'employment' },
    { label: 'Band distribution', category: 'band' },
    { label: 'Per-cap payment', category: 'band' },
    { label: 'CCB', category: 'benefits' },
    { label: 'GST credit', category: 'benefits' },
    { label: 'EI', category: 'benefits' },
    { label: 'Family', category: 'family' },
    { label: 'Other', category: 'other' },
  ];

  const incomeCategories: Record<IncomeItem['category'], string> = {
    employment: 'Employment',
    band: 'Band',
    benefits: 'Benefits',
    family: 'Family',
    other: 'Other',
  };

  const expenseCategories: Record<ExpenseItem['category'], string> = {
    housing: 'Housing',
    food: 'Food',
    transport: 'Transport',
    phone: 'Phone / Internet',
    'family-support': 'Family Support',
    health: 'Health',
    education: 'Education',
    personal: 'Personal',
    savings: 'Savings',
    debt: 'Debt Payments',
    other: 'Other',
  };

  // ---- What actually happened ----
  // The plan above is what she expects. This is what landed. They are kept
  // apart on purpose: editing the plan to match reality loses the reality,
  // and it is the gap between the two that teaches — and that the eight-week
  // forecast reads to correct itself.
  let showActualForm = $state(false);
  let newActualDate = $state('');
  let newActualLabel = $state('');
  let newActualAmount = $state('');
  let newActualKind = $state<ActualItem['kind']>('expense');
  let newActualCategory = $state<string>('food');

  let actuals = $derived(
    [...(budget.actuals ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
  );
  let recordedOut = $derived(
    actuals.filter((a) => a.kind === 'expense').reduce((s, a) => s + a.amount, 0),
  );
  let recordedIn = $derived(
    actuals.filter((a) => a.kind === 'income').reduce((s, a) => s + a.amount, 0),
  );
  let monthIsComplete = $derived(currentMonth < formatMonth(new Date()));

  /** Default a new record to today when the shown month is the current one,
   *  otherwise to that month's first day — never to a date outside it. */
  function defaultActualDate(): string {
    const today = new Date();
    if (currentMonth === formatMonth(today)) {
      return `${currentMonth}-${String(today.getDate()).padStart(2, '0')}`;
    }
    return `${currentMonth}-01`;
  }

  function openActualForm() {
    newActualDate = defaultActualDate();
    newActualLabel = '';
    newActualAmount = '';
    newActualKind = 'expense';
    newActualCategory = 'food';
    showActualForm = true;
  }

  function addActual() {
    const amount = parseFloat(newActualAmount);
    if (!newActualLabel.trim() || !Number.isFinite(amount) || amount <= 0) return;
    if (!newActualDate.startsWith(currentMonth)) return;
    const record: ActualItem = {
      id: generateId(),
      date: newActualDate,
      label: newActualLabel.trim(),
      amount,
      kind: newActualKind,
      category: newActualCategory as ActualItem['category'],
    };
    budget.actuals = [...(budget.actuals ?? []), record];
    showActualForm = false;
  }

  function removeActual(id: string) {
    budget.actuals = (budget.actuals ?? []).filter((a) => a.id !== id);
  }

  /* Her data, back out, in something she can open.
   *
   * Every month in one file rather than the month on screen: someone
   * exporting a budget is almost always doing it to show a year to somebody
   * — a band administrator, a tax preparer, a partner — and a single month
   * would send her back here twelve times. */
  let exported = $state(false);
  function exportCsv() {
    downloadCsv(`strong-fire-budget-${stamp()}.csv`, budgetRows());
    exported = true;
    setTimeout(() => (exported = false), 4000);
  }

  let monthsOnRecord = $derived(getAllBudgetMonths().length);

  function actualDayLabel(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  }

  const frequencyLabels: Record<IncomeItem['frequency'], string> = {
    monthly: 'Monthly',
    biweekly: 'Every 2 weeks',
    weekly: 'Weekly',
    irregular: 'Irregular',
  };

  // ---- Add income ----
  let newIncomeLabel = $state('');
  let newIncomeAmount = $state('');
  let newIncomeFrequency = $state<IncomeItem['frequency']>('monthly');
  let newIncomeCategory = $state<IncomeItem['category']>('employment');
  let newIncomeAnchor = $state('');
  let showIncomeForm = $state(false);

  function addIncome() {
    const amount = parseFloat(newIncomeAmount);
    if (!newIncomeLabel.trim() || isNaN(amount) || amount <= 0) return;
    budget.income = [
      ...budget.income,
      {
        id: generateId(),
        label: newIncomeLabel.trim(),
        amount,
        frequency: newIncomeFrequency,
        category: newIncomeCategory,
        ...(newIncomeAnchor ? { anchorDate: newIncomeAnchor } : {}),
      },
    ];
    newIncomeLabel = '';
    newIncomeAmount = '';
    newIncomeFrequency = 'monthly';
    newIncomeCategory = 'employment';
    newIncomeAnchor = '';
    showIncomeForm = false;
  }

  /**
   * Benefit series the forecast has published dates for and no amount.
   *
   * Read once on mount. The forecast can put a payment on the real day only
   * once she says what she receives — the dates are the government's, the
   * amount is only ever hers — so this is the one place on the site where
   * entering a number changes what the eight weeks can show.
   */
  let unenteredSeries = $state<{ key: string; label: string }[]>([]);

  $effect(() => {
    if (typeof window === 'undefined') return;
    unenteredSeries = getMoneyPicture().forecast?.unentered ?? [];
  });

  /** Still missing from the month actually on screen. Uses the forecast's own
   *  matcher rather than comparing labels, so "baby bonus" and "CCB" are not
   *  offered as two different things. */
  let missingSeries = $derived(
    unenteredSeries.filter(
      (u) => !budget.income.some((i) => matchBenefitSeries(i.label) === u.key),
    ),
  );

  function enterSeries() {
    const first = missingSeries[0];
    if (!first) return;
    // Label and category only. The amount stays empty because it is the one
    // thing here nobody but her knows, and a benefit amount guessed from a
    // maximum would land a number she does not receive in her own budget.
    newIncomeLabel = first.label;
    newIncomeCategory = 'benefits';
    newIncomeAmount = '';
    showIncomeForm = true;
  }

  function pickSuggestion(s: typeof incomeCategorySuggestions[number]) {
    newIncomeLabel = s.label;
    newIncomeCategory = s.category;
    showIncomeForm = true;
  }

  function removeIncome(id: string) {
    budget.income = budget.income.filter((i) => i.id !== id);
  }

  // ---- Add expense ----
  let newExpenseLabel = $state('');
  let newExpenseAmount = $state('');
  let newExpenseCategory = $state<ExpenseItem['category']>('housing');
  let newExpenseFrequency = $state<'monthly' | 'biweekly' | 'weekly'>('monthly');
  let newExpenseAnchor = $state('');
  let showExpenseForm = $state(false);

  const expenseFrequencyLabels: Record<'monthly' | 'biweekly' | 'weekly', string> = {
    monthly: 'Monthly',
    biweekly: 'Every 2 weeks',
    weekly: 'Weekly',
  };

  function addExpense() {
    const amount = parseFloat(newExpenseAmount);
    if (!newExpenseLabel.trim() || isNaN(amount) || amount <= 0) return;
    budget.expenses = [
      ...budget.expenses,
      {
        id: generateId(),
        label: newExpenseLabel.trim(),
        amount,
        frequency: newExpenseFrequency,
        category: newExpenseCategory,
        ...(newExpenseAnchor ? { anchorDate: newExpenseAnchor } : {}),
      },
    ];
    newExpenseLabel = '';
    newExpenseAmount = '';
    newExpenseCategory = 'housing';
    newExpenseFrequency = 'monthly';
    newExpenseAnchor = '';
    showExpenseForm = false;
  }

  function removeExpense(id: string) {
    budget.expenses = budget.expenses.filter((e) => e.id !== id);
  }

  // ---- Insights ----
  let insights = $derived(generateInsights());

  function generateInsights(): string[] {
    const messages: string[] = [];
    if (budget.income.length === 0 && budget.expenses.length === 0) return messages;

    // Family support insight
    if (monthlyExpenses > 0) {
      const familySupport = budget.expenses
        .filter((e) => e.category === 'family-support')
        .reduce((s, e) => s + e.amount, 0);
      const pct = Math.round((familySupport / monthlyExpenses) * 100);
      if (pct > 0) {
        messages.push(
          `Family support is ${pct}% of your expenses — that's real community investment.`,
        );
      }
    }

    // Surplus or shortfall
    if (monthlyIncome > 0 && monthlyExpenses > 0) {
      if (difference > 0) {
        messages.push(
          `You have $${Math.round(difference)} left over each month. That's breathing room.`,
        );
      } else if (difference < 0) {
        messages.push(
          `You're spending about $${Math.round(Math.abs(difference))} more than what's coming in. Let's look at where there might be flexibility.`,
        );
      } else {
        messages.push(`Your income and expenses are balanced. Every dollar has a place.`);
      }
    }

    // Savings insight
    const savingsAmount = budget.expenses
      .filter((e) => e.category === 'savings')
      .reduce((s, e) => s + e.amount, 0);
    if (savingsAmount > 0 && monthlyIncome > 0) {
      const savingsPct = Math.round((savingsAmount / monthlyIncome) * 100);
      messages.push(`You're putting ${savingsPct}% toward savings. That adds up.`);
    }

    // Band income acknowledgment
    const hasBandIncome = budget.income.some((i) => i.category === 'band');
    if (hasBandIncome) {
      messages.push(
        `Band distributions and per-cap payments are included in your income picture.`,
      );
    }

    return messages;
  }

  // ---- Formatting ----
  function fmt(n: number): string {
    return n.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
</script>

<div class="space-y-5 budget-tool">
  <!-- Month navigator -->
  <div class="flex items-center justify-between">
    <button
      onclick={() => navigateMonth(-1)}
      class="p-2 rounded-sm hover:bg-ground transition-colors cursor-pointer"
      aria-label="Previous month"
    >
      <svg class="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
    <h2 class="text-lg font-semibold">{displayMonth(currentMonth)}</h2>
    <button
      onclick={() => navigateMonth(1)}
      class="p-2 rounded-sm hover:bg-ground transition-colors cursor-pointer"
      aria-label="Next month"
    >
      <svg class="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  </div>

  <!-- The picture -->
  <div class="rounded-sm bg-surface-card border border-rule p-5 shadow-sm">
    <p class="text-xs font-semibold text-faint tracking-widest uppercase mb-4">The picture</p>

    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <p class="text-xs text-text-muted mb-0.5">Monthly income</p>
        <p class="text-2xl font-bold text-ink">${fmt(monthlyIncome)}</p>
      </div>
      <div>
        <p class="text-xs text-text-muted mb-0.5">Monthly expenses</p>
        <p class="text-2xl font-bold text-ink">${fmt(monthlyExpenses)}</p>
      </div>
    </div>

    <!-- Visual bar -->
    {#if monthlyIncome > 0 || monthlyExpenses > 0}
      {@const maxVal = Math.max(monthlyIncome, monthlyExpenses, 1)}
      <div class="space-y-2 mb-4">
        <div class="flex items-center gap-2">
          <span class="text-xs text-text-muted w-16">Income</span>
          <div class="flex-1 h-3 bg-rule overflow-hidden">
            <div
              class="h-full bg-ink transition-all duration-500"
              style="width: {(monthlyIncome / maxVal) * 100}%"
            ></div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-text-muted w-16">Expenses</span>
          <div class="flex-1 h-3 bg-rule overflow-hidden">
            <div
              class="h-full bg-ink transition-all duration-500"
              style="width: {(monthlyExpenses / maxVal) * 100}%"
            ></div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Difference -->
    <div class="rounded-sm p-3.5 text-center
      {difference > 0 ? 'bg-verified-wash' : difference < 0 ? 'bg-contested-wash' : 'bg-ground'}">
      <p class="text-xs text-text-muted mb-0.5">
        {difference >= 0 ? 'Monthly surplus' : 'Monthly shortfall'}
      </p>
      <p class="text-xl font-bold
        {difference > 0 ? 'text-verified' : difference < 0 ? 'text-contested' : 'text-ink'}">
        {difference >= 0 ? '' : '-'}${fmt(Math.abs(difference))}
      </p>
    </div>
  </div>

  <!-- Empty state welcome -->
  {#if budget.income.length === 0 && budget.expenses.length === 0}
    <div class="rounded-sm bg-surface-card border border-rule p-6 text-center" in:fade={{ duration: 200 }}>
      <div class="w-14 h-14 rounded-full bg-ground flex items-center justify-center mx-auto mb-4">
        <svg class="w-7 h-7 text-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      </div>
      <p class="text-lg font-semibold mb-2">See where your money goes</p>
      <p class="text-sm text-text-secondary leading-relaxed">
        Start by adding what comes in each month — employment, band distributions, benefits, or anything else.
      </p>
    </div>
  {/if}

  <!-- Insights -->
  {#if insights.length > 0}
    <div class="space-y-2" in:fade={{ duration: 200 }}>
      {#each insights as insight}
        <div class="border-l-2 border-rule pl-4">
          <p class="text-sm text-quiet leading-relaxed">{insight}</p>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Income section -->
  <section>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-xs font-semibold text-faint tracking-widest uppercase">Income</h3>
      {#if budget.income.length > 0}
        <p class="text-sm font-medium text-ink">${fmt(monthlyIncome)}/mo</p>
      {/if}
    </div>

    <!-- Income items -->
    {#if budget.income.length > 0}
      <div class="space-y-2 mb-3">
        {#each budget.income as item (item.id)}
          <div
            class="flex items-center gap-3 rounded-sm bg-surface-card border border-rule px-4 py-3"
            in:fly={{ y: 10, duration: 200 }}
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{item.label}</p>
              <p class="text-xs text-text-muted">
                {incomeCategories[item.category]}
                {#if item.frequency !== 'monthly'}
                  · {frequencyLabels[item.frequency]}
                  · ${fmt(toMonthly(item.amount, item.frequency))}/mo
                {/if}
              </p>
            </div>
            <p class="text-sm font-semibold text-ink whitespace-nowrap">${fmt(item.amount)}</p>
            <button
              onclick={() => removeIncome(item.id)}
              class="p-1.5 rounded-sm text-faint hover:text-ink hover:bg-ground transition-colors cursor-pointer"
              aria-label="Remove {item.label}"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        {/each}
      </div>
    {/if}

    {#if !showIncomeForm && missingSeries.length > 0}
      <FromWhatYouEntered
        fact={missingSeries.length === 1
          ? `Your forecast has the payment dates for ${missingSeries[0].label} but not the amount.`
          : `Your forecast has payment dates for ${missingSeries.map((m) => m.label).join(' and ')} but not the amounts.`}
        source="From your household and the published payment schedule"
        action={`Add what you receive from ${missingSeries[0].label}`}
        caveat="Only you know what actually lands. Until it is here, the forecast leaves that money out of the weeks rather than estimating it."
        onuse={enterSeries}
      />
    {/if}

    <!-- Quick-add suggestions -->
    {#if !showIncomeForm && budget.income.length === 0}
      <div class="mb-3">
        <p class="text-sm text-text-secondary mb-2">Quick add:</p>
        <div class="flex flex-wrap gap-2">
          {#each incomeCategorySuggestions as suggestion}
            <button
              onclick={() => pickSuggestion(suggestion)}
              class="px-3 py-1.5 rounded-sm text-xs font-medium border border-rule
                bg-surface-warm text-text-secondary hover:border-quiet
                transition-colors cursor-pointer"
            >
              {suggestion.label}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Add income form -->
    {#if showIncomeForm}
      <div
        class="rounded-sm bg-surface-warm border border-rule p-4 space-y-3"
        in:slide={{ duration: 200 }}
      >
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label for="income-label" class="block text-xs font-medium text-text-muted mb-1">What is it?</label>
            <input
              id="income-label"
              type="text"
              bind:value={newIncomeLabel}
              placeholder="e.g. Work pay"
              class="w-full rounded-sm border border-rule bg-surface-card px-3 py-2.5 text-sm
                placeholder:text-faint focus:border-ink
                focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label for="income-amount" class="block text-xs font-medium text-text-muted mb-1">Amount</label>
            <input
              id="income-amount"
              type="number"
              inputmode="decimal"
              bind:value={newIncomeAmount}
              placeholder="0"
              min="0"
              step="0.01"
              class="w-full rounded-sm border border-rule bg-surface-card px-3 py-2.5 text-sm
                placeholder:text-faint focus:border-ink
                focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label for="income-frequency" class="block text-xs font-medium text-text-muted mb-1">How often?</label>
            <select
              id="income-frequency"
              bind:value={newIncomeFrequency}
              class="w-full rounded-sm border border-rule bg-surface-card px-3 py-2.5 text-sm
                focus:border-ink
                focus:outline-none transition-colors cursor-pointer"
            >
              {#each Object.entries(frequencyLabels) as [value, label]}
                <option {value}>{label}</option>
              {/each}
            </select>
          </div>
          <div class="col-span-2">
            <label for="income-anchor" class="block text-xs font-medium text-text-muted mb-1">
              When did it last arrive? <span class="text-faint">(optional — lets the forecast place it on real days)</span>
            </label>
            <input
              id="income-anchor"
              type="date"
              bind:value={newIncomeAnchor}
              class="w-full rounded-sm border border-rule bg-surface-card px-3 py-2.5 text-sm
                focus:border-ink focus:outline-none transition-colors"
            />
          </div>
          <div class="col-span-2">
            <label for="income-category" class="block text-xs font-medium text-text-muted mb-1">Category</label>
            <select
              id="income-category"
              bind:value={newIncomeCategory}
              class="w-full rounded-sm border border-rule bg-surface-card px-3 py-2.5 text-sm
                focus:border-ink
                focus:outline-none transition-colors cursor-pointer"
            >
              {#each Object.entries(incomeCategories) as [value, label]}
                <option {value}>{label}</option>
              {/each}
            </select>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            onclick={addIncome}
            class="flex-1 py-2.5 rounded-sm text-sm font-semibold bg-ink text-ground
              hover:bg-ink/85 active:scale-95 transition-all cursor-pointer"
          >
            Add income
          </button>
          <button
            onclick={() => { showIncomeForm = false; newIncomeLabel = ''; newIncomeAmount = ''; }}
            class="px-4 py-2.5 rounded-sm text-sm text-text-muted hover:text-text-secondary
              transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    {:else}
      <button
        onclick={() => showIncomeForm = true}
        class="w-full py-2.5 rounded-sm border border-dashed border-rule text-sm
          font-medium text-text-muted hover:border-quiet hover:text-ink
          transition-colors cursor-pointer"
      >
        + Add income source
      </button>
    {/if}
  </section>

  <!-- Expenses section -->
  <section>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-xs font-semibold text-faint tracking-widest uppercase">Expenses</h3>
      {#if budget.expenses.length > 0}
        <p class="text-sm font-medium text-ink">${fmt(monthlyExpenses)}/mo</p>
      {/if}
    </div>

    <!-- Expense items -->
    {#if budget.expenses.length > 0}
      <div class="space-y-2 mb-3">
        {#each budget.expenses as item (item.id)}
          <div
            class="flex items-center gap-3 rounded-sm bg-surface-card border border-rule px-4 py-3"
            in:fly={{ y: 10, duration: 200 }}
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{item.label}</p>
              <p class="text-xs text-text-muted">
                {expenseCategories[item.category]}
                {#if item.frequency && item.frequency !== 'monthly'}
                  · {expenseFrequencyLabels[item.frequency]}
                  · ${fmt(toMonthly(item.amount, item.frequency))}/mo
                {/if}
              </p>
            </div>
            <p class="text-sm font-semibold text-ink whitespace-nowrap">${fmt(item.amount)}</p>
            <button
              onclick={() => removeExpense(item.id)}
              class="p-1.5 rounded-sm text-faint hover:text-ink hover:bg-ground transition-colors cursor-pointer"
              aria-label="Remove {item.label}"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Add expense form -->
    {#if showExpenseForm}
      <div
        class="rounded-sm bg-surface-warm border border-rule p-4 space-y-3"
        in:slide={{ duration: 200 }}
      >
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label for="expense-label" class="block text-xs font-medium text-text-muted mb-1">What is it?</label>
            <input
              id="expense-label"
              type="text"
              bind:value={newExpenseLabel}
              placeholder="e.g. Rent, groceries"
              class="w-full rounded-sm border border-rule bg-surface-card px-3 py-2.5 text-sm
                placeholder:text-faint focus:border-ink
                focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label for="expense-amount" class="block text-xs font-medium text-text-muted mb-1">Amount</label>
            <input
              id="expense-amount"
              type="number"
              inputmode="decimal"
              bind:value={newExpenseAmount}
              placeholder="0"
              min="0"
              step="0.01"
              class="w-full rounded-sm border border-rule bg-surface-card px-3 py-2.5 text-sm
                placeholder:text-faint focus:border-ink
                focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label for="expense-frequency" class="block text-xs font-medium text-text-muted mb-1">How often?</label>
            <select
              id="expense-frequency"
              bind:value={newExpenseFrequency}
              class="w-full rounded-sm border border-rule bg-surface-card px-3 py-2.5 text-sm
                focus:border-ink
                focus:outline-none transition-colors cursor-pointer"
            >
              {#each Object.entries(expenseFrequencyLabels) as [value, label]}
                <option {value}>{label}</option>
              {/each}
            </select>
          </div>
          <div class="col-span-2">
            <label for="expense-anchor" class="block text-xs font-medium text-text-muted mb-1">
              When does it come out? <span class="text-faint">(optional — lets the forecast place it on real days)</span>
            </label>
            <input
              id="expense-anchor"
              type="date"
              bind:value={newExpenseAnchor}
              class="w-full rounded-sm border border-rule bg-surface-card px-3 py-2.5 text-sm
                focus:border-ink focus:outline-none transition-colors"
            />
          </div>
          <div class="col-span-2">
            <label for="expense-category" class="block text-xs font-medium text-text-muted mb-1">Category</label>
            <select
              id="expense-category"
              bind:value={newExpenseCategory}
              class="w-full rounded-sm border border-rule bg-surface-card px-3 py-2.5 text-sm
                focus:border-ink
                focus:outline-none transition-colors cursor-pointer"
            >
              {#each Object.entries(expenseCategories) as [value, label]}
                <option {value}>{label}</option>
              {/each}
            </select>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            onclick={addExpense}
            class="flex-1 py-2.5 rounded-sm text-sm font-semibold bg-ink text-ground
              hover:bg-ink/85 active:scale-95 transition-all cursor-pointer"
          >
            Add expense
          </button>
          <button
            onclick={() => { showExpenseForm = false; newExpenseLabel = ''; newExpenseAmount = ''; }}
            class="px-4 py-2.5 rounded-sm text-sm text-text-muted hover:text-text-secondary
              transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    {:else}
      <button
        onclick={() => showExpenseForm = true}
        class="w-full py-2.5 rounded-sm border border-dashed border-rule text-sm
          font-medium text-text-muted hover:border-quiet hover:text-ink
          transition-colors cursor-pointer"
      >
        + Add expense
      </button>
    {/if}
  </section>

  <!-- What actually happened -->
  <section>
    <div class="flex items-center justify-between mb-1">
      <h3 class="text-xs font-semibold text-faint tracking-widest uppercase">What actually happened</h3>
      {#if actuals.length > 0}
        <p class="text-sm font-medium text-ink">${fmt(recordedOut)} out</p>
      {/if}
    </div>
    <p class="text-xs text-text-muted leading-relaxed mb-3 max-w-prose">
      Above is the plan. This is the record — what actually landed, on the day it
      landed. Keeping them apart is the point: the gap between them is the useful
      part, and the eight-week forecast reads it to correct itself.
    </p>

    {#if actuals.length > 0}
      <div class="space-y-2 mb-3">
        {#each actuals as item (item.id)}
          <div class="flex items-center gap-3 rounded-sm bg-surface-card border border-rule px-4 py-3">
            <p class="apparatus text-xs text-faint w-12 flex-shrink-0 tabular-nums">
              {actualDayLabel(item.date)}
            </p>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{item.label}</p>
              <p class="text-xs text-text-muted">
                {item.kind === 'income' ? 'Came in' : 'Went out'}
                · {expenseCategories[item.category] ?? incomeCategories[item.category] ?? item.category}
              </p>
            </div>
            <p class="text-sm tabular-nums flex-shrink-0 {item.kind === 'income' ? 'text-ink' : 'text-ink'}">
              {item.kind === 'income' ? '+' : '−'}${fmt(item.amount)}
            </p>
            <button
              onclick={() => removeActual(item.id)}
              aria-label="Remove {item.label}"
              class="text-text-muted hover:text-ink transition-colors cursor-pointer flex-shrink-0"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        {/each}
      </div>

      <!-- Plan against record. Stated, never scored. -->
      <div class="rounded-sm bg-surface-warm border border-rule px-4 py-3 mb-3">
        <p class="text-sm text-text-secondary leading-relaxed">
          You planned <span class="tabular-nums">${fmt(monthlyExpenses)}</span> of spending
          this month. So far you have recorded <span class="tabular-nums">${fmt(recordedOut)}</span>.
          {#if recordedIn > 0}
            <span class="tabular-nums">${fmt(recordedIn)}</span> came in.
          {/if}
        </p>
        <p class="apparatus text-[11px] text-faint mt-1.5 leading-snug">
          {#if monthIsComplete}
            {displayMonth(currentMonth)} is complete, so the forecast can use it.
          {:else}
            {displayMonth(currentMonth)} is still running — the forecast waits for a
            complete month before letting a record correct the plan.
          {/if}
        </p>
      </div>
    {/if}

    {#if showActualForm}
      <div class="rounded-sm bg-surface-card border border-rule p-4 space-y-3" transition:slide={{ duration: 200 }}>
        <div class="flex gap-2">
          <button
            onclick={() => { newActualKind = 'expense'; newActualCategory = 'food'; }}
            class="flex-1 py-2 rounded-sm text-sm font-medium border transition-colors cursor-pointer
              {newActualKind === 'expense' ? 'border-ink text-ink' : 'border-rule text-text-muted hover:border-quiet'}"
          >Went out</button>
          <button
            onclick={() => { newActualKind = 'income'; newActualCategory = 'employment'; }}
            class="flex-1 py-2 rounded-sm text-sm font-medium border transition-colors cursor-pointer
              {newActualKind === 'income' ? 'border-ink text-ink' : 'border-rule text-text-muted hover:border-quiet'}"
          >Came in</button>
        </div>

        <label class="block">
          <span class="apparatus-label block mb-1">What was it</span>
          <input
            bind:value={newActualLabel}
            placeholder={newActualKind === 'income' ? 'Pay' : 'Groceries'}
            class="w-full px-3 py-2.5 rounded-sm border border-rule bg-ground focus:border-ink focus:outline-none text-sm"
          />
        </label>

        <div class="flex gap-2">
          <label class="flex-1">
            <span class="apparatus-label block mb-1">How much</span>
            <input
              bind:value={newActualAmount}
              type="number" inputmode="decimal" placeholder="0"
              class="w-full px-3 py-2.5 rounded-sm border border-rule bg-ground focus:border-ink focus:outline-none text-sm tabular-nums"
            />
          </label>
          <label class="flex-1">
            <span class="apparatus-label block mb-1">What day</span>
            <input
              bind:value={newActualDate}
              type="date"
              min="{currentMonth}-01"
              class="w-full px-3 py-2.5 rounded-sm border border-rule bg-ground focus:border-ink focus:outline-none text-sm"
            />
          </label>
        </div>

        <label class="block">
          <span class="apparatus-label block mb-1">Kind</span>
          <select
            bind:value={newActualCategory}
            class="w-full px-3 py-2.5 rounded-sm border border-rule bg-ground focus:border-ink focus:outline-none text-sm"
          >
            {#if newActualKind === 'expense'}
              {#each Object.entries(expenseCategories) as [value, label]}
                <option {value}>{label}</option>
              {/each}
            {:else}
              {#each Object.entries(incomeCategories) as [value, label]}
                <option {value}>{label}</option>
              {/each}
            {/if}
          </select>
        </label>

        <div class="flex gap-2 pt-1">
          <button
            onclick={addActual}
            class="flex-1 py-2.5 rounded-sm bg-ink text-ground text-sm font-medium hover:bg-black transition-colors cursor-pointer"
          >Record it</button>
          <button
            onclick={() => showActualForm = false}
            class="px-4 py-2.5 rounded-sm border border-rule text-sm font-medium text-text-muted hover:border-quiet hover:text-ink transition-colors cursor-pointer"
          >Cancel</button>
        </div>
      </div>
    {:else}
      <button
        onclick={openActualForm}
        class="w-full py-2.5 rounded-sm border border-dashed border-rule text-sm
          font-medium text-text-muted hover:border-quiet hover:text-ink
          transition-colors cursor-pointer"
      >
        + Record what actually happened
      </button>
    {/if}

    {#if actuals.length > 0}
      <a href="/money/forecast" class="mt-3 inline-block text-sm text-ink underline decoration-rule underline-offset-2 hover:decoration-ink">
        See the next eight weeks
      </a>
    {/if}
  </section>

  <!-- Copy last month -->
  {#if previousMonth && budget.income.length === 0 && budget.expenses.length === 0}
    <button
      onclick={copyLastMonth}
      class="w-full py-3 rounded-sm bg-surface-warm border border-rule text-sm
        font-medium text-text-secondary hover:border-quiet hover:bg-ground
        transition-colors cursor-pointer"
    >
      Copy from {displayMonth(previousMonth)}
    </button>
  {/if}

  <!-- Take it with you -->
  {#if monthsOnRecord > 0}
    <section class="border-t border-rule pt-5">
      <h3 class="text-xs font-semibold text-faint tracking-widest uppercase mb-2">Take it with you</h3>
      <p class="text-xs text-text-muted leading-relaxed mb-3 max-w-prose">
        Your budget as a spreadsheet — every month, planned and recorded. It opens
        in Excel, Google Sheets, Numbers or anything else, so you can keep it,
        print it, or hand it to whoever needs to see it.
      </p>
      <div class="flex flex-wrap items-center gap-3">
        <button
          onclick={() => window.print()}
          class="py-2.5 px-4 rounded-sm border border-rule text-sm font-medium text-text-secondary
            hover:border-quiet hover:text-ink transition-colors cursor-pointer"
        >
          Print this budget
        </button>
        <button
          onclick={exportCsv}
          class="py-2.5 px-4 rounded-sm border border-ink text-sm font-medium text-ink
            hover:bg-ink hover:text-ground transition-colors cursor-pointer"
        >
          Download {monthsOnRecord === 1 ? 'this month' : `all ${monthsOnRecord} months`}
        </button>
        {#if exported}
          <p class="apparatus text-xs text-verified" transition:fade={{ duration: 150 }}>
            Saved to your downloads.
          </p>
        {/if}
      </div>
    </section>
  {/if}

  <!-- Privacy note -->
  <p class="text-xs text-text-muted text-center pt-2 pb-4">
    All your budget data stays on this device. Nothing is sent anywhere — the
    download above is written by your own browser.
  </p>
</div>
