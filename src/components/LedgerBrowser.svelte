<script lang="ts">
  /**
   * The ledger, filtered.
   *
   * Filtering happens in the browser over the full record set — 42 rows is
   * small enough that paging or a round trip would be ceremony. Filters sit in
   * one row above the results and report how much they left.
   *
   * Colour never carries meaning alone here: the stage chip and the confidence
   * badge both spell out what they mean in text beside the swatch.
   */
  interface Entry {
    id: string;
    date: string;
    event: string;
    significance: string;
    stage: string;
    band: string;
    confidence: string;
    amountLabel: string | null;
    amountQualifier: string | null;
    sectors: string[];
    places: string[];
    nations: string[];
    sourceCount: number;
  }

  interface Props {
    entries: Entry[];
    sectors: string[];
    places: string[];
    bandLabels: Record<string, string>;
  }

  let { entries, sectors, places, bandLabels }: Props = $props();

  let query = $state('');
  let band = $state('all');
  let sector = $state('all');
  let place = $state('all');
  let confidence = $state('all');

  const bandOrder = ['early', 'committed', 'done', 'contested'];

  /**
   * The stage rail, inline.
   *
   * A list of 42 records is where the comparison actually happens — scanning it
   * you can see how much of the year is talk and how much is money that moved.
   * Three steps filled to the point reached; contested breaks the line with a
   * mark rather than extending it, because a court case is not progress toward
   * completion.
   */
  const STEPS = ['early', 'committed', 'done'];
  const reachedIndex = (band: string) => STEPS.indexOf(band);

  const confidenceTone: Record<string, string> = {
    high: 'text-verified',
    medium: 'text-unsettled',
    low: 'text-quiet',
  };

  const filtered = $derived(
    entries.filter((e) => {
      if (band !== 'all' && e.band !== band) return false;
      if (confidence !== 'all' && e.confidence !== confidence) return false;
      if (sector !== 'all' && !e.sectors.includes(sector)) return false;
      if (place !== 'all' && !e.places.includes(place)) return false;

      if (query.trim()) {
        const haystack = [
          e.event,
          e.significance,
          e.stage,
          ...e.sectors,
          ...e.places,
          ...e.nations,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query.trim().toLowerCase())) return false;
      }
      return true;
    }),
  );

  const active = $derived(
    band !== 'all' ||
      sector !== 'all' ||
      place !== 'all' ||
      confidence !== 'all' ||
      query.trim() !== '',
  );

  function reset() {
    query = '';
    band = 'all';
    sector = 'all';
    place = 'all';
    confidence = 'all';
  }

  function shortDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-CA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }
</script>

