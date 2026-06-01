# Content Review — June 2026

**Date of review:** June 1, 2026  
**Supersedes:** May 2026 review (all prior findings remain unresolved)  
**Reviewer:** Automated content audit  
**Scope:** All article pages, tax/benefit data, cost-of-living data, glossary, hardcoded dates  
**App content last reviewed:** March 2026 (per disclaimer)  
**Next review due:** December 2026, or immediately following CRA's 2027 rate announcement

---

## Summary

A May 2026 review identified twelve issues. None have been resolved. This review confirms
all prior findings remain outstanding and adds one new item of elevated urgency: the
**CCB and GST credit benefit year resets on July 1, 2026** — 30 days from today. Once that
happens, displayed amounts will be a full benefit year behind and users approaching the
Benefits Finder ahead of the July payment cycle will see incorrect figures.

The single most actionable data issue remains the **CPP max pensionable inconsistency**
between the two tax libraries: `simulator-data.ts` uses the correct 2026 value ($71,300)
while `tax-estimator.ts` still uses the 2025 value ($68,500), causing the two tools to
produce different CPP deductions for identical income. This is a one-line fix.

---

## CRITICAL — Wrong or Internally Inconsistent Information

### 1. CPP max pensionable earnings inconsistency between tax libraries

**Files:**
- `src/lib/tax-estimator.ts:43` — `CPP_MAX_PENSIONABLE = 68_500` (2025 value — wrong)
- `src/lib/simulator-data.ts:152` — `CPP_MAX_PENSIONABLE = 71_300` (2026 value — correct)

**What's wrong:** The Tax Estimator and Life Simulator compute CPP contributions using
different maximum pensionable earnings ceilings. `simulator-data.ts` was updated to the
2026 YMPE ($71,300) but `tax-estimator.ts` was not. A user earning $75,000 will see
different CPP deductions in each tool — a direct internal contradiction.

The Tax Estimator undercalculates CPP by approximately $141/year for anyone earning above
$68,500 (difference of $2,800 × 5.95%).

**Fix:** `src/lib/tax-estimator.ts` line 43:
```ts
const CPP_MAX_PENSIONABLE = 71_300;  // 2026 YMPE — update each fall when CRA announces
```
This is a one-line change.

---

### 2. App name in disclaimer does not match the app

**File:** `src/pages/disclaimer.astro:11`

The disclaimer reads "Strong Fire provides general educational information..." The
codebase, repository, and CLAUDE.md all refer to this project as **Good Medicine**. Users
reading the disclaimer see a name that does not appear anywhere else in the interface.
Either the disclaimer was copied from a prior project or the app was renamed without
updating the disclaimer. Whichever it is, they need to match.

**Fix:** Confirm the correct name and update the disclaimer. If "Good Medicine" is
correct: change "Strong Fire" to "Good Medicine" at disclaimer line 11.

---

## IMPORTANT — Outdated Amounts or Rates

### 3. CCB benefit year resets July 1 — data will be a full year stale in 30 days

**Priority elevated from previous review. The July 2026 CCB/GST reset is 30 days away.**

**Files with stale CCB amounts:**
- `src/components/BenefitsFinder.svelte:204` — "$7,787 per child per year (under 6) or $6,570 (ages 6 to 17)"
- `src/pages/money/taxes.astro:38` — "$7,787 per child under 6 and $6,570 per child aged 6-17 (2024)"
- `src/pages/path/raising-family.astro:49–53` — labeled "2025-2026 benefit year" but shows 2024-2025 figures
- `src/lib/tax-estimator.ts` urgent callout in BenefitsFinder uses these same figures

The $7,787 and $6,570 figures are 2024–2025 benefit year values. The confirmed
2025–2026 values are:

| Age group | 2024–2025 (current in app) | 2025–2026 (correct now) | Monthly (2025–2026) |
|---|---|---|---|
| Under 6 | $7,787/year | $7,997/year | $666.42 |
| Ages 6–17 | $6,570/year | $6,748/year | $562.33 |

