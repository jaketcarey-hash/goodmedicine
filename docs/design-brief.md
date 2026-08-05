# Strong Fire — design brief

Written 5 August 2026, for a redesign session that has not happened yet.
Three directions, worked far enough to choose between. Pick one, then build it.

---

## 1. What this is

A free, offline-first information shop for First Nations people: money, rights,
life stages, and a news layer about Indigenous economic activity in Canada. No
accounts, no tracking, everything on-device. Independent of any bank, firm or
government agency, and it says so.

**Not a publication.** Two previous sessions drifted toward feeds, citation
formats and a second editorial identity because the news layer's data *looks*
scholarly. It is one shop with a news shelf.

## 2. Who it is for

One person, and the whole design answers to her: **a 26-year-old in Lytton, on
her phone, mid-worry.**

> "Can I get help with dental if I have status?"
> "What happens to my house on reserve when someone dies?"

She is not browsing. She has a specific question, she is probably a bit anxious,
and she may be on a bad connection in the Fraser Canyon. She has likely been
sent a link by a person rather than finding it in a search result.

A second, quieter audience exists — Nation finance staff, entrepreneurs, people
who follow the file — but they are never the reason to make a decision.

## 3. The job of the page

Answer her question, and be trustworthy while doing it.

Trustworthy is the hard half. This audience has specific, earned reasons to
distrust financial institutions and government forms. The design either earns
confidence or it triggers the wrong memory.

## 4. Real constraints

- **Low-end Android, poor signal.** Offline-first PWA. Self-hosted fonts, no
  external requests. Every kilobyte is a real cost, not a lighthouse score.
- **375px is a first-class width**, not a fallback.
- **No borrowed visual language.** No motifs, patterns, or imagery drawn from
  Indigenous art traditions. Jake has no standing to use them and the site
  would be worse for it. Ground the design in the *situation*, not the culture.
- **No photography** currently exists and none is licensed.
- Astro 6 + Svelte islands + Tailwind 4. One tokens file, one design system.
- 500+ pages already exist. Whatever is chosen must survive being applied to a
  glossary term, a 42-record ledger, and a 3,000-word article.

## 5. What is wrong with the current design

Not "it isn't modern." Specifically:

- Rounded cards with soft shadows on a warm off-white — a 2023 Tailwind
  template. It reads as generic because it is.
- Five muted earth ramps (stone, sage, water, clay, berry) colour-code the four
  branches, but the ramps are so low-chroma they failed a colour-blindness
  validator when used to carry meaning. The palette is decorative, not working.
- Hierarchy is flat. Everything is a card of roughly equal weight, so nothing
  announces itself as the answer.
- No signature. Nothing about it would be recognised again.

## 6. The three defaults to avoid

From `BUILD-PLAYBOOK.md`. Each is legitimate if the brief calls for it; none is
legitimate as a default, and this brief does not call for any of them.

1. Warm cream ground, high-contrast serif, terracotta accent.
2. Near-black with a single acid-green or vermilion accent.
3. Broadsheet layout, hairline rules, zero radius, dense columns.

The site already committed #1 once, on the news layer, and it was removed on
4 August. Do not walk back into it.

---

# The directions

Each is stated as: the idea, a token system, a layout concept, a signature
element, and an honest account of what it costs. The critique question is
applied to each — *would this appear on any site in this category?*

---

## Direction A — The counter

**The idea.** Design for the moment the site is actually used: standing at a
counter — a pharmacy, a dentist's desk, a band office, on hold with the CRA —
needing to know what to say and what to bring. The carry cards already embody
this; the whole site could.

Everything is answer-first. The page opens with the answer in one sentence, at a
size you can read at arm's length in bad light, before any explanation. Detail
is there, underneath, collapsed until asked for.

**Tokens.**

