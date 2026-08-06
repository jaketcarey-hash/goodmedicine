<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import {
    type CalendarProfile,
    type CustomReminder,
    getProfile,
    saveProfile,
    hasProfile,
    getEventsForMonth,
    TREATY_AREAS,
    PROVINCES,
    MONTH_NAMES,
  } from '../lib/calendar-store';
  import { CALENDAR_EVENTS } from '../lib/calendar-events';

  // ── State ──────────────────────────────────────────────────

  let profileReady = $state(false);
  let showSetup = $state(false);
  let profile = $state<CalendarProfile>(getProfile());

  // Month navigation: 0-based month index, year
  let viewMonth = $state(new Date().getMonth());
  let viewYear = $state(new Date().getFullYear());

  // Custom reminder form
  let newReminderLabel = $state('');
  let newReminderMonth = $state(new Date().getMonth());
  let newReminderDay = $state<string>('');
  let showReminderForm = $state(false);

  // Setup form working copy
  let draft = $state<CalendarProfile>(getProfile());

  // ── Derived ────────────────────────────────────────────────

  let events = $derived(getEventsForMonth(CALENDAR_EVENTS, viewMonth, profile));
  let topEvent = $derived(events.length > 0 ? events[0] : null);
  let remainingEvents = $derived(events.length > 1 ? events.slice(1) : []);
  let viewMonthLabel = $derived(`${MONTH_NAMES[viewMonth]} ${viewYear}`);

  // ── Lifecycle ──────────────────────────────────────────────

  $effect(() => {
    const stored = hasProfile();
    profileReady = stored;
    if (!stored) {
      showSetup = true;
    }
  });

  // ── Category labels ───────────────────────────────────────
  // Categories no longer tint cards or chips — colour on this site carries
  // meaning, and an event category is not a meaning. The text label does
  // the work on its own.

  const categoryLabel: Record<string, string> = {
    tax: 'Tax',
    benefits: 'Benefits',
    education: 'Education',
    band: 'Community',
    health: 'Health',
    custom: 'Reminder',
  };

  // ── Handlers ───────────────────────────────────────────────

  function saveSetup() {
    profile = { ...draft };
    saveProfile(profile);
    profileReady = true;
    showSetup = false;
  }

  function openSetup() {
    draft = { ...profile, bandDistributionMonths: [...profile.bandDistributionMonths], customReminders: [...profile.customReminders] };
    showSetup = true;
  }

  function prevMonth() {
    if (viewMonth === 0) {
      viewMonth = 11;
      viewYear--;
    } else {
      viewMonth--;
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      viewMonth = 0;
      viewYear++;
    } else {
      viewMonth++;
    }
  }

  function goToday() {
    viewMonth = new Date().getMonth();
    viewYear = new Date().getFullYear();
  }

  function toggleBandMonth(month: number) {
    if (draft.bandDistributionMonths.includes(month)) {
      draft.bandDistributionMonths = draft.bandDistributionMonths.filter((m) => m !== month);
    } else {
      draft.bandDistributionMonths = [...draft.bandDistributionMonths, month];
    }
  }

  function addReminder() {
    if (!newReminderLabel.trim()) return;
    const reminder: CustomReminder = {
      label: newReminderLabel.trim(),
      month: newReminderMonth,
    };
    if (newReminderDay && parseInt(newReminderDay) > 0 && parseInt(newReminderDay) <= 31) {
      reminder.day = parseInt(newReminderDay);
    }
    profile = {
      ...profile,
      customReminders: [...profile.customReminders, reminder],
    };
    saveProfile(profile);
    newReminderLabel = '';
    newReminderDay = '';
    showReminderForm = false;
  }

  function removeReminder(index: number) {
    profile = {
      ...profile,
      customReminders: profile.customReminders.filter((_, i) => i !== index),
    };
    saveProfile(profile);
  }

  const isCurrentMonth = $derived(
    viewMonth === new Date().getMonth() && viewYear === new Date().getFullYear()
  );
</script>

