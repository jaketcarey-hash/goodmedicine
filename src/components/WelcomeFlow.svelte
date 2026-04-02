<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { STORAGE_KEYS } from '../lib/storage-keys';

  let visible = $state(false);
  let screen = $state(1);
  let interests = $state<string[]>([]);

  // Only show if welcome hasn't been completed
  $effect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.WELCOME_COMPLETE)) {
        visible = true;
      }
    } catch { /* silent */ }
  });

  const options = [
    { id: 'money', label: 'Understanding my money', sub: 'Bills, budget, saving' },
    { id: 'rights', label: 'Learning my rights', sub: 'Section 87, NIHB, benefits' },
    { id: 'change', label: 'A big life change', sub: 'School, new job, moving' },
    { id: 'distribution', label: 'I got a distribution or settlement', sub: '' },
    { id: 'exploring', label: 'Just exploring', sub: '' },
  ];

  interface Recommendation {
    href: string;
    title: string;
  }

  const recommendationMap: Record<string, Recommendation[]> = {
    money: [
      { href: '/money/budget-tool', title: 'Budget Snapshot' },
      { href: '/money/savings-tracker', title: 'Savings Goals' },
    ],
    rights: [
      { href: '/rights/section-87-checker', title: 'Section 87 Checker' },
      { href: '/self/benefits', title: 'Benefits Finder' },
    ],
    change: [
      { href: '/tools/life-simulator', title: 'Life Change Simulator' },
      { href: '/path/leaving-home', title: 'Leaving Home' },
    ],
    distribution: [
      { href: '/tools/distribution-planner', title: 'Distribution Planner' },
      { href: '/tools/settlement-simulator', title: 'Settlement Simulator' },
    ],
    exploring: [
      { href: '/', title: 'Explore all branches' },
    ],
  };

  function toggleInterest(id: string) {
    if (interests.includes(id)) {
      interests = interests.filter((i) => i !== id);
    } else {
      interests = [...interests, id];
    }
  }

  function getRecommendations(): Recommendation[] {
    const selected = interests.length > 0 ? interests : ['exploring'];
    const seen = new Set<string>();
    const results: Recommendation[] = [];

    for (const id of selected) {
      const recs = recommendationMap[id] ?? [];
      for (const rec of recs) {
        if (!seen.has(rec.href)) {
          seen.add(rec.href);
          results.push(rec);
        }
        if (results.length >= 3) return results;
      }
    }

    return results;
  }

  function advance() {
    if (screen === 2) {
      try {
        localStorage.setItem(STORAGE_KEYS.WELCOME_INTERESTS, JSON.stringify(interests));
      } catch { /* silent */ }
    }
    screen += 1;
  }

  function complete() {
    try {
      localStorage.setItem(STORAGE_KEYS.WELCOME_COMPLETE, 'true');
    } catch { /* silent */ }
    visible = false;
  }
</script>

