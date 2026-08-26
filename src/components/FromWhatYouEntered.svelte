<script lang="ts">
  /**
   * What the site already knows, offered — never filled in.
   *
   * Every tool on this site used to open as an empty form. Someone who had
   * built a budget, checked Section 87 and entered a household still met a
   * blank Debt Planner, and the site said nothing about what it already held.
   * That silence is what made seventeen tools read as seventeen calculators.
   *
   * This component is the offer. Three rules live here so no tool has to hold
   * them:
   *
   * 1. **It never fills the field.** It renders a fact and a button; the
   *    parent does the write, and only after she taps. A silently pre-filled
   *    form is a claim she never made, and on this site a number nobody
   *    entered is not her number.
   *
   * 2. **It names the source, always.** "From your August budget", not "we
   *    found". Provenance is set in the apparatus voice for the same reason
   *    every other figure on this site is: a claim about the record is not
   *    the record.
   *
   * 3. **It renders nothing when nothing is known.** No empty state, no
   *    prompt to go and enter data elsewhere. An empty tool stays an empty
   *    tool — a banner scolding someone about what they have not done yet is
   *    the opposite of this site's posture, and `money-picture.ts` already
   *    refuses to punish absence.
   *
   * **Offer into emptiness, never into a decision.** There is deliberately no
   * dismiss button. A dismissal that does not persist is theatre, and one that
   * does would need a storage key for a preference — so instead the parent
   * shows this only while the thing being offered is *untouched*. Once she has
   * entered anything of her own, the offer is gone: a tool that keeps
   * suggesting what she already declined by acting is nagging, and the
   * condition, not a button, is what stops it.
   */

  interface Props {
    /** What the site knows, in plain words. Empty or null renders nothing. */
    fact: string | null;
    /** Where it came from, and when if that matters. Shown in the apparatus. */
    source: string;
    /** Button label. Says what accepting does, not "OK". */
    action: string;
    /** The write. Runs only on tap, and belongs to the parent's own store. */
    onuse: () => void;
    /** What accepting will not do — an unknown it cannot supply for her. */
    caveat?: string;
  }

  let { fact, source, action, onuse, caveat }: Props = $props();
</script>

{#if fact}
  <div class="border border-rule rounded-sm bg-white px-3.5 py-3 mb-4">
    <p class="text-sm text-ink m-0">{fact}</p>
    <p class="apparatus text-faint mt-1 m-0">{source}</p>
    {#if caveat}
      <p class="text-sm text-quiet mt-2 m-0 max-w-[52ch]">{caveat}</p>
    {/if}
    <button
      type="button"
      onclick={onuse}
      class="mt-2.5 text-sm font-medium text-ink underline decoration-rule underline-offset-2
        hover:decoration-ink cursor-pointer bg-transparent border-0 p-0"
    >
      {action}
    </button>
  </div>
{/if}