Note that `raising-family.astro` explicitly labels these as "2025-2026" amounts while
showing the 2024-2025 figures — the label and the numbers are directly contradictory.

After July 1, 2026, the 2026–2027 amounts will apply and the gap will widen further.
Verify 2026–2027 amounts on the CRA benefits payment page before July 1.

**Fix:**
1. Update `raising-family.astro` to show confirmed 2025–2026 amounts ($7,997 / $6,748)
   and correct the year label to "2025–2026."
2. Update `BenefitsFinder.svelte` with current amounts. Remove or update the urgent
   callout "$12,000 to $15,000 per year" — this estimate should be recalculated based
   on actual current CCB maximums (a single parent with two children under 6 at maximum
   CCB would receive ~$15,994/year in 2025–2026, so the range remains approximately valid
   but the floor should be updated to reflect current maximums).
3. Update `taxes.astro` — remove the "(2024)" label and use current benefit year figures.

---

### 4. All federal tax thresholds and BPA labeled 2025 — now in 2026 tax year

**Files:** `src/lib/tax-estimator.ts`, `src/lib/simulator-data.ts`

Both files carry 2025 federal tax values. The current tax year is 2026. CRA indexes
brackets and personal amounts annually; the 2026 values are indexed from 2025 by the
CRA's published indexation factor (verify with the 2026 T1 General guide or CRA
Indexation Adjustment table).

| Value | 2025 (in app) | Direction for 2026 | File | Line |
|---|---|---|---|---|
| Federal basic personal amount | $16,129 | Higher (~2–3%) | both | tax: 15, sim: 78 |
| First bracket ceiling | $57,375 | Higher | both | tax: 8, sim: 72 |
| Second bracket ceiling | $114,750 | Higher | both | tax: 9, sim: 73 |
| Third bracket ceiling | $158,468 | Higher | both | tax: 10, sim: 74 |
| Fourth bracket ceiling | $220,000 | Higher | both | tax: 11, sim: 75 |
| EI max insurable earnings | $65,700 | Higher | both | tax: 46, sim: 157 |
| GST credit (single) | $519 | Higher | tax-estimator only | 49 |

Provincial basic personal amounts (tax-estimator.ts lines 25–38) are also 2025 values
and should be updated in tandem.

**Fix:** Update both files with 2026 CRA-published values. Update file header comments
from "2025 rates"/"2025 estimates" to "2026 rates"/"2026 estimates."

---

### 5. EI premium rate is 1.63% — 2025 employee rate was 1.64%

**Files:** `src/lib/tax-estimator.ts:45`, `src/lib/simulator-data.ts:154`

Both files use `EI_RATE = 0.0163`. The 2025 employee EI premium rate set by the
Employment Insurance Commission was **1.64%**, not 1.63%. This is a minor error
present in both tools. When updating to 2026 values, verify the 2026 EI rate at the
same time (it changes annually).

**Fix:** Update both files: `const EI_RATE = 0.0164;` — and verify the 2026 rate
when updating all 2026 values.

---

### 6. OAS and GIS amounts are stale — quarterly-adjusted benefits

**Files:** `src/pages/path/supporting-elders.astro:50–58`, `src/components/BenefitsFinder.svelte:242–253`

The app shows:
- OAS (age 65–74): ~$727/month
- OAS (age 75+): ~$800/month
- GIS (single): up to ~$1,065/month

OAS and GIS are adjusted quarterly. These figures were approximately correct in early 2025
and may have drifted. Verify current quarterly amounts at the Service Canada payment
amounts page before updating to avoid chasing a moving target. If values have changed by
more than $20, update and add "(approximate — adjusted quarterly)" qualification.

**Fix:** Check current quarterly rates on Service Canada. Update if off by more than $20.
Consider adding a note: "OAS and GIS amounts are adjusted quarterly — verify current
rates at Service Canada."

---

### 7. CPP maximums in supporting-elders.astro are outdated

**File:** `src/pages/path/supporting-elders.astro:41–42`

```
The average CPP payment is around $815/month...Maximum is about $1,365/month
```