{#if visible}
  <div
    class="welcome-overlay"
    transition:fade={{ duration: 300 }}
    role="dialog"
    aria-modal="true"
    aria-label="Welcome to Strong Fire"
  >
    <div class="welcome-container">
      {#if screen === 1}
        <div
          class="welcome-screen"
          in:fly={{ x: 80, duration: 350 }}
          out:fly={{ x: -80, duration: 250 }}
        >
          <div class="welcome-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-clay-500">
              <path d="M12 3c-1.5 3-4 5.5-4 9a4 4 0 008 0c0-3.5-2.5-6-4-9z" />
              <path d="M12 16v5" />
              <path d="M9 21h6" />
            </svg>
          </div>
          <h1 class="welcome-title">Welcome to Strong Fire</h1>
          <p class="welcome-body">
            Free financial tools and knowledge for First Nations communities. No sign-up. No tracking. Everything stays on your device.
          </p>
          <button class="welcome-btn" onclick={advance}>Get started</button>
        </div>
      {:else if screen === 2}
        <div
          class="welcome-screen"
          in:fly={{ x: 80, duration: 350 }}
          out:fly={{ x: -80, duration: 250 }}
        >
          <h2 class="welcome-subtitle">What brought you here?</h2>
          <p class="welcome-hint">Pick one or more — this helps us show you the right tools first.</p>
          <div class="interest-grid">
            {#each options as option}
              <button
                class="interest-card"
                class:interest-card--active={interests.includes(option.id)}
                onclick={() => toggleInterest(option.id)}
                aria-pressed={interests.includes(option.id)}
              >
                <span class="interest-label">{option.label}</span>
                {#if option.sub}
                  <span class="interest-sub">{option.sub}</span>
                {/if}
              </button>
            {/each}
          </div>
          <button class="welcome-btn" onclick={advance}>Continue</button>
        </div>
      {:else if screen === 3}
        <div
          class="welcome-screen"
          in:fly={{ x: 80, duration: 350 }}
        >
          <h2 class="welcome-subtitle">You're all set</h2>
          <p class="welcome-hint">Here are some good starting points based on what you chose.</p>
          <div class="recs-list">
            {#each getRecommendations() as rec}
              <a href={rec.href} class="rec-link" onclick={complete}>
                <span>{rec.title}</span>
                <svg class="w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </a>
            {/each}
          </div>
          <button class="welcome-btn welcome-btn--secondary" onclick={complete}>Let's go</button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .welcome-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: var(--color-surface);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    overflow-y: auto;
  }

  .welcome-container {
    width: 100%;
    max-width: 24rem;
  }

  .welcome-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .welcome-badge {
    width: 4rem;
    height: 4rem;
    border-radius: 1rem;
    background: var(--color-clay-50);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .welcome-title {
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    font-weight: 700;
    line-height: 1.15;
    margin: 0 0 1rem;
    letter-spacing: -0.01em;
  }

  .welcome-subtitle {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: 600;
    line-height: 1.2;
    margin: 0 0 0.5rem;
  }

  .welcome-body {
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin: 0 0 2rem;
    max-width: 20rem;
  }

  .welcome-hint {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    line-height: 1.5;
    margin: 0 0 1.25rem;
    max-width: 20rem;
  }

  .welcome-btn {
    width: 100%;
    padding: 0.875rem 1.5rem;
    border: none;
    border-radius: 0.75rem;
    background: var(--color-stone-800);
    color: var(--color-text-inverse);
    font-family: var(--font-body);
    font-size: var(--text-base);
    font-weight: 600;
    cursor: pointer;
    transition: background 250ms;
    margin-top: 0.5rem;
  }

  .welcome-btn:hover {
    background: var(--color-stone-900);
  }

  .welcome-btn:active {
    transform: scale(0.98);
  }

  .welcome-btn--secondary {
    background: transparent;
    color: var(--color-text-secondary);
    border: 1px solid var(--color-stone-200);
  }

  .welcome-btn--secondary:hover {
    background: var(--color-stone-100);
  }

  .interest-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    margin-bottom: 1.5rem;
  }

  .interest-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.125rem;
    padding: 0.875rem 1rem;
    border: 1.5px solid var(--color-stone-200);
    border-radius: 0.75rem;
    background: var(--color-surface-card);
    cursor: pointer;
    transition: all 200ms;
    text-align: left;
    font-family: var(--font-body);
  }

  .interest-card:hover {
    border-color: var(--color-stone-300);
  }

  .interest-card--active {
    border-color: var(--color-clay-400);
    background: var(--color-clay-50);
  }

  .interest-label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .interest-sub {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .recs-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    margin-bottom: 1.5rem;
  }

  .rec-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1rem;
    border: 1px solid var(--color-stone-200);
    border-radius: 0.75rem;
    background: var(--color-surface-card);
    text-decoration: none;
    color: var(--color-text-primary);
    font-weight: 500;
    font-size: var(--text-sm);
    transition: all 200ms;
  }

  .rec-link:hover {
    border-color: var(--color-stone-300);
    background: var(--color-stone-50);
  }
</style>
