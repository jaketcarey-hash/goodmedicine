<script lang="ts">
  /**
   * Drafts she can take away.
   *
   * Copy and print, and nothing else — there is no send button here and there
   * could not be. A site that mailed a federal department on someone's behalf
   * would be acting for her, and everything else here is built so that she
   * acts and the site explains.
   *
   * Blanks are rendered as visible gaps rather than quietly filled, because a
   * letter that invents a date can be contradicted by her own records, in
   * writing, to the body deciding her claim.
   */
  import { onMount } from 'svelte';
  import { allLetters, type Letter } from '../lib/letters';
  import { getHousehold } from '../lib/household-store';
  import { STORAGE_KEYS } from '../lib/storage-keys';

  let letters = $state<Letter[]>([]);
  let open = $state<string | null>(null);
  let copied = $state<string | null>(null);
  let ready = $state(false);

  onMount(() => {
    const hh = getHousehold();
    let likelyExempt = false;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SECTION87_RESULT);
      if (raw) likelyExempt = JSON.parse(raw)?.outcome === 'likely-exempt';
    } catch { /* ignore */ }

    letters = allLetters({
      yearsUnfiled: hh?.yearsUnfiled,
      childCount: hh?.children.length,
      likelyExempt,
    });
    ready = true;
  });

  async function copy(letter: Letter) {
    try {
      await navigator.clipboard.writeText(letter.body.trim());
      copied = letter.id;
      setTimeout(() => (copied = null), 3000);
    } catch {
      copied = 'failed';
      setTimeout(() => (copied = null), 3000);
    }
  }
</script>

{#if ready}
  <ul class="list-none p-0 m-0 space-y-4">
    {#each letters as letter (letter.id)}
      <li class="rounded-sm border border-rule bg-white">
        <div class="p-5">
          <h2 class="text-lg font-semibold leading-snug">{letter.title}</h2>
          <p class="mt-2 text-sm text-quiet leading-relaxed max-w-prose">{letter.purpose}</p>

          <dl class="mt-4 m-0 grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-2">
            <dt class="apparatus-label">Send to</dt>
            <dd class="m-0 text-sm text-ink">{letter.sendTo}</dd>
            {#if letter.before}
              <dt class="apparatus-label">First</dt>
              <dd class="m-0 text-sm text-ink">{letter.before}</dd>
            {/if}
          </dl>

          <button
            onclick={() => (open = open === letter.id ? null : letter.id)}
            class="no-print mt-4 cursor-pointer rounded-sm border border-ink px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-ground"
          >
            {open === letter.id ? 'Hide the draft' : 'Show the draft'}
          </button>
        </div>

        {#if open === letter.id}
          <div class="border-t border-rule p-5">
            <p class="apparatus text-[11px] leading-snug text-faint mb-3">
              A draft, not a submission. Read it, change anything that is not
              true for you, and fill the gaps marked in square brackets before
              you send it.
            </p>

            <pre class="letter-body whitespace-pre-wrap break-words rounded-sm bg-ground border border-rule p-4 text-[13px] leading-relaxed text-ink font-mono">{letter.body.trim()}</pre>

            <div class="no-print mt-3 flex flex-wrap items-center gap-3">
              <button
                onclick={() => copy(letter)}
                class="cursor-pointer rounded-sm bg-ink px-4 py-2 text-sm font-medium text-ground transition-colors hover:bg-black"
              >Copy the text</button>
              <button
                onclick={() => window.print()}
                class="cursor-pointer rounded-sm border border-rule px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-quiet hover:text-ink"
              >Print it</button>
              {#if copied === letter.id}
                <p class="apparatus text-xs text-verified">Copied.</p>
              {:else if copied === 'failed'}
                <p class="apparatus text-xs text-unsettled">
                  Copying did not work — select the text above instead.
                </p>
              {/if}
            </div>

            {#if letter.blanks.length > 0}
              <div class="mt-5 border-t border-rule pt-4">
                <p class="apparatus-label mb-2">What you need to fill in</p>
                <ul class="list-none p-0 m-0 space-y-1">
                  {#each letter.blanks as blank}
                    <li class="text-sm text-quiet">
                      <span class="apparatus text-faint">[{blank.token}]</span>
                      — {blank.label}
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        {/if}
      </li>
    {/each}
  </ul>
{/if}
