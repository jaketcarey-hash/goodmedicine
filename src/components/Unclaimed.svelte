<script lang="ts">
  /**
   * The most consequential thing this site says, so the copy is as much of
   * the work as the code.
   *
   * The headline never says "you are owed". It says filing could be worth up
   * to a figure, and the reasons it might be less sit beside it rather than
   * below the fold. Someone who acts on an overstatement here and finds
   * nothing has been failed worse than someone who was never told — this
   * audience has been promised things with conditions attached before, and
   * the conditions belong in the same breath as the number.
   */
  import { onMount } from 'svelte';
  import {
    getHousehold, saveHousehold, makeChild, MAX_RETRO_YEARS, type Household,
  } from '../lib/household-store';
  import { draftFromWhatIsKnown, childrenLikely } from '../lib/household-draft';
  import { buildEntitlements, type EntitlementPicture } from '../lib/entitlements';
  import { STORAGE_KEYS } from '../lib/storage-keys';
  import { getMoneyPicture } from '../lib/money-picture';
  import { slide } from 'svelte/transition';

  let household = $state<Household | null>(null);
  let editing = $state(false);
  let ready = $state(false);
  let picture = $state<EntitlementPicture | null>(null);
  let suggestChildren = $state(false);

  const thisYear = new Date().getFullYear();

  onMount(() => {
    const saved = getHousehold();
    household = saved ?? draftFromWhatIsKnown();
    editing = !saved;
    suggestChildren = !saved && childrenLikely();
    if (saved) recompute();
    ready = true;
  });

  function recompute() {
    if (!household) return;
    const money = getMoneyPicture();
    let verdict: string | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SECTION87_RESULT);
      if (raw) verdict = JSON.parse(raw)?.outcome ?? null;
    } catch { /* ignore */ }
    picture = buildEntitlements({
      household,
      exemptionVerdict: verdict,
      hasEmploymentIncome: (money.income?.monthly ?? 0) > 0 || !!money.household?.isEmployed,
    });
  }

  function save() {
    if (!household) return;
    saveHousehold(household);
    household = getHousehold();
    editing = false;
    recompute();
  }

  function addChild() {
    if (!household) return;
    household.children = [...household.children, makeChild(thisYear - 5)];
  }
  function removeChild(id: string) {
    if (!household) return;
    household.children = household.children.filter((c) => c.id !== id);
  }

  const money = (n: number) => '$' + Math.round(n).toLocaleString('en-CA');
  let quantified = $derived(picture?.entitlements.filter((e) => e.status === 'quantified') ?? []);
  let named = $derived(picture?.entitlements.filter((e) => e.status === 'named') ?? []);
</script>

