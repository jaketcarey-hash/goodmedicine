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

## Open questions

- Whether the ledger becomes a living record or stays a 2026 snapshot. The promotion tool
  builds toward the former.
- Whether the site should derive the BC directory itself rather than reading a file
  compiled in `work-toolkit`.
