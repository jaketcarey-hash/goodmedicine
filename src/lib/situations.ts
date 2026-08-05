/**
 * "What applies to me" — a router, not an answer.
 *
 * Built from the same public law the advisor-side flowcharts draw on: the
 * connecting-factors test from Williams and the cases after it, CRA's published
 * guidelines, and program rules that anyone can read. None of that is
 * proprietary.
 *
 * What is deliberately NOT carried across from those charts: they are written
 * in the first person about a practice — "I run this", "refer, then coordinate"
 * — because they route a client toward an advisor's service. That belongs
 * nowhere near this site, which tells every visitor it is not connected to any
 * bank or firm. Here the lanes are different: what usually decides it, what is
 * generally settled, what is genuinely unsettled, and which *kind* of
 * professional answers the rest. Never a named one.
 *
 * The honest shape of this: it narrows the question and tells you what to ask.
 * It does not tell anyone what their answer is, because the answer depends on
 * facts a web page cannot see.
 */
export interface Situation {
  id: string;
  /** How someone would say it out loud. */
  question: string;
  /** A line of context, so she knows she is in the right place. */
  opening: string;
  /** The things that actually determine the answer, in the order they matter. */
  decidedBy: string[];
  /** Where the law is clear enough to state plainly. */
  settled: string[];
  /** Where it genuinely is not, and pretending otherwise would be a lie. */
  unsettled: string[];
  /** Who answers the rest. A kind of professional, never a name. */
  ask: string;
  /** Somewhere on this site that goes deeper. */
  reading: { label: string; href: string }[];
}

