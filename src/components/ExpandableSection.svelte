<script lang="ts">
  import { slide } from 'svelte/transition';

  interface Props {
    title: string;
    open?: boolean;
  }

  let { title, open = false }: Props = $props();
  let isOpen = $state(open);
</script>

<div class="rounded-xl border border-stone-200 overflow-hidden mb-4 bg-surface-card">
  <button
    onclick={() => isOpen = !isOpen}
    class="w-full flex items-center justify-between p-4 text-left cursor-pointer
      hover:bg-stone-50 transition-colors duration-[var(--duration-fast)]"
    aria-expanded={isOpen}
  >
    <span class="font-semibold text-sm pr-4">{title}</span>
    <svg
      class="w-5 h-5 text-stone-400 flex-shrink-0 transition-transform duration-300 ease-[var(--ease-out)]"
      class:rotate-180={isOpen}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  </button>

  {#if isOpen}
    <div transition:slide={{ duration: 300 }} class="px-4 pb-4 border-t border-stone-100">
      <div class="pt-3">
        <slot />
      </div>
    </div>
  {/if}
</div>