| Role | Value | Note |
|---|---|---|
| Ground | `#FFFFFF` | Plain white. Not off-white, not cream. |
| Ink | `#141414` | Near-black, very high contrast. |
| Quiet | `#5A5A5A` | Secondary text only. |
| Rule | `#E0E0E0` | Dividers. There are very few. |
| Signal | one saturated colour, TBD in build | Means "this is the answer" and nothing else. Never decorative. |
| Caution | one amber | "This depends on your situation." Used sparingly. |

Two faces. A workhorse sans with a genuinely large x-height for the answer and
body — something with more character than Inter but as legible. A utility face
at small sizes for dates, sources and labels.

**Layout.**

```
┌──────────────────────────────┐
│ Strong Fire                  │
├──────────────────────────────┤
│                              │
│ Can I get help with dental   │
│ if I have status?            │
│ ─────────────────────────    │
│                              │
│ Yes, if you are registered.  │
│ NIHB covers most of it.      │  ← the answer, 28–32px, first
│                              │
│ ▸ What's covered             │
│ ▸ What to bring              │  ← detail, collapsed
│ ▸ If they ask you to pay     │
│                              │
│ Checked 4 Aug 2026 · source  │
└──────────────────────────────┘
```

No cards. No shadows. Radius at or near zero. Whitespace does the separating.

**Signature.** *The answer line.* Every page in the site opens with one
sentence, set larger than anything else on the page, that answers the question
the page is named after. It is a content discipline as much as a visual one —
you cannot ship a page until you can state its answer in one sentence.

**Critique.** Is this a default? Partly — flat, high-contrast, public-service
design is a recognisable school (GOV.UK and its descendants). What makes it a
choice here rather than a borrowing is the answer-line discipline, which comes
from the use case and not from the school. Without the answer line this is just
GOV.UK, and that would be a default.

**What it costs.** Cold. Clinical. Public-service design carries an
institutional smell, and this audience's relationship with institutional forms
is the exact thing to be careful about. It also throws away the existing warmth
entirely, which some people already responded to.

---

## Direction B — Show your work

**The idea.** The site's real differentiator is that it says what is known,
what is not, and when it was last checked. The figure registry, the confidence
ratings, the open-questions register, the stage rail — the machinery already
exists. Make it the design.

Trust is earned visibly rather than asserted. Every claim carries its provenance
in the type system itself, not in a footnote.

**Tokens.**

| Role | Value | Note |
|---|---|---|
| Ground | `#FAFAF8` | Neutral, barely warm. Not cream. |
| Ink | `#1A1A1A` | |
| Verified | one deep green | Checked, dated, sourced. |
| Unsettled | one amber | Genuinely not resolved. Used honestly and often. |
| Contested | one red-violet | Before a court, disputed. |
| Rule | `#DEDEDA` | |

Three faces, and the third is load-bearing: a workhorse sans for reading, a
tighter sans for headings, and **a monospace for the apparatus** — dates,
sources, confidence, figures. The monospace is the tell that this is a record
and not an opinion.

**Layout.** A persistent evidence margin. On desktop it is a right rail; on
phone it collapses to a strip under the heading. It is never absent.

```
┌────────────────────────────┬─────────────┐
│ Non-Insured Health         │ CHECKED     │
│ Benefits                   │ 4 Aug 2026  │
│                            │             │
│ Dental, vision,            │ SOURCE      │
│ prescriptions, medical     │ ISC / NIHB  │
│ travel.                    │             │
│                            │ SETTLED     │
│ ...                        │ ▰▰▰         │
│                            │             │
│ Coverage is approved per   │ UNSETTLED   │
│ request, not as a yearly   │ hours vary  │
│ allowance.                 │ by region   │
└────────────────────────────┴─────────────┘
```

**Signature.** *The evidence margin.* Every page, every time. A reader learns
within two pages that this site tells them how solid each thing is, which is
the whole trust proposition made structural.

**Critique.** Is this a default? The monospace-for-metadata move is common in
developer tooling and rare in consumer information design, which is what makes
it feel specific here. The risk is that it reads as a *dashboard* — and the
audience is not analysts. Mitigation: the margin must be quiet and small; the
answer still comes first.

