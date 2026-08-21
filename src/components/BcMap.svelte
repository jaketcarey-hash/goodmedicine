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

  interface Row {
    name: string;
    slug: string;
    people: string | null;
    tribalCouncil: string | null;
    lat: number | null;
    lon: number | null;
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
      <path
        d={outline.path}
        class="fill-canvas stroke-rule"
        stroke-width="1.5"
        stroke-linejoin="round"
      />

      {#each points as p (p.slug)}
        {@const isSelected = selected?.slug === p.slug}
        <g
          role="button"
          tabindex="0"
          aria-label={p.name}
          onclick={() => pick(p)}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(p); } }}
          class="cursor-pointer focus-visible:outline-none"
        >
          <!-- A finger is wider than a mark, and much wider than this one.
               At 375px the map renders 335px across, so a radius of 18 gives a
               12px target — half what a thumb needs. 30 gives 20px, and the
               cost is that in a cluster the tap lands on whichever mark is on
               top rather than the nearest. That is the right trade here: the
               card names the Nations sharing the mark, so a near miss still
               tells her what she wanted, and precision lives in the directory
               below rather than in a map of two hundred points. -->
          <circle cx={p.x} cy={p.y} r="30" fill="transparent" />

          {#if isSelected}
            <!-- A ring rather than a bigger dot: in a cluster of sixteen, size
                 alone does not say which one was chosen. -->
            <circle cx={p.x} cy={p.y} r="17" fill="none" class="stroke-ink" stroke-width="2" />
          {/if}
          <!-- The ground-coloured ring is what stops two hundred marks
               collapsing into a smudge — the same surface gap that separates
               stacked fills elsewhere here. Clusters read as many marks
               touching, which is what they are. -->
          <circle
            cx={p.x}
            cy={p.y}
            r={isSelected ? 9 : 7.5}
            class="{isSelected ? 'fill-ink' : 'fill-quiet'} stroke-ground"
            stroke-width="2.5"
          >
            <title>{p.name}</title>
          </circle>
        </g>
      {/each}
    </svg>
  </div>

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

  <figcaption class="apparatus mt-6 max-w-[34rem] text-[11px] leading-snug text-faint">
    Each mark is a community location from the federal band registry.
    Territories are far larger, they overlap, and most of BC is unceded — this
    locates communities, not territory. Outline: Natural Earth, public domain.
  </figcaption>
</figure>
