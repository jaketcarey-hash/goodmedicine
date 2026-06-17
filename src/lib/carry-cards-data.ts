/**
 * Carry Cards — quick-reference cards for the moment you're standing at the counter.
 *
 * Where Moments sit beside you when life shifts, Carry Cards are the opposite shape:
 * crisp, glanceable, useful in ten seconds while someone is waiting for your answer.
 * The front is the answer in one line. The back is what to say, what to bring,
 * what's yours by right, and who to call.
 *
 * Every fact on these cards is condensed from an existing article on the site.
 * Nothing here is invented — if a card would need a figure or claim the site
 * doesn't already make, it's left off. Each card names its source article so it
 * can be kept in step when the article changes.
 */

/** A single "what to say" line, or a short list of them. */
export interface CarrySay {
  /** The situation or person this line is for, e.g. "If they ask you to pay up front". */
  when?: string;
  /** The words to use, in plain language. */
  line: string;
}

/** A phone number worth having one tap away. */
export interface CarryCall {
  label: string;
  number: string;
  numberHref: string;
}

export type CarryAccent = 'water' | 'sage' | 'clay' | 'berry';

export interface CarryCard {
  slug: string;
  /** Short label for the index card and the page title. */
  title: string;
  /** Where you'd reach for this — "At the pharmacy", "At the dentist". */
  setting: string;
  /** The front: the one-line answer, the thing to hold in your head. */
  answer: string;
  accent: CarryAccent;
  published: boolean;

  /** The back. Each block is optional so a card only carries what it needs. */
  bring?: string[];
  say?: CarrySay[];
  rights?: string[];
  /** Watch-outs — the thing people get caught by. */
  watchFor?: string[];
  calls?: CarryCall[];

  /** Where the substance came from, and where to read the full version. */
  sourceHref: string;
  sourceLabel: string;
}

const ACCENT_BAR: Record<CarryAccent, string> = {
  water: 'var(--color-water-400)',
  sage: 'var(--color-sage-400)',
  clay: 'var(--color-clay-400)',
  berry: 'var(--color-berry-400)',
};

export function accentBar(accent: CarryAccent): string {
  return ACCENT_BAR[accent];
}

