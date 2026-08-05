<script lang="ts">
  import { slide } from 'svelte/transition';

  interface Props {
    title: string;
    open?: boolean;
  }

  let { title, open = false }: Props = $props();
  let isOpen = $state(open);
</script>

<div class="border-b border-rule">
  <button
    onclick={() => isOpen = !isOpen}
    class="w-full flex items-center justify-between py-3.5 text-left cursor-pointer
      transition-colors duration-[var(--duration-fast)]"
    aria-expanded={isOpen}
  >
    <span class="font-medium text-[15px] pr-4">{title}</span>
    <svg
      class="w-4 h-4 text-faint flex-shrink-0 transition-transform duration-300 ease-[var(--ease-out)]"
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
    <div transition:slide={{ duration: 300 }} class="pb-4">
      <div class="pt-1">
        <slot />
      </div>
    </div>
  {/if}
</div>
