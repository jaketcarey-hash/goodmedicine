<script lang="ts">
  import { slide } from 'svelte/transition';
  import { GLOSSARY, CATEGORY_LABELS } from '../lib/glossary-data';
  import type { GlossaryEntry } from '../lib/glossary-data';

  type CategoryFilter = 'all' | GlossaryEntry['category'];

  let search = $state('');
  let activeCategory: CategoryFilter = $state('all');
  let expandedTerm: string | null = $state(null);

  const categories: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'general', label: 'General' },
    { key: 'indigenous', label: 'Indigenous Rights' },
    { key: 'canadian', label: 'Canadian Programs' },
  ];

  const filtered = $derived.by(() => {
    const query = search.toLowerCase().trim();
    return GLOSSARY.filter((entry) => {
      const matchesCategory = activeCategory === 'all' || entry.category === activeCategory;
      const matchesSearch =
        !query ||
        entry.term.toLowerCase().includes(query) ||
        entry.definition.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  });

  const grouped = $derived.by(() => {
    const groups: Record<string, GlossaryEntry[]> = {};
    for (const entry of filtered) {
      const letter = entry.term[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(entry);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  });

  function toggleTerm(term: string) {
    expandedTerm = expandedTerm === term ? null : term;
  }

  function scrollToTerm(term: string) {
    expandedTerm = term;
    // Small delay to allow expansion before scrolling
    requestAnimationFrame(() => {
      const el = document.getElementById(termId(term));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function termId(term: string): string {
    return 'term-' + term.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

</script>

<div class="flex flex-col gap-5">
  <!-- Search -->
  <div class="relative">
    <svg
      class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-faint pointer-events-none"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
    <input
      type="search"
      bind:value={search}
      placeholder="Search terms or definitions..."
      aria-label="Search glossary terms"
      class="w-full pl-11 pr-4 py-3 rounded-sm bg-white text-ink
        placeholder:text-faint text-sm border border-rule
        focus:border-ink focus:outline-none
        transition-all duration-[var(--duration-fast)]"
    />
  </div>

  <!-- Category tabs -->
  <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide" role="tablist" aria-label="Filter by category">
    {#each categories as cat}
      <button
        role="tab"
        aria-selected={activeCategory === cat.key}
        onclick={() => activeCategory = cat.key}
        class="flex-shrink-0 px-4 py-2 rounded-sm text-sm font-medium border
          transition-all duration-[var(--duration-fast)] cursor-pointer
          {activeCategory === cat.key
            ? 'bg-ink text-ground border-ink'
            : 'bg-white text-quiet border-rule hover:border-quiet'}"
      >
        {cat.label}
      </button>
    {/each}
  </div>

  <!-- Result count -->
  <p class="text-xs text-text-muted">
    Showing {filtered.length} of {GLOSSARY.length} terms
  </p>

  <!-- Terms list -->
  {#if filtered.length === 0}
    <div class="text-center py-12">
      <p class="text-text-muted text-sm">No terms match your search.</p>
      <button
        onclick={() => { search = ''; activeCategory = 'all'; }}
        class="mt-3 text-sm text-ink underline decoration-rule underline-offset-2 hover:decoration-ink transition-colors cursor-pointer"
      >
        Clear filters
      </button>
    </div>
  {:else}
    <div class="flex flex-col gap-1">
      {#each grouped as [letter, terms]}
        <!-- Letter header -->
        <div class="sticky top-0 z-10 pt-3 pb-1.5">
          <span class="text-xs font-semibold uppercase tracking-wider text-text-muted bg-surface px-1">
            {letter}
          </span>
          <div class="border-b border-rule mt-1"></div>
        </div>

        <!-- Term cards -->
        {#each terms as entry}
          {@const isOpen = expandedTerm === entry.term}
          <div id={termId(entry.term)} class="scroll-mt-16">
            <button
              onclick={() => toggleTerm(entry.term)}
              aria-expanded={isOpen}
              class="w-full text-left p-4 rounded-sm bg-white border border-rule
                transition-all duration-[var(--duration-fast)] cursor-pointer
                hover:border-quiet {isOpen ? 'border-quiet shadow-sm' : ''}"
            >
              <div class="flex items-center gap-2.5">
                <span class="font-semibold text-sm flex-1">{entry.term}</span>
                <svg
                  class="w-4 h-4 text-faint flex-shrink-0 transition-transform duration-300 ease-[var(--ease-out)]"
                  class:rotate-180={isOpen}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </button>

            {#if isOpen}
              <div transition:slide={{ duration: 250 }} class="px-4 pb-4 pt-1 -mt-2 rounded-b-sm bg-white border border-t-0 border-rule">
                <p class="text-sm text-text-secondary leading-relaxed mb-3">
                  {entry.definition}
                </p>

                <!-- Category label -->
                <span class="inline-block text-xs text-text-muted mb-3">
                  {CATEGORY_LABELS[entry.category]}
                </span>

                <!-- Related terms -->
                {#if entry.relatedTerms && entry.relatedTerms.length > 0}
                  <div class="flex flex-wrap gap-1.5 mb-3">
                    {#each entry.relatedTerms as related}
                      <button
                        onclick={() => scrollToTerm(related)}
                        class="px-2.5 py-1 rounded-sm text-xs font-medium
                          bg-white border border-rule text-quiet hover:border-quiet
                          transition-colors duration-[var(--duration-fast)] cursor-pointer"
                      >
                        {related}
                      </button>
                    {/each}
                  </div>
                {/if}

                <!-- Article link -->
                {#if entry.articleLink}
                  <a
                    href={entry.articleLink}
                    class="inline-flex items-center gap-1 text-sm text-ink font-medium underline decoration-rule underline-offset-2 hover:decoration-ink transition-colors"
                  >
                    Learn more
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      {/each}
    </div>
  {/if}
</div>

<style>
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
</style>