export const CARRY_CARDS: CarryCard[] = [
  {
    slug: 'status-card-benefits',
    title: 'NIHB at the counter',
    setting: 'At the pharmacy, dentist, or optometrist',
    answer: 'Your Status card is your benefits card. Show it — the provider bills NIHB directly.',
    accent: 'water',
    published: true,
    bring: [
      'Your Status card',
      'Your prescription, if you have one',
      'Your private insurance card too, if you have coverage through work',
    ],
    say: [
      { when: 'Booking', line: 'Do you accept NIHB / First Nations clients?' },
      {
        when: 'At the desk',
        line: 'I have Non-Insured Health Benefits. Here is my Status card — you can bill NIHB directly.',
      },
      {
        when: 'If a medication isn’t covered',
        line: 'Can my doctor request a special authorization for this?',
      },
    ],
    rights: [
      'For most services you just present your Status card — no claim forms, no paying up front.',
      'Major dental work (crowns, root canals, orthodontics) needs a predetermination first — the office submits it for you.',
      'If you paid out of pocket, keep the receipt — you can claim reimbursement within one year.',
      'A denial is not always final. You have the right to ask the regional office for a review.',
    ],
    watchFor: [
      'If you have workplace insurance, it pays first — NIHB picks up what’s left. Submit there before NIHB.',
      'If a provider says they don’t take NIHB, the information line can give you a list of ones nearby.',
    ],
    calls: [
      {
        label: 'NIHB information line',
        number: '1-800-580-0950',
        numberHref: 'tel:+18005800950',
      },
    ],
    sourceHref: '/rights/nihb',
    sourceLabel: 'Non-Insured Health Benefits',
  },
  {
    slug: 'section-87-at-work',
    title: 'Section 87, the right question',
    setting: 'With an employer, bank, or advisor',
    answer: 'The question that opens it up: "How does this work with my Section 87 status?"',
    accent: 'water',
    published: true,
    say: [
      {
        when: 'To an employer about your pay',
        line: 'My employment may be tax-exempt under Section 87. Can my income go in Box 71 on the T4?',
      },
      {
        when: 'To any advisor recommending an RRSP',
        line: 'My employment income is exempt — how does an RRSP work with my Section 87 status before I contribute?',
      },
      {
        when: 'To a bank about an investment',
        line: 'Is this investment situated on reserve? How does Section 87 apply to the income it earns?',
      },
    ],
    rights: [
      'Section 87 exempts the personal property of a Status Indian situated on a reserve from tax.',
      'For employment income, what matters is the connecting factors: where you do the work, where your employer is, who the work serves, where you live.',
      'Investment income is generally not exempt unless the investment itself is situated on reserve.',
      'File your taxes even when your income is exempt — benefits like the GST credit and CCB are calculated from your return.',
    ],
    watchFor: [
      'Box 71 on a T4 doesn’t guarantee CRA agrees, and a blank box doesn’t mean you can’t claim it. Know your own situation.',
      'If your income is exempt, a TFSA is almost always a better fit than an RRSP — there’s no tax to defer.',
      'Keep records — pay stubs, your contract, anything showing where your duties are performed — in case CRA asks.',
    ],
    sourceHref: '/rights/section-87',
    sourceLabel: 'Section 87 Tax Exemption',
  },
  {
    slug: 'jordans-principle-ask',
    title: 'Jordan’s Principle ask',
    setting: 'For a First Nations child who needs something',
    answer: 'If your child has an unmet need, you can apply directly. The child comes first — always.',
    accent: 'sage',
    published: true,
    bring: [
      'A clear description of what your child needs',
      'A letter from a doctor, therapist, teacher, or other professional explaining the need',
      'Any assessments, medical records, or school reports that show it',
    ],
    say: [
      {
        when: 'When you call',
        line: 'I’d like to make a Jordan’s Principle request for my child. Here is the need and who can speak to it.',
      },
      {
        when: 'If you’re unsure it qualifies',
        line: 'I’d like to apply anyway and have it assessed.',
      },
    ],
    rights: [
      'This is a legal obligation backed by a human rights ruling, not a grant program that can be cut.',
      'It applies whether the child lives on or off reserve. Geography is not a barrier.',
      'You don’t need to be turned down by provincial programs first — you can apply directly.',
      'Response timelines are set by the Tribunal: 12 hours for urgent, 48 hours for standard requests.',
      'A denial can be appealed. Ask for the reason in writing, then request a review.',
    ],
    calls: [
      {
        label: 'Jordan’s Principle Call Centre',
        number: '1-855-572-4453',
        numberHref: 'tel:+18555724453',
      },
    ],
    sourceHref: '/rights/jordans-principle',
    sourceLabel: 'Jordan’s Principle',
  },
  {
    slug: 'medical-travel',
    title: 'NIHB medical travel',
    setting: 'When care isn’t available in your community',
    answer: 'NIHB can cover travel for care you can’t get locally — but arrange it before you go, and keep every receipt.',
    accent: 'water',
    published: true,
    bring: [
      'Your Status card',
      'Your appointment details — where, when, and that the service isn’t available locally',
      'Receipts for everything: gas, meals, accommodation',
    ],
    say: [
      {
        when: 'To your health centre, before travelling',
        line: 'I have a medical appointment that isn’t available here. Can NIHB cover the travel, and what do you need from me?',
      },
      {
        when: 'If you need someone with you',
        line: 'Can a medical escort be approved for this trip?',
      },
    ],
    rights: [
      'Coverage can include gas or mileage, meals, accommodation, and sometimes a medical escort.',
      'It applies when the service you need isn’t available in your community.',
    ],
    watchFor: [
      'Arrange travel through your band health centre or the NIHB regional office before you travel, not after.',
      'Keep all receipts — reimbursement depends on them.',
    ],
    calls: [
      {
        label: 'NIHB information line',
        number: '1-800-580-0950',
        numberHref: 'tel:+18005800950',
      },
    ],
    sourceHref: '/rights/nihb',
    sourceLabel: 'Non-Insured Health Benefits',
  },
];

export function getCarryCard(slug: string): CarryCard | undefined {
  return CARRY_CARDS.find((c) => c.slug === slug);
}
