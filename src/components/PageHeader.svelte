<script lang="ts">
  interface Props {
    title: string;
    subtitle?: string;
    branch?: 'money' | 'rights' | 'path' | 'self' | 'home';
    backHref?: string;
    backLabel?: string;
  }

  let { title, subtitle, branch = 'home', backHref, backLabel = 'Back' }: Props = $props();

  const accentBg: Record<string, string> = {
    money: 'from-clay-50/80',
    rights: 'from-water-50/80',
    path: 'from-sage-50/80',
    self: 'from-berry-50/80',
    home: 'from-stone-50/80',
  };

  const accentText: Record<string, string> = {
    money: 'text-clay-600',
    rights: 'text-water-600',
    path: 'text-sage-600',
    self: 'text-berry-600',
    home: 'text-stone-600',
  };
</script>

<header class="pt-6 md:pt-14 pb-4 md:pb-6 px-5 md:px-0 bg-gradient-to-b {accentBg[branch]} to-transparent">
  {#if backHref}
    <a
      href={backHref}
      class="inline-flex items-center gap-1.5 text-sm {accentText[branch]} mb-3 hover:opacity-70 transition-opacity"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {backLabel}
    </a>
  {/if}

  <h1 class="text-3xl md:text-4xl font-bold tracking-tight max-w-2xl">{title}</h1>
  {#if subtitle}
    <p class="text-text-secondary mt-2 md:mt-3 leading-relaxed max-w-md md:max-w-xl md:text-lg">{subtitle}</p>
  {/if}
</header>