The 2025 maximum CPP retirement pension at 65 was approximately $1,433/month.
The "average" figure also changes annually. The "$1,365" figure is at least one year
behind, and the CPP maximum has been rising due to the CPP enhancement that began
phasing in from 2019.

**Fix:** Update CPP maximum to current year value from Service Canada. Note that the
CPP2 second additional enhancement (see item 15 below) means future retirees will
receive more than current maximums.

---

### 8. EI maximum weekly benefit is stale

**File:** `src/components/BenefitsFinder.svelte:278`

"Up to 55% of previous earnings, to an estimated maximum of $668 per week"

The 2025 EI maximum was $695/week (55% × $65,700 / 52). For 2026, with an updated
maximum insurable earnings ceiling, the weekly maximum will be higher. Confirm from
the 2026 EI rate notice.

**Fix:** Update to current year's EI maximum weekly benefit.

---

### 9. GST/HST credit amount labeled "(2024)" in taxes.astro

**File:** `src/pages/money/taxes.astro:37`

"GST/HST credit — up to $519/year for a single person (2024), paid quarterly"

The 2025–2026 base amount for a single adult is approximately $533 (indexed from $519).
The "(2024)" label means users see a figure explicitly described as two years old on a
page marked as reviewed in March 2026. The GST credit single amount in `tax-estimator.ts`
(line 49: `GST_CREDIT_SINGLE = 519`) also needs updating.

The range in `BenefitsFinder.svelte` ("estimated $300 to $500 per year") starts below
the base amount even for 2024. Update to "$519 to $650+ per year depending on family
size and income."

**Fix:** Update `taxes.astro` line 37 to current benefit year amount and remove "(2024)"
tag. Update `GST_CREDIT_SINGLE` in `tax-estimator.ts` to 2026 value.

---

### 10. TFSA accumulated room figure is understated by $14,000

**File:** `src/pages/money/saving.astro:39`

"If you turned 18 in 2009 or earlier and never contributed, you have over $95,000 of room"

As of January 1, 2026, the cumulative room is $109,000:

| Period | Annual limit | Subtotal |
|---|---|---|
| 2009–2012 | $5,000 | $20,000 |
| 2013–2014 | $5,500 | $11,000 |
| 2015 | $10,000 | $10,000 |
| 2016–2018 | $5,500 | $16,500 |
| 2019–2022 | $6,000 | $24,000 |
| 2023 | $6,500 | $6,500 |
| 2024–2026 | $7,000 | $21,000 |
| **Total** | | **$109,000** |

The "$95,000" figure was accurate circa 2023. Understating available room may discourage
people from opening accounts or making contributions they are entitled to make.

On the same line: `"$7,000/year (2024-2025)"` — the 2026 limit is also $7,000. Update
to "(2024–2026)" or "currently $7,000/year — confirmed by CRA each fall."

**Fix:** Change "$95,000" to "$109,000." Update year range for the annual limit.

---

### 11. Cost-of-living data labeled as 2025 estimates

**File:** `src/lib/simulator-data.ts:4` and city data block (lines 34–52)

City rent data is labeled "2025 estimates" and is now one year stale. Vancouver ($2,400),
Toronto ($2,300), and Halifax ($1,600) are the most volatile markets. For the Life
Simulator, errors larger than ~15% from current market rates would materially mislead
users making relocation decisions.

**Fix:** Update city rent figures using the CMHC Rental Market Report (October 2025
edition or most recent). Update file header from "2025 estimates" to "2026 estimates."
The northern city data (Whitehorse $1,400, Yellowknife $1,600) should also be verified —
these markets have limited public data but costs are generally rising.

---

### 12. NIHB mental health session limit needs verification

**File:** `src/pages/rights/nihb.astro` (expandable section "For mental health")

"The program typically covers 22 hours of counselling per year, with more available
if clinically justified."

The NIHB mental health benefit limits are subject to regional variation and have been
under periodic review. The 22-hour figure needs to be verified against the current ISC
NIHB national benefits policy before the next review cycle.

