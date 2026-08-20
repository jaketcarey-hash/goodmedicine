# DIY planning software — M9 complete, M10 (the plan document) next

Plan: `~/.claude/plans/dapper-snacking-sparrow.md`. M7 `15aacd1`, M8 `bb8aa78`,
M9 is this session.

## Done — M9

- **`credit_utilization_guideline`** registered (30%, FCAC, fetched live
  20 Aug). The credit article had "30%" typed into two places — a breach of
  the no-hardcoded-figures rule. Both now read the registry.
- **`UtilizationGauge.svelte`** on /money/credit. Utilization only, never a
  score estimate; nothing stored.
- **`CompoundingExplorer.svelte`** on /money/investing. Two sliders, the
  registry rate, contributed vs hatched growth. The article now names the
  parallel: it is the debt chart pointing the other way.
- **The action layer.** `calculatePayoff()` gained an optional one-time
  payment; `SegmentAction.svelte` shows what a distribution does to the debt
  plan without writing to it, and creates savings goals (at zero) with a
  visible confirmation. `/money/plan`'s cushion step gained the same tap,
  target = one month of the person's own recorded expenses.
- 8 new debt-engine tests; the 16 forecast tests still pass. Four gates
  green, 27 figures, 520 pages.

## The rule M9 established — do not relax it

**Never record money that has not moved.** The planner is usually opened
before the cheque clears. Creating a goal is safe; recording a deposit is
not, and it would corrupt M8's pace projection, which reads real dated
deposits. Where a write would be dishonest, compute and show instead.

## Next — M10: the plan document

Follow the plan's M10 section:

1. `/money/plan` becomes chapters, each led by its visual — *Where you
   stand* (net worth + the forecast strip from M7), *Where you're headed*
   (goals + the pace line from M8), *What protects you* (cushion months;
   benefits quantified from registry figures + household profile), *What to
   do next* (the action-capable steps).
2. **Print stylesheet** — "Print your plan" renders a clean paper document.
   The browser makes the PDF; no new dependencies. Charts must survive it,
   which is why every one of them is solid-and-hatched rather than coloured.
3. Final validate-indigenous pass, then deploy via `vercel deploy --prod`
   (Jake's call — M7, M8 and M9 are all committed but unshipped).

## Watch out

- **`bind:value` on `<input type="number">` gives you a number, not a
  string.** Calling `.trim()` on it throws on every keystroke, the island
  renders its empty state forever, and *the build stays green*. Only the
  browser console shows it. This cost time in M9.
- Service worker + HMR will show two mutually exclusive branches at once.
  Unregister, clear caches, hard reload before debugging.
- `client:visible` islands never hydrate in the screenshot pane (the
  IntersectionObserver does not fire), so an un-hydrated island looks like a
  logic bug. Check for the `ssr` attribute on `<astro-island>` first.
- The pane ignores `scrollTo`; replace `document.body.innerHTML` with the
  isolated figure's `outerHTML` to see below-fold content. It will not
  resize below ~745px outer — constrain the element itself, not an ancestor,
  or the measurement silently does nothing.
- At 375px a 720×220 viewBox renders ~101px tall. Squat but readable for a
  monotone curve. If M10's print view needs more, change `VIEW` in chart.ts
  once rather than per component.
- The Nations weekday automation commits to main. Pull before starting.
