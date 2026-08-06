# Money spine — M1–M3 complete, M4 next

Plan: `~/.claude/plans/dapper-snacking-sparrow.md`. Read it first — architecture,
settled forks, constraints. Commits: `17583ee` (M1), `d0b3274` (M2), `2ccf3df` (M3).

## Where it stands

The depth strand is closed. 14 of 24 article pages carry sourced, in-date strips
(all six /rights, five /money — banking, taxes, saving, credit, debt, investing —
plus raising-family and supporting-elders). Budgeting and seven-generations are
strip-free by design. 26 registry figures, all inside their review windows. One
return assumption (`assumed_balanced_return`, 5%, FP Canada 2026 PAG) feeds every
projection: investing + seven-generations compute outcomes in frontmatter,
DistributionPlanner reads it, SettlementSimulator defaults to it. All five
article↔tool pairs are cross-linked both ways. The read layer
(`src/lib/money-picture.ts`) is built, tested, and has no consumer yet — by design.

## Next — M4: the /money/plan surface

Follow the plan's M4 section exactly. Critical process requirements:
1. **Load `/frontend-design` before writing any markup**, `/dataviz` before the
   net-worth sparkline. Two-pass design rule — pass one is presumed templated;
   do not ship it.
2. New key `MONEY_PLAN: 'gm_money_plan'` in storage-keys.ts (auto-covered by
   DataManager backup). Shape: `{ vision, intentions: [{id, label,
   savingsGoalId?}], createdAt, updatedAt }`. Everything else derived-only via
   `getMoneyPicture()` / `suggestNextSteps()`.
3. Braiding sequence with citation (Prosper Canada / AFOA / Simon Brascoupé,
   2025) in Strong Fire's own voice; also add the bundle to resources.astro.
4. LifeSimulator gets exactly one change: income default from
   `getMonthlyIncome(getCurrentBudget())` — note getCurrentBudget WRITES; for a
   pre-fill inside the tool that's acceptable (the user is there to enter data),
   or read via the money-picture pattern to stay pure.
5. Verify: 375/768/1440; fresh-profile empty state states absences (never
   zeros); DataManager export includes the new key; suggestNextSteps copy
   reviewed against situations.ts before commit.

Then M5 (literacy: re-host MarkComplete via Article prop, link /learn, interleave
tools into paths, knowledgeChecks stays reserved).

## Watch out

- Scrolled screenshots in the hidden Browser pane composite garbage — verify
  below-fold work via javascript_tool computed styles/DOM geometry.
- validate-indigenous applies to any community-facing copy the plan surface
  carries ("windfall" for distribution money is banned; four instances were
  caught and fixed in M3).
- Tree is committed through M3 but not pushed; strongfire.ca deploys only via
  `vercel deploy --prod`.