**Fix:** Confirm current NIHB mental health session allowance with ISC documentation.
If changed, update. Add a note: "Coverage limits vary by region — confirm with your
regional NIHB office."

---

## MINOR — Stale Labels, Cosmetic Issues

### 13. File header comments say 2025 in both tax data files and TaxEstimator UI

**Files and lines:**
- `src/lib/tax-estimator.ts:2` — "Canadian tax estimator — 2025 rates."
- `src/lib/simulator-data.ts:4` — "All figures are 2025 estimates for illustration only."
- `src/components/TaxEstimator.svelte:356` — "rough estimates based on 2025 federal and provincial rates."

Update all three at the same time as the underlying rate values (items 3 and 4 above).

---

### 14. All 24 article pages show lastUpdated="March 2026"

Today is June 1, 2026. All pages fall within the 6-month threshold (September 2025
cutoff). No pages are overdue — but pages whose content is changed in this review
cycle should have `lastUpdated` updated to "June 2026."

Pages requiring content changes (and therefore a date update):
- `src/pages/money/taxes.astro`
- `src/pages/money/saving.astro`
- `src/pages/path/raising-family.astro`
- `src/pages/path/supporting-elders.astro`

---

### 15. Disclaimer review date is still March 2026

**File:** `src/pages/disclaimer.astro:56`

"Content was last reviewed March 2026."

**Fix:** Update to June 2026 after completing this review cycle.

---

### 16. FHSA "newer (launched 2023)" phrasing is now dated

**File:** `src/pages/money/saving.astro:79`

"The First Home Savings Account is newer (launched 2023)"

By mid-2026, the FHSA has three years of history. The phrasing makes the page feel
like it was written at launch. Consider: "The First Home Savings Account combines the
best features of TFSAs and RRSPs." (removing the launch year parenthetical).

---

### 17. Illustrative paycheque in first-job.astro has no year reference

**File:** `src/pages/path/first-job.astro` (expandable section, approximately lines 46–52)

The sample paycheque breakdown ($20/hour with CPP ~$85 biweekly, EI ~$25) is clearly
illustrative and in a collapsible section. CPP/EI rates drift annually. No immediate
action needed, but consider adding "(approximate — based on ~2026 rates)" to stay within
15% of accuracy as rates evolve.

---

## Glossary — Status After Full Review

No critical issues. Prior review confirmed:

- **Capital gains (50% inclusion rate):** Correct. The 2024 budget proposal to increase
  the inclusion rate was not legislated and has been withdrawn. 50% remains accurate.
- **Home Buyers' Plan ($60,000 limit):** Correct — updated from $35,000 in April 2024.
- **FHSA ($40,000 lifetime / $8,000/year):** Correct.
- **RDSP (up to $4,500/year in government contributions):** Correct.
- **Canada Learning Bond (up to $2,000):** Correct.
- **CCB description:** No specific dollar amounts cited — no update needed.
- **Down payment (5% for homes under $500,000):** Correct. Down payment rules unchanged.

---

## Recommendations — New Content

### A. CPP2 (Second Additional Enhancement) — missing entirely

Since 2024, workers contribute an additional 4% on earnings between the YMPE ($71,300
in 2026) and the Year's Additional Maximum Pensionable Earnings (YAMPE, approximately
$81,900 in 2025). This CPP2 contribution is not reflected in either tax tool and is not
mentioned in any article page.

Workers earning above the YMPE may not understand why their CPP deductions are larger
than expected. The `/money/taxes` and `/path/first-job` pages should acknowledge CPP2
exists. The Tax Estimator should include CPP2 in its calculation engine once 2026 rates
are confirmed (this requires a new `CPP2_RATE`, `CPP2_YAMPE` constant and an additional
calculation branch in `tax-estimator.ts` and `simulator-data.ts`).

### B. Canada Dental Care Plan (CDCP)

The federal Canada Dental Care Plan covers Canadians without employer dental benefits
earning under $90,000/year. By 2026, most eligible adults are enrolled. This program
significantly overlaps with the NIHB audience: Status First Nations are covered by NIHB
(which remains primary), but their non-Status family members may benefit from CDCP.