<div class="space-y-5">
  <!-- ═══════════════════════════════════════════════════════
       SETUP FLOW
       ═══════════════════════════════════════════════════════ -->
  {#if showSetup}
    <div in:fly={{ y: 20, duration: 300 }} class="rounded-sm bg-surface-card border border-rule shadow-lg overflow-hidden">
      <div class="p-6">
        <h2 class="text-xl font-semibold mb-1">Set up your calendar</h2>
        <p class="text-sm text-text-secondary mb-6">Tell us a bit about your situation so we can show what matters to you.</p>

        <!-- Treaty area -->
        <label class="block mb-4">
          <span class="text-sm font-medium text-text-primary">Treaty area</span>
          <select
            bind:value={draft.treatyArea}
            class="mt-1.5 w-full rounded-sm border border-rule bg-surface-warm px-4 py-3 text-sm
              focus:border-ink focus:outline-none transition-colors"
          >
            <option value={null}>Select...</option>
            {#each TREATY_AREAS as area}
              <option value={area}>{area}</option>
            {/each}
          </select>
        </label>

        <!-- Province -->
        <label class="block mb-4">
          <span class="text-sm font-medium text-text-primary">Province or territory</span>
          <select
            bind:value={draft.province}
            class="mt-1.5 w-full rounded-sm border border-rule bg-surface-warm px-4 py-3 text-sm
              focus:border-ink focus:outline-none transition-colors"
          >
            <option value={null}>Select...</option>
            {#each PROVINCES as prov}
              <option value={prov}>{prov}</option>
            {/each}
          </select>
        </label>

        <!-- Checkboxes -->
        <fieldset class="mb-5">
          <legend class="text-sm font-medium text-text-primary mb-2">About you</legend>
          <div class="space-y-2.5">
            {#each [
              { key: 'hasChildren', label: 'I have children under 18' },
              { key: 'isStudent', label: 'I am a student' },
              { key: 'isEmployed', label: 'I am employed' },
              { key: 'isElder', label: 'I am an Elder (65+)' },
              { key: 'incomeExempt', label: 'My income is Section 87 exempt' },
            ] as item}
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={draft[item.key as keyof CalendarProfile] as boolean}
                  class="w-5 h-5 rounded border-rule text-ink"
                />
                <span class="text-sm">{item.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        <!-- Band distribution months -->
        <fieldset class="mb-6">
          <legend class="text-sm font-medium text-text-primary mb-2">Band distribution months</legend>
          <p class="text-xs text-text-muted mb-3">Select the months your band typically issues distributions. Leave blank if you are not sure.</p>
          <div class="flex flex-wrap gap-2">
            {#each MONTH_NAMES as name, i}
              <button
                type="button"
                onclick={() => toggleBandMonth(i)}
                class="px-3 py-1.5 rounded-sm text-xs font-medium border transition-all duration-200 cursor-pointer
                  {draft.bandDistributionMonths.includes(i)
                    ? 'bg-ink text-ground border-ink'
                    : 'bg-white text-text-secondary border-rule hover:border-quiet'}"
              >
                {name.slice(0, 3)}
              </button>
            {/each}
          </div>
        </fieldset>

        <!-- Save -->
        <div class="flex items-center justify-between">
          {#if profileReady}
            <button
              onclick={() => showSetup = false}
              class="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>
          {:else}
            <span></span>
          {/if}
          <button
            onclick={saveSetup}
            class="px-6 py-2.5 rounded-sm text-sm font-semibold bg-ink text-ground
              hover:bg-ink/85 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            Save profile
          </button>
        </div>
      </div>
    </div>

  <!-- ═══════════════════════════════════════════════════════
       CALENDAR VIEW
       ═══════════════════════════════════════════════════════ -->
  {:else}
    <!-- Month navigation -->
    <div class="flex items-center justify-between">
      <button
        onclick={prevMonth}
        class="w-10 h-10 rounded-sm border border-rule bg-surface-card flex items-center justify-center
          hover:border-quiet active:scale-95 transition-all cursor-pointer"
        aria-label="Previous month"
      >
        <svg class="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <div class="text-center">
        <h2 class="text-lg font-semibold">{viewMonthLabel}</h2>
        {#if !isCurrentMonth}
          <button
            onclick={goToday}
            class="text-xs text-ink underline decoration-rule underline-offset-2 hover:decoration-ink transition-colors cursor-pointer"
          >
            Back to this month
          </button>
        {/if}
      </div>

      <button
        onclick={nextMonth}
        class="w-10 h-10 rounded-sm border border-rule bg-surface-card flex items-center justify-center
          hover:border-quiet active:scale-95 transition-all cursor-pointer"
        aria-label="Next month"
      >
        <svg class="w-5 h-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>

    <!-- "What's important now" banner -->
    {#if topEvent && isCurrentMonth}
      <div
        in:fade={{ duration: 300 }}
        class="rounded-sm bg-white border border-rule p-5"
      >
        <p class="text-xs font-semibold text-faint tracking-wide uppercase mb-1.5">What matters now</p>
        <h3 class="font-semibold text-lg leading-snug mb-1.5">{topEvent.title}</h3>
        <p class="text-sm text-text-secondary leading-relaxed">{topEvent.description}</p>
        {#if topEvent.actionUrl}
          <a
            href={topEvent.actionUrl}
            class="inline-block mt-3 text-sm font-medium text-ink underline decoration-rule underline-offset-2 hover:decoration-ink transition-colors"
          >
            Learn more &rarr;
          </a>
        {/if}
      </div>
    {/if}

    <!-- Event cards -->
    {#if events.length === 0}
      <div class="rounded-sm bg-surface-card border border-rule p-8 text-center">
        <p class="text-text-secondary text-sm">Nothing specific for this month based on your profile.</p>
        <p class="text-text-muted text-xs mt-1">Try browsing other months, or add a custom reminder below.</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each (isCurrentMonth ? remainingEvents : events) as event (event.id)}
          <div
            in:fly={{ y: 12, duration: 250 }}
            class="rounded-sm bg-surface-card border border-rule overflow-hidden
              {event.priority === 'high' ? 'border-l-2 border-l-ink' : ''}"
          >
            <div class="p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="inline-block px-2 py-0.5 rounded-sm text-[10px] font-semibold border border-rule text-quiet">
                      {categoryLabel[event.category]}
                    </span>
                    {#if event.day}
                      <span class="text-[10px] text-text-muted">{MONTH_NAMES[event.month].slice(0, 3)} {event.day}</span>
                    {/if}
                  </div>
                  <h4 class="font-semibold text-sm leading-snug">{event.title}</h4>
                  <p class="text-xs text-text-secondary mt-1 leading-relaxed">{event.description}</p>
                </div>
              </div>
              {#if event.actionUrl}
                <a
                  href={event.actionUrl}
                  class="inline-block mt-2.5 text-xs font-medium text-ink underline decoration-rule underline-offset-2 hover:decoration-ink transition-colors"
                >
                  Learn more &rarr;
                </a>
              {/if}
              {#if event.category === 'custom'}
                <button
                  onclick={() => {
                    const idx = profile.customReminders.findIndex(
                      (r) => r.label === event.title && r.month === event.month
                    );
                    if (idx >= 0) removeReminder(idx);
                  }}
                  class="inline-block mt-2 text-xs text-text-muted hover:text-ink transition-colors cursor-pointer"
                >
                  Remove reminder
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Custom reminder -->
    <div class="pt-2">
      {#if showReminderForm}
        <div in:fly={{ y: 12, duration: 250 }} class="rounded-sm bg-surface-card border border-rule p-4 space-y-3">
          <h4 class="text-sm font-semibold">Add a custom reminder</h4>
          <input
            type="text"
            bind:value={newReminderLabel}
            placeholder="What do you want to remember?"
            class="w-full rounded-sm border border-rule bg-surface-warm px-4 py-3 text-sm
              placeholder:text-faint focus:border-ink
              focus:outline-none transition-colors"
          />
          <div class="flex gap-2">
            <select
              bind:value={newReminderMonth}
              class="flex-1 rounded-sm border border-rule bg-surface-warm px-3 py-2.5 text-sm
                focus:border-ink focus:outline-none transition-colors"
            >
              {#each MONTH_NAMES as name, i}
                <option value={i}>{name}</option>
              {/each}
            </select>
            <input
              type="number"
              bind:value={newReminderDay}
              placeholder="Day"
              min="1"
              max="31"
              class="w-20 rounded-sm border border-rule bg-surface-warm px-3 py-2.5 text-sm text-center
                placeholder:text-faint focus:border-ink
                focus:outline-none transition-colors"
            />
          </div>
          <div class="flex items-center justify-between pt-1">
            <button
              onclick={() => showReminderForm = false}
              class="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onclick={addReminder}
              disabled={!newReminderLabel.trim()}
              class="px-4 py-2 rounded-sm text-sm font-semibold transition-all duration-200 cursor-pointer
                {newReminderLabel.trim()
                  ? 'bg-ink text-ground hover:bg-ink/85 active:scale-95'
                  : 'bg-rule text-faint cursor-not-allowed'}"
            >
              Add reminder
            </button>
          </div>
        </div>
      {:else}
        <button
          onclick={() => showReminderForm = true}
          class="w-full flex items-center justify-center gap-2 rounded-sm border border-dashed border-rule
            bg-surface-warm py-3.5 text-sm text-text-muted hover:text-text-secondary hover:border-quiet
            transition-all cursor-pointer"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add a custom reminder
        </button>
      {/if}
    </div>

    <!-- Edit profile link -->
    <div class="text-center pt-1">
      <button
        onclick={openSetup}
        class="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
      >
        Edit your profile
      </button>
    </div>
  {/if}
</div>
