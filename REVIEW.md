# Content Review — May 2026

**Date of review:** May 1, 2026  
**Reviewer:** Automated content audit  
**Scope:** All article pages, tax/benefit data, cost of living data, hardcoded date references, and glossary  
**App content last reviewed:** March 2026 (per disclaimer)

---

## Summary

The app is in generally good shape. All article pages carry a `lastUpdated` of March 2026 — none exceed the 6-month staleness threshold. The most pressing issues are in the **tax calculation data files**, where a CPP maximum pensionable earnings inconsistency between two files means CPP deductions are being meaningfully undercalculated in one tool. A secondary cluster of issues involves benefit dollar amounts and year labels that have not been updated since the 2024 tax year. Cost of living data is now labelled one year stale.

---

## CRITICAL — Wrong information

### 1. CPP Maximum Pensionable Earnings inconsistency between tax files

**File:** `src/lib/tax-estimator.ts` line 43  
**Also affects:** `src/components/TaxEstimator.svelte`

```ts
const CPP_MAX_PENSIONABLE = 68_500;  // WRONG — this is the 2024 YMPE
```

The file header states "2025 rates," but `$68,500` is the 2024 Year's Maximum Pensionable Earnings (YMPE). The correct 2025 YMPE is `$71,300`.

`src/lib/simulator-data.ts` (line 152) correctly uses `$71,300`, creating a direct inconsistency between the two tools. A user running the Tax Estimator vs. the Life Simulator will see different CPP deduction calculations for identical income inputs. The Tax Estimator undercalculates CPP contributions by approximately $141 per year for higher earners (difference of $2,800 × 5.95%).

**Fix:** Change `tax-estimator.ts` line 43:
```ts
const CPP_MAX_PENSIONABLE = 71_300;  // 2025 YMPE; update to 2026 value when announced
```

Note: the 2026 YMPE will be announced by CRA in the fall. Both files will need updating once 2026 rates are published.

---

### 2. App name inconsistency in disclaimer

**File:** `src/pages/disclaimer.astro` line 11

```
Strong Fire provides general educational information...
```

The `CLAUDE.md` project documentation names this app **Good Medicine**. The disclaimer refers to it as **Strong Fire**. One of these is wrong. If the app was renamed, the disclaimer needs updating. If "Strong Fire" is intentional (e.g., a brand name distinct from the project name), this should be confirmed — but users reading the disclaimer will see a name that does not match anything else in the interface.

**Fix:** Confirm the correct app name and update the disclaimer accordingly.

---

## IMPORTANT — Outdated amounts or rates

### 3. All tax data files use 2025 rates — now in 2026 tax year

**Files:** `src/lib/tax-estimator.ts`, `src/lib/simulator-data.ts`, `src/components/TaxEstimator.svelte`

Both data files are explicitly labelled "2025 rates" / "2025 estimates." It is now May 2026. The 2026 tax year uses CRA-indexed brackets and thresholds that differ from 2025.

Known 2025 values that will be higher in 2026 (exact 2026 values require CRA confirmation after their fall announcement):

| Item | 2025 value (current in app) | Expected direction for 2026 |
|---|---|---|
| Federal Basic Personal Amount | $16,129 | Higher (~2–3% CPI indexation) |
| Federal bracket 1 ceiling | $57,375 | Higher |
| Federal bracket 2 ceiling | $114,750 | Higher |
| Federal bracket 3 ceiling | $158,468 | Higher |
| Federal bracket 4 ceiling | $220,000 | Higher |
| CPP YMPE | $71,300 | Higher |
| EI max insurable | $65,700 | Higher |

**Fix:** Once CRA publishes 2026 indexed rates (typically announced in November/December 2025, confirmed in T1 guides), update both files. Update file header comments from "2025" to "2026." Also update `src/components/TaxEstimator.svelte` line 356: `"2025 federal and provincial rates"` → `"2026 federal and provincial rates"`.

---

### 4. EI premium rate is slightly wrong for 2025

**Files:** `src/lib/tax-estimator.ts` line 45, `src/lib/simulator-data.ts` line 154

Both files use `EI_RATE = 0.0163` (1.63%). The 2025 employee EI premium rate set by the Employment Insurance Commission was **1.64%**, not 1.63%. This is a minor discrepancy but it is present in both tools.

