# Money spine — M1 complete, M2 next

**Goal:** the approved five-milestone build in
`~/.claude/plans/dapper-snacking-sparrow.md` — depth on the five /money pages plus
the planning spine. Read that plan first; it holds the architecture, the forks
already settled with Jake (WelcomeFlow deleted; full arc approved), and the
constraints (education-not-advice per situations.ts; no score; registry rule:
sourced facts only, illustrations stay prose).

## Done — M1 (commit 17583ee)

- `src/lib/money-picture.ts` — the read layer. `getMoneyPicture()` (nullable
  everywhere, absence stated) + `suggestNextSteps()` (9 hand-written rules, each
  `why` names its datum). Smoke-tested in Node (esbuild bundle + localStorage shim,
  three scenarios) and correct. No consumer yet — M4 is UI-only by design.
- Restore-on-mount: BenefitsFinder (was a no-op effect) and DistributionPlanner
  (was write-only) restore inputs and recompute results, dated "start fresh" line
  in the apparatus voice. TaxEstimator pre-selects the s.87 toggle from the
  checker's verdict; grey-zone pre-selects nothing. All three verified in the
  browser with seeded state; start-fresh reset verified.
- WelcomeFlow.svelte deleted + its two keys removed from storage-keys.ts;
  ROADMAP.md line corrected. CheckInFlow's /self/financial-stress → /self/stress.
- DECISIONS.md: M1 entry (read-layer convention, restore-on-mount standard,
  WelcomeFlow rationale). CLAUDE.md: earth-ramps line updated (gone, not legacy),
  money-picture rule added.

## Next — M2: depth on credit + debt (browser session)

1. Fetch live (canada.ca blocks curl — use the Browser pane): FCAC credit-report
   pages, OSB consumer-proposal pages, Equifax + TransUnion Canada free-report
   routes, Consumer Protection BC collection rules, the federal payday cost cap.
2. New figures in `src/data/figures/2026.json` (score range, factor weights,
   utilisation guideline, 6-year purge, proposal ceiling, payday cap) — each with
   source/verifiedOn/reviewBy; body numbers in credit.astro + debt.astro switch to
   `figure()`.
3. Answer + strip props per the plan's table; `checked` = the fetch day.
4. In-body links to Debt Planner / relevant tools at the moment of relevance.
5. Verify: both build gates pass; look at both pages at 375/768/1440.

## Watch out

- The scrolled-screenshot artifact: hidden Browser pane composites garbage on
  scrolled captures — verify below-fold styling via javascript_tool computed
  styles, not pixels.
- DECISIONS.md's "Open questions" heading was accidentally consumed by an earlier
  edit and has been restored — check tail structure before appending.
- Session limits killed subagents twice on 5–6 Aug; if fanning out, keep batches
  resumable and verify per-file completion with grep, not trust.
