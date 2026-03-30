<script lang="ts">
  import { fly, fade, slide } from 'svelte/transition';
  import {
    buildSection87Prompt,
    buildCRANoticePrompt,
    buildNIHBAppealPrompt,
    buildBudgetAdvicePrompt,
    buildBenefitsPrompt,
    buildGeneralPrompt,
    buildBandFinancePrompt,
    buildLetterPrompt,
  } from '../lib/prompt-builder';

  // ── Types ──────────────────────────────────────────────────

  interface Category {
    id: string;
    title: string;
    description: string;
    color: string;
    iconColor: string;
    iconBg: string;
    icon: string;
  }

  // ── Categories ─────────────────────────────────────────────

  const categories: Category[] = [
    {
      id: 'cra-notice',
      title: 'Explain a CRA notice',
      description: 'Understand what the CRA is asking and what to do next',
      color: 'clay',
      iconColor: 'text-clay-500',
      iconBg: 'bg-clay-50',
      icon: 'document',
    },
    {
      id: 'nihb-appeal',
      title: 'Appeal an NIHB denial',
      description: 'Get help preparing an appeal for denied health benefits',
      color: 'sage',
      iconColor: 'text-sage-500',
      iconBg: 'bg-sage-50',
      icon: 'shield',
    },
    {
      id: 'section-87',
      title: 'Section 87 deep analysis',
      description: 'Find out if your income qualifies for tax exemption',
      color: 'water',
      iconColor: 'text-water-500',
      iconBg: 'bg-water-50',
      icon: 'scale',
    },
    {
      id: 'budget',
      title: 'Help with my budget',
      description: 'Get practical advice on your spending and saving',
      color: 'clay',
      iconColor: 'text-clay-500',
      iconBg: 'bg-clay-50',
      icon: 'calculator',
    },
    {
      id: 'letter',
      title: 'Draft a letter',
      description: 'Write a professional letter for any financial situation',
      color: 'berry',
      iconColor: 'text-berry-500',
      iconBg: 'bg-berry-50',
      icon: 'pen',
    },
    {
      id: 'band-finance',
      title: 'Understand band finances',
      description: 'Make sense of your band\'s financial statements',
      color: 'water',
      iconColor: 'text-water-500',
      iconBg: 'bg-water-50',
      icon: 'chart',
    },
    {
      id: 'benefits',
      title: 'Find missing benefits',
      description: 'Discover programs and credits you may be eligible for',
      color: 'sage',
      iconColor: 'text-sage-500',
      iconBg: 'bg-sage-50',
      icon: 'search',
    },
    {
      id: 'general',
      title: 'Ask anything',
      description: 'Get help with any financial question',
      color: 'stone',
      iconColor: 'text-stone-500',
      iconBg: 'bg-stone-100',
      icon: 'chat',
    },
  ];

  // ── State ──────────────────────────────────────────────────

  let activeId = $state<string | null>(null);
  let generatedPrompt = $state('');
  let copied = $state(false);

  // Form fields — CRA notice
  let craNoticeType = $state('');
  let craDetails = $state('');

  // NIHB appeal
  let nihbServiceType = $state('');
  let nihbReason = $state('');
  let nihbDetails = $state('');

  // Section 87
  let s87WorkLocation = $state('');
  let s87EmployerLocation = $state('');
  let s87BenefitsReserve = $state('');
  let s87LivesOnReserve = $state('');

  // Budget
  let budgetIncome = $state('');
  let budgetExpenses = $state('');
  let budgetConcerns = $state('');

  // Letter
  let letterType = $state('');
  let letterRecipient = $state('');
  let letterSituation = $state('');

  // Band finance
  let bandFinanceDescription = $state('');

  // Benefits
  let benefitsAge = $state('');
  let benefitsOnReserve = $state('');
  let benefitsChildren = $state(false);
  let benefitsEmployed = $state('');
  let benefitsFilesTaxes = $state('');

  // General
  let generalQuestion = $state('');

  // ── Card border colours ────────────────────────────────────

  const borderColors: Record<string, string> = {
    clay: 'border-clay-300 hover:border-clay-400',
    sage: 'border-sage-300 hover:border-sage-400',
    water: 'border-water-300 hover:border-water-400',
    berry: 'border-berry-300 hover:border-berry-400',
    stone: 'border-stone-300 hover:border-stone-400',
  };

  const activeBorders: Record<string, string> = {
    clay: 'border-clay-400',
    sage: 'border-sage-400',
    water: 'border-water-400',
    berry: 'border-berry-400',
    stone: 'border-stone-400',
  };

  // ── Handlers ───────────────────────────────────────────────

  function toggleCategory(id: string) {
    if (activeId === id) {
      activeId = null;
      generatedPrompt = '';
    } else {
      activeId = id;
      generatedPrompt = '';
      copied = false;
    }
  }

  function generatePrompt() {
    switch (activeId) {
      case 'cra-notice':
        generatedPrompt = buildCRANoticePrompt(craNoticeType || 'Unknown type', craDetails || 'No additional details provided.');
        break;
      case 'nihb-appeal':
        generatedPrompt = buildNIHBAppealPrompt(
          nihbServiceType || 'Not specified',
          nihbReason || 'Not specified',
          nihbDetails || 'No additional details.',
        );
        break;
      case 'section-87':
        generatedPrompt = buildSection87Prompt({
          hasStatus: true,
          workLocation: s87WorkLocation || 'not-sure',
          employerLocation: s87EmployerLocation || 'not-sure',
          benefitsReserve: s87BenefitsReserve || 'not-sure',
          livesOnReserve: s87LivesOnReserve || 'not-sure',
        });
        break;
      case 'budget':
        generatedPrompt = buildBudgetAdvicePrompt(
          parseFloat(budgetIncome) || 0,
          parseFloat(budgetExpenses) || 0,
          budgetConcerns ? budgetConcerns.split(',').map((s) => s.trim()).filter(Boolean) : [],
        );
        break;
      case 'letter':
        generatedPrompt = buildLetterPrompt(
          letterType || 'other',
          letterRecipient || 'Not specified',
          letterSituation || 'No details provided.',
        );
        break;
      case 'band-finance':
        generatedPrompt = buildBandFinancePrompt(bandFinanceDescription || 'No details provided.');
        break;
      case 'benefits':
        generatedPrompt = buildBenefitsPrompt({
          hasStatus: true,
          age: benefitsAge || '25-64',
          onReserve: benefitsOnReserve || 'no',
          hasChildren: benefitsChildren,
          employed: benefitsEmployed || 'not-working',
          filesTaxes: benefitsFilesTaxes || 'unsure',
        });
        break;
      case 'general':
        generatedPrompt = buildGeneralPrompt(generalQuestion || 'I have a general financial question.');
        break;
    }
    copied = false;
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      copied = true;
      setTimeout(() => { copied = false; }, 2500);
    } catch {
      // Fallback: select the text
    }
  }

  function openClaude() {
    window.open('https://claude.ai/new', '_blank', 'noopener');
  }

  // Select options
  const craNoticeTypes = [
    'Notice of Assessment',
    'Notice of Reassessment',
    'Request for Information',
    'Collections notice',
    'Benefits suspension',
    'GST/HST credit issue',
    'Canada Child Benefit issue',
    'Other / not sure',
  ];

  const nihbServiceTypes = [
    'Dental',
    'Vision / eyeglasses',
    'Mental health counselling',
    'Prescription medication',
    'Medical transportation',
    'Medical equipment / supplies',
    'Other',
  ];

  const letterTypes = [
    { value: 'nihb-appeal', label: 'NIHB appeal' },
    { value: 'cra-objection', label: 'CRA Notice of Objection' },
    { value: 'band-housing', label: 'Band housing request' },
    { value: 'psssp-funding', label: 'Education funding (PSSSP)' },
    { value: 'financial-complaint', label: 'Financial institution complaint' },
    { value: 'isc-information', label: 'ISC information request' },
    { value: 'other', label: 'Other' },
  ];

  // Input styling constants
  const inputClass = `w-full rounded-xl border border-stone-200 bg-surface-warm px-4 py-3 text-sm
    placeholder:text-stone-400 focus:border-clay-300 focus:ring-1 focus:ring-clay-200
    focus:outline-none transition-colors`;

  const selectClass = `w-full rounded-xl border border-stone-200 bg-surface-warm px-4 py-3 text-sm
    focus:border-clay-300 focus:ring-1 focus:ring-clay-200 focus:outline-none transition-colors`;

  const textareaClass = `w-full rounded-xl border border-stone-200 bg-surface-warm p-4 text-sm
    placeholder:text-stone-400 focus:border-clay-300 focus:ring-1 focus:ring-clay-200
    focus:outline-none resize-none transition-colors`;
