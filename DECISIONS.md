# Decisions

Append-only. Every non-obvious call, what else was considered, and why it lost.
Newest at the bottom. If a line explains *why the code is the way it is*, it belongs
here; if it stops someone doing the wrong thing right now, it belongs in `CLAUDE.md`.

---

## 2026-08-04 — The rebuild

### Scope: personal corpus only

Strong Fire carries the community articles, the tools, the Nations brief and the event
ledger. The IWKB library stays on the RBC advisor site under its compliance waves, and
nothing from `~/work-toolkit/` crosses over.

*Considered:* publishing the IWKB articles here, attributed or unattributed. Lost because
it collapses the personal/work firewall and puts material into a compliance pipeline it
was not cleared for.

*Exception:* the BC First Nations directory data. It is Indigenous Services Canada open
data that happens to have been compiled in `work-toolkit`; the data is public, the
compilation script stays where it is. Worth revisiting if the site should own its own
derivation.

### Two shells, chosen by CSS, not JavaScript

Below 768px the phone app is untouched — bottom nav, single column, offline. Above it, a
masthead. Both are always in the markup.

*Considered:* detecting the breakpoint in JS and rendering one. Lost because it flashes
the wrong shell on first paint and fights the service worker on repeat visits.

### The brief pipeline emits data; Astro renders it

`export_to_strongfire.py` used to render HTML into `public/nations/`, in a different
typeface and palette, unlinked from the rest of the site and destroyed on every run. It
now writes JSON to `src/data/nations/`.

*Constraint that survived:* `/nations/archive/YYYY-MM-DD` is unchanged. The Codex weekday
automation 200-checks it and anything already shared points at it.

### The figure registry is the control, not REVIEW.md

Twenty-one rates and benefit amounts live in `src/data/figures/2026.json` with source,
verification date and review date. Pages and calculators read the same key. `npm run
build` fails on anything past `reviewBy`.

*Why:* `taxes.astro` and the Benefits Finder had been quoting different CCB figures for
months. A monthly audit document had flagged staleness three cycles running and nothing
happened. A document that asks someone to act is not a control; a build that will not
complete is.

*Corollary:* two of the three items that audit called CRITICAL were false positives — it
derived "expected" values by indexing last year's numbers and reported the difference as
an error. Do not re-flag the 14% first bracket, the bracket ceilings, the 1.63% EI rate,
or the 50% capital gains inclusion rate. All verified against primary sources 2026-08-04.

### No summed total on the ledger

*Considered:* a headline "$X billion disclosed" stat. It computed to $129.8bn, of which
$100bn was a single record whose own qualifier says it is not project cost or Indigenous
equity. The figures measure incommensurable things — a purchase price, a guarantee's
capacity, ten years of grant funding. Every amount now travels with its qualifier and
there is deliberately no `totalDisclosed()`.

### The stage chart is one hue, one series

*Considered:* a categorical palette per stage band. The `/dataviz` validator failed it
badly — forest green and berry rose were 3.5 ΔE apart under deuteranopia, and the muted
earth tones read as grey. The comparison is a magnitude, not an identity, so one colour
and direct labels is both correct and accessible. Colour chips in the list rows always
carry their text label.

### The Record has no serif and no cream

*Was:* cream ground (`#fffdf8`), Newsreader text serif, terracotta accent — built from the
brief's own existing palette. *Now:* the same white as every other card, the site's own
sans faces, cedar demoted from editorial accent to a colour that carries meaning.

Two reasons, and the second is the load-bearing one.

The surface was the first AI-design tell `BUILD-PLAYBOOK.md` names, near exactly, with
broadsheet rules from the third. That alone justified a look. But the deeper problem was
not that it was a default. **A text serif is publication apparatus in typographic form,
and this site is explicitly not a publication.** The strongest possible signal that it was
one had been kept. Every previous session that drifted toward feeds, citation formats and
a second editorial identity was reading a cue the design itself was giving them.

So the fix was subtraction, not a new palette. One design system, one property.

*The boldness spends in one place instead:* the stage rail. It encodes the single fact
that separates this record from news — an announcement and a completed transaction read
identically in a headline and are not the same event. Three steps filled to the point
reached; contested **breaks** the line rather than extending it, because a court case is
not progress toward completion. It appears on every record and in the list, where the
comparison actually happens: you can scan the year and see how much is talk and how much
is money that moved.

Checked at 375, 768 and 1440. No horizontal scroll at any width.

### Search is built from rendered HTML

`scripts/build-search-index.js` walks `dist/`. Content lives in four shapes — Astro pages,
a TypeScript glossary array, brief JSON, the ledger — and indexing each at source would
mean four extractors that drift.

*Consequence, deliberate:* the 27 articles were **not** migrated to content collections.
The migration was the means; search was the prize. This gets the prize without touching
7,700 lines of working code.

*Cost accepted:* the index is ~455 KB and precached. Large for a slow connection, but it
buys offline search over 500+ pages. Revisit if it keeps growing.

### Ledger promotion proposes; a human decides

`promote_to_ledger.py` derives candidates from brief items and fills what is derivable. It
never assigns `stage` or `confidence`, and `--apply` refuses to merge until a human has.

*Why:* those two fields are the ledger's credibility. "Financial close" versus "MOU" is
money moved versus a press release. A script that guessed would produce something that
looks authoritative and is not.

### Nation matching is strict and one-directional

A ledger entity may be the *longer* name ("Ashcroft" matches "Ashcroft Indian Band"). The
reverse is banned.

*Why both rules exist:* a first pass normalised "Nation" and "Band" away, which left some
entities as an empty string — and every name contains an empty string, so it attributed
records to 198 of 201 Nations. A second pass put Nisga'a Nation records on each of the
four Nisga'a Villages. A Nation and its communities are related, not interchangeable.

*Accepted consequence:* Nation-level records now attach to no BC page where the Nation is
not itself a band. Stated on `/nations/bc` rather than papered over.

### Slugs fold non-decomposable letters explicitly

`ł`, `đ`, `ø`, `ƛ`, `ʔ` are distinct letters, not base-plus-accent, so Unicode NFD leaves
them and a naïve regex turns them into hyphens. Gitxaała became `gitxaa-a-nation`. On a
site whose standard is naming Nations as they name themselves, that is not cosmetic.
Display names are never folded.

### Cross-links are a hand-written term map

*Considered:* keyword similarity between Record material and articles. Lost because it
produces confident nonsense — a record mentioning "trust" pulls up an article about
trusting your bank. The map fires on ~43% of records. A missing link is a far smaller
failure than a misleading one.

### The home page is not the entry point

Someone mid-worry lands on the page that answers her question, from a search result or a
text. The home page serves someone who typed the address, came back, or is looking around.

*Considered and reverted:* a home page led by eight questions in her words. It was a menu
with relabelled items, and it was aimed at someone who was not there. The questions moved
to the branch indexes, where the reader is already in the right frame.

*Current shape:* news down one side, a directory down the other. A one-stop shop only
works if you can see what is in the shop.

### `/what-applies` carries the public law, not the practice routing

The advisor-side `situation-flowcharts.html` sorts branches into "I run this" / "refer,
then coordinate" — first person, about a service. That belongs nowhere on a site whose
footer says it is not connected to any bank or firm.

What crossed over is the public law underneath: the connecting-factors test, CRA
guidelines, programme rules. The lanes here are what usually decides it, what is settled,
what genuinely is not, and which *kind* of professional answers the rest. Never a named
one.

### Not indexed yet

`INDEXABLE = false` in `scripts/build-seo.js`, plus a `noindex` meta tag in `Shell.astro`.
Both flip together, then submit the sitemap.