**Fix:** Update both files:
```ts
const EI_RATE = 0.0164;  // 2025 employee EI premium rate
```
Verify the 2026 rate when updating to 2026 data.

---

### 5. GST/HST credit amount is labelled "(2024)" and is below current values

**File:** `src/pages/money/taxes.astro` line 37

```
GST/HST credit — up to $519/year for a single person (2024), paid quarterly
```

The label "(2024)" refers to the 2023-2024 or 2024-2025 benefit year. The current benefit year is 2025-2026. CRA indexes the GST/HST credit annually; the 2025-2026 base amount for a single adult is approximately $533 (up from $519). The year label also signals to users that this information is two years old.

Additionally, `src/components/BenefitsFinder.svelte` lines 194-195 and 303-305 describe the GST credit as:
```
"Estimated $300 to $500 per year"
```
This range is lower than the actual base amount ($519–$533). Users may underestimate the benefit when deciding whether to file taxes.

**Fix:**
- Update `taxes.astro` line 37: remove the "(2024)" tag, update the dollar amount to the current benefit year figure, and verify against the CRA GST/HST credit schedule.
- Update `BenefitsFinder.svelte` GST descriptions to reflect a range starting above $519 (e.g., "estimated $519 to $620+ per year depending on family size and income").

---

### 6. CCB amounts are labelled "(2024)" but also claimed as "2025-2026" with the same figures

**File 1:** `src/pages/money/taxes.astro` line 38

```
Canada Child Benefit (CCB) — up to $7,787 per child under 6 and $6,570 per child aged 6-17 (2024)
```

**File 2:** `src/pages/path/raising-family.astro` lines 49-54

```
For the 2025-2026 benefit year, the maximum annual CCB is:
  Under 6: $7,787 per child ($648.91/month)
  Ages 6-17: $6,570 per child ($547.50/month)
```

These two pages contradict each other: one says "(2024)" and the other says "2025-2026," yet both use identical dollar figures. $7,787 and $6,570 are the 2024-2025 benefit year values (July 2024 – June 2025). The 2025-2026 values are indexed upward by CPI; based on typical annual indexation (~2.7%), current-year estimates are approximately **$7,997 (under 6)** and **$6,747 (ages 6-17)**.

The same figures appear in `src/components/BenefitsFinder.svelte` lines 201-202 and 289-290 without a year label.

**Fix:**
- Confirm the 2025-2026 and 2026-2027 CCB maximum amounts from the CRA benefit rates page.
- Update taxes.astro with current amounts and correct year label.
- Update raising-family.astro with the 2025-2026 confirmed amounts.
- Update BenefitsFinder.svelte with current amounts and an "approximate" caveat.

---

### 7. OAS and GIS amounts are point-in-time values for a quarterly-adjusted benefit

**Files:** `src/pages/path/supporting-elders.astro` lines 50-58, `src/components/BenefitsFinder.svelte` lines 242-243 and 252-253

The app states:
- OAS (age 65-74): "about $727/month"
- OAS (age 75+): "about $800/month"
- GIS (single): "up to $1,065/month"

OAS and GIS are adjusted quarterly to match CPI changes. These figures were likely accurate at the time of the March 2026 review, but will drift. As of early 2026, OAS (65-74) has been in the $720–$735 range and GIS has been in the $1,000–$1,070 range. The approximate values may still be within range, but should be verified against the current Service Canada quarterly rates.

**Fix:** Verify current quarterly OAS/GIS rates at the Service Canada benefits page. If the figures are off by more than $15-20, update. Add explicit "as of [quarter/year]" language or a note that "these amounts are updated quarterly — check Service Canada for current figures." Consider linking directly to the Service Canada pension rates page.

---

### 8. EI maximum weekly benefit may be stale

**File:** `src/components/BenefitsFinder.svelte` line 278

```
"Up to 55% of previous earnings, to an estimated maximum of $668 per week"
```

The $668/week maximum was the 2025 value. For 2026, the EI maximum weekly benefit is based on the updated maximum insurable earnings. This value needs to be confirmed against the 2026 Employment Insurance premium rates notice.

**Fix:** Confirm the 2026 EI maximum weekly benefit rate and update.

---

### 9. TFSA cumulative contribution room is understated

**File:** `src/pages/money/saving.astro` line 39

```
If you turned 18 in 2009 or earlier and never contributed, you have over $95,000 of room
```

