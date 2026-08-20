# DIY planning software — ARC COMPLETE (M6–M10)

Plan: `~/.claude/plans/dapper-snacking-sparrow.md`. The whole arc shipped
20 August: M6 `6495421`, M7 `15aacd1`, M8 `bb8aa78`, M9 `7daa8b2`, M10 this
commit. M7–M9 are deployed; M10 deploys with this one.

## What the arc set out to do, and whether it did it

Jake's verdict going in was that the money tools were "calculators with
titles." The test of the arc is the plan's own closing line — that a person
can *anchor their real month, see the tight week coming, learn what interest
and compounding actually do to their own numbers, set a distribution plan in
motion with one tap, and print the whole picture.*

All five are now true, with one deliberate change: "set a distribution plan
in motion" became *compute and show* for debt, because the write would have
been a lie. See M9 in DECISIONS.

## M10

- `/money/plan` is four chapters, each led by its visual.
- `CashFlowForecast` gained `compact` — one implementation, two surfaces.
- `projectGoal()` moved into `savings-store`; the pace chart and the plan
  document cannot disagree about a date.
- Chapter 3 is new: cushion in **months** rather than dollars, and what
  filing opens (registry maximums, hedged in the same breath).
- `@media print` in `global.css` + "Print this plan".

## The thing to know before touching the charts

Every chart survives black and white because identity is texture and dash,
never a second hue. That was an M8 call for colour-blind readers; print
depends on it now too. **Introducing a colour-coded series breaks the print
view silently.** `print-color-adjust: exact` is load-bearing — without it
Chrome drops every fill and the charts print as empty outlines.

## Next — no milestone is queued. Candidates, in rough order:

1. **Ship the pre-launch gates in ROADMAP.md.** The site is still
   `INDEXABLE = false`. Logo from an Indigenous artist, disclaimer legal
   review, and a tax professional on the exemption content are the three
   that actually block a public launch. Everything built in this arc is
   invisible to search until that flips.
2. **Community validation.** ROADMAP asks for 3–5 reviewers — someone on
   reserve, someone under 25, someone over 55. The money side has changed
   enormously since Elsa's March round.
3. **A lump-sum field in the Debt Planner itself.** `calculatePayoff()` now
   takes a one-time payment and only the Distribution Planner uses it. The
   planner should let someone ask "what does $2,000 today do?" directly.
4. **Carry Cards** (ROADMAP Tier 1) remain the highest-value unbuilt idea
   for retention, and are unrelated to this arc.

## Watch out

- `window.print()` opens a modal that **blocks the browser extension**. To
  inspect print rendering, lift the `@media print` rules into an
  unconditional `<style>` and screenshot that.
- `bind:value` on `<input type="number">` yields a number, not a string.
  Calling a string method on it throws every keystroke while the build stays
  green (M9).
- Service worker + HMR shows mutually exclusive branches at once. Unregister
  and hard reload before debugging (M7).
- `client:visible` islands never hydrate in the screenshot pane; check the
  `ssr` attribute on `<astro-island>` before assuming a logic bug (M9).
- The Nations weekday automation commits to main. Pull before starting.