*Why:* it is being shared by hand while it is built out. A half-finished page that gets
indexed is hard to un-index, and the snippet cached today is the one shown for months.
Open Graph tags are deliberately unaffected — they fire on a link in a message, not a
crawl.

### `.plain` exists because of a cascade-layer trap

`<style is:global>` in `Record.astro` is unlayered, and unlayered CSS beats layered CSS
whatever the source order. It silently overrode Tailwind utilities three separate times —
`font-record` on every heading, `no-underline` on record links, then the whole headline
treatment. Base element styles now sit in `@layer base`, and `.plain` is the documented
escape hatch. Do not fight it with `!` utilities; they lose.

---

## 2026-08-05 — Direction B: show your work

The redesign session the 5 August brief was written for. Direction B chosen per the
brief's own recommendation; A's answer line carried into the deep pages; C not blended
in. Built end-to-end on `/nations/ledger/YTD26-010`, then `/nations`, then
`/rights/nihb`; checked at 375, 768 and 1440; production build green.

### One family, three voices

IBM Plex Sans reads and heads; IBM Plex Mono is the apparatus. The brief asked for
three faces with a load-bearing monospace; this delivers the three voices from one
family instead of three families. Deliberate guard, not economy: every previous drift
toward "publication" started with a second typographic identity, and an apparatus that
shares the site's own family cannot become one. Inter and Outfit are gone site-wide.

*The rule that matters:* mono speaks only provenance — dates, figures, sources,
confidence, stages, record ids. Content never sets in mono; prose never carries
provenance. The `apparatus` / `apparatus-label` utilities in `global.css` are that rule
in code.

### The status palette was validated, not eyeballed

Ground `#FAFAF8`, ink `#1A1A1A`, rule `#DEDEDA`, and exactly three meanings: verified
green `#17654A`, unsettled amber `#8A5A00`, contested red-violet `#7E2C73`. All text
tones ≥4.5:1 on ground and on their own washes. Contested was first drafted `#8D2F5D`
and moved violet-ward after simulation showed ΔE 7.9 against the green under
deuteranopia — the blue channel is what survives red-green blindness; `#7E2C73` gives
ΔE 26+ deutan, 44+ protan. Colour still never travels without its text label. The five
earth ramps survive in a marked legacy block only until unconverted pages are ported;
nothing new may use them.

### The evidence margin is structural, not decorative

`Record.astro` grew a second named slot: `evidence` (the compressed record — stage,
confidence, checked, sources, unsettled) renders as a bordered strip directly under the
heading on a phone and as the head of a hairline right margin on desktop; `rail` (the
longer apparatus) follows the body on a phone and sits under it on desktop. Grid rows
are `auto 1fr` so the margin never floats free of its content. A converted page whose
margin is empty is a page that has not said how it knows what it says.

### Section headings on the record surface are the rubric

"Where it stands", "Unresolved", "Primary sources" are the record's schema, not its
content, so `record-body h2` speaks in the apparatus voice and every record reads as
the same form, filled in. Content headlines (`h3`, `.plain`) stay in the site face.
This replaced a first pass with sans section headings; the rubric reading is the
direction's whole point, and it is also what keeps the source register from becoming
citation apparatus — the sources are one rubric field among many, not a bibliography.

### Absence is stated, not hidden

A record with no disclosed figure prints "No amount made public." in unsettled amber
under the DISCLOSED label. An entry with no independent verification says so and says
that this is why its confidence rating is what it is. The margin links "2 open
questions" in amber. Unsettledness is used honestly and often, exactly as the brief's
token table demanded — it is the differentiator, not a defect state.

### The answer page carries both disciplines

`Article.astro` gained optional `answer`, `checked`, `sourceLabel`/`sourceUrl` and
`unsettled` props: the one-sentence answer leads at the largest size after the title,
then the same evidence strip as the record surface. One spine across both entrances.
NIHB is the first page converted. *Rejected in the same pass:* retitling answer pages
into second-person question form ("Can I get help with dental…?") — that is Direction
C's signature and C was set aside; pages keep the name of the thing.

*Also converted to the system:* callouts and examples (rules, not tinted boxes — the
three colours mean what they mean everywhere), ExpandableSection (hairline rows, no
card), RelatedLinks and PageHeader (branch tinting removed — a section is not a
meaning), Crossings, BriefBody, SourceList, ConfidenceBadge (pill → mono stamp),
StageRail (recoloured to the settled axis; contested still breaks the line),
VerifiedStamp (now "Checked", in the apparatus voice).

*Cost accepted:* fontsource ships every unicode subset, so `dist/` carries ~604 KB of
woff2; `unicode-range` means a phone fetches only the latin files (~148 KB, comparable
to the old Inter+Outfit set) and the service worker precaches HTML only. Revisit if
subsetting to latin-only files becomes worth a build step.

*Not yet converted:* the masthead, footer, bottom nav, ledger index Svelte browser
(old pills and chips), archive, open questions, BC directory, who pages, and the whole
community side beyond NIHB. They render correctly on re-pointed legacy tokens and are
the apply-outward list for the next session.

---

## 2026-08-05 — The provenance gate, then the conversion

### Page provenance is gated the way figures are

`scripts/check-provenance.js` runs before `astro build`, beside `check-figures.js`. It
reads the `<Article>` tag of every page that imports the Article layout and fails the
build on: a claim (`answer` or `checked`) without `sourceUrl` and `sourceLabel`; a
`checked` date more than 12 months old (warns from 10); a `checked` it cannot parse.
All three failure modes were watched firing — stale date, missing source, unreadable
date — each exiting non-zero before Astro ran.

*Kept on the page, not in a registry:* the failure mode is someone editing content and
forgetting the date; co-location means they are looking at it.

*One call beyond the brief:* an `answer` also requires a `checked` date. Without that,
dropping the date would dodge the staleness gate entirely — an undated claim can never
go stale, which defeats the point of dating claims.

*Scoped to the `<Article>` tag, not a grep for `answer=`:* CarryCard takes an `answer`
prop that means something different; a text search would gate the wrong thing. The tag
is read with a quote-aware scanner so an answer containing `>` does not truncate it.
A `checked` set from an `{expression}` fails — the script cannot read it, and
unreadable must fail rather than pass.

*Never the network:* builds work offline and do not depend on canada.ca being up. Link
health stays a separate, occasional job.

### The conversion finished honest: 11 strips, 13 deliberate absences

All 24 article pages considered; 11 carry the answer line and evidence strip, each
source fetched live in a real browser on 5 August before the claim was written. The
other 13 have no strip because their content cannot yet support a one-sentence sourced
claim — the full list with reasons is `docs/progress/2026-08-05-answer-line-findings.md`
and is the depth session's worklist. No answer was invented to fill a slot.

*Figure-bearing answers are expressions, not strings:* raising-family and
supporting-elders interpolate `money()` / `moneyExact()` into the `answer` prop, so an
answer can never quote a different number than the body. The provenance gate treats an
expression `answer` as present-but-unreadable, which is all it needs; `checked` stays a
literal so the date remains verifiable.

### The earth ramps are gone

Every shade of stone/sage/water/clay/berry is out of `src/` and the ramp block is
deleted from `global.css`. Branch tinting was removed, not remapped — sage did not
become verified green by virtue of being green. Colour that carried real meaning kept
meaning in the new palette: eligibility results, settled/unsettled law on
`/what-applies`, caution boxes, success states. Selection is drawn with ink, not washes.

*Found in passing:* `LedgerStrip.astro` lost its last importer during the page
conversions and is now orphaned; left in place, flagged for cleanup.