This was accurate as of 2024. As of January 1, 2026, the cumulative TFSA contribution room for someone who was 18 or older in 2009 is **$109,000** (adding the $7,000 2025 and $7,000 2026 annual limits to the prior $95,000). The statement should be updated each year when the new annual limit opens.

**Fix:** Update to "over $109,000 of room" as of 2026. Consider rewording to avoid the need for annual edits: "Contribution room accumulates every year you are 18 or older and a Canadian resident — check your current room on My CRA Account."

---

### 10. TFSA contribution limit year label is stale

**File:** `src/pages/money/saving.astro` line 39

```
$7,000/year (2024-2025)
```

The 2026 TFSA annual limit is also $7,000. The year label "(2024-2025)" is now two years stale and suggests the information may be outdated even though the limit hasn't changed.

**Fix:** Update to "(2025, 2026)" or drop the year parenthetical and instead say "currently $7,000/year — confirmed by CRA annually."

---

### 11. Cost of living data is one year stale

**File:** `src/lib/simulator-data.ts` lines 34-52 and file header (line 4)

All city rent and cost data is explicitly labelled "2025 estimates." The current date is May 2026. City rents in particular change significantly year-over-year in Canadian markets. Notable gaps:

- **Vancouver:** $2,400/month for a 1-bedroom. Vancouver's average 1-bedroom rent has fluctuated. In early 2026, this may be slightly high or low depending on the source; should be reverified.
- **Toronto:** $2,300/month. Toronto rental markets have been volatile; verify against current CMHC rental market data.
- **Halifax:** $1,600/month. Halifax has seen significant rent increases in recent years.

The data provides illustrative scenarios, not real-time pricing, and is appropriately caveated with "for illustration only." However, if values have drifted more than 10–15% from current market averages, they could mislead users in the Life Simulator.

**Fix:** Update city data to 2026 estimates sourced from CMHC Rental Market Report (October 2025 edition) or equivalent. Update file header comment from "2025 estimates" to "2026 estimates."

---

## MINOR — Stale dates, cosmetic issues

### 12. "(2024)" year tags in taxes.astro

**File:** `src/pages/money/taxes.astro` lines 37-38

The GST credit and CCB amounts are tagged with "(2024)" while the page shows `lastUpdated="March 2026"`. This creates a confusing mismatch — the page says it was reviewed recently but the data is labelled two years old. Even if the underlying figures are close, the year tags undermine user confidence.

**Fix:** Replace "(2024)" with the current benefit year label, e.g., "(2025-2026 benefit year)".

---

### 13. File header comments still say "2025" in both tax data files

**Files:** `src/lib/tax-estimator.ts` line 2, `src/lib/simulator-data.ts` line 4, `src/components/TaxEstimator.svelte` line 356

These are cosmetic until the underlying data is updated, but should be updated at the same time as the rate values.

---

### 14. FHSA "launched 2023" mention in saving.astro

**File:** `src/pages/money/saving.astro` line 79

```
The First Home Savings Account is newer (launched 2023)
```

The FHSA was indeed launched in 2023. This is factually accurate. However, by 2026 it is no longer "new" — this phrasing makes the content feel like it was written shortly after launch. Consider removing the parenthetical or updating the framing.

---

### 15. Sample paycheque numbers in first-job.astro use rounded figures without a year reference

**File:** `src/pages/path/first-job.astro` lines 46-52

The sample breakdown uses $20/hour, with CPP ~$85 biweekly and EI ~$25. These are rough illustrations, not precise calculations, and do not cite a year. As CPP/EI rates and maxima change annually, these numbers drift. They're in a collapsible section clearly marked as approximate.

**No immediate fix needed**, but consider adding a note like "(based on approximate 2026 rates)" and periodically updating the CPP/EI figures to stay within 10% of current values.

---

### 16. NIHB mental health counselling "22 hours per year" figure

**File:** `src/pages/rights/nihb.astro` (expandable section: "For mental health")

```
The program typically covers 22 hours of counselling per year, with more available if clinically justified.
```

NIHB mental health coverage limits are subject to regional variation and policy updates. The 22-hour figure should be verified against the current NIHB National Mental Health Benefits Policy. If this has changed (it has been under periodic review), it needs updating.

**Fix:** Verify the current NIHB mental health session limit with ISC's NIHB national policy documentation. Add a note directing users to confirm with their regional NIHB office.

---

## Glossary — No critical issues found

The glossary was reviewed for specific dollar amounts and date references. Findings:

