# Content Review — July 2026

**Date of review:** July 1, 2026
**Supersedes:** June 2026 review (status of all prior findings tracked below)
**Reviewer:** Automated content audit
**Scope:** All `.astro` pages under `src/pages/`, `src/lib/tax-estimator.ts`, `src/lib/simulator-data.ts`, `src/components/BenefitsFinder.svelte`, `src/lib/glossary-data.ts`, `src/lib/calendar-events.ts`, `src/lib/settlement-math.ts`

---

## Summary

Two new critical errors were introduced in the tax calculation logic during the June update
cycle. The federal first-bracket rate is coded as **14%** in both calculation files — the
actual Canadian rate is **15%** and always has been. Additionally, the third and fourth
federal bracket thresholds are significantly too high (by ~$18K and ~$38K respectively),
causing the Tax Estimator and Life Simulator to understate federal income tax for moderate-
to-high earners.

Today (July 1) also marks the start of the **2026–2027 CCB and GST credit benefit year**.
`BenefitsFinder.svelte` was not updated before the reset and now shows CCB amounts that
are a full year behind. The article pages (`taxes.astro`, `raising-family.astro`) were
updated, creating a visible inconsistency between tools.

**Fixes from the June review:** CPP_MAX_PENSIONABLE is now consistent across both files
($74,600). The TFSA lifetime room figure was corrected ($109,000). The GST credit was
updated from $519 to $533. Several article pages were updated to June 2026. The disclaimer
review date was updated. Prior item 2 (app name) was a false alarm — "Strong Fire" is
correct.

---

## CRITICAL — Wrong or Internally Inconsistent Information

### 1. Federal first-bracket rate is 14% in both tax files — should be 15%

**Files:** `src/lib/tax-estimator.ts:8`, `src/lib/simulator-data.ts:71`

Both files set the first federal bracket rate to `0.14` (14%). The actual Canadian federal
first-bracket rate is **15%** and has been 15% since 2015. This is not a rounding issue.

**Impact:** The estimator understates federal tax by approximately **$435/year** for a
person earning $60,000. Users may plan their finances assuming more take-home pay than they
will actually receive.

**Fix:**
```ts
// tax-estimator.ts line 8
[58_523, 0.15],   // was 0.14

// simulator-data.ts line 71
{ limit: 58_523, rate: 0.15 },   // was 0.14
```

---

### 2. Federal 26% and 29% bracket ceilings are significantly too high

**Files:** `src/lib/tax-estimator.ts:10–11`, `src/lib/simulator-data.ts:73–74`

The current code and the reference brackets provided for this review:

| Bracket | Code (current) | Expected (~2026 indexed) | Difference |
|---|---|---|---|
| 26% ceiling | $181,440 | ~$162,800 | +$18,640 too high |
| 29% ceiling | $258,482 | ~$225,940 | +$32,542 too high |

The 2025 actual thresholds were $158,519 and $220,000. At ~2.7% indexation for 2026,
the expected values are approximately $162,800 and $225,940. The code's values are far
outside what indexation can explain and do not match the reference brackets provided.

**Impact:** Anyone earning between ~$163K and $181K is taxed at 26% instead of 29%.
Anyone earning between ~$226K and $258K is taxed at 29% instead of 33%. These users see
meaningfully understated tax bills.

**Fix:** Verify the correct 2026 thresholds from the CRA T1 General guide or the CRA
indexed amounts table and update both files. The first two bracket widths ($58,523 and
$58,522) appear correctly indexed.

---

## IMPORTANT — Outdated Amounts or Rates

### 3. CCB amounts in BenefitsFinder.svelte are one benefit year behind — as of today

**File:** `src/components/BenefitsFinder.svelte:203–204, 291`

Today is July 1, 2026: the first day of the 2026–2027 CCB benefit year. The component
still shows:
- Under 6: **$7,787/year** (2025–2026 value)
- Ages 6–17: **$6,570/year** (2025–2026 value)

The current 2026–2027 amounts, already correct in `taxes.astro` and `raising-family.astro`:
- Under 6: **$8,157/year** ($679.75/month)
- Ages 6–17: **$6,883/year** ($573.58/month)

The inconsistency is now visible to any user who reads both the article pages and the
Benefits Finder in the same session.

**Fix:** Update both `value` strings and the description text referencing "$7,787" in
`BenefitsFinder.svelte`. The urgent callout "estimated $12,000 to $15,000 per year" for
a single parent who hasn't filed remains approximately valid (two children under 6 at
$8,157 = $16,314/year maximum), but the lower bound of the range should be recalculated.

---

### 4. GST/HST credit amount is now the expired 2025–2026 value

**Files:** `src/lib/tax-estimator.ts:48–49`, `src/pages/money/taxes.astro:38`

