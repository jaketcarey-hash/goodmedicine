<script lang="ts">
  import { saveCheckIn } from '../lib/wellness-store';
  import { fly, fade } from 'svelte/transition';

  interface Props {
    onComplete: () => void;
    onCancel: () => void;
  }

  let { onComplete, onCancel }: Props = $props();

  // Steps: feeling → areas → reflection → gratitude → done
  let step = $state(0);
  let feeling = $state(0);
  let areas = $state<string[]>([]);
  let reflection = $state('');
  let gratitude = $state('');

  const feelings = [
    { value: 1, label: 'Stressed', emoji: '1', color: 'bg-berry-100 text-berry-700 border-berry-300', selected: 'bg-berry-500 text-white border-berry-500' },
    { value: 2, label: 'Uneasy', emoji: '2', color: 'bg-clay-100 text-clay-700 border-clay-300', selected: 'bg-clay-500 text-white border-clay-500' },
    { value: 3, label: 'Steady', emoji: '3', color: 'bg-stone-100 text-stone-700 border-stone-300', selected: 'bg-stone-500 text-white border-stone-500' },
    { value: 4, label: 'Good', emoji: '4', color: 'bg-water-100 text-water-700 border-water-300', selected: 'bg-water-500 text-white border-water-500' },
    { value: 5, label: 'Strong', emoji: '5', color: 'bg-sage-100 text-sage-700 border-sage-300', selected: 'bg-sage-500 text-white border-sage-500' },
  ];

  const areaOptions = [
    'Bills & expenses',
    'Income & work',
    'Debt',
    'Saving',
    'Family support',
    'Benefits & rights',
    'Housing',
    'Education costs',
    'Future planning',
    'General stress',
  ];

  function toggleArea(area: string) {
    if (areas.includes(area)) {
      areas = areas.filter((a) => a !== area);
    } else {
      areas = [...areas, area];
    }
  }

  function next() {
    if (step < 4) step++;
  }

  function back() {
    if (step > 0) step--;
  }

  function finish() {
    saveCheckIn({ feeling, areas, reflection, gratitude });
    step = 4;
    setTimeout(onComplete, 2000);
  }

  function canProceed(): boolean {
    if (step === 0) return feeling > 0;
    if (step === 1) return true; // areas optional
    if (step === 2) return true; // reflection optional
    if (step === 3) return true; // gratitude optional
    return false;
  }
</script>

<div class="rounded-2xl bg-surface-card border border-stone-200 overflow-hidden shadow-lg">
  <!-- Progress bar -->
  <div class="h-1 bg-stone-100">
    <div
      class="h-full bg-gradient-to-r from-berry-400 to-sage-400 transition-all duration-500 ease-[var(--ease-out)]"
      style="width: {((step + 1) / 5) * 100}%"
    ></div>
  </div>

  <div class="p-6">
    <!-- Step 0: How are you feeling? -->
    {#if step === 0}
      <div in:fly={{ y: 20, duration: 300 }}>
        <p class="text-sm text-text-muted mb-1">Step 1 of 4</p>
        <h3 class="text-xl font-semibold mb-2">How are you feeling about money right now?</h3>
        <p class="text-sm text-text-secondary mb-6">No right answer. Just honest.</p>

        <div class="flex gap-2">
          {#each feelings as f}
            <button
              onclick={() => feeling = f.value}
              class="flex-1 py-3 px-1 rounded-xl border-2 text-center transition-all duration-200
                {feeling === f.value ? f.selected : f.color + ' border-transparent'}
                hover:shadow-sm active:scale-95 cursor-pointer"
            >
              <span class="block text-lg font-bold">{f.value}</span>
              <span class="block text-[10px] font-medium mt-0.5 leading-tight">{f.label}</span>
            </button>
          {/each}
        </div>
      </div>

    <!-- Step 1: What's on your mind? -->
    {:else if step === 1}
      <div in:fly={{ y: 20, duration: 300 }}>
        <p class="text-sm text-text-muted mb-1">Step 2 of 4</p>
        <h3 class="text-xl font-semibold mb-2">What's on your mind?</h3>
        <p class="text-sm text-text-secondary mb-5">Pick any that apply — or skip this.</p>

        <div class="flex flex-wrap gap-2">
          {#each areaOptions as area}
            <button
              onclick={() => toggleArea(area)}
              class="px-3.5 py-2 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer
                {areas.includes(area)
                  ? 'bg-berry-500 text-white border-berry-500'
                  : 'bg-surface-warm text-text-secondary border-stone-200 hover:border-stone-300'}"
            >
              {area}
            </button>
          {/each}
        </div>
      </div>

    <!-- Step 2: Reflection -->
    {:else if step === 2}
      <div in:fly={{ y: 20, duration: 300 }}>
        <p class="text-sm text-text-muted mb-1">Step 3 of 4</p>
        <h3 class="text-xl font-semibold mb-2">Anything you want to say?</h3>
        <p class="text-sm text-text-secondary mb-5">This stays on your device. Say whatever's real.</p>

        <textarea
          bind:value={reflection}
          placeholder="Whatever comes to mind..."
          rows="4"
          class="w-full rounded-xl border border-stone-200 bg-surface-warm p-4 text-sm
            placeholder:text-stone-400 focus:border-berry-300 focus:ring-1 focus:ring-berry-200
            focus:outline-none resize-none transition-colors"
        ></textarea>
      </div>

    <!-- Step 3: Gratitude -->
    {:else if step === 3}
      <div in:fly={{ y: 20, duration: 300 }}>
        <p class="text-sm text-text-muted mb-1">Step 4 of 4</p>
        <h3 class="text-xl font-semibold mb-2">One thing you're grateful for</h3>
        <p class="text-sm text-text-secondary mb-5">Big or small. Financial or not.</p>

        <input
          type="text"
          bind:value={gratitude}
          placeholder="e.g., My sister helped with groceries"
          class="w-full rounded-xl border border-stone-200 bg-surface-warm px-4 py-3.5 text-sm
            placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
            focus:outline-none transition-colors"
        />
      </div>

    <!-- Step 4: Complete -->
    {:else if step === 4}
      <div in:fade={{ duration: 400 }} class="text-center py-4">
        <div class="w-14 h-14 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-4">
          <svg class="w-7 h-7 text-sage-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <p class="text-xl font-semibold mb-1">Noted.</p>
        <p class="text-sm text-text-secondary">Thanks for checking in with yourself today.</p>
      </div>
    {/if}

    <!-- Navigation -->
    {#if step < 4}
      <div class="flex items-center justify-between mt-6 pt-4 border-t border-stone-100">
        <button
          onclick={step === 0 ? onCancel : back}
          class="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </button>

        <button
          onclick={step === 3 ? finish : next}
          disabled={!canProceed()}
          class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
            {canProceed()
              ? 'bg-stone-900 text-white hover:bg-stone-800 active:scale-95'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'}"
        >
          {step === 3 ? 'Finish' : 'Continue'}
        </button>
      </div>
    {/if}
  </div>
</div>
