<script lang="ts">
  import {
    type NetWorthItem,
    type NetWorthSnapshot,
    saveSnapshot,
    getSnapshots,
    getLatestSnapshot,
    deleteSnapshot,
    saveWorkingState,
    getWorkingState,
    calcNetWorth,
  } from '../lib/networth-store';
  import { fly, fade, slide } from 'svelte/transition';

  // ---- Asset/Debt categories ----
  const assetCategories = [
    { value: 'savings', label: 'Savings account' },
    { value: 'tfsa', label: 'TFSA' },
    { value: 'rrsp', label: 'RRSP' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'property', label: 'Property' },
    { value: 'other', label: 'Other' },
  ];

  const debtCategories = [
    { value: 'credit-card', label: 'Credit card' },
    { value: 'student-loan', label: 'Student loan' },
    { value: 'vehicle-loan', label: 'Vehicle loan' },
    { value: 'mortgage', label: 'Mortgage' },
    { value: 'personal-loan', label: 'Personal loan' },
    { value: 'other', label: 'Other' },
  ];

  // ---- State ----
  let assets = $state<NetWorthItem[]>([]);
  let debts = $state<NetWorthItem[]>([]);
  let snapshots = $state<NetWorthSnapshot[]>([]);

  // ---- Forms ----
  let showAssetForm = $state(false);
  let newAssetLabel = $state('');
  let newAssetAmount = $state('');
  let newAssetCategory = $state('savings');

  let showDebtForm = $state(false);
  let newDebtLabel = $state('');
  let newDebtAmount = $state('');
  let newDebtCategory = $state('credit-card');

  let editingAssetIndex = $state<number | null>(null);
  let editingDebtIndex = $state<number | null>(null);

  let showHistory = $state(false);

  // ---- Init ----
  $effect(() => {
    const working = getWorkingState();
    assets = working.assets;
    debts = working.debts;
    snapshots = getSnapshots();
  });

  // ---- Auto-save working state ----
  let initialized = $state(false);
  $effect(() => {
    const _ = JSON.stringify(assets) + JSON.stringify(debts);
    if (!initialized) {
      initialized = true;
      return;
    }
    saveWorkingState({ assets, debts });
  });

  // ---- Derived ----
  let totalAssets = $derived(assets.reduce((s, a) => s + a.amount, 0));
  let totalDebts = $derived(debts.reduce((s, d) => s + d.amount, 0));
  let netWorth = $derived(totalAssets - totalDebts);

  let lastSnapshot = $derived(snapshots.length > 0 ? snapshots[snapshots.length - 1] : null);
  let lastNetWorth = $derived(
    lastSnapshot ? calcNetWorth(lastSnapshot.assets, lastSnapshot.debts) : null,
  );
  let netWorthChange = $derived(
    lastNetWorth !== null ? netWorth - lastNetWorth : null,
  );

  // ---- Handlers ----
  function addAsset() {
    const amount = parseFloat(newAssetAmount);
    if (!newAssetLabel.trim() || isNaN(amount) || amount < 0) return;
    assets = [...assets, { label: newAssetLabel.trim(), amount, category: newAssetCategory }];
    newAssetLabel = '';
    newAssetAmount = '';
    newAssetCategory = 'savings';
    showAssetForm = false;
  }

  function removeAsset(index: number) {
    assets = assets.filter((_, i) => i !== index);
  }

  function addDebt() {
    const amount = parseFloat(newDebtAmount);
    if (!newDebtLabel.trim() || isNaN(amount) || amount < 0) return;
    debts = [...debts, { label: newDebtLabel.trim(), amount, category: newDebtCategory }];
    newDebtLabel = '';
    newDebtAmount = '';
    newDebtCategory = 'credit-card';
    showDebtForm = false;
  }

  function removeDebt(index: number) {
    debts = debts.filter((_, i) => i !== index);
  }

  function takeSnapshot() {
    if (assets.length === 0 && debts.length === 0) return;
    saveSnapshot(assets, debts);
    snapshots = getSnapshots();
  }

  function handleDeleteSnapshot(id: string) {
    deleteSnapshot(id);
    snapshots = getSnapshots();
  }

  function getCategoryLabel(value: string, type: 'asset' | 'debt'): string {
    const list = type === 'asset' ? assetCategories : debtCategories;
    return list.find((c) => c.value === value)?.label ?? value;
  }

  // ---- Formatting ----
  function fmt(n: number): string {
    return Math.abs(n).toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function snapshotNetWorth(s: NetWorthSnapshot): number {
    return calcNetWorth(s.assets, s.debts);
  }

  // ---- History bar chart helpers ----
  let historyMax = $derived(
    snapshots.length > 0
      ? Math.max(...snapshots.map((s) => Math.abs(snapshotNetWorth(s))), 1)
      : 1,
  );
</script>

<div class="space-y-5">
  <!-- Net worth banner -->
  <div class="rounded-2xl bg-gradient-to-br from-sage-50 to-water-50 p-5 text-center">
    <p class="text-xs text-text-muted mb-1">Net worth</p>
    <p class="text-3xl font-bold {netWorth >= 0 ? 'text-sage-600' : 'text-berry-600'}">
      {netWorth < 0 ? '-' : ''}${fmt(netWorth)}
    </p>
    {#if assets.length > 0 || debts.length > 0}
      <div class="flex justify-center gap-4 mt-2 text-xs text-text-muted">
        <span>Assets: ${fmt(totalAssets)}</span>
        <span>Debts: ${fmt(totalDebts)}</span>
      </div>
    {/if}
  </div>

  <!-- Visual bar: assets vs debts -->
  {#if totalAssets > 0 || totalDebts > 0}
    {@const maxBar = Math.max(totalAssets, totalDebts, 1)}
    <div class="space-y-2">
      <div class="flex items-center gap-2">
        <span class="text-xs text-text-muted w-12">Own</span>
        <div class="flex-1 h-4 bg-stone-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-sage-400 rounded-full transition-all duration-500"
            style="width: {(totalAssets / maxBar) * 100}%"
          ></div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-text-muted w-12">Owe</span>
        <div class="flex-1 h-4 bg-stone-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-berry-400 rounded-full transition-all duration-500"
            style="width: {(totalDebts / maxBar) * 100}%"
          ></div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Insight text -->
  {#if netWorthChange !== null && (assets.length > 0 || debts.length > 0)}
    <div class="rounded-xl bg-clay-50 border border-clay-200 px-4 py-3" in:fade={{ duration: 200 }}>
      <p class="text-sm text-clay-700 leading-relaxed">
        {#if netWorthChange > 0}
          Your net worth increased by ${fmt(netWorthChange)} since your last snapshot. Heading in the right direction.
        {:else if netWorthChange < 0}
          Your net worth decreased by ${fmt(Math.abs(netWorthChange))} since your last snapshot. Life happens — what matters is the long view.
        {:else}
          Your net worth is the same as your last snapshot. Steady ground.
        {/if}
      </p>
    </div>
  {/if}

  <!-- Assets section -->
  <section>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-xs font-semibold text-stone-400 tracking-widest uppercase">Assets</h3>
      {#if assets.length > 0}
        <p class="text-sm font-medium text-sage-600">${fmt(totalAssets)}</p>
      {/if}
    </div>

    {#if assets.length > 0}
      <div class="space-y-2 mb-3">
        {#each assets as item, index (index)}
          <div
            class="flex items-center gap-3 rounded-xl bg-surface-card border border-stone-200 px-4 py-3"
            in:fly={{ y: 10, duration: 200 }}
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{item.label}</p>
              <p class="text-xs text-text-muted">{getCategoryLabel(item.category, 'asset')}</p>
            </div>
            <p class="text-sm font-semibold text-sage-600 whitespace-nowrap">${fmt(item.amount)}</p>
            <button
              onclick={() => removeAsset(index)}
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

    {#if showAssetForm}
      <div class="rounded-xl bg-surface-warm border border-stone-200 p-4 space-y-3" in:slide={{ duration: 200 }}>
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label for="asset-label" class="block text-xs font-medium text-text-muted mb-1">What is it?</label>
            <input
              id="asset-label"
              type="text"
              bind:value={newAssetLabel}
              placeholder="e.g. Chequing account"
              class="w-full rounded-lg border border-stone-200 bg-surface-card px-3 py-2.5 text-sm
                placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
                focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label for="asset-amount" class="block text-xs font-medium text-text-muted mb-1">Value</label>
            <input
              id="asset-amount"
              type="number"
              inputmode="decimal"
              bind:value={newAssetAmount}
              placeholder="0"
              min="0"
              class="w-full rounded-lg border border-stone-200 bg-surface-card px-3 py-2.5 text-sm
                placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
                focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label for="asset-category" class="block text-xs font-medium text-text-muted mb-1">Type</label>
            <select
              id="asset-category"
              bind:value={newAssetCategory}
              class="w-full rounded-lg border border-stone-200 bg-surface-card px-3 py-2.5 text-sm
                focus:border-sage-300 focus:ring-1 focus:ring-sage-200
                focus:outline-none transition-colors cursor-pointer"
            >
              {#each assetCategories as cat}
                <option value={cat.value}>{cat.label}</option>
              {/each}
            </select>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            onclick={addAsset}
            class="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-stone-900 text-white
              hover:bg-stone-800 active:scale-95 transition-all cursor-pointer"
          >
            Add asset
          </button>
          <button
            onclick={() => { showAssetForm = false; newAssetLabel = ''; newAssetAmount = ''; }}
            class="px-4 py-2.5 rounded-xl text-sm text-text-muted hover:text-text-secondary
              transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    {:else}
      <button
        onclick={() => showAssetForm = true}
        class="w-full py-2.5 rounded-xl border-2 border-dashed border-stone-200 text-sm
          font-medium text-text-muted hover:border-sage-300 hover:text-sage-600
          transition-colors cursor-pointer"
      >
        + Add asset
      </button>
    {/if}
  </section>

  <!-- Debts section -->
  <section>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-xs font-semibold text-stone-400 tracking-widest uppercase">Debts</h3>
      {#if debts.length > 0}
        <p class="text-sm font-medium text-berry-600">${fmt(totalDebts)}</p>
      {/if}
    </div>

    {#if debts.length > 0}
      <div class="space-y-2 mb-3">
        {#each debts as item, index (index)}
          <div
            class="flex items-center gap-3 rounded-xl bg-surface-card border border-stone-200 px-4 py-3"
            in:fly={{ y: 10, duration: 200 }}
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{item.label}</p>
              <p class="text-xs text-text-muted">{getCategoryLabel(item.category, 'debt')}</p>
            </div>
            <p class="text-sm font-semibold text-berry-600 whitespace-nowrap">${fmt(item.amount)}</p>
            <button
              onclick={() => removeDebt(index)}
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

    {#if showDebtForm}
      <div class="rounded-xl bg-surface-warm border border-stone-200 p-4 space-y-3" in:slide={{ duration: 200 }}>
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label for="debt-label" class="block text-xs font-medium text-text-muted mb-1">What is it?</label>
            <input
              id="debt-label"
              type="text"
              bind:value={newDebtLabel}
              placeholder="e.g. Visa card"
              class="w-full rounded-lg border border-stone-200 bg-surface-card px-3 py-2.5 text-sm
                placeholder:text-stone-400 focus:border-berry-300 focus:ring-1 focus:ring-berry-200
                focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label for="debt-amount" class="block text-xs font-medium text-text-muted mb-1">Amount owed</label>
            <input
              id="debt-amount"
              type="number"
              inputmode="decimal"
              bind:value={newDebtAmount}
              placeholder="0"
              min="0"
              class="w-full rounded-lg border border-stone-200 bg-surface-card px-3 py-2.5 text-sm
                placeholder:text-stone-400 focus:border-berry-300 focus:ring-1 focus:ring-berry-200
                focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label for="debt-category" class="block text-xs font-medium text-text-muted mb-1">Type</label>
            <select
              id="debt-category"
              bind:value={newDebtCategory}
              class="w-full rounded-lg border border-stone-200 bg-surface-card px-3 py-2.5 text-sm
                focus:border-berry-300 focus:ring-1 focus:ring-berry-200
                focus:outline-none transition-colors cursor-pointer"
            >
              {#each debtCategories as cat}
                <option value={cat.value}>{cat.label}</option>
              {/each}
            </select>
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
            onclick={() => { showDebtForm = false; newDebtLabel = ''; newDebtAmount = ''; }}
            class="px-4 py-2.5 rounded-xl text-sm text-text-muted hover:text-text-secondary
              transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    {:else}
      <button
        onclick={() => showDebtForm = true}
        class="w-full py-2.5 rounded-xl border-2 border-dashed border-stone-200 text-sm
          font-medium text-text-muted hover:border-berry-300 hover:text-berry-600
          transition-colors cursor-pointer"
      >
        + Add debt
      </button>
    {/if}
  </section>

  <!-- Take snapshot -->
  {#if assets.length > 0 || debts.length > 0}
    <button
      onclick={takeSnapshot}
      class="w-full py-3 rounded-xl text-sm font-semibold bg-stone-900 text-white
        hover:bg-stone-800 active:scale-95 transition-all cursor-pointer"
    >
      Take snapshot
    </button>
    <p class="text-xs text-text-muted text-center -mt-2">
      Save a record of today's numbers to track changes over time.
    </p>
  {/if}

  <!-- Snapshot history -->
  {#if snapshots.length > 0}
    <section>
      <button
        onclick={() => showHistory = !showHistory}
        class="flex items-center justify-between w-full mb-3 cursor-pointer"
      >
        <h3 class="text-xs font-semibold text-stone-400 tracking-widest uppercase">History</h3>
        <svg
          class="w-4 h-4 text-stone-400 transition-transform duration-200 {showHistory ? 'rotate-180' : ''}"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {#if showHistory}
        <div class="space-y-2" in:slide={{ duration: 200 }}>
          {#each [...snapshots].reverse() as snapshot (snapshot.id)}
            {@const nw = snapshotNetWorth(snapshot)}
            {@const barWidth = historyMax > 0 ? (Math.abs(nw) / historyMax) * 100 : 0}
            <div class="rounded-xl bg-surface-card border border-stone-200 px-4 py-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-text-muted">{formatDate(snapshot.date)}</span>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold {nw >= 0 ? 'text-sage-600' : 'text-berry-600'}">
                    {nw < 0 ? '-' : ''}${fmt(nw)}
                  </span>
                  <button
                    onclick={() => handleDeleteSnapshot(snapshot.id)}
                    class="p-1 rounded text-stone-400 hover:text-berry-500 transition-colors cursor-pointer"
                    aria-label="Delete snapshot from {formatDate(snapshot.date)}"
                  >
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div class="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500 {nw >= 0 ? 'bg-sage-400' : 'bg-berry-400'}"
                  style="width: {barWidth}%"
                ></div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  <!-- Empty state -->
  {#if assets.length === 0 && debts.length === 0 && snapshots.length === 0}
    <div class="rounded-2xl bg-surface-card border border-stone-200 p-8 text-center">
      <div class="w-14 h-14 rounded-full bg-sage-50 flex items-center justify-center mx-auto mb-4">
        <svg class="w-7 h-7 text-sage-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="20" height="18" rx="2" />
          <path d="M2 9h20" />
          <path d="M10 3v18" />
        </svg>
      </div>
      <p class="text-lg font-semibold mb-2">Start with what you know</p>
      <p class="text-sm text-text-secondary mb-1">Add your assets and debts to see where you stand.</p>
      <p class="text-sm text-text-secondary">It doesn't have to be exact. Estimates are fine.</p>
    </div>
  {/if}

  <!-- Privacy note -->
  <p class="text-xs text-text-muted text-center pt-2 pb-4">
    Your net worth data stays on this device. Nothing is sent anywhere.
  </p>
</div>
