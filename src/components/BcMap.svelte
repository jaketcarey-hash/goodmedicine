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
            Math.hypot(p.x - selected!.x, p.y - selected!.y) < 12,
        )
      : [],
  );

  function pick(p: (typeof points)[number]) {
    selected = selected?.slug === p.slug ? null : p;
  }
</script>

<figure class="not-prose m-0">
  <div class="border border-rule bg-white">
    <svg
      viewBox={outline.viewBox}
      class="block h-auto w-full"
      role="img"
      aria-label="Map of British Columbia showing the community location of each First Nation"
    >
      <!-- canvas on a white card: the land has to be visibly land, and ground
           (#FAFAF8) against white is a ghost. -->
      <path d={outline.path} class="fill-canvas stroke-rule" stroke-width="2" stroke-linejoin="round" />

      {#each points as p (p.slug)}
        <g
          role="button"
          tabindex="0"
          aria-label={p.name}
          onclick={() => pick(p)}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(p); } }}
          class="cursor-pointer focus:outline-none"
        >
          <!-- A finger is wider than a dot. This is the target; it is invisible. -->
          <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
          <circle
            cx={p.x}
            cy={p.y}
            r={selected?.slug === p.slug ? 9 : 5}
            class={selected?.slug === p.slug ? 'fill-ink' : 'fill-quiet'}
            opacity={selected?.slug === p.slug ? 1 : 0.55}
          >
            <title>{p.name}</title>
          </circle>
        </g>
      {/each}
    </svg>
  </div>

  <!-- The answer, as HTML under the map rather than a tooltip over it. -->
  <div class="mt-3 min-h-[5.5rem]">
    {#if selected}
      <div class="rounded-sm border border-rule bg-white p-4">
        <p class="text-lg font-semibold leading-snug">{selected.name}</p>
        <dl class="mt-2 m-0 grid grid-cols-[7rem_1fr] gap-x-4 gap-y-1">
          {#if selected.people}
            <dt class="apparatus-label">People</dt>
            <dd class="m-0 text-sm text-ink">{selected.people}</dd>
          {/if}
          {#if selected.tribalCouncil}
            <dt class="apparatus-label">Tribal Council</dt>
            <dd class="m-0 text-sm text-ink">{selected.tribalCouncil}</dd>
          {/if}
        </dl>
        {#if neighbours.length > 0}
          <p class="apparatus mt-2.5 text-[11px] leading-snug text-faint">
            {neighbours.length}
            {neighbours.length === 1 ? 'other Nation is' : 'other Nations are'}
            close enough to share this mark on the map:
            {neighbours.slice(0, 4).map((n) => n.name).join(', ')}{neighbours.length > 4
              ? ` and ${neighbours.length - 4} more`
              : ''}.
          </p>
        {/if}
        <a
          href={`/nations/bc/${selected.slug}`}
          class="mt-3 inline-block text-sm text-ink underline decoration-rule underline-offset-2 hover:decoration-ink"
        >What the record holds about {selected.name}</a>
      </div>
    {:else}
      <p class="text-sm leading-relaxed text-quiet max-w-prose">
        Tap a mark to see which Nation it is.
      </p>
    {/if}
  </div>

  <figcaption class="apparatus mt-4 text-[11px] leading-snug text-faint max-w-prose">
    Each mark is the community location listed in the federal band registry.
    Territories are much larger than a point, they overlap one another, and most
    of British Columbia is unceded — this map locates communities, and says
    nothing about the extent of any Nation's territory.
    Outline from Natural Earth, public domain.
  </figcaption>
</figure>
