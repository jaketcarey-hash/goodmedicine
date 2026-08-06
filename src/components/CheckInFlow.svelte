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

  // The scale's meaning lives in the labels, not in a colour ramp —
  // selection reads like every other control on the site.
  const feelings = [
    { value: 1, label: 'Stressed' },
    { value: 2, label: 'Uneasy' },
    { value: 3, label: 'Steady' },
    { value: 4, label: 'Good' },
    { value: 5, label: 'Strong' },
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

  // Next-step suggestions based on selected areas
  let suggestions = $derived(buildSuggestions(areas));

  function buildSuggestions(selectedAreas: string[]): { label: string; href: string }[] {
    const results: { label: string; href: string }[] = [];
    const set = new Set(selectedAreas);

    if (set.has('Bills & expenses') || set.has('Debt')) {
      results.push({ label: 'Build a budget', href: '/money/budget-tool' });
      results.push({ label: 'Make a debt plan', href: '/money/debt-planner' });
    }
    if (set.has('Benefits & rights')) {
      results.push({ label: 'Find your benefits', href: '/self/benefits' });
    }
    if (set.has('General stress')) {
      results.push({ label: 'Read about financial stress', href: '/self/stress' });
    }
    if (set.has('Saving')) {
      results.push({ label: 'Track your savings', href: '/money/savings-tracker' });
    }

    // Deduplicate by href
    const seen = new Set<string>();
    return results.filter((r) => {
      if (seen.has(r.href)) return false;
      seen.add(r.href);
      return true;
    });
  }

  function finish() {
    saveCheckIn({ feeling, areas, reflection, gratitude });
    step = 4;
  }

  function canProceed(): boolean {
    if (step === 0) return feeling > 0;
    if (step === 1) return true; // areas optional
    if (step === 2) return true; // reflection optional
    if (step === 3) return true; // gratitude optional
    return false;
  }
</script>

<div class="rounded-sm bg-white border border-rule overflow-hidden shadow-lg">
  <!-- Progress bar -->
  <div class="h-1 bg-rule">
    <div
      class="h-full bg-ink transition-all duration-500 ease-[var(--ease-out)]"
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
              class="flex-1 py-3 px-1 rounded-sm border text-center transition-all duration-200
                {feeling === f.value
                  ? 'bg-ink text-ground border-ink'
                  : 'bg-white text-quiet border-rule hover:border-quiet'}
                active:scale-95 cursor-pointer"
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
              class="px-3.5 py-2 rounded-sm text-sm font-medium border transition-all duration-200 cursor-pointer
                {areas.includes(area)
                  ? 'bg-ink text-ground border-ink'
                  : 'bg-white text-quiet border-rule hover:border-quiet'}"
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
          class="w-full rounded-sm border border-rule bg-white p-4 text-sm
            placeholder:text-faint focus:border-ink
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
          class="w-full rounded-sm border border-rule bg-white px-4 py-3.5 text-sm
            placeholder:text-faint focus:border-ink
            focus:outline-none transition-colors"
        />
      </div>

    <!-- Step 4: Complete -->
    {:else if step === 4}
      <div in:fade={{ duration: 400 }} class="text-center py-4">
        <svg class="w-8 h-8 text-verified mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        <p class="text-xl font-semibold mb-1">Noted.</p>
        <p class="text-sm text-text-secondary mb-5">Thanks for checking in with yourself today.</p>

        <!-- Next-step suggestions -->
        {#if suggestions.length > 0}
          <div class="space-y-2 mb-5">
            <p class="text-xs text-text-muted">Based on what's on your mind:</p>
            {#each suggestions as suggestion}
              <a
                href={suggestion.href}
                class="block w-full px-4 py-2.5 rounded-sm text-sm font-medium text-left
                  bg-white border border-rule text-quiet
                  hover:border-quiet transition-colors"
              >
                {suggestion.label}
              </a>
            {/each}
          </div>
        {:else}
          <div class="mb-5">
            <a
              href="/"
              class="inline-block px-4 py-2.5 rounded-sm text-sm font-medium
                bg-white border border-rule text-quiet
                hover:border-quiet transition-colors"
            >
              Explore the app
            </a>
          </div>
        {/if}

        <button
          onclick={onComplete}
          class="px-6 py-2.5 rounded-sm text-sm font-semibold bg-ink text-ground
            hover:bg-ink/85 active:scale-95 transition-all cursor-pointer"
        >
          Done
        </button>
      </div>
    {/if}

    <!-- Navigation -->
    {#if step < 4}
      <div class="flex items-center justify-between mt-6 pt-4 border-t border-rule">
        <button
          onclick={step === 0 ? onCancel : back}
          class="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </button>

        <button
          onclick={step === 3 ? finish : next}
          disabled={!canProceed()}
          class="px-5 py-2.5 rounded-sm text-sm font-semibold transition-all duration-200 cursor-pointer
            {canProceed()
              ? 'bg-ink text-ground hover:bg-ink/85 active:scale-95'
              : 'bg-rule text-faint cursor-not-allowed'}"
        >
          {step === 3 ? 'Finish' : 'Continue'}
        </button>
      </div>
    {/if}
  </div>
</div>