**What it costs.** It is the most likely of the three to drift back toward
"publication", which is the failure mode this project keeps repeating. It also
demands that every page actually *has* provenance — pages that do not will look
broken, which is either a feature or a lot of work.

---

## Direction C — Plain and warm

**The idea.** Institutions have failed this audience. The counter-move is a site
that reads as though a person made it for you: roomy, unhurried, conversational,
with the visual restraint of something handmade rather than templated.

Warmth achieved through **space and voice**, not through texture, ornament or
colour temperature. That distinction is the entire discipline of this direction.

**Tokens.**

| Role | Value | Note |
|---|---|---|
| Ground | `#FBFAF9` | Barely off-white. **Not** `#F4F1EA`. |
| Ink | `#1F1D1B` | |
| Quiet | `#6B6864` | |
| Accent | one muted blue-green | Deliberately *not* terracotta, to stay clear of the tell. |
| Rule | none | Space separates. Rules are avoided almost entirely. |

Two faces, both humanist rather than geometric. Generous line height, a
narrower measure than usual, asymmetric margins.

**Layout.**

```
┌──────────────────────────────┐
│  Strong Fire                 │
│                              │
│                              │
│  You asked about dental.     │
│                              │
│  Short answer: you're        │
│  probably covered.           │
│                              │
│  Here's what to bring, and   │
│  what to say if they ask     │
│  you to pay up front.        │
│                              │
│  ───────────                 │
│                              │
│  Take your time.             │
└──────────────────────────────┘
```

**Signature.** *Second-person address, structurally.* Headings are what she
said, not what the topic is called. "You asked about dental" instead of
"Non-Insured Health Benefits". The visual design exists to support a voice
change, and the voice is the memorable thing.

**Critique.** Is this a default? **This is the closest to the forbidden one**,
and it must be watched. Off-white plus humanist type plus warmth is one small
step from cream-serif-terracotta. What keeps it honest: no serif display face,
an accent that is deliberately cool rather than warm, and no rules or texture.
If the build starts reaching for a serif or a terracotta, the direction has
failed and should be abandoned rather than rescued.

**What it costs.** Hardest to execute well and easiest to get wrong. Also the
weakest for the second audience — a finance director scanning the ledger does
not want to be spoken to gently.

---

# Recommendation

**Direction A, with the evidence margin from B as a secondary element.**

The reasoning: the person this site is for arrives with a question and some
anxiety, and the single most valuable thing the design can do is put the answer
in front of her immediately, legibly, on a cheap phone. That is Direction A's
whole premise, and the answer-line discipline forces the content to improve too
— which is the next work anyway.

B's evidence margin is the site's real differentiator and should survive, but as
a quiet supporting element rather than the organising idea. Made central, it
pulls back toward the publication failure mode.

C is the most interesting and the most likely to fail. Worth revisiting once the
site has a stronger spine.

# How to run the session

1. Read `CLAUDE.md`, `DECISIONS.md` and this file. Nothing else.
2. Load `/frontend-design` **before** the first line of markup.
3. Pick one direction. Do not blend all three.
4. Build the token system in `src/styles/global.css` first, then one page
   end-to-end — `/rights/nihb` is the best test, since it is a real answer page.
5. Look at it in Chrome at 375, 768 and 1440 before going further.
6. Only then apply it outward. Expect three to five passes; the first will look
   generic and that is normal.

**Set the bar before starting, and revert unless clearly better** — the same
rule that governed the Fable trial in July, and the reason that trial produced a
usable answer instead of a vibe.

# On which model

Jake's own Fable trial (9–20 July, both briefs) was evaluated and reverted:
clearly not better on the World Brief, marginally better on connective synthesis
for the Daily Call but worse on multi-sourcing. That was news synthesis, not
visual design, so it does not transfer — but the method does. Pick a model, set
the bar in advance, and hold to revert-unless-clearly-better.

The brief matters more than the model. This document exists so that whichever
model runs the session, it starts from a point of view rather than from "make it
modern."