---

## 2026-08-06 — The money spine, milestone 1: honest plumbing

The approved build (plan: money depth + the planning spine, five milestones) starts
from the finding that the money tools are capable and completely siloed. M1 fixes the
dead ends and lays the read layer; no new UI.

### One component, one *writable* store

`src/lib/money-picture.ts` reads across every money store and writes none of them.
This deliberately relaxes the one-component-one-store convention on the read side
only. Its two rules are structural: absence is stated (every field null until the
person enters that data — a zero would be a claim), and suggestions derive from
stated data only, each naming the datum it rests on. There is no composite score and
never will be — a number that can go down is advice in a costume, and it punishes
absence.

*Also deliberate:* the read layer uses `getBudget()`/`getAllBudgetMonths()` rather
than `getCurrentBudget()`, because the latter creates the month it reports — a write
hiding in a getter.

### Restore-on-mount is the wizard standard

Section87Checker was the only tool that restored its saved state; BenefitsFinder
saved results behind a no-op restore effect and DistributionPlanner's saved plan was
never read back. Both now restore on mount — but only the *inputs*, with results
recomputed, so a saved run can never show conclusions the current rules would not
reach. Each shows a provenance line ("Saved 6 August 2026 — start fresh") in the
apparatus voice; a save without a timestamp is not restored, because a silent
pre-selection is worse than none. TaxEstimator now pre-selects its exemption toggle
from the checker's saved verdict on the same terms — grey-zone verdicts pre-select
nothing, because a grey verdict is not a percentage claim.

### WelcomeFlow deleted, not wired

The first-visit intake was orphaned code writing a key nothing read. Jake's call, 6
August: delete. The entry model is someone landing mid-worry on a specific page —
they never see a front door, and a questionnaire before value contradicts that.
Intent capture belongs on /money/plan (M4), after the site has earned the question.
Keys `gm_welcome_complete` / `gm_welcome_interests` removed from the registry.

### M2 — credit and debt earned their strips (6 August)

Every claim fetched live the same day it was written (canada.ca via the browser;
curl is WAF-blocked). Two content corrections came out of the sourcing:

*The payday figure was stale.* The page said $15 per $100 ≈ 400%; the federal cap
has been $14 per $100 (~365%, FCAC's own equivalence) since 1 January 2025. Both
now read the registry (`payday_cost_per_100`, `payday_annual_equivalent`), with
the worked example recomputed.

*The factor weights lost their false precision.* FCAC states scoring formulas
"aren't shared" and differ by bureau and lender — so 35%/30%/15%/10%/10% as bare
fact was overclaiming. The page now attributes rough weightings to Equifax's own
education page (fetched live, states ~35%/~30%) and the strip's unsettled line
carries the formula caveat. The consumer-proposal retention line was also
corrected to FCAC's actual rule (off 3 years after paid or 6 after signing,
whichever first — not "3 years after completion").

New registry entries: payday cost + annual equivalent, proposal ceiling
($250,000 excl. principal-residence mortgage, OSB), negative-info retention
(6 years, FCAC). Registry rule from the plan held: illustrations (the $400
avalanche example, the $2,400 budget) stayed prose.

### M3 — one assumed return, computed everywhere (6 August)

`assumed_balanced_return` (5%) landed in the registry, derived from the 2026
FP Canada / IQPF Projection Assumption Guidelines (fetched as the primary PDF:
fixed income 3.2%, Canadian/U.S./international equities 6.3–6.6%; 60/40 ≈ 5.1%
before fees, rounded down). Every projection on /money/investing and
/money/seven-generations is now computed in the page frontmatter from that one
figure — the 6%, 7% and 8% that coexisted on one page cannot recur, because the
outcomes are no longer typed. DistributionPlanner reads the same figure;
SettlementSimulator's slider starts there and stays adjustable.

*Deliberate conservatism:* the old 7–8% illustrations exceeded what any PAG mix
supports. For this audience, overstating growth is the worse failure; the
all-equity scenario now runs at the balanced assumption with the tilt stated in
prose. Path B's endowment story survives at 5%/4% — smaller numbers, same
argument, and the Settlement Simulator is linked for exploring other rates.

*Case studies now cite the Nations' own publications* (Nk'Mip's "first
Indigenous-owned winery," Membertou's ISO 9001 in its own wording — "first
Indigenous organization," not "community" — Westbank's self-government dates).
Westbank's "$1.5 billion" was on no source and is gone. A validate-indigenous
pass caught four "windfall" framings for distribution money — restitution is
not luck; all rewritten. Budgeting and seven-generations stay strip-free by
design; their depth is sourcing and tool wiring, not manufactured answers.

### M4 — /money/plan is a personal record, not a dashboard (7 August)

The plan surface's signature is the site's own signature turned inward: "Your
picture right now" renders like the record surface — rubric headings in the
apparatus voice, values with provenance ("from your August budget"), absence
stated in unsettled amber with an invitation attached, never a zero. No cards,
no rings, no score, no wizard. The empty page teaches the site by being empty.

*What persists vs what derives:* one key (`gm_money_plan`: vision + intentions;
auto-saved, but never written on a passive visit — an untouched page leaves no
trace). Everything else recomputes on render through money-picture, so the page
cannot show a stale conclusion. Intentions may link a SavingsGoal by id and then
display its live progress; the dollar goal stays owned by savings-store.

*The Braiding sequence is cited, not borrowed:* the vision-before-numbers order
is credited to the bundle in an apparatus footnote and the bundle joins
resources; the prompt language is the site's own.

*Severed by design:* the net-worth sparkline. Most profiles will hold one or two
snapshots, and a two-point line is decoration wearing a chart's clothes. The
trend is stated in words; revisit if snapshot histories deepen.

*Found by looking:* the LifeSimulator pre-fill was wiped by `resetInputs()` the
moment a scenario was chosen — the provenance note rendered beside an empty
field. Pre-fill now applies on mount and after every reset. The screenshot
caught it; the code read as correct.

### M5 — the literacy scaffold ships, and using a tool is completing it (7 August)

The learning system was four-fifths built and frozen at zero because
MarkComplete.svelte had no host. It now renders through an opt-in `markComplete`
prop on Article.astro (the layout supplies its own pathname), enabled on the
eight /money articles first. Progress advances for the first time since the
scaffold was written.

*Tool steps complete on click-through.* `PathStep` gained `kind: 'article' |
'tool'`, and Financial Foundations interleaves four tools into the reading order
(budget → snapshot, saving → tracker, debt → planner, ending on Your Money
Plan). A tool cannot host a "mark as complete" footer, and it shouldn't — using
the tool is the completion, so opening it from the path records the step. That
is the tools-over-content and stealth-education research applied literally, and
it only goes up.

*Reachability:* /learn now has a "prefer a guided order?" line on /money's
Learn section; the directory already carried it. Not a sixth nav tab — five
tabs is a design decision, revisit only if Jake asks. `knowledgeChecks` stays a
reserved slot; quizzes remain unbuilt on purpose.

---

## 2026-08-10 — DIY planning software, milestone 6: dates and the payment rails

The next arc (plan: DIY financial planning software — explain layers, the
cash-flow forecast, the plan document) starts with fuel, not features. Nothing
in the app knew what day money moves: budget items carried frequency without
phase, calendar events are month-granular, and benefit *payment* dates existed
nowhere.

### A third build gate: stale payment schedules stop the build