export const SITUATIONS: Situation[] = [
  {
    id: 'income',
    question: 'Is my income tax-exempt?',
    opening:
      'The exemption is about where the income is earned, not who you are. That one distinction settles most of these.',
    decidedBy: [
      'Whether you are registered under the Indian Act',
      'Where the work is actually performed, day to day',
      'Where the employer is located and where it does its business',
      'Whether you live on reserve',
    ],
    settled: [
      'Work performed almost entirely on reserve, for an employer on reserve, is generally exempt.',
      'Work performed entirely off reserve for an off-reserve employer is generally taxable, whoever you are.',
      'Serving Indigenous people is not the same as being located on reserve. What the employer does never substitutes for where the work happens.',
    ],
    unsettled: [
      'Mixed and hybrid arrangements, where some days are on reserve and some are not. These turn on proration and the specific facts.',
      'Remote work from a home on reserve for an off-reserve employer. The reasoning is fact-specific and the outcomes vary.',
    ],
    ask: 'An accountant who has handled on-reserve employment income before — not just any accountant.',
    reading: [
      { label: 'Section 87 explained', href: '/rights/section-87' },
      { label: 'Try the Section 87 Checker', href: '/rights/section-87-checker' },
      { label: 'Taxes and filing', href: '/money/taxes' },
    ],
  },
  {
    id: 'accounts',
    question: 'Where should I keep my savings and investments?',
    opening:
      'Exempt income does not make an account exempt. What matters is where the investment itself is considered to sit.',
    decidedBy: [
      'Whether the money that went in was exempt when you earned it',
      'Where the financial institution and the account are located',
      'Which type of account it is — TFSA, RRSP, RRIF, or non-registered',
    ],
    settled: [
      'TFSA withdrawals are tax-free for everyone, regardless of status. That makes a TFSA unusually valuable here.',
      'RRSP and RRIF withdrawals are generally taxable, wherever you live.',
      'Filing a return is what unlocks benefits, contribution room and credits — even when you owe nothing.',
    ],
    unsettled: [
      'Whether investment income on a non-registered account is exempt. It depends on where the investment is situated, and the reasoning is technical.',
    ],
    ask: 'An accountant for the tax treatment, and someone qualified to advise on investments for the account choice.',
    reading: [
      { label: 'Saving', href: '/money/saving' },
      { label: 'Investing', href: '/money/investing' },
      { label: 'Taxes and filing', href: '/money/taxes' },
    ],
  },
  {
    id: 'settlement',
    question: 'Money arrived — a settlement, a distribution, an inheritance.',
    opening:
      'Where money came from usually matters more than how much of it there is. It decides how it is taxed and sometimes what it can be used for.',
    decidedBy: [
      'What kind of payment it is — settlement, treaty, per-capita distribution, inheritance, insurance',
      'Whether it was paid to you or held in a trust',
      'Any conditions attached by the agreement or the trust',
    ],
    settled: [
      'Different settlements are treated differently. There is no single rule that covers all of them.',
      'Money sitting in a bank account does not become exempt because of who owns it.',
      'A lump sum is easier to lose than to replace. Nothing needs deciding in the first week.',
    ],
    unsettled: [
      'The tax treatment of several specific settlements has never been stated plainly by the CRA. Where that is true, be careful of anyone who sounds certain.',
    ],
    ask: 'An accountant, and a lawyer if a trust or an estate is involved. Ask before moving the money, not after.',
    reading: [
      { label: 'Money just arrived', href: '/moments/money-arrived' },
      { label: 'Seven generations', href: '/money/seven-generations' },
      { label: 'Settlement Simulator', href: '/tools/settlement-simulator' },
    ],
  },
  {
    id: 'home',
    question: 'My home is on reserve. What happens to it?',
    opening:
      'Land on reserve is held differently from land off reserve, and that changes almost everything about borrowing against it and passing it on.',
    decidedBy: [
      'Whether the land is held by certificate of possession, custom allotment, or another arrangement',
      'Whether your Nation has its own land code or matrimonial property law',
      'Who is registered, and who is a member of the Nation',
    ],
    settled: [
      'Reserve land generally cannot be mortgaged the way off-reserve property can, which is why ordinary home financing often does not apply.',
      'Wills for people living on reserve are handled under the Indian Act, and the Minister has a role that does not exist elsewhere.',
      'Who can inherit an interest in reserve land is restricted in ways that surprise most families.',
    ],
    unsettled: [
      'Matrimonial property on reserve varies by Nation. If your Nation has its own law, that governs — and if it does not, provisional federal rules apply.',
    ],
    ask: 'Your band office or lands department first, because they know your Nation, and then a lawyer who works with reserve land.',
    reading: [
      { label: 'Someone died', href: '/moments/someone-passed' },
      { label: 'Band finances', href: '/rights/band-finances' },
      { label: 'Building a life', href: '/path/building-life' },
    ],
  },
  {
    id: 'benefits',
    question: 'What am I entitled to, and will my income affect it?',
    opening:
      'Most benefits are income-tested against your filed return, which is why filing matters even when nothing is owed.',
    decidedBy: [
      'Whether you filed a tax return, for every year',
      'Your net income for benefit purposes',
      'Your family situation and the ages of any children',
    ],
    settled: [
      'You have to file to receive the Canada Child Benefit, the Groceries and Essentials Benefit, GIS and most provincial credits.',
      'Exempt income is still reported on your return. Reporting it is how benefits get calculated correctly.',
      'You can usually ask for adjustments to earlier years if you have not filed.',
    ],
    unsettled: [
      'How a specific kind of exempt or trust income is treated for a specific income-tested programme. The programmes do not all use the same test.',
    ],
    ask: 'A free tax clinic, a community tax preparer, or your band office. Many will come to the community.',
    reading: [
      { label: 'Benefits Finder', href: '/self/benefits' },
      { label: 'Taxes and filing', href: '/money/taxes' },
      { label: 'Raising a family', href: '/path/raising-family' },
    ],
  },
  {
    id: 'business',
    question: 'I run a business, or I want to start one.',
    opening:
      'A company has no status of its own. That single fact drives most of what follows.',
    decidedBy: [
      'Whether you operate as yourself or through a corporation',
      'Where the business actually carries on its activity',
      'Whether you are selling to government or to other businesses',
    ],
    settled: [
      'A corporation is not a registered person and cannot claim the exemption in its own right.',
      'How you pay yourself out of a business changes the tax result, sometimes a great deal.',
      'There are lenders and programmes specifically for Indigenous businesses, and their terms are often different from a bank’s.',
    ],
    unsettled: [
      'How the exemption interacts with income taken out of a corporation. This is technical and the answer depends on the structure.',
    ],
    ask: 'An accountant before you incorporate, not after. The structure is hard to unwind later.',
    reading: [
      { label: 'Giving back and business', href: '/path/giving-back' },
      { label: 'Investing', href: '/money/investing' },
      { label: 'Career growth', href: '/path/career-growth' },
    ],
  },
  {
    id: 'retirement',
    question: 'What happens to my pension and CPP?',
    opening:
      'Retirement income is generally treated by where it came from, which means work you did decades ago can still matter.',
    decidedBy: [
      'Whether the pension came from an employer on reserve',
      'Whether CPP contributions were made on exempt or taxable employment',
      'Where you live now, and where the payer is',
    ],
    settled: [
      'CPP and OAS are generally taxable wherever you live, because of where the payer sits.',
      'A pension from an on-reserve employer may be exempt, traced back to the employment it came from.',
      'GIS excludes exempt income from its calculation, which often means a higher payment than people expect.',
    ],
    unsettled: [
      'Tracing a pension back through years of mixed employment. It can be done, but it is work, and the records are often incomplete.',
    ],
    ask: 'Service Canada for the CPP and OAS record, and an accountant for how any employer pension is treated.',
    reading: [
      { label: 'Supporting elders', href: '/path/supporting-elders' },
      { label: 'Section 87 explained', href: '/rights/section-87' },
      { label: 'Saving', href: '/money/saving' },
    ],
  },
];

export function getSituation(id: string): Situation | null {
  return SITUATIONS.find((s) => s.id === id) ?? null;
}
