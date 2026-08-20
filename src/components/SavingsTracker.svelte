<script lang="ts">
  import {
    type SavingsGoal,
    getGoals,
    createGoal,
    addDeposit,
    deleteGoal,
    getTotalSaved,
  } from '../lib/savings-store';
  import { fly, fade, slide } from 'svelte/transition';
  import SavingsPace from './SavingsPace.svelte';

  // ---- State ----
  let goals = $state<SavingsGoal[]>([]);
  let totalSaved = $state(0);

  function refresh() {
    goals = getGoals();
    totalSaved = getTotalSaved();
  }

  $effect(() => {
    refresh();
  });

  // ---- Category config ----
  // Labels only — categories no longer tint; colour on this site carries
  // meaning, and a savings category is not a meaning.
  const categoryConfig: Record<SavingsGoal['category'], { label: string }> = {
    emergency: { label: 'Emergency Fund' },
    education: { label: 'Education' },
    housing: { label: 'Housing' },
    vehicle: { label: 'Vehicle' },
    family: { label: 'Family' },
    travel: { label: 'Travel' },
    custom: { label: 'Custom' },
  };

  const suggestedGoals: { name: string; target: number; category: SavingsGoal['category'] }[] = [
    { name: 'Emergency fund', target: 1000, category: 'emergency' },
    { name: 'First & last month rent', target: 2000, category: 'housing' },
    { name: 'School supplies', target: 300, category: 'education' },
    { name: 'Travel home', target: 500, category: 'travel' },
    { name: 'New vehicle', target: 5000, category: 'vehicle' },
  ];

  // ---- Create goal form ----
  let showCreateForm = $state(false);
  let newName = $state('');
  let newTarget = $state('');
  let newCategory = $state<SavingsGoal['category']>('emergency');

  function handleCreate() {
    const target = parseFloat(newTarget);
    if (!newName.trim() || isNaN(target) || target <= 0) return;
    createGoal(newName.trim(), target, newCategory);
    newName = '';
    newTarget = '';
    newCategory = 'emergency';
    showCreateForm = false;
    refresh();
  }

  function quickCreate(s: typeof suggestedGoals[number]) {
    createGoal(s.name, s.target, s.category);
    refresh();
  }

  // ---- Deposit ----
  let depositGoalId = $state<string | null>(null);
  let depositAmount = $state('');
  let celebration = $state<{ goalId: string; message: string } | null>(null);

  function handleDeposit(goalId: string) {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;

    const updated = addDeposit(goalId, amount);
    if (!updated) return;

    // Check milestones
    const pct = Math.round((updated.currentAmount / updated.targetAmount) * 100);
    if (pct >= 100 && pct - Math.round(((updated.currentAmount - amount) / updated.targetAmount) * 100) < 100) {
      celebration = { goalId, message: 'You did it. Goal reached.' };
    } else if (pct >= 75 && pct - Math.round(((updated.currentAmount - amount) / updated.targetAmount) * 100) < 75) {
      celebration = { goalId, message: 'Almost there. Keep going.' };
    } else if (pct >= 50 && pct - Math.round(((updated.currentAmount - amount) / updated.targetAmount) * 100) < 50) {
      celebration = { goalId, message: 'Halfway. Solid progress.' };
    } else if (pct >= 25 && pct - Math.round(((updated.currentAmount - amount) / updated.targetAmount) * 100) < 25) {
      celebration = { goalId, message: 'Quarter of the way there.' };
    }

    depositGoalId = null;
    depositAmount = '';
    refresh();

    if (celebration) {
      setTimeout(() => { celebration = null; }, 3000);
    }
  }

  let confirmingDeleteId = $state<string | null>(null);
  let confirmingDeleteTimer = $state<ReturnType<typeof setTimeout> | null>(null);

  function handleDelete(goalId: string) {
    if (confirmingDeleteId === goalId) {
      // Second tap — actually delete
      if (confirmingDeleteTimer) clearTimeout(confirmingDeleteTimer);
      confirmingDeleteId = null;
      confirmingDeleteTimer = null;
      deleteGoal(goalId);
      refresh();
    } else {
      // First tap — enter confirming state
      if (confirmingDeleteTimer) clearTimeout(confirmingDeleteTimer);
      confirmingDeleteId = goalId;
      confirmingDeleteTimer = setTimeout(() => {
        confirmingDeleteId = null;
        confirmingDeleteTimer = null;
      }, 3000);
    }
  }

  // ---- Deposit history toggle ----
  let expandedGoalId = $state<string | null>(null);

  function toggleHistory(goalId: string) {
    expandedGoalId = expandedGoalId === goalId ? null : goalId;
  }

  // ---- Helpers ----
  function fmt(n: number): string {
    return n.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function daysSince(dateStr: string): number {
    const then = new Date(dateStr);
    const now = new Date();
    return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
  }

  function lastDepositDays(goal: SavingsGoal): number | null {
    if (goal.deposits.length === 0) return null;
    const last = goal.deposits[goal.deposits.length - 1];
    return daysSince(last.date);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric',
    });
  }
