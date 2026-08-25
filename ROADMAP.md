# Strong Fire — Roadmap

## Current State (25 August 2026)

531 URLs, 17 tools on the front door, live at strongfire.ca and **indexable since
20 August** — search is on, `/questions` gathers all 27 answer pages, and the
sitemap is built. See DECISIONS.md for why anything is the way it is.

Three arcs shipped this month:

- **Planning software M6–M10** (20 Aug) — the eight-week cash-flow forecast, the
  budget record layer with actuals, charts that teach with your own numbers, the
  action layer, and `/money/plan` as a four-chapter document you can print.
- **The entitlement engine** (21 Aug) — `/money/unclaimed` computes what unfiled
  years are worth from a real household; `/money/asking` gives drafts to take to
  a tax clinic, NIHB or Jordan's Principle. The thing that puts money in hands.
- **The claims register** (21–24 Aug) — six subjects now carry an extracted,
  sourced claim register: Section 87, unclaimed benefits, NIHB, Jordan's
  Principle, education funding, estates on reserve.

And `/nations/bc` became a map that answers the directory, and vice versa.

## The three gates before this is really public

None of these are code. All three have been open since before the site was
indexable, and the site is now live to crawlers with them still open — that
trade was made deliberately on 20 August.

- [ ] **Section 87 content reviewed by a tax professional.** The page carries a
      callout admitting it has not been. AFOA Canada is the referral route the
      page itself names.
- [ ] **Disclaimer reviewed by someone with a legal background.**
- [ ] **Logo from an Indigenous artist.** $500–2,000. Lattimer Gallery, Emily
      Carr Indigenous students, Indspire, ILC contacts. Once it exists, build the
      whole visual identity from it in one session.

### The nearest actionable thing

Six review packs are **built and unsent** in `docs/review/` — section-87,
unclaimed-benefits, nihb, jordans-principle, education-funding,
estates-on-reserve. Each is generated from `src/data/claims/*.json` by
`scripts/build-review-pack.js`: extracted claims, the ones already sourced,
the ones needing a practitioner, with checkboxes. None ask the reviewer to
endorse the site or be named.

Sending these is what turns gate 1 from a wish into a process.

## Also open, and manual

- [ ] Submit `strongfire.ca/sitemap.xml` in Google Search Console (531 URLs).
      Claude cannot do this one.
- [ ] Community validation of the name "Strong Fire"
- [ ] Proper app icons (still solid-colour placeholders)
- [ ] French language support, or a note that it is coming

## The next arc: make it one system, not seventeen tools

**This is the honest state of the money side as of 25 August.** The tools are
connected at two destinations and nowhere else, which is why using them feels
like visiting separate calculators.

What connects today:

- `money-picture.ts` is a read-only view across budget, debt, savings, net
  worth, the calendar profile, the Section 87 verdict and the Benefits Finder
  run. It is read by `/money/plan`, `/money/unclaimed` and the Life Simulator.
- `household-store.ts` is the who-lives-here view behind the entitlement engine,
  `/money/asking` and `YourNation`.
- `forecast.ts` quietly reads the budget and the calendar, so the eight-week
  forecast is already fed by data entered elsewhere.

The seams, in the order they cost the most:

- [ ] **The forecast is a dead end.** It reads budget and calendar, but nothing
      reads it back. `gm_forecast_balance` is touched only by its own component,
      so `/money/plan` cannot say "week three is the tight one" even though the
      site knows.
- [ ] **The Tax Estimator's answer goes nowhere.** It reads the Section 87
      verdict and writes nothing. A refund is a dated cash event — it belongs in
      the forecast and on the calendar.
- [ ] **Two households.** `CalendarProfile` and `household-store` are both
      "who lives here", bridged in one direction. One of them should win.
- [ ] **The Distribution Planner is an island.** Its data is read only by the
      export tool.
- [ ] **The Settlement Simulator persists nothing at all.**
- [ ] **No tool tells you what you already told the site.** Every tool component
      imports only its own store. Open the Debt Planner and it does not know you
      have a budget. The fix is not shared state everywhere — it is each tool
      opening with what is already known and offering to use it.

The rule that has to survive this arc: **never record money that has not moved.**
Where a write would be dishonest, compute and show instead.

## Community Feedback

- Elsa DJ gave the first round (implemented March 2026)
- Still need 3–5 more reviewers: someone on reserve, someone under 25, someone
  over 55
- Still need benefit amounts validated by someone in band administration

## Feature Ideas (Researched, Not Yet Built)

Carry Cards shipped — they are live at `/rights/carry-cards`.

### Seasonal Wheel UI
App shifts with Indigenous seasonal calendars (thirteen-moon or regional
variants). Content priorities rotate, palette warms and cools, home greeting
changes.

### Ceremony and Gathering Planner
Potlatch, feast, giveaway, memorial — each has real costs. Treat ceremony prep
as a legitimate financial goal with its own categories.

### Interactive Stories
Financial education as text-message-style conversations. Follow a character
through their first job, Section 87, NIHB. Three to five minutes,
choose-your-path.

### Community Features
Housing Navigator · NIHB Medical Travel Claim Helper · Traditional Food Economy
Calculator · Know Your Rights (situation-based) · Elder Benefits Maximizer and
Estate Planning · Youth "First Everything" Guide · Scam Alert Network · Document
Vault (encrypted, on-device) · Community Resource Map

## Technical Improvements

- [ ] PIN-based cloud sync for cross-device persistence (Supabase free tier)
- [ ] Inline term explainers (tap a bolded term without leaving the page)
- [x] Printable summaries — done for `/money/plan` (M10). Other tools still to do.
- [ ] Community facilitator mode (printable workshop guides)
- [ ] Two-minute content blocks with "go deeper" expansion
- [ ] Visual progress map (topics explored light up)

## Key Research Findings

- Tools over content, 3:1 (NZ Sorted) — calculators primary, articles support
- Life-event navigation beats topic navigation (My Money Dream, Australia)
- "Only goes up" progress metrics — never punish absence (Headspace)
- Easy re-engagement after absence — welcome back plus a sixty-second recap
- Stealth education through utility — teach through tools, not lessons
- No app like this exists globally for Indigenous communities — first of kind
