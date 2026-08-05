# Strong Fire — design brief

Written 5 August 2026, for a redesign session that has not happened yet.
Three directions, worked far enough to choose between. Pick one, then build it.

---

## 1. What this is

**A news-led information shop for First Nations people.** The front door is what is
happening — deals, court decisions, approvals, and crucially *what stage each one has
reached*. Behind that sits the depth: tools, rights guides, money guides, a glossary, a
directory of every First Nation in BC.

Someone arrives to find out what is going on. They stay, or come back, because they
discover the site also answers the question they have been carrying.

**Framing corrected by Jake, 5 August 2026**, refining the 4 August note. Both halves are
true and the distinction is exact:

- **Not a publication in *form*.** No feeds as a subscriber product, no citation
  apparatus, no scholarly methodology page, no second editorial identity with its own
  typeface. Three previous sessions drifted there because the ledger data *looks*
  scholarly. That drift is still the failure mode.
- **News-led in *function*.** The news is the entry point, not a shelf at the back. The
  4 August note said "the app comes first"; that ordering is superseded. What is not
  superseded is everything about apparatus.

The test for any feature is now two questions, in order: *does this help someone
understand what is happening?* and *does it lead them to something that helps them?*

## 2. Who it is for

**Primary — someone following the file.** A Nation member who wants to know what is
happening to Indigenous economic power in Canada. A band councillor, a finance officer,
an entrepreneur, someone who saw a headline about a deal in their territory and wants to
know whether it actually closed. They arrive at the front door, on a phone or a desktop,
and they come back.

Their question is not "what is the news" — plenty of outlets do that. It is **"is this
real yet, and what does it mean for us?"** Nobody else answers the first half.

**Secondary — someone with a specific question.** A 26-year-old in Lytton, on her phone,
mid-worry: *"Can I get help with dental if I have status?"* She matters enormously, but
she does **not** arrive at the front door. She lands on the page that answers her
question, from a search result or a link someone texted her. That was established on
4 August and still holds.

So the site has two entrances and they are not the same design problem:

| | Front door | Deep page |
|---|---|---|
| Who | Following the file | Carrying a question |
| Arrives at | `/`, `/nations` | `/rights/nihb`, a glossary term |
| Wants | What happened, how real is it | The answer, and what to do |
| Design job | Orient, and show status at a glance | Answer first, then explain |

**A design that only serves one of these fails.** The current site does the front door
adequately and the deep pages poorly, which is the same conclusion the depth work reached
from the other direction.

## 3. The job of the page

**Front door:** show what is happening and how settled it is, fast enough to scan, and
make the depth behind it visible rather than hidden.

**Deep page:** answer the question, then explain, then say what is unsettled and who to
ask.

Both share one obligation: **be trustworthy.** This audience has specific, earned reasons
to distrust financial institutions and government forms. The design either earns
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

**Direction B, with A's answer line carried into the deep pages.**

This changed on 5 August, and it changed because the framing did. When the brief was
written around the mid-worry reader, A was right — answer-first, legible at arm's length,
nothing in the way. Now that the front door is news and the primary reader is someone
asking *"is this real yet?"*, B is not merely a good option; it is the subject itself.

Status, provenance and confidence are not decoration on this site. They are the product.
The stage rail, the confidence ratings, the open-questions register and the figure
registry already exist and already carry that meaning — B makes them the organising idea
rather than machinery hidden behind ordinary cards.

A does not disappear. **The answer line is the right discipline for every deep page**, and
it forces the content improvement the depth work needs anyway. Take it as a rule for those
pages rather than as the site's organising idea.

C is set aside. It is the warmest and the most likely to fail, and it serves the primary
reader least.

**The one thing to watch:** B is also the direction most likely to drift back into
publication apparatus, which is the mistake this project keeps making. The guard is the
distinction in §1 — provenance shown *in the interface* is the point; feeds, citations and
a separate editorial identity are the failure.

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
