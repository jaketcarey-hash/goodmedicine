/**
 * Everything on the site, in one list.
 *
 * A one-stop shop only works if you can see what is in the shop. Search finds
 * a thing you can already name; this is for the person who does not yet know
 * what to call it, and for anyone who wants to know whether it is worth coming
 * back.
 *
 * Hand-ordered rather than generated. The generated version would be
 * alphabetical, and alphabetical puts "Ask AI" above "Benefits Finder", which
 * is not how anyone thinks about it.
 */
export interface DirectoryLink {
  label: string;
  href: string;
  note?: string;
}

export interface DirectorySection {
  heading: string;
  blurb?: string;
  links: DirectoryLink[];
}

export const DIRECTORY: DirectorySection[] = [
  {
    heading: 'Work something out',
    blurb: 'Tools that take what you know and give you a number or an answer.',
    links: [
      { label: 'What applies to me', href: '/what-applies', note: 'Narrow the question, and who to ask' },
      { label: 'Your Money Plan', href: '/money/plan', note: 'Where you stand, and what usually helps' },
      { label: 'Section 87 Checker', href: '/rights/section-87-checker', note: 'Is your income exempt?' },
      { label: 'Benefits Finder', href: '/self/benefits', note: 'What you may be entitled to' },
      { label: 'Tax Estimator', href: '/tools/tax-estimator', note: 'What you will owe or get back' },
      { label: 'Budget', href: '/money/budget-tool', note: 'Where it actually goes' },
      { label: 'Savings Tracker', href: '/money/savings-tracker' },
      { label: 'Debt Planner', href: '/money/debt-planner' },
      { label: 'Net Worth', href: '/money/net-worth' },
      { label: 'Life Simulator', href: '/tools/life-simulator', note: 'What if I move, or go back to school?' },
      { label: 'Settlement Simulator', href: '/tools/settlement-simulator' },
      { label: 'Distribution Planner', href: '/tools/distribution-planner' },
      { label: 'Financial Calendar', href: '/calendar' },
      { label: 'Ask AI', href: '/ask-ai', note: 'Prompts to take to a chatbot' },
    ],
  },
  {
    heading: 'Your rights',
    links: [
      { label: 'Section 87 and the on-reserve exemption', href: '/rights/section-87' },
      { label: 'Non-Insured Health Benefits', href: '/rights/nihb', note: 'Dental, vision, prescriptions, travel' },
      { label: "Jordan's Principle", href: '/rights/jordans-principle' },
      { label: 'Treaty payments', href: '/rights/treaty-payments' },
      { label: 'Education funding', href: '/rights/education-funding' },
      { label: 'Band finances', href: '/rights/band-finances' },
      { label: 'Carry Cards', href: '/rights/carry-cards', note: 'What to say at the counter' },
    ],
  },
  {
    heading: 'Your money',
    links: [
      { label: 'Banking', href: '/money/banking' },
      { label: 'Budgeting', href: '/money/budgeting' },
      { label: 'Saving', href: '/money/saving' },
      { label: 'Credit', href: '/money/credit' },
      { label: 'Debt', href: '/money/debt' },
      { label: 'Investing', href: '/money/investing' },
      { label: 'Taxes and filing', href: '/money/taxes' },
      { label: 'Seven generations', href: '/money/seven-generations' },
    ],
  },
  {
    heading: 'Where you are',
    blurb: 'Guides for a particular stretch of life, and places to come when it shifts.',
    links: [
      { label: 'Leaving home', href: '/path/leaving-home' },
      { label: 'First job', href: '/path/first-job' },
      { label: 'Building a life', href: '/path/building-life' },
      { label: 'Raising a family', href: '/path/raising-family' },
      { label: 'Supporting elders', href: '/path/supporting-elders' },
      { label: 'Career growth', href: '/path/career-growth' },
      { label: 'Giving back and business', href: '/path/giving-back' },
      { label: 'Moments', href: '/moments', note: 'Someone died · money arrived · short this month' },
    ],
  },
  {
    heading: 'Yourself',
    links: [
      { label: 'Money check-in', href: '/self' },
      { label: 'Financial stress', href: '/self/stress' },
      { label: 'Confidence with money', href: '/self/confidence' },
      { label: 'Money conversations', href: '/self/conversations' },
    ],
  },
  {
    heading: 'What is happening',
    blurb: 'The news side. Useful if you follow this, easy to ignore if you do not.',
    links: [
      { label: 'The Nations', href: '/nations', note: "Today's brief" },
      { label: 'Archive', href: '/nations/archive' },
      { label: 'First Nations of British Columbia', href: '/nations/bc', note: 'All 201, and what has been tracked' },
      { label: 'Event ledger', href: '/nations/ledger' },
      { label: 'Open questions', href: '/nations/open' },
    ],
  },
  {
    heading: 'Look something up',
    links: [
      { label: 'Search everything', href: '/search' },
      { label: 'Glossary', href: '/glossary', note: '89 terms in plain language' },
      { label: 'Learning paths', href: '/learn' },
      { label: 'Resources', href: '/resources', note: 'Books, organizations, crisis lines' },
      { label: 'Your data', href: '/settings' },
      { label: 'Disclaimer', href: '/disclaimer' },
    ],
  },
];
