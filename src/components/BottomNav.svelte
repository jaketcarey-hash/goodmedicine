<script lang="ts">
  interface Props {
    activeBranch?: string;
  }

  let { activeBranch = 'home' }: Props = $props();

  const tabs = [
    { id: 'home', label: 'Home', href: '/', icon: 'home' },
    { id: 'money', label: 'Money', href: '/money', icon: 'money' },
    { id: 'rights', label: 'Rights', href: '/rights', icon: 'rights' },
    { id: 'path', label: 'Path', href: '/path', icon: 'path' },
    { id: 'self', label: 'Self', href: '/self', icon: 'self' },
  ] as const;
</script>

<nav
  class="fixed bottom-0 left-0 right-0 z-50 bg-surface-card/90 backdrop-blur-lg border-t border-stone-200"
  style="padding-bottom: var(--safe-bottom, 0px);"
  aria-label="Main navigation"
>
  <div class="mx-auto max-w-lg flex items-stretch justify-around h-[var(--nav-height)]">
    {#each tabs as tab}
      <a
        href={tab.href}
        class="flex flex-col items-center justify-center gap-0.5 flex-1 relative group transition-colors duration-[var(--duration-normal)]
          {activeBranch === tab.id ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}"
        aria-current={activeBranch === tab.id ? 'page' : undefined}
      >
        <!-- Active indicator dot -->
        {#if activeBranch === tab.id}
          <span
            class="absolute top-1.5 w-1 h-1 rounded-full
              {tab.id === 'money' ? 'bg-clay-500' :
               tab.id === 'rights' ? 'bg-water-500' :
               tab.id === 'path' ? 'bg-sage-500' :
               tab.id === 'self' ? 'bg-berry-500' :
               'bg-stone-700'}"
          ></span>
        {/if}

        <!-- Icon -->
        <span class="w-6 h-6 flex items-center justify-center mt-1">
          {#if tab.icon === 'home'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[22px] h-[22px]">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
            </svg>
          {:else if tab.icon === 'money'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[22px] h-[22px]">
              <circle cx="12" cy="12" r="9" />
              <path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.66 0-3 1-3 2.25S10.34 12.5 12 12.5s3 1 3 2.25S13.66 16 12 16c-1 0-2-.5-2.5-1.5" />
              <path d="M12 6.5v1.5m0 8v1.5" />
            </svg>
          {:else if tab.icon === 'rights'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[22px] h-[22px]">
              <path d="M12 3L2 8l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12.5l10 5 10-5" />
            </svg>
          {:else if tab.icon === 'path'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[22px] h-[22px]">
              <path d="M12 3c-1.5 3-4 5.5-4 9a4 4 0 008 0c0-3.5-2.5-6-4-9z" />
              <path d="M12 16v5" />
              <path d="M9 21h6" />
            </svg>
          {:else if tab.icon === 'self'}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="w-[22px] h-[22px]">
              <path d="M12 21a9 9 0 110-18 9 9 0 010 18z" />
              <path d="M12 3v18" />
              <path d="M3 12h18" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          {/if}
        </span>

        <span class="text-[11px] font-medium leading-none mt-0.5">{tab.label}</span>
      </a>
    {/each}
  </div>
</nav>