`src/data/benefit-dates/2026.json` holds the year's actual payment dates —
CCB, CGEB, OAS/GIS, CPP — fetched live from canada.ca's Benefits payment
dates page. `scripts/check-benefit-dates.js` fails the build once a series
passes its `reviewBy`, which is deliberately 31 December: the 2027 schedule
publishes in December, and a forecast running on last year's dates is wrong
silently — the worst kind of wrong for this site. Watched failing (exit 1
before Astro) and restored.

*Found by fetching:* the Canada Carbon Rebate is closed — the page lists 2025
dates only. It is deliberately absent from the dataset; the plan had assumed
it existed. The CGEB series carries only its two new-name dates (July,
October) with the January/April payments noted as belonging to the closed
GST/HST-credit series.

### Anchors, not day-of-month fields

`IncomeItem`/`ExpenseItem` gained optional `anchorDate` — a date the item
actually landed. An anchor beats a day-of-month field because it preserves
biweekly *phase* (which Friday), and `occurrencesBetween()` in the new
`src/lib/dates.ts` walks the 7/14-day grid from it, clamps monthly anchors to
short months (the 31st lands on Feb 28), and yields nothing for irregular
income — a forecast that invented dates for irregular income would be a guess
wearing a schedule. Old stored items parse unchanged; without an anchor an
item stays a monthly average and the forecast will say so. Eleven date tests
cover phase, clamping, year-end and the fall DST boundary.

### M7 — the cash-flow forecast, and the record that corrects it (20 August)

The flagship. `src/lib/forecast.ts` walks the next eight weeks day by day and
names the week the balance goes below zero. Sixteen engine tests cover the
walk, the balance, both empty cases and every correction rule.

**Four rules hold it honest, and each one costs the forecast something.** They
are written at the head of the file because every one of them is a place a
future session will be tempted to "improve" the tool by relaxing it:

1. *No invented dates.* An item with no `anchorDate` stays a monthly average
   and goes to `unplaced`, which the surface must show. Irregular income
   yields nothing. A forecast that guessed would be confident and wrong in
   exactly the weeks she is planning around.
2. *Her amounts, the government's dates.* Payment dates are published;
   amounts are not knowable from anything on the device. So a benefit enters
   the forecast only when she has entered what she receives — and then it
   lands on the real CRA date instead of a guessed day-of-month. A series the
   household profile suggests but she has not entered goes to `unentered` and
   is never estimated. `matchBenefitSeries()` uses narrow word-boundary
   aliases on purpose: a wrong match moves money to the wrong week, which is
   worse than leaving the item on its own anchor.
3. *The record corrects the plan.* See below.
4. *A running balance needs a starting number.* With no balance the weeks
   still show what moves, the caption changes to "What moves each week", every
   `closingBalance` is null and no week is called tight. "Tight" is a claim
   about a balance; inventing the balance to make the claim would be the worst
   thing this file could do.

**The plan and the record are separate, and stay separate.** `BudgetEntry`
gained optional `actuals: ActualItem[]` — what actually landed, on the day it
landed — and BudgetTool gained the surface to record them. Editing the plan to
match reality loses the reality, and it is the gap between the two that
teaches. `copyBudgetToMonth` deliberately does **not** carry actuals forward: a
copied record would be a fabricated month.

Two guards keep the correction from lying. Only *complete* months count —
a month recorded to the 12th averages out to a category at half its real size,
and a forecast built on that would tell her she has room she does not have. And
a gap under 10% is left alone, because the correction note would cost more
attention than the accuracy buys. Every corrected event says so in its
provenance, and the corrections are listed under "What this forecast cannot
see" with both figures shown.

*Writes stayed in the component.* The store briefly grew `addActual`/
`removeActual` before they were removed: actuals hang off `BudgetEntry`, so
BudgetTool's existing auto-save persists them exactly as it does income and
expenses. One component, one writable store — `budget-store.ts` only reads
them. Same reasoning that keeps `money-picture.ts` read-only.

### The chart vocabulary, extended rather than broken

The strip is the first surface on the site to plot a running quantity, and it
extends `StageDistribution`'s documented call instead of replacing it:

- **Bars, not SVG.** Height-driven divs are the house primitive
  (StageDistribution's widths, WellnessHistory's heights). A week is a bucket,
  not a point on a continuum — the balance is only known at week's end, and a
  smooth curve would claim otherwise. SVG is still the right tool for M8's
  payoff curves; it was not needed here, and reaching for it would have been
  the first crack in a vocabulary that currently holds across 520 pages.
- **The zero line is the signature.** Drawn once in `ink` across the full
  strip — the site's own structural hairline, promoted to carry meaning. Bars
  hang below it. Most cash-flow UIs draw a curve and let the reader find the
  low point; this draws the threshold and shows the week that crosses it.
- **One neutral, one status.** Magnitude is `quiet`; only a week closing below
  zero takes `unsettled`, and it takes the word "short" with it in the strip
  legend, the week row and the value label. The `/dataviz` validator's
  categorical checks FAIL on `ink` — correctly, and irrelevantly: this is not
  a categorical palette, it is one neutral magnitude series plus one reserved
  status colour, which is what the retired earth ramps left behind. The checks
  that do apply pass (CVD ΔE 27.8, normal-vision 30.9, both ≥ 3:1 on ground,
  amber 5.67:1 as text).
- **Selective labels.** Only the first tight week and the last week print a
  number; never one on every bar. A negative bar deep enough to hold its label
  carries it inside in `ground`; a shallow one puts it underneath. Both were
  found by measuring — pass one dropped the label straight onto the week-label
  row.
- **A minimum bar height of 2px.** Found the same way: at −$9 against a ~$2,000
  span the Oct 5 bar rounded to nothing, so a tight week could go invisible.
  Any non-zero movement now draws at least 2px; a true zero still draws
  nothing.
- **Tap, not hover.** Weeks expand through native `<details>` — keyboard
  navigable, works with no JavaScript, and right for a reader on a phone who
  cannot hover anything. `/dataviz` asks for a hover layer by default; the
  primary reader here overrides that default, and the `title` attribute still
  serves the desktop case.

Verified at the 375px grid (40px columns, two-line labels, no clipping, no
overflow) and across seeded empty / steady / shortfall / no-balance scenarios.
A validate-indigenous pass moved two band-distribution notes off "not"
framings; the em-dash rule in that validator is scoped to practice materials
and does not govern this site's voice, which has used them throughout since
the rebuild.

*Watch out:* the "form is open and closed at the same time" bug that appears
after editing a Svelte island in dev is the service worker plus HMR, exactly as
the top of this file warns. Unregister it and hard-reload before debugging
anything.

### M8 — explain layers, wave 1: the charts that are the lesson (20 August)

Three tools gained a visualization that teaches its concept with the person's
own numbers. All three were built on data that already existed and was being
thrown away.

**`src/lib/chart.ts` is the new plotting primitive**, and it is deliberately
narrow. Three decisions hold across everything built on it:

- *Marks in SVG, words in HTML.* The `<svg>` carries only paths, at a fixed
  720×220 viewBox scaled with `w-full h-auto`; every label is an absolutely
  positioned HTML element driven by the same normalised coordinates. Text
  inside an SVG shrinks with the viewport and this site is read at 375px on a
  low-end Android. This is the same split the forecast strip used.
- *Identity from texture and dash, never a second hue.* Two series are solid
  against dashed, or solid against hatched. That is forced by the palette —
  colour is reserved for status — and it is also what survives a black-and-
  white print and what a colour-blind reader gets for free. `/dataviz` would
  reach for a categorical ramp here; this site does not have one and is not
  getting one.
- *Normalised coordinates computed once*, so the same numbers drive the SVG
  path and the CSS percentage of a label. `normalise()` takes its maximum as
  an argument rather than deriving it, because two series sharing a chart must
  share a scale — deriving per series would rescale each curve to its own
  height and make the gap between them a drawing artefact.

