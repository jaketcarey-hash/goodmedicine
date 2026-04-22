<script lang="ts">
  import type { MomentTone } from '../lib/moments-data';

  interface Props {
    slug: string;
    cardPrompt: string;
    cardHint?: string;
    tone: MomentTone;
    published: boolean;
  }

  let { slug, cardPrompt, cardHint, tone, published }: Props = $props();

  const toneStyles: Record<MomentTone, string> = {
    heavy: 'from-stone-50 via-surface-warm to-water-50 border-stone-200',
    neutral: 'from-surface-warm via-stone-50 to-sage-50 border-stone-200',
    warm: 'from-clay-50 via-surface-warm to-berry-50 border-stone-200',
  };
</script>

{#if published}
  <a
    href={`/moments/${slug}`}
    class="group block rounded-2xl border bg-gradient-to-br p-5 transition-all duration-[var(--duration-normal)]
      hover:shadow-md hover:border-stone-300 active:scale-[0.98] {toneStyles[tone]}"
  >
    <p class="text-lg font-semibold leading-snug tracking-tight">{cardPrompt}</p>
    {#if cardHint}
      <p class="text-sm text-text-muted mt-1.5 leading-relaxed">{cardHint}</p>
    {/if}
    <div class="mt-3 flex items-center gap-1 text-xs text-stone-500 font-medium">
      <span>Come in</span>
      <svg class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    </div>
  </a>
{:else}
  <div
    class="block rounded-2xl border border-stone-200 bg-stone-50/50 p-5 opacity-70"
    aria-disabled="true"
  >
    <p class="text-lg font-semibold leading-snug tracking-tight text-stone-500">{cardPrompt}</p>
    {#if cardHint}
      <p class="text-sm text-stone-400 mt-1.5 leading-relaxed">{cardHint}</p>
    {/if}
    <p class="text-xs text-stone-400 italic mt-3">Being written.</p>
  </div>
{/if}
