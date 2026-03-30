<script lang="ts">
  import { fly, fade } from 'svelte/transition';

  const STORAGE_KEY = 'gm_section87_result';
  const TOTAL_STEPS = 5;

  type WorkLocation = 'on-reserve' | 'off-reserve' | 'mixed';
  type YesNoMaybe = 'yes' | 'no' | 'not-sure';
  type YesNo = 'yes' | 'no';
  type Outcome = 'likely-exempt' | 'likely-not-exempt' | 'grey-zone' | 'not-eligible';

  let step = $state(0);
  let hasStatus = $state<YesNo | null>(null);
  let workLocation = $state<WorkLocation | null>(null);
  let employerLocation = $state<YesNo | null>(null);
  let benefitsReserve = $state<YesNoMaybe | null>(null);
  let livesOnReserve = $state<YesNo | null>(null);
  let outcome = $state<Outcome | null>(null);
  let showInvestment = $state(false);

  // Restore previous result on mount
  $effect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        outcome = parsed.outcome;
        hasStatus = parsed.hasStatus;
        workLocation = parsed.workLocation;
        employerLocation = parsed.employerLocation;
        benefitsReserve = parsed.benefitsReserve;
        livesOnReserve = parsed.livesOnReserve;
        if (outcome) step = TOTAL_STEPS;
      }
    } catch { /* ignore */ }
  });

  function saveResult() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        outcome,
        hasStatus,
        workLocation,
        employerLocation,
        benefitsReserve,
        livesOnReserve,
        timestamp: new Date().toISOString(),
      }));
    } catch { /* ignore */ }
  }

  function calculateOutcome(): Outcome {
    if (hasStatus === 'no') return 'not-eligible';

    // Score connecting factors — higher = more reserve-connected
    let score = 0;
    let total = 0;

    // Work location (heaviest factor)
    total += 2;
    if (workLocation === 'on-reserve') score += 2;
    else if (workLocation === 'mixed') score += 1;

    // Employer location
    total += 1;
    if (employerLocation === 'yes') score += 1;

    // Benefits reserve residents
    total += 1;
    if (benefitsReserve === 'yes') score += 1;
    else if (benefitsReserve === 'not-sure') score += 0.5;

    // Lives on reserve
    total += 1;
    if (livesOnReserve === 'yes') score += 1;

    const ratio = score / total;

    if (ratio >= 0.7) return 'likely-exempt';
    if (ratio <= 0.3) return 'likely-not-exempt';
    return 'grey-zone';
  }

  function canProceed(): boolean {
    if (step === 0) return hasStatus !== null;
    if (step === 1) return workLocation !== null;
    if (step === 2) return employerLocation !== null;
    if (step === 3) return benefitsReserve !== null;
    if (step === 4) return livesOnReserve !== null;
    return false;
  }

  function next() {
    if (step === 0 && hasStatus === 'no') {
      // Skip straight to result
      outcome = 'not-eligible';
      step = TOTAL_STEPS;
      saveResult();
      return;
    }
    if (step < TOTAL_STEPS - 1) {
      step++;
    } else {
      // Final step — calculate
      outcome = calculateOutcome();
      step = TOTAL_STEPS;
      saveResult();
    }
  }

  function back() {
    if (step > 0) step--;
  }

  function startOver() {
    step = 0;
    hasStatus = null;
    workLocation = null;
    employerLocation = null;
    benefitsReserve = null;
    livesOnReserve = null;
    outcome = null;
    showInvestment = false;
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
  }

  const outcomeConfig: Record<Outcome, {
    title: string;
    accent: string;
    bgGradient: string;
    iconBg: string;
    iconColor: string;
  }> = {
    'likely-exempt': {
      title: 'Likely exempt',
      accent: 'sage',
      bgGradient: 'from-sage-50 to-sage-50/30',
      iconBg: 'bg-sage-100',
      iconColor: 'text-sage-600',
    },
    'likely-not-exempt': {
      title: 'Likely not exempt',
      accent: 'stone',
      bgGradient: 'from-stone-100 to-stone-50/30',
      iconBg: 'bg-stone-200',
      iconColor: 'text-stone-600',
    },
    'grey-zone': {
      title: 'Grey zone',
      accent: 'clay',
      bgGradient: 'from-clay-50 to-clay-50/30',
      iconBg: 'bg-clay-100',
      iconColor: 'text-clay-600',
    },
    'not-eligible': {
      title: 'Not eligible',
      accent: 'stone',
      bgGradient: 'from-stone-100 to-stone-50/30',
      iconBg: 'bg-stone-200',
      iconColor: 'text-stone-600',
    },
  };
