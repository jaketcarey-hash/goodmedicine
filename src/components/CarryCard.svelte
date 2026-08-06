<script lang="ts">
  interface Props {
    slug: string;
    title: string;
    setting: string;
    answer: string;
    published: boolean;
  }

  let { slug, title, setting, answer, published }: Props = $props();
</script>

{#if published}
  <a
    href={`/rights/carry-cards/${slug}`}
    class="group block rounded-sm border border-rule bg-surface-card p-5
      transition-all duration-[var(--duration-normal)]
      hover:shadow-md hover:border-quiet active:scale-[0.98]"
  >
    <p class="text-[11px] font-semibold tracking-widest uppercase text-faint">{setting}</p>
    <p class="text-lg font-semibold leading-snug tracking-tight mt-1.5">{title}</p>
    <p class="text-sm text-text-secondary mt-2 leading-relaxed">{answer}</p>
    <div class="mt-3 flex items-center gap-1 text-xs text-quiet font-medium">
      <span>Open card</span>
      <svg class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    </div>
  </a>
{:else}
  <div
    class="block rounded-sm border border-rule bg-ground p-5 opacity-70"
    aria-disabled="true"
  >
    <p class="text-[11px] font-semibold tracking-widest uppercase text-faint">{setting}</p>
    <p class="text-lg font-semibold leading-snug tracking-tight text-quiet mt-1.5">{title}</p>
    <p class="text-xs text-faint italic mt-3">Being written.</p>
  </div>
{/if}