`tax-estimator.ts` reads:
```ts
// ---- GST credit rough estimate (single adult, July 2025–June 2026) ----
const GST_CREDIT_SINGLE = 533;
```

`taxes.astro` line 38 reads: *"up to $533/year for a single person (2025-2026)"*

Both explicitly label these as the 2025–2026 amounts, which ended yesterday. The
2026–2027 GST/HST credit base amounts should be confirmed from the CRA July 2026 benefit
notice and both files updated. Based on CPI indexation, the new single-adult amount is
likely in the $547–$555 range.

---

### 5. EI maximum weekly benefit is the 2024 figure

**File:** `src/components/BenefitsFinder.svelte:278`

Shows: `"to an estimated maximum of $668 per week"`

$668/week was the 2024 EI maximum. With 2026 maximum insurable earnings of $68,900 at a
55% benefit rate, the 2026 weekly maximum is approximately **$729/week**. (The 2025
maximum was $695/week.) This is carried from the June review — not yet fixed.

---

### 6. EI premium rate is 1.63% — 2025 rate was 1.64%

**Files:** `src/lib/tax-estimator.ts:45`, `src/lib/simulator-data.ts:154`

Both files: `const EI_RATE = 0.0163`. The 2025 employee EI rate was **1.64%**, not 1.63%.
The 2026 rate should be confirmed from the EI premium rate notice and updated in both files
at the same time as the bracket corrections above. Carried from June review.

---

### 7. OAS and GIS monthly amounts need quarterly verification

**File:** `src/components/BenefitsFinder.svelte:243, 253`

Shows: GIS **$1,065/month** (single), OAS **$727/month**. These are CPI-adjusted each
quarter. As of July 1, 2026 a new quarter begins. Verify both figures against the
Service Canada Q3 2026 (July–September) payment rates and update if they have changed by
more than $10. Carried from June review.

---

### 8. City cost-of-living data may be stale — verify against CMHC data

**File:** `src/lib/simulator-data.ts:34–52`

The June review identified this as needing verification. The file header was updated to
"2026 estimates" but the underlying rent figures appear unchanged (Vancouver $2,400,
Toronto $2,300, Halifax $1,600). If these reflect October 2024 or earlier CMHC data,
some markets may have shifted by 5–15%. Verify using the most recent CMHC Rental Market
Report and update figures that have drifted by more than 10% from the current survey.

---

### 9. CPP maximums in supporting-elders.astro — not verified this cycle

**File:** `src/pages/path/supporting-elders.astro` (CPP maximum retirement pension)

The June review flagged average/maximum CPP figures as outdated ($1,365 maximum cited
when 2025 maximum was ~$1,433). This was not confirmed as fixed. The 2026 CPP maximum
would be slightly higher. Verify and update. Also note: CPP2 contributions for earnings
above the YMPE (see Recommendation A below) are not reflected in this page.

---

### 10. NIHB mental health session limit — verify annually

**File:** `src/pages/rights/nihb.astro`

The June review noted that the "22 hours of counselling per year" figure needs annual
verification against ISC NIHB policy, which is subject to regional variation. Not
confirmed as checked this cycle. Carry forward.

---

## MINOR — Stale Labels, Cosmetic

### 11. FHSA "newer (launched 2023)" phrasing is now three years dated

**File:** `src/pages/money/saving.astro:80`

*"The First Home Savings Account is newer (launched 2023)"* — carried from June review.
Consider removing the launch year parenthetical.

### 12. Article pages with lastUpdated="March 2026" — not yet overdue

Pages with `lastUpdated="March 2026"` (19 pages) are 4 months old today. None exceed the
6-month threshold. **Flag for review in September 2026** when these pages will be at the
6-month mark.

### 13. Disclaimer review date should be updated after above fixes are applied

**File:** `src/pages/disclaimer.astro`

Currently reads: *"Content was last reviewed June 2026."* Update to "July 2026" once
the corrections in this cycle are applied.

### 14. settlement-math.ts CURRENT_YEAR — correct now, flag for January 2027

**File:** `src/lib/settlement-math.ts:27`

`const CURRENT_YEAR = 2026;` — correct today. Add a reminder to update on January 1, 2027.

---

## Status of All June 2026 Review Findings

