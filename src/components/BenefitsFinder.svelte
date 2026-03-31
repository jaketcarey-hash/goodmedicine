<script lang="ts">
  import { fly, fade, slide } from 'svelte/transition';
  import { STORAGE_KEYS } from '../lib/storage-keys';

  // ── State ──────────────────────────────────────────────────
  let step = $state(0);
  let hasStatus = $state<string>('');
  let ageGroup = $state<string>('');
  let livesOnReserve = $state<string>('');
  let hasChildren = $state<string>('');
  let employment = $state<string>('');
  let filedTaxes = $state<string>('');
  let expanded = $state<Set<string>>(new Set());
  let saved = $state(false);

  const totalSteps = 6;

  // ── Questions ──────────────────────────────────────────────
  const questions = [
    {
      id: 'status',
      step: 'Step 1 of 6',
      title: 'Do you have Status?',
      subtitle: 'Registered under the Indian Act (Status card).',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    },
    {
      id: 'age',
      step: 'Step 2 of 6',
      title: 'How old are you?',
      subtitle: 'Some benefits depend on your age group.',
      options: [
        { value: 'under18', label: 'Under 18' },
        { value: '18-24', label: '18 to 24' },
        { value: '25-64', label: '25 to 64' },
        { value: '65+', label: '65+' },
      ],
    },
    {
      id: 'reserve',
      step: 'Step 3 of 6',
      title: 'Do you live on reserve?',
      subtitle: 'This affects tax exemptions and certain programs.',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'parttime', label: 'Part-time' },
      ],
    },
    {
      id: 'children',
      step: 'Step 4 of 6',
      title: 'Do you have children under 18?',
      subtitle: 'Several programs are specifically for families.',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    },
    {
      id: 'employment',
      step: 'Step 5 of 6',
      title: 'Are you currently working?',
      subtitle: 'Your employment situation affects what you can access.',
      options: [
        { value: 'on-reserve', label: 'Yes, on reserve' },
        { value: 'off-reserve', label: 'Yes, off reserve' },
        { value: 'not-working', label: 'Not currently' },
        { value: 'student', label: 'Student' },
      ],
    },
    {
      id: 'taxes',
      step: 'Step 6 of 6',
      title: 'Have you filed your tax return in the last 2 years?',
      subtitle: 'Tax filing unlocks many benefits — even if you owe nothing.',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'unsure', label: 'Not sure' },
      ],
    },
  ];

  // ── Answer binding ─────────────────────────────────────────
  function getAnswer(index: number): string {
    const answers = [hasStatus, ageGroup, livesOnReserve, hasChildren, employment, filedTaxes];
    return answers[index];
  }

  function setAnswer(index: number, value: string) {
    if (index === 0) hasStatus = value;
    else if (index === 1) ageGroup = value;
    else if (index === 2) livesOnReserve = value;
    else if (index === 3) hasChildren = value;
    else if (index === 4) employment = value;
    else if (index === 5) filedTaxes = value;
  }

  // ── Navigation ─────────────────────────────────────────────
  function next() {
    if (step < totalSteps) step++;
  }

  function back() {
    if (step > 0) step--;
  }

  function canProceed(): boolean {
    return getAnswer(step) !== '';
  }

  function startOver() {
    step = 0;
    hasStatus = '';
    ageGroup = '';
    livesOnReserve = '';
    hasChildren = '';
    employment = '';
    filedTaxes = '';
    expanded = new Set();
    saved = false;
  }

  // ── Results logic ──────────────────────────────────────────
  interface Benefit {
    id: string;
    name: string;
    description: string;
    value?: string;
    howTo: string;
    link?: string;
    priority: 'high' | 'medium' | 'low';
    type: 'qualify' | 'action';
  }

  function getResults(): { urgent: string | null; benefits: Benefit[] } {
    const benefits: Benefit[] = [];
    let urgent: string | null = null;

    const status = hasStatus === 'yes';
    const children = hasChildren === 'yes';
    const taxFiled = filedTaxes === 'yes';
    const taxNotFiled = filedTaxes === 'no' || filedTaxes === 'unsure';
    const senior = ageGroup === '65+';
    const young = ageGroup === '18-24';
    const student = employment === 'student';
    const onReserve = livesOnReserve === 'yes' || livesOnReserve === 'parttime';
    const worksOnReserve = employment === 'on-reserve';

    // Urgent: tax filing callout
    if (taxNotFiled) {
      urgent = children
        ? 'Filing your taxes unlocks multiple benefits. A single parent who hasn\'t filed could be missing an estimated $12,000 to $15,000 per year.'
        : 'Filing your taxes is the single most important step to access benefits — even if you owe nothing and even if your income is exempt.';
    }

    // Status-based benefits
    if (status) {
      benefits.push({
        id: 'nihb',
        name: 'Non-Insured Health Benefits (NIHB)',
        description: 'Covers prescription drugs, dental, vision, mental health counselling, medical transportation, and medical supplies not covered by provincial health plans.',
        value: 'Varies — covers costs most people pay out of pocket',
        howTo: 'Register with your regional First Nations and Inuit Health Branch office. You need your Status card number. Many providers bill NIHB directly.',
        link: '/rights/nihb',
        priority: 'high',
        type: 'qualify',
      });

      benefits.push({
        id: 'section87',
        name: 'Section 87 Tax Exemption',
        description: 'Income earned on reserve, and certain other income with sufficient connection to a reserve, may be exempt from federal and provincial income tax.',
        howTo: 'Ensure your employer (if on reserve) is not deducting income tax. File your tax return annually to claim exemption and unlock other benefits.',
        link: '/rights/section-87',
        priority: 'high',
        type: onReserve || worksOnReserve ? 'qualify' : 'low' as any,
      });
    }

    // Tax-dependent benefits
    if (taxFiled) {
      benefits.push({
        id: 'gst',
        name: 'GST/HST Credit',
        description: 'A quarterly tax-free payment to help individuals and families with low or modest income offset the GST or HST they pay.',
        value: 'Estimated $300 to $500 per year',
        howTo: 'File your tax return. The CRA automatically determines eligibility and sends payments quarterly. No separate application needed.',
        link: '/money/taxes',
        priority: 'medium',
        type: 'qualify',
      });
    }

    if (children && taxFiled) {
      benefits.push({
        id: 'ccb',
        name: 'Canada Child Benefit (CCB)',
        description: 'A tax-free monthly payment to eligible families to help with the cost of raising children under 18.',
        value: 'Up to an estimated $7,787 per child per year (under 6) or $6,570 (ages 6 to 17)',
        howTo: 'File your tax return each year. Apply through My CRA Account or by mailing form RC66. Payments are automatic once approved.',
        link: '/money/taxes',
        priority: 'high',
        type: 'qualify',
      });
    }

    if (children) {
      benefits.push({
        id: 'clb',
        name: 'Canada Learning Bond (CLB)',
        description: 'Free money from the Government of Canada deposited into an RESP for your child\'s future education. No personal contribution required.',
        value: 'Up to an estimated $2,000 per child',
        howTo: 'Open an RESP at any bank or credit union. Apply for the CLB through the RESP provider. You do not need to contribute any of your own money.',
        link: '/money/saving',
        priority: 'medium',
        type: 'qualify',
      });
    }

    if (children && status) {
      benefits.push({
        id: 'jordans',
        name: 'Jordan\'s Principle',
        description: 'Ensures First Nations children can access the health, social, and educational products, services, and supports they need when they need them.',
        value: 'Covers costs for services, equipment, and supports based on individual need',
        howTo: 'Contact the Jordan\'s Principle call centre at 1-855-572-4453 or apply online through ISC. A needs assessment is completed for your child.',
        link: '/rights/jordans-principle',
        priority: 'high',
        type: 'qualify',
      });
    }

    if (senior) {
      benefits.push({
        id: 'gis',
        name: 'Guaranteed Income Supplement (GIS)',
        description: 'A monthly non-taxable benefit for low-income Old Age Security pensioners living in Canada.',
        value: 'Up to an estimated $1,065 per month (single)',
        howTo: 'If you receive OAS and filed taxes, you may be automatically enrolled. Otherwise, contact Service Canada or apply using form ISP-3025.',
        priority: 'high',
        type: 'qualify',
      });

      benefits.push({
        id: 'oas',
        name: 'Old Age Security (OAS)',
        description: 'A monthly payment available to most Canadians aged 65 and older, regardless of employment history.',
        value: 'Up to an estimated $727 per month',
        howTo: 'Many are automatically enrolled. If not, apply through My Service Canada Account or your local Service Canada office.',
        priority: 'high',
        type: 'qualify',
      });
    }

    if (student || young) {
      benefits.push({
        id: 'psssp',
        name: 'Post-Secondary Student Support Program (PSSSP)',
        description: 'Funding for Status First Nations students attending post-secondary education, covering tuition, books, travel, and living expenses.',
        value: 'Varies by program — can cover full tuition and living costs',
        howTo: 'Apply through your Band or Tribal Council education department. Each community manages its own application process and deadlines.',
        link: '/rights/education-funding',
        priority: 'high',
        type: 'qualify',
      });
    }

    if (employment === 'not-working' || employment === 'off-reserve') {
      benefits.push({
        id: 'ei',
        name: 'Employment Insurance (EI)',
        description: 'Temporary income support if you\'ve recently lost your job through no fault of your own, or are unable to work due to illness, pregnancy, or caregiving.',
        value: 'Up to 55% of previous earnings, to an estimated maximum of $668 per week',
        howTo: 'Apply online through Service Canada within four weeks of your last day of work. You need your Record of Employment (ROE) from your employer.',
        priority: 'medium',
        type: 'qualify',
      });
    }

    // Tax-filing action items for unfiled
    if (taxNotFiled && children) {
      benefits.push({
        id: 'ccb-action',
        name: 'Canada Child Benefit (CCB) — File Taxes to Unlock',
        description: 'You may be eligible for up to $7,787 per child per year, but the CRA needs your tax return to calculate your payment.',
        value: 'Up to an estimated $7,787 per child per year',
        howTo: 'File your tax return for the past two years. You can do this for free at a community tax clinic or through a volunteer tax preparer.',
        link: '/money/taxes',
        priority: 'high',
        type: 'action',
      });
    }

    if (taxNotFiled && !children) {
      benefits.push({
        id: 'gst-action',
        name: 'GST/HST Credit — File Taxes to Unlock',
        description: 'A quarterly payment of roughly $300 to $500 per year that you are likely missing by not having a tax return on file.',
        value: 'Estimated $300 to $500 per year',
        howTo: 'File your tax return. Free community tax clinics are available in most areas. You can also file online through certified tax software at no cost.',
        link: '/money/taxes',
        priority: 'high',
        type: 'action',
      });
    }

    // Provincial note
    benefits.push({
      id: 'provincial',
      name: 'Provincial and Territorial Benefits',
      description: 'Each province and territory offers additional programs — including health supplements, housing support, childcare subsidies, and disability benefits. These vary by where you live.',
      howTo: 'Contact your provincial or territorial government services office, or ask at your Band office for a list of programs available in your region.',
      priority: 'low',
      type: 'qualify',
    });

    return { urgent, benefits };
  }

  // ── Expand/collapse ────────────────────────────────────────
  function toggleExpand(id: string) {
    const next = new Set(expanded);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    expanded = next;
  }

  // ── Save to localStorage ───────────────────────────────────
  function saveResults() {
    const data = {
      timestamp: new Date().toISOString(),
      answers: { hasStatus, ageGroup, livesOnReserve, hasChildren, employment, filedTaxes },
      results: getResults(),
    };
    try {
      localStorage.setItem(STORAGE_KEYS.BENEFITS_RESULTS, JSON.stringify(data));
      saved = true;
    } catch {
      // silently fail if storage unavailable
    }
  }

  // ── Check for saved results on mount ───────────────────────
  $effect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BENEFITS_RESULTS);
      if (stored) {
        // We don't auto-load — user starts fresh each time
        // but we note that they have saved results
      }
    } catch {
      // no-op
    }
  });

  // ── Derived ────────────────────────────────────────────────
  let showingResults = $derived(step === totalSteps);
  let results = $derived(getResults());
  let qualifyBenefits = $derived(results.benefits.filter(b => b.type === 'qualify'));
  let actionBenefits = $derived(results.benefits.filter(b => b.type === 'action'));
