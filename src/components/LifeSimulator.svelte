<script lang="ts">
  import {
    getCities,
    getCityByName,
    estimateMonthlyTax,
    estimateMonthlyCosts,
    estimateMonthlyCPPEI,
    type CityData,
  } from '../lib/simulator-data';
  import { fly, fade, slide } from 'svelte/transition';

  // ---- Scenarios ----

  type Scenario = 'moving-work' | 'leaving-school' | 'moving-back' | 'starting-business' | 'retiring';

  interface ScenarioOption {
    id: Scenario;
    label: string;
    description: string;
    accent: string;
    accentBg: string;
    icon: string;
  }

  const scenarios: ScenarioOption[] = [
    {
      id: 'moving-work',
      label: 'Moving off reserve for work',
      description: 'See how taxes and city costs change your take-home pay.',
      accent: 'text-sage-600',
      accentBg: 'bg-sage-50 border-sage-200 hover:border-sage-300',
      icon: 'briefcase',
    },
    {
      id: 'leaving-school',
      label: 'Leaving for school',
      description: 'Budget projection for your education move.',
      accent: 'text-water-600',
      accentBg: 'bg-water-50 border-water-200 hover:border-water-300',
      icon: 'book',
    },
    {
      id: 'moving-back',
      label: 'Moving back home',
      description: 'See what changes when you return to reserve.',
      accent: 'text-clay-600',
      accentBg: 'bg-clay-50 border-clay-200 hover:border-clay-300',
      icon: 'home',
    },
    {
      id: 'starting-business',
      label: 'Starting a business',
      description: 'Estimate startup costs against your current income.',
      accent: 'text-berry-600',
      accentBg: 'bg-berry-50 border-berry-200 hover:border-berry-300',
      icon: 'store',
    },
    {
      id: 'retiring',
      label: 'Retiring',
      description: 'Compare working income to retirement income.',
      accent: 'text-stone-600',
      accentBg: 'bg-stone-50 border-stone-200 hover:border-stone-300',
      icon: 'sunset',
    },
  ];

  // ---- State ----

  let selectedScenario = $state<Scenario | null>(null);
  let step = $state(0);
  let showResults = $state(false);
  const allCities = getCities();

  // ---- Shared inputs ----
  let incomeType = $state<'annual' | 'hourly'>('annual');
  let annualIncome = $state('');
  let hourlyRate = $state('');
  let hoursPerWeek = $state('40');
  let isExempt = $state(true);
  let currentExpenses = $state('');
  let selectedCity = $state(allCities[0].name);
  let workType = $state<'same' | 'different' | 'new'>('same');

  // School inputs
  let bandFunding = $state('');
  let scholarships = $state('');
  let savings = $state('');
  let partTimeWork = $state('');
  let tuition = $state('');

  // Moving back inputs
  let currentCity = $state(allCities[0].name);
  let reserveIncome = $state('');

  // Business inputs
  let startupCosts = $state('');
  let expectedRevenue = $state('');
  let businessExpenses = $state('');
  let onReserve = $state(true);

  // Retiring inputs
  let cppAmount = $state('');
  let oasAmount = $state('');
  let pensionAmount = $state('');
  let retirementSavings = $state('');
  let retireOnReserve = $state(true);

  // ---- Derived values ----

  let computedAnnualIncome = $derived(
    incomeType === 'annual'
      ? parseFloat(annualIncome) || 0
      : (parseFloat(hourlyRate) || 0) * (parseFloat(hoursPerWeek) || 0) * 52
  );

  let city = $derived(getCityByName(selectedCity));
  let currentCityData = $derived(getCityByName(currentCity));

  // ---- Flow config per scenario ----

  let totalSteps = $derived(
    selectedScenario === 'moving-work' ? 3
    : selectedScenario === 'leaving-school' ? 3
    : selectedScenario === 'moving-back' ? 2
    : selectedScenario === 'starting-business' ? 3
    : selectedScenario === 'retiring' ? 2
    : 0
  );

  // ---- Formatting ----

  function fmt(n: number): string {
    return Math.round(n).toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function fmtSigned(n: number): string {
    const prefix = n > 0 ? '+' : n < 0 ? '-' : '';
    return `${prefix}$${fmt(Math.abs(n))}`;
  }

  // ---- Navigation ----

  function selectScenario(id: Scenario) {
    selectedScenario = id;
    step = 0;
    showResults = false;
    resetInputs();
  }

  function resetInputs() {
    incomeType = 'annual';
    annualIncome = '';
    hourlyRate = '';
    hoursPerWeek = '40';
    isExempt = true;
    currentExpenses = '';
    selectedCity = allCities[0].name;
    workType = 'same';
    bandFunding = '';
    scholarships = '';
    savings = '';
    partTimeWork = '';
    tuition = '';
    currentCity = allCities[0].name;
    reserveIncome = '';
    startupCosts = '';
    expectedRevenue = '';
    businessExpenses = '';
    onReserve = true;
    cppAmount = '';
    oasAmount = '';
    pensionAmount = '';
    retirementSavings = '';
    retireOnReserve = true;
  }

  function back() {
    if (showResults) {
      showResults = false;
    } else if (step > 0) {
      step--;
    } else {
      selectedScenario = null;
    }
  }

  function next() {
    if (step < totalSteps - 1) {
      step++;
    } else {
      showResults = true;
    }
  }

  function startOver() {
    selectedScenario = null;
    step = 0;
    showResults = false;
    resetInputs();
  }

  // ---- Result computations ----

  // Moving for work
  let movingWorkResult = $derived.by(() => {
    if (selectedScenario !== 'moving-work' || !city) return null;
    const income = computedAnnualIncome;
    const currentTax = estimateMonthlyTax(income, 'BC', isExempt); // reserve = exempt
    const currentDeductions = isExempt ? 0 : estimateMonthlyCPPEI(income);
    const currentExp = parseFloat(currentExpenses) || 0;
    const currentNet = Math.round(income / 12) - currentTax - currentDeductions - currentExp;

    const newTax = estimateMonthlyTax(income, city.province, false);
    const newDeductions = estimateMonthlyCPPEI(income);
    const newCosts = estimateMonthlyCosts(city);
    const newNet = Math.round(income / 12) - newTax - newDeductions - newCosts;

    return {
      monthlyGross: Math.round(income / 12),
      currentTax,
      currentDeductions,
      currentExp,
      currentNet,
      newTax,
      newDeductions,
      newCosts,
      newNet,
      difference: newNet - currentNet,
      cityName: city.name,
      province: city.province,
      wasExempt: isExempt,
    };
  });

  // Leaving for school
  let schoolResult = $derived.by(() => {
    if (selectedScenario !== 'leaving-school' || !city) return null;
    const band = parseFloat(bandFunding) || 0;
    const schol = parseFloat(scholarships) || 0;
    const sav = parseFloat(savings) || 0;
    const work = parseFloat(partTimeWork) || 0;
    const tui = parseFloat(tuition) || 0;
    const totalIncome = band + schol + sav + work;
    const livingCosts = estimateMonthlyCosts(city);
    const totalExpenses = livingCosts + tui;
    const difference = totalIncome - totalExpenses;

    return {
      income: { band, scholarships: schol, savings: sav, work },
      totalIncome,
      livingCosts,
      tuition: tui,
      totalExpenses,
      difference,
      cityName: city.name,
    };
  });

  // Moving back
  let movingBackResult = $derived.by(() => {
    if (selectedScenario !== 'moving-back' || !currentCityData) return null;
    const cityIncome = computedAnnualIncome;
    const cityTax = estimateMonthlyTax(cityIncome, currentCityData.province, false);
    const cityDeductions = estimateMonthlyCPPEI(cityIncome);
    const cityCosts = estimateMonthlyCosts(currentCityData);
    const cityNet = Math.round(cityIncome / 12) - cityTax - cityDeductions - cityCosts;

    const resIncome = parseFloat(reserveIncome) || 0;
    const reserveTax = estimateMonthlyTax(resIncome * 12, 'BC', true); // exempt on reserve
    const reserveDeductions = 0; // exempt employment
    const reserveExp = parseFloat(currentExpenses) || 0;
    const reserveNet = resIncome - reserveTax - reserveDeductions - reserveExp;

    const taxSavings = cityTax; // going from taxed to exempt

    return {
      cityMonthlyGross: Math.round(cityIncome / 12),
      cityTax,
      cityDeductions,
      cityCosts,
      cityNet,
      reserveMonthly: resIncome,
      reserveTax,
      reserveExp,
      reserveNet,
      taxSavings,
      difference: reserveNet - cityNet,
      fromCity: currentCityData.name,
    };
  });

  // Starting a business
  let businessResult = $derived.by(() => {
    if (selectedScenario !== 'starting-business') return null;
    const currentIncome = computedAnnualIncome;
    const currentTax = estimateMonthlyTax(currentIncome, 'BC', isExempt);
    const currentDeductions = isExempt ? 0 : estimateMonthlyCPPEI(currentIncome);
    const currentExp = parseFloat(currentExpenses) || 0;
    const currentNet = Math.round(currentIncome / 12) - currentTax - currentDeductions - currentExp;

    const revenue = parseFloat(expectedRevenue) || 0;
    const bizExp = parseFloat(businessExpenses) || 0;
    const startup = parseFloat(startupCosts) || 0;
    const bizProfit = revenue - bizExp;
    const bizTax = estimateMonthlyTax(bizProfit * 12, 'BC', onReserve);
    const bizNet = bizProfit - bizTax;
    const startupMonthly = Math.round(startup / 12); // amortised over first year

    return {
      currentMonthlyGross: Math.round(currentIncome / 12),
      currentTax,
      currentDeductions,
      currentExp,
      currentNet,
      revenue,
      bizExp,
      bizProfit,
      bizTax,
      bizNet,
      startupMonthly,
      bizNetAfterStartup: bizNet - startupMonthly,
      difference: (bizNet - startupMonthly) - currentNet,
      onReserve,
    };
  });

  // Retiring
  let retireResult = $derived.by(() => {
    if (selectedScenario !== 'retiring') return null;
    const currentIncome = computedAnnualIncome;
    const currentTax = estimateMonthlyTax(currentIncome, 'BC', isExempt);
    const currentDeductions = isExempt ? 0 : estimateMonthlyCPPEI(currentIncome);
    const currentExp = parseFloat(currentExpenses) || 0;
    const currentNet = Math.round(currentIncome / 12) - currentTax - currentDeductions - currentExp;

    const cpp = parseFloat(cppAmount) || 0;
    const oas = parseFloat(oasAmount) || 0;
    const pension = parseFloat(pensionAmount) || 0;
    const retSavings = parseFloat(retirementSavings) || 0;
    const retirementIncome = cpp + oas + pension + retSavings;
    const retirementTax = estimateMonthlyTax(retirementIncome * 12, 'BC', retireOnReserve);

    return {
      currentMonthlyGross: Math.round(currentIncome / 12),
      currentTax,
      currentDeductions,
      currentExp,
      currentNet,
      cpp,
      oas,
      pension,
      retSavings,
      retirementIncome,
      retirementTax,
      retirementNet: retirementIncome - retirementTax - currentExp,
      difference: (retirementIncome - retirementTax - currentExp) - currentNet,
      retireOnReserve,
    };
  });
</script>

<div class="space-y-5">
  <!-- Scenario selection -->
  {#if !selectedScenario}
    <div in:fade={{ duration: 200 }} class="space-y-3">
      {#each scenarios as s}
        <button
          onclick={() => selectScenario(s.id)}
          class="w-full text-left rounded-2xl border p-5 transition-all duration-200 cursor-pointer active:scale-[0.98] {s.accentBg}"
        >
          <p class="text-base font-semibold {s.accent}">{s.label}</p>
          <p class="text-sm text-text-secondary mt-1">{s.description}</p>
        </button>
      {/each}
    </div>

  <!-- Active scenario flow -->
  {:else if !showResults}
    <div class="rounded-2xl bg-surface-card border border-stone-200 overflow-hidden shadow-lg">
      <!-- Progress bar -->
      <div class="h-1 bg-stone-100">
        <div
          class="h-full bg-gradient-to-r from-sage-400 to-water-400 transition-all duration-500 ease-[var(--ease-out)]"
          style="width: {((step + 1) / totalSteps) * 100}%"
        ></div>
      </div>

      <div class="p-6">
        <!-- MOVING OFF RESERVE FOR WORK -->
        {#if selectedScenario === 'moving-work'}
          {#if step === 0}
            <div in:fly={{ y: 20, duration: 300 }}>
              <p class="text-sm text-text-muted mb-1">Step 1 of 3</p>
              <h3 class="text-xl font-semibold mb-2">Your current situation</h3>
              <p class="text-sm text-text-secondary mb-5">Tell us about your income now.</p>

              <div class="space-y-4">
                <!-- Income type toggle -->
                <div class="flex gap-2">
                  <button
                    onclick={() => incomeType = 'annual'}
                    class="flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer
                      {incomeType === 'annual' ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-text-secondary hover:border-stone-300'}"
                  >
                    Annual salary
                  </button>
                  <button
                    onclick={() => incomeType = 'hourly'}
                    class="flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer
                      {incomeType === 'hourly' ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-text-secondary hover:border-stone-300'}"
                  >
                    Hourly wage
                  </button>
                </div>

                {#if incomeType === 'annual'}
                  <div>
                    <label for="annual-income" class="block text-xs font-medium text-text-muted mb-1">Annual income (before tax)</label>
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                      <input
                        id="annual-income"
                        type="number"
                        inputmode="numeric"
                        bind:value={annualIncome}
                        placeholder="45,000"
                        min="0"
                        class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm
                          placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
                          focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                {:else}
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label for="hourly-rate" class="block text-xs font-medium text-text-muted mb-1">Hourly rate</label>
                      <div class="relative">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                        <input
                          id="hourly-rate"
                          type="number"
                          inputmode="decimal"
                          bind:value={hourlyRate}
                          placeholder="22"
                          min="0"
                          class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm
                            placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
                            focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label for="hours-week" class="block text-xs font-medium text-text-muted mb-1">Hours / week</label>
                      <input
                        id="hours-week"
                        type="number"
                        inputmode="numeric"
                        bind:value={hoursPerWeek}
                        placeholder="40"
                        min="0"
                        max="80"
                        class="w-full rounded-lg border border-stone-200 bg-surface-warm px-3 py-2.5 text-sm
                          placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
                          focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                {/if}

                {#if computedAnnualIncome > 0}
                  <p class="text-xs text-text-muted">
                    That's roughly <span class="font-semibold text-text-secondary">${fmt(computedAnnualIncome)}</span> per year.
                  </p>
                {/if}

                <!-- Tax exemption -->
                <div class="rounded-xl bg-water-50 border border-water-200 p-4">
                  <label class="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      bind:checked={isExempt}
                      class="mt-0.5 rounded border-stone-300 text-water-600 focus:ring-water-300 cursor-pointer"
                    />
                    <div>
                      <p class="text-sm font-medium text-water-700">Income is currently tax-exempt</p>
                      <p class="text-xs text-water-600 mt-0.5">Under Section 87 of the Indian Act, employment income earned on reserve is exempt from federal and provincial income tax.</p>
                    </div>
                  </label>
                </div>

                <!-- Current expenses -->
                <div>
                  <label for="current-expenses" class="block text-xs font-medium text-text-muted mb-1">Current monthly expenses (rough estimate)</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input
                      id="current-expenses"
                      type="number"
                      inputmode="numeric"
                      bind:value={currentExpenses}
                      placeholder="1,200"
                      min="0"
                      class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm
                        placeholder:text-stone-400 focus:border-sage-300 focus:ring-1 focus:ring-sage-200
                        focus:outline-none transition-colors"
                    />
                  </div>
                  <p class="text-xs text-text-muted mt-1">Housing, food, phone — whatever you pay now.</p>
                </div>
              </div>
            </div>

          {:else if step === 1}
            <div in:fly={{ y: 20, duration: 300 }}>
              <p class="text-sm text-text-muted mb-1">Step 2 of 3</p>
              <h3 class="text-xl font-semibold mb-2">Where are you going?</h3>
              <p class="text-sm text-text-secondary mb-5">Pick the city you're considering.</p>

              <div>
                <label for="city-select" class="block text-xs font-medium text-text-muted mb-1">City</label>
                <select
                  id="city-select"
                  bind:value={selectedCity}
                  class="w-full rounded-lg border border-stone-200 bg-surface-warm px-3 py-2.5 text-sm
                    focus:border-sage-300 focus:ring-1 focus:ring-sage-200
                    focus:outline-none transition-colors cursor-pointer"
                >
                  {#each allCities as c}
                    <option value={c.name}>{c.name}, {c.province}</option>
                  {/each}
                </select>
              </div>

              {#if city}
                <div class="mt-4 rounded-xl bg-stone-50 border border-stone-200 p-4">
                  <p class="text-xs font-semibold text-stone-400 tracking-widest uppercase mb-3">Estimated monthly costs in {city.name}</p>
                  <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-text-secondary">Rent (1-bedroom)</span>
                      <span class="font-medium">${fmt(city.rent)}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-text-secondary">Groceries</span>
                      <span class="font-medium">${fmt(city.groceries)}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-text-secondary">Transit</span>
                      <span class="font-medium">${fmt(city.transit)}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-text-secondary">Utilities</span>
                      <span class="font-medium">${fmt(city.utilities)}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-text-secondary">Phone</span>
                      <span class="font-medium">${fmt(city.phone)}</span>
                    </div>
                    <div class="flex justify-between text-sm font-semibold pt-2 border-t border-stone-200">
                      <span>Total</span>
                      <span>${fmt(estimateMonthlyCosts(city))}</span>
                    </div>
                  </div>
                </div>
              {/if}
            </div>

          {:else if step === 2}
            <div in:fly={{ y: 20, duration: 300 }}>
              <p class="text-sm text-text-muted mb-1">Step 3 of 3</p>
              <h3 class="text-xl font-semibold mb-2">What kind of work?</h3>
              <p class="text-sm text-text-secondary mb-5">This helps estimate if your income stays the same.</p>

              <div class="space-y-2">
                {#each [
                  { value: 'same', label: 'Same type of work, same pay', desc: 'Your income stays roughly the same.' },
                  { value: 'different', label: 'Different employer, similar field', desc: 'Pay may vary — we\'ll use your current income as a starting point.' },
                  { value: 'new', label: 'Entirely new career', desc: 'Income could change significantly. We\'ll use your current figure for comparison.' },
                ] as option}
                  <button
                    onclick={() => workType = option.value as 'same' | 'different' | 'new'}
                    class="w-full text-left rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer
                      {workType === option.value ? 'border-sage-400 bg-sage-50' : 'border-stone-200 hover:border-stone-300'}"
                  >
                    <p class="text-sm font-medium">{option.label}</p>
                    <p class="text-xs text-text-muted mt-0.5">{option.desc}</p>
                  </button>
                {/each}
              </div>
            </div>
          {/if}

        <!-- LEAVING FOR SCHOOL -->
        {:else if selectedScenario === 'leaving-school'}
          {#if step === 0}
            <div in:fly={{ y: 20, duration: 300 }}>
              <p class="text-sm text-text-muted mb-1">Step 1 of 3</p>
              <h3 class="text-xl font-semibold mb-2">Where are you studying?</h3>
              <p class="text-sm text-text-secondary mb-5">Pick the city your school is in.</p>

              <div>
                <label for="school-city" class="block text-xs font-medium text-text-muted mb-1">City</label>
                <select
                  id="school-city"
                  bind:value={selectedCity}
                  class="w-full rounded-lg border border-stone-200 bg-surface-warm px-3 py-2.5 text-sm
                    focus:border-water-300 focus:ring-1 focus:ring-water-200
                    focus:outline-none transition-colors cursor-pointer"
                >
                  {#each allCities as c}
                    <option value={c.name}>{c.name}, {c.province}</option>
                  {/each}
                </select>
              </div>

              {#if city}
                <div class="mt-4 rounded-xl bg-stone-50 border border-stone-200 p-4">
                  <p class="text-xs font-semibold text-stone-400 tracking-widest uppercase mb-2">Monthly living costs in {city.name}</p>
                  <p class="text-2xl font-bold">${fmt(estimateMonthlyCosts(city))}</p>
                </div>
              {/if}
            </div>

          {:else if step === 1}
            <div in:fly={{ y: 20, duration: 300 }}>
              <p class="text-sm text-text-muted mb-1">Step 2 of 3</p>
              <h3 class="text-xl font-semibold mb-2">Your funding sources</h3>
              <p class="text-sm text-text-secondary mb-5">Monthly amounts you expect to receive or use.</p>

              <div class="space-y-3">
                <div>
                  <label for="band-funding" class="block text-xs font-medium text-text-muted mb-1">Band / post-secondary funding</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input id="band-funding" type="number" inputmode="numeric" bind:value={bandFunding} placeholder="0" min="0"
                      class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm placeholder:text-stone-400 focus:border-water-300 focus:ring-1 focus:ring-water-200 focus:outline-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label for="scholarships" class="block text-xs font-medium text-text-muted mb-1">Scholarships / bursaries</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input id="scholarships" type="number" inputmode="numeric" bind:value={scholarships} placeholder="0" min="0"
                      class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm placeholder:text-stone-400 focus:border-water-300 focus:ring-1 focus:ring-water-200 focus:outline-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label for="savings-draw" class="block text-xs font-medium text-text-muted mb-1">Monthly draw from savings</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input id="savings-draw" type="number" inputmode="numeric" bind:value={savings} placeholder="0" min="0"
                      class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm placeholder:text-stone-400 focus:border-water-300 focus:ring-1 focus:ring-water-200 focus:outline-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label for="part-time" class="block text-xs font-medium text-text-muted mb-1">Part-time work income</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input id="part-time" type="number" inputmode="numeric" bind:value={partTimeWork} placeholder="0" min="0"
                      class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm placeholder:text-stone-400 focus:border-water-300 focus:ring-1 focus:ring-water-200 focus:outline-none transition-colors" />
                  </div>
                </div>
              </div>
            </div>

          {:else if step === 2}
            <div in:fly={{ y: 20, duration: 300 }}>
              <p class="text-sm text-text-muted mb-1">Step 3 of 3</p>
              <h3 class="text-xl font-semibold mb-2">School costs</h3>
              <p class="text-sm text-text-secondary mb-5">Monthly tuition and fees (divide your annual total by the months you're enrolled).</p>

              <div>
                <label for="tuition" class="block text-xs font-medium text-text-muted mb-1">Monthly tuition / fees</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                  <input id="tuition" type="number" inputmode="numeric" bind:value={tuition} placeholder="500" min="0"
                    class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm placeholder:text-stone-400 focus:border-water-300 focus:ring-1 focus:ring-water-200 focus:outline-none transition-colors" />
                </div>
              </div>
            </div>
          {/if}

        <!-- MOVING BACK HOME -->
        {:else if selectedScenario === 'moving-back'}
          {#if step === 0}
            <div in:fly={{ y: 20, duration: 300 }}>
              <p class="text-sm text-text-muted mb-1">Step 1 of 2</p>
              <h3 class="text-xl font-semibold mb-2">Where are you now?</h3>
              <p class="text-sm text-text-secondary mb-5">Your current city and income.</p>

              <div class="space-y-4">
                <div>
                  <label for="current-city" class="block text-xs font-medium text-text-muted mb-1">Current city</label>
                  <select
                    id="current-city"
                    bind:value={currentCity}
                    class="w-full rounded-lg border border-stone-200 bg-surface-warm px-3 py-2.5 text-sm
                      focus:border-clay-300 focus:ring-1 focus:ring-clay-200
                      focus:outline-none transition-colors cursor-pointer"
                  >
                    {#each allCities as c}
                      <option value={c.name}>{c.name}, {c.province}</option>
                    {/each}
                  </select>
                </div>

                <div>
                  <label for="city-income" class="block text-xs font-medium text-text-muted mb-1">Annual income</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input id="city-income" type="number" inputmode="numeric" bind:value={annualIncome} placeholder="45,000" min="0"
                      class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm placeholder:text-stone-400 focus:border-clay-300 focus:ring-1 focus:ring-clay-200 focus:outline-none transition-colors" />
                  </div>
                </div>
              </div>
            </div>

          {:else if step === 1}
            <div in:fly={{ y: 20, duration: 300 }}>
              <p class="text-sm text-text-muted mb-1">Step 2 of 2</p>
              <h3 class="text-xl font-semibold mb-2">Back on reserve</h3>
              <p class="text-sm text-text-secondary mb-5">What you expect when you move back.</p>

              <div class="space-y-4">
                <div>
                  <label for="reserve-income" class="block text-xs font-medium text-text-muted mb-1">Expected monthly income on reserve</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input id="reserve-income" type="number" inputmode="numeric" bind:value={reserveIncome} placeholder="2,500" min="0"
                      class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm placeholder:text-stone-400 focus:border-clay-300 focus:ring-1 focus:ring-clay-200 focus:outline-none transition-colors" />
                  </div>
                </div>

                <div>
                  <label for="reserve-expenses" class="block text-xs font-medium text-text-muted mb-1">Expected monthly expenses on reserve</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input id="reserve-expenses" type="number" inputmode="numeric" bind:value={currentExpenses} placeholder="800" min="0"
                      class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm placeholder:text-stone-400 focus:border-clay-300 focus:ring-1 focus:ring-clay-200 focus:outline-none transition-colors" />
                  </div>
                  <p class="text-xs text-text-muted mt-1">Many costs are lower on reserve — housing may be covered, no transit needed.</p>
                </div>

                <div class="rounded-xl bg-water-50 border border-water-200 p-4">
                  <p class="text-sm text-water-700">On-reserve employment income is typically exempt from income tax under Section 87 of the Indian Act.</p>
                </div>
              </div>
            </div>
          {/if}

        <!-- STARTING A BUSINESS -->
        {:else if selectedScenario === 'starting-business'}
          {#if step === 0}
            <div in:fly={{ y: 20, duration: 300 }}>
              <p class="text-sm text-text-muted mb-1">Step 1 of 3</p>
              <h3 class="text-xl font-semibold mb-2">Your current situation</h3>
              <p class="text-sm text-text-secondary mb-5">What you're earning now.</p>

              <div class="space-y-4">
                <div>
                  <label for="biz-current-income" class="block text-xs font-medium text-text-muted mb-1">Annual income</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input id="biz-current-income" type="number" inputmode="numeric" bind:value={annualIncome} placeholder="45,000" min="0"
                      class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm placeholder:text-stone-400 focus:border-berry-300 focus:ring-1 focus:ring-berry-200 focus:outline-none transition-colors" />
                  </div>
                </div>

                <div class="rounded-xl bg-water-50 border border-water-200 p-4">
                  <label class="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" bind:checked={isExempt}
                      class="mt-0.5 rounded border-stone-300 text-water-600 focus:ring-water-300 cursor-pointer" />
                    <div>
                      <p class="text-sm font-medium text-water-700">Current income is tax-exempt (Section 87)</p>
                    </div>
                  </label>
                </div>

                <div>
                  <label for="biz-current-expenses" class="block text-xs font-medium text-text-muted mb-1">Monthly living expenses</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input id="biz-current-expenses" type="number" inputmode="numeric" bind:value={currentExpenses} placeholder="1,200" min="0"
                      class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm placeholder:text-stone-400 focus:border-berry-300 focus:ring-1 focus:ring-berry-200 focus:outline-none transition-colors" />
                  </div>
                </div>
              </div>
            </div>

          {:else if step === 1}
            <div in:fly={{ y: 20, duration: 300 }}>
              <p class="text-sm text-text-muted mb-1">Step 2 of 3</p>
              <h3 class="text-xl font-semibold mb-2">The business</h3>
              <p class="text-sm text-text-secondary mb-5">Rough estimates are fine.</p>

              <div class="space-y-4">
                <div>
                  <label for="expected-revenue" class="block text-xs font-medium text-text-muted mb-1">Expected monthly revenue</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input id="expected-revenue" type="number" inputmode="numeric" bind:value={expectedRevenue} placeholder="5,000" min="0"
                      class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm placeholder:text-stone-400 focus:border-berry-300 focus:ring-1 focus:ring-berry-200 focus:outline-none transition-colors" />
                  </div>
                </div>

                <div>
                  <label for="biz-expenses" class="block text-xs font-medium text-text-muted mb-1">Monthly business expenses</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input id="biz-expenses" type="number" inputmode="numeric" bind:value={businessExpenses} placeholder="2,000" min="0"
                      class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm placeholder:text-stone-400 focus:border-berry-300 focus:ring-1 focus:ring-berry-200 focus:outline-none transition-colors" />
                  </div>
                  <p class="text-xs text-text-muted mt-1">Rent, supplies, insurance, marketing, etc.</p>
                </div>

                <div>
                  <label for="startup-costs" class="block text-xs font-medium text-text-muted mb-1">One-time startup costs</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input id="startup-costs" type="number" inputmode="numeric" bind:value={startupCosts} placeholder="10,000" min="0"
                      class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm placeholder:text-stone-400 focus:border-berry-300 focus:ring-1 focus:ring-berry-200 focus:outline-none transition-colors" />
                  </div>
                  <p class="text-xs text-text-muted mt-1">We'll spread this across the first 12 months.</p>
                </div>
              </div>
            </div>

          {:else if step === 2}
            <div in:fly={{ y: 20, duration: 300 }}>
              <p class="text-sm text-text-muted mb-1">Step 3 of 3</p>
              <h3 class="text-xl font-semibold mb-2">Tax situation</h3>
              <p class="text-sm text-text-secondary mb-5">Where will the business operate?</p>

              <div class="rounded-xl bg-water-50 border border-water-200 p-4">
                <label class="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" bind:checked={onReserve}
                    class="mt-0.5 rounded border-stone-300 text-water-600 focus:ring-water-300 cursor-pointer" />
                  <div>
                    <p class="text-sm font-medium text-water-700">Business will operate on reserve</p>
                    <p class="text-xs text-water-600 mt-0.5">Business income earned on reserve by a Status Indian may qualify for Section 87 tax exemption. Rules are complex — consult a tax professional.</p>
                  </div>
                </label>
              </div>
            </div>
          {/if}

        <!-- RETIRING -->
        {:else if selectedScenario === 'retiring'}
          {#if step === 0}
            <div in:fly={{ y: 20, duration: 300 }}>
              <p class="text-sm text-text-muted mb-1">Step 1 of 2</p>
              <h3 class="text-xl font-semibold mb-2">Before retirement</h3>
              <p class="text-sm text-text-secondary mb-5">Your current working income.</p>

              <div class="space-y-4">
                <div>
                  <label for="retire-income" class="block text-xs font-medium text-text-muted mb-1">Annual income</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input id="retire-income" type="number" inputmode="numeric" bind:value={annualIncome} placeholder="55,000" min="0"
                      class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm placeholder:text-stone-400 focus:border-stone-300 focus:ring-1 focus:ring-stone-200 focus:outline-none transition-colors" />
                  </div>
                </div>

                <div class="rounded-xl bg-water-50 border border-water-200 p-4">
                  <label class="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" bind:checked={isExempt}
                      class="mt-0.5 rounded border-stone-300 text-water-600 focus:ring-water-300 cursor-pointer" />
                    <div>
                      <p class="text-sm font-medium text-water-700">Current income is tax-exempt (Section 87)</p>
                    </div>
                  </label>
                </div>

                <div>
                  <label for="retire-expenses" class="block text-xs font-medium text-text-muted mb-1">Monthly living expenses</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input id="retire-expenses" type="number" inputmode="numeric" bind:value={currentExpenses} placeholder="1,500" min="0"
                      class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm placeholder:text-stone-400 focus:border-stone-300 focus:ring-1 focus:ring-stone-200 focus:outline-none transition-colors" />
                  </div>
                </div>
              </div>
            </div>

          {:else if step === 1}
            <div in:fly={{ y: 20, duration: 300 }}>
              <p class="text-sm text-text-muted mb-1">Step 2 of 2</p>
              <h3 class="text-xl font-semibold mb-2">Retirement income</h3>
              <p class="text-sm text-text-secondary mb-5">Monthly amounts you expect to receive.</p>

              <div class="space-y-3">
                <div>
                  <label for="cpp-income" class="block text-xs font-medium text-text-muted mb-1">CPP (Canada Pension Plan)</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input id="cpp-income" type="number" inputmode="numeric" bind:value={cppAmount} placeholder="800" min="0"
                      class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm placeholder:text-stone-400 focus:border-stone-300 focus:ring-1 focus:ring-stone-200 focus:outline-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label for="oas-income" class="block text-xs font-medium text-text-muted mb-1">OAS (Old Age Security)</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input id="oas-income" type="number" inputmode="numeric" bind:value={oasAmount} placeholder="700" min="0"
                      class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm placeholder:text-stone-400 focus:border-stone-300 focus:ring-1 focus:ring-stone-200 focus:outline-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label for="pension-income" class="block text-xs font-medium text-text-muted mb-1">Employer pension</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input id="pension-income" type="number" inputmode="numeric" bind:value={pensionAmount} placeholder="0" min="0"
                      class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm placeholder:text-stone-400 focus:border-stone-300 focus:ring-1 focus:ring-stone-200 focus:outline-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label for="retirement-savings" class="block text-xs font-medium text-text-muted mb-1">Monthly draw from savings (RRSP, TFSA, etc.)</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">$</span>
                    <input id="retirement-savings" type="number" inputmode="numeric" bind:value={retirementSavings} placeholder="500" min="0"
                      class="w-full rounded-lg border border-stone-200 bg-surface-warm pl-7 pr-3 py-2.5 text-sm placeholder:text-stone-400 focus:border-stone-300 focus:ring-1 focus:ring-stone-200 focus:outline-none transition-colors" />
                  </div>
                </div>

                <div class="rounded-xl bg-water-50 border border-water-200 p-4">
                  <label class="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" bind:checked={retireOnReserve}
                      class="mt-0.5 rounded border-stone-300 text-water-600 focus:ring-water-300 cursor-pointer" />
                    <div>
                      <p class="text-sm font-medium text-water-700">Retiring on reserve</p>
                      <p class="text-xs text-water-600 mt-0.5">CPP and OAS are generally not exempt under Section 87, but pension income from on-reserve employment may be. Rules vary.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          {/if}
        {/if}

        <!-- Navigation -->
        <div class="flex items-center justify-between mt-6 pt-4 border-t border-stone-100">
          <button
            onclick={back}
            class="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          >
            Back
          </button>

          <button
            onclick={next}
            class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
              bg-stone-900 text-white hover:bg-stone-800 active:scale-95"
          >
            {step === totalSteps - 1 ? 'See results' : 'Continue'}
          </button>
        </div>
      </div>
    </div>

  <!-- RESULTS -->
  {:else}
    <div in:fly={{ y: 20, duration: 300 }} class="space-y-5">

      <!-- Moving for work results -->
      {#if selectedScenario === 'moving-work' && movingWorkResult}
        {@const r = movingWorkResult}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Current card -->
          <div class="rounded-2xl bg-surface-card border border-stone-200 p-5 shadow-sm">
            <p class="text-xs font-semibold text-stone-400 tracking-widest uppercase mb-4">Current</p>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Gross monthly</span>
                <span class="font-medium">${fmt(r.monthlyGross)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Income tax</span>
                <span class="font-medium {r.currentTax === 0 ? 'text-sage-600' : ''}">{r.currentTax === 0 ? '$0 (exempt)' : `-$${fmt(r.currentTax)}`}</span>
              </div>
              {#if r.currentDeductions > 0}
                <div class="flex justify-between text-sm">
                  <span class="text-text-secondary">CPP / EI</span>
                  <span class="font-medium">-${fmt(r.currentDeductions)}</span>
                </div>
              {/if}
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Expenses</span>
                <span class="font-medium">-${fmt(r.currentExp)}</span>
              </div>
              <div class="flex justify-between text-sm font-semibold pt-2 border-t border-stone-200">
                <span>Monthly net</span>
                <span class="text-sage-600">${fmt(r.currentNet)}</span>
              </div>
            </div>
          </div>

          <!-- After move card -->
          <div class="rounded-2xl bg-surface-card border border-sage-200 p-5 shadow-sm">
            <p class="text-xs font-semibold text-sage-500 tracking-widest uppercase mb-4">After move to {r.cityName}</p>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Gross monthly</span>
                <span class="font-medium">${fmt(r.monthlyGross)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Income tax</span>
                <span class="font-medium text-berry-600">-${fmt(r.newTax)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">CPP / EI</span>
                <span class="font-medium">-${fmt(r.newDeductions)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Living costs</span>
                <span class="font-medium">-${fmt(r.newCosts)}</span>
              </div>
              <div class="flex justify-between text-sm font-semibold pt-2 border-t border-stone-200">
                <span>Monthly net</span>
                <span class="{r.newNet >= 0 ? 'text-sage-600' : 'text-berry-600'}">{r.newNet >= 0 ? '' : '-'}${fmt(Math.abs(r.newNet))}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Difference banner -->
        <div class="rounded-2xl p-5 text-center {r.difference >= 0 ? 'bg-sage-50 border border-sage-200' : 'bg-berry-50 border border-berry-200'}">
          <p class="text-xs text-text-muted mb-1">Monthly difference</p>
          <p class="text-3xl font-bold {r.difference >= 0 ? 'text-sage-600' : 'text-berry-600'}">
            {fmtSigned(r.difference)}
          </p>
          <p class="text-sm text-text-secondary mt-1">per month</p>
        </div>

        <!-- Insights -->
        <div class="space-y-2">
          {#if r.wasExempt}
            <div class="rounded-xl bg-water-50 border border-water-200 px-4 py-3">
              <p class="text-sm text-water-700 leading-relaxed">
                <span class="font-semibold">Section 87 change:</span> Moving off reserve means your employment income will likely become taxable. That's approximately ${fmt(r.newTax)}/month in income tax that you don't currently pay.
              </p>
            </div>
          {/if}
          {#if r.newTax > 0}
            <div class="rounded-xl bg-clay-50 border border-clay-200 px-4 py-3">
              <p class="text-sm text-clay-700 leading-relaxed">
                Your estimated combined federal and {r.province} tax is ${fmt(r.newTax)}/month. CPP and EI add another ${fmt(r.newDeductions)}/month in deductions.
              </p>
            </div>
          {/if}
          <div class="rounded-xl bg-stone-50 border border-stone-200 px-4 py-3">
            <p class="text-sm text-text-secondary leading-relaxed">
              City costs are averages. Your actual expenses will depend on where you live, how you eat, and how you get around. Use the <a href="/money/budgeting" class="underline hover:text-text-primary">budget tool</a> to build a detailed picture.
            </p>
          </div>
        </div>

      <!-- School results -->
      {:else if selectedScenario === 'leaving-school' && schoolResult}
        {@const r = schoolResult}
        <div class="rounded-2xl bg-surface-card border border-stone-200 p-5 shadow-sm">
          <p class="text-xs font-semibold text-stone-400 tracking-widest uppercase mb-4">Monthly budget in {r.cityName}</p>

          <div class="space-y-4">
            <div>
              <p class="text-xs font-semibold text-sage-500 tracking-widest uppercase mb-2">Income</p>
              <div class="space-y-2">
                {#if r.income.band > 0}
                  <div class="flex justify-between text-sm">
                    <span class="text-text-secondary">Band / post-secondary funding</span>
                    <span class="font-medium text-sage-600">${fmt(r.income.band)}</span>
                  </div>
                {/if}
                {#if r.income.scholarships > 0}
                  <div class="flex justify-between text-sm">
                    <span class="text-text-secondary">Scholarships</span>
                    <span class="font-medium text-sage-600">${fmt(r.income.scholarships)}</span>
                  </div>
                {/if}
                {#if r.income.savings > 0}
                  <div class="flex justify-between text-sm">
                    <span class="text-text-secondary">Savings</span>
                    <span class="font-medium text-sage-600">${fmt(r.income.savings)}</span>
                  </div>
                {/if}
                {#if r.income.work > 0}
                  <div class="flex justify-between text-sm">
                    <span class="text-text-secondary">Part-time work</span>
                    <span class="font-medium text-sage-600">${fmt(r.income.work)}</span>
                  </div>
                {/if}
                <div class="flex justify-between text-sm font-semibold pt-1 border-t border-stone-100">
                  <span>Total income</span>
                  <span class="text-sage-600">${fmt(r.totalIncome)}</span>
                </div>
              </div>
            </div>

            <div>
              <p class="text-xs font-semibold text-berry-500 tracking-widest uppercase mb-2">Expenses</p>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-text-secondary">Living costs</span>
                  <span class="font-medium">${fmt(r.livingCosts)}</span>
                </div>
                {#if r.tuition > 0}
                  <div class="flex justify-between text-sm">
                    <span class="text-text-secondary">Tuition / fees</span>
                    <span class="font-medium">${fmt(r.tuition)}</span>
                  </div>
                {/if}
                <div class="flex justify-between text-sm font-semibold pt-1 border-t border-stone-100">
                  <span>Total expenses</span>
                  <span>${fmt(r.totalExpenses)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Difference -->
        <div class="rounded-2xl p-5 text-center {r.difference >= 0 ? 'bg-sage-50 border border-sage-200' : 'bg-berry-50 border border-berry-200'}">
          <p class="text-xs text-text-muted mb-1">{r.difference >= 0 ? 'Monthly surplus' : 'Monthly shortfall'}</p>
          <p class="text-3xl font-bold {r.difference >= 0 ? 'text-sage-600' : 'text-berry-600'}">
            {fmtSigned(r.difference)}
          </p>
        </div>

        {#if r.difference < 0}
          <div class="rounded-xl bg-clay-50 border border-clay-200 px-4 py-3">
            <p class="text-sm text-clay-700 leading-relaxed">
              There's a gap of ${fmt(Math.abs(r.difference))}/month. Consider applying for additional bursaries, adjusting housing, or picking up a few more hours of work.
            </p>
          </div>
        {/if}

      <!-- Moving back results -->
      {:else if selectedScenario === 'moving-back' && movingBackResult}
        {@const r = movingBackResult}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="rounded-2xl bg-surface-card border border-stone-200 p-5 shadow-sm">
            <p class="text-xs font-semibold text-stone-400 tracking-widest uppercase mb-4">In {r.fromCity}</p>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Gross monthly</span>
                <span class="font-medium">${fmt(r.cityMonthlyGross)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Income tax</span>
                <span class="font-medium text-berry-600">-${fmt(r.cityTax)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">CPP / EI</span>
                <span class="font-medium">-${fmt(r.cityDeductions)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Living costs</span>
                <span class="font-medium">-${fmt(r.cityCosts)}</span>
              </div>
              <div class="flex justify-between text-sm font-semibold pt-2 border-t border-stone-200">
                <span>Monthly net</span>
                <span class="{r.cityNet >= 0 ? 'text-sage-600' : 'text-berry-600'}">{r.cityNet >= 0 ? '' : '-'}${fmt(Math.abs(r.cityNet))}</span>
              </div>
            </div>
          </div>

          <div class="rounded-2xl bg-surface-card border border-clay-200 p-5 shadow-sm">
            <p class="text-xs font-semibold text-clay-500 tracking-widest uppercase mb-4">Back on reserve</p>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Monthly income</span>
                <span class="font-medium">${fmt(r.reserveMonthly)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Income tax</span>
                <span class="font-medium text-sage-600">$0 (exempt)</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Expenses</span>
                <span class="font-medium">-${fmt(r.reserveExp)}</span>
              </div>
              <div class="flex justify-between text-sm font-semibold pt-2 border-t border-stone-200">
                <span>Monthly net</span>
                <span class="{r.reserveNet >= 0 ? 'text-sage-600' : 'text-berry-600'}">{r.reserveNet >= 0 ? '' : '-'}${fmt(Math.abs(r.reserveNet))}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-2xl p-5 text-center {r.difference >= 0 ? 'bg-sage-50 border border-sage-200' : 'bg-berry-50 border border-berry-200'}">
          <p class="text-xs text-text-muted mb-1">Monthly difference</p>
          <p class="text-3xl font-bold {r.difference >= 0 ? 'text-sage-600' : 'text-berry-600'}">
            {fmtSigned(r.difference)}
          </p>
        </div>

        <div class="space-y-2">
          <div class="rounded-xl bg-water-50 border border-water-200 px-4 py-3">
            <p class="text-sm text-water-700 leading-relaxed">
              <span class="font-semibold">Tax savings:</span> Moving back to reserve means your employment income becomes exempt under Section 87. That's approximately ${fmt(r.taxSavings)}/month you keep.
            </p>
          </div>
          <div class="rounded-xl bg-clay-50 border border-clay-200 px-4 py-3">
            <p class="text-sm text-clay-700 leading-relaxed">
              Income may be lower on reserve, but so are many costs. The net effect depends on your specific situation.
            </p>
          </div>
        </div>

      <!-- Business results -->
      {:else if selectedScenario === 'starting-business' && businessResult}
        {@const r = businessResult}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="rounded-2xl bg-surface-card border border-stone-200 p-5 shadow-sm">
            <p class="text-xs font-semibold text-stone-400 tracking-widest uppercase mb-4">Current employment</p>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Gross monthly</span>
                <span class="font-medium">${fmt(r.currentMonthlyGross)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Income tax</span>
                <span class="font-medium">{r.currentTax === 0 ? '$0 (exempt)' : `-$${fmt(r.currentTax)}`}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Expenses</span>
                <span class="font-medium">-${fmt(r.currentExp)}</span>
              </div>
              <div class="flex justify-between text-sm font-semibold pt-2 border-t border-stone-200">
                <span>Monthly net</span>
                <span class="text-sage-600">${fmt(r.currentNet)}</span>
              </div>
            </div>
          </div>

          <div class="rounded-2xl bg-surface-card border border-berry-200 p-5 shadow-sm">
            <p class="text-xs font-semibold text-berry-500 tracking-widest uppercase mb-4">Business (year 1)</p>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Revenue</span>
                <span class="font-medium">${fmt(r.revenue)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Business expenses</span>
                <span class="font-medium">-${fmt(r.bizExp)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Tax on profit</span>
                <span class="font-medium">{r.bizTax === 0 ? '$0 (exempt)' : `-$${fmt(r.bizTax)}`}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Startup (amortised)</span>
                <span class="font-medium">-${fmt(r.startupMonthly)}</span>
              </div>
              <div class="flex justify-between text-sm font-semibold pt-2 border-t border-stone-200">
                <span>Monthly net</span>
                <span class="{r.bizNetAfterStartup >= 0 ? 'text-sage-600' : 'text-berry-600'}">{r.bizNetAfterStartup >= 0 ? '' : '-'}${fmt(Math.abs(r.bizNetAfterStartup))}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-2xl p-5 text-center {r.difference >= 0 ? 'bg-sage-50 border border-sage-200' : 'bg-berry-50 border border-berry-200'}">
          <p class="text-xs text-text-muted mb-1">Monthly difference (year 1)</p>
          <p class="text-3xl font-bold {r.difference >= 0 ? 'text-sage-600' : 'text-berry-600'}">
            {fmtSigned(r.difference)}
          </p>
        </div>

        <div class="space-y-2">
          {#if r.onReserve}
            <div class="rounded-xl bg-water-50 border border-water-200 px-4 py-3">
              <p class="text-sm text-water-700 leading-relaxed">
                <span class="font-semibold">Section 87 note:</span> Business income earned on reserve by a Status Indian may be tax-exempt. The rules depend on where the work is performed, where customers are, and other factors. Get professional advice.
              </p>
            </div>
          {/if}
          <div class="rounded-xl bg-clay-50 border border-clay-200 px-4 py-3">
            <p class="text-sm text-clay-700 leading-relaxed">
              Year 1 is usually the hardest. After startup costs are absorbed, your net improves by ${fmt(r.startupMonthly)}/month.
            </p>
          </div>
        </div>

      <!-- Retiring results -->
      {:else if selectedScenario === 'retiring' && retireResult}
        {@const r = retireResult}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="rounded-2xl bg-surface-card border border-stone-200 p-5 shadow-sm">
            <p class="text-xs font-semibold text-stone-400 tracking-widest uppercase mb-4">Working</p>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Gross monthly</span>
                <span class="font-medium">${fmt(r.currentMonthlyGross)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Income tax</span>
                <span class="font-medium">{r.currentTax === 0 ? '$0 (exempt)' : `-$${fmt(r.currentTax)}`}</span>
              </div>
              {#if r.currentDeductions > 0}
                <div class="flex justify-between text-sm">
                  <span class="text-text-secondary">CPP / EI</span>
                  <span class="font-medium">-${fmt(r.currentDeductions)}</span>
                </div>
              {/if}
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Expenses</span>
                <span class="font-medium">-${fmt(r.currentExp)}</span>
              </div>
              <div class="flex justify-between text-sm font-semibold pt-2 border-t border-stone-200">
                <span>Monthly net</span>
                <span class="text-sage-600">${fmt(r.currentNet)}</span>
              </div>
            </div>
          </div>

          <div class="rounded-2xl bg-surface-card border border-stone-200 p-5 shadow-sm">
            <p class="text-xs font-semibold text-stone-400 tracking-widest uppercase mb-4">Retired</p>
            <div class="space-y-2">
              {#if r.cpp > 0}
                <div class="flex justify-between text-sm">
                  <span class="text-text-secondary">CPP</span>
                  <span class="font-medium">${fmt(r.cpp)}</span>
                </div>
              {/if}
              {#if r.oas > 0}
                <div class="flex justify-between text-sm">
                  <span class="text-text-secondary">OAS</span>
                  <span class="font-medium">${fmt(r.oas)}</span>
                </div>
              {/if}
              {#if r.pension > 0}
                <div class="flex justify-between text-sm">
                  <span class="text-text-secondary">Pension</span>
                  <span class="font-medium">${fmt(r.pension)}</span>
                </div>
              {/if}
              {#if r.retSavings > 0}
                <div class="flex justify-between text-sm">
                  <span class="text-text-secondary">Savings draw</span>
                  <span class="font-medium">${fmt(r.retSavings)}</span>
                </div>
              {/if}
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Estimated tax</span>
                <span class="font-medium">{r.retirementTax === 0 ? '$0' : `-$${fmt(r.retirementTax)}`}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Expenses</span>
                <span class="font-medium">-${fmt(parseFloat(currentExpenses) || 0)}</span>
              </div>
              <div class="flex justify-between text-sm font-semibold pt-2 border-t border-stone-200">
                <span>Monthly net</span>
                <span class="{r.retirementNet >= 0 ? 'text-sage-600' : 'text-berry-600'}">{r.retirementNet >= 0 ? '' : '-'}${fmt(Math.abs(r.retirementNet))}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-2xl p-5 text-center {r.difference >= 0 ? 'bg-sage-50 border border-sage-200' : 'bg-berry-50 border border-berry-200'}">
          <p class="text-xs text-text-muted mb-1">Monthly difference</p>
          <p class="text-3xl font-bold {r.difference >= 0 ? 'text-sage-600' : 'text-berry-600'}">
            {fmtSigned(r.difference)}
          </p>
        </div>

        <div class="space-y-2">
          <div class="rounded-xl bg-water-50 border border-water-200 px-4 py-3">
            <p class="text-sm text-water-700 leading-relaxed">
              <span class="font-semibold">Section 87 and retirement:</span> CPP and OAS are generally not tax-exempt, even if you live on reserve. However, pension income from on-reserve employment and TFSA withdrawals remain tax-free. The details matter — speak with someone who understands both tax law and Section 87.
            </p>
          </div>
        </div>
      {/if}

      <!-- Disclaimer + actions -->
      <div class="rounded-xl bg-stone-50 border border-stone-200 px-4 py-3">
        <p class="text-xs text-text-muted leading-relaxed">
          This is an estimate based on averages and simplified tax calculations. It is not financial or tax advice. Your actual situation will depend on your specific circumstances, employer, location, and tax status. Consider speaking with a tax professional who understands Section 87.
        </p>
      </div>

      <div class="flex gap-3">
        <button
          onclick={startOver}
          class="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-stone-900 text-white
            hover:bg-stone-800 active:scale-95 transition-all cursor-pointer"
        >
          Try another scenario
        </button>
        <button
          onclick={() => { showResults = false; step = 0; }}
          class="px-4 py-2.5 rounded-xl text-sm text-text-muted hover:text-text-secondary border border-stone-200
            hover:border-stone-300 transition-colors cursor-pointer"
        >
          Edit inputs
        </button>
      </div>
    </div>
  {/if}
</div>
