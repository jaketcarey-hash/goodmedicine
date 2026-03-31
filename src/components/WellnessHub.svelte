<script lang="ts">
  import { getTodayCheckIn, getStreak, getRecentCheckIns, getAverageFeeling } from '../lib/wellness-store';
  import CheckInFlow from './CheckInFlow.svelte';
  import WellnessHistory from './WellnessHistory.svelte';

  let showCheckIn = $state(false);
  let todayDone = $state(false);
  let streak = $state(0);
  let avgFeeling = $state<number | null>(null);
  let recentCount = $state(0);

  function refresh() {
    todayDone = getTodayCheckIn() !== null;
    streak = getStreak();
    avgFeeling = getAverageFeeling(7);
    recentCount = getRecentCheckIns(30).length;
  }

  $effect(() => {
    refresh();
  });

  function handleComplete() {
    showCheckIn = false;
    refresh();
  }

  const feelingLabels = ['', 'Stressed', 'Uneasy', 'Steady', 'Good', 'Strong'];
</script>

<div class="space-y-5">
  <!-- Check-in CTA or completion state -->
  {#if showCheckIn}
    <CheckInFlow onComplete={handleComplete} onCancel={() => showCheckIn = false} />
  {:else if todayDone}
    <div class="rounded-2xl bg-gradient-to-br from-sage-50 to-berry-50 p-6 text-center">
      <div class="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-3">
        <svg class="w-6 h-6 text-sage-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <p class="font-semibold text-lg mb-1">You've checked in today</p>
      <p class="text-sm text-text-secondary">Come back tomorrow to keep your streak going.</p>
    </div>
  {:else}
    <button
      onclick={() => showCheckIn = true}
      class="w-full rounded-2xl bg-gradient-to-br from-berry-500 to-berry-600 text-text-inverse
        p-6 text-left transition-all duration-[var(--duration-normal)]
        hover:shadow-lg active:scale-[0.98] cursor-pointer"
    >
      <p class="text-berry-100 text-sm font-medium mb-1">Daily check-in</p>
      <p class="text-xl font-semibold leading-snug">How are you feeling about money today?</p>
      <p class="text-berry-200 text-sm mt-2">Takes about 2 minutes. Private and on your device only.</p>
    </button>
  {/if}

  <!-- Stats strip -->
  {#if recentCount > 0}
    <div class="grid grid-cols-3 gap-3">
      <div class="rounded-xl bg-surface-card border border-stone-200 p-3.5 text-center">
        <p class="text-2xl font-bold text-berry-500">{streak}</p>
        <p class="text-xs text-text-muted mt-0.5">day streak</p>
      </div>
      <div class="rounded-xl bg-surface-card border border-stone-200 p-3.5 text-center">
        <p class="text-2xl font-bold text-water-500">{recentCount}</p>
        <p class="text-xs text-text-muted mt-0.5">check-ins</p>
      </div>
      <div class="rounded-xl bg-surface-card border border-stone-200 p-3.5 text-center">
        <p class="text-2xl font-bold text-sage-500">{avgFeeling ?? '—'}</p>
        <p class="text-xs text-text-muted mt-0.5">{avgFeeling ? feelingLabels[Math.round(avgFeeling)] : 'avg mood'}</p>
      </div>
    </div>
  {/if}

  <!-- Quick links -->
  <div class="space-y-2.5">
    <h3 class="text-xs font-semibold text-stone-400 tracking-widest uppercase">Wellness tools</h3>

    <a href="/self/stress" class="group flex items-center gap-3 rounded-xl bg-surface-card border border-stone-200 hover:border-berry-300 p-4 transition-all duration-[var(--duration-normal)]">
      <div class="w-9 h-9 rounded-lg bg-berry-50 flex items-center justify-center flex-shrink-0">
        <svg class="w-4.5 h-4.5 text-berry-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M8 15s1.5-2 4-2 4 2 4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      </div>
      <div class="flex-1">
        <p class="font-medium text-sm">Financial Trauma</p>
        <p class="text-xs text-text-muted">Understanding where it comes from, naming it, and beginning to heal</p>
      </div>
    </a>

    <a href="/self/confidence" class="group flex items-center gap-3 rounded-xl bg-surface-card border border-stone-200 hover:border-berry-300 p-4 transition-all duration-[var(--duration-normal)]">
      <div class="w-9 h-9 rounded-lg bg-sage-50 flex items-center justify-center flex-shrink-0">
        <svg class="w-4.5 h-4.5 text-sage-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
        </svg>
      </div>
      <div class="flex-1">
        <p class="font-medium text-sm">Building Confidence</p>
        <p class="text-xs text-text-muted">Small wins and steady progress</p>
      </div>
    </a>

    <a href="/self/conversations" class="group flex items-center gap-3 rounded-xl bg-surface-card border border-stone-200 hover:border-berry-300 p-4 transition-all duration-[var(--duration-normal)]">
      <div class="w-9 h-9 rounded-lg bg-water-50 flex items-center justify-center flex-shrink-0">
        <svg class="w-4.5 h-4.5 text-water-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      </div>
      <div class="flex-1">
        <p class="font-medium text-sm">Money Conversations</p>
        <p class="text-xs text-text-muted">Talking about money with family and community</p>
      </div>
    </a>
  </div>

  <!-- History -->
  {#if recentCount > 0}
    <WellnessHistory />
  {/if}
</div>
