<script lang="ts">
  import { getLastVisited } from '../lib/breadcrumb';

  let lastVisited = $state<{ path: string; title: string } | null>(null);

  $effect(() => {
    const data = getLastVisited();
    if (data && data.path !== '/' && data.path !== '/settings') {
      lastVisited = data;
    }
  });
</script>

{#if lastVisited}
  <a
    href={lastVisited.path}
    class="continue-strip"
  >
    <span class="continue-label">Continue:</span>
    <span class="continue-title">{lastVisited.title}</span>
    <svg class="continue-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
  </a>
{/if}

<style>
  .continue-strip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    background: var(--color-stone-100);
    text-decoration: none;
    color: var(--color-text-primary);
    transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .continue-strip:hover {
    background: var(--color-stone-200);
  }

  .continue-strip:active {
    transform: scale(0.98);
  }

  .continue-label {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .continue-title {
    font-size: var(--text-sm);
    font-weight: 600;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .continue-arrow {
    width: 1rem;
    height: 1rem;
    color: var(--color-stone-400);
    flex-shrink: 0;
  }
</style>