<div class="not-prose">
  <!-- Filters, one row -->
  <div class="border-y border-rule py-4 mb-8 md:sticky md:top-16 bg-ground/95 backdrop-blur-sm z-30">
    <div class="flex flex-wrap items-center gap-2.5">
      <label class="sr-only" for="ledger-search">Search the ledger</label>
      <input
        id="ledger-search"
        type="search"
        bind:value={query}
        placeholder="Search events, Nations, sectors…"
        class="flex-1 min-w-[14rem] text-sm bg-white border border-rule rounded-sm px-3 py-2
          placeholder:text-faint focus:border-ink focus:outline-none"
      />

      <select
        bind:value={band}
        aria-label="Filter by stage"
        class="text-sm bg-white border border-rule rounded-sm px-2.5 py-2 focus:border-ink focus:outline-none"
      >
        <option value="all">Any stage</option>
        {#each bandOrder as b}
          <option value={b}>{bandLabels[b]}</option>
        {/each}
      </select>

      <select
        bind:value={confidence}
        aria-label="Filter by confidence"
        class="text-sm bg-white border border-rule rounded-sm px-2.5 py-2 focus:border-ink focus:outline-none"
      >
        <option value="all">Any confidence</option>
        <option value="high">High confidence</option>
        <option value="medium">Medium confidence</option>
        <option value="low">Low confidence</option>
      </select>

      <select
        bind:value={sector}
        aria-label="Filter by sector"
        class="text-sm bg-white border border-rule rounded-sm px-2.5 py-2 focus:border-ink focus:outline-none max-w-[12rem]"
      >
        <option value="all">Any sector</option>
        {#each sectors as s}
          <option value={s}>{s}</option>
        {/each}
      </select>

      <select
        bind:value={place}
        aria-label="Filter by place"
        class="text-sm bg-white border border-rule rounded-sm px-2.5 py-2 focus:border-ink focus:outline-none max-w-[12rem]"
      >
        <option value="all">Anywhere</option>
        {#each places as p}
          <option value={p}>{p}</option>
        {/each}
      </select>

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
      Showing {filtered.length} of {entries.length}
      {entries.length === 1 ? 'development' : 'developments'}
    </p>
  </div>

  <!-- Results -->
  {#if filtered.length === 0}
    <p class="text-quiet py-12 text-center">
      Nothing in the ledger matches that.
      <button
        type="button"
        onclick={reset}
        class="text-ink underline decoration-rule underline-offset-2 hover:decoration-ink"
      >
        Clear the filters
      </button>
      to see everything.
    </p>
  {:else}
    <ol class="list-none pl-0 m-0 divide-y divide-rule">
      {#each filtered as entry (entry.id)}
        <li class="py-7 first:pt-0">
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
            <span class="font-mono text-[11px] text-faint tabular-nums">{shortDate(entry.date)}</span>

            <span
              class="inline-flex items-center gap-2"
              title={bandLabels[entry.band]}
              aria-label="{entry.stage} — {bandLabels[entry.band]}"
            >
              <span class="inline-flex items-center gap-[2px]" aria-hidden="true">
                {#each STEPS as _, i}
                  <span
                    class="w-5 h-[3px] {entry.band === 'contested'
                      ? 'bg-rule'
                      : i <= reachedIndex(entry.band)
                        ? 'bg-verified'
                        : 'bg-rule'}"
                  ></span>
                {/each}
                {#if entry.band === 'contested'}
                  <span class="w-2 h-2 rotate-45 bg-contested ml-1"></span>
                {/if}
              </span>
              <span
                class="font-mono text-[11px] tracking-[0.02em] {entry.band === 'contested'
                  ? 'text-contested'
                  : 'text-ink'}">{entry.stage}</span
              >
            </span>

            <span
              class="inline-flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-[0.08em] uppercase
                {confidenceTone[entry.confidence]}"
            >
              <span class="w-[7px] h-[7px] bg-current" aria-hidden="true"></span>
              {entry.confidence} confidence
            </span>

            {#if entry.amountLabel}
              <!-- The qualifier rides along as a title: these figures count
                   different things and the number alone would mislead. -->
              <span
                class="font-mono text-sm text-ink ml-auto tabular-nums border-b border-dotted border-faint cursor-help"
                title={entry.amountQualifier ?? undefined}
              >
                {entry.amountLabel}
              </span>
            {/if}
          </div>

          <h3 class="plain mb-2">
            <a
              href="/nations/ledger/{entry.id}"
              class="no-underline hover:underline decoration-rule underline-offset-4"
            >
              {entry.event}
            </a>
          </h3>

          <p class="text-sm leading-relaxed text-quiet mb-3 max-w-3xl">
            {entry.significance}
          </p>

          <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-faint">
            {#each entry.places as p}
              <span>{p}</span>
            {/each}
            {#each entry.sectors.slice(0, 3) as s}
              <span>· {s}</span>
            {/each}
            <span class="ml-auto font-mono">
              {entry.sourceCount} {entry.sourceCount === 1 ? 'source' : 'sources'}
            </span>
          </div>
        </li>
      {/each}
    </ol>
  {/if}
</div>