| # | Finding | Status |
|---|---|---|
| 1 | CPP_MAX_PENSIONABLE inconsistency between files | **FIXED** — both files now use $74,600 |
| 2 | App name in disclaimer ("Strong Fire" flagged as wrong) | **FALSE ALARM** — "Strong Fire" is the correct app name; repo is named goodmedicine from old working title |
| 3 | CCB amounts stale (2024–2025 values in multiple files) | **PARTIALLY FIXED** — article pages updated to 2026–2027; BenefitsFinder.svelte still stale (now July 2026 critical) |
| 4 | Federal tax thresholds labeled 2025 | **PARTIALLY FIXED** — brackets updated but first-bracket rate changed to 14% (wrong!) and bracket 3/4 limits are incorrect (see new CRITICAL items 1–2) |
| 5 | EI rate 0.0163 (should be 0.0164) | **NOT FIXED** — still 0.0163 in both files |
| 6 | OAS/GIS amounts need quarterly verification | **NOT VERIFIED** — carry forward |
| 7 | CPP maximums in supporting-elders.astro | **NOT CONFIRMED FIXED** — carry forward |
| 8 | EI max weekly benefit $668 (2024 value) | **NOT FIXED** — still $668 in BenefitsFinder |
| 9 | GST credit labeled (2024) at $519 | **PARTIALLY FIXED** — updated to $533 labeled 2025–2026; needs 2026–2027 update now |
| 10 | TFSA lifetime room understated at $95,000 | **FIXED** — now correctly shows $109,000 |
| 11 | City cost-of-living data labeled 2025 | **PARTIALLY FIXED** — file header updated; underlying data not verified |
| 12 | NIHB mental health session limit | **NOT VERIFIED** — carry forward |
| 13 | File header comments say 2025 | **FIXED** — headers updated to 2026 |
| 14 | Article pages lastUpdated — pages needing content updates | **FIXED** — taxes.astro, saving.astro, raising-family.astro, nihb.astro, section-87.astro updated to June 2026 |
| 15 | Disclaimer review date (March 2026) | **FIXED** — now says June 2026 |
| 16 | FHSA "newer (launched 2023)" language | **NOT FIXED** — minor, carry forward |
| 17 | Illustrative paycheque amounts | **NO ACTION TAKEN** — low priority, carry forward |

---

## Recommendations — New Content

### A. CPP2 (Second Additional Enhancement) — still not in any tool or article page

Since 2024, workers contribute an additional 4% on earnings between the YMPE ($74,600 in
2026) and the Year's Additional Maximum Pensionable Earnings (YAMPE, approximately
$81,900 in 2025; verify 2026 YAMPE). CPP2 is not reflected in either tax tool. Workers
earning above the YMPE ceiling may see larger CPP deductions than the estimator predicts.

The Tax Estimator should add a CPP2 calculation branch. The `/money/taxes` and
`/path/first-job` pages should explain CPP2 exists. Carried from June recommendations.

### B. Canada Dental Care Plan (CDCP) — still missing

The CDCP covers Canadians without employer dental benefits earning under $90,000/year. By
mid-2026, most eligible adults are enrolled. A callout on `/rights/nihb` explaining the
CDCP/NIHB relationship would help families where some members have Status (covered by
NIHB) and others do not (potentially eligible for CDCP). Carried from June.

### C. Canada Carbon Rebate — still missing from Benefits Finder

Quarterly payments for residents of provinces under the federal carbon backstop.
Requires only a filed tax return. Eligible amounts range from roughly $200–$450/year per
adult depending on province. Not mentioned in `/money/taxes` or the Benefits Finder.
Carried from June.

### D. RDSP dedicated article page

The RDSP appears only in the glossary and briefly in `saving.astro`. For First Nations
people with disabilities, the RDSP is among the most generous savings tools in Canada —
government contributions up to $4,500/year with no personal matching at low incomes. A
dedicated page would serve this audience. Carried from June.

---

## Priority Action List

Ordered by urgency and impact:

1. **[Immediate]** Fix federal first-bracket rate in `tax-estimator.ts` and `simulator-data.ts` (14% → 15%)
2. **[Immediate]** Fix federal 26% and 29% bracket thresholds in both files — verify against CRA 2026 T1 guide
3. **[This week]** Update CCB amounts in `BenefitsFinder.svelte` to 2026–2027 values ($8,157 / $6,883)
4. **[This week]** Confirm and update GST/HST credit 2026–2027 single-adult amount in `tax-estimator.ts` and `taxes.astro`
5. **[This week]** Update EI max weekly benefit in `BenefitsFinder.svelte` ($668 → verify current value, likely ~$729)
6. **[This month]** Verify and update OAS/GIS quarterly amounts for Q3 2026
7. **[This month]** Fix EI premium rate (0.0163 → 0.0164, then verify 2026 rate)
8. **[This month]** Verify city rent data against CMHC and update figures that have drifted >10%
9. **[This month]** Verify CPP maximums in `supporting-elders.astro`
10. **[September]** Review all 19 article pages with `lastUpdated="March 2026"` — they will hit 6 months
11. **[September]** Update disclaimer review date to "July 2026" after items 1–4 are complete
