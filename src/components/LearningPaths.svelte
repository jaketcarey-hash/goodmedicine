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

  // A tool step counts as done when it is opened from the path — using the
  // tool is the completion. Fires before navigation; progress only goes up.
  function handleStepClick(pathId: string, step: { path: string; kind?: string }, alreadyDone: boolean) {
    if (step.kind === 'tool' && !alreadyDone) {
      completePathStep(pathId, step.path);
    }
  }

  // Paths carry a `colour` in the data, but branch tinting is gone — colour on
  // this site carries meaning, and a path is not a meaning. Completion speaks
  // in `verified`, always beside a label that says the same thing.

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
    {@const completed = stepsComplete(path)}
    {@const total = path.steps.length}
    {@const done = completed === total}
    {@const isActive = activePath === path.id}
    {@const isExpanded = expandedPath === path.id}
    {@const remaining = remainingMinutes(path)}
    {@const progress = getPathProgress(path.id)}
    {@const next = getNextStep(path.id, [...progress, ...completedArticles])}

    <div
      class="rounded-sm bg-white border transition-all duration-[var(--duration-normal)]
        {isActive ? 'border-ink shadow-md' : 'border-rule'}"
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
                <span class="text-[10px] font-semibold uppercase tracking-widest text-ink">Active path</span>
              {/if}
              {#if done}
                <span class="text-[10px] font-semibold uppercase tracking-widest text-verified">Complete</span>
              {/if}
            </div>
            <h3 class="text-lg font-semibold leading-snug">{path.name}</h3>
            <p class="text-sm text-text-muted mt-1 leading-relaxed">{path.description}</p>
          </div>
          <div class="flex-shrink-0 mt-1">
            <svg
              class="w-5 h-5 text-faint transition-transform duration-[var(--duration-normal)]
                {isExpanded ? 'rotate-180' : ''}"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        <!-- Progress bar and stats -->
        <div class="mt-4 space-y-2">
          <div class="h-1.5 bg-rule overflow-hidden">
            <div
              class="h-full transition-all duration-[var(--duration-slow)] {done ? 'bg-verified' : 'bg-ink'}"
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
            onclick={() => handleStepClick(path.id, next, false)}
            class="inline-flex items-center gap-2 rounded-sm px-4 py-2.5 text-sm font-medium
              bg-ink text-ground transition-all duration-[var(--duration-normal)]
              hover:bg-ink/85 active:scale-[0.98]"
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
          <div class="border-t border-rule pt-4 mb-3"></div>

          {#each path.steps as step, i (step.path)}
            {@const stepDone = progress.includes(step.path) || completedArticles.includes(step.path)}
            {@const isCurrent = !stepDone && next?.path === step.path}

            <a
              href={step.path}
              onclick={() => handleStepClick(path.id, step, stepDone)}
              class="group flex items-center gap-3 rounded-sm p-3 -mx-1 transition-all duration-[var(--duration-normal)]
                {isCurrent ? 'border border-ink' : 'hover:bg-ground'}
                {stepDone ? 'opacity-70' : ''}"
            >
              <!-- Step indicator -->
              <div class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center
                {stepDone ? 'bg-verified-wash' : isCurrent ? 'bg-ink' : 'bg-ground border border-rule'}">
                {#if stepDone}
                  <svg class="w-4 h-4 text-verified" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                {:else}
                  <span class="text-xs font-medium {isCurrent ? 'text-ground' : 'text-faint'}">{i + 1}</span>
                {/if}
              </div>

              <!-- Step content -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium leading-snug
                  {stepDone ? 'line-through text-text-muted' : ''}">
                  {step.title}
                </p>
                <span class="text-xs text-text-muted">{step.kind === 'tool' ? `tool · ${step.estimatedMinutes} min` : `${step.estimatedMinutes} min`}</span>
              </div>

              <!-- Arrow for current -->
              {#if isCurrent}
                <svg class="w-4 h-4 text-ink flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
                class="w-full rounded-sm py-3 text-sm font-medium cursor-pointer
                  bg-ink text-ground
                  transition-all duration-[var(--duration-normal)]
                  hover:bg-ink/85 active:scale-[0.98]"
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
