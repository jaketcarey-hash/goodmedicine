<script lang="ts">
  import { fly, fade, slide } from 'svelte/transition';

  // ---- State ----
  let step = $state(0);
  let amount = $state('');
  let distributionType = $state<'annual' | 'one-time'>('annual');
  let situations = $state<string[]>([]);
  let saved = $state(false);
  let expandedSegment = $state<string | null>(null);

  // ---- Preset amounts ----
  const presets = [500, 1_000, 2_000, 5_000, 10_000];

  // ---- Situation options ----
  const situationOptions = [
    { id: 'debt', label: 'I have bills or debt that\'s stressing me out' },
    { id: 'no-emergency', label: 'I don\'t have any emergency savings' },
    { id: 'savings-goal', label: 'I have a savings goal I\'m working toward' },
    { id: 'want-invest', label: 'I want to start investing but don\'t know how' },
    { id: 'basics-covered', label: 'I\'m good on the basics — I want to grow this' },
  ];

  // ---- Derived values ----
  let parsedAmount = $derived(parseFloat(amount.replace(/,/g, '')) || 0);
  let canProceedStep0 = $derived(parsedAmount > 0);
  let canProceedStep1 = $derived(situations.length > 0);

  // ---- Plan generation ----
  interface PlanSegment {
    id: string;
    label: string;
    amount: number;
    color: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    barColor: string;
    description: string;
    howTo: string[];
  }

  let plan = $derived.by(() => {
    if (parsedAmount <= 0 || situations.length === 0) return [];

    const segments: PlanSegment[] = [];
    let remaining = parsedAmount;

    const hasDebt = situations.includes('debt');
    const noEmergency = situations.includes('no-emergency');
    const hasSavingsGoal = situations.includes('savings-goal');
    const wantInvest = situations.includes('want-invest');
    const basicsCovered = situations.includes('basics-covered');

    // Count active needs (excluding basics-covered which is an "all good" signal)
    const needCount = [hasDebt, noEmergency, hasSavingsGoal, wantInvest].filter(Boolean).length;

    if (basicsCovered && needCount === 0) {
      // All good — majority to TFSA investment
      const investAmount = Math.round(parsedAmount * 0.85);
      const enjoyAmount = parsedAmount - investAmount;

      segments.push({
        id: 'invest',
        label: 'Invest for growth',
        amount: investAmount,
        color: 'clay',
        bgColor: 'bg-clay-50',
        borderColor: 'border-clay-200',
        textColor: 'text-clay-600',
        barColor: 'bg-clay-400',
        description: 'Open a TFSA and put this to work. One-fund portfolios make it simple.',
        howTo: [
          'Open a TFSA if you don\'t have one — at your bank, Wealthsimple, or Questrade',
          'Deposit the money into your TFSA',
          'Buy one of these: VBAL (balanced), VGRO (growth), or VEQT (all equity) — pick based on your comfort with ups and downs',
          'Don\'t touch it. Let it grow.',
          'That\'s it. You\'re an investor now.',
        ],
      });

      if (enjoyAmount > 0) {
        segments.push({
          id: 'enjoy',
          label: 'Enjoy',
          amount: enjoyAmount,
          color: 'water',
          bgColor: 'bg-water-50',
          borderColor: 'border-water-200',
          textColor: 'text-water-600',
          barColor: 'bg-water-400',
          description: 'You\'re doing the right things. Treat yourself to something meaningful.',
          howTo: [
            'This is your money — you\'ve earned the right to enjoy some of it',
            'No guilt required',
          ],
        });
      }

      return segments;
    }

    // Calculate proportions based on what they selected
    let debtPct = hasDebt ? 0.35 : 0;
    let emergencyPct = noEmergency ? 0.25 : 0;
    let savingsPct = hasSavingsGoal ? 0.20 : 0;
    let investPct = (wantInvest || basicsCovered) ? 0.25 : 0;

    // Normalize so they sum to 1
    const totalPct = debtPct + emergencyPct + savingsPct + investPct;
    if (totalPct > 0) {
      debtPct = debtPct / totalPct;
      emergencyPct = emergencyPct / totalPct;
      savingsPct = savingsPct / totalPct;
      investPct = investPct / totalPct;
    }

    // Round amounts nicely
    const roundTo = parsedAmount >= 1000 ? 50 : 10;
    function roundNice(n: number): number {
      return Math.round(n / roundTo) * roundTo;
    }

    let allocated = 0;

    if (hasDebt) {
      const amt = roundNice(parsedAmount * debtPct);
      allocated += amt;
      segments.push({
        id: 'debt',
        label: 'Pay down debt',
        amount: amt,
        color: 'berry',
        bgColor: 'bg-berry-50',
        borderColor: 'border-berry-200',
        textColor: 'text-berry-600',
        barColor: 'bg-berry-400',
        description: 'Put this toward your highest-interest debt first. Credit card before student loan, always.',
        howTo: [
          'List your debts by interest rate — highest first',
          'Make the minimum payment on everything',
          'Put this entire amount toward the highest-rate debt',
          'Once that\'s gone, roll the payment into the next one',
          'This is called the avalanche method — it saves you the most money',
        ],
      });
    }

    if (noEmergency) {
      const amt = roundNice(parsedAmount * emergencyPct);
      allocated += amt;
      segments.push({
        id: 'emergency',
        label: 'Emergency fund',
        amount: amt,
        color: 'sage',
        bgColor: 'bg-sage-50',
        borderColor: 'border-sage-200',
        textColor: 'text-sage-600',
        barColor: 'bg-sage-400',
        description: 'Open a TFSA savings account if you don\'t have one. This is your "something broke" money.',
        howTo: [
          'Open a high-interest savings account (TFSA if you have room)',
          'Deposit this amount and label it "emergency" in your mind',
          'Goal is eventually $1,000 to $2,000 — enough to handle a surprise',
          'Only touch it for real emergencies — car repair, dental, job loss',
          'Rebuild it if you use it. That\'s the whole system.',
        ],
      });
    }

    if (hasSavingsGoal) {
      const amt = roundNice(parsedAmount * savingsPct);
      allocated += amt;
      segments.push({
        id: 'savings',
        label: 'Savings goal',
        amount: amt,
        color: 'water',
        bgColor: 'bg-water-50',
        borderColor: 'border-water-200',
        textColor: 'text-water-600',
        barColor: 'bg-water-400',
        description: 'Add this to your goal in the savings tracker. Every deposit is progress.',
        howTo: [
          'Open the Savings Goals tracker and add a deposit',
          'If you don\'t have a goal set up yet, create one now',
          'Put this in a separate account if possible — out of sight, out of mind',
          'Watch the progress bar move. That feeling is real.',
        ],
      });
    }

    if (wantInvest || basicsCovered) {
      const amt = roundNice(parsedAmount * investPct);
      allocated += amt;
      segments.push({
        id: 'invest',
        label: 'Invest for growth',
        amount: amt,
        color: 'clay',
        bgColor: 'bg-clay-50',
        borderColor: 'border-clay-200',
        textColor: 'text-clay-600',
        barColor: 'bg-clay-400',
        description: 'Open a TFSA and buy a one-fund portfolio. This is seven-generation thinking in action.',
        howTo: [
          'Open a TFSA if you don\'t have one — at your bank, Wealthsimple, or Questrade',
          'Deposit the money into your TFSA',
          'Buy one of these: VBAL (balanced), VGRO (growth), or VEQT (all equity) — pick based on your comfort with ups and downs',
          'Don\'t touch it. Let it grow.',
          'That\'s it. You\'re an investor now.',
        ],
      });
    }

    // Adjust last segment to account for rounding
    if (segments.length > 0 && allocated !== parsedAmount) {
      segments[segments.length - 1].amount += (parsedAmount - allocated);
    }

    return segments;
  });

  // ---- Investment amount for projections ----
  let investAmount = $derived(plan.find(s => s.id === 'invest')?.amount ?? 0);

  // ---- Compounding projections ----
  const ANNUAL_RETURN = 0.07;

  interface Projection {
    year: number;
    value: number;
  }

  let projections = $derived.by((): Projection[] => {
    if (investAmount <= 0) return [];

    if (distributionType === 'annual') {
      // Annual contributions
      return [1, 5, 10, 20, 30].map(year => {
        // Future value of annuity: PMT * (((1+r)^n - 1) / r)
        const fv = investAmount * ((Math.pow(1 + ANNUAL_RETURN, year) - 1) / ANNUAL_RETURN);
        return { year, value: Math.round(fv) };
      });
    } else {
      // One-time lump sum
      return [1, 5, 10, 20, 30].map(year => {
        const fv = investAmount * Math.pow(1 + ANNUAL_RETURN, year);
        return { year, value: Math.round(fv) };
      });
    }
  });

  let maxProjectionValue = $derived(
    projections.length > 0 ? projections[projections.length - 1].value : 0
  );

  // ---- Navigation ----
  function next() { step++; }
  function back() { step--; }

  function toggleSituation(id: string) {
    if (situations.includes(id)) {
      situations = situations.filter(s => s !== id);
    } else {
      situations = [...situations, id];
    }
  }

  function toggleHowTo(id: string) {
    expandedSegment = expandedSegment === id ? null : id;
  }

  function setPreset(value: number) {
    amount = value.toLocaleString('en-CA');
  }

  // ---- Save plan ----
  function savePlan() {
    const planData = {
      amount: parsedAmount,
      type: distributionType,
      situations,
      segments: plan.map(s => ({ label: s.label, amount: s.amount })),
      projections,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('gm-distribution-plan', JSON.stringify(planData));
    saved = true;
    setTimeout(() => { saved = false; }, 3000);
  }

  // ---- Helpers ----
  function fmt(n: number): string {
    return n.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function fmtCompact(n: number): string {
    if (n >= 1000) {
      return '$' + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K';
    }
    return '$' + fmt(n);
  }

  // Total steps: 0 = amount, 1 = situation, 2 = plan, 3 = projections (if investing)
  let totalSteps = $derived(investAmount > 0 ? 4 : 3);
</script>

<div class="rounded-2xl bg-surface-card border border-stone-200 overflow-hidden shadow-lg">
  <!-- Progress bar -->
  <div class="h-1 bg-stone-100">
    <div
      class="h-full bg-gradient-to-r from-clay-400 to-sage-400 transition-all duration-500 ease-[var(--ease-out)]"
      style="width: {((step + 1) / totalSteps) * 100}%"
    ></div>
  </div>

  <div class="p-5 sm:p-6">
    <!-- Step 0: Amount input -->
    {#if step === 0}
      <div in:fly={{ y: 20, duration: 300 }}>
        <p class="text-sm text-text-muted mb-1">Step 1 of {totalSteps}</p>
        <h3 class="text-xl font-semibold mb-1">How much did you receive?</h3>
        <p class="text-sm text-text-secondary mb-6">Enter the total amount of your distribution.</p>

        <!-- Amount input -->
        <div class="relative mb-4">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-text-muted">$</span>
          <input
            type="text"
            inputmode="numeric"
            bind:value={amount}
            placeholder="0"
            class="w-full rounded-xl border-2 border-stone-200 bg-surface-warm pl-10 pr-4 py-4
              text-2xl font-bold text-text-primary
              placeholder:text-stone-300 focus:border-clay-400 focus:ring-2 focus:ring-clay-200
              focus:outline-none transition-all"
            aria-label="Distribution amount"
          />
        </div>

        <!-- Presets -->
        <div class="flex flex-wrap gap-2 mb-6">
          {#each presets as preset}
            <button
              onclick={() => setPreset(preset)}
              class="px-3.5 py-2 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer
                {parsedAmount === preset
                  ? 'bg-clay-500 text-white border-clay-500'
                  : 'bg-surface-warm text-text-secondary border-stone-200 hover:border-clay-300'}"
            >
              ${fmt(preset)}
            </button>
          {/each}
        </div>

        <!-- Distribution type toggle -->
        <div class="mb-2">
          <p class="text-sm font-medium text-text-secondary mb-2.5">What kind of distribution?</p>
          <div class="flex gap-2">
            <button
              onclick={() => distributionType = 'annual'}
              class="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border-2 transition-all duration-200 cursor-pointer
                {distributionType === 'annual'
                  ? 'bg-clay-50 text-clay-700 border-clay-400'
                  : 'bg-surface-warm text-text-muted border-stone-200 hover:border-stone-300'}"
            >
              Regular (annual)
            </button>
            <button
              onclick={() => distributionType = 'one-time'}
              class="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border-2 transition-all duration-200 cursor-pointer
                {distributionType === 'one-time'
                  ? 'bg-clay-50 text-clay-700 border-clay-400'
                  : 'bg-surface-warm text-text-muted border-stone-200 hover:border-stone-300'}"
            >
              One-time settlement
            </button>
          </div>
        </div>
      </div>

    <!-- Step 1: Situation -->
    {:else if step === 1}
      <div in:fly={{ y: 20, duration: 300 }}>
        <p class="text-sm text-text-muted mb-1">Step 2 of {totalSteps}</p>
        <h3 class="text-xl font-semibold mb-1">What's your situation right now?</h3>
        <p class="text-sm text-text-secondary mb-5">Pick everything that applies. This shapes your plan.</p>

        <div class="flex flex-col gap-2.5">
          {#each situationOptions as option}
            <button
              onclick={() => toggleSituation(option.id)}
              class="w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 cursor-pointer
                {situations.includes(option.id)
                  ? 'bg-clay-50 text-clay-800 border-clay-400'
                  : 'bg-surface-warm text-text-secondary border-stone-200 hover:border-stone-300'}"
            >
              <span class="flex items-center gap-3">
                <span class="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
                  {situations.includes(option.id)
                    ? 'bg-clay-500 border-clay-500'
                    : 'border-stone-300 bg-surface-card'}">
                  {#if situations.includes(option.id)}
                    <svg class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  {/if}
                </span>
                {option.label}
              </span>
            </button>
          {/each}
        </div>
      </div>

    <!-- Step 2: The plan -->
    {:else if step === 2}
      <div in:fly={{ y: 20, duration: 300 }}>
        <p class="text-sm text-text-muted mb-1">Step 3 of {totalSteps}</p>
        <h3 class="text-xl font-semibold mb-1">Here's your plan</h3>
        <p class="text-sm text-text-secondary mb-5">Your ${fmt(parsedAmount)}, with purpose.</p>

        <!-- Visual bar -->
        <div class="flex rounded-xl overflow-hidden h-4 mb-6">
          {#each plan as segment}
            <div
              class="{segment.barColor} transition-all duration-500"
              style="width: {(segment.amount / parsedAmount) * 100}%"
              title="{segment.label}: ${fmt(segment.amount)}"
            ></div>
          {/each}
        </div>

        <!-- Segment cards -->
        <div class="space-y-3">
          {#each plan as segment (segment.id)}
            <div
              class="rounded-xl border-2 {segment.borderColor} {segment.bgColor} overflow-hidden"
              in:fly={{ y: 10, duration: 250, delay: plan.indexOf(segment) * 80 }}
            >
              <div class="p-4">
                <div class="flex items-start justify-between mb-1.5">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full {segment.barColor} flex-shrink-0"></div>
                    <p class="text-sm font-semibold {segment.textColor}">{segment.label}</p>
                  </div>
                  <p class="text-xl font-bold {segment.textColor}">${fmt(segment.amount)}</p>
                </div>
                <p class="text-sm text-text-secondary ml-5">{segment.description}</p>

                <button
                  onclick={() => toggleHowTo(segment.id)}
                  class="mt-3 ml-5 text-xs font-medium {segment.textColor} hover:opacity-70 transition-opacity cursor-pointer flex items-center gap-1"
                >
                  <svg
                    class="w-3.5 h-3.5 transition-transform duration-200 {expandedSegment === segment.id ? 'rotate-90' : ''}"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                  How to do this
                </button>
              </div>

              {#if expandedSegment === segment.id}
                <div class="px-4 pb-4 ml-5" transition:slide={{ duration: 200 }}>
                  <ol class="space-y-2 text-sm text-text-secondary">
                    {#each segment.howTo as instruction, i}
                      <li class="flex gap-2">
                        <span class="flex-shrink-0 w-5 h-5 rounded-full bg-stone-200 text-stone-600 text-xs font-semibold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <span>{instruction}</span>
                      </li>
                    {/each}
                  </ol>
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Section 87 note -->
        <div class="mt-5 rounded-xl bg-stone-50 border border-stone-200 p-4">
          <p class="text-xs font-semibold text-text-secondary mb-1">Tax note</p>
          <p class="text-xs text-text-muted leading-relaxed">
            Per-cap distributions from your band on reserve are generally tax-exempt under Section 87.
            But investment growth outside a TFSA may be taxable. A TFSA solves this — growth inside
            a TFSA is tax-free for everyone.
          </p>
        </div>
      </div>

    <!-- Step 3: Projections (only if investing) -->
    {:else if step === 3 && investAmount > 0}
      <div in:fly={{ y: 20, duration: 300 }}>
        <p class="text-sm text-text-muted mb-1">Step 4 of {totalSteps}</p>
        <h3 class="text-xl font-semibold mb-1">What this looks like over time</h3>
        {#if distributionType === 'annual'}
          <p class="text-sm text-text-secondary mb-6">If you invest ${fmt(investAmount)} from every annual distribution...</p>
        {:else}
          <p class="text-sm text-text-secondary mb-6">Your ${fmt(investAmount)} invested today, growing at 7% average annual return...</p>
        {/if}

        <!-- Bar chart -->
        <div class="space-y-3 mb-6">
          {#each projections as proj, i}
            <div in:fly={{ x: -20, duration: 300, delay: i * 100 }}>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium text-text-muted w-16">Year {proj.year}</span>
                <span class="text-sm font-bold text-clay-600">${fmt(proj.value)}</span>
              </div>
              <div class="h-6 bg-stone-100 rounded-lg overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-clay-300 to-clay-400 rounded-lg transition-all duration-700 ease-[var(--ease-out)]"
                  style="width: {maxProjectionValue > 0 ? Math.max((proj.value / maxProjectionValue) * 100, 3) : 0}%"
                ></div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Context -->
        {#if distributionType === 'annual' && projections.length >= 5}
          <div class="rounded-xl bg-clay-50 border border-clay-200 p-4 mb-5">
            <p class="text-sm text-clay-700">
              <span class="font-semibold">${fmt(projections[4].value)}</span> from
              investing ${fmt(investAmount)} a year. That's the power of compounding —
              your money making money, year after year. All of it tax-free inside a TFSA.
            </p>
          </div>
        {:else if projections.length >= 4}
          <div class="rounded-xl bg-clay-50 border border-clay-200 p-4 mb-5">
            <p class="text-sm text-clay-700">
              One decision today. <span class="font-semibold">${fmt(projections[3].value)}</span> in
              20 years. That's compounding — and it starts the moment you invest.
            </p>
          </div>
        {/if}

        <p class="text-xs text-text-muted text-center">
          Based on 7% average annual return. Actual returns will vary. Past performance
          does not guarantee future results.
        </p>
      </div>
    {/if}

    <!-- Navigation -->
    {#if step <= 1 || (step === 2 && investAmount > 0) || (step === 2 && investAmount === 0)}
      <div class="flex items-center justify-between mt-6 pt-4 border-t border-stone-100">
        <button
          onclick={back}
          class="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer
            {step === 0 ? 'invisible' : ''}"
        >
          Back
        </button>

        {#if step === 0}
          <button
            onclick={next}
            disabled={!canProceedStep0}
            class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
              {canProceedStep0
                ? 'bg-stone-900 text-white hover:bg-stone-800 active:scale-95'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'}"
          >
            Continue
          </button>
        {:else if step === 1}
          <button
            onclick={next}
            disabled={!canProceedStep1}
            class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
              {canProceedStep1
                ? 'bg-stone-900 text-white hover:bg-stone-800 active:scale-95'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'}"
          >
            Build my plan
          </button>
        {:else if step === 2 && investAmount > 0}
          <button
            onclick={next}
            class="px-5 py-2.5 rounded-xl text-sm font-semibold bg-stone-900 text-white
              hover:bg-stone-800 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            See the growth
          </button>
        {/if}
      </div>
    {/if}

    <!-- Bottom actions (on plan step without projections, or on projections step) -->
    {#if (step === 2 && investAmount === 0) || step === 3 || (step === 2 && investAmount > 0 && false)}
      <!-- Show save/links on final step -->
    {/if}

    {#if step === 3 || (step === 2 && investAmount === 0)}
      <div class="mt-6 pt-4 border-t border-stone-100 space-y-2.5">
        <!-- Save plan -->
        <button
          onclick={savePlan}
          class="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
            {saved
              ? 'bg-sage-500 text-white'
              : 'bg-stone-900 text-white hover:bg-stone-800 active:scale-95'}"
        >
          {saved ? 'Plan saved' : 'Save my plan'}
        </button>

        <!-- Links -->
        <div class="grid grid-cols-1 gap-2">
          <a
            href="/money/savings-tracker"
            class="flex items-center justify-between px-4 py-3 rounded-xl bg-sage-50 border border-sage-200
              text-sm font-medium text-sage-700 hover:bg-sage-100 transition-colors"
          >
            Start a savings goal
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </a>
          <a
            href="/money/investing"
            class="flex items-center justify-between px-4 py-3 rounded-xl bg-clay-50 border border-clay-200
              text-sm font-medium text-clay-700 hover:bg-clay-100 transition-colors"
          >
            Learn more about investing
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </a>
          <a
            href="/money/budget-tool"
            class="flex items-center justify-between px-4 py-3 rounded-xl bg-stone-50 border border-stone-200
              text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
          >
            Track my budget
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </a>
        </div>

        <!-- Back to plan -->
        {#if step === 3}
          <button
            onclick={() => step = 2}
            class="w-full text-center text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer pt-1"
          >
            Back to my plan
          </button>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Disclaimer -->
  {#if step >= 2}
    <div class="px-5 sm:px-6 pb-5">
      <p class="text-[11px] text-text-muted text-center leading-relaxed">
        This is educational guidance, not financial advice. Consider your own situation.
        Your data stays on this device.
      </p>
    </div>
  {/if}
</div>

<!-- Saved toast -->
{#if saved}
  <div
    class="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-sage-600 text-white px-5 py-3 shadow-lg"
    in:fly={{ y: -30, duration: 300 }}
    out:fade={{ duration: 200 }}
  >
    <p class="text-sm font-semibold">Plan saved to your device.</p>
  </div>
{/if}
