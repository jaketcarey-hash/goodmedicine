<script lang="ts">
  /**
   * The action layer: the point where a plan stops telling you to go and do
   * something and does the part it can honestly do.
   *
   * Three rules, and the first one is the one that shaped the rest:
   *
   * 1. **Never record money that has not moved.** This planner is usually
   *    opened before the cheque clears. Creating a savings goal is safe — it
   *    is a container waiting for a deposit. Recording the deposit itself
   *    would be a lie, and it would corrupt the pace projection on the
   *    savings tracker, which reads real dated deposits.
   *
   * 2. **Where a write would be dishonest, compute instead.** A distribution
   *    is a lump, not a monthly extra, so nothing is written to the debt
   *    plan. `calculatePayoff` grew a one-time payment so the effect can be
   *    shown exactly — months and interest removed — without changing a
   *    stored plan on the strength of an intention.
   *
   * 3. **Nothing happens without a visible confirmation naming what
   *    changed and where to find it.** No silent cross-store writes.
   */
  import { getGoals, createGoal, type SavingsGoal } from '../lib/savings-store';
  import { getPlan, calculatePayoff, calculateTotalInterest } from '../lib/debt-store';

  interface Props {
    segmentId: string;
    label: string;
    amount: number;
  }
  let { segmentId, label, amount }: Props = $props();

  let goals = $state<SavingsGoal[]>([]);
  let debtPlan = $state<ReturnType<typeof getPlan> | null>(null);
  let created = $state<{ name: string; target: number } | null>(null);
  let ready = $state(false);

  $effect(() => {
    if (ready) return;
    goals = getGoals();
    const p = getPlan();
    debtPlan = p.debts.length > 0 ? p : null;
    ready = true;
  });

  const goalName = $derived(segmentId === 'emergency' ? 'Emergency fund' : label);
  const category = $derived<SavingsGoal['category']>(
    segmentId === 'emergency' ? 'emergency' : 'custom',
  );
  let existing = $derived(
    goals.find((g) => g.name.toLowerCase() === goalName.toLowerCase()) ?? null,
  );

  function setUpGoal() {
    const goal = createGoal(goalName, Math.round(amount), category);
    goals = getGoals();
    created = { name: goal.name, target: goal.targetAmount };
  }

  // ---- What this lump would actually do to the debt plan ----
  let debtEffect = $derived.by(() => {
    if (segmentId !== 'debt' || !debtPlan || amount <= 0) return null;
    const base = calculatePayoff(debtPlan);
    const after = calculatePayoff(debtPlan, { amount });
    const baseClears = base.length > 0 && base[base.length - 1].totalBalance <= 0.01;
    const afterClears = after.length > 0 && after[after.length - 1].totalBalance <= 0.01;
    const interestSaved = calculateTotalInterest(base) - calculateTotalInterest(after);
    return {
      monthsSaved: base.length - after.length,
      interestSaved,
      baseClears,
      afterClears,
      target: debtPlan.strategy === 'avalanche' ? 'highest-rate' : 'smallest',
    };
  });

  const money = (n: number) => '$' + Math.round(n).toLocaleString('en-CA');
</script>

{#if ready}
  {#if segmentId === 'debt'}
    {#if debtEffect}
      <div class="mt-3 border-l-2 border-rule pl-4">
        <p class="text-sm leading-relaxed text-quiet">
          {#if debtEffect.afterClears && !debtEffect.baseClears}
            Putting {money(amount)} on your {debtEffect.target} debt is what turns a
            balance that never clears into one that does. Nothing here is saved to
            your debt plan — this is what the payment would do.
          {:else if debtEffect.monthsSaved > 0 || debtEffect.interestSaved > 1}
            Against the debts you have entered, {money(amount)} on your
            {debtEffect.target} debt clears it
            {debtEffect.monthsSaved} {debtEffect.monthsSaved === 1 ? 'month' : 'months'}
            sooner and removes about {money(debtEffect.interestSaved)} of interest.
          {:else}
            Against the debts you have entered, this amount does not change the
            payoff date much — the balances are small enough that the minimums
            were already getting there.
          {/if}
        </p>
        <p class="apparatus mt-1.5 text-[11px] leading-snug text-faint">
          Computed from your saved debt plan as a one-time payment. Your plan is
          not changed — a distribution is a lump, not a monthly amount, and
          storing it as one would shorten the projection by years that are not
          going to happen.
        </p>
        <a
          href="/money/debt-planner"
          class="mt-2 inline-block text-sm text-ink underline decoration-rule underline-offset-2 hover:decoration-ink"
        >Open the Debt Planner</a>
      </div>
    {:else}
      <div class="mt-3 border-l-2 border-rule pl-4">
        <p class="text-sm leading-relaxed text-quiet">
          Enter your debts once and this will show exactly what {money(amount)}
          removes — months, and dollars of interest.
        </p>
        <a
          href="/money/debt-planner"
          class="mt-2 inline-block text-sm text-ink underline decoration-rule underline-offset-2 hover:decoration-ink"
        >Open the Debt Planner</a>
      </div>
    {/if}

  {:else if segmentId === 'emergency' || segmentId === 'savings'}
    <div class="mt-3 border-l-2 border-rule pl-4">
      {#if created}
        <p class="text-sm leading-relaxed text-ink">
          Created “{created.name}” with a target of {money(created.target)}, at
          zero so far.
        </p>
        <p class="apparatus mt-1.5 text-[11px] leading-snug text-faint">
          The goal is set up and waiting. Record the deposit once the money is
          actually in the account — the tracker plots real dated deposits, so an
          entry made early would put a bend in a line that never happened.
        </p>
        <a
          href="/money/savings-tracker"
          class="mt-2 inline-block text-sm text-ink underline decoration-rule underline-offset-2 hover:decoration-ink"
        >Open the Savings Tracker</a>
      {:else if existing}
        <p class="text-sm leading-relaxed text-quiet">
          You already have a goal called “{existing.name}” — {money(existing.currentAmount)}
          of {money(existing.targetAmount)}. Nothing new was created.
        </p>
        <a
          href="/money/savings-tracker"
          class="mt-2 inline-block text-sm text-ink underline decoration-rule underline-offset-2 hover:decoration-ink"
        >Add this to it</a>
      {:else}
        <p class="text-sm leading-relaxed text-quiet">
          Set the goal up now and it is ready for the deposit when the money lands.
        </p>
        <button
          onclick={setUpGoal}
          class="mt-2 cursor-pointer rounded-sm bg-ink px-4 py-2 text-sm font-medium text-ground transition-colors hover:bg-black"
        >
          Create “{goalName}” — {money(amount)}
        </button>
      {/if}
    </div>
  {/if}
{/if}
