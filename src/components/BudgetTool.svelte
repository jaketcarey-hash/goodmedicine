<script lang="ts">
  import {
    type BudgetEntry,
    type IncomeItem,
    type ExpenseItem,
    getCurrentBudget,
    getBudget,
    saveBudget,
    getMonthlyIncome,
    getMonthlyExpenses,
    toMonthly,
    getPreviousMonth,
    copyBudgetToMonth,
    getAllBudgetMonths,
  } from '../lib/budget-store';
  import { fly, fade, slide } from 'svelte/transition';

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
      },
    ];
    newIncomeLabel = '';
    newIncomeAmount = '';
    newIncomeFrequency = 'monthly';
    newIncomeCategory = 'employment';
    showIncomeForm = false;
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
  let showExpenseForm = $state(false);

  function addExpense() {
    const amount = parseFloat(newExpenseAmount);
    if (!newExpenseLabel.trim() || isNaN(amount) || amount <= 0) return;
    budget.expenses = [
      ...budget.expenses,
      {
        id: generateId(),
        label: newExpenseLabel.trim(),
        amount,
        category: newExpenseCategory,
      },
    ];
    newExpenseLabel = '';
    newExpenseAmount = '';
    newExpenseCategory = 'housing';
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

<div class="space-y-5">
  <!-- Month navigator -->
  <div class="flex items-center justify-between">
    <button
      onclick={() => navigateMonth(-1)}
      class="p-2 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
      aria-label="Previous month"
    >
      <svg class="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
    <h2 class="text-lg font-semibold">{displayMonth(currentMonth)}</h2>
    <button
      onclick={() => navigateMonth(1)}
      class="p-2 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
      aria-label="Next month"
    >
      <svg class="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  </div>

  <!-- The picture -->
  <div class="rounded-2xl bg-surface-card border border-stone-200 p-5 shadow-sm">
    <p class="text-xs font-semibold text-stone-400 tracking-widest uppercase mb-4">The picture</p>

    <div class="grid grid-cols-2 gap-4 mb-4">
      <div>
        <p class="text-xs text-text-muted mb-0.5">Monthly income</p>
        <p class="text-2xl font-bold text-sage-600">${fmt(monthlyIncome)}</p>
      </div>
      <div>
        <p class="text-xs text-text-muted mb-0.5">Monthly expenses</p>
        <p class="text-2xl font-bold text-stone-700">${fmt(monthlyExpenses)}</p>
      </div>
    </div>

    <!-- Visual bar -->
    {#if monthlyIncome > 0 || monthlyExpenses > 0}
      {@const maxVal = Math.max(monthlyIncome, monthlyExpenses, 1)}
      <div class="space-y-2 mb-4">
        <div class="flex items-center gap-2">
          <span class="text-xs text-text-muted w-16">Income</span>
          <div class="flex-1 h-3 bg-stone-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-sage-400 rounded-full transition-all duration-500"
              style="width: {(monthlyIncome / maxVal) * 100}%"
            ></div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-text-muted w-16">Expenses</span>
          <div class="flex-1 h-3 bg-stone-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500
                {monthlyExpenses > monthlyIncome ? 'bg-berry-400' : 'bg-stone-400'}"
              style="width: {(monthlyExpenses / maxVal) * 100}%"
            ></div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Difference -->
    <div class="rounded-xl p-3.5 text-center
      {difference > 0 ? 'bg-sage-50' : difference < 0 ? 'bg-berry-50' : 'bg-stone-50'}">
      <p class="text-xs text-text-muted mb-0.5">
        {difference >= 0 ? 'Monthly surplus' : 'Monthly shortfall'}
      </p>
      <p class="text-xl font-bold
        {difference > 0 ? 'text-sage-600' : difference < 0 ? 'text-berry-600' : 'text-stone-600'}">
        {difference >= 0 ? '' : '-'}${fmt(Math.abs(difference))}
      </p>
    </div>
  </div>

  <!-- Insights -->
  {#if insights.length > 0}
    <div class="space-y-2" in:fade={{ duration: 200 }}>
      {#each insights as insight}
        <div class="rounded-xl bg-clay-50 border border-clay-200 px-4 py-3">
          <p class="text-sm text-clay-700 leading-relaxed">{insight}</p>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Income section -->
  <section>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-xs font-semibold text-stone-400 tracking-widest uppercase">Income</h3>
      {#if budget.income.length > 0}
        <p class="text-sm font-medium text-sage-600">${fmt(monthlyIncome)}/mo</p>
      {/if}
    </div>

    <!-- Income items -->
    {#if budget.income.length > 0}
      <div class="space-y-2 mb-3">
        {#each budget.income as item (item.id)}
          <div
            class="flex items-center gap-3 rounded-xl bg-surface-card border border-stone-200 px-4 py-3"
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
            <p class="text-sm font-semibold text-sage-600 whitespace-nowrap">${fmt(item.amount)}</p>
            <button
              onclick={() => removeIncome(item.id)}
              class="p-1.5 rounded-lg text-stone-400 hover:text-berry-500 hover:bg-berry-50 transition-colors cursor-pointer"
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

    <!-- Quick-add suggestions -->
    {#if !showIncomeForm && budget.income.length === 0}
      <div class="mb-3">
        <p class="text-sm text-text-secondary mb-2">Quick add:</p>
        <div class="flex flex-wrap gap-2">
          {#each incomeCategorySuggestions as suggestion}
            <button
              onclick={() => pickSuggestion(suggestion)}
              class="px-3 py-1.5 rounded-full text-xs font-medium border border-stone-200
                bg-surface-warm text-text-secondary hover:border-sage-300 hover:bg-sage-50
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
        class="rounded-xl bg-surface-warm border border-stone-200 p-4 space-y-3"
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
              class="w-full rounded-lg border border-stone-200 bg-surface-card px-3 py-2.5 text-sm
                placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
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
              class="w-full rounded-lg border border-stone-200 bg-surface-card px-3 py-2.5 text-sm
                placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
                focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label for="income-frequency" class="block text-xs font-medium text-text-muted mb-1">How often?</label>
            <select
              id="income-frequency"
              bind:value={newIncomeFrequency}
              class="w-full rounded-lg border border-stone-200 bg-surface-card px-3 py-2.5 text-sm
                focus:border-sage-300 focus:ring-1 focus:ring-sage-200
                focus:outline-none transition-colors cursor-pointer"
            >
              {#each Object.entries(frequencyLabels) as [value, label]}
                <option {value}>{label}</option>
              {/each}
            </select>
          </div>
          <div class="col-span-2">
            <label for="income-category" class="block text-xs font-medium text-text-muted mb-1">Category</label>
            <select
              id="income-category"
              bind:value={newIncomeCategory}
              class="w-full rounded-lg border border-stone-200 bg-surface-card px-3 py-2.5 text-sm
                focus:border-sage-300 focus:ring-1 focus:ring-sage-200
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
            class="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-stone-900 text-white
              hover:bg-stone-800 active:scale-95 transition-all cursor-pointer"
          >
            Add income
          </button>
          <button
            onclick={() => { showIncomeForm = false; newIncomeLabel = ''; newIncomeAmount = ''; }}
            class="px-4 py-2.5 rounded-xl text-sm text-text-muted hover:text-text-secondary
              transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    {:else}
      <button
        onclick={() => showIncomeForm = true}
        class="w-full py-2.5 rounded-xl border-2 border-dashed border-stone-200 text-sm
          font-medium text-text-muted hover:border-sage-300 hover:text-sage-600
          transition-colors cursor-pointer"
      >
        + Add income source
      </button>
    {/if}
  </section>

  <!-- Expenses section -->
  <section>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-xs font-semibold text-stone-400 tracking-widest uppercase">Expenses</h3>
      {#if budget.expenses.length > 0}
        <p class="text-sm font-medium text-stone-600">${fmt(monthlyExpenses)}/mo</p>
      {/if}
    </div>

    <!-- Expense items -->
    {#if budget.expenses.length > 0}
      <div class="space-y-2 mb-3">
        {#each budget.expenses as item (item.id)}
          <div
            class="flex items-center gap-3 rounded-xl bg-surface-card border border-stone-200 px-4 py-3"
            in:fly={{ y: 10, duration: 200 }}
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{item.label}</p>
              <p class="text-xs text-text-muted">{expenseCategories[item.category]}</p>
            </div>
            <p class="text-sm font-semibold text-stone-700 whitespace-nowrap">${fmt(item.amount)}</p>
            <button
              onclick={() => removeExpense(item.id)}
              class="p-1.5 rounded-lg text-stone-400 hover:text-berry-500 hover:bg-berry-50 transition-colors cursor-pointer"
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
        class="rounded-xl bg-surface-warm border border-stone-200 p-4 space-y-3"
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
              class="w-full rounded-lg border border-stone-200 bg-surface-card px-3 py-2.5 text-sm
                placeholder:text-stone-400 focus:border-clay-300 focus:ring-1 focus:ring-clay-200
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
              class="w-full rounded-lg border border-stone-200 bg-surface-card px-3 py-2.5 text-sm
                placeholder:text-stone-400 focus:border-clay-300 focus:ring-1 focus:ring-clay-200
                focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label for="expense-category" class="block text-xs font-medium text-text-muted mb-1">Category</label>
            <select
              id="expense-category"
              bind:value={newExpenseCategory}
              class="w-full rounded-lg border border-stone-200 bg-surface-card px-3 py-2.5 text-sm
                focus:border-clay-300 focus:ring-1 focus:ring-clay-200
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
            class="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-stone-900 text-white
              hover:bg-stone-800 active:scale-95 transition-all cursor-pointer"
          >
            Add expense
          </button>
          <button
            onclick={() => { showExpenseForm = false; newExpenseLabel = ''; newExpenseAmount = ''; }}
            class="px-4 py-2.5 rounded-xl text-sm text-text-muted hover:text-text-secondary
              transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    {:else}
      <button
        onclick={() => showExpenseForm = true}
        class="w-full py-2.5 rounded-xl border-2 border-dashed border-stone-200 text-sm
          font-medium text-text-muted hover:border-clay-300 hover:text-clay-600
          transition-colors cursor-pointer"
      >
        + Add expense
      </button>
    {/if}
  </section>

  <!-- Copy last month -->
  {#if previousMonth && budget.income.length === 0 && budget.expenses.length === 0}
    <button
      onclick={copyLastMonth}
      class="w-full py-3 rounded-xl bg-surface-warm border border-stone-200 text-sm
        font-medium text-text-secondary hover:border-stone-300 hover:bg-stone-100
        transition-colors cursor-pointer"
    >
      Copy from {displayMonth(previousMonth)}
    </button>
  {/if}

  <!-- Privacy note -->
  <p class="text-xs text-text-muted text-center pt-2 pb-4">
    All your budget data stays on this device. Nothing is sent anywhere.
  </p>
</div>
