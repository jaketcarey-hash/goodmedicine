/**
 * What may be owed, and has never been claimed.
 *
 * `/money/taxes` has said this in prose since it was written: *a single
 * parent with two young children who doesn't file could be leaving
 * $12,000–15,000 per year on the table between the CCB and GST credit alone,
 * and you can file up to 10 years back.* It is the most consequential
 * sentence on the site and it was a paragraph about a hypothetical stranger,
 * next to no arithmetic and no next step. This file does the arithmetic for
 * the person reading it.
 *
 * That makes it the most dangerous file here as well as the most useful, so
 * the rules are tighter than the forecast's:
 *
 * 1. **Everything quantified is a maximum at low income.** Every federal
 *    amount in the registry is the full-benefit figure and every one of them
 *    tapers as income rises. The output says "up to", the surface must
 *    repeat it, and no wording anywhere may become "you are owed".
 *
 * 2. **Nothing is quantified without the household fact it rests on.** No
 *    children entered, no child benefit. `basis` on every line names the
 *    facts it used and the rates behind it, so a figure can always be taken
 *    apart. `basis` is read by the person, not by a developer — it names
 *    sources in words, never registry key names.
 *
 * 3. **What cannot be known is named, never estimated.** Unclaimed medical
 *    reimbursements, a Jordan's Principle request never made, tax withheld on
 *    exempt income — all real, none computable from anything on this device.
 *    They ship as `named` lines with an action and no number. A plausible
 *    guess here would be indistinguishable from a real figure and would
 *    poison the ones that are real.
 *
 * 4. **Historical amounts were lower than today's.** Retroactive totals apply
 *    current-year figures to earlier years because this device has no
 *    historical table. That overstates, so the total is `roughly`, the
 *    overstatement is disclosed in `caveats`, and it is disclosed as a fact
 *    rather than as small print.
 *
 * 5. **The window is ten years and it closes one year at a time.** Every
 *    January a year falls off the end and is gone. That is the only thing
 *    here that is genuinely urgent, and it is the reason this exists as a
 *    tool and not an article.
 */

import { value } from './figures';
import { MAX_RETRO_YEARS, type Household } from './household-store';

export interface Entitlement {
  id: string;
  label: string;
  /** Maximum for one year at low income. Null when the amount is unknowable. */
  annualMax: number | null;
  /** Years this could reach back over. */
  years: number;
  /** The whole retroactive maximum. Null when unknowable. */
  totalMax: number | null;
  /** Which household facts and which registry figures produced this. */
  basis: string;
  status: 'quantified' | 'named';
  /** The next real step, in her hands. */
  action: string;
  /** Why this might be sitting unclaimed. */
  why?: string;
}

export interface EntitlementPicture {
  entitlements: Entitlement[];
  /** Sum of the quantified lines only. Named lines are deliberately excluded. */
  quantifiedTotal: number;
  /** Sum for a single year. */
  annualTotal: number;
  yearsUnfiled: number;
  caveats: string[];
  /** The year that falls out of reach at the end of this calendar year. */
  yearExpiring: number | null;
}

/** Child benefit for one child in one tax year, at that year's age. */
function childBenefitFor(birthYear: number, taxYear: number): number {
  const age = taxYear - birthYear;
  if (age < 0 || age > 17) return 0;
  return age < 6 ? value('ccb_under_6') : value('ccb_6_to_17');
}

export interface EntitlementOptions {
  household: Household;
  /** Injected for tests; defaults to the real one. */
  today?: Date;
  /** From the Section 87 checker, if it has been run. */
  exemptionVerdict?: string | null;
  /** Whether any employment income is on record. */
  hasEmploymentIncome?: boolean;
}

