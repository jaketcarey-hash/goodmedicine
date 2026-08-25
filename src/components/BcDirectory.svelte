<script lang="ts">
  import { publishFilter, onSelection } from '../lib/bc-selection';

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

  /* The map is the other half of this page. What the directory is filtering to
   * goes out so the map can show where those Nations are; what the map selects
   * comes in so the list can jump to it. See src/lib/bc-selection.ts. */
  let fromMap = $state<string | null>(null);
  $effect(() => onSelection((slug) => { fromMap = slug; }));

  /* Tapping a mark on the map should bring its row here into view. Scrolling
   * only when the row is actually off screen, because a list that jumps under
   * someone who can already see what they picked is worse than one that stays
   * still. */
  $effect(() => {
    if (!fromMap) return;
    const row = document.getElementById(`bc-${fromMap}`);
    if (!row) return;
    const box = row.getBoundingClientRect();
    if (box.top < 0 || box.bottom > window.innerHeight) {
      row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  });

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

  $effect(() => {
    // Null rather than all 201 slugs when nothing is filtered — the map draws
    // its ordinary state from the absence, not from a list that happens to
    // contain everything.
    publishFilter({
      slugs: active ? filtered.map((n) => n.slug) : null,
      describe: query.trim() || (people !== 'all' ? people : trackedOnly ? 'tracked this year' : ''),
    });
  });

  function reset() {
    query = '';
    people = 'all';
    trackedOnly = false;
  }
</script>

<div class="not-prose">
  <div class="border-y border-rule py-4 mb-8 md:sticky md:top-16 bg-ground/95 backdrop-blur-sm z-30">
    <div class="flex flex-wrap items-center gap-2.5">
      <label class="sr-only" for="bc-search">Search Nations</label>
      <input
        id="bc-search"
        type="search"
        bind:value={query}
        placeholder="Search by Nation, People or Tribal Council…"
        class="flex-1 min-w-[15rem] text-sm bg-white border border-rule rounded-sm px-3 py-2
          placeholder:text-faint focus:border-ink focus:outline-none"
      />

      <select
        bind:value={people}
        aria-label="Filter by People or Nation"
        class="text-sm bg-white border border-rule rounded-sm px-2.5 py-2 focus:border-ink focus:outline-none max-w-[15rem]"
      >
        <option value="all">All Peoples</option>
        {#each peoples as p}
          <option value={p}>{p}</option>
        {/each}
      </select>

      <label class="flex items-center gap-2 text-sm text-quiet cursor-pointer select-none px-2">
        <input type="checkbox" bind:checked={trackedOnly} class="accent-[#17654A]" />
        Only those with something tracked
      </label>

      {#if active}
        <button
          type="button"
          onclick={reset}
          class="text-sm text-ink underline decoration-rule underline-offset-2 hover:decoration-ink"
        >
          Clear
        </button>
      {/if}
    </div>

    <p class="apparatus text-faint mt-3" aria-live="polite">
      Showing {filtered.length} of {nations.length} Nations
    </p>
  </div>

  {#if filtered.length === 0}
    <p class="text-quiet py-12 text-center">
      No Nation matches that.
      <button
        type="button"
        onclick={reset}
        class="text-ink underline decoration-rule underline-offset-2 hover:decoration-ink"
      >
        Clear the filters
      </button>
    </p>
  {:else}
    <ul class="list-none pl-0 m-0 divide-y divide-rule">
      {#each filtered as n (n.slug)}
        <li id="bc-{n.slug}">
          <a
            href="/nations/bc/{n.slug}"
            class="group flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3.5 -mx-2 px-2
              hover:bg-ink/[0.03] transition-colors
              {fromMap === n.slug ? 'bg-ink/[0.05] ring-1 ring-ink/20' : ''}"
          >
            <span class="text-lg font-medium text-ink group-hover:underline decoration-rule underline-offset-2">
              {n.name}
            </span>
            {#if n.people}
              <span class="text-xs text-faint">{n.people}</span>
            {/if}
            {#if n.tribalCouncil}
              <span class="text-xs text-faint hidden md:inline">· {n.tribalCouncil}</span>
            {/if}
            <span class="ml-auto flex items-center gap-3 shrink-0">
              {#if n.tracked > 0}
                <span
                  class="inline-flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-[0.08em] uppercase text-verified"
                >
                  <span class="w-[7px] h-[7px] bg-current" aria-hidden="true"></span>
                  {n.tracked} tracked
                </span>
              {/if}
              <span class="font-mono text-[11px] text-faint tabular-nums">#{n.bandNumber}</span>
            </span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>