</script>

<div class="rounded-2xl bg-surface-card border border-stone-200 overflow-hidden shadow-lg">
  <!-- Progress bar -->
  {#if !showingResults}
    <div class="h-1 bg-stone-100">
      <div
        class="h-full bg-gradient-to-r from-water-400 to-sage-400 transition-all duration-500 ease-[var(--ease-out)]"
        style="width: {((step + 1) / totalSteps) * 100}%"
      ></div>
    </div>
  {/if}

  <div class="p-6">
    <!-- ── Questionnaire Steps ──────────────────────────────── -->
    {#if !showingResults}
      {#each questions as q, i}
        {#if step === i}
          <div in:fly={{ y: 20, duration: 300 }}>
            <p class="text-sm text-text-muted mb-1">{q.step}</p>
            <h3 class="text-xl font-semibold mb-1">{q.title}</h3>
            <p class="text-sm text-text-secondary mb-6">{q.subtitle}</p>

            <div class="flex flex-col gap-2.5">
              {#each q.options as opt}
                <button
                  onclick={() => setAnswer(i, opt.value)}
                  class="w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 cursor-pointer
                    {getAnswer(i) === opt.value
                      ? 'bg-water-500 text-white border-water-500'
                      : 'bg-surface-warm text-text-secondary border-stone-200 hover:border-stone-300'}"
                >
                  {opt.label}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      {/each}

      <!-- Navigation -->
      <div class="flex items-center justify-between mt-6 pt-4 border-t border-stone-100">
        {#if step > 0}
          <button
            onclick={back}
            class="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          >
            Back
          </button>
        {:else}
          <span></span>
        {/if}

        <button
          onclick={next}
          disabled={!canProceed()}
          class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
            {canProceed()
              ? 'bg-stone-900 text-white hover:bg-stone-800 active:scale-95'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'}"
        >
          {step === totalSteps - 1 ? 'See my results' : 'Continue'}
        </button>
      </div>

    <!-- ── Results ────────────────────────────────────────────── -->
    {:else}
      <div in:fade={{ duration: 400 }}>
        <!-- Results header -->
        <div class="text-center mb-6">
          <div class="w-14 h-14 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7 text-sage-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <h3 class="text-2xl font-bold mb-1">Your Benefits</h3>
          <p class="text-sm text-text-secondary">
            We found <strong class="text-sage-700">{results.benefits.length} potential benefits</strong> based on your answers.
          </p>
        </div>

        <!-- Urgent tax callout -->
        {#if results.urgent}
          <div
            class="rounded-xl border-2 border-clay-300 bg-clay-50 p-4 mb-5"
            in:fly={{ y: 10, duration: 300, delay: 100 }}
          >
            <div class="flex gap-3">
              <div class="shrink-0 mt-0.5">
                <svg class="w-5 h-5 text-clay-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-semibold text-clay-800 mb-1">Action needed: File your taxes</p>
                <p class="text-sm text-clay-700 leading-relaxed">{results.urgent}</p>
                <a
                  href="/money/taxes"
                  class="inline-block mt-2 text-sm font-medium text-clay-700 underline underline-offset-2 hover:text-clay-900 transition-colors"
                >
                  Learn about filing your taxes
                </a>
              </div>
            </div>
          </div>
        {/if}

        <!-- Action needed benefits -->
        {#if actionBenefits.length > 0}
          <div class="mb-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-clay-600 mb-3">Unlocked by filing taxes</p>
            <div class="flex flex-col gap-2.5">
              {#each actionBenefits as benefit, i}
                <div
                  class="rounded-xl border-2 border-clay-200 bg-white overflow-hidden transition-all duration-200"
                  in:fly={{ y: 10, duration: 300, delay: 150 + i * 50 }}
                >
                  <button
                    onclick={() => toggleExpand(benefit.id)}
                    class="w-full text-left p-4 cursor-pointer flex items-start justify-between gap-3"
                  >
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-clay-800 leading-snug">{benefit.name}</p>
                      {#if benefit.value}
                        <p class="text-xs text-clay-600 mt-0.5">{benefit.value}</p>
                      {/if}
                    </div>
                    <svg
                      class="w-4 h-4 text-clay-400 shrink-0 mt-1 transition-transform duration-200
                        {expanded.has(benefit.id) ? 'rotate-180' : ''}"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {#if expanded.has(benefit.id)}
                    <div class="px-4 pb-4 border-t border-clay-100" transition:slide={{ duration: 200 }}>
                      <p class="text-sm text-text-secondary mt-3 leading-relaxed">{benefit.description}</p>
                      <p class="text-sm text-text-primary mt-2 leading-relaxed">
                        <span class="font-medium">How to access:</span> {benefit.howTo}
                      </p>
                      {#if benefit.link}
                        <a
                          href={benefit.link}
                          class="inline-block mt-3 text-sm font-medium text-clay-700 underline underline-offset-2 hover:text-clay-900 transition-colors"
                        >
                          Read more
                        </a>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Qualifying benefits -->
        {#if qualifyBenefits.length > 0}
          <div class="mb-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-sage-600 mb-3">You likely qualify for</p>
            <div class="flex flex-col gap-2.5">
              {#each qualifyBenefits as benefit, i}
                <div
                  class="rounded-xl border-2 border-sage-200 bg-white overflow-hidden transition-all duration-200"
                  in:fly={{ y: 10, duration: 300, delay: 150 + i * 50 }}
                >
                  <button
                    onclick={() => toggleExpand(benefit.id)}
                    class="w-full text-left p-4 cursor-pointer flex items-start justify-between gap-3"
                  >
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-sage-800 leading-snug">{benefit.name}</p>
                      {#if benefit.value}
                        <p class="text-xs text-sage-600 mt-0.5">{benefit.value}</p>
                      {/if}
                    </div>
                    <svg
                      class="w-4 h-4 text-sage-400 shrink-0 mt-1 transition-transform duration-200
                        {expanded.has(benefit.id) ? 'rotate-180' : ''}"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {#if expanded.has(benefit.id)}
                    <div class="px-4 pb-4 border-t border-sage-100" transition:slide={{ duration: 200 }}>
                      <p class="text-sm text-text-secondary mt-3 leading-relaxed">{benefit.description}</p>
                      <p class="text-sm text-text-primary mt-2 leading-relaxed">
                        <span class="font-medium">How to access:</span> {benefit.howTo}
                      </p>
                      {#if benefit.link}
                        <a
                          href={benefit.link}
                          class="inline-block mt-3 text-sm font-medium text-sage-700 underline underline-offset-2 hover:text-sage-900 transition-colors"
                        >
                          Read more
                        </a>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Disclaimer -->
        <p class="text-xs text-text-muted leading-relaxed mt-5 px-1">
          Benefit amounts are approximate and may vary. This tool identifies potential eligibility — confirm with the relevant program.
        </p>

        <!-- Actions -->
        <div class="flex flex-col gap-2.5 mt-5 pt-4 border-t border-stone-100">
          <button
            onclick={saveResults}
            class="w-full px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
              {saved
                ? 'bg-sage-100 text-sage-700 border-2 border-sage-300'
                : 'bg-stone-900 text-white hover:bg-stone-800 active:scale-95'}"
          >
            {saved ? 'Saved to this device' : 'Save my results'}
          </button>

          <button
            onclick={startOver}
            class="w-full px-5 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          >
            Start over
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
