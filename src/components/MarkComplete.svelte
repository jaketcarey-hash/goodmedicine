<script lang="ts">
  import {
    isArticleComplete,
    markArticleComplete,
    completePathStep,
    getActivePath,
    getPathProgress,
    getCompletedArticles,
  } from '../lib/learning-store';
  import { getPathById, getNextStep, getPathsContaining } from '../lib/learning-paths';

  interface Props {
    pagePath: string;
  }

  let { pagePath }: Props = $props();

  let completed = $state(false);
  let justCompleted = $state(false);
  let activePath = $state<string | null>(null);
  let nextStep = $state<{ title: string; path: string } | null>(null);
  let pathJustFinished = $state(false);
  let finishedPathName = $state('');

  $effect(() => {
    completed = isArticleComplete(pagePath);
    activePath = getActivePath();
    computeNextStep();
  });

  function computeNextStep() {
    if (!activePath) {
      // Check if this article is in any path — show context even without an active path
      const paths = getPathsContaining(pagePath);
      if (paths.length > 0) {
        const path = paths[0];
        const progress = getPathProgress(path.id);
        const articles = getCompletedArticles();
        const combined = [...new Set([...progress, ...articles, pagePath])];
        const next = getNextStep(path.id, combined);
        nextStep = next ? { title: next.title, path: next.path } : null;
      }
      return;
    }

    const path = getPathById(activePath);
    if (!path) return;

    const progress = getPathProgress(activePath);
    const articles = getCompletedArticles();
    // Include current page as if already complete for "next" calculation
    const combined = [...new Set([...progress, ...articles, pagePath])];
    const next = getNextStep(activePath, combined);

    if (!next) {
      // This was the last step
      const allDone = path.steps.every((s) => combined.includes(s.path));
      if (allDone) {
        pathJustFinished = true;
        finishedPathName = path.name;
        nextStep = null;
      }
    } else {
      nextStep = { title: next.title, path: next.path };
    }
  }

  function handleComplete() {
    markArticleComplete(pagePath);

    // Also mark in active path if applicable
    if (activePath) {
      const path = getPathById(activePath);
      if (path && path.steps.some((s) => s.path === pagePath)) {
        completePathStep(activePath, pagePath);
      }
    }

    completed = true;
    justCompleted = true;
    computeNextStep();
  }
</script>

<div class="mt-10 mb-4">
  <div class="rounded-2xl border border-stone-200 bg-surface-card overflow-hidden
    transition-all duration-[var(--duration-normal)]
    {justCompleted ? 'border-sage-300 shadow-md' : ''}">

    {#if pathJustFinished && justCompleted}
      <!-- Path complete celebration -->
      <div class="p-6 text-center bg-gradient-to-br from-sage-50 to-water-50">
        <div class="w-14 h-14 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-4">
          <svg class="w-7 h-7 text-sage-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <p class="text-lg font-semibold mb-1">Path complete</p>
        <p class="text-sm text-text-secondary">
          You finished <strong>{finishedPathName}</strong>. That knowledge is yours now.
        </p>
        <a
          href="/learn"
          class="inline-block mt-4 rounded-xl px-5 py-2.5 text-sm font-medium
            bg-sage-500 text-text-inverse
            transition-all duration-[var(--duration-normal)]
            hover:opacity-90 active:scale-[0.98]"
        >
          Back to Learning Paths
        </a>
      </div>

    {:else if completed}
      <!-- Already completed / just marked complete -->
      <div class="p-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0
            {justCompleted ? 'animate-[scale-in_0.3s_var(--ease-spring)]' : ''}">
            <svg class="w-5 h-5 text-sage-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="font-medium text-sm">Completed</p>
            {#if justCompleted}
              <p class="text-xs text-text-muted mt-0.5">Nice work. That one's yours.</p>
            {/if}
          </div>
        </div>

        {#if nextStep}
          <a
            href={nextStep.path}
            class="mt-4 flex items-center justify-between gap-3 rounded-xl
              bg-stone-50 hover:bg-stone-100 p-4
              transition-all duration-[var(--duration-normal)] active:scale-[0.98]"
          >
            <div>
              <p class="text-xs text-text-muted">Next up</p>
              <p class="text-sm font-medium mt-0.5">{nextStep.title}</p>
            </div>
            <svg class="w-5 h-5 text-stone-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </a>
        {/if}
      </div>

    {:else}
      <!-- Not yet complete -->
      <div class="p-5">
        <button
          onclick={handleComplete}
          class="w-full rounded-xl py-3.5 text-sm font-medium cursor-pointer
            bg-sage-500 text-text-inverse border-none
            transition-all duration-[var(--duration-normal)]
            hover:bg-sage-600 active:scale-[0.98]"
        >
          Mark as complete
        </button>
        <p class="text-xs text-text-muted text-center mt-2.5">
          When you feel good about this topic, mark it done and move on.
        </p>
      </div>
    {/if}
  </div>
</div>

<style>
  @keyframes scale-in {
    0% { transform: scale(0.7); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
</style>
