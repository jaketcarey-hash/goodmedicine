# Strong Fire

A one-stop information shop for First Nations people: money, rights, path, self, plus a
news layer. Free, private, offline-first PWA at **strongfire.ca**. Personal project — see
the boundary rule below.

**It is not a publication and must not be built like one.** The brief and ledger carry
schemas, confidence ratings and source registers, and both Claude and Codex sessions have
repeatedly read that shape and started designing publication apparatus for it — citation
formats, feeds as a subscriber product, a second editorial identity. That answers to
journalists. Wrong reader.

**The test:** a 26-year-old in Lytton, on her phone, mid-worry. *"Can I get help with
dental if I have status?"* *"What happens to my house on reserve when someone dies?"*
Every feature either helps her or it does not.

The two things that matter are **reach** (she can get to it) and **depth** (when she does,
the answer is there).

## Read before building

- **`DECISIONS.md`** — why the code is the way it is. Read it before changing anything
  structural; it will stop you re-deriving a call differently.
- **`~/.claude/BUILD-PLAYBOOK.md`** — the method: phases, compaction, the two-pass design
  rule. Read at the start of a build, not partway through.
- **`REVIEW.md`** — the content audit, and a list of things not to re-flag.

## Stack

Astro 6 · Svelte 5 islands · Tailwind 4 · custom service worker · Vercel.
No accounts, no tracking, all state in `localStorage`.

## Build chain

`npm run build` runs four steps around Astro, in this order:

1. `check-figures.js` — **fails the build** on any figure past its `reviewBy`
2. `astro build`
3. `build-search-index.js` — walks `dist/`, writes `search-index.json`
4. `build-seo.js` — sitemap + robots; `INDEXABLE` is currently `false`
5. `generate-sw.js` — precache list, must run last

## Structure

- `src/pages/{money,rights,path,self}` — the community side, one folder per branch
- `src/pages/nations/` — brief, archive, ledger, open questions, BC directory, who
- `src/data/figures/2026.json` — every stated rate and amount. **Never hardcode a figure
  in a page**; add it here and read it with `figure()`.
- `src/data/nations/` — edition JSON, written by the pipeline, rendered by Astro
- `src/lib/` — readers and shaping; `bc-nations.ts` and `nations-index.ts` hold the
  matching rules, which are deliberately strict

## What will bite you

- **`<style is:global>` is unlayered and beats every Tailwind utility.** Base element
  styles live in `@layer base`. Use `.plain` to opt a heading out of Record styling. `!`
  utilities will not win.
- **The service worker serves cached JS.** A change can look undeployed when it shipped
  fine. Hard-reload before concluding anything.
- **`/nations/archive/YYYY-MM-DD` is a contract.** The Codex weekday automation checks it.
- **`publish-nations-brief.sh` refuses to deploy** if the working tree has changes outside
  the Nations paths. Commit before Friday or the brief will not publish.
- **Never sum the ledger amounts.** They measure different things. See `DECISIONS.md`.
- **Nation names are never folded for display**, only for slugs and matching.
- **Mono is provenance only.** The `apparatus`/`apparatus-label` utilities set IBM Plex
  Mono for dates, figures, sources, confidence, stages and record ids — never for
  content. Content never carries provenance styling. See the 2026-08-05 entry in
  `DECISIONS.md`.
- **The earth ramps (stone/sage/water/clay/berry) are gone** (retired 2026-08-06).
  Everything uses ground/ink/quiet/faint/rule plus the three status colours — and
  colour never appears without its text label. Do not reintroduce a ramp.
- **`money-picture.ts` reads every store and writes none.** Tools own their writes;
  cross-tool reads go through the picture. No composite score, ever.

## How to ship

Two lanes, split by whether the thing has a right answer.

**Correctness ships straight to production.** Engine work, content fixes, a
sourced claim, a bug. The gates are the review: `check-figures`,
`check-provenance` and `check-benefit-dates` fail the build over a stale or
undated number, and `npm test` covers the arithmetic. Those catch real things
and they do not need a second opinion.

**Judgement goes to a preview first.** Layout, density, whether a page reads
well, whether something looks considered — `vercel deploy` without `--prod`
gives a URL to look at before it is live. This exists because the map took four
production deploys to get right, each round shipped to the world, and because
every piece of feedback in that stretch was an aesthetic call rather than a
correctness one. Nothing here verifies taste; do not ship taste as though it
passed a check.

**Batch the design rounds.** One preview, one review, one ship — not a deploy
per tweak.

**Say what was actually verified.** The browser pane cannot scroll, cannot
resize below about 745px, and does not hydrate `client:visible` islands. So
"measured the DOM at a constrained width" is the honest claim, and "verified at
375px" usually is not.

**Someone else works in this repo.** Codex commits here and does not always
push. Run `git log` and `git status` before touching a shared file — an
in-flight refactor was clobbered on 25 August because neither was checked.

## Hard boundary

Strong Fire is personal. It must never appear in RBC or practice materials, and no
practice material — client-facing decks, the IWKB library, advisor tools — may appear
here. The footer states the site is unaffiliated with any bank or firm; nothing may
contradict that.

## Voice

Plain language, never patronising. Sovereignty framing: "what you're entitled to", not
"what the government gives you". Name what is unsettled rather than sounding certain.
Canadian spelling. No emojis.

## Commands

`npm run dev` · `npm run build` · `npm run check:figures`
