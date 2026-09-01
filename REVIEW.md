# Content Review — September 2026

**Date:** 1 September 2026
**Method:** Automated scan of all article pages, figure registry, calculators, BenefitsFinder, simulator data, and glossary. Automated tools cannot open government URLs — amounts that have already been verified against primary sources in the August 2026 cycle are not re-flagged here. This report defers to that cycle's findings where they conflict with naive year-over-year comparisons.
**Supersedes:** The 4 August 2026 manual review.

---

## The headline

No CRITICAL items found. All tax rates, CPP/EI rates, and benefit amounts read from the figure registry, which was verified against primary government sources on 4 August 2026. The figures are consistent across tools — prose and arithmetic cannot disagree.

Two IMPORTANT items require action before the end of October: the OAS and GIS quarterly figures are due for re-check, and 15 article pages that were explicitly deferred in August to September prose review are still stamped March 2026.

---

## Do not re-flag these

The following were verified against primary sources in the August 2026 cycle and are recorded here to prevent a third cycle of false positives:

- **Federal first bracket 14%** — correct. Reduced from 15% effective 1 July 2025. Any automated comparison to "15% on the first $57K" is comparing to the prior-year rate.
- **EI rate 1.63%** — correct for 2026. 2025 was 1.64%. Year-over-year comparison looks like a regression; it is not one.
- **Capital gains inclusion 50%** — correct. The proposed two-thirds rate was cancelled March 2025 and never enacted.
- **City rent data in simulator-data.ts** — asking rents, not CMHC averages. Last reviewed August 2026. Re-check against listing data (Rentals.ca, PadMapper), not CMHC purpose-built averages. Three prior cycles flagged these as too high against CMHC — that benchmark is wrong for this tool; CMHC's 2025 Vancouver two-bedroom average was about $2,363, below what a one-bedroom lists at today.
- **TFSA cumulative room $109,000** — correct for someone who turned 18 in 2009 or earlier and never contributed (2009–2026 total). The 2026 annual limit of $7,000 (unchanged since 2024) is also correct.
- **GIS single maximum $1,123.17** — correct. Corrected in August from $1,105.43.
- **CGEB amounts** — $679 / $890 / $234 are correct. The GST/HST credit was replaced by the Canada Groceries and Essentials Benefit in July 2026. The old name is retained in the glossary because that is still what older paperwork says.

---

## IMPORTANT items

### 1. OAS and GIS quarterly figures — due October 31

The registry entries `oas_65_to_74` ($751.97), `oas_75_plus` ($827.17), and `gis_single` ($1,123.17) are the **July–September 2026 quarter** amounts. Their `reviewBy` date is **2026-10-31**.

