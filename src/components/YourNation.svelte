<script lang="ts">
  /**
   * Her Nation, brought across from the directory.
   *
   * The site holds a page for every First Nation in BC and, until now, the
   * personal side could not see any of it. Naming a Nation turns the largest
   * built asset here from a national reference into her own file — the band
   * office, the Tribal Council, and whatever the record has tracked.
   *
   * Optional, and it stays optional. Someone may be a member of a Nation
   * outside BC, may not be registered, or may simply not want to say, and
   * none of that should cost them a working tool. Nothing in the entitlement
   * arithmetic reads this field.
   */
  import { onMount } from 'svelte';
  import { getHousehold, saveHousehold } from '../lib/household-store';

  interface Row {
    name: string;
    slug: string;
    people: string | null;
    tribalCouncil: string | null;
  }
  interface Props { nations: Row[] }
  let { nations }: Props = $props();

  let slug = $state<string | null>(null);
  let query = $state('');
  let ready = $state(false);

  onMount(() => {
    slug = getHousehold()?.nationSlug ?? null;
    ready = true;
  });

  const fold = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  let matches = $derived(
    query.trim().length < 2
      ? []
      : nations.filter((n) => fold(n.name).includes(fold(query.trim()))).slice(0, 8),
  );
  let chosen = $derived(slug ? nations.find((n) => n.slug === slug) ?? null : null);

  function choose(s: string) {
    const hh = getHousehold();
    if (hh) saveHousehold({ ...hh, nationSlug: s });
    slug = s;
    query = '';
  }
  function clear() {
    const hh = getHousehold();
    if (hh) saveHousehold({ ...hh, nationSlug: null });
    slug = null;
  }
</script>

{#if ready}
  <section class="rounded-sm border border-rule bg-white p-5">
    <h2 class="apparatus-label mb-1">Your Nation</h2>
    {#if chosen}
      <p class="text-lg font-semibold leading-snug">{chosen.name}</p>
      <dl class="mt-2 m-0 grid grid-cols-[7rem_1fr] gap-x-4 gap-y-1">
        {#if chosen.people}
          <dt class="apparatus-label">People</dt>
          <dd class="m-0 text-sm text-ink">{chosen.people}</dd>
        {/if}
        {#if chosen.tribalCouncil}
          <dt class="apparatus-label">Tribal Council</dt>
          <dd class="m-0 text-sm text-ink">{chosen.tribalCouncil}</dd>
        {/if}
      </dl>
      <p class="mt-3 text-sm text-quiet leading-relaxed max-w-prose">
        Post-secondary funding is applied for through your Nation, which sets
        its own criteria and deadlines — the band office is the place to ask.
      </p>
      <div class="mt-3 flex flex-wrap items-center gap-4">
        <a href={`/nations/bc/${chosen.slug}`} class="text-sm text-ink underline decoration-rule underline-offset-2 hover:decoration-ink">
          What the record holds about {chosen.name}
        </a>
        <button onclick={clear} class="apparatus text-xs text-faint hover:text-ink cursor-pointer underline decoration-rule underline-offset-2">
          change
        </button>
      </div>
    {:else}
      <p class="text-sm text-quiet leading-relaxed max-w-prose mb-3">
        Name your Nation and this page can point at your own band office and
        whatever the record has tracked. Optional — nothing else here depends
        on it.
      </p>
      <input
        bind:value={query}
        placeholder="Start typing a Nation…"
        class="w-full rounded-sm border border-rule bg-ground px-3 py-2.5 text-sm focus:border-ink focus:outline-none"
      />
      {#if matches.length > 0}
        <ul class="list-none p-0 mt-2 m-0 divide-y divide-rule border-y border-rule">
          {#each matches as n (n.slug)}
            <li>
              <button
                onclick={() => choose(n.slug)}
                class="w-full text-left py-2.5 text-sm text-ink hover:text-quiet cursor-pointer"
              >{n.name}{n.people ? ` · ${n.people}` : ''}</button>
            </li>
          {/each}
        </ul>
      {:else if query.trim().length >= 2}
        <p class="apparatus text-[11px] text-faint mt-2">
          Nothing matching. The directory covers Nations headquartered in
          British Columbia.
        </p>
      {/if}
    {/if}
  </section>
{/if}
