<script lang="ts">
  interface Props {
    href: string;
    title: string;
    description: string;
    branch: 'money' | 'rights' | 'path' | 'self';
    readTime?: string;
  }

  // `branch` is accepted for compatibility but no longer tints the card —
  // colour on this site carries meaning, and a section is not a meaning.
  let { href, title, description, readTime }: Props = $props();
</script>

<a
  {href}
  class="group block rounded-sm bg-white border border-rule hover:border-quiet
    p-4 transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]
    hover:shadow-sm active:scale-[0.98]"
>
  <div class="flex items-start gap-3">
    <div class="flex-1 min-w-0">
      <h4 class="font-semibold leading-snug mb-0.5">{title}</h4>
      <p class="text-sm text-text-muted leading-relaxed line-clamp-2">{description}</p>
      {#if readTime}
        <span class="text-xs text-text-muted mt-2 inline-block">{readTime} read</span>
      {/if}
    </div>
    <svg class="w-4 h-4 text-faint group-hover:text-ink mt-1 flex-shrink-0 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  </div>
</a>
