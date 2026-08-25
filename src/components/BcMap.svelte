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
   * **Tap, not hover.** 375px is a first-class width here and a phone has no
   * hover state. Tapping a dot selects it; the card below the map is the
   * answer, and it is real HTML rather than a floating tooltip so it can be
   * read, selected and reached by a screen reader.
   *
   * **Density is stated, not hidden.** Forty Nations sit within a few hundred
   * kilometres of the lower mainland, and at phone width their dots overlap
   * into one mark. Rather than pretend otherwise, dots are drawn semi-opaque
   * so a cluster reads darker than a single Nation, and a tap reports how
   * many others are within reach of the same spot. The directory below stays
   * the precise index; this is for orientation.
   */
  import outline from '../data/bc/outline.json';
  import rivers from '../data/bc/rivers.json';
  import { onFilter, publishFilter, publishSelection, type BcFilter } from '../lib/bc-selection';

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
  let byPeople = $state<string | null>(null);

  function choosePeople(name: string) {
    byPeople = byPeople === name ? null : name;
    publishFilter(
      byPeople
        ? { slugs: points.filter((p) => p.people === byPeople).map((p) => p.slug), describe: byPeople }
        : { slugs: null, describe: '' },
    );
  }

  /* What the directory below is filtering to. Searching "Nlaka'pamux" down
   * there should light up where they are up here — that is the whole reason
   * these two sit on one page. */
  let filter = $state<BcFilter>({ slugs: null, describe: '' });
  $effect(() => onFilter((f) => { filter = f; }));

  let filterSet = $derived(filter.slugs ? new Set(filter.slugs) : null);
  /** Null when nothing is filtered — every mark is then simply itself. */
  function inFilter(slug: string): boolean {
    return filterSet === null || filterSet.has(slug);
  }
  let matchCount = $derived(filter.slugs ? filter.slugs.length : 0);

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
    publishSelection(selected?.slug ?? null);
  }
</script>

<figure class="not-prose m-0">
  <!-- No frame. Nothing else on this site boxes a figure — the stage bars, the
       forecast strip and the payoff curves all sit open on the page, and the
       province's own outline is a better edge than a rectangle around it.
       Capped rather than full-width: at full measure the map sprawled, and one
       you can take in at a glance reads as more considered than a large one.
       Left-aligned rather than centred — this page runs to a wide measure, and
       a centred map sat three hundred pixels away from its own heading, which
       left the heading pointing at nothing. -->
  <div class="max-w-[34rem]">
    <svg
      viewBox={outline.viewBox}
      class="block h-auto w-full overflow-visible"
      role="img"
      aria-label="Map of British Columbia showing the community location of each First Nation"
    >
      <!-- The land recedes so the data can speak. A filled province at nearly
           the same value as the marks meant nothing read; a hairline outline
           and no fill makes the marks the only solid thing on the page. -->
      <path
        d={outline.path}
        fill="none"
        class="stroke-rule"
        stroke-width="1.5"
        stroke-linejoin="round"
      />

      <!-- The rivers are not ornament. Nations sit on water, so without them
           the clusters are smudges the reader has to take on trust — with them
           the Fraser Canyon is visibly a canyon and the distribution explains
           itself.

           Drawn from `faint` at low opacity rather than from `rule`: rule on
           ground is about 1.15:1, which is invisible, and a line nobody can see
           explains nothing. Still lighter than the province edge, so the
           hierarchy holds — coastline, then rivers, then marks. -->
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
          <circle cx={p.x} cy={p.y} r="30" fill="transparent" />

          {#if isSelected}
            <circle cx={p.x} cy={p.y} r="17" fill="none" class="stroke-ink" stroke-width="2" />
          {/if}

          <!-- Form, not colour, carries the distinction — colour never appears
               here without its text label, and the legend below says it in
               words. Solid means the record holds something; hollow means it
               does not, which is the honest majority. -->
          <circle
            cx={p.x}
            cy={p.y}
            r={isSelected ? 9 : 7.5}
            class="{isSelected || known ? (isSelected ? 'fill-ink' : 'fill-quiet') : 'fill-ground'} {known ? 'stroke-ground' : 'stroke-quiet'}"
            stroke-width={known ? 2.5 : 1.75}
            opacity={dimmed ? 0.16 : hovered && hovered !== p.slug ? 0.55 : 1}
            style="transition: opacity 200ms ease, r 150ms ease"
          >
            <title>{p.name}</title>
          </circle>
        </g>
      {/each}
    </svg>
  </div>

  <!-- What the marks mean, in words. The split is the site's own coverage
       stated plainly rather than 201 identical dots implying it knows all of
       them equally. -->
  <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 max-w-[34rem] text-xs">
    <span class="flex items-center gap-2 text-ink">
      <svg width="12" height="12" aria-hidden="true" class="flex-shrink-0">
        <circle cx="6" cy="6" r="5" class="fill-quiet" />
      </svg>
      {trackedCount} with something tracked
    </span>
    <span class="flex items-center gap-2 text-ink">
      <svg width="12" height="12" aria-hidden="true" class="flex-shrink-0">
        <circle cx="6" cy="6" r="4.2" class="fill-ground stroke-quiet" stroke-width="1.5" />
      </svg>
      {points.length - trackedCount} with nothing tracked yet
    </span>
  </div>

  {#if filter.slugs}
    <p class="apparatus mt-3 max-w-[34rem] text-[11px] leading-snug text-faint">
      Showing {matchCount} of {points.length}{filter.describe ? ` — ${filter.describe}` : ''}.
      The rest are faded, not gone.
    </p>
  {/if}

  <!-- The answer replaces the prompt in place rather than sitting in a slot
       reserved for it — an empty box under a map is a box the reader has to
       account for. -->
  <div class="mt-5 max-w-[34rem]">
    {#if selected}
      <div class="border-t border-ink pt-3">
        <p class="text-lg font-semibold leading-snug">{selected.name}</p>
        <dl class="mt-1.5 m-0 grid grid-cols-[6.5rem_1fr] gap-x-4 gap-y-1">
          {#if selected.people}
            <dt class="apparatus-label">People</dt>
            <dd class="m-0 text-sm text-ink">{selected.people}</dd>
          {/if}
          {#if selected.tribalCouncil}
            <dt class="apparatus-label">Council</dt>
            <dd class="m-0 text-sm text-ink">{selected.tribalCouncil}</dd>
          {/if}
        </dl>
        {#if neighbours.length > 0}
          <p class="apparatus mt-2.5 text-[11px] leading-snug text-faint">
            {neighbours.length}
            {neighbours.length === 1 ? 'other Nation sits' : 'other Nations sit'}
            close enough to share this mark:
            {neighbours.slice(0, 3).map((n) => n.name).join(', ')}{neighbours.length > 3
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
  </div>

  <!-- A way in that does not require knowing the word. Search finds a term
       you can already name; this is for someone who wants to see who is where
       and has never typed "Nlaka'pamux" in their life. -->
  <details class="mt-6 max-w-[34rem]">
    <summary class="apparatus-label cursor-pointer hover:text-ink transition-colors marker:content-none [&::-webkit-details-marker]:hidden">
      Browse by People and Nation ({peoples.length})
    </summary>
    <div class="mt-3 flex flex-wrap gap-x-4 gap-y-2">
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

  <figcaption class="apparatus mt-6 max-w-[34rem] text-[11px] leading-snug text-faint">
    Each mark is a community location from the federal band registry.
    Territories are far larger, they overlap, and most of BC is unceded — this
    locates communities, not territory. Outline: Natural Earth, public domain.
  </figcaption>
</figure>
