# Content Review — August 2026

**Date of review:** August 1, 2026  
**Supersedes:** July 2026 review  
**Reviewer:** Automated content audit  
**Scope:** All `.astro` pages under `src/pages/`, `src/lib/tax-estimator.ts`, `src/lib/simulator-data.ts`, `src/components/BenefitsFinder.svelte`, `src/components/TaxEstimator.svelte`, `src/lib/glossary-data.ts`, `src/lib/calendar-events.ts`, `src/lib/settlement-math.ts`, `src/components/SettlementSimulator.svelte`

---

## Summary

The three CRITICAL items from the July 2026 review remain open: the **14% first federal bracket rate** (should be 15%) and the **incorrect 3rd/4th bracket thresholds** in both tax files were not fixed; the **BenefitsFinder CCB amounts** were not updated to 2026–2027 values. These are now over a month past the date they became urgent. If any of these tax calculation errors are real (not intentional 2026 changes that weren't documented), every user who has run an estimate since the June update cycle has received incorrect numbers.

This review adds four new findings: the **TaxEstimator Svelte component** still says "2025 rates" in its disclaimer; the **capital gains inclusion rate** in the glossary may be outdated; **mortgage down payment rules** in the glossary need updating for the December 2024 federal change; and the **SettlementSimulator** has its own hardcoded `2026` that is separate from (and inconsistent with) the `CURRENT_YEAR` constant in `settlement-math.ts`.

---

## CRITICAL — Wrong or Internally Inconsistent Information

### 1. Federal first-bracket rate coded as 14% — should be 15%
**Files:** `src/lib/tax-estimator.ts:8`, `src/lib/simulator-data.ts:71`  
**Status:** Not fixed. Carried from July 2026 review (originally flagged June 2026 cycle).

Both files set the first federal bracket rate to `0.14` (14%). The Canadian federal first-bracket rate has been **15%** since 2015. The task brief for this review also states 15% as the current first-bracket reference rate. This is not a marginal rounding difference.

**Impact:** The estimator understates federal tax by approximately **$435/year** for someone earning $60,000. For a user at $80,000, the error is approximately **$580/year**. All tax calculations in the Tax Estimator and Life Simulator are affected.

**Fix:**
```ts
// tax-estimator.ts line 8
[58_523, 0.15],   // was 0.14

// simulator-data.ts line 71
{ limit: 58_523, rate: 0.15 },   // was 0.14
```

**Verification note:** If a 2026 federal tax cut to 14% was actually legislated (there were proposals in 2024–2025), the code is correct but this must be documented and the disclaimer updated. The July review concluded this is an error, not a legitimate rate change.

---

### 2. Federal 26% and 29% bracket thresholds are significantly too high
**Files:** `src/lib/tax-estimator.ts:10–11`, `src/lib/simulator-data.ts:73–74`  
**Status:** Not fixed. Carried from July 2026 review.

| Bracket | Code (current) | Expected (~2026 indexed from 2025) | Difference |
|---|---|---|---|
| 26% ceiling | $181,440 | ~$162,800 | +$18,640 too high |
| 29% ceiling | $258,482 | ~$225,940 | +$32,542 too high |

The 2025 CRA thresholds were $158,519 and $220,000. At ~2.7% CPI indexation for 2026, the expected values are approximately $162,800 and $225,940. The code values are far outside indexation range. This causes the tool to assign lower marginal rates to upper-middle and high-income earners than they actually owe.

**Fix:** Pull the 2026 bracket thresholds from the CRA T1 General guide or the CRA's indexed amounts table (published each November), update both `FEDERAL_BRACKETS` in `tax-estimator.ts` and `federalBrackets` in `simulator-data.ts`. The first two bracket widths ($58,523 and $58,522) appear correctly indexed.

---

### 3. BenefitsFinder CCB amounts are the 2025-2026 values
**File:** `src/components/BenefitsFinder.svelte:203–204, 291`  
**Status:** Not fixed. Was identified as the start of the 2026-2027 CCB year on July 1.

The Benefits Finder still shows:
- Under 6: **$7,787/year** (2025-2026 amount)
- Ages 6-17: **$6,570/year** (2025-2026 amount)

The correct 2026-2027 amounts (already used in `taxes.astro:39` and `raising-family.astro:52`) are:
- Under 6: **$8,157/year** ($679.75/month)
- Ages 6-17: **$6,883/year** ($573.58/month)

Any parent using the Benefits Finder is told they qualify for $370 less per year (under-6 child) than they actually do. The urgent callout at line 156-158 (single parent missing "$12,000 to $15,000 per year") should also be reviewed — two 2026-2027 CCB payments of $8,157 already exceed $16,000/year, so the callout lower bound is now conservative and could be updated.

**Fix:** Update lines 203–204 and 291 in `BenefitsFinder.svelte` to 2026-2027 values.

---

## IMPORTANT — Outdated Amounts or Rates

### 4. EI maximum weekly benefit shows 2024 value ($668)
**File:** `src/components/BenefitsFinder.svelte:279`  
**Status:** Not fixed. Carried from July review.

`"to an estimated maximum of $668 per week"` — this was the 2024 EI maximum. Using the 2026 max insurable earnings already in the code ($68,900 × 55% ÷ 52 weeks = **~$729/week**), the current value is approximately $61 per week higher than shown. Over a typical 14-week claim, this understatement totals ~$854.

**Fix:** Update the value string to approximately `$729 per week` (verify the exact 2026 maximum from Service Canada).

---

### 5. GST/HST credit is the expired 2025–2026 amount
**Files:** `src/lib/tax-estimator.ts:48–49`, `src/pages/money/taxes.astro:38`  
**Status:** Not fixed. The 2026-2027 GST benefit year began July 1, 2026.

`tax-estimator.ts` comments `"July 2025–June 2026"` with `const GST_CREDIT_SINGLE = 533`. `taxes.astro` reads *"up to $533/year for a single person (2025-2026)"*. Both are now displaying the prior year's amount.

**Fix:** Confirm the 2026-2027 single-adult GST credit base amount from the CRA July 2026 benefit notice (expected approximately $547–$555, subject to CPI indexation). Update the constant in `tax-estimator.ts` and the figure/label in `taxes.astro:38`.

---

### 6. TaxEstimator component disclaimer says "2025 rates"
**File:** `src/components/TaxEstimator.svelte:356`  
**Status:** New finding (not in prior reviews).

The disclaimer inside the TaxEstimator Svelte component reads:
> *"These are rough estimates based on 2025 federal and provincial rates."*

All rate data in `tax-estimator.ts` is labelled as 2026 rates. This disclaimer is a year out of date and creates a credibility gap for anyone who notices it.

**Fix:** Change "2025" to "2026" on line 356.

---

### 7. Capital gains inclusion rate may be outdated
**File:** `src/lib/glossary-data.ts:55`  
**Status:** New finding.

The Capital gains glossary entry reads: *"In Canada, 50% of capital gains are added to your taxable income."*

The 2024 federal budget proposed increasing the inclusion rate from one-half to two-thirds for annual gains above $250,000 (individuals) and for all corporate/trust gains. As of August 2026, this change may have been enacted for the 2025 or 2026 tax year. If so, the glossary definition is wrong for higher-income users.

**Fix:** Verify the current inclusion rate against the 2026 CRA IT guides or T657 form. If the rate increased, update the glossary entry to: *"In Canada, one-half of capital gains (or two-thirds for gains above $250,000 in a year, for individuals) are added to your taxable income."* Also review `money/investing.astro` if it discusses capital gains tax treatment.

---

### 8. Down payment minimums in glossary reflect pre-December 2024 rules
**File:** `src/lib/glossary-data.ts:135–136`  
**Status:** New finding.

The Down payment entry reads: *"the minimum down payment is 5% for homes under $500,000"* — this reflects the rules before December 2024. The federal government raised the insured mortgage cap from $1 million to $1.5 million in December 2024 and adjusted the down payment tiers:
- 5% on the first $500,000
- 10% on the portion from $500,001 to $1,499,999
- 20% for purchases at $1,500,000 or more

Under the old rules, the old second tier applied from $500,001 to $999,999; the old 20% threshold was $1 million. The current rules significantly expand access for buyers in higher-cost markets (particularly BC and Ontario), which are relevant to many of the app's users.

**Fix:** Update the Down payment glossary entry to describe the three-tier structure with the current thresholds.

---

### 9. EI premium rate may be incorrect
**Files:** `src/lib/tax-estimator.ts:45`, `src/lib/simulator-data.ts:154`  
**Status:** Carried from July 2026 review.

Both files: `const EI_RATE = 0.0163`. The 2025 employee EI premium rate was **1.64%** (0.0164). Verify the 2026 rate from the EI premium rate notice (announced each autumn) and update both files alongside the bracket corrections.

---

### 10. OAS and GIS quarterly amounts need Q3 2026 verification
**File:** `src/components/BenefitsFinder.svelte:243, 253`  
**Status:** Carried from July 2026 review.

Shows: GIS **$1,065/month** (single), OAS **$727/month**. A new CPI adjustment applies from July 1, 2026. Verify both Q3 2026 maximums from the Service Canada quarterly notice and update if either has changed by more than $10 from the displayed value.

---

### 11. CPP maximums in supporting-elders.astro — not confirmed updated
**File:** `src/pages/path/supporting-elders.astro`  
**Status:** Carried from June and July reviews.

The June 2026 review flagged the CPP maximum retirement pension figure as showing the older ~$1,365/month when the 2025 maximum was approximately $1,433/month. This was not confirmed as fixed. The 2026 maximum would be slightly higher. Additionally, CPP2 contributions for earnings above the Year's Maximum Pensionable Earnings are not explained anywhere in the app.

---

### 12. City cost-of-living rent data may be conservative
**File:** `src/lib/simulator-data.ts:35–52`  
**Status:** Carried from July 2026 review (partially addressed in June — header updated to "2026 estimates" but underlying figures not verified).

Vancouver ($2,400/month), Toronto ($2,300/month), and Halifax ($1,600/month) may be underestimating 2026 average 1-bedroom rents. Verify against the most recent CMHC Rental Market Report or equivalent. If any city has drifted more than 10% from the displayed value, update it.

---

## MINOR — Stale Labels, Cosmetic

### 13. Seventeen article pages approaching 6-month threshold
**Status:** Will cross the threshold in September 2026.

Pages with `lastUpdated="March 2026"` (19 pages) will reach 6 months old in September 2026. **Schedule a content review pass for September 2026.**

Affected pages:
`money/banking.astro`, `money/budgeting.astro`, `money/credit.astro`, `money/debt.astro`, `money/investing.astro`, `money/seven-generations.astro`, `path/building-life.astro`, `path/career-growth.astro`, `path/first-job.astro`, `path/giving-back.astro`, `path/leaving-home.astro`, `path/supporting-elders.astro`, `rights/band-finances.astro`, `rights/education-funding.astro`, `rights/jordans-principle.astro`, `rights/treaty-payments.astro`, `self/confidence.astro`, `self/conversations.astro`, `self/stress.astro`

---

### 14. SettlementSimulator has its own hardcoded 2026
**File:** `src/components/SettlementSimulator.svelte:115, 117, 386`  
**Status:** New finding. Distinct from the `CURRENT_YEAR = 2026` in `settlement-math.ts` (which was noted as "correct, flag for January 2027").

The component directly uses the literal `2026` in depletion calculations rather than importing from `settlement-math.ts`:
```js
const depletionGeneration = Math.ceil((r.depletionYear - 2026) / 25);
```
This will silently produce wrong generation numbers in 2027 and beyond.

**Fix:** Either import `CURRENT_YEAR` from `settlement-math.ts` or replace the literal with `new Date().getFullYear()`.

---

### 15. NIHB mental health session limit needs annual verification
**File:** `src/pages/rights/nihb.astro`  
**Status:** Carried from prior reviews.

The page says *"22 hours of counselling per year"* for NIHB mental health benefits. This figure is subject to change and varies by region. Verify annually against the current ISC NIHB Policy Manual.

---

### 16. FHSA "newer (launched 2023)" language
**File:** `src/pages/money/saving.astro:80`  
**Status:** Carried from June and July reviews.

*"The First Home Savings Account is newer (launched 2023)"* — the FHSA is now three years old. Consider removing the parenthetical.

---

### 17. Disclaimer review date should be updated
**File:** `src/pages/disclaimer.astro:65`  
**Status:** Carried from July review.

Currently reads *"Content was last reviewed June 2026."* Update to "August 2026" once the corrections in this cycle are applied.

---

## Status of All July 2026 Review Findings

| # | Finding | Status |
|---|---|---|
| 1 | First-bracket rate 14% (should be 15%) | **NOT FIXED** — now CRITICAL item 1 in this review |
| 2 | 26% and 29% bracket thresholds too high | **NOT FIXED** — now CRITICAL item 2 |
| 3 | CCB amounts stale in BenefitsFinder | **NOT FIXED** — now CRITICAL item 3 |
| 4 | GST credit showing 2025–2026 year/amount | **NOT FIXED** — now Important item 5 |
| 5 | EI weekly max $668 (2024 value) | **NOT FIXED** — now Important item 4 |
| 6 | EI premium rate 1.63% (should be 1.64%) | **NOT FIXED** — now Important item 9 |
| 7 | OAS/GIS Q3 2026 verification | **NOT VERIFIED** — carried as Important item 10 |
| 8 | City rent data | **NOT VERIFIED** — carried as Important item 12 |
| 9 | CPP max in supporting-elders.astro | **NOT CONFIRMED FIXED** — carried as Important item 11 |
| 10 | NIHB mental health limit | **NOT VERIFIED** — carried as Minor item 15 |
| 11 | FHSA "newer (launched 2023)" | **NOT FIXED** — carried as Minor item 16 |
| 12 | March 2026 pages approaching threshold | **MONITORING** — September 2026 deadline |
| 13 | Disclaimer review date | **NOT FIXED** — carried as Minor item 17 |
| 14 | CURRENT_YEAR in settlement-math.ts | **CORRECT FOR NOW** — flag for January 2027 |

---

## Recommendations — New Content

### A. CPP2 (Second Additional Enhancement) — not in any tool or article
Since 2024, workers contribute an additional 4% on earnings between the Year's Maximum Pensionable Earnings ($74,600 in 2026) and the Year's Additional Maximum Pensionable Earnings (YAMPE, approximately $81,900 in 2025; verify 2026 value). The Tax Estimator does not calculate CPP2, meaning workers earning above the YMPE see understated payroll deductions. Add a CPP2 calculation branch to both tax files and a brief explainer to `/money/taxes` and `/path/first-job`. Carried from June and July recommendations.

### B. Canada Dental Care Plan (CDCP)
The CDCP provides dental coverage for Canadians without employer benefits and with family net income under $90,000/year. By mid-2026, most eligible adults are enrolled. A callout on `/rights/nihb` explaining the CDCP/NIHB relationship would help families where some members have Status (covered by NIHB) and others do not (potentially eligible for CDCP separately). A Benefits Finder result card for CDCP is also warranted. Carried from June and July recommendations.

### C. Canada Carbon Rebate
Quarterly payments for residents of provinces under the federal carbon pricing backstop. Requires only a filed tax return. Eligible amounts range from approximately $200–$450/year per adult depending on province. Not mentioned in `/money/taxes` or the Benefits Finder. Add to the Benefits Finder result set (tax-dependent, no status required) and a bullet point on `/money/taxes`. Carried from June and July recommendations.

### D. RDSP dedicated article page
The RDSP appears only in the glossary and briefly in `saving.astro`. For First Nations people with disabilities, the RDSP is among the most generous savings vehicles in Canada — government contributions up to $4,500/year at low incomes with no personal matching required. The DTC gateway and the RDSP's unique carry-forward rules deserve a dedicated explainer. Carried from prior recommendations.

---

## Priority Action List

| Priority | Action | File |
|----------|--------|------|
| **Immediate** | Fix first-bracket rate 14% → 15% | `tax-estimator.ts:8`, `simulator-data.ts:71` |
| **Immediate** | Fix 3rd and 4th bracket thresholds — verify against 2026 CRA tables | `tax-estimator.ts:10–11`, `simulator-data.ts:73–74` |
| **Immediate** | Update CCB amounts to 2026-2027 ($8,157 / $6,883) | `BenefitsFinder.svelte:203–204, 291` |
| **This week** | Update GST/HST credit year and amount to 2026-2027 | `tax-estimator.ts:48–49`, `taxes.astro:38` |
| **This week** | Update EI weekly max ($668 → ~$729) | `BenefitsFinder.svelte:279` |
| **This week** | Fix TaxEstimator disclaimer "2025" → "2026" | `TaxEstimator.svelte:356` |
| **This month** | Verify and update capital gains inclusion rate | `glossary-data.ts:55` |
| **This month** | Update down payment minimum thresholds | `glossary-data.ts:135–136` |
| **This month** | Verify OAS/GIS Q3 2026 amounts | `BenefitsFinder.svelte:243, 253` |
| **This month** | Verify and fix EI premium rate (0.0163 → confirm 2026 rate) | `tax-estimator.ts:45`, `simulator-data.ts:154` |
| **This month** | Verify city rent data against CMHC | `simulator-data.ts:35–52` |
| **This month** | Fix SettlementSimulator hardcoded 2026 | `SettlementSimulator.svelte:115, 117, 386` |
| **This month** | Verify CPP max in supporting-elders.astro | `path/supporting-elders.astro` |
| **September** | Review 17 pages with lastUpdated="March 2026" | Multiple |
| **September** | Update disclaimer review date | `disclaimer.astro:65` |
| **Ongoing** | Verify NIHB mental health session limit (22 hrs) | `nihb.astro` |
