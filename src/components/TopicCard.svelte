<script lang="ts">
  interface Props {
    href: string;
    title: string;
    description: string;
    branch: 'money' | 'rights' | 'path' | 'self';
    readTime?: string;
  }

  let { href, title, description, branch, readTime }: Props = $props();

  const borders: Record<string, string> = {
    money: 'hover:border-clay-300',
    rights: 'hover:border-water-300',
    path: 'hover:border-sage-300',
    self: 'hover:border-berry-300',
  };

  const dots: Record<string, string> = {
    money: 'bg-clay-400',
    rights: 'bg-water-400',
    path: 'bg-sage-400',
    self: 'bg-berry-400',
  };
</script>

<a
  {href}
  class="group block rounded-xl bg-surface-card border border-stone-200 {borders[branch]}
    p-4 transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]
    hover:shadow-sm active:scale-[0.98]"
>
  <div class="flex items-start gap-3">
    <span class="w-2 h-2 rounded-full {dots[branch]} mt-2 flex-shrink-0"></span>
    <div class="flex-1 min-w-0">
      <h4 class="font-semibold leading-snug mb-0.5 group-hover:text-stone-700 transition-colors">{title}</h4>
      <p class="text-sm text-text-muted leading-relaxed line-clamp-2">{description}</p>
      {#if readTime}
        <span class="text-xs text-text-muted mt-2 inline-block">{readTime} read</span>
      {/if}
    </div>
    <svg class="w-4 h-4 text-stone-300 group-hover:text-stone-500 mt-1 flex-shrink-0 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  </div>
</a>