**Bars did not lose.** The width- and height-driven divs stay wherever the
data is buckets — StageDistribution, WellnessHistory, the forecast week strip.
SVG entered because a debt balance falling month by month is a continuum, and
that is the only thing bars could not carry. Reaching for SVG on the forecast
strip would have been the first crack in a vocabulary that holds across 520
pages.

**The debt planner, two figures, two lessons.** `calculatePayoff()` has always
returned a full `PayoffMonth[]` and the component rendered its last row. Now:
*what you still owe* (both strategies from one balance down to zero — the
horizontal gap between where they land is the months saved) and *everything
you pay, split* (cumulative principal against cumulative interest, the
interest hatched). Principal is drawn in `rule` and recedes; the hatched
interest carries the weight, because the hatch is the point of the chart.

*Found by plotting:* the planner claimed a payoff date it had no right to.
`getPayoffDate()` derives from `timeline.length`, and `calculatePayoff()` caps
at 600 months — so a debt whose minimums do not cover its interest produced
"Debt-free by January 2076". That is a false promise made to precisely the
person carrying a payday loan. A `reachesZero` guard now gates the banner, and
both the banner and the curve say plainly that the balance never gets there
and what changes it. The cost figure is hidden in that case: there is no
total interest for a plan that does not end.

**The tax estimator's old "visual" was two disconnected tracks** — one always
full, one partial — that never showed where the missing part went, and painted
take-home in `verified` green. Green means verified on this site; it does not
mean good, and colour does not appear without its text label. `TaxSplit`
replaces it with one bar of where each dollar goes, solid against hatched, and
a second bar showing the same income with none of it exempt. The difference
between the two bars is the exemption, drawn instead of stated — seeing the
hatched part shrink is not the same as reading a number.

**The savings tracker projects her own rate, not a deadline.** `SavingsGoal`
has no target date and is not getting one: a deadline she never set is a
deadline to fail, and progress on this site only goes up. So the dashed line
is her observed pace carried forward — "at your pace, March 2027" — from
deposits that were always dated and never plotted. Two deposits are the floor;
one deposit is a balance, not a pace, and a line through it would be
invention. Past ten years no date is shown at all.

*Found by measuring, not looking:* every chart needed headroom (6–8% above the
peak) or the top label sat on the curve, and the payoff-date labels overflowed
the right edge by 25px at 375 because they were centred on a point at 100%.
They now right-align past 85%. Both were invisible at desktop width.

### M9 — explain layers wave 2, and the action layer (20 August)

