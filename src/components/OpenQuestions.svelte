<script lang="ts">
  /**
   * The open-questions register.
   *
   * Sorted by how often a question has been carried, then by how long it has
   * been open — so the things the record keeps returning to without answering
   * sit at the top. That ordering is the argument of the page.
   */
  interface Question {
    question: string;
    subject: string;
    source: 'ledger' | 'brief';
    url: string;
    firstSeen: string;
    lastSeen: string;
    carriedIn: number;
    daysOpen: number;
    stage?: string;
    confidence?: string;
  }

  interface Props {
    questions: Question[];
  }

  let { questions }: Props = $props();

  let query = $state('');
  let source = $state('all');
  let carriedOnly = $state(false);

  const filtered = $derived(
    questions.filter((q) => {
      if (source !== 'all' && q.source !== source) return false;
      if (carriedOnly && q.carriedIn < 2) return false;
      if (query.trim()) {
        const hay = `${q.question} ${q.subject}`.toLowerCase();
        if (!hay.includes(query.trim().toLowerCase())) return false;
      }
      return true;
    }),
  );

  const active = $derived(source !== 'all' || carriedOnly || query.trim() !== '');

  function reset() {
    query = '';
    source = 'all';
    carriedOnly = false;
  }

  function shortDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return iso;
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-CA', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
  }

  function age(days: number): string {
    if (days === 0) return 'raised in the latest edition';
    if (days === 1) return 'open 1 day';
    if (days < 21) return `open ${days} days`;
    return `open ${Math.round(days / 7)} weeks`;
  }
</script>

<div class="not-prose">
  <div class="border-y border-rule py-4 mb-8 md:sticky md:top-16 bg-surface/95 backdrop-blur-sm z-30">
    <div class="flex flex-wrap items-center gap-2.5">
      <label class="sr-only" for="oq-search">Search open questions</label>
      <input
        id="oq-search"
        type="search"
        bind:value={query}
        placeholder="Search open questions…"
        class="flex-1 min-w-[14rem] text-sm bg-paper border border-stone-300 rounded px-3 py-2
          placeholder:text-text-muted focus:border-cedar focus:outline-none"
      />

      <select
        bind:value={source}
        aria-label="Filter by where the question came from"
        class="text-sm bg-paper border border-stone-300 rounded px-2.5 py-2 focus:border-cedar focus:outline-none"
      >
        <option value="all">Ledger and briefs</option>
        <option value="ledger">From the ledger</option>
        <option value="brief">From the briefs</option>
      </select>

      <label
        class="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none px-2"
      >
        <input type="checkbox" bind:checked={carriedOnly} class="accent-cedar" />
        Carried more than once
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
      Showing {filtered.length} of {questions.length}
      {questions.length === 1 ? 'question' : 'questions'}
    </p>
  </div>

  {#if filtered.length === 0}
    <p class="text-text-secondary py-12 text-center">
      Nothing matches.
      <button type="button" onclick={reset} class="text-cedar underline underline-offset-2">
        Clear the filters
      </button>
    </p>
  {:else}
    <ol class="list-none pl-0 m-0 divide-y divide-rule">
      {#each filtered as q (q.question)}
        <li class="py-6">
          <div class="flex flex-wrap items-center gap-2 mb-2.5">
            {#if q.carriedIn > 1}
              <span
                class="text-[10px] font-semibold tracking-wide uppercase border border-cedar/30
                  bg-cedar/5 text-cedar rounded px-2 py-0.5"
              >
                Carried {q.carriedIn}&times;
              </span>
            {/if}

            <span class="text-xs text-text-muted">{age(q.daysOpen)}</span>

            <span class="text-xs text-text-muted">
              &middot; first raised {shortDate(q.firstSeen)}
            </span>

            {#if q.stage}
              <span
                class="text-[10px] tracking-wide border border-stone-300 bg-stone-50 text-stone-600 rounded px-1.5 py-0.5"
              >
                {q.stage}
              </span>
            {/if}

            <span class="text-[11px] text-text-muted ml-auto">
              {q.source === 'ledger' ? 'Ledger' : 'Brief'}
            </span>
          </div>

          <p class="font-record text-lg md:text-xl leading-[1.4] text-ink mb-2">
            {q.question}
          </p>

          <a
            href={q.url}
            class="text-sm text-text-secondary hover:text-cedar transition-colors leading-snug block max-w-3xl"
          >
            On: {q.subject}
          </a>
        </li>
      {/each}
    </ol>
  {/if}
</div>
