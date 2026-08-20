<script lang="ts">
  /**
   * Your money plan — a personal record.
   *
   * The site's whole argument is "show your work." This surface applies that
   * to your own money: the picture section renders like the record surface —
   * rubric headings, values with provenance, absence stated rather than
   * zero-filled — but the record it shows is yours, built live from what
   * you've already entered in the other tools. Nothing here is stored except
   * the vision and intentions; everything else is derived on render, so the
   * page can never show a stale conclusion about live data.
   *
   * Education, not advice: the suggestions are "what usually helps," each one
   * naming the datum it rests on. No score, no metric that can go down.
   */
  import { getMoneyPicture, suggestNextSteps, type MoneyPicture, type NextStep } from '../lib/money-picture';
  import { getMoneyPlan, saveMoneyPlan, generateIntentionId, type Intention } from '../lib/money-plan-store';
  import { getGoals, createGoal, type SavingsGoal } from '../lib/savings-store';
  import { slide } from 'svelte/transition';

  let vision = $state('');
  let intentions = $state<Intention[]>([]);
  let newIntention = $state('');
  let loaded = $state(false);
  let hadPlan = $state(false);
  let picture = $state<MoneyPicture | null>(null);
  let steps = $state<NextStep[]>([]);
  let goals = $state<SavingsGoal[]>([]);

  // Load once on mount; derive the picture fresh every visit.
  $effect(() => {
    if (typeof window === 'undefined' || loaded) return;
    const plan = getMoneyPlan();
    if (plan) {
      vision = plan.vision ?? '';
      intentions = plan.intentions ?? [];
      hadPlan = true;
    }
    picture = getMoneyPicture();
    steps = suggestNextSteps(getMoneyPicture());
    goals = getGoals();
    loaded = true;
  });

  /* ---- The one step that can act ----
   *
   * Of the suggested steps, only the emergency cushion has a write that is
   * honest without asking anything further: creating an empty goal. Every
   * other step needs a decision the person has not made yet, and this page
   * does not make decisions on their behalf.
   *
   * The target is one month of their own recorded expenses, not a round
   * number from somewhere else — the same rule the rest of the picture
   * follows, that a suggestion names the datum it rests on. */
  let cushionCreated = $state<{ name: string; target: number } | null>(null);

  let cushionTarget = $derived(
    picture?.expenses ? Math.round(picture.expenses.monthly) : null,
  );
  let cushionExists = $derived(
    goals.some((g) => g.category === 'emergency') || cushionCreated !== null,
  );

  function createCushion() {
    if (!cushionTarget || cushionTarget <= 0) return;
    const goal = createGoal('Emergency fund', cushionTarget, 'emergency');
    goals = getGoals();
    cushionCreated = { name: goal.name, target: goal.targetAmount };
  }

  // Auto-save, the BudgetTool way — but never write an empty first plan.
  $effect(() => {
    const v = vision;
    const list = intentions;
    if (!loaded) return;
    if (!hadPlan && v.trim() === '' && list.length === 0) return;
    saveMoneyPlan(v, list);
    hadPlan = true;
  });

  function addIntention() {
    const label = newIntention.trim();
    if (!label) return;
    intentions = [...intentions, { id: generateIntentionId(), label }];
    newIntention = '';
  }

  function removeIntention(id: string) {
    intentions = intentions.filter((i) => i.id !== id);
  }

  function linkGoal(intentionId: string, goalId: string) {
    intentions = intentions.map((i) =>
      i.id === intentionId ? { ...i, savingsGoalId: goalId || undefined } : i,
    );
  }

  function goalFor(i: Intention): SavingsGoal | undefined {
    return goals.find((g) => g.id === i.savingsGoalId);
  }

  const money = (n: number) => '$' + Math.round(n).toLocaleString('en-CA');
  const monthName = (m: string) => {
    const [y, mo] = m.split('-').map(Number);
    return new Date(y, mo - 1, 1).toLocaleDateString('en-CA', { month: 'long' });
  };
  const shortDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-CA', { day: 'numeric', month: 'long', year: 'numeric' });

  const OUTCOME_WORDS: Record<string, string> = {
    'likely-exempt': 'likely exempt',
    'likely-not-exempt': 'likely not exempt',
    'grey-zone': 'grey zone',
    'not-eligible': 'not eligible',
  };
</script>

