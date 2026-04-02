<script lang="ts">
  import { STORAGE_KEYS } from '../lib/storage-keys';

  let dataSummary = $state(typeof window !== 'undefined' ? buildSummary() : buildEmptySummary());
  let showRestoreConfirm = $state(false);
  let showClearConfirm = $state(false);
  let showClearFinal = $state(false);
  let restoreFile: File | null = $state(null);
  let statusMessage = $state('');
  let statusType: 'success' | 'error' | '' = $state('');

  const BACKUP_VERSION = 1;

  function buildEmptySummary() {
    return { checkins: 0, savingsGoals: 0, budgetMonths: 0, hasDebtPlan: false, hasCalendar: false, hasNetWorth: false, hasSection87: false, hasBenefits: false, hasDistribution: false, totalKeys: 0 };
  }

  function buildSummary() {
    const counts = {
      checkins: 0,
      savingsGoals: 0,
      budgetMonths: 0,
      hasDebtPlan: false,
      hasCalendar: false,
      hasNetWorth: false,
      hasSection87: false,
      hasBenefits: false,
      hasDistribution: false,
      totalKeys: 0,
    };

    const allKeys = Object.values(STORAGE_KEYS);
    for (const key of allKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      counts.totalKeys++;

      try {
        const parsed = JSON.parse(raw);

        if (key === STORAGE_KEYS.WELLNESS_CHECKINS && Array.isArray(parsed)) {
          counts.checkins = parsed.length;
        }
        if (key === STORAGE_KEYS.SAVINGS_GOALS && Array.isArray(parsed)) {
          counts.savingsGoals = parsed.length;
        }
        if (key === STORAGE_KEYS.BUDGET_DATA) {
          if (Array.isArray(parsed)) counts.budgetMonths = parsed.length;
          else if (typeof parsed === 'object') counts.budgetMonths = Object.keys(parsed).length;
        }
        if (key === STORAGE_KEYS.DEBT_PLAN) counts.hasDebtPlan = true;
        if (key === STORAGE_KEYS.CALENDAR_PROFILE) counts.hasCalendar = true;
        if (key === STORAGE_KEYS.NETWORTH_SNAPSHOTS || key === STORAGE_KEYS.NETWORTH_WORKING) counts.hasNetWorth = true;
        if (key === STORAGE_KEYS.SECTION87_RESULT) counts.hasSection87 = true;
        if (key === STORAGE_KEYS.BENEFITS_RESULTS) counts.hasBenefits = true;
        if (key === STORAGE_KEYS.DISTRIBUTION_PLAN) counts.hasDistribution = true;
      } catch {
        counts.totalKeys++;
      }
    }

    return counts;
  }

  function exportData() {
    const data: Record<string, unknown> = {};
    const allKeys = Object.values(STORAGE_KEYS);

    for (const key of allKeys) {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try {
          data[key] = JSON.parse(raw);
        } catch {
          data[key] = raw;
        }
      }
    }

    const backup = {
      _meta: {
        app: 'strongfire',
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        keyCount: Object.keys(data).length,
      },
      data,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strongfire-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);

    flash('Backup downloaded.', 'success');
  }

  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      restoreFile = input.files[0];
      showRestoreConfirm = true;
    }
  }

  async function restoreData() {
    if (!restoreFile) return;

    try {
      const text = await restoreFile.text();
      const backup = JSON.parse(text);

      if (!backup._meta || backup._meta.app !== 'strongfire' || !backup.data) {
        flash('This file is not a valid Strong Fire backup.', 'error');
        resetRestore();
        return;
      }

      const validKeys = new Set(Object.values(STORAGE_KEYS));

      for (const [key, value] of Object.entries(backup.data)) {
        if (validKeys.has(key)) {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
      }

      dataSummary = buildSummary();
      flash('Data restored successfully.', 'success');
    } catch {
      flash('Could not read that file. Make sure it is a valid backup.', 'error');
    }

    resetRestore();
  }

  function resetRestore() {
    showRestoreConfirm = false;
    restoreFile = null;
  }

  function clearAllData() {
    const allKeys = Object.values(STORAGE_KEYS);
    for (const key of allKeys) {
      localStorage.removeItem(key);
    }

    dataSummary = buildSummary();
    showClearConfirm = false;
    showClearFinal = false;
    flash('All data cleared.', 'success');
  }

  function flash(msg: string, type: 'success' | 'error') {
    statusMessage = msg;
    statusType = type;
    setTimeout(() => {
      statusMessage = '';
      statusType = '';
    }, 4000);
  }
</script>

<div class="space-y-6">
  <!-- Status message -->
  {#if statusMessage}
    <div
      class="rounded-xl px-4 py-3 text-sm font-medium"
      class:bg-sage-50={statusType === 'success'}
      class:text-sage-700={statusType === 'success'}
      class:border-sage-200={statusType === 'success'}
      class:bg-berry-50={statusType === 'error'}
      class:text-berry-700={statusType === 'error'}
      class:border-berry-200={statusType === 'error'}
      class:border={true}
      role="status"
    >
      {statusMessage}
    </div>
  {/if}

  <!-- Data summary -->
  <div class="rounded-xl border border-stone-200 bg-stone-50 p-4">
    <h3 class="text-sm font-semibold mb-3">Your data on this device</h3>

    {#if dataSummary.totalKeys === 0}
      <p class="text-sm text-text-muted">No saved data yet. As you use the app, your data stays here on your device.</p>
    {:else}
      <div class="grid grid-cols-2 gap-2 text-sm">
        {#if dataSummary.checkins > 0}
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-berry-400"></span>
            <span>{dataSummary.checkins} check-in{dataSummary.checkins === 1 ? '' : 's'}</span>
          </div>
        {/if}
        {#if dataSummary.savingsGoals > 0}
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-sage-400"></span>
            <span>{dataSummary.savingsGoals} savings goal{dataSummary.savingsGoals === 1 ? '' : 's'}</span>
          </div>
        {/if}
        {#if dataSummary.budgetMonths > 0}
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-clay-400"></span>
            <span>{dataSummary.budgetMonths} month{dataSummary.budgetMonths === 1 ? '' : 's'} of budget data</span>
          </div>
        {/if}
        {#if dataSummary.hasDebtPlan}
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-berry-400"></span>
            <span>Debt payoff plan</span>
          </div>
        {/if}
        {#if dataSummary.hasNetWorth}
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-water-400"></span>
            <span>Net worth data</span>
          </div>
        {/if}
        {#if dataSummary.hasCalendar}
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-stone-400"></span>
            <span>Calendar profile</span>
          </div>
        {/if}
        {#if dataSummary.hasSection87}
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-water-400"></span>
            <span>Section 87 result</span>
          </div>
        {/if}
        {#if dataSummary.hasBenefits}
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-sage-400"></span>
            <span>Benefits results</span>
          </div>
        {/if}
        {#if dataSummary.hasDistribution}
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-clay-400"></span>
            <span>Distribution plan</span>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Export -->
  <div>
    <button
      onclick={exportData}
      class="w-full rounded-xl bg-stone-800 text-white px-4 py-3 text-sm font-semibold
        hover:bg-stone-700 active:scale-[0.98] transition-all duration-[var(--duration-normal)] cursor-pointer"
    >
      Download my data
    </button>
    <p class="text-xs text-text-muted mt-1.5 px-1">
      Saves a backup file to your device. Nothing is sent anywhere.
    </p>
  </div>

  <!-- Restore -->
  <div>
    <label
      class="block w-full rounded-xl border-2 border-dashed border-stone-300 text-center
        px-4 py-3 text-sm font-semibold text-stone-600 cursor-pointer
        hover:border-stone-400 hover:bg-stone-50 active:scale-[0.98]
        transition-all duration-[var(--duration-normal)]"
    >
      Restore from backup
      <input type="file" accept=".json" onchange={handleFileSelect} class="hidden" />
    </label>
  </div>

  <!-- Restore confirmation -->
  {#if showRestoreConfirm}
    <div class="rounded-xl border border-clay-200 bg-clay-50 p-4">
      <p class="text-sm font-semibold mb-1">This will replace your current data.</p>
      <p class="text-sm text-text-muted mb-3">
        Any existing check-ins, goals, and saved results will be overwritten with the backup.
      </p>
      <div class="flex gap-2">
        <button
          onclick={restoreData}
          class="flex-1 rounded-lg bg-clay-600 text-white px-3 py-2 text-sm font-medium
            hover:bg-clay-700 active:scale-[0.98] transition-all cursor-pointer"
        >
          Continue
        </button>
        <button
          onclick={resetRestore}
          class="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium
            hover:bg-stone-50 active:scale-[0.98] transition-all cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  {/if}

  <!-- Clear all data -->
  <div class="pt-4 border-t border-stone-200">
    {#if !showClearConfirm && !showClearFinal}
      <button
        onclick={() => showClearConfirm = true}
        class="w-full rounded-xl border border-berry-200 text-berry-600 px-4 py-3
          text-sm font-medium hover:bg-berry-50 active:scale-[0.98]
          transition-all duration-[var(--duration-normal)] cursor-pointer"
      >
        Clear all data
      </button>
    {:else if showClearConfirm && !showClearFinal}
      <div class="rounded-xl border border-berry-200 bg-berry-50 p-4">
        <p class="text-sm font-semibold text-berry-700 mb-1">Are you sure?</p>
        <p class="text-sm text-text-muted mb-3">
          This will remove all your check-ins, savings goals, budgets, and saved results.
        </p>
        <div class="flex gap-2">
          <button
            onclick={() => showClearFinal = true}
            class="flex-1 rounded-lg bg-berry-600 text-white px-3 py-2 text-sm font-medium
              hover:bg-berry-700 active:scale-[0.98] transition-all cursor-pointer"
          >
            Yes, continue
          </button>
          <button
            onclick={() => { showClearConfirm = false; showClearFinal = false; }}
            class="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium
              hover:bg-stone-50 active:scale-[0.98] transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    {:else}
      <div class="rounded-xl border border-berry-300 bg-berry-100 p-4">
        <p class="text-sm font-bold text-berry-800 mb-1">This cannot be undone.</p>
        <p class="text-sm text-berry-700 mb-3">
          Once cleared, your data is gone. Download a backup first if you want to keep it.
        </p>
        <div class="flex gap-2">
          <button
            onclick={clearAllData}
            class="flex-1 rounded-lg bg-berry-700 text-white px-3 py-2 text-sm font-medium
              hover:bg-berry-800 active:scale-[0.98] transition-all cursor-pointer"
          >
            Clear everything
          </button>
          <button
            onclick={() => { showClearConfirm = false; showClearFinal = false; }}
            class="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium
              hover:bg-stone-50 active:scale-[0.98] transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
