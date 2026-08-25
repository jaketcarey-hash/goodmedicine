<script lang="ts">
  /**
   * Where the Nations are, on a map of the province.
   *
   * **What the dots mean, exactly.** Each one is the community location the
   * federal band registry lists — a band office address, essentially. It is
   * not the extent of a territory. Territories are far larger than a point,
   * they overlap one another, and most of British Columbia is unceded. A map
   * that quietly implied otherwise would be making a claim this site has no
   * standing to make, to readers with earned reasons to be wary of exactly
   * that kind of claim. The caption says so in plain words; that sentence is
   * not decoration and should not be trimmed.
   *
   * **The answer sits beside the map, not under it.** Selecting a mark used to
   * drop a card below and scroll the page down to that Nation's row in a
   * 201-item directory — which took the reader away from the thing they were
   * looking at, to answer a question they had asked *of the map*. The
   * directory now has its own page and the answer appears in a panel next to
   * the map, so choosing a mark never moves the map out from under you. On a
   * phone there is no beside, so it stacks directly underneath.
   *
   * It is real HTML rather than a floating tooltip, so it can be read,
   * selected, and reached by a screen reader.
   *
   * **Density is stated, not hidden.** Forty Nations sit within a few hundred
   * kilometres of the lower mainland, and at phone width their dots overlap
   * into one mark. Rather than pretend otherwise, dots are drawn semi-opaque
   * so a cluster reads darker than a single Nation, and a tap reports how
   * many others are within reach of the same spot. The full directory, on its
   * own page, stays the precise index; this is for orientation.
   */
  import { onMount } from 'svelte';
  import outline from '../data/bc/outline.json';
  import rivers from '../data/bc/rivers.json';

  interface Row {
    name: string;
    slug: string;
    people: string | null;
    tribalCouncil: string | null;
    lat: number | null;
    lon: number | null;
    /** Records and mentions this site has tracked. Zero is the common case. */
    tracked: number;
  }
  interface Props { nations: Row[] }
  let { nations }: Props = $props();

  const STANDARD_PARALLEL = 54;
  const K = Math.cos((STANDARD_PARALLEL * Math.PI) / 180);
  const B = outline.bounds;

  /** Same projection the outline was built with, or the dots would not land. */
  function project(lat: number, lon: number): { x: number; y: number } {
    const x = lon * K;
    return {
      x: ((x - B.minX) / (B.maxX - B.minX)) * outline.width,
      y: outline.height - ((lat - B.minY) / (B.maxY - B.minY)) * outline.height,
    };
  }

  let points = $derived(
    nations
      .filter((n) => n.lat !== null && n.lon !== null)
      .map((n) => ({ ...n, ...project(n.lat!, n.lon!) })),
  );

  let selected = $state<(typeof points)[number] | null>(null);
  /** Desktop only. A phone has no hover, and the card is the answer there. */
  let hovered = $state<string | null>(null);

  let trackedCount = $derived(points.filter((p) => p.tracked > 0).length);

  /* Browsing by People, for the reader who cannot type the word.
   * Search needs you to already know the term; a list does not. */
  let peoples = $derived(
    [...new Set(points.map((p) => p.people).filter(Boolean) as string[])]
      .map((name) => ({ name, count: points.filter((p) => p.people === name).length }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  );
  function choosePeople(name: string) {
    byPeople = byPeople === name ? null : name;
  }

  function clearFilter() {
    query = '';
    byPeople = null;
  }

  /* The map owns its own filter now. It used to take one from the directory
   * sitting below it on the same page; the directory has moved, so the search
   * moved here with it rather than leaving the map with no way in. */
  let query = $state('');
  let byPeople = $state<string | null>(null);
  const fold = (v: string) =>
    v.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u0142\u0141]/g, 'l').replace(/[\u0294\u2019'\u02bc`]/g, '').toLowerCase();

  let matches = $derived.by(() => {
    const q = query.trim();
    if (!q && !byPeople) return null; // null means no filter, not "none matched"
    return points.filter((p) => {
      if (byPeople && p.people !== byPeople) return false;
      if (q) {
        const hay = fold(`${p.name} ${p.people ?? ''} ${p.tribalCouncil ?? ''}`);
        if (!hay.includes(fold(q))) return false;
      }
      return true;
    });
  });

  let filterSet = $derived(matches ? new Set(matches.map((m) => m.slug)) : null);
  function inFilter(slug: string): boolean {
    return filterSet === null || filterSet.has(slug);
  }
  let matchCount = $derived(matches?.length ?? 0);
  let describe = $derived(byPeople || query.trim());

  /** How many other Nations sit close enough to share this mark. */
  let neighbours = $derived(
    selected
      ? points.filter(
          (p) =>
            p.slug !== selected!.slug &&
            // Wide enough to cover what the enlarged tap target can catch, so
            // a near miss lists the Nation she was actually aiming at.
            Math.hypot(p.x - selected!.x, p.y - selected!.y) < 18,
        )
      : [],
  );

  function pick(p: (typeof points)[number]) {
    selected = selected?.slug === p.slug ? null : p;
    syncUrl();
  }

  /* A selection nobody can send to anyone is half a selection. The slug goes in
   * the query string with replaceState, so the back button still leaves the
   * page rather than walking back through every mark someone tapped. */
  function syncUrl() {
    const url = new URL(window.location.href);
    if (selected) url.searchParams.set('nation', selected.slug);
    else url.searchParams.delete('nation');
    history.replaceState(null, '', url);
  }

  onMount(() => {
    const slug = new URL(window.location.href).searchParams.get('nation');
    if (slug) selected = points.find((p) => p.slug === slug) ?? null;
  });
</script>

<figure class="not-prose m-0">
  <!-- Map and answer side by side on a wide screen; stacked on a phone, where
       there is no beside. The map keeps its cap — a map you can take in at a
       glance reads as more considered than a large one — and the panel takes
       the rest. -->
  <div class="grid gap-8 md:grid-cols-[minmax(0,34rem)_minmax(0,22rem)] md:items-start">

    <div>
      <svg
        viewBox={outline.viewBox}
        class="block h-auto w-full overflow-visible"
        role="img"
        aria-label="Map of British Columbia showing the community location of each First Nation"
      >
        <!-- The land recedes so the data can speak. A filled province at nearly
             the same value as the marks meant nothing read. -->
        <path
          d={outline.path}
          fill="none"
          class="stroke-rule"
          stroke-width="1.5"
          stroke-linejoin="round"
        />

        <!-- The rivers are not ornament. Nations sit on water, so without them
             the clusters are smudges the reader has to take on trust — with
             them the Fraser Canyon is visibly a canyon.

             Drawn from `faint` at low opacity rather than `rule`: rule on
             ground is about 1.15:1, which is invisible, and a line nobody can
             see explains nothing. -->
        <path
          d={rivers.path}
          fill="none"
          class="stroke-faint"
          stroke-width="1"
          stroke-linecap="round"
          stroke-linejoin="round"
          opacity="0.4"
        />

        {#each points as p (p.slug)}
          {@const isSelected = selected?.slug === p.slug}
          {@const dimmed = !inFilter(p.slug)}
          {@const known = p.tracked > 0}
          <g
            role="button"
            tabindex="0"
            aria-label="{p.name}{known ? '' : ' — nothing tracked yet'}"
            onclick={() => pick(p)}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(p); } }}
            onmouseenter={() => (hovered = p.slug)}
            onmouseleave={() => (hovered = null)}
            class="cursor-pointer focus-visible:outline-none"
          >
            <!-- A finger is wider than a mark, and much wider than this one.
                 At 375px the map renders 335px across, so a radius of 18 gives
                 a 12px target — half what a thumb needs. 30 gives 20px. -->
            <circle cx={p.x} cy={p.y} r="30" fill="transparent" />

            {#if isSelected}
              <!-- A ring rather than a bigger dot: in a cluster of sixteen,
                   size alone does not say which one was chosen. -->
              <circle cx={p.x} cy={p.y} r="17" fill="none" class="stroke-ink" stroke-width="2" />
            {/if}

            <!-- Form, not colour, carries what the record knows. Solid means
                 something is tracked; hollow means nothing is, which is the
                 honest majority. The legend says both in words. -->
            <circle
              cx={p.x}
              cy={p.y}
              r={isSelected ? 9 : 7.5}
              class="{isSelected || known ? (isSelected ? 'fill-ink' : 'fill-quiet') : 'fill-ground'} {known ? 'stroke-ground' : 'stroke-quiet'}"
              stroke-width={known ? 2.5 : 1.75}
              opacity={dimmed ? 0.16 : hovered && hovered !== p.slug ? 0.55 : 1}
              style="transition: opacity 200ms ease"
            >
              <title>{p.name}</title>
            </circle>
          </g>
        {/each}
      </svg>

      <!-- A key, not a statistic. The counts are in the stat block above and
           repeating them here just made the reader check whether the two
           agreed. -->
      <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span class="flex items-center gap-2 text-ink">
          <svg width="12" height="12" aria-hidden="true" class="flex-shrink-0">
            <circle cx="6" cy="6" r="5" class="fill-quiet" />
          </svg>
          Something tracked
        </span>
        <span class="flex items-center gap-2 text-ink">
          <svg width="12" height="12" aria-hidden="true" class="flex-shrink-0">
            <circle cx="6" cy="6" r="4.2" class="fill-ground stroke-quiet" stroke-width="1.5" />
          </svg>
          Nothing tracked yet
        </span>
      </div>

      <figcaption class="apparatus mt-4 text-[11px] leading-snug text-faint">
        Each mark is a community location from the federal band registry.
        Territories are far larger, they overlap, and most of BC is unceded —
        this locates communities, not territory. Outline and rivers: Natural
        Earth, public domain.
      </figcaption>
    </div>

    <!-- ── The panel: how you get in, and what you get back ── -->
    <aside class="flex flex-col gap-5 md:sticky md:top-6">
      <div>
        <label for="map-search" class="apparatus-label block mb-2">Find a Nation</label>
        <input
          id="map-search"
          bind:value={query}
          placeholder="Name, People or Council…"
          class="w-full rounded-sm border border-rule bg-white px-3 py-2.5 text-sm
            placeholder:text-faint focus:border-ink focus:outline-none"
        />
        {#if matches}
          <p class="apparatus mt-2 text-[11px] leading-snug text-faint">
            {matchCount} of {points.length}{describe ? ` — ${describe}` : ''}. The rest
            are faded, not gone.
            <button onclick={clearFilter} class="ml-1 cursor-pointer underline decoration-rule underline-offset-2 hover:text-ink">clear</button>
          </p>
        {/if}
      </div>

      {#if selected}
        <div class="border-t border-ink pt-3">
          <p class="text-lg font-semibold leading-snug">{selected.name}</p>
          <dl class="mt-1.5 m-0 grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1">
            {#if selected.people}
              <dt class="apparatus-label">People</dt>
              <dd class="m-0 text-sm text-ink">{selected.people}</dd>
            {/if}
            {#if selected.tribalCouncil}
              <dt class="apparatus-label">Council</dt>
              <dd class="m-0 text-sm text-ink">{selected.tribalCouncil}</dd>
            {/if}
            <dt class="apparatus-label">Record</dt>
            <dd class="m-0 text-sm text-ink">
              {selected.tracked > 0
                ? `${selected.tracked} ${selected.tracked === 1 ? 'entry' : 'entries'} tracked`
                : 'Nothing tracked yet'}
            </dd>
          </dl>
          {#if neighbours.length > 0}
            <p class="apparatus mt-2.5 text-[11px] leading-snug text-faint">
              {neighbours.length}
              {neighbours.length === 1 ? 'other Nation shares' : 'other Nations share'}
              this mark: {neighbours.slice(0, 3).map((n) => n.name).join(', ')}{neighbours.length > 3
                ? ` and ${neighbours.length - 3} more`
                : ''}.
            </p>
          {/if}
          <a
            href={`/nations/bc/${selected.slug}`}
            class="mt-2.5 inline-block text-sm text-ink underline decoration-rule underline-offset-2 hover:decoration-ink"
          >What the record holds</a>
        </div>
      {:else}
        <p class="apparatus text-[11px] leading-snug text-faint">
          Tap a mark for the Nation it belongs to.
        </p>
      {/if}

      <!-- A way in that does not require knowing the word. Search finds a term
           you can already name; this is for someone who wants to see who is
           where and has never typed "Nlaka'pamux" in their life. -->
      <!-- Open by default. This is the way in for someone who cannot type the
           word, and a shut door is not a way in — it also happens to be the
           only thing with enough presence to fill the column before a mark is
           chosen, which was 186px of nothing. -->
      <details open class="border-t border-rule pt-4">
        <summary class="apparatus-label cursor-pointer hover:text-ink transition-colors marker:content-none [&::-webkit-details-marker]:hidden">
          Browse by People and Nation ({peoples.length})
        </summary>
        <!-- Capped and scrollable. Opening this by default fixed a panel with
             186px of nothing in it and immediately created the opposite
             problem: forty wrapped names ran the column to twice the height of
             the map it sits beside. -->
        <div class="mt-3 flex flex-wrap gap-x-3 gap-y-2 max-h-[13rem] overflow-y-auto pr-2">
          {#each peoples as pl (pl.name)}
            <button
              onclick={() => choosePeople(pl.name)}
              class="text-sm cursor-pointer transition-colors
                {byPeople === pl.name ? 'text-ink underline decoration-ink underline-offset-2' : 'text-quiet hover:text-ink'}"
            >
              {pl.name}
              <span class="apparatus text-[10px] text-faint">{pl.count}</span>
            </button>
          {/each}
        </div>
      </details>

      <p class="apparatus text-[11px] leading-snug text-faint border-t border-rule pt-4">
        Looking for the full list?
        <a href="/nations/bc/directory" class="text-ink underline decoration-rule underline-offset-2 hover:decoration-ink">All {points.length} Nations</a>,
        searchable and filterable.
      </p>
    </aside>
  </div>
</figure>