<div class="max-w-[68ch]">
  <p class="apparatus text-faint mb-10">
    Lives on this phone. Nothing leaves it.
  </p>

  <!-- ── Where you're headed ─────────────────────────────────── -->
  <section class="mb-12">
    <h2 class="apparatus-label mb-3">Where you're headed</h2>
    <p class="text-sm text-quiet mb-3 max-w-[52ch]">
      Before any numbers: what should your money have made possible — for you,
      your family, the people after you? A sentence is enough.
    </p>
    <textarea
      bind:value={vision}
      rows="3"
      placeholder="In five years I want…"
      class="w-full text-[15px] leading-relaxed bg-white border border-rule rounded-sm px-3.5 py-3
        focus:border-ink focus:outline-none placeholder:text-faint resize-y"
    ></textarea>
    <p class="apparatus text-faint mt-3">
      Vision before numbers follows
      <a
        href="https://learninghub.prospercanada.org/knowledge/braiding-mind-body-and-spirit-a-financial-wellness-bundle-2/"
        rel="noopener noreferrer"
        target="_blank"
        class="underline decoration-rule underline-offset-2 hover:decoration-ink"
      >Braiding Mind, Body, and Spirit</a>
      — Prosper Canada, AFOA Canada and Simon Brascoupé, 2025
    </p>
  </section>

  <!-- ── What you're working toward ──────────────────────────── -->
  <section class="mb-12">
    <h2 class="apparatus-label mb-3">What you're working toward</h2>
    {#if intentions.length === 0}
      <p class="text-sm text-quiet mb-3 max-w-[52ch]">
        Name the things, big or small — a licence, a move, a cushion, being
        done with a debt. If one has a dollar figure, you can tie it to a goal
        in the Savings Tracker.
      </p>
    {/if}

    {#if intentions.length > 0}
      <ul class="list-none p-0 m-0 mb-4 divide-y divide-rule border-y border-rule">
        {#each intentions as intention (intention.id)}
          {@const goal = goalFor(intention)}
          <li class="py-3 flex flex-wrap items-baseline gap-x-4 gap-y-1" transition:slide={{ duration: 200 }}>
            <span class="text-[15px] font-medium">{intention.label}</span>
            {#if goal}
              <a href="/money/savings-tracker" class="apparatus text-verified no-underline hover:underline">
                {money(goal.currentAmount)} of {money(goal.targetAmount)} saved
              </a>
            {:else if goals.length > 0}
              <select
                value={intention.savingsGoalId ?? ''}
                onchange={(e) => linkGoal(intention.id, e.currentTarget.value)}
                class="apparatus text-faint bg-white border border-rule rounded-sm px-1.5 py-0.5 focus:border-ink focus:outline-none"
              >
                <option value="">tie to a savings goal…</option>
                {#each goals as g}
                  <option value={g.id}>{g.name}</option>
                {/each}
              </select>
            {/if}
            <button
              onclick={() => removeIntention(intention.id)}
              class="ml-auto apparatus text-faint hover:text-ink cursor-pointer"
              aria-label={`Remove ${intention.label}`}
            >
              remove
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    <form
      onsubmit={(e) => { e.preventDefault(); addIntention(); }}
      class="flex gap-2"
    >
      <label class="sr-only" for="new-intention">Add something you're working toward</label>
      <input
        id="new-intention"
        bind:value={newIntention}
        placeholder="Add one…"
        class="flex-1 text-sm bg-white border border-rule rounded-sm px-3 py-2
          focus:border-ink focus:outline-none placeholder:text-faint"
      />
      <button
        type="submit"
        disabled={!newIntention.trim()}
        class="px-4 py-2 rounded-sm text-sm font-semibold transition-colors cursor-pointer
          {newIntention.trim()
            ? 'bg-ink text-ground hover:bg-ink/85'
            : 'bg-rule text-faint cursor-not-allowed'}"
      >
        Add
      </button>
    </form>
  </section>

  <!-- ── Your picture right now — the personal record ────────── -->
  <section class="mb-12">
    <h2 class="apparatus-label mb-1">Your picture right now</h2>
    <p class="text-sm text-quiet mb-4 max-w-[52ch]">
      Built from what you've entered in the tools — each line says where it
      comes from. What's missing is part of the picture too.
    </p>

    {#if picture}
      <dl class="m-0 border-y border-rule divide-y divide-rule">
        <!-- Income -->
        <div class="py-3 grid grid-cols-[7.5rem_1fr] gap-x-4 items-baseline">
          <dt class="apparatus-label">Income</dt>
          <dd class="m-0">
            {#if picture.income}
              <span class="font-mono text-[13px] tabular-nums text-ink">{money(picture.income.monthly)} a month</span>
              <span class="apparatus text-faint ml-3">from your {monthName(picture.income.month)} budget</span>
            {:else}
              <span class="text-sm text-unsettled">Not on record yet</span>
              <a href="/money/budget-tool" class="apparatus text-ink underline decoration-rule underline-offset-2 hover:decoration-ink ml-3">start with one month</a>
            {/if}
          </dd>
        </div>

        <!-- Spending -->
        <div class="py-3 grid grid-cols-[7.5rem_1fr] gap-x-4 items-baseline">
          <dt class="apparatus-label">Spending</dt>
          <dd class="m-0">
            {#if picture.expenses}
              <span class="font-mono text-[13px] tabular-nums text-ink">{money(picture.expenses.monthly)} a month</span>
              <span class="apparatus text-faint ml-3">from your {monthName(picture.expenses.month)} budget</span>
            {:else}
              <span class="text-sm text-unsettled">Not on record yet</span>
            {/if}
          </dd>
        </div>

        <!-- Balance -->
        <div class="py-3 grid grid-cols-[7.5rem_1fr] gap-x-4 items-baseline">
          <dt class="apparatus-label">Balance</dt>
          <dd class="m-0">
            {#if picture.surplus !== null}
              <span class="font-mono text-[13px] tabular-nums text-ink">
                {picture.surplus >= 0 ? '+' : '−'}{money(Math.abs(picture.surplus))} a month
              </span>
              {#if picture.surplus < 0}
                <span class="apparatus text-unsettled ml-3">short this month</span>
              {:else}
                <span class="apparatus text-verified ml-3">room to work with</span>
              {/if}
            {:else}
              <span class="text-sm text-unsettled">Needs both income and spending</span>
            {/if}
          </dd>
        </div>

        <!-- Debt -->
        <div class="py-3 grid grid-cols-[7.5rem_1fr] gap-x-4 items-baseline">
          <dt class="apparatus-label">Debt</dt>
          <dd class="m-0">
            {#if picture.debt}
              <span class="font-mono text-[13px] tabular-nums text-ink">{money(picture.debt.total)}</span>
              {#if picture.debt.debtFreeMonths !== null}
                <span class="apparatus text-faint ml-3">debt-free in {picture.debt.debtFreeMonths} months on your plan</span>
              {:else}
                <span class="apparatus text-unsettled ml-3">plan never reaches zero — worth a look</span>
              {/if}
            {:else}
              <span class="text-sm text-faint">None recorded</span>
              <a href="/money/debt-planner" class="apparatus text-ink underline decoration-rule underline-offset-2 hover:decoration-ink ml-3">map yours</a>
            {/if}
          </dd>
        </div>

        <!-- Savings -->
        <div class="py-3 grid grid-cols-[7.5rem_1fr] gap-x-4 items-baseline">
          <dt class="apparatus-label">Savings</dt>
          <dd class="m-0">
            {#if picture.savings}
              <span class="font-mono text-[13px] tabular-nums text-ink">{money(picture.savings.saved)} of {money(picture.savings.target)}</span>
              <span class="apparatus text-faint ml-3">across {picture.savings.goals} {picture.savings.goals === 1 ? 'goal' : 'goals'}</span>
            {:else}
              <span class="text-sm text-unsettled">No goals yet</span>
              <a href="/money/savings-tracker" class="apparatus text-ink underline decoration-rule underline-offset-2 hover:decoration-ink ml-3">set the first one</a>
            {/if}
          </dd>
        </div>

        <!-- Net worth -->
        <div class="py-3 grid grid-cols-[7.5rem_1fr] gap-x-4 items-baseline">
          <dt class="apparatus-label">Net worth</dt>
          <dd class="m-0">
            {#if picture.netWorth}
              <span class="font-mono text-[13px] tabular-nums text-ink">{money(picture.netWorth.current)}</span>
              {#if picture.netWorth.trend}
                <span class="apparatus text-faint ml-3">
                  {picture.netWorth.trend === 'up' ? 'up' : picture.netWorth.trend === 'down' ? 'down' : 'flat'} since your last snapshot
                </span>
              {:else if picture.netWorth.lastSnapshot}
                <span class="apparatus text-faint ml-3">snapshot {shortDate(picture.netWorth.lastSnapshot)}</span>
              {/if}
            {:else}
              <span class="text-sm text-faint">Not tracked yet</span>
            {/if}
          </dd>
        </div>

        <!-- Tax status -->
        <div class="py-3 grid grid-cols-[7.5rem_1fr] gap-x-4 items-baseline">
          <dt class="apparatus-label">Tax status</dt>
          <dd class="m-0">
            {#if picture.taxStatus}
              <span class="text-sm text-ink">{OUTCOME_WORDS[picture.taxStatus.outcome] ?? picture.taxStatus.outcome}</span>
              <span class="apparatus text-faint ml-3">checked {shortDate(picture.taxStatus.checkedOn)}</span>
            {:else}
              <span class="text-sm text-unsettled">Section 87 not checked</span>
              <a href="/rights/section-87-checker" class="apparatus text-ink underline decoration-rule underline-offset-2 hover:decoration-ink ml-3">five questions</a>
            {/if}
          </dd>
        </div>

        <!-- Benefits -->
        <div class="py-3 grid grid-cols-[7.5rem_1fr] gap-x-4 items-baseline">
          <dt class="apparatus-label">Benefits</dt>
          <dd class="m-0">
            {#if picture.benefits}
              <span class="text-sm text-ink">last checked</span>
              <span class="apparatus text-faint ml-3">{shortDate(picture.benefits.checkedOn)}</span>
            {:else}
              <span class="text-sm text-unsettled">Never checked</span>
              <a href="/self/benefits" class="apparatus text-ink underline decoration-rule underline-offset-2 hover:decoration-ink ml-3">six questions</a>
            {/if}
          </dd>
        </div>
      </dl>
    {/if}
  </section>

  <!-- ── What usually helps next ─────────────────────────────── -->
  <section class="mb-8">
    <h2 class="apparatus-label mb-1">What usually helps next</h2>
    <p class="text-sm text-quiet mb-4 max-w-[52ch]">
      Drawn from your picture, most useful first. Each one says why it's here.
      For anything beyond education, a licensed advisor, a tax professional or
      a Licensed Insolvency Trustee is the right next voice.
    </p>

    <ol class="list-none p-0 m-0 divide-y divide-rule border-y border-rule">
      {#each steps as step (step.id)}
        <li class="py-4">
          <p class="text-[15px] font-medium m-0 mb-1">{step.title}</p>
          <p class="text-sm text-quiet m-0 mb-2 max-w-[56ch]">{step.why}</p>
          <p class="text-sm m-0">
            <a href={step.tool.href} class="text-ink underline decoration-rule underline-offset-2 hover:decoration-ink font-medium">{step.tool.label}</a>
            {#if step.article}
              <span class="text-faint mx-2">·</span>
              <a href={step.article.href} class="text-quiet underline decoration-rule underline-offset-2 hover:decoration-ink">{step.article.label}</a>
            {/if}
          </p>

          {#if step.id === 'emergency-cushion' && cushionTarget}
            {#if cushionCreated}
              <p class="text-sm text-ink m-0 mt-2.5">
                Created “{cushionCreated.name}” with a target of
                ${cushionCreated.target.toLocaleString('en-CA')}, at zero so far.
              </p>
              <p class="apparatus m-0 mt-1 text-[11px] leading-snug text-faint">
                Record deposits as they actually happen — the tracker plots real
                dated deposits.
              </p>
            {:else if cushionExists}
              <p class="text-sm text-quiet m-0 mt-2.5">
                You already have an emergency goal. Nothing new was created.
              </p>
            {:else}
              <button
                onclick={createCushion}
                class="mt-2.5 cursor-pointer rounded-sm border border-ink px-3.5 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-ground"
              >
                Start one at ${cushionTarget.toLocaleString('en-CA')}
              </button>
              <p class="apparatus m-0 mt-1.5 text-[11px] leading-snug text-faint">
                One month of your {picture?.expenses ? monthName(picture.expenses.month) : ''}
                expenses. Creates the goal only — no money is recorded as moved.
              </p>
            {/if}
          {/if}
        </li>
      {/each}
    </ol>
  </section>
</div>