**The credit article was breaking the site's own rule.** "30%" was typed into
two places in `credit.astro`, which is exactly what the figure registry exists
to prevent. It is now `credit_utilization_guideline`, fetched live from FCAC's
own page the day it was registered — their wording is a tip ("try to use less
than 30% of your total credit limit"), and the note records that, because
scoring formulas are not published and a guideline is not a threshold that
flips a score. `UtilizationGauge` reads the registry like every other number.

The gauge deliberately shows only utilization. The article already says, and
M2 already established, that the weightings are not knowable; a composite
credit-score estimate would be the one thing on this page that is invented.
Nothing is stored either — a card balance is not worth persisting for a tool
that computes a ratio and has no second visit to remember.

**The compounding explorer is the debt chart pointing the other way**, and the
article now says so. Same solid-and-hatched split, same primitive: what you
put in, and what the rate added. Interest and growth are one mechanism with a
sign — on a balance you owe it takes the hatched part every month, on a
balance you own it hands the hatched part back. The rate comes from
`assumed_balanced_return`, so the explorer and the article's prose
projections cannot drift apart.

### The action layer, and the write that would have been a lie

The plan called for one tap that "sets the extra debt payment." Building it
surfaced that this would be wrong: a distribution is a **lump**, and
`extraMonthly` is recurring. Storing a one-off as a monthly amount shortens
the projection by years that are never going to happen — to the person who
just received exactly such a lump. So `calculatePayoff()` grew an optional
one-time payment (applied before the first month's interest, to the strategy's
target unless a debt is named, spilling to the next debt if it clears one),
and the planner **computes and shows** the effect instead of writing it.
Eight tests cover it, including that a lump is not equivalent to the monthly
extra, and that a no-lump call is byte-identical to the old behaviour.

The rule that came out of this and governs everything the action layer does:
**never record money that has not moved.** This planner is usually opened
before the cheque clears. Creating a savings goal is safe — it is a container
waiting for a deposit. Recording the deposit itself would be false, and it
would corrupt the pace projection M8 just built, which reads real dated
deposits and would draw a bend that never happened. So the savings action
creates the goal at zero, says so, and says why.

Every action states what changed and where to find it, and none of them
duplicate: an existing goal is reported, never re-created. `/money/plan`'s
cushion step gained the same one tap, with the target derived from one month
of the person's own recorded expenses rather than a round number from
somewhere else — the same rule the rest of the picture follows, that a
suggestion names the datum it rests on.

*Found by testing:* `bind:value` on `<input type="number">` yields a number,
not a string, so the gauge's `balance.trim()` threw on every keystroke and the
component silently rendered its empty state forever. The build was green
throughout — only the browser console showed it. Islands elsewhere on the site
survive this because they only ever `parseFloat`; anything calling a string
method on a bound number input will not.

*Also settled:* both new islands are `client:idle`, matching the convention
already on those two pages, rather than `client:visible`. The reader arrives
mid-article on a slow connection, and hydrating a teaching tool at the moment
she scrolls to it is the wrong moment.

### M10 — the plan document, and the paper version (20 August)

`/money/plan` stops being a flat record and becomes four chapters, each led
by its visual. The arc closes here: the forecast, the charts and the action
layer were all built to be assembled into one thing a person can read from
top to bottom and then hold in their hand.

**1 · Where you stand** — income, spending, balance, debt, net worth, then
the eight-week strip. `CashFlowForecast` gained a `compact` prop rather than
a second implementation: the chapter shows the answer line and the strip and
links out. The balance field, the week list and the limits stay on the
forecast's own page, because duplicating them would make the chapter a
second tool instead of a chapter.

**2 · Where you're headed** — vision, then the things, each linked goal now
carrying "at your pace, February 2027". That date comes from
`projectGoal()`, lifted out of `SavingsPace` into `savings-store` so the
chart and the document are structurally incapable of quoting different
dates. It was duplicated logic for about an hour and that was already too
long.

**3 · What protects you** — the genuinely new chapter, and the only one that
required new thinking. Two measures, both from stated data:

- *Cushion in months, not dollars.* Emergency savings over one month's
  recorded spending. "How long could I go" is the question a cushion is
  actually for; "how much do I have" is a different and less useful one.
- *What filing opens.* Registry benefit amounts summed against the household
  profile — "up to $8,836 a year" for a household with one child under 6.
  Every figure here is a **maximum at low income**, and the note says so
  plainly: the amount tapers, and this is not a promise of what she would
  receive. What is certain, and what the line actually exists to say, is
  that none of it pays out without a return filed. This audience has been
  told enough things that turned out to have conditions attached; the
  conditions go in the same breath as the number.

**4 · What to do next** — the M9 steps, already able to act.

### Print

"Print this plan" and a `@media print` block. No dependency, no second
rendering path, no PDF library — the browser makes the file.

The block is small because the hard part was done three milestones ago.
**Every chart on this site survives black and white because identity is
carried by texture and dash rather than a second hue** — a call made in M8
for colour-blind readers and forced-colours mode, which turns out to be the
same call print needs. Nothing had to be redrawn. The only work was removing
the furniture (nav, footer, buttons, sliders), stopping chapters and figures
breaking across pages, and setting `print-color-adjust: exact`, without
which Chrome drops every fill and the charts print as empty outlines.

*Corrected on inspection:* the first version stripped `max-width` off the
document as well as `main`, which gave a 180mm measure — fine on a screen at
arm's length, tiring in a hand. The document keeps its 68ch on paper.

*Verified without a dialog:* `window.print()` opens a modal that blocks the
browser extension entirely. The print rendering was checked by lifting the
`@media print` rules into an unconditional stylesheet and screenshotting
that — a technique worth keeping for any future print work here.

*A validate-indigenous pass* caught one new "not X" framing ("Not what you
own — what would still be standing…") and removed it. The sentence is better
without the negation, which is usually how that rule goes.

*Fixed after shipping:* the first version of the chapter rendered the
forecast's full empty state — a headline, two paragraphs of pitch and a
call-to-action button — inside chapter 1, three lines below a row that
already said "Not on record yet · start with one month". A document chapter
must not contain a pitch, and the page must not ask twice. `compact` now
suppresses the card in favour of one apparatus line. **The lesson is that a
component embedded in a second context needs its empty state designed for
that context too** — the populated case was verified in both places and the
empty case only in one, which is exactly where it broke.

---

## 2026-08-20 — Into search, by renaming the pages after the questions

Flipping `INDEXABLE` was always one line. Doing it first would have wasted
the one crawl that sets the snippets for months, because the answer pages
were named in the government's language: "Non-Insured Health Benefits",
"Section 87 Tax Exemption", "Education Funding". Those titles compete head
on with canada.ca for the exact program names canada.ca owns, and nothing on
the site targeted the words a person actually types.

**The layout problem and the search problem were the same problem**, and
the code already said so. `Article.astro`'s own doc comment reads: *"The
community surface: one question, answered … every page opens with one
sentence that answers the question the page is named after."* The layout was
built for question-named pages. The titles had drifted to program names, and
the twelve questions written in her voice were sitting on branch index pages
that the design brief says she never visits.

So: seventeen answer pages renamed after the question they answer, with the
program name moved into the subtitle — she may have arrived holding a form
that says NIHB, so the term still has to appear on the page. `/rights/nihb`
now titles itself "Can I get help with dental if I have status?", which is
the exact test question in CLAUDE.md.

**The answer became the snippet.** `Article.astro` already took an `answer`
prop — the one sentence the page exists to say — and threw it away for
search, passing `subtitle` as the description. It now passes
`answer ?? subtitle`. The NIHB result no longer reads as a topic label; it
reads "Yes. If you're a registered Status Indian or recognized Inuit, NIHB
covers most dental, vision, prescription and medical-travel costs." If she
gets what she needed without clicking, that is the site working.

An `FAQPage` entry ships with it, but **only where the page has both a
question-shaped title and an answer**. Structured data that restates a
heading teaches a crawler nothing, and claiming an answer the page does not
give is the one way this could make the site less trustworthy rather than
more.

### What was deliberately not renamed

Roughly forty files reference the old titles as link labels — "see
*Investing 101*" in prose, step names in `learning-paths.ts`, the topic-card
grids on the branch indexes. Those stay. A long question makes a clumsy
inline link, and the branch pages already offer both doors: `CommonQuestions`
at the top for someone arriving with a worry, the topic grid below for
someone browsing. A page can be named for its question and still be referred
to by its topic in a sentence.

`/path` keeps stage names too. Those pages answer "where am I in life", not a
question, and `/moments` already holds the acute situations.

### /questions

`src/lib/questions.ts` gathers all 27 into one file, and `/questions` renders
them grouped. It is the site's index in the reader's language rather than the
programs', it carries the full FAQ data, and it is the sheet a band office or
health centre can print and pin to a wall. Every destination was checked
against the built output before shipping — the rule `CommonQuestions.astro`
states is that a question leading somewhere vague is worse than no question.

### One flag, one file

`indexable` now lives in `src/data/site.json`, read by both `Shell.astro`
(the `noindex` meta) and `scripts/build-seo.js` (robots.txt and the
sitemap). They previously held the same fact twice, with a comment asking
whoever flipped one to remember the other. A comment is not a guarantee.

*Two errors found on the way:* `money-picture.ts` promised "Ten questions
settle most Section 87 cases" while the checker has `TOTAL_STEPS = 5`, and
the investing page was retitled "How do I start investing with a small
amount?" before a validate-indigenous pass caught it against rule 19 — the
title should not draw attention to the size of what she has. The page still
teaches that $50 works; that is her learning what is possible, not the site
reassuring her.

*Still true:* the site is now crawlable with the Section 87 content awaiting
a tax professional and the disclaimer awaiting legal review. That was a known
trade, made deliberately. Turning `indexable` off again stops future crawls;
it does not un-index what has already been taken.

---

## 2026-08-20 — The claims register, and making the review cheap enough to happen

ROADMAP has said "Section 87 content reviewed by a tax professional" since
April and nothing has moved. The page itself carries a callout saying, in its
own words, that it "has not been reviewed by a tax professional" — so the site
is honest about the gap, and the gap is now the front door for search, since
the page is titled "Do I pay tax if I work on reserve?"

The bottleneck was never willingness. Asking someone to review a website means
asking them to read 1,600 words and work out for themselves what is being
asserted. Nobody does that as a favour.

**So the register extends the site's existing spine from numbers to
statements.** `src/data/claims/section-87.json` holds all thirteen checkable
assertions on that page, and `scripts/build-review-pack.js` renders them into
`docs/review/section-87.md` — a numbered list with a box beside each claim.
The ask becomes "please check these thirteen statements", which is an
afternoon.

The `status` field is the honest split, and it is what makes the pack worth a
practitioner's time:

- `sourced` (5) — checked against a named authority. The reviewer skims and
  flags only what is wrong.
- `needs-practitioner` (8) — judgement calls. This is the only part that
  actually needs them, and the hybrid-work claim is flagged as the priority:
  it is the least settled area, it is the situation most readers are now in,
  and the page advises keeping a work log on the strength of it.

The pack asks for "Correct / Needs changing / **Cannot be stated in general**"
— the third being a real answer — and explicitly does not ask the reviewer to
endorse the site or be named on it. A review that costs someone their name is
a different and much larger ask.

*Caught by the discipline, on the first use of it:* the register initially
cited Williams v. Canada with an SCC URL that resolves to Sinclair v. Quebec,
and the CanLII fallback is bot-blocked. The citation is right; the link was
not. It now ships with the citation and no link, and a note saying the link
was left off deliberately rather than guessed. A provenance claim nothing
verifies is worse than none — that is this repo's own rule, and it caught a
bad citation the first time it was pointed at prose instead of figures.

*Also established:* an automated link-health job **cannot use curl** here.
Twenty-two of the twenty-seven cited sources return `000` to curl and load
fine in a browser — canada.ca and sac-isc.gc.ca are WAF-blocked, exactly as
CLAUDE.md warns for fetching. `check-provenance.js` says link health is "a
separate, occasional job"; that job needs a browser session, which is
probably why it has never been built. Spot-checked the highest-stakes source
(NIHB) by browser: alive and correct.

---

## 2026-08-20 — Her data, back out

The site promised that everything stays on her device and that the data is
hers. The only way out was `strongfire-backup-<date>.json` — a file for moving
between phones, not one a person can read, and not one she can hand to a band
administrator or a tax preparer. She could put a year of income, spending and
recorded actuals in and get nothing usable back. The promise was partly
untrue.

`src/lib/csv.ts` and a "Take it with you" section on the budget tool close it:
every month, planned and recorded, one row per item.

**CSV rather than .xlsx, deliberately.** It opens in Excel, Sheets, Numbers
and whatever a band office actually runs; it needs no library on this side;
and it does not lock her own budget to one vendor's software. The reader most
likely to need this file is the one least likely to have Excel.

**All months, not the month on screen.** Someone exporting a budget is almost
always showing a year to somebody, and a single-month export would send her
back twelve times.

### Three details that decide whether the file opens correctly

Each is invisible until someone else opens it, which is exactly when it
matters:

- **Formula injection.** Every label in the file was typed by the person, and
  a spreadsheet treats a leading `=`, `+`, `-`, `@`, tab or carriage return as
  a formula. `=cmd|' /C calc'!A0` in an expense label is a live cell in Excel.
  Values are prefixed with an apostrophe *and* quoted — the first test run
  only prefixed, and importers disagree about whether a bare leading
  apostrophe marks text. The one that disagrees is running on someone else's
  machine. **Numbers are never defused**, or a negative amount stops being
  numeric and the column will not sum, which is the whole point of the file.
- **Quoting.** "Rent, hydro" and `The "big" bill` are things people type.
- **The byte-order mark.** Without `EF BB BF`, Excel on Windows reads the file
  as the local codepage and mangles every accented character — which here
  means Nation names and anything with an apostrophe. Confirmed in the actual
  bytes; `Blob.text()` strips a BOM on decode, so checking the string says
  nothing.

Fourteen tests cover the escaping, including the injection payloads.

*Irregular income exports with no monthly figure*, matching the forecast's
rule. A spreadsheet cannot know that "$450 every two weeks" is not $450 a
month, so the planned rows carry a computed monthly equivalent — and where no
honest conversion exists, the cell is empty rather than guessed.

### And on paper

The budget tool now prints. Filled, it is the record she hands over; blank, it
is a worksheet someone can complete at a kitchen table with no phone and no
signal. Same stylesheet for both, because the only difference is whether she
has typed anything yet. That is ROADMAP's "printable one-page summaries" and
half of "community facilitator mode", arrived at from the other direction.

*Still absent, and deliberately so:* retirement adequacy, insurance needs and
estate tools. A commercial planner has those because its user is fifty-five
with assets. The reader here is twenty-six in Lytton asking whether status
covers dental, and building a retirement projection would be building for a
reader this site does not have. Estate on reserve is the one of the three
worth revisiting — it is high-stakes, legally distinct from provincial law,
and badly served everywhere else.

---

## 2026-08-20 — A map of the province, and what a dot is allowed to mean

The BC directory has held `lat`/`lon` for all 201 Nations since it was
compiled, unused. `/nations/bc` now opens with a map.

**A dot on a map is a claim, and this one is deliberately narrow.** Each mark
is the community location the federal band registry lists — a band office
address, essentially. It is not the extent of a territory. Territories are far
larger than a point, they overlap one another, and most of British Columbia is
unceded. A map that quietly implied otherwise would be making a claim this
site has no standing to make, to readers with earned reasons to be wary of
exactly that kind of claim. The caption says so in plain words and is load
bearing; it is not a disclaimer to be trimmed for tidiness.

**Density is stated rather than hidden.** Fifteen Nations sit close enough to
Cheam to share one mark at phone width. Rather than pretend the dot is one
Nation, a tap names the others hiding behind it. Dots are drawn at 55% opacity
so a cluster reads darker than a lone Nation — the Fraser Valley and the
central coast look crowded because they are. The directory below stays the
precise index; the map is for orientation.

**Tap, not hover**, and the answer is HTML under the map rather than a tooltip
over it: 375px is a first-class width, a phone has no hover state, and a card
can be read, selected and reached by a screen reader in a way a floating
tooltip cannot. Each mark carries an invisible 14-unit hit target, because a
finger is wider than a five-pixel dot.

### The outline

`scripts/one-off/extract-bc-outline.js` turns a public-domain Natural Earth
boundary into a single 11.5 KB SVG path, committed to
`src/data/bc/outline.json` and never fetched again. The site makes no external
requests at runtime and its builds do not depend on any host being up — the
same discipline as the figure registry: fetch once, record the source, keep
the bytes.

*Found by checking the aspect ratio against reality:* the first version scaled
longitude by the cosine of each point's own latitude, which shears the
province. The Alberta border north of 54°N is a straight meridian at -114°,
and a per-point cosine maps it to a different x at every latitude — bending a
straight line into a diagonal and stretching BC to nearly twice its true
width (aspect 1.92 against a true 1.26). Scaling by the cosine of one standard
parallel, which is what equirectangular means, gives 1.25. The lesson is that
a projection error looks like a plausible map until something in it is
measured.

*Also corrected:* the province was first filled with `ground` on a white card
— two near-whites, so BC rendered as a ghost. `canvas` on white gives it a
body.

### The refinement pass (21 August)

The first version worked and did not look considered. Four things, in order of
how much each one mattered:

- **The frame came off.** It sat in a bordered white box, and nothing else
  here boxes a figure — the stage bars, the forecast strip and the payoff
  curves all sit open on the page. The province's own outline is a better
  edge than a rectangle drawn around it.
- **The marks stopped being stipple.** Two hundred flat dots at 55% opacity
  read as a smudge in the southwest. Each now carries a ground-coloured ring
  — the same surface gap that separates stacked fills elsewhere here — so a
  cluster reads as many marks touching, which is what it is. The selected one
  takes a ring rather than just growing, because in a group of sixteen, size
  alone does not say which was chosen.
- **The reserved slot went.** A `min-h` box under the map held a prompt and
  otherwise held nothing. The card now replaces the prompt in place.
- **It aligned to the page.** Capped at 34rem, and left-aligned rather than
  centred: this page runs to a wide measure, and the centred map sat three
  hundred pixels from its own heading, leaving the heading pointing at
  nothing.

*Two things only measurement caught.* Capping the width made the marks render
under two pixels — radii are in viewBox units and 1000 units arrive at about
34rem, so they have to be chosen against the rendered width rather than the
coordinate space. And the tap target was 12px at phone width, half what a
thumb needs; it is 20px now. The cost is that a tap in a cluster lands on
whichever mark is on top rather than the nearest, which is the right trade
because the card names the Nations sharing the mark — a near miss still tells
her what she wanted. Precision lives in the directory below, not in a map of
two hundred points.

*And again:* `client:visible` does not hydrate in the screenshot pane, so the
map's dots looked broken when they were merely asleep — the third time this
session that trap has cost time, and the progress notes had already warned
about it twice. Settled on `client:idle` on its merits, not for testability:
someone on this page will scroll past the map to reach the directory, so
`visible` only delays hydration to the moment of use and hands them
unresponsive dots.

---

## 2026-08-21 — The entitlement engine, and the household under it

`/money/taxes` has carried this sentence since it was written: *a single
parent with two young children who doesn't file could be leaving
$12,000–15,000 per year on the table between the CCB and GST credit alone,
and you can file up to 10 years back.* The most consequential sentence on the
site, sitting mid-article, about a hypothetical stranger, with no arithmetic
and no next step. `/money/unclaimed` does the arithmetic for the person
reading it, and a seeded household of two children under six with three
unfiled years produces **up to $52,383**.

### The household had to come first

`hasChildren` already existed in two places — a boolean on the calendar
profile and a string in the Benefits Finder's saved answers — which can
already disagree with each other, and neither knows how many children or how
old. An entitlement built on a flag is an illustration; one built on a
household is hers. `household-store.ts` is now the model that matters.

*Birth years, not birthdates.* The child benefit bands at six and ends at
eighteen, so a year does all the arithmetic, and a year is markedly less of a
child's information to hold on a device. Storing the least that answers the
question is the rule.

*Seeded, not assumed.* `draftFromWhatIsKnown()` pre-fills from the calendar
profile and the Benefits Finder, because being asked a third time for
something answered twice is how people conclude a site is not paying
attention. Nothing is saved from the draft — a silently pre-filled household
is a household nobody checked. Where the flags say there are children but
cannot say how many, the form says so and asks.

*Years unfiled is asked and never inferred.* It multiplies everything
retroactive; guessing it would be guessing the headline.

### Five rules, because this is the most dangerous file here

1. **Everything quantified is a maximum at low income.** Both benefits taper.
   The engine says "up to", the surface repeats it beside the headline rather
   than below the fold, and no wording may become "you are owed".
2. **Nothing is quantified without the household fact under it.** No children
   entered, no child benefit — and `basis` names the facts and the rates on
   every line so a figure can always be taken apart.
3. **What cannot be known is named, never estimated.** Tax withheld on exempt
   income needs the T4s; unclaimed medical reimbursements and an unmade
   Jordan's Principle request are unknowable from a phone. They ship as
   `named` lines with an action and no number, and named lines never enter
   the total. A plausible guess would be indistinguishable from the computed
   figure beside it and would poison it.
4. **Historical rates were lower.** Retroactive totals apply this year's
   figures to earlier years because the device has no historical table. That
   overstates, so it is disclosed as a caveat in the same breath as the
   total, not as small print.
5. **The window closes one year at a time.** Every January a year falls out
   of reach. It is the only thing on the page with a deadline, and it is the
   reason this is a tool rather than another article.

Sixteen engine tests, including that a child aging across the six-year band
mid-window is banded per year rather than from today's age, that a child not
yet born in an earlier year contributes nothing to it, that a grey-zone
exemption verdict raises no claim at all, and that the output reproduces the
range the article has been claiming in prose.

*Caught in review of the rendered page:* `basis` was printing registry key
names — `ccb_under_6, ccb_6_to_17` — straight to the reader. The apparatus
voice shows provenance in words ("from your August budget"), never variable
names. Rewritten, and the rule written into the file so it does not come
back.

*The register came with it, not after.* `src/data/claims/unclaimed-benefits.json`
was extracted the day the page was built, and `docs/review/unclaimed-benefits.md`
is ready to send — seven claims, five needing a practitioner, with the
ten-year reach-back and the Section 87 adjustment both flagged as priority.
Telling someone they may be owed tens of thousands of dollars is not
something to ship and review later.

---

## 2026-08-21 — The documents, and her Nation

Two pieces close the arc that `/money/unclaimed` opened.

### /money/asking — the request nobody taught her to make

The site can now tell someone they may be owed money. Between knowing and
receiving sits a written request, and that gap is where most people stop —
not from lack of will, but because a blank page addressed to a federal
department is genuinely intimidating and the words feel like they have to be
right. `src/lib/letters.ts` holds three drafts; the page renders them to copy
or print.

Three rules govern them:

- **A draft, never a submission.** Nothing here sends anything and nothing
  here could. A site that wrote to a department on her behalf would be acting
  for her, and everything else here is built so that she acts and the site
  explains.
- **A blank stays a blank.** Missing facts render as marked gaps, never as
  plausible guesses. A letter that invents a date can be contradicted by her
  own records, in writing, to the body deciding her claim.
- **State facts and make a request.** These letters do not argue law.
  Asserting an entitlement in a document she has not had checked turns a
  reasonable request into a claim she has to defend.

*The back-filing document is deliberately not a mock T1-ADJ.* CRA's
adjustment mechanism is its own form and My Account, and producing something
that looks official but is not would be worse than producing nothing. What
actually unblocks someone is walking into a free clinic already knowing which
years, which slips and what to ask — so it is a page to hand across the
table. It fills itself from the household: "I have not filed for 3 tax
years", "Children in my care: 2", and a Section 87 paragraph that appears
only when the saved check came out likely exempt.

The Jordan's Principle draft is offered only where there is a child, on the
same rule as everything else here: no fact, no feature.

### Her Nation

The site holds a page for every First Nation in BC and the personal side
could not see any of it. `Household.nationSlug` and `YourNation.svelte` name
her Nation once and turn the largest built asset here from a national
reference into her own file — People, Tribal Council, the band office as the
place to ask about post-secondary funding, and a link into the record.

**Optional, and it stays optional.** Plenty of people are members of a Nation
outside BC, are not registered, or simply do not want to say, and none of
that should cost them a working tool. Nothing in the entitlement arithmetic
reads the field — it is a bridge, not a gate.

*On deadlines:* the arc's fourth piece was to be a deadline surface. Building
the rest showed it was already where it belonged — the ten-year window is on
`/money/unclaimed` beside the figure it threatens, and the benefit payment
dates are in the forecast on the weeks they land. A separate calendar of
deadlines would have moved both away from the number that makes them matter.
Recorded here so the idea is not re-derived as an omission.

---

## 2026-08-21 — Estates on reserve

CLAUDE.md names two test questions. One of them — *"What happens to my house on
reserve when someone dies?"* — resolved only to `/moments/someone-passed`, a
gentle page about grief that says the estate goes through ISC and stops there.
The site's own north-star question had no answer page.

`/rights/estates` is that page. Three things it says that people do not know:

**The system is not the one they have heard of.** Where the person was
registered under the Act, or could have been, and usually lived on reserve, the
estate is administered by ISC under ss. 42–50 — not provincial probate, not a
provincial court. ISC appoints the executor, **approves the will so it can take
effect**, transfers the land, and determines the heirs where there is no will.

**The house can only go to someone entitled to live there.** Section 50 is
blunt: *"A person who is not entitled to reside on a reserve does not by devise
or descent acquire a right to possession or occupation of land in that
reserve."* The interest is sold to the highest bidder among those who are
entitled to reside, and the would-be heir receives the money. So a child who is
not a member does not inherit the home — they inherit what it sold for. That is
the single most consequential fact on the page, and it catches families who did
everything they believed was right, including families who paid for a will that
says something the Act will not permit.

**Fewer than 9% have a will.** ISC's own figure, registered as
`on_reserve_wills_rate` and quoted as a ceiling because ISC says "less than".
The page uses it to make the opposite of the usual point: having no will is the
ordinary case, not the careless one — and it is the one piece of this a person
controls.

*Deliberately not attempted:* the intestacy order itself. Setting out who takes
what under the Act, on a page that cannot know who is a member or what the land
papers say, would invite a family to act on it. The page says ISC determines
the heirs and stops. Whether declining is right rather than unhelpful is a
question in the register.

*The register came with it*, as it now does — `estates-on-reserve.json`, seven
claims, and the first one needing a **lawyer** rather than a tax professional.
Section 50 is flagged as the priority: it is the claim a family could act on
and lose a house over. Five of the seven are quoted verbatim from ISC or the
statute and verified the day the page was written.

*Reachable from four places*, checked before shipping — the question index, the
site directory the home page renders, the rights topic grid, and outward from
the grief page. That check exists because three tools shipped this week were
built correctly and connected to nothing.

---

## Still open

- Whether the ledger becomes a living record or stays a 2026 snapshot. The promotion tool
  builds toward the former.
- Whether the site should derive the BC directory itself rather than reading a file
  compiled in `work-toolkit`.
