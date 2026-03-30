<script lang="ts">
  import { learningPaths, getNextStep, type LearningPath } from '../lib/learning-paths';
  import {
    getActivePath,
    getPathProgress,
    getCompletedArticles,
    startPath,
    completePathStep,
  } from '../lib/learning-store';

  let activePath = $state<string | null>(null);
  let completedArticles = $state<string[]>([]);
  let expandedPath = $state<string | null>(null);

  function refresh() {
    activePath = getActivePath();
    completedArticles = getCompletedArticles();
  }

  $effect(() => {
    refresh();
  });

  function stepsComplete(path: LearningPath): number {
    const progress = getPathProgress(path.id);
    return path.steps.filter((s) => progress.includes(s.path) || completedArticles.includes(s.path)).length;
  }

  function remainingMinutes(path: LearningPath): number {
    const progress = getPathProgress(path.id);
    return path.steps
      .filter((s) => !progress.includes(s.path) && !completedArticles.includes(s.path))
      .reduce((sum, s) => sum + s.estimatedMinutes, 0);
  }

  function isPathComplete(path: LearningPath): boolean {
    return stepsComplete(path) === path.steps.length;
  }

  function handleStart(pathId: string) {
    startPath(pathId);
    refresh();
  }

  function toggleExpand(pathId: string) {
    expandedPath = expandedPath === pathId ? null : pathId;
  }

  const colourMap: Record<string, { bg: string; border: string; text: string; bar: string; accent: string; dot: string }> = {
    clay:  { bg: 'bg-clay-50',  border: 'border-clay-200',  text: 'text-clay-600',  bar: 'bg-clay-400',  accent: 'bg-clay-500',  dot: 'bg-clay-400' },
    water: { bg: 'bg-water-50', border: 'border-water-200', text: 'text-water-600', bar: 'bg-water-400', accent: 'bg-water-500', dot: 'bg-water-400' },
    sage:  { bg: 'bg-sage-50',  border: 'border-sage-200',  text: 'text-sage-600',  bar: 'bg-sage-400',  accent: 'bg-sage-500',  dot: 'bg-sage-400' },
    berry: { bg: 'bg-berry-50', border: 'border-berry-200', text: 'text-berry-600', bar: 'bg-berry-400', accent: 'bg-berry-500', dot: 'bg-berry-400' },
  };

  // Sort: active path first, then incomplete, then complete
  let sortedPaths = $derived(
    [...learningPaths].sort((a, b) => {
      if (a.id === activePath) return -1;
      if (b.id === activePath) return 1;
      const aComplete = isPathComplete(a);
      const bComplete = isPathComplete(b);
      if (aComplete && !bComplete) return 1;
      if (!aComplete && bComplete) return -1;
      return 0;
    })
  );
</script>

<div class="space-y-4">
  {#each sortedPaths as path (path.id)}
    {@const colours = colourMap[path.colour]}
    {@const completed = stepsComplete(path)}
    {@const total = path.steps.length}
    {@const done = completed === total}
    {@const isActive = activePath === path.id}
    {@const isExpanded = expandedPath === path.id}
    {@const remaining = remainingMinutes(path)}
    {@const progress = getPathProgress(path.id)}
    {@const next = getNextStep(path.id, [...progress, ...completedArticles])}

    <div
      class="rounded-2xl bg-surface-card border transition-all duration-[var(--duration-normal)]
        {isActive ? colours.border + ' shadow-md' : 'border-stone-200'}"
    >
      <!-- Card header — tappable to expand -->
      <button
        onclick={() => toggleExpand(path.id)}
        class="w-full text-left p-5 cursor-pointer bg-transparent border-none"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              {#if isActive && !done}
                <span class="text-[10px] font-semibold uppercase tracking-widest {colours.text}">Active path</span>
              {/if}
              {#if done}
                <span class="text-[10px] font-semibold uppercase tracking-widest text-sage-600">Complete</span>
              {/if}
            </div>
            <h3 class="text-lg font-semibold leading-snug">{path.name}</h3>
            <p class="text-sm text-text-muted mt-1 leading-relaxed">{path.description}</p>
          </div>
          <div class="flex-shrink-0 mt-1">
            <svg
              class="w-5 h-5 text-stone-400 transition-transform duration-[var(--duration-normal)]
                {isExpanded ? 'rotate-180' : ''}"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        <!-- Progress bar and stats -->
        <div class="mt-4 space-y-2">
          <div class="h-1.5 rounded-full bg-stone-100 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-[var(--duration-slow)] {done ? 'bg-sage-400' : colours.bar}"
              style="width: {total > 0 ? (completed / total) * 100 : 0}%"
            ></div>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-xs text-text-muted">{completed} of {total} complete</span>
            {#if !done && remaining > 0}
              <span class="text-xs text-text-muted">~{remaining} min left</span>
            {/if}
          </div>
        </div>
      </button>

      <!-- Active path: continue button -->
      {#if isActive && !done && next && !isExpanded}
        <div class="px-5 pb-5 -mt-1">
          <a
            href={next.path}
            class="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium
              text-text-inverse {colours.accent} transition-all duration-[var(--duration-normal)]
              hover:opacity-90 active:scale-[0.98]"
          >
            Continue: {next.title}
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </a>
        </div>
      {/if}

      <!-- Expanded step list -->
      {#if isExpanded}
        <div class="px-5 pb-5 space-y-1">
          <div class="border-t border-stone-100 pt-4 mb-3"></div>

          {#each path.steps as step, i (step.path)}
            {@const stepDone = progress.includes(step.path) || completedArticles.includes(step.path)}
            {@const isCurrent = !stepDone && next?.path === step.path}

            <a
              href={step.path}
              class="group flex items-center gap-3 rounded-xl p-3 -mx-1 transition-all duration-[var(--duration-normal)]
                {isCurrent ? colours.bg + ' ' + colours.border + ' border' : 'hover:bg-stone-50'}
                {stepDone ? 'opacity-70' : ''}"
            >
              <!-- Step indicator -->
              <div class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center
                {stepDone ? 'bg-sage-100' : isCurrent ? colours.bg : 'bg-stone-100'}">
                {#if stepDone}
                  <svg class="w-4 h-4 text-sage-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                {:else}
                  <span class="text-xs font-medium {isCurrent ? colours.text : 'text-stone-400'}">{i + 1}</span>
                {/if}
              </div>

              <!-- Step content -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium leading-snug
                  {stepDone ? 'line-through text-text-muted' : ''}
                  {isCurrent ? colours.text : ''}">
                  {step.title}
                </p>
                <span class="text-xs text-text-muted">{step.estimatedMinutes} min</span>
              </div>

              <!-- Arrow for current -->
              {#if isCurrent}
                <svg class="w-4 h-4 {colours.text} flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              {/if}
            </a>
          {/each}

          <!-- Start / Continue button -->
          {#if !isActive && !done}
            <div class="pt-3">
              <button
                onclick={() => handleStart(path.id)}
                class="w-full rounded-xl py-3 text-sm font-medium cursor-pointer
                  {colours.bg} {colours.text} border {colours.border}
                  transition-all duration-[var(--duration-normal)]
                  hover:opacity-90 active:scale-[0.98]"
              >
                {completed > 0 ? 'Set as active path' : 'Start this path'}
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/each}
</div>
