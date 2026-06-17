<script lang="ts">
  import type { CarryAccent } from '../lib/carry-cards-data';

  interface Props {
    slug: string;
    title: string;
    setting: string;
    answer: string;
    accent: CarryAccent;
    published: boolean;
  }

  let { slug, title, setting, answer, accent, published }: Props = $props();

  const accentStyles: Record<CarryAccent, string> = {
    water: 'border-l-water-400',
    sage: 'border-l-sage-400',
    clay: 'border-l-clay-400',
    berry: 'border-l-berry-400',
  };

  const settingStyles: Record<CarryAccent, string> = {
    water: 'text-water-600',
    sage: 'text-sage-600',
    clay: 'text-clay-600',
    berry: 'text-berry-600',
  };
</script>

{#if published}
  <a
    href={`/rights/carry-cards/${slug}`}
    class="group block rounded-2xl border border-stone-200 border-l-[3px] bg-surface-card p-5
      transition-all duration-[var(--duration-normal)]
      hover:shadow-md hover:border-stone-300 active:scale-[0.98] {accentStyles[accent]}"
  >
    <p class="text-[11px] font-semibold tracking-widest uppercase {settingStyles[accent]}">{setting}</p>
    <p class="text-lg font-semibold leading-snug tracking-tight mt-1.5">{title}</p>
    <p class="text-sm text-text-secondary mt-2 leading-relaxed">{answer}</p>
    <div class="mt-3 flex items-center gap-1 text-xs text-stone-500 font-medium">
      <span>Open card</span>
      <svg class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    </div>
  </a>
{:else}
  <div
    class="block rounded-2xl border border-stone-200 border-l-[3px] border-l-stone-200 bg-stone-50/50 p-5 opacity-70"
    aria-disabled="true"
  >
    <p class="text-[11px] font-semibold tracking-widest uppercase text-stone-400">{setting}</p>
    <p class="text-lg font-semibold leading-snug tracking-tight text-stone-500 mt-1.5">{title}</p>
    <p class="text-xs text-stone-400 italic mt-3">Being written.</p>
  </div>
{/if}
