<script lang="ts">
  interface Props {
    title: string;
    subtitle?: string;
    branch?: 'money' | 'rights' | 'path' | 'self' | 'home';
    backHref?: string;
    backLabel?: string;
  }

  // `branch` is accepted for compatibility but no longer tints the header —
  // colour on this site carries meaning, and a section is not a meaning.
  let { title, subtitle, backHref, backLabel = 'Back' }: Props = $props();
</script>

<header class="pt-6 md:pt-14 pb-4 md:pb-6 px-5 md:px-0">
  {#if backHref}
    <a
      href={backHref}
      class="apparatus-label inline-flex items-center gap-1 mb-4 hover:text-ink transition-colors"
    >
      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {backLabel}
    </a>
  {/if}

  <h1 class="text-3xl md:text-4xl font-semibold tracking-[-0.022em] max-w-2xl">{title}</h1>
  {#if subtitle}
    <p class="text-quiet mt-2 md:mt-3 leading-relaxed max-w-md md:max-w-xl md:text-lg">{subtitle}</p>
  {/if}
</header>