</script>

<div class="space-y-5">
  <!-- Privacy note -->
  <div class="rounded-xl bg-sage-50 border border-sage-200 px-4 py-3">
    <p class="text-xs text-sage-700 leading-relaxed">
      <span class="font-semibold">Private by design.</span> Your data stays on your device. Only the text you see below gets shared when you choose to open Claude.
    </p>
  </div>

  <!-- Category grid -->
  <div class="grid grid-cols-2 gap-3">
    {#each categories as cat (cat.id)}
      {@const isActive = activeId === cat.id}
      <div class="contents">
        <button
          onclick={() => toggleCategory(cat.id)}
          class="rounded-xl bg-surface-card border p-4 text-left transition-all duration-200 cursor-pointer
            {isActive ? activeBorders[cat.color] : borderColors[cat.color]}
            {isActive ? 'shadow-md ring-1 ring-' + cat.color + '-200' : 'hover:shadow-sm'}
            active:scale-[0.97]"
          aria-expanded={isActive}
        >
          <div class="w-9 h-9 rounded-lg {cat.iconBg} flex items-center justify-center mb-3">
            {#if cat.icon === 'document'}
              <svg class="w-4.5 h-4.5 {cat.iconColor}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            {:else if cat.icon === 'shield'}
              <svg class="w-4.5 h-4.5 {cat.iconColor}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            {:else if cat.icon === 'scale'}
              <svg class="w-4.5 h-4.5 {cat.iconColor}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="3" x2="12" y2="21" />
                <polyline points="1,14 12,3 23,14" />
              </svg>
            {:else if cat.icon === 'calculator'}
              <svg class="w-4.5 h-4.5 {cat.iconColor}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <line x1="8" y1="6" x2="16" y2="6" />
                <line x1="8" y1="10" x2="8" y2="10.01" />
                <line x1="12" y1="10" x2="12" y2="10.01" />
                <line x1="16" y1="10" x2="16" y2="10.01" />
                <line x1="8" y1="14" x2="8" y2="14.01" />
                <line x1="12" y1="14" x2="12" y2="14.01" />
                <line x1="16" y1="14" x2="16" y2="14.01" />
                <line x1="8" y1="18" x2="16" y2="18" />
              </svg>
            {:else if cat.icon === 'pen'}
              <svg class="w-4.5 h-4.5 {cat.iconColor}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            {:else if cat.icon === 'chart'}
              <svg class="w-4.5 h-4.5 {cat.iconColor}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            {:else if cat.icon === 'search'}
              <svg class="w-4.5 h-4.5 {cat.iconColor}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            {:else if cat.icon === 'chat'}
              <svg class="w-4.5 h-4.5 {cat.iconColor}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            {/if}
          </div>
          <p class="font-semibold text-sm leading-snug">{cat.title}</p>
          <p class="text-xs text-text-muted mt-0.5 leading-relaxed">{cat.description}</p>
        </button>

        <!-- Expanded form — spans full width below the grid row -->
        {#if isActive}
          <div
            class="col-span-2 rounded-xl bg-surface-card border {activeBorders[cat.color]} p-5 space-y-4"
            in:slide={{ duration: 250 }}
          >
            <!-- CRA Notice form -->
            {#if cat.id === 'cra-notice'}
              <label class="block">
                <span class="text-sm font-medium">Type of notice</span>
                <select bind:value={craNoticeType} class={selectClass}>
                  <option value="">Select...</option>
                  {#each craNoticeTypes as type}
                    <option value={type}>{type}</option>
                  {/each}
                </select>
              </label>
              <label class="block">
                <span class="text-sm font-medium">What does the notice say?</span>
                <textarea bind:value={craDetails} rows="3" placeholder="Describe it in your own words..." class={textareaClass}></textarea>
              </label>

            <!-- NIHB Appeal form -->
            {:else if cat.id === 'nihb-appeal'}
              <label class="block">
                <span class="text-sm font-medium">Service type</span>
                <select bind:value={nihbServiceType} class={selectClass}>
                  <option value="">Select...</option>
                  {#each nihbServiceTypes as type}
                    <option value={type}>{type}</option>
                  {/each}
                </select>
              </label>
              <label class="block">
                <span class="text-sm font-medium">Reason for denial</span>
                <textarea bind:value={nihbReason} rows="2" placeholder="What reason did they give?" class={textareaClass}></textarea>
              </label>
              <label class="block">
                <span class="text-sm font-medium">Additional details</span>
                <textarea bind:value={nihbDetails} rows="2" placeholder="Anything else relevant..." class={textareaClass}></textarea>
              </label>

            <!-- Section 87 form -->
            {:else if cat.id === 'section-87'}
              <label class="block">
                <span class="text-sm font-medium">Where do you perform your work?</span>
                <select bind:value={s87WorkLocation} class={selectClass}>
                  <option value="">Select...</option>
                  <option value="on-reserve">On reserve</option>
                  <option value="off-reserve">Off reserve</option>
                  <option value="mixed">A mix of both</option>
                </select>
              </label>
              <label class="block">
                <span class="text-sm font-medium">Is your employer located on reserve?</span>
                <select bind:value={s87EmployerLocation} class={selectClass}>
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="not-sure">Not sure</option>
                </select>
              </label>
              <label class="block">
                <span class="text-sm font-medium">Does your work primarily benefit reserve residents?</span>
                <select bind:value={s87BenefitsReserve} class={selectClass}>
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="not-sure">Not sure</option>
                </select>
              </label>
              <label class="block">
                <span class="text-sm font-medium">Do you live on reserve?</span>
                <select bind:value={s87LivesOnReserve} class={selectClass}>
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>

            <!-- Budget form -->
            {:else if cat.id === 'budget'}
              <label class="block">
                <span class="text-sm font-medium">Monthly income (after tax)</span>
                <input type="number" bind:value={budgetIncome} placeholder="e.g. 3200" class={inputClass} />
              </label>
              <label class="block">
                <span class="text-sm font-medium">Monthly expenses</span>
                <input type="number" bind:value={budgetExpenses} placeholder="e.g. 2800" class={inputClass} />
              </label>
              <label class="block">
                <span class="text-sm font-medium">Main concerns</span>
                <textarea bind:value={budgetConcerns} rows="2" placeholder="e.g. rent is too high, no savings, debt..." class={textareaClass}></textarea>
              </label>

            <!-- Letter form -->
            {:else if cat.id === 'letter'}
              <label class="block">
                <span class="text-sm font-medium">Type of letter</span>
                <select bind:value={letterType} class={selectClass}>
                  <option value="">Select...</option>
                  {#each letterTypes as lt}
                    <option value={lt.value}>{lt.label}</option>
                  {/each}
                </select>
              </label>
              <label class="block">
                <span class="text-sm font-medium">Recipient or organization</span>
                <input type="text" bind:value={letterRecipient} placeholder="e.g. NIHB, CRA, my band council" class={inputClass} />
              </label>
              <label class="block">
                <span class="text-sm font-medium">Describe your situation</span>
                <textarea bind:value={letterSituation} rows="3" placeholder="What happened and what outcome do you want?" class={textareaClass}></textarea>
              </label>

            <!-- Band finance form -->
            {:else if cat.id === 'band-finance'}
              <label class="block">
                <span class="text-sm font-medium">Describe what you are looking at</span>
                <textarea bind:value={bandFinanceDescription} rows="4" placeholder="Paste numbers, describe the document, or ask specific questions about your band's finances..." class={textareaClass}></textarea>
              </label>

            <!-- Benefits form -->
            {:else if cat.id === 'benefits'}
              <label class="block">
                <span class="text-sm font-medium">Age range</span>
                <select bind:value={benefitsAge} class={selectClass}>
                  <option value="">Select...</option>
                  <option value="under18">Under 18</option>
                  <option value="18-24">18 to 24</option>
                  <option value="25-64">25 to 64</option>
                  <option value="65+">65 or older</option>
                </select>
              </label>
              <label class="block">
                <span class="text-sm font-medium">Do you live on reserve?</span>
                <select bind:value={benefitsOnReserve} class={selectClass}>
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="parttime">Part-time</option>
                </select>
              </label>
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" bind:checked={benefitsChildren} class="w-5 h-5 rounded border-stone-300 text-sage-500 focus:ring-sage-200" />
                <span class="text-sm font-medium">I have children under 18</span>
              </label>
              <label class="block">
                <span class="text-sm font-medium">Employment status</span>
                <select bind:value={benefitsEmployed} class={selectClass}>
                  <option value="">Select...</option>
                  <option value="on-reserve">Employed, on reserve</option>
                  <option value="off-reserve">Employed, off reserve</option>
                  <option value="not-working">Not working</option>
                  <option value="student">Student</option>
                </select>
              </label>
              <label class="block">
                <span class="text-sm font-medium">Do you file your taxes?</span>
                <select bind:value={benefitsFilesTaxes} class={selectClass}>
                  <option value="">Select...</option>
                  <option value="yes">Yes, recently</option>
                  <option value="no">No, not recently</option>
                  <option value="unsure">Not sure</option>
                </select>
              </label>

            <!-- General form -->
            {:else if cat.id === 'general'}
              <label class="block">
                <span class="text-sm font-medium">What do you need help with?</span>
                <textarea bind:value={generalQuestion} rows="4" placeholder="Ask any financial question..." class={textareaClass}></textarea>
              </label>
            {/if}

            <!-- Generate button -->
            <button
              onclick={generatePrompt}
              class="w-full py-3 rounded-xl text-sm font-semibold bg-stone-900 text-white
                hover:bg-stone-800 active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              Generate prompt
            </button>

            <!-- Prompt preview -->
            {#if generatedPrompt}
              <div in:fade={{ duration: 200 }} class="space-y-3">
                <div class="rounded-xl border border-stone-200 bg-surface-warm p-4">
                  <p class="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Your prompt</p>
                  <textarea
                    bind:value={generatedPrompt}
                    rows="10"
                    class="w-full bg-transparent text-sm font-mono leading-relaxed resize-y
                      focus:outline-none text-text-primary"
                  ></textarea>
                </div>

                <div class="flex gap-2">
                  <button
                    onclick={copyPrompt}
                    class="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
                      {copied
                        ? 'bg-sage-500 text-white'
                        : 'bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98]'}"
                  >
                    {copied ? 'Copied' : 'Copy to clipboard'}
                  </button>
                  <button
                    onclick={openClaude}
                    class="flex-1 py-3 rounded-xl text-sm font-semibold border border-stone-300
                      bg-surface-card text-text-primary hover:border-stone-400 hover:shadow-sm
                      active:scale-[0.98] transition-all duration-200 cursor-pointer"
                  >
                    Open in Claude
                  </button>
                </div>

                <p class="text-[10px] text-text-muted text-center leading-relaxed">
                  Copy the prompt above, then paste it into Claude. Nothing is sent automatically.
                </p>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