- **Capital gains (50% inclusion rate):** Accurate as of 2026. The federal government's proposed increase to 2/3 for gains over $250,000 (2024 budget) was not legislated and has been withdrawn. The 50% rate in the glossary definition is correct.
- **Home Buyers' Plan ($60,000 limit):** Correct — the limit was increased from $35,000 to $60,000 effective April 2024.
- **FHSA ($40,000 lifetime limit):** Correct.
- **RDSP (up to $4,500/year in government contributions):** Correct — CDSG up to $3,500 + CDSB up to $1,000.
- **Canada Learning Bond (up to $2,000):** Correct.
- **CCB description:** The glossary does not cite a specific dollar amount for CCB — it describes the benefit in general terms. No update needed.

---

## New Content Recommendations

### A. CPP Second Additional Contributions (CPP2) — missing entirely

The enhanced CPP second tier (CPP2) applies to earnings between the YMPE and the Year's Additional Maximum Pensionable Earnings (YAMPE). For 2025: YMPE = $71,300, YAMPE = $81,900. A 4% employee contribution applies on the difference (up to $419/year for maximum earners).

Neither the Tax Estimator, Life Simulator, nor any article page explains CPP2. Workers earning above $71,300 are seeing deductions they may not understand. The `/money/taxes` and `/path/first-job` pages in particular should acknowledge CPP2 exists. The Tax Estimator should be updated to include CPP2 in its calculations once all 2026 rates are confirmed.

### B. Capital gains inclusion rate — a plain-language explainer

The 2024 federal budget proposed and then the subsequent government withdrew an increase to the capital gains inclusion rate. This caused significant confusion across Canada. Many people — including First Nations members with settlement income or investment portfolios — are uncertain about the current rules. A short explainer (either as an expandable section in `/money/investing` or a callout in `/money/taxes`) confirming the rate remains 50% would be valuable.

### C. 2025-2026 NIHB policy updates

NIHB coverage details (dental fee guides, drug formulary, mental health session limits) are updated periodically. A general review of the NIHB page against the current ISC NIHB national benefits policy is recommended before the next content review cycle in September 2026.

### D. Seasonal reminder: benefit year transition (July 2026)

The CCB and GST/HST credit benefit years reset in July based on the previous year's tax return. An editorial note on the taxes page reminding users that filing before the April 30 deadline determines their July-to-June benefit payments is worth reinforcing. The calendar (`src/lib/calendar-events.ts`) already captures the July CCB recalculation event, but the article pages do not explain this timing explicitly.

---

## Files Reviewed

| File | Issues found |
|---|---|
| `src/pages/money/taxes.astro` | Year labels stale (items 5, 6, 12) |
| `src/pages/money/saving.astro` | TFSA room and year label stale (items 9, 10, 14) |
| `src/pages/path/raising-family.astro` | CCB amounts contradict taxes.astro (item 6) |
| `src/pages/path/supporting-elders.astro` | OAS/GIS quarterly drift (item 7) |
| `src/pages/rights/nihb.astro` | 22-hour counselling limit needs verification (item 16) |
| `src/lib/tax-estimator.ts` | Wrong CPP YMPE, EI rate, all 2025 rates (items 1, 3, 4) |
| `src/lib/simulator-data.ts` | All 2025 rates/costs, EI rate (items 3, 4, 11) |
| `src/components/TaxEstimator.svelte` | UI text says 2025 rates (item 13) |
| `src/components/BenefitsFinder.svelte` | GST underestimate, CCB stale, EI max (items 5, 6, 8) |
| `src/pages/disclaimer.astro` | App name mismatch (item 2) |
| `src/pages/path/first-job.astro` | Illustration figures lack year reference (item 15) |
| All other article pages | lastUpdated "March 2026" — within 6-month threshold. No flags. |
| `src/lib/glossary-data.ts` | No critical issues. All amounts verified correct. |
| `src/lib/calendar-events.ts` | No date-specific issues. Content is evergreen by design. |
| `src/lib/settlement-math.ts` | `CURRENT_YEAR = 2026` is correct. |

---

## Next Review

Recommended next full review: **September 2026**, or immediately following:
- CRA 2026 indexed benefit amounts announcement (July 2026 CCB/GST update)
- CRA 2027 tax bracket announcement (November/December 2026)
- Federal fall economic statement or budget (if relevant policy changes)