{#if ready && household}
  {#if editing}
    <!-- ---------- Who is in the house ---------- -->
    <section class="rounded-sm border border-rule bg-white p-5">
      <h2 class="text-lg font-semibold">Four questions</h2>
      <p class="mt-1.5 text-sm text-quiet leading-relaxed max-w-prose">
        Benefits in this country are worked out on a household, not a person.
        Nothing here leaves the device.
      </p>

      <div class="mt-5 space-y-5">
        <div>
          <span class="apparatus-label block mb-2">Adults in the household</span>
          <div class="flex gap-2">
            {#each [1, 2] as n}
              <button
                onclick={() => (household!.adults = n as 1 | 2)}
                class="flex-1 py-2.5 rounded-sm text-sm font-medium border transition-colors cursor-pointer
                  {household.adults === n ? 'border-ink text-ink' : 'border-rule text-text-muted hover:border-quiet'}"
              >{n === 1 ? 'Just me' : 'Two of us'}</button>
            {/each}
          </div>
        </div>

        <div>
          <span class="apparatus-label block mb-2">Children under 18</span>
          {#if household.children.length > 0}
            <ul class="list-none p-0 m-0 space-y-2 mb-2">
              {#each household.children as child (child.id)}
                <li class="flex items-center gap-3" transition:slide={{ duration: 150 }}>
                  <label class="text-sm text-quiet">Born</label>
                  <input
                    type="number" min={thisYear - 17} max={thisYear}
                    bind:value={child.birthYear}
                    class="w-24 rounded-sm border border-rule bg-ground px-3 py-2 text-sm tabular-nums focus:border-ink focus:outline-none"
                  />
                  <span class="apparatus text-xs text-faint">
                    {thisYear - child.birthYear} years old
                  </span>
                  <button
                    onclick={() => removeChild(child.id)}
                    class="ml-auto apparatus text-xs text-faint hover:text-ink cursor-pointer"
                  >remove</button>
                </li>
              {/each}
            </ul>
          {/if}
          <button
            onclick={addChild}
            class="w-full py-2.5 rounded-sm border border-dashed border-rule text-sm font-medium
              text-text-muted hover:border-quiet hover:text-ink transition-colors cursor-pointer"
          >+ Add a child</button>
          <p class="apparatus text-[11px] text-faint mt-2 leading-snug">
            The year is enough — the child benefit changes at six and ends at
            eighteen, so nothing here needs a full birthday.
          </p>
          {#if suggestChildren && household.children.length === 0}
            <p class="apparatus text-[11px] text-unsettled mt-1.5 leading-snug">
              You have told the site elsewhere that there are children in the
              household. Adding them here is what makes the figure yours.
            </p>
          {/if}
        </div>

        <div>
          <label for="unfiled" class="apparatus-label block mb-2">
            Tax years with no return filed
          </label>
          <input
            id="unfiled" type="number" min="0" max={MAX_RETRO_YEARS}
            bind:value={household.yearsUnfiled}
            class="w-24 rounded-sm border border-rule bg-ground px-3 py-2.5 text-sm tabular-nums focus:border-ink focus:outline-none"
          />
          <p class="apparatus text-[11px] text-faint mt-2 leading-snug">
            Zero if you are up to date. CRA reaches back {MAX_RETRO_YEARS} years,
            so that is the most this can count.
          </p>
        </div>
      </div>

      <button
        onclick={save}
        class="mt-6 w-full py-3 rounded-sm bg-ink text-ground text-sm font-medium hover:bg-black transition-colors cursor-pointer"
      >See what that adds up to</button>
    </section>

  {:else if picture}
    <!-- ---------- The answer ---------- -->
    <section class="border-b border-rule pb-6">
      {#if picture.quantifiedTotal > 0}
        <p class="text-xl md:text-2xl font-semibold tracking-[-0.015em] leading-snug max-w-2xl">
          Filing the {picture.yearsUnfiled} missing
          {picture.yearsUnfiled === 1 ? 'year' : 'years'} could be worth up to
          {money(picture.quantifiedTotal)} to your household.
        </p>
        <div class="mt-3 space-y-1.5">
          {#each picture.caveats as caveat}
            <p class="text-sm text-quiet leading-relaxed max-w-prose">{caveat}</p>
          {/each}
        </div>
      {:else if picture.yearsUnfiled === 0}
        <p class="text-xl md:text-2xl font-semibold tracking-[-0.015em] leading-snug max-w-2xl">
          Your returns are up to date, so the benefits paid from them are reaching you.
        </p>
        <p class="mt-2 text-sm text-quiet leading-relaxed max-w-prose">
          The things below are not paid automatically. They are claimed, and
          they are the ones people most often leave.
        </p>
      {:else}
        <p class="text-xl md:text-2xl font-semibold tracking-[-0.015em] leading-snug max-w-2xl">
          Filing the missing years is still worth doing.
        </p>
        <p class="mt-2 text-sm text-quiet leading-relaxed max-w-prose">
          Nothing here computes to a figure for your household, but the
          Groceries and Essentials Benefit and anything else income-tested is
          paid from a filed return.
        </p>
      {/if}
    </section>

    {#if quantified.length > 0}
      <section class="mt-8">
        <h2 class="apparatus-label border-b border-rule pb-2.5">Where that comes from</h2>
        <ul class="list-none p-0 m-0 divide-y divide-rule">
          {#each quantified as e}
            <li class="py-4">
              <div class="flex items-baseline justify-between gap-3">
                <span class="text-[15px] font-medium text-ink">{e.label}</span>
                <span class="apparatus text-sm text-ink tabular-nums flex-shrink-0">
                  up to {money(e.totalMax ?? 0)}
                </span>
              </div>
              <p class="apparatus text-[11px] text-faint mt-1 leading-snug">
                {money(e.annualMax ?? 0)} a year at most × {e.years}
                {e.years === 1 ? 'year' : 'years'} · {e.basis}
              </p>
              {#if e.why}<p class="text-sm text-quiet mt-2 leading-relaxed max-w-prose">{e.why}</p>{/if}
              <p class="text-sm text-ink mt-2 leading-relaxed max-w-prose">{e.action}</p>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if picture.yearExpiring !== null}
      <section class="mt-8 border-l-2 border-unsettled pl-4">
        <p class="text-sm font-medium text-ink">The window closes one year at a time</p>
        <p class="text-sm text-quiet mt-1 leading-relaxed max-w-prose">
          CRA reaches back {MAX_RETRO_YEARS} years. When this calendar year ends,
          {picture.yearExpiring} falls out of reach and stays there. That is the
          only thing on this page with a deadline attached.
        </p>
      </section>
    {/if}

    {#if named.length > 0}
      <section class="mt-10">
        <h2 class="apparatus-label border-b border-rule pb-2.5">
          Money that is real but cannot be counted from here
        </h2>
        <p class="text-sm text-quiet mt-3 mb-1 leading-relaxed max-w-prose">
          No figures on these, because working them out needs papers this device
          does not have. A number here would look exactly like the ones above,
          and it would be a guess.
        </p>
        <ul class="list-none p-0 m-0 divide-y divide-rule">
          {#each named as e}
            <li class="py-4">
              <p class="text-[15px] font-medium text-ink">{e.label}</p>
              {#if e.why}<p class="text-sm text-quiet mt-1 leading-relaxed max-w-prose">{e.why}</p>{/if}
              <p class="text-sm text-ink mt-2 leading-relaxed max-w-prose">{e.action}</p>
              <p class="apparatus text-[11px] text-faint mt-1.5 leading-snug">{e.basis}</p>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section class="mt-10 border-t border-rule pt-5">
      <p class="text-sm text-quiet leading-relaxed max-w-prose">
        Free tax clinics file back years for people on modest incomes, and many
        band offices run one or know where the nearest is.
        <a href="/money/taxes" class="text-ink underline decoration-rule underline-offset-2 hover:decoration-ink">How filing works</a>.
      </p>
      <button
        onclick={() => (editing = true)}
        class="mt-4 apparatus text-xs text-faint hover:text-ink cursor-pointer underline decoration-rule underline-offset-2"
      >Change the household</button>
    </section>
  {/if}
{/if}
