# DIY planning software — M7 complete, M8 (explain layers) next

Plan: `~/.claude/plans/dapper-snacking-sparrow.md`. M6 landed as `6495421`;
M7 is this session. Jake's steer, 20 August: build out the full planning
platform, **and treat budgeting as a first-class pillar** — so the actuals
layer was folded into M7's data model rather than deferred.

## Done — M7: the cash-flow forecast, plus the record layer

- `src/lib/forecast.ts` — the pure engine. Eight Monday-to-Sunday weeks,
  dated events, running balance, tight-week detection. Four honesty rules
  documented at the head of the file and in DECISIONS; **do not relax them
  to make the tool look smarter**.
- `src/components/CashFlowForecast.svelte` + `/money/forecast` — the strip
  (zero line drawn once in ink, bars hanging below it, `unsettled` + the
  word "short" on a tight week), week-by-week `<details>` rows expanding to
  dated events with provenance, and a "What this forecast cannot see"
  section listing unplaced items, unentered benefit series, and record
  corrections.
- **The record layer.** `BudgetEntry.actuals?: ActualItem[]` + a "What
  actually happened" section in BudgetTool. Complete recorded months correct
  the plan per expense category; the month in progress never does, and a gap
  under 10% is ignored. `copyBudgetToMonth` does not carry actuals forward.
- Entry point on the money index tools grid, above Budget Snapshot; a
  "See the next eight weeks" link from the record section.
- 16 engine tests (esbuild bundle + localStorage shim, scratchpad pattern).
  All four build gates green: figures, provenance, benefit-dates, plus
  search/seo/sw.

## Next — M8: explain layers, wave 1

Follow the plan's M8 section. The data already exists in all three cases:

1. **Debt Planner** — `calculatePayoff()` already returns full `PayoffMonth[]`
   and the component renders only the last row. Plot it: balance curve with
   interest shaded against principal, avalanche vs snowball as twin curves,
   the gap labelled in dollars. **This is where SVG earns its place** — a
   monthly amortization is a continuum, unlike the forecast's week buckets.
   Record the call in DECISIONS when the first curve ships.
2. **Tax Estimator** — one labelled bar per dollar destination (net /
   federal / provincial / CPP / EI); the exemption effect as two bars whose
   difference is the story.
3. **Savings Tracker** — per-goal actual-deposit trajectory against the pace
   line that reaches the target ("at your pace, March").

Load `/dataviz` and `/frontend-design` before any chart code; two-pass, do
not ship pass one.

## Watch out

- **The service worker plus HMR will lie to you.** After editing a Svelte
  island in dev, the page can show two mutually exclusive branches at once.
  Unregister the SW, clear caches, hard-reload *before* debugging. This cost
  time this session.
- The screenshot pane ignores `scrollTo`/`scrollIntoView` and composites
  garbage below the fold. What works: hide `header`/`nav`, or replace
  `document.body.innerHTML` with the isolated section's `outerHTML`. Verify
  measurements with DOM probes, not screenshots.
- The pane will not resize below ~745px outer, so a true 375 viewport is not
  reachable. Constrain the container width and measure the grid instead —
  the forecast strip has no breakpoint variants, so that is a valid check.
- `/dataviz`'s validator FAILs `ink` on the categorical lightness/chroma
  checks. That is correct and irrelevant — this site is neutral + status,
  not categorical. Do not "fix" it by introducing a hue; the earth ramps
  were retired 6 August.
- The Nations weekday automation commits to main. Pull before starting.
