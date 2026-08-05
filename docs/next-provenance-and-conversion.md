# Next session — make the provenance real, then finish the conversion

Written 5 August 2026, after reviewing the Direction B redesign.
Two jobs, strictly in this order. The order is the whole point.

---

## Why this session exists

The redesign works. The evidence margin is a genuine piece of design and the
data behind it on the Nations surface is real — spot-checked against the ledger,
and it reconciles.

But the answer pages introduced a second kind of provenance, and it does not
have the same guarantees:

```astro
<Article
  answer="Yes. If you're a registered Status Indian or recognized Inuit…"
  checked="August 2026"
  sourceLabel="NIHB / Indigenous Services Canada"
  sourceUrl="https://www.sac-isc.gc.ca/eng/1572537161086/1572537234517"
  unsettled="Mental-health and travel approvals vary by region"
/>
```

Every one of those is a hand-typed string. Nothing verifies them, nothing ages
them, and nothing fails the build when they go stale. Someone edits the body of
that page next March, does not touch the frontmatter, and the site displays
"CHECKED August 2026" against content that changed — on a design whose entire
argument is *show your work*.

**A provenance claim that is not verified is worse than no provenance claim.**
It converts "we don't know" into "we checked", which is the exact failure this
site exists to avoid.

The project already solved this once. `src/data/figures/2026.json` carries
`verifiedOn`, `reviewBy` and a source per figure, and `scripts/check-figures.js`
**fails the build** on anything past its review date. That is why the numbers can
be trusted. Page-level provenance needs the same spine.

**Do not roll the evidence strip across the remaining pages until this is
fixed.** Doing it in the other order multiplies an unverifiable claim by 22 and
makes it much harder to walk back.

---

## Job 1 — Gate the page provenance

### The shape

Keep the props **on the page**, not in a central registry. The failure mode is
someone editing content and forgetting the date; co-location means they are
looking at it. A registry in another file makes forgetting easier, not harder.

Add `scripts/check-provenance.js`, modelled closely on `check-figures.js`, and
put it in the build chain **before** `astro build` so it fails fast:

```
node scripts/check-figures.js
  && node scripts/check-provenance.js
  && astro build
  && …
```

### What it must enforce

1. **No claim without a source.** If a page sets `answer` or `checked`, it must
   also set `sourceUrl`. An answer with no source is an assertion.
2. **No stale checks.** `checked` must be within 12 months. Past that, fail.
   Warn from 10 months so it is not a surprise.
3. **Parseable dates.** `checked="August 2026"` is a display string; store
   something sortable alongside it or parse it strictly. A date the script
   cannot read must fail rather than pass silently.
4. **`unsettled` is free text and stays free text** — it cannot be validated and
   should not be faked into a schema.

### What it must not do

Do not check the source URLs over the network at build time. Builds must work
offline and must not depend on a government site being up. Link health is a
separate, occasional job — the earlier session did it by driving headless
Chrome, because canada.ca blocks curl.

### Verify it properly

Prove both gates fire, the way `check-figures.js` was proven: set a `checked`
date to 2024, confirm the build **exits non-zero and `astro build` never runs**.
Remove a `sourceUrl` from a page that has an `answer`, confirm the same. Then
restore both. A gate nobody has watched fail is not a gate.

---

## Job 2 — Finish the conversion

Only after Job 1 is green.

**Where it stands:** 2 of 24 article pages carry the answer line and evidence
strip. 31 files still use the legacy earth ramps (`bg-clay-50`, `bg-water-50`,
`bg-sage-50`, `bg-berry-50`). The site is visibly two designs — someone landing
on `/money/banking` gets the old one.

### The rule for answer lines

**Do not invent answers to fill the slot.** Write the answer line only where you
can state it truthfully and cite it. Where you cannot, leave the props off — the
strip does not render, and a page without one is honest. A page with a
manufactured answer is not.

Expect a meaningful number of pages to end up with no answer line. That is a
finding about the content, not a failure of the conversion, and it tells the
depth session exactly where to work.

### Order

1. `/rights/*` — the highest-stakes answers and the ones people search for.
2. `/money/*`.
3. `/path/*`, `/self/*`, `/moments/*` — these are situational rather than
   factual, and many will correctly have no answer line.
4. Retire the earth ramps from `global.css` only when nothing references them.
   Leaving dead tokens is how the next session gets confused about which system
   is live.

### Look at it

Chrome, at 375, 768 and 1440, on every page type you touch. Four of the five
real defects in the 4 August session were found by looking, and the one visual
change that shipped without looking was wrong.

---

## Out of scope

- No new features.
- No redesign. Direction B is chosen and built; apply it.
- No content depth work beyond the answer lines. That is its own session and it
  should run after this one, using the pages that ended up *without* an answer
  line as its worklist.

## Done looks like

- `npm run build` fails on a stale or unsourced page claim, and you have watched
  it fail.
- Every page either carries a sourced, in-date evidence strip or carries none.
- No file references the earth ramps; the tokens are gone from `global.css`.
- A list, written down, of pages that could not get an answer line and why —
  handed to the depth session.
