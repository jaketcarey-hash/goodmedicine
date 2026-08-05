# Content Review — August 2026

**Date:** 4 August 2026
**Method:** Every figure checked against its primary source, fetched through a real
browser. `curl` and most fetch tools are blocked by canada.ca's WAF, which is why prior
cycles fell back on secondary sources — and why one of them was wrong.
**Supersedes:** the 1 August automated audit, which was substantially incorrect.

---

## The headline

The automated audit had been carrying three CRITICAL items across three cycles. **Two
were false positives.** The code was right and the audit was wrong; applying its
recommended fixes would have introduced real errors into a live tax tool. It also
**missed the largest change of the year entirely** — the GST/HST credit was replaced,
not re-indexed.

The pattern in every false positive was the same: the audit derived an "expected" value
by indexing last year's number itself, then reported the difference as an error. That is
not verification. Every figure below was checked against the government page that
publishes it.

---

## Verified correct against primary sources

| Figure | Value | Source |
|---|---|---|
| Federal first bracket | 14% | Reduced from 15% effective 1 Jul 2025 |
| CCB under 6 / 6–17 | $8,157 / $6,883 | CRA "How much you can get" |
| CGEB single / couple / child | $679 / $890 / $234 | CRA "How much you can get" |
| CPP rate / YMPE / exemption | 5.95% / $74,600 / $3,500 | CRA rates & maximums |
| CPP2 rate / AYMPE / max | 4% / $85,000 / $416 | CRA CPP2 rates & maximums |
| EI rate / max insurable | 1.63% / $68,900 | CRA EI premium rates |
| EI maximum weekly | $729 | Service Canada |
| OAS 65–74 / 75+ | $751.97 / $827.17 | Service Canada payment amounts |
| Home Buyers' Plan | $60,000 | CRA |
| FHSA first-year room | $8,000 | CRA |
| Capital gains inclusion | 50% | Increase cancelled Mar 2025, never enacted |

---

## Corrected this cycle

### 1. GIS single maximum was wrong — $1,105.43 → **$1,123.17**
The only figure error found. It came from a secondary source during the July fix pass.
Service Canada's own table says $1,123.17 for the July–September 2026 quarter. Affected
`supporting-elders.astro` in two places and the Benefits Finder.

### 2. GST/HST credit was replaced, not re-indexed
CRA's page now reads: *"The GST/HST credit has been renamed the Canada Groceries and
Essentials Benefit (CGEB) as of July 2026."* The site was showing the expired $533. Now
$679 / $890 / $234, with the old name kept alongside the new one because that is still
what people call it and what older paperwork says.

### 3. A source URL in the figure registry was a genuine 404
The EI premium-rates URL returned "Not Found". Replaced, and **all 13 registry sources
upgraded to the primary government pages** that publish each figure, each confirmed live.

### 4. NIHB counselling: "22 hours per year" removed
ISC publishes no fixed hourly allowance. Coverage is approved per request, depends on
clinical need, and varies by region. Stating a specific number as fact was misleading in
a way that could stop someone asking for what they need. Rewritten to say how it actually
works, and to tell the reader to ask.

### 5. 9-8-8 added — it was missing entirely
Canada's Suicide Crisis Helpline has existed since November 2023 and appeared nowhere on
a site that discusses financial stress and hardship. Added to the resources page and the
disclaimer. ISC's own NIHB mental-health page now leads with it.

All four existing crisis numbers were verified correct against official pages:
Hope for Wellness 1-855-242-3310, Residential Schools 1-866-925-4419, Kids Help Phone
1-800-668-6868, Jordan's Principle 1-855-572-4453.

---

## Do not re-flag these

**The 14% first bracket, the 26%/29% thresholds, the 1.63% EI rate, and the 50% capital
gains inclusion rate are all correct.** They were flagged as errors in prior cycles and
verified against primary sources on 4 August 2026. Note the EI rate specifically: 2025
was 1.64% and 2026 is 1.63%, so a year-over-year comparison looks like a regression and
is not one.

