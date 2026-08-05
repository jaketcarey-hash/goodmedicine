/**
 * The crossing between the two halves of the site.
 *
 * The Record explains what is happening to Indigenous economic power; the
 * community side explains what a person does about their own money. They have
 * had nothing between them, which made "one stop shop" a claim the navigation
 * did not support.
 *
 * This maps subjects to articles by hand rather than by keyword similarity.
 * Automatic matching on shared words produces confident nonsense — a ledger
 * record mentioning "trust" would pull up an article about trusting your bank.
 * The mapping below is small, deliberate, and only fires when a term genuinely
 * indicates the subject. A missing link is a much smaller failure than a
 * misleading one, so anything uncertain gets no link at all.
 */

export interface Crossing {
  href: string;
  title: string;
  why: string;
  /** Lowercase terms that indicate this subject. Matched as whole phrases. */
  terms: string[];
}

const CROSSINGS: Crossing[] = [
  {
    href: '/rights/band-finances',
    title: 'How band finances work',
    why: 'What financial administration laws, audits and the fiscal institutions mean for members.',
    terms: [
      'first nations financial management board',
      'fnfmb',
      'financial administration law',
      'fiscal management act',
      'first nations finance authority',
      'financial management board',
      'fiscal institution',
      'audited financial statements',
    ],
  },
  {
    href: '/rights/section-87',
    title: 'Section 87 and the on-reserve exemption',
    why: 'Where the exemption applies, and where people assume it does and it does not.',
    terms: ['section 87', 'tax exemption', 'exempt income', 'indian act tax'],
  },
  {
    href: '/rights/treaty-payments',
    title: 'Treaty payments and settlements',
    why: 'What treaty and settlement money is, and what it is not.',
    terms: [
      'treaty annuity',
      'specific claim',
      'land claim settlement',
      'robinson huron',
      'treaty payment',
    ],
  },
  {
    href: '/money/seven-generations',
    title: 'Seven-generation thinking',
    why: 'The long-horizon frame behind trusts, settlements and Nation-held capital.',
    terms: [
      'settlement trust',
      'heritage fund',
      'trust fund',
      'own-source revenue',
      'community trust',
      'intergenerational',
    ],
  },
  {
    href: '/money/investing',
    title: 'How investing actually works',
    why: 'Equity stakes, returns and risk, in plain language.',
    terms: ['equity stake', 'equity ownership', 'loan guarantee', 'equity financing', 'bond issue'],
  },
  {
    href: '/rights/jordans-principle',
    title: "Jordan's Principle",
    why: 'What it covers and how to make a request.',
    terms: ["jordan's principle", 'jordans principle'],
  },
  {
    href: '/rights/nihb',
    title: 'Non-Insured Health Benefits',
    why: 'What NIHB covers and how to claim it.',
    terms: ['non-insured health benefits', 'nihb'],
  },
  {
    href: '/rights/education-funding',
    title: 'Education funding',
    why: 'Post-secondary support, who administers it and how to apply.',
    terms: ['post-secondary student support', 'psssp', 'education funding', 'indspire'],
  },
  {
    href: '/path/giving-back',
    title: 'Starting a business',
    why: 'Procurement, Indigenous business certification and where financing comes from.',
    terms: [
      'procurement',
      'indigenous business',
      'aboriginal financial institution',
      'nacca',
      'business loan',
      'entrepreneur',
    ],
  },
];

/**
 * Articles worth reading alongside a piece of Record material.
 *
 * Pass everything that describes the subject — headline, significance, sectors,
 * mechanisms. Returns at most `limit`, most specific first, so a record about
 * one thing does not sprout a wall of tenuous links.
 */
export function crossingsFor(text: string, limit = 3): Crossing[] {
  const haystack = text.toLowerCase();

  return CROSSINGS.map((crossing) => {
    // Longer matched terms are stronger evidence than short ones.
    const strength = crossing.terms
      .filter((term) => haystack.includes(term))
      .reduce((best, term) => Math.max(best, term.length), 0);
    return { crossing, strength };
  })
    .filter((c) => c.strength > 0)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, limit)
    .map((c) => c.crossing);
}
