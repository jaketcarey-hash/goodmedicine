# Strong Fire — System Audit

**Date:** 26 August 2026
**Scope:** the whole site — what exists, what is wired to what, what is missing.
**Not this document:** `REVIEW.md` is the *content* audit (figures against primary
sources, and the list of things not to re-flag). It is still current as of
4 August and is not superseded here.

---

## What there is

| | |
|---|---|
| Pages built | 528 · 532 sitemap URLs · 530 indexed for search |
| Tools on the front door | 17 (`src/lib/directory.ts`) |
| Source | 34,525 lines · 40 lib modules · 48 Svelte components · 11 Astro components |
| Build gates | 3 (figures, provenance, benefit dates) |
| Tests | 6 suites, 84 assertions |
| Figures under review windows | 28 |
| Claims registers | 6 subjects, 49 claims |
| Nations editions | 24 |
| localStorage keys | 16 |

Branches: money 17 pages, rights 11, path 8, self 5, nations 11, tools 5,
root 12.

---

## THE URGENT ONE — the forecast goes wrong on its own, in six weeks

**`check-benefit-dates.js` fires eight weeks too late by construction.**

The gate compares each series' `reviewBy` against *today*. The forecast walks
*today + 56 days*. So the build says "all schedules current" for the entire
eight-week window in which the forecast is already reading past the end of the
data. Every series has `reviewBy: 2026-12-31`; the forecast starts running off
the end of three of them in early November, and off CGEB on **6 October 2026**.

**What happens is silent, and it is wrong in the pessimistic direction.** In
`forecast.ts`, a matched benefit series with no dates left in the window pushes
no events and `continue`s — so the item lands in neither `events` nor
`unplaced`. It does not degrade. It vanishes, and nothing on any surface can
report that it did.

Run against the real engine with CGEB $679/month entered:

| Forecast run on | CGEB events | In `unplaced` | Closing balance | Tight week |
|---|---|---|---|---|
| 15 Sep 2026 | 1 | 0 | −$21 | Sep 28 |
| 10 Oct 2026 | 1 | 0 | $579 | none |
| **10 Nov 2026** | **0** | **0** | **−$700** | **Nov 30** |

The balance is $679 too low — exactly one lost payment — and the forecast
**invents a tight week that does not exist**. M11 promotes precisely that claim
to the top of `/money/plan`'s "what to do next". The newest feature is the one
that carries the error furthest.

Three things to fix, in order:

1. **Move the gate ahead of the reader.** `check-benefit-dates.js` should fail
   when `reviewBy` — or the last date in the series — falls inside
   `today + FORECAST_WEEKS`, not when it falls behind today. The horizon the
   forecast reads is the horizon the gate must guard.
2. **Make the vanishing loud.** A matched series with no remaining dates
   belongs in `unplaced` with a new reason (`schedule-ended`), so the surface
   can say "we do not have CGEB dates past 5 October" instead of quietly
   dropping her income.
3. **Fetch the 2027 schedules.** CGEB has one future date left. This needs a
   browser — canada.ca blocks curl.

Until (1) and (2) exist, this recurs every December.

---

## Gaps

**Two tools are still islands.** `DistributionPlanner` writes
`DISTRIBUTION_PLAN`, read only by the export tool. `SettlementSimulator`
persists nothing at all and reads nothing. Both are M15 in
`~/.claude/plans/strongfire-one-system.md`. `CompoundingExplorer`,
`Section87Checker` and `TaxEstimator` also read no cross-tool state, though
Section 87's *result* is read by five other places, so only its input is
isolated.

**Two modules compute money and have no tests.** `tax-estimator.ts` (175 lines,
5 exported functions) works out what someone owes or gets back; `settlement-math.ts`
(160 lines) models settlement scenarios. Forecast, debt, entitlements and the
money picture all have suites. These two do not, and they are the same kind of
arithmetic. `savings-store.ts`'s `projectGoal` is a third, smaller case.

**Two orphaned components.** `BranchCard.svelte` and `LedgerStrip.astro` are
referenced nowhere. Delete or wire — this repo's own rule is that a day-old
orphan gets removed rather than kept.

**26 of 49 claims still need a practitioner**, across six registers. All six
review packs in `docs/review/` are built and **unsent**. This is the only thing
standing between the site and its first pre-launch gate, and it is not code.

**Three OAS/GIS figures expire 31 October 2026** — the earliest review window on
the board, nine weeks out. That gate does fire correctly.

**The pre-launch gates are all still open**, with the site public and indexable
since 20 August: logo from an Indigenous artist, legal review of the disclaimer,
Section 87 reviewed by a tax professional. The Section 87 page carries a callout
admitting the last one.

**Sitemap not submitted** to Google Search Console (532 URLs). Manual.

---

## Efficiencies

**`money-picture.ts` now walks the forecast on every call**, and the forecast is
the most expensive thing it does. Four tools call `getMoneyPicture()` on mount.
Each call is one walk, which is fine — but `MoneyPlan` used to call it twice per
render and that was fixed in M11. Worth a `$derived` cache if a fifth consumer
lands.

**The three build checks share a shape** — read a JSON registry, verify required
fields, compare a `reviewBy` against today, fail with a fetch instruction. Three
files, ~90% the same. One parameterised gate would make the horizon fix above a
one-line change instead of a three-file change.

**`DataManager.svelte` knows all 16 storage keys by hand.** It is the only
consumer of several. Every new store means remembering to add it there, and
`DISTRIBUTION_PLAN` is currently the only thing keeping that tool's data
exportable at all. A key registry that carries its own export metadata would
close that gap permanently.

**Two households, still.** M12 resolved the disagreement by overlay, but
`CalendarProfile` and `Household` remain two shapes for one subject. The open
question — absorb the profile, or keep it as the calendar's own view — is
unanswered and is the last structural duplication on the money side.

---

## What is healthy

The provenance spine holds: 3 build gates, 28 figures with review windows, 49
registered claims, and no figure hardcoded in a page. The honesty rules in
`DECISIONS.md` have survived five milestones without being relaxed. Every money
tool now reads at least one thing it did not ask for, except the three named
above. The service-worker cache bug that made ten deploys reach nobody is fixed
and the cause is recorded.