</script>

<div class="space-y-6">
  <!-- Employment income checker -->
  <div
    class="rounded-2xl bg-surface-card border border-stone-200 overflow-hidden shadow-lg"
    role="region"
    aria-label="Section 87 employment income eligibility checker"
  >
    <!-- Progress bar -->
    {#if step < TOTAL_STEPS}
      <div class="h-1 bg-stone-100" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
        <div
          class="h-full bg-gradient-to-r from-water-400 to-sage-400 transition-all duration-500 ease-[var(--ease-out)]"
          style="width: {((step + 1) / TOTAL_STEPS) * 100}%"
        ></div>
      </div>
    {/if}

    <div class="p-6">
      <!-- Step 0: Status -->
      {#if step === 0}
        <div in:fly={{ y: 20, duration: 300 }}>
          <p class="text-sm text-text-muted mb-1">Step 1 of {TOTAL_STEPS}</p>
          <h3 class="text-xl font-semibold mb-2">Do you have Status?</h3>
          <p class="text-sm text-text-secondary mb-6">
            Registered under the Indian Act as a Status Indian. This is required for Section 87 to apply.
          </p>

          <div class="grid grid-cols-2 gap-3">
            <button
              onclick={() => hasStatus = 'yes'}
              aria-pressed={hasStatus === 'yes'}
              class="py-3.5 px-4 rounded-xl border-2 text-center text-sm font-semibold transition-all duration-200 cursor-pointer
                {hasStatus === 'yes'
                  ? 'bg-water-500 text-white border-water-500'
                  : 'bg-surface-warm text-text-secondary border-stone-200 hover:border-stone-300'}"
            >
              Yes, I have Status
            </button>
            <button
              onclick={() => hasStatus = 'no'}
              aria-pressed={hasStatus === 'no'}
              class="py-3.5 px-4 rounded-xl border-2 text-center text-sm font-semibold transition-all duration-200 cursor-pointer
                {hasStatus === 'no'
                  ? 'bg-stone-700 text-white border-stone-700'
                  : 'bg-surface-warm text-text-secondary border-stone-200 hover:border-stone-300'}"
            >
              No
            </button>
          </div>
        </div>

      <!-- Step 1: Work location -->
      {:else if step === 1}
        <div in:fly={{ y: 20, duration: 300 }}>
          <p class="text-sm text-text-muted mb-1">Step 2 of {TOTAL_STEPS}</p>
          <h3 class="text-xl font-semibold mb-2">Where do you perform your work duties?</h3>
          <p class="text-sm text-text-secondary mb-6">
            This is the heaviest factor in the connecting factors test. Where you physically do the work matters most.
          </p>

          <div class="space-y-2.5">
            {#each [
              { value: 'on-reserve', label: 'On reserve', desc: 'Most or all duties performed on reserve' },
              { value: 'off-reserve', label: 'Off reserve', desc: 'Duties performed in a city or town, off reserve' },
              { value: 'mixed', label: 'Mix of both', desc: 'Split between on-reserve and off-reserve locations' },
            ] as option}
              <button
                onclick={() => workLocation = option.value as WorkLocation}
                aria-pressed={workLocation === option.value}
                class="w-full text-left py-3.5 px-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                  {workLocation === option.value
                    ? 'bg-water-500 text-white border-water-500'
                    : 'bg-surface-warm text-text-primary border-stone-200 hover:border-stone-300'}"
              >
                <span class="block text-sm font-semibold">{option.label}</span>
                <span class="block text-xs mt-0.5 {workLocation === option.value ? 'text-water-100' : 'text-text-muted'}">{option.desc}</span>
              </button>
            {/each}
          </div>
        </div>

      <!-- Step 2: Employer location -->
      {:else if step === 2}
        <div in:fly={{ y: 20, duration: 300 }}>
          <p class="text-sm text-text-muted mb-1">Step 3 of {TOTAL_STEPS}</p>
          <h3 class="text-xl font-semibold mb-2">Where is your employer located?</h3>
          <p class="text-sm text-text-secondary mb-6">
            A band office, tribal council, or organization headquartered on reserve. Not a city office of a private company.
          </p>

          <div class="grid grid-cols-2 gap-3">
            <button
              onclick={() => employerLocation = 'yes'}
              aria-pressed={employerLocation === 'yes'}
              class="py-3.5 px-4 rounded-xl border-2 text-center text-sm font-semibold transition-all duration-200 cursor-pointer
                {employerLocation === 'yes'
                  ? 'bg-water-500 text-white border-water-500'
                  : 'bg-surface-warm text-text-secondary border-stone-200 hover:border-stone-300'}"
            >
              On reserve
            </button>
            <button
              onclick={() => employerLocation = 'no'}
              aria-pressed={employerLocation === 'no'}
              class="py-3.5 px-4 rounded-xl border-2 text-center text-sm font-semibold transition-all duration-200 cursor-pointer
                {employerLocation === 'no'
                  ? 'bg-stone-700 text-white border-stone-700'
                  : 'bg-surface-warm text-text-secondary border-stone-200 hover:border-stone-300'}"
            >
              Off reserve
            </button>
          </div>
        </div>

      <!-- Step 3: Benefits reserve -->
      {:else if step === 3}
        <div in:fly={{ y: 20, duration: 300 }}>
          <p class="text-sm text-text-muted mb-1">Step 4 of {TOTAL_STEPS}</p>
          <h3 class="text-xl font-semibold mb-2">Does your work primarily benefit reserve residents?</h3>
          <p class="text-sm text-text-secondary mb-6">
            For example, teaching at an on-reserve school, delivering health services to community members, or administering band programs.
          </p>

          <div class="space-y-2.5">
            {#each [
              { value: 'yes', label: 'Yes', desc: 'My work directly serves reserve residents or the community' },
              { value: 'no', label: 'No', desc: 'My work serves a general or off-reserve population' },
              { value: 'not-sure', label: 'Not sure', desc: 'Some of it does, but I\'m not certain about the balance' },
            ] as option}
              <button
                onclick={() => benefitsReserve = option.value as YesNoMaybe}
                aria-pressed={benefitsReserve === option.value}
                class="w-full text-left py-3.5 px-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                  {benefitsReserve === option.value
                    ? 'bg-water-500 text-white border-water-500'
                    : 'bg-surface-warm text-text-primary border-stone-200 hover:border-stone-300'}"
              >
                <span class="block text-sm font-semibold">{option.label}</span>
                <span class="block text-xs mt-0.5 {benefitsReserve === option.value ? 'text-water-100' : 'text-text-muted'}">{option.desc}</span>
              </button>
            {/each}
          </div>
        </div>

      <!-- Step 4: Residence -->
      {:else if step === 4}
        <div in:fly={{ y: 20, duration: 300 }}>
          <p class="text-sm text-text-muted mb-1">Step 5 of {TOTAL_STEPS}</p>
          <h3 class="text-xl font-semibold mb-2">Do you live on reserve?</h3>
          <p class="text-sm text-text-secondary mb-6">
            Your primary residence. This is one connecting factor, but on its own it usually isn't enough to determine exemption.
          </p>

          <div class="grid grid-cols-2 gap-3">
            <button
              onclick={() => livesOnReserve = 'yes'}
              aria-pressed={livesOnReserve === 'yes'}
              class="py-3.5 px-4 rounded-xl border-2 text-center text-sm font-semibold transition-all duration-200 cursor-pointer
                {livesOnReserve === 'yes'
                  ? 'bg-water-500 text-white border-water-500'
                  : 'bg-surface-warm text-text-secondary border-stone-200 hover:border-stone-300'}"
            >
              Yes
            </button>
            <button
              onclick={() => livesOnReserve = 'no'}
              aria-pressed={livesOnReserve === 'no'}
              class="py-3.5 px-4 rounded-xl border-2 text-center text-sm font-semibold transition-all duration-200 cursor-pointer
                {livesOnReserve === 'no'
                  ? 'bg-stone-700 text-white border-stone-700'
                  : 'bg-surface-warm text-text-secondary border-stone-200 hover:border-stone-300'}"
            >
              No
            </button>
          </div>
        </div>

      <!-- Result screen -->
      {:else if step === TOTAL_STEPS && outcome}
        {@const config = outcomeConfig[outcome]}
        <div in:fade={{ duration: 400 }}>
          <!-- Result header -->
          <div class="rounded-xl bg-gradient-to-br {config.bgGradient} p-5 mb-5">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-full {config.iconBg} flex items-center justify-center flex-shrink-0">
                {#if outcome === 'likely-exempt'}
                  <svg class="w-6 h-6 {config.iconColor}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                {:else if outcome === 'grey-zone'}
                  <svg class="w-6 h-6 {config.iconColor}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                {:else}
                  <svg class="w-6 h-6 {config.iconColor}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                {/if}
              </div>
              <div>
                <h3 class="text-xl font-semibold mb-1">{config.title}</h3>
                {#if outcome === 'likely-exempt'}
                  <p class="text-sm text-text-secondary leading-relaxed">
                    Based on your answers, most connecting factors point to reserve. Your employment income
                    is likely exempt under Section 87. Check your T4 for Box 71 — if your employer recognizes
                    the exemption, your exempt income will be reported there.
                  </p>
                {:else if outcome === 'likely-not-exempt'}
                  <p class="text-sm text-text-secondary leading-relaxed">
                    Based on your answers, most connecting factors point off reserve. Your employment income
                    is likely not exempt. This is common and it doesn't change your Status — it just means
                    standard tax rules apply to this income.
                  </p>
                {:else if outcome === 'grey-zone'}
                  <p class="text-sm text-text-secondary leading-relaxed">
                    Your situation has factors pointing in both directions. The connecting factors test
                    weighs the totality of your circumstances, and cases like yours can go either way.
                    This is exactly the kind of situation where professional advice matters.
                  </p>
                {:else}
                  <p class="text-sm text-text-secondary leading-relaxed">
                    Section 87 of the Indian Act applies only to registered Status Indians.
                    Without Status, this exemption does not apply to your income. Other tax
                    strategies (TFSA, RRSP, FHSA) are still available to you.
                  </p>
                {/if}
              </div>
            </div>
          </div>

          <!-- Specific guidance -->
          {#if outcome === 'likely-exempt'}
            <div class="space-y-3 mb-5">
              <h4 class="text-sm font-semibold text-text-primary">What this means for you</h4>
              <div class="rounded-xl bg-sage-50 border border-sage-200 p-4">
                <ul class="space-y-2.5 text-sm text-text-secondary">
                  <li class="flex gap-2.5">
                    <span class="text-sage-500 font-bold flex-shrink-0">1.</span>
                    <span><strong>TFSA first.</strong> Growth is already tax-free. Combined with exempt income, this is your most powerful tool.</span>
                  </li>
                  <li class="flex gap-2.5">
                    <span class="text-sage-500 font-bold flex-shrink-0">2.</span>
                    <span><strong>Be careful with RRSPs.</strong> If your income is exempt, the RRSP deduction provides no benefit — and withdrawals become taxable. A TFSA is almost always better.</span>
                  </li>
                  <li class="flex gap-2.5">
                    <span class="text-sage-500 font-bold flex-shrink-0">3.</span>
                    <span><strong>File your taxes anyway.</strong> You need to file to receive the GST credit, Canada Child Benefit, and other entitlements. Report exempt income using Form T90.</span>
                  </li>
                </ul>
              </div>
            </div>
          {:else if outcome === 'likely-not-exempt'}
            <div class="space-y-3 mb-5">
              <h4 class="text-sm font-semibold text-text-primary">What this means for you</h4>
              <div class="rounded-xl bg-stone-50 border border-stone-200 p-4">
                <ul class="space-y-2.5 text-sm text-text-secondary">
                  <li class="flex gap-2.5">
                    <span class="text-stone-500 font-bold flex-shrink-0">1.</span>
                    <span><strong>TFSA is your primary tool.</strong> Since your income is taxed normally, tax-free growth inside a TFSA is especially valuable.</span>
                  </li>
                  <li class="flex gap-2.5">
                    <span class="text-stone-500 font-bold flex-shrink-0">2.</span>
                    <span><strong>RRSPs can help.</strong> Unlike those with exempt income, you can benefit from the RRSP deduction to reduce your tax bill now.</span>
                  </li>
                  <li class="flex gap-2.5">
                    <span class="text-stone-500 font-bold flex-shrink-0">3.</span>
                    <span><strong>Keep records.</strong> If your situation changes — new job on reserve, different employer — the exemption may apply in the future.</span>
                  </li>
                </ul>
              </div>
            </div>
          {:else if outcome === 'grey-zone'}
            <div class="space-y-3 mb-5">
              <h4 class="text-sm font-semibold text-text-primary">Next steps</h4>
              <div class="rounded-xl bg-clay-50 border border-clay-200 p-4">
                <ul class="space-y-2.5 text-sm text-text-secondary">
                  <li class="flex gap-2.5">
                    <span class="text-clay-500 font-bold flex-shrink-0">1.</span>
                    <span><strong>Consult a tax professional</strong> with specific experience in Section 87 and the connecting factors test. This is not a DIY situation.</span>
                  </li>
                  <li class="flex gap-2.5">
                    <span class="text-clay-500 font-bold flex-shrink-0">2.</span>
                    <span><strong>Gather documentation.</strong> Employment contract, job description, any evidence of where your duties are performed and who they serve.</span>
                  </li>
                  <li class="flex gap-2.5">
                    <span class="text-clay-500 font-bold flex-shrink-0">3.</span>
                    <span><strong>Use a TFSA in the meantime.</strong> Regardless of how the exemption question resolves, TFSA growth is tax-free for everyone.</span>
                  </li>
                </ul>
              </div>
            </div>
          {/if}

          <!-- Investment income section toggle -->
          {#if outcome !== 'not-eligible'}
            <button
              onclick={() => showInvestment = !showInvestment}
              aria-expanded={showInvestment}
              class="w-full flex items-center justify-between py-3.5 px-4 rounded-xl border border-stone-200
                bg-surface-warm text-left text-sm font-semibold transition-all duration-200
                hover:border-stone-300 cursor-pointer mb-4"
            >
              <span>What about investment income?</span>
              <svg
                class="w-4 h-4 text-text-muted transition-transform duration-200 {showInvestment ? 'rotate-180' : ''}"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {#if showInvestment}
              <div in:fly={{ y: -10, duration: 200 }} class="rounded-xl border border-stone-200 bg-surface-warm p-4 mb-5">
                <p class="text-sm text-text-secondary mb-3">
                  Investment income — interest, dividends, capital gains — is <strong>generally not exempt</strong>
                  unless the investment itself is situated on reserve. Most banks and brokerages are off reserve,
                  so their products typically don't qualify.
                </p>
                <div class="space-y-2.5">
                  <div class="flex gap-2.5 text-sm">
                    <span class="text-sage-500 font-bold flex-shrink-0">TFSA</span>
                    <span class="text-text-secondary">Growth is already tax-free for everyone. This is your best savings tool regardless of Section 87 status.</span>
                  </div>
                  <div class="flex gap-2.5 text-sm">
                    <span class="text-water-500 font-bold flex-shrink-0">On-reserve FIs</span>
                    <span class="text-text-secondary">Interest earned at Peace Hills Trust or other on-reserve financial institutions may be exempt. Where you bank can make a difference.</span>
                  </div>
                  <div class="flex gap-2.5 text-sm">
                    <span class="text-clay-500 font-bold flex-shrink-0">RRSP</span>
                    <span class="text-text-secondary">If your income is exempt, RRSP deductions have no benefit and withdrawals become taxable. Think carefully before contributing.</span>
                  </div>
                </div>
              </div>
            {/if}
          {/if}

          <!-- Disclaimer -->
          <div class="rounded-xl bg-stone-50 border border-stone-200 p-4 mb-5">
            <p class="text-xs text-text-muted leading-relaxed">
              This tool provides general guidance only. It is not legal or tax advice. Your specific
              situation may differ. Consult a qualified tax professional for definitive answers.
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            <button
              onclick={startOver}
              class="flex-1 py-3 px-4 rounded-xl border-2 border-stone-200 text-sm font-semibold
                text-text-secondary hover:border-stone-300 transition-all duration-200 cursor-pointer"
            >
              Start over
            </button>
            <a
              href="/rights/section-87"
              class="flex-1 py-3 px-4 rounded-xl bg-stone-900 text-white text-sm font-semibold
                text-center hover:bg-stone-800 transition-all duration-200 no-underline"
            >
              Read full guide
            </a>
          </div>
        </div>
      {/if}

      <!-- Navigation (steps 0-4) -->
      {#if step < TOTAL_STEPS}
        <div class="flex items-center justify-between mt-6 pt-4 border-t border-stone-100">
          {#if step === 0}
            <span></span>
          {:else}
            <button
              onclick={back}
              class="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
            >
              Back
            </button>
          {/if}

          <button
            onclick={next}
            disabled={!canProceed()}
            class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
              {canProceed()
                ? 'bg-stone-900 text-white hover:bg-stone-800 active:scale-95'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'}"
          >
            {step === TOTAL_STEPS - 1 ? 'See result' : 'Continue'}
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
