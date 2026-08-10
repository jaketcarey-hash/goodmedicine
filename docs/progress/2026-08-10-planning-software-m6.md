# DIY planning software — M6 complete, M7 (the forecast) next

Plan: `~/.claude/plans/dapper-snacking-sparrow.md` (the DIY-planning-software
arc; the money-spine arc before it shipped as `17583ee`…`92c9de3`). M6 landed
as `6495421`.

## Done — M6: dates and the payment rails

- `src/lib/dates.ts` — occurrence walking that preserves biweekly phase,
  month-end clamping, Monday-week bucketing, en-CA labels. Irregular income
  yields no occurrences, deliberately. Eleven Node tests pass (scratchpad
  pattern: esbuild bundle + shim), including the fall DST boundary. The two
  duplicated calendar-store day-walk loops now use it.
- `src/data/benefit-dates/2026.json` — CCB, CGEB, OAS/GIS, CPP payment dates
  fetched live from canada.ca 10 Aug. **Canada Carbon Rebate is closed** (2025
  dates only on the page) and is deliberately absent. CGEB carries July 3 +
  Oct 5 only; Jan/Apr were paid under the closed GST/HST-credit name.
- Third build gate: `scripts/check-benefit-dates.js` (mirrors check-figures),
  wired before astro, watched failing (exit 1) on a stale reviewBy, restored.
  All reviewBy = 2026-12-31 — the build will force fetching the 2027 schedule
  in December. That is intended behaviour, not a bug.
- Budget items: optional `anchorDate` (ISO) on IncomeItem/ExpenseItem,
  backward-compatible; BudgetTool add-forms carry a date field ("lets the
  forecast place it on real days"). Verified in the browser.

## Next — M7: the cash-flow forecast (the flagship)

Follow the plan's M7 section. Process requirements, in order:
1. Load `/frontend-design` AND `/dataviz` BEFORE any markup or chart code.
   Two-pass design; do not ship pass one.
2. `src/lib/forecast.ts` pure engine: inputs = anchored budget items
   (occurrencesBetween), benefit-date series filtered by household profile +
   BenefitsFinder answers (shapes in money-picture.ts), band-distribution
   months as a shaded month-band (never a fake day spike), optional start
   balance. Output: dated events → Monday-week buckets → running balance →
   tight-week detection.
3. Component + `/money/forecast` page: 8-week strip, house vocabulary
   (height bars + direct labels, WellnessHistory is the height-mark
   precedent; dip week in unsettled amber with its text label), weeks expand
   to dated events each with provenance ("CCB — payment date published by
   CRA"). Honest empty state: explain what one anchored month unlocks.
4. Wire entry points: money index tools grid + first chapter of /money/plan.
5. Seeded scenarios: empty / steady biweekly / seasonal / shortfall, at
   375/768/1440. DECISIONS entry: the chart-vocabulary extension (why the
   forecast strip and later curves extend StageDistribution's documented
   direct-label call rather than break it).

## Watch out

- Engine test pattern: esbuild bundle + localStorage shim (see
  scratchpad/mp-test.mjs and dates-test.mjs from this session's scratchpad —
  rebuild them fresh if the scratchpad is gone).
- Scrolled screenshots in the hidden pane composite garbage; verify below
  the fold via javascript_tool DOM probes.
- gm_budgets seeded test data may linger in the dev browser's localStorage —
  clear before empty-state checks.
- The Nations weekly publish automation commits to main (d6e128e was Friday's)
  — pull before starting.
