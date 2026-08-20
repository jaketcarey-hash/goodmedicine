# DIY planning software — M8 complete, M9 next

Plan: `~/.claude/plans/dapper-snacking-sparrow.md`. M7 landed earlier today
as `15aacd1`; M8 is this session.

## Done — M8: explain layers, wave 1

- **`src/lib/chart.ts`** — the plotting primitive. Marks in SVG, words in
  HTML; identity from texture and dash, never a second hue; normalised
  coordinates with the maximum passed in so two series share one scale.
  Read its header before writing any new chart.
- **Debt planner** — `DebtPayoffCurve.svelte`. Two figures: the balance
  curves (both strategies, solid vs dashed, gap = months saved) and the
  cumulative split (principal in `rule`, interest hatched).
- **Tax estimator** — `TaxSplit.svelte`. Where each dollar goes, plus the
  same income with none of it exempt. The difference between the two bars
  is the exemption. Removed a misuse of `verified` green for take-home.
- **Savings tracker** — `SavingsPace.svelte`. Actual dated deposits, then
  her own rate projected to the target: "at your pace, March 2027." Two
  deposits minimum.
- **Bug fixed:** the planner promised "Debt-free by January 2076" to anyone
  whose minimums do not cover their interest — the 600-month cap read as a
  payoff date. Banner and curve now both say the balance never gets there.

Build green, four gates, 520 pages. Verified at 375 and 768.

## Next — M9: explain layers wave 2 + the action layer

Follow the plan's M9 section:

1. **Investing article** — interactive compounding explorer on
   `assumed_balanced_return` from the registry. Drag years/amount, show the
   contributed vs growth split. `chart.ts` already has what this needs.
2. **Credit article** — utilization gauge against the 30% guideline.
3. **The action layer** — Distribution Planner gains "set this plan in
   motion": one confirmed tap creates the savings goal and sets the extra
   debt payment, each with a provenance line. Always a visible
   confirmation; never a silent write into another store. `/money/plan`'s
   suggested steps gain the same where non-destructive.

Then M10: the plan document in chapters + the print stylesheet.

## Watch out

- **Service worker + HMR will show you two mutually exclusive branches at
  once** after editing a Svelte island. Unregister, clear caches, hard
  reload before debugging. Cost time in M7.
- The screenshot pane ignores `scrollTo`. Replace `document.body.innerHTML`
  with the isolated figure's `outerHTML` to see anything below the fold.
- The pane will not resize below ~745px outer. Constrain the container and
  measure with DOM probes; that is how both the label overflow and the
  missing headroom were caught, and neither was visible at desktop width.
- When seeding a debt scenario to demo avalanche vs snowball, make sure the
  smallest balance is **not** also the highest rate — otherwise both
  strategies target the same debt and the curves are correctly identical.
- The Nations weekday automation commits to main. Pull before starting.