Service Canada announces the October–December quarter in late September. The figures should be fetched directly from [Service Canada's payment amounts page](https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/payments.html) as soon as the new quarter is posted and updated in `src/data/figures/2026.json` before the build gate triggers.

**Action:** Check and update before 31 October 2026.

### 2. 15 article pages stamped March 2026 — September prose review overdue

The August review deferred these explicitly: *"18 pages still stamped March 2026 … Prose review due September."* Three have since been updated (raising-family, section-87, estates). The remaining 15 have not been read since March.

These are conceptual pages whose claims do not carry figures — so they will not trip the build gate — but they carry prose that may be stale.

**Pages due for prose review:**

| File | Branch |
|---|---|
| `src/pages/money/banking.astro` | Money |
| `src/pages/money/budgeting.astro` | Money |
| `src/pages/money/seven-generations.astro` | Money |
| `src/pages/path/building-life.astro` | Path |
| `src/pages/path/career-growth.astro` | Path |
| `src/pages/path/first-job.astro` | Path |
| `src/pages/path/giving-back.astro` | Path |
| `src/pages/path/leaving-home.astro` | Path |
| `src/pages/rights/band-finances.astro` | Rights |
| `src/pages/rights/education-funding.astro` | Rights |
| `src/pages/rights/jordans-principle.astro` | Rights |
| `src/pages/rights/treaty-payments.astro` | Rights |
| `src/pages/self/confidence.astro` | Self |
| `src/pages/self/conversations.astro` | Self |
| `src/pages/self/stress.astro` | Self |

**Suggested check for each:** organisational names current, phone numbers live, program descriptions match what the program actually does today. The August review found silent rebrands (CCAB→CCIB, AFOA, Indigenous Leadership Circle) that prose review would have caught.

### 3. CPP maximum and average monthly — still on secondary sources

`cpp_max_monthly_at_65` ($1,507.65) and `cpp_avg_monthly_new` ($925.35) remain sourced from Wealthsimple rather than Service Canada. Both are noted in the registry with "Secondary source. Service Canada's quarterly figures page blocks automated access; re-check by hand." Their `reviewBy` is 2027-01-31.

These figures are not in a quarter that is about to turn, so there is no urgency before October. Flag for manual verification at the next hands-on session.

---

## MINOR items

### 1. Glossary relatedTerms references to 'GST/HST credit'

Two glossary entries carry `relatedTerms` links to `'GST/HST credit'`:
- `src/lib/glossary-data.ts` — "Canada Child Benefit (CCB)" entry, line 511
- `src/lib/glossary-data.ts` — "T90 form (Section 87 exempt income)" entry, line 684

The standalone term is now "Canada Groceries and Essentials Benefit", not "GST/HST credit". If the glossary sheet resolves `relatedTerms` by term name lookup, these links will not resolve. Check whether the GlossarySheet component does fuzzy matching or exact matching. If exact, update to `'Canada Groceries and Essentials Benefit'`.

### 2. TFSA annual limit will need updating when 2027 limit is announced

`src/pages/money/saving.astro` line 46 states: *"$7,000/year (the 2026 limit, unchanged since 2024)"*. The 2027 limit is typically announced in November. When it is, update both the prose and, if the registry carries the figure, the registry entry. Currently correct.

---

## Verified correct — no action needed

| Item | Value | Status |
|---|---|---|
| Federal first bracket | 14% | Verified Aug 2026 |
| Federal basic personal amount | $16,452 | Verified Aug 2026 |
| CCB under 6 / 6–17 | $8,157 / $6,883 | Verified Aug 2026 |
| CGEB single / couple / child | $679 / $890 / $234 | Verified Aug 2026 |
| CPP rate / YMPE / exemption | 5.95% / $74,600 / $3,500 | Verified Aug 2026 |
| CPP2 rate / YAMPE | 4% / $85,000 | Verified Aug 2026 |
| EI rate / max insurable | 1.63% / $68,900 | Verified Aug 2026 |
| EI maximum weekly | $729 | Verified Aug 2026 |
| OAS 65–74 / 75+ | $751.97 / $827.17 | Jul–Sep 2026 quarter; next check Oct 2026 |
| GIS single maximum | $1,123.17 | Jul–Sep 2026 quarter; next check Oct 2026 |
| Home Buyers' Plan withdrawal | $60,000 | Verified Aug 2026 |
| FHSA lifetime limit | $40,000 | Current |
| TFSA annual limit 2026 | $7,000 | Correct |
| TFSA cumulative room (from 2009) | $109,000 | Correct for 2026 |
| Down payment minimums | 5% / 10% / 20% per glossary | Reflects Dec 2024 rule change |
| Capital gains inclusion | 50% | Verified; two-thirds proposal cancelled |
| Provincial first-bracket rates | All in tax-estimator.ts and simulator-data.ts | Consistent with 2026 rates |
| City rent data | August 2026 review | Re-check against listings, not CMHC |
| Payday loan maximum | $14 per $100 | Verified Aug 2026; reviewBy 2027 |
| Consumer proposal ceiling | $250,000 | Verified Aug 2026 |

BenefitsFinder.svelte reads all benefit amounts from the figure registry via `money()` and `moneyExact()`. It cannot drift from the registry. No hardcoded dollar amounts in the component.

---

## Outstanding content gaps (carried from August)

These were flagged in August and have not been addressed:

1. **Canada Dental Care Plan (CDCP)** — still not mentioned anywhere in the site. Relevant for households where some members have Status (and NIHB dental coverage) and others do not. NIHB and CDCP eligibility can overlap or interact; a page that explains what each covers, and what to do when a household member has one but not the other, would answer a real question.

2. **RDSP** — appears in the glossary only. For First Nations people with disabilities, the RDSP is among the most generous savings vehicles in Canada: up to $4,500 per year in government grants and bonds, often several times the holder's own contribution. It warrants a dedicated section in `money/saving.astro` at minimum.

3. **CPP2 plain-English explanation** — the arithmetic is in the calculator and the registry. The explanation of what CPP2 is, and why someone earning above $74,600 will see a larger deduction than they expect, does not exist in prose.

---

## Recommendation for next hands-on session

In priority order:

1. **Prose review of the 15 March-stamped pages** — no tools needed, just reading. Focus on organisations, phone numbers, and program descriptions. This was already due in September; it is now September.
2. **OAS/GIS October quarter update** — check Service Canada in late September and update the three registry entries before 31 October.
3. **Glossary relatedTerms links** — resolve whether the two 'GST/HST credit' relatedTerms references cause broken links; if so, update to the current term name.
4. **CPP max/average verification** — Service Canada by hand when next available.

---

## Next automatic gate

**31 October 2026** — OAS and GIS quarterly figures due. Build will fail after this date if the registry entries have not been updated.