export function buildEntitlements(options: EntitlementOptions): EntitlementPicture {
  const { household } = options;
  const today = options.today ?? new Date();
  const thisYear = today.getFullYear();

  const years = Math.max(0, Math.min(household.yearsUnfiled, MAX_RETRO_YEARS));
  const entitlements: Entitlement[] = [];
  const caveats: string[] = [];

  // The tax years a return is missing for, most recent first.
  const missingYears = Array.from({ length: years }, (_, i) => thisYear - 1 - i);

  /* ---- Canada Child Benefit ---- */
  if (household.children.length > 0 && years > 0) {
    let total = 0;
    for (const y of missingYears) {
      for (const child of household.children) total += childBenefitFor(child.birthYear, y);
    }
    let thisYearAmount = 0;
    for (const child of household.children) {
      thisYearAmount += childBenefitFor(child.birthYear, thisYear - 1);
    }
    if (total > 0) {
      entitlements.push({
        id: 'ccb',
        label: 'Canada Child Benefit',
        annualMax: thisYearAmount,
        years,
        totalMax: total,
        basis: `${household.children.length} ${household.children.length === 1 ? 'child' : 'children'} in the household, aged by birth year against each unfiled year, at this year's published rates`,
        status: 'quantified',
        action: 'File the missing returns. CRA calculates the back payments itself once they are in.',
        why: 'The child benefit is paid on a filed return. No return, no payment — regardless of whether any tax was owed.',
      });
    }
  }

  /* ---- Canada Groceries and Essentials Benefit ---- */
  if (years > 0) {
    const perYear =
      (household.adults === 2
        ? value('groceries_benefit_couple')
        : value('groceries_benefit_single')) +
      household.children.length * value('groceries_benefit_per_child');
    entitlements.push({
      id: 'cgeb',
      label: 'Canada Groceries and Essentials Benefit',
      annualMax: perYear,
      years,
      totalMax: perYear * years,
      basis: `${household.adults === 2 ? 'Two adults' : 'One adult'}${household.children.length ? ` and ${household.children.length} ${household.children.length === 1 ? 'child' : 'children'}` : ''}, at this year's published rates`,
      status: 'quantified',
      action: 'Filing is the whole application. There is no separate form.',
      why: 'Formerly the GST/HST credit. It is paid automatically from a filed return and not at all without one.',
    });
  }

  /* ---- Tax withheld on income that may have been exempt ---- *
   * Deliberately not quantified. Working it out needs the T4s, which this
   * device does not have, and putting a number on it would make a guess look
   * exactly like the CCB figure above it. */
  if (
    options.exemptionVerdict === 'likely-exempt' &&
    options.hasEmploymentIncome
  ) {
    entitlements.push({
      id: 's87-withheld',
      label: 'Tax withheld on income that may have been exempt',
      annualMax: null,
      years: MAX_RETRO_YEARS,
      totalMax: null,
      basis: 'Your saved Section 87 check came out likely exempt, and there is employment income on record',
      status: 'named',
      action:
        'Check Box 71 on your T4s. If exempt income was taxed, a T1 adjustment can be requested for past years — take the T4s to a tax professional with Indigenous tax experience before filing anything.',
      why: 'An employer who does not treat income as exempt withholds tax on it anyway. The amount depends on your slips, so no figure is shown here rather than a guessed one.',
    });
  }

  /* ---- The ones nobody can compute from a phone ---- */
  entitlements.push({
    id: 'nihb-unclaimed',
    label: 'Health costs you paid for yourself',
    annualMax: null,
    years: 1,
    totalMax: null,
    basis: 'Applies to anyone with status or recognised Inuit status',
    status: 'named',
    action: 'Dig out receipts for dental, vision, prescriptions or medical travel and ask about reimbursement — claims have time limits, so the older ones matter most.',
    why: 'Non-Insured Health Benefits reimburses costs already paid, but only if a claim is made.',
  });

  if (household.children.length > 0) {
    entitlements.push({
      id: 'jordans-principle',
      label: "Anything a child needed and you paid for",
      annualMax: null,
      years: 1,
      totalMax: null,
      basis: 'There are children in the household',
      status: 'named',
      action: 'A Jordan’s Principle request can be made for a product, service or support a First Nations child needs, including for things already paid for.',
      why: 'The government of first contact pays and settles jurisdiction afterwards, so a request does not wait on anyone agreeing whose bill it is.',
    });
  }

  const quantified = entitlements.filter((e) => e.status === 'quantified');
  const quantifiedTotal = quantified.reduce((s, e) => s + (e.totalMax ?? 0), 0);
  const annualTotal = quantified.reduce((s, e) => s + (e.annualMax ?? 0), 0);

  if (quantifiedTotal > 0) {
    caveats.push(
      'Every amount here is the maximum at a low income. Both benefits taper as income rises, so what you would actually receive is likely less.',
    );
    if (years > 1) {
      caveats.push(
        "Earlier years paid less than today's rates, and today's rates are what this used — so treat the total as the top of the range rather than a figure to count on.",
      );
    }
  }

  return {
    entitlements,
    quantifiedTotal,
    annualTotal,
    yearsUnfiled: years,
    caveats,
    yearExpiring: years > 0 ? thisYear - MAX_RETRO_YEARS : null,
  };
}