A callout on `/rights/nihb` explaining the CDCP/NIHB relationship would serve families
where some members have Status and others do not. A brief entry in the glossary under
"Canadian Programs" is also warranted.

### C. Canada Carbon Rebate

The Canada Carbon Rebate (formerly Climate Action Incentive Payment) provides quarterly
payments to residents of provinces covered by the federal carbon pricing backstop. It
requires only a filed tax return. For eligible provinces (AB, SK, MB, ON, and others
at various dates), payments range from roughly $200 to $450/year per adult. Neither
`/money/taxes` nor `/self/benefits` mention this payment. It should be added to both
the taxes page and the Benefits Finder.

### D. CCB July Reset — Improve Editorial Clarity

The CCB and GST credit benefit years reset on July 1 based on the previous year's
return. The `/money/taxes` article page explains that filing is required but does not
explain the timing clearly: filing before April 30 determines what you receive from
July. The July calendar event in `calendar-events.ts` captures this, but the article
pages should make the connection explicit so users understand why April 30 has a
direct consequence on their July-onward payments.

### E. RDSP — Dedicated Article Page

The RDSP appears in the glossary and briefly in `saving.astro` but has no dedicated
page. For First Nations people with disabilities (and their families), the RDSP is one
of the most generous savings vehicles in Canada: government contributions of up to
$4,500/year with no personal matching required at low incomes. A dedicated page at
`/money/savings` or under `/self/` would serve this audience well and is notably absent.

---

## Files Reviewed

| File | Status | Issues found |
|---|---|---|
| `src/pages/money/taxes.astro` | Needs update | Items 3, 9 |
| `src/pages/money/saving.astro` | Needs update | Item 10 |
| `src/pages/path/raising-family.astro` | Needs update | Item 3 |
| `src/pages/path/supporting-elders.astro` | Needs update | Items 6, 7 |
| `src/pages/rights/nihb.astro` | Verify required | Item 12 |
| `src/lib/tax-estimator.ts` | Needs update | Items 1, 4, 5, 9 |
| `src/lib/simulator-data.ts` | Needs update | Items 4, 5, 11 |
| `src/components/TaxEstimator.svelte` | Minor label | Item 13 |
| `src/components/BenefitsFinder.svelte` | Needs update | Items 3, 6, 8, 9 |
| `src/pages/disclaimer.astro` | Needs update | Items 2, 15 |
| `src/pages/path/first-job.astro` | Minor | Item 17 |
| `src/lib/settlement-math.ts` | Clean | `CURRENT_YEAR = 2026` is correct |
| `src/lib/calendar-events.ts` | Clean | Evergreen content, no date-specific issues |
| `src/lib/glossary-data.ts` | Clean | All amounts and rates verified correct |
| All other article pages | Clean | lastUpdated within 6-month threshold |

---

## Priority Action List

Ordered by urgency and impact:

1. **[Do now]** Fix CPP_MAX_PENSIONABLE in `tax-estimator.ts` (one-line fix — item 1)
2. **[Before July 1]** Update CCB amounts across BenefitsFinder, taxes.astro, raising-family.astro (item 3)
3. **[Before July 1]** Update GST credit amount and remove "(2024)" label in taxes.astro (item 9)
4. **[Before July 1]** Update EI max weekly benefit in BenefitsFinder (item 8)
5. **[This cycle]** Fix app name in disclaimer (item 2)
6. **[This cycle]** Update OAS/GIS amounts after verifying current quarterly rates (item 6)
7. **[This cycle]** Update CPP maximum in supporting-elders.astro (item 7)
8. **[This cycle]** Update TFSA room to $109,000 and year label in saving.astro (item 10)
9. **[Fall, when CRA publishes 2026 rates]** Update all federal brackets, BPA, EI rate across both tax files (items 4, 5)
10. **[Fall]** Update city cost-of-living data from CMHC Rental Market Report (item 11)
