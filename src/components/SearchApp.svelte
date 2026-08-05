<script lang="ts">
  /**
   * Site-wide search.
   *
   * Fetches one index built from the rendered site, so a single box reaches
   * articles, tools, glossary, brief editions and ledger records alike. The
   * index is precached by the service worker, which means search keeps working
   * with no connection — the same promise the rest of the app makes.
   *
   * Scoring is deliberately simple: a title hit beats an excerpt hit beats a
   * body hit, and every query word has to appear somewhere. Nothing here needs
   * a search library, and adding one would cost more bytes than the index.
   */
  import { onMount } from 'svelte';

  interface Entry {
    url: string;
    title: string;
    kind: string;
    label: string;
    excerpt: string;
    text: string;
  }

  let entries = $state<Entry[]>([]);
  let loading = $state(true);
  let failed = $state(false);
  let query = $state('');
  let kind = $state('all');
  let input: HTMLInputElement | null = $state(null);

  onMount(async () => {
    // Read ?q= so a search can be linked to or arrived at from the masthead.
    const params = new URLSearchParams(window.location.search);
    query = params.get('q') ?? '';

    try {
      const res = await fetch('/search-index.json');
      if (!res.ok) throw new Error(String(res.status));
      entries = (await res.json()).entries ?? [];
    } catch {
      failed = true;
    } finally {
      loading = false;
      input?.focus();
    }
  });

  // Keep the URL in step so a result list can be shared or reloaded.
  $effect(() => {
    if (loading) return;
    const url = new URL(window.location.href);
    if (query.trim()) url.searchParams.set('q', query.trim());
    else url.searchParams.delete('q');
    window.history.replaceState({}, '', url);
  });

  const kinds = $derived(
    [...new Set(entries.map((e) => e.kind))]
      .map((k) => ({ kind: k, label: entries.find((e) => e.kind === k)!.label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  function score(entry: Entry, words: string[]): number {
    const title = entry.title.toLowerCase();
    const excerpt = entry.excerpt.toLowerCase();
    let total = 0;

    for (const word of words) {
      if (title.includes(word)) total += 10;
      else if (excerpt.includes(word)) total += 4;
      else if (entry.text.includes(word)) total += 1;
      else return 0; // every word must appear somewhere
    }

    // A whole-phrase hit in the title is what someone usually means.
    if (words.length > 1 && title.includes(words.join(' '))) total += 15;
    return total;
  }

  const results = $derived.by(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];

    return entries
      .filter((e) => kind === 'all' || e.kind === kind)
      .map((e) => ({ entry: e, score: score(e, words) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
      .slice(0, 60);
  });

  /** Wrap query words in <mark> without letting page text inject markup. */
  function highlight(text: string, q: string): string {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const words = q.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return escaped;

    const pattern = words
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .sort((a, b) => b.length - a.length)
      .join('|');

    return escaped.replace(new RegExp(`(${pattern})`, 'gi'), '<mark>$1</mark>');
  }

  const tone: Record<string, string> = {
    ledger: 'text-cedar border-cedar/25 bg-cedar/5',
    brief: 'text-cedar border-cedar/25 bg-cedar/5',
    money: 'text-clay-700 border-clay-300 bg-clay-50',
    rights: 'text-water-700 border-water-300 bg-water-50',
    path: 'text-sage-700 border-sage-300 bg-sage-50',
    self: 'text-berry-700 border-berry-300 bg-berry-50',
  };
</script>

<div>
  <div class="flex flex-col sm:flex-row gap-2.5 mb-4">
    <label class="sr-only" for="site-search">Search Strong Fire</label>
    <input
      id="site-search"
      bind:this={input}
      bind:value={query}
      type="search"
      autocomplete="off"
      placeholder="Search everything — articles, tools, briefs, the ledger…"
      class="flex-1 text-base bg-surface-card border border-stone-300 rounded-lg px-4 py-3
        placeholder:text-text-muted focus:border-clay-400 focus:outline-none"
    />

    {#if kinds.length > 1}
      <select
        bind:value={kind}
        aria-label="Filter by section"
        class="text-sm bg-surface-card border border-stone-300 rounded-lg px-3 py-3
          focus:border-clay-400 focus:outline-none"
      >
        <option value="all">Everywhere</option>
        {#each kinds as k}
          <option value={k.kind}>{k.label}</option>
        {/each}
      </select>
    {/if}
  </div>

  {#if loading}
    <p class="text-sm text-text-muted py-8">Loading…</p>
  {:else if failed}
    <p class="text-sm text-text-secondary py-8">
      The search index could not be loaded. Everything is still reachable from the menu.
    </p>
  {:else if !query.trim()}
    <p class="text-sm text-text-muted py-8">
      {entries.length} pages to search — articles, tools, the glossary, every brief and every
      ledger record.
    </p>
  {:else if results.length === 0}
    <p class="text-sm text-text-secondary py-8">
      Nothing matches <strong>{query}</strong>.
      {#if kind !== 'all'}
        <button
          type="button"
          onclick={() => (kind = 'all')}
          class="text-clay-600 underline underline-offset-2">Search everywhere</button
        > instead?
      {/if}
    </p>
  {:else}
    <p class="text-xs text-text-muted mb-4" aria-live="polite">
      {results.length}{results.length === 60 ? '+' : ''}
      {results.length === 1 ? 'result' : 'results'}
    </p>

    <ol class="list-none pl-0 m-0 divide-y divide-stone-200">
      {#each results as { entry } (entry.url)}
        <li class="py-4">
          <a href={entry.url} class="group block">
            <div class="flex items-center gap-2.5 mb-1.5">
              <span
                class="text-[10px] font-semibold tracking-wide uppercase border rounded px-1.5 py-0.5
                  {tone[entry.kind] ?? 'text-stone-600 border-stone-300 bg-stone-50'}"
              >
                {entry.label}
              </span>
              <span class="text-[11px] text-text-muted truncate">{entry.url}</span>
            </div>

            <p class="font-semibold leading-snug group-hover:text-clay-700 transition-colors mb-1">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html highlight(entry.title, query)}
            </p>

            <p class="text-sm text-text-secondary leading-relaxed line-clamp-2">
              {@html highlight(entry.excerpt, query)}
            </p>
          </a>
        </li>
      {/each}
    </ol>
  {/if}
</div>

<style>
  :global(mark) {
    background-color: var(--color-clay-100);
    color: inherit;
    padding: 0 0.1em;
    border-radius: 2px;
  }
</style>
