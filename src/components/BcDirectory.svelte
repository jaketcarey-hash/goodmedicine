<script lang="ts">
  /**
   * The BC directory, searchable by name, People/Nation or Tribal Council.
   *
   * 201 rows is too many to scan and small enough to filter in the browser.
   * Search matches diacritic-folded text so someone typing "Gitxaala" finds
   * Gitxaała and someone typing the name properly finds it too.
   */
  interface Row {
    name: string;
    slug: string;
    people: string | null;
    tribalCouncil: string | null;
    bandNumber: number;
    tracked: number;
  }

  interface Props {
    nations: Row[];
  }

  let { nations }: Props = $props();

  let query = $state('');
  let people = $state('all');
  let trackedOnly = $state(false);

  const fold = (v: string) =>
    v
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[łŁ]/g, 'l')
      .replace(/[ʔ’'ʼ`]/g, '')
      .toLowerCase();

  const peoples = $derived(
    [...new Set(nations.map((n) => n.people).filter(Boolean) as string[])].sort((a, b) =>
      a.localeCompare(b),
    ),
  );

  const filtered = $derived(
    nations.filter((n) => {
      if (people !== 'all' && n.people !== people) return false;
      if (trackedOnly && n.tracked === 0) return false;
      if (query.trim()) {
        const hay = fold(`${n.name} ${n.people ?? ''} ${n.tribalCouncil ?? ''}`);
        if (!hay.includes(fold(query.trim()))) return false;
      }
      return true;
    }),
  );

  const active = $derived(query.trim() !== '' || people !== 'all' || trackedOnly);

  function reset() {
    query = '';
    people = 'all';
    trackedOnly = false;
  }
</script>

<div class="not-prose">
  <div class="border-y border-rule py-4 mb-8 md:sticky md:top-16 bg-surface/95 backdrop-blur-sm z-30">
    <div class="flex flex-wrap items-center gap-2.5">
      <label class="sr-only" for="bc-search">Search Nations</label>
      <input
        id="bc-search"
        type="search"
        bind:value={query}
        placeholder="Search by Nation, People or Tribal Council…"
        class="flex-1 min-w-[15rem] text-sm bg-paper border border-stone-300 rounded px-3 py-2
          placeholder:text-text-muted focus:border-cedar focus:outline-none"
      />

      <select
        bind:value={people}
        aria-label="Filter by People or Nation"
        class="text-sm bg-paper border border-stone-300 rounded px-2.5 py-2 focus:border-cedar focus:outline-none max-w-[15rem]"
      >
        <option value="all">All Peoples</option>
        {#each peoples as p}
          <option value={p}>{p}</option>
        {/each}
      </select>

      <label class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none px-2">
        <input type="checkbox" bind:checked={trackedOnly} class="accent-cedar" />
        Only those with something tracked
      </label>

      {#if active}
        <button
          type="button"
          onclick={reset}
          class="text-sm text-cedar hover:text-cedar-dark underline underline-offset-2"
        >
          Clear
        </button>
      {/if}
    </div>

    <p class="text-xs text-text-muted mt-3" aria-live="polite">
      Showing {filtered.length} of {nations.length} Nations
    </p>
  </div>

  {#if filtered.length === 0}
    <p class="text-text-secondary py-12 text-center">
      No Nation matches that.
      <button type="button" onclick={reset} class="text-cedar underline underline-offset-2">
        Clear the filters
      </button>
    </p>
  {:else}
    <ul class="list-none pl-0 m-0 divide-y divide-rule">
      {#each filtered as n (n.slug)}
        <li>
          <a
            href="/nations/bc/{n.slug}"
            class="group flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3.5 -mx-2 px-2 rounded
              hover:bg-canvas/40 transition-colors"
          >
            <span class="font-record text-lg text-ink group-hover:text-cedar transition-colors">
              {n.name}
            </span>
            {#if n.people}
              <span class="text-xs text-text-muted">{n.people}</span>
            {/if}
            {#if n.tribalCouncil}
              <span class="text-xs text-text-muted hidden md:inline">· {n.tribalCouncil}</span>
            {/if}
            <span class="ml-auto flex items-center gap-3 shrink-0">
              {#if n.tracked > 0}
                <span
                  class="text-[10px] font-semibold tracking-wide uppercase border border-cedar/30
                    bg-cedar/5 text-cedar rounded px-2 py-0.5"
                >
                  {n.tracked} tracked
                </span>
              {/if}
              <span class="text-[11px] text-text-muted tabular-nums">#{n.bandNumber}</span>
            </span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>