</script>

<div class="space-y-5">
  <!-- Total saved banner -->
  {#if goals.length > 0}
    <div class="rounded-sm bg-white border border-rule p-5 text-center">
      <p class="text-xs text-text-muted mb-1">Total saved across all goals</p>
      <p class="text-3xl font-bold text-ink">${fmt(totalSaved)}</p>
      <p class="text-xs text-text-muted mt-1">{goals.length} {goals.length === 1 ? 'goal' : 'goals'} in progress</p>
    </div>
  {/if}

  <!-- Empty state -->
  {#if goals.length === 0 && !showCreateForm}
    <div class="rounded-sm bg-surface-card border border-rule p-8 text-center">
      <div class="w-14 h-14 rounded-full bg-ground flex items-center justify-center mx-auto mb-4">
        <svg class="w-7 h-7 text-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
        </svg>
      </div>
      <p class="text-lg font-semibold mb-2">Every journey starts with a single step</p>
      <p class="text-sm text-text-secondary mb-5">What are you saving for?</p>

      <div class="flex flex-wrap gap-2 justify-center mb-4">
        {#each suggestedGoals as suggestion}
          <button
            onclick={() => quickCreate(suggestion)}
            class="px-3 py-1.5 rounded-sm text-xs font-medium border border-rule
              bg-surface-warm text-text-secondary hover:border-quiet
              transition-colors cursor-pointer"
          >
            {suggestion.name} (${fmt(suggestion.target)})
          </button>
        {/each}
      </div>

      <button
        onclick={() => showCreateForm = true}
        class="text-sm font-medium text-ink underline decoration-rule underline-offset-2 hover:decoration-ink transition-colors cursor-pointer"
      >
        Or create your own goal
      </button>
    </div>
  {/if}

  <!-- Celebration toast -->
  {#if celebration}
    <div
      class="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-sm bg-verified text-white px-5 py-3 shadow-lg"
      in:fly={{ y: -30, duration: 300 }}
      out:fade={{ duration: 200 }}
    >
      <p class="text-sm font-semibold">{celebration.message}</p>
    </div>
  {/if}

  <!-- Goal cards -->
  {#each goals as goal (goal.id)}
    {@const config = categoryConfig[goal.category]}
    {@const pct = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100)}
    {@const daysAgo = lastDepositDays(goal)}

    <div
      class="rounded-sm bg-surface-card border border-rule overflow-hidden shadow-sm"
      in:fly={{ y: 15, duration: 250 }}
    >
      <!-- Goal header -->
      <div class="p-4 pb-3">
        <div class="flex items-start justify-between mb-1">
          <div>
            <p class="font-semibold">{goal.name}</p>
            <p class="text-xs text-quiet">{config.label}</p>
          </div>
          <p class="text-lg font-bold text-ink">{pct}%</p>
        </div>

        <!-- Progress bar -->
        <div class="h-4 bg-rule overflow-hidden my-3">
          <div
            class="h-full bg-verified transition-all duration-700 ease-[var(--ease-out)]"
            style="width: {pct}%"
          ></div>
        </div>

        <!-- Amount + context -->
        <div class="flex items-baseline justify-between">
          <p class="text-sm">
            <span class="font-semibold">${fmt(goal.currentAmount)}</span>
            <span class="text-text-muted"> of ${fmt(goal.targetAmount)}</span>
          </p>
          {#if daysAgo !== null}
            <p class="text-xs text-text-muted">
              {#if daysAgo === 0}
                Last deposit today
              {:else if daysAgo === 1}
                1 day since last deposit
              {:else}
                {daysAgo} days since last deposit
              {/if}
            </p>
          {/if}
        </div>
      </div>

      <!-- Actions -->
      <div class="px-4 pb-4 flex gap-2">
        {#if depositGoalId === goal.id}
          <div class="flex-1 flex gap-2" in:slide={{ duration: 150 }}>
            <input
              type="number"
              inputmode="decimal"
              bind:value={depositAmount}
              placeholder="Amount"
              min="0"
              step="0.01"
              class="flex-1 rounded-sm border border-rule bg-surface-warm px-3 py-2 text-sm
                placeholder:text-faint focus:border-ink
                focus:outline-none transition-colors"
              aria-label="Deposit amount"
              onkeydown={(e) => { if (e.key === 'Enter') handleDeposit(goal.id); }}
            />
            <button
              onclick={() => handleDeposit(goal.id)}
              class="px-4 py-2 rounded-sm text-sm font-semibold bg-ink text-ground
                hover:bg-ink/85 active:scale-95 transition-all cursor-pointer"
            >
              Save
            </button>
            <button
              onclick={() => { depositGoalId = null; depositAmount = ''; }}
              class="px-3 py-2 rounded-sm text-sm text-text-muted hover:text-text-secondary
                transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        {:else}
          <button
            onclick={() => { depositGoalId = goal.id; }}
            class="flex-1 py-2.5 rounded-sm text-sm font-semibold bg-ink text-ground
              hover:bg-ink/85 active:scale-95 transition-all cursor-pointer"
          >
            Add deposit
          </button>
          <button
            onclick={() => toggleHistory(goal.id)}
            class="px-3 py-2.5 rounded-sm text-sm text-text-muted hover:text-text-secondary
              hover:bg-ground transition-colors cursor-pointer"
            aria-label="View deposit history"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
          {#if confirmingDeleteId === goal.id}
            <button
              onclick={() => handleDelete(goal.id)}
              class="px-3 py-2.5 rounded-sm text-xs font-semibold bg-contested text-white
                active:scale-95 transition-all cursor-pointer"
              aria-label="Confirm delete goal"
            >
              Tap again to delete
            </button>
          {:else}
            <button
              onclick={() => handleDelete(goal.id)}
              class="px-3 py-2.5 rounded-sm text-sm text-faint hover:text-ink
                hover:bg-ground transition-colors cursor-pointer"
              aria-label="Delete goal"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          {/if}
        {/if}
      </div>

      <!-- Deposit history (collapsible), led by the pace it implies -->
      {#if expandedGoalId === goal.id && goal.deposits.length > 0}
        <div class="border-t border-rule px-4 py-4" in:slide={{ duration: 200 }}>
          <SavingsPace {goal} />
        </div>
        <div class="border-t border-rule px-4 py-3" in:slide={{ duration: 200 }}>
          <p class="text-xs font-semibold text-text-muted mb-2">Deposit history</p>
          <div class="space-y-1.5">
            {#each [...goal.deposits].reverse() as deposit}
              <div class="flex items-center justify-between text-sm">
                <span class="text-text-muted">{formatDate(deposit.date)}</span>
                <span class="font-medium">${fmt(deposit.amount)}</span>
              </div>
            {/each}
          </div>
        </div>
      {:else if expandedGoalId === goal.id}
        <div class="border-t border-rule px-4 py-3" in:slide={{ duration: 200 }}>
          <p class="text-xs text-text-muted">No deposits yet. You'll get there.</p>
        </div>
      {/if}
    </div>
  {/each}

  <!-- Create goal form -->
  {#if showCreateForm}
    <div
      class="rounded-sm bg-surface-warm border border-rule p-5 space-y-3"
      in:slide={{ duration: 200 }}
    >
      <h3 class="font-semibold text-sm">Create a savings goal</h3>

      <div>
        <label for="goal-name" class="block text-xs font-medium text-text-muted mb-1">What are you saving for?</label>
        <input
          id="goal-name"
          type="text"
          bind:value={newName}
          placeholder="e.g. Emergency fund"
          class="w-full rounded-sm border border-rule bg-surface-card px-3 py-2.5 text-sm
            placeholder:text-faint focus:border-ink
            focus:outline-none transition-colors"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label for="goal-target" class="block text-xs font-medium text-text-muted mb-1">Target amount</label>
          <input
            id="goal-target"
            type="number"
            inputmode="decimal"
            bind:value={newTarget}
            placeholder="0"
            min="0"
            step="1"
            class="w-full rounded-sm border border-rule bg-surface-card px-3 py-2.5 text-sm
              placeholder:text-faint focus:border-ink
              focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label for="goal-category" class="block text-xs font-medium text-text-muted mb-1">Category</label>
          <select
            id="goal-category"
            bind:value={newCategory}
            class="w-full rounded-sm border border-rule bg-surface-card px-3 py-2.5 text-sm
              focus:border-ink
              focus:outline-none transition-colors cursor-pointer"
          >
            {#each Object.entries(categoryConfig) as [value, config]}
              <option {value}>{config.label}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="flex gap-2 pt-1">
        <button
          onclick={handleCreate}
          class="flex-1 py-2.5 rounded-sm text-sm font-semibold bg-ink text-ground
            hover:bg-ink/85 active:scale-95 transition-all cursor-pointer"
        >
          Create goal
        </button>
        <button
          onclick={() => { showCreateForm = false; newName = ''; newTarget = ''; }}
          class="px-4 py-2.5 rounded-sm text-sm text-text-muted hover:text-text-secondary
            transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  {:else if goals.length > 0}
    <button
      onclick={() => showCreateForm = true}
      class="w-full py-2.5 rounded-sm border border-dashed border-rule text-sm
        font-medium text-text-muted hover:border-quiet hover:text-ink
        transition-colors cursor-pointer"
    >
      + New savings goal
    </button>
  {/if}

  <!-- Privacy note -->
  <p class="text-xs text-text-muted text-center pt-2 pb-4">
    Your savings data stays on this device. Nothing is sent anywhere.
  </p>
</div>
