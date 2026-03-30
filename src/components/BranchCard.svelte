<script lang="ts">
  interface Props {
    href: string;
    title: string;
    description: string;
    branch: 'money' | 'rights' | 'path' | 'self';
    icon?: string;
  }

  let { href, title, description, branch }: Props = $props();

  const gradients: Record<string, string> = {
    money: 'from-clay-50 to-clay-100 hover:from-clay-100 hover:to-clay-200',
    rights: 'from-water-50 to-water-100 hover:from-water-100 hover:to-water-200',
    path: 'from-sage-50 to-sage-100 hover:from-sage-100 hover:to-sage-200',
    self: 'from-berry-50 to-berry-100 hover:from-berry-100 hover:to-berry-200',
  };

  const accents: Record<string, string> = {
    money: 'bg-clay-500',
    rights: 'bg-water-500',
    path: 'bg-sage-500',
    self: 'bg-berry-500',
  };

  const iconColors: Record<string, string> = {
    money: 'text-clay-600',
    rights: 'text-water-600',
    path: 'text-sage-600',
    self: 'text-berry-600',
  };
</script>

<a
  {href}
  class="group relative block rounded-xl bg-gradient-to-br {gradients[branch]}
    p-5 transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]
    hover:shadow-md active:scale-[0.98] overflow-hidden"
>
  <!-- Accent bar -->
  <div class="absolute top-0 left-0 w-1 h-full {accents[branch]} rounded-l-xl"></div>

  <div class="flex items-start gap-4 pl-2">
    <!-- Icon -->
    <div class="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center flex-shrink-0 {iconColors[branch]}">
      {#if branch === 'money'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
          <circle cx="12" cy="12" r="9" />
          <path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.66 0-3 1-3 2.25S10.34 12.5 12 12.5s3 1 3 2.25S13.66 16 12 16c-1 0-2-.5-2.5-1.5" />
          <path d="M12 6.5v1.5m0 8v1.5" />
        </svg>
      {:else if branch === 'rights'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
          <path d="M12 3L2 8l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12.5l10 5 10-5" />
        </svg>
      {:else if branch === 'path'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
          <path d="M12 3c-1.5 3-4 5.5-4 9a4 4 0 008 0c0-3.5-2.5-6-4-9z" />
          <path d="M12 16v5" />
          <path d="M9 21h6" />
        </svg>
      {:else if branch === 'self'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
          <path d="M12 21a9 9 0 110-18 9 9 0 010 18z" />
          <path d="M12 3v18" />
          <path d="M3 12h18" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      {/if}
    </div>

    <div class="flex-1 min-w-0">
      <h3 class="text-lg font-semibold leading-tight mb-1">{title}</h3>
      <p class="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>

    <!-- Arrow -->
    <svg
      class="w-5 h-5 text-stone-400 group-hover:text-stone-600 group-hover:translate-x-0.5 transition-all duration-[var(--duration-normal)] flex-shrink-0 mt-1"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  </div>
</a>
