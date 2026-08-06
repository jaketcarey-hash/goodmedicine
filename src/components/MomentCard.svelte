<script lang="ts">
  import type { MomentTone } from '../lib/moments-data';

  interface Props {
    slug: string;
    cardPrompt: string;
    cardHint?: string;
    tone: MomentTone;
    published: boolean;
  }

  // `tone` is accepted for compatibility but no longer tints the card — colour
  // on this site carries meaning, and a mood is not a meaning.
  let { slug, cardPrompt, cardHint, published }: Props = $props();
</script>

{#if published}
  <a
    href={`/moments/${slug}`}
    class="group block rounded-sm border border-rule bg-white p-5 transition-all duration-[var(--duration-normal)]
      hover:shadow-md hover:border-quiet active:scale-[0.98]"
  >
    <p class="text-lg font-semibold leading-snug tracking-tight">{cardPrompt}</p>
    {#if cardHint}
      <p class="text-sm text-text-muted mt-1.5 leading-relaxed">{cardHint}</p>
    {/if}
    <div class="mt-3 flex items-center gap-1 text-xs text-quiet font-medium">
      <span>Come in</span>
      <svg class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    </div>
  </a>
{:else}
  <div
    class="block rounded-sm border border-rule bg-white p-5 opacity-70"
    aria-disabled="true"
  >
    <p class="text-lg font-semibold leading-snug tracking-tight text-quiet">{cardPrompt}</p>
    {#if cardHint}
      <p class="text-sm text-faint mt-1.5 leading-relaxed">{cardHint}</p>
    {/if}
    <p class="text-xs text-faint italic mt-3">Being written.</p>
  </div>
{/if}
