<script lang="ts">
  /**
   * "Ask your band office" — with the office named.
   *
   * Dropped into every page that sends a reader to their Nation. When they
   * have named their Nation it links straight to the federal registry's
   * profile — address, phone, website. When they have not, it says what
   * naming it would get them, and where to do that, rather than pretending
   * the advice above it was complete.
   *
   * Quiet on purpose. This sits inside prose that has already made its point;
   * it is the address on the end of the sentence, not a second argument.
   */
  import { onMount } from 'svelte';
  import { knownNation, registryUrl, type KnownNation } from '../lib/band-office';

  interface Props {
    /** What they would be going there to do, so the line reads as a next step. */
    context?: string;
  }
  let { context = '' }: Props = $props();

  let nation = $state<KnownNation | null>(null);
  let ready = $state(false);
  onMount(() => { nation = knownNation(); ready = true; });
</script>

{#if ready}
  <div class="not-prose border-l-2 border-rule pl-4 my-6">
    {#if nation}
      <p class="text-sm text-ink leading-relaxed">
        Your band office is <strong>{nation.name}</strong>{context ? ` — ${context}` : ''}.
      </p>
      <a
        href={registryUrl(nation.bandNumber)}
        rel="noopener noreferrer"
        target="_blank"
        class="mt-1.5 inline-block text-sm text-ink underline decoration-rule underline-offset-2 hover:decoration-ink"
      >Address, phone and website</a>
      <p class="apparatus mt-1.5 text-[11px] leading-snug text-faint">
        From the federal band registry, so it stays current.
      </p>
    {:else}
      <p class="text-sm text-quiet leading-relaxed">
        Name your Nation once and this page can point at your own band office —
        address, phone and website — instead of leaving you to find it.
      </p>
      <a
        href="/money/unclaimed"
        class="mt-1.5 inline-block text-sm text-ink underline decoration-rule underline-offset-2 hover:decoration-ink"
      >Name your Nation</a>
    {/if}
  </div>
{/if}