**City rent data is not a CMHC comparison.** Three cycles asked for Vancouver, Toronto
and Halifax rents to be revised down against CMHC's averages. That benchmark is wrong for
this tool — CMHC covers all occupied purpose-built units including long-tenured ones, so
it runs well below market. Its 2025 Vancouver *two*-bedroom average was ~$2,363, below
what a one-bedroom lists at now. Someone working out whether they can afford to move needs
the number they will be quoted. Re-check against listing data, not CMHC. Reasoning is
recorded in `simulator-data.ts`.

---

## Organisation names — a second audit, and a worse one

The figure audit checked numbers. It did not check **who organisations are**, and that
turned out to be where the real errors were. Numbers at least get flagged when they look
odd; a confidently wrong description of an organisation reads as authoritative forever.

### 1. The Indigenous Leadership Circle was described as an RBC body
`career-growth.astro` said: *"many large organizations have Indigenous employee networks.
**At RBC, it's the Indigenous Leadership Council.**"*

Wrong three ways. It is the Indigenous Leadership **Circle**, not Council. It is
**independent** — a membership network started by eleven co-founders for First Nations,
Métis and Inuit business leaders (indigenouslc.com), with no employer affiliation. And
naming one bank at all was a positioning leak on a site whose own footer says it is
unaffiliated with any bank, firm or government agency.

Now described accurately as an independent network, alongside a generic note about
employer networks that no longer names anyone. The same error was in the personal memory
file for the contact who is a member; corrected there too.

### 2. CCAB is now CCIB
The Canadian Council for **Aboriginal** Business became the Canadian Council for
**Indigenous** Business. Three references updated, keeping a "formerly known as" note
because the old acronym is still all over older material.

### 3. AFOA's expansion was retired branding
AFOA Canada presents itself as "the centre for excellence for Indigenous management,
finance and governance". It does not use "Aboriginal Financial Officers Association"
anywhere on its own site. Three references updated.

### What was checked and left alone

The tempting move was to sweep "Aboriginal" everywhere. That would have introduced
errors. These are current official names and must stay:

- **National Aboriginal Capital Corporations Association** — NACCA's legal name
- **Aboriginal Financial Institutions (AFIs)** — ISC and NACCA's own term
- **Certified Aboriginal Financial Manager (CAFM)** — verified live on AFOA's certification page
- **Aboriginal Entrepreneurship Program** — verified live as ISC's programme name

### For the next cycle

Audit organisations, not just figures. For each named body check: is the name current, is
the description of what it does accurate, and is its affiliation right. Organisations
rebrand quietly and nothing in the build catches it.

---

## Structural change: this file is no longer the control

Twenty-one figures now live in `src/data/figures/2026.json`, each with its value, source,
verification date and review date. Pages and calculators read the same key, so prose and
arithmetic cannot disagree — which is what had gone wrong between `taxes.astro` and the
Benefits Finder.

`npm run build` fails on any figure past its `reviewBy`. A document asking someone to act
is not a control; a build that will not complete is.

Next automatic gate: **31 October 2026**, when the OAS and GIS quarterly figures come due.

---

## Still outstanding

- **18 pages still stamped March 2026.** This cycle reviewed the figure-bearing pages
  only. The remaining pages are conceptual content whose claims do not carry dates, but
  they have not been read since March. Prose review due September.
- **CPP maximum and average monthly** ($1,507.65 / $925.35) rest on a secondary source.
  Service Canada's quarterly figures page blocks automated access — verify by hand.
- **Canada Dental Care Plan** is still not mentioned. Relevant where some family members
  have Status and others do not.
- **RDSP** appears only in the glossary. For First Nations people with disabilities it is
  among the most generous vehicles in Canada.
- **CPP2 explainer.** The calculation exists; the plain-English explanation does not.
