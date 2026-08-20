/**
 * Every question this site answers, in the words people ask them in.
 *
 * These were scattered across four branch index pages, where each set was
 * visible only to someone already standing on that branch. They are gathered
 * here so one page can hold all of them — which is the site's own index, in
 * her language rather than in the language of the programs.
 *
 * The rule that governs this file is the one `CommonQuestions.astro` states:
 * every question must land on a page that genuinely answers it. A question
 * leading somewhere vague is worse than no question, because it teaches her
 * the site does not really have answers. Add nothing here without opening
 * the destination.
 */

export interface SiteQuestion {
  q: string;
  href: string;
  /** The branch it belongs to, for grouping. */
  branch: 'money' | 'rights' | 'path' | 'self';
}

export const QUESTIONS: SiteQuestion[] = [
  // Rights — what you are entitled to
  { q: 'Can I get help with dental if I have status?', href: '/rights/nihb', branch: 'rights' },
  { q: 'Do I pay tax if I work on reserve?', href: '/rights/section-87', branch: 'rights' },
  { q: 'Is my income tax-exempt?', href: '/rights/section-87-checker', branch: 'rights' },
  { q: 'My child needs something. Who pays for it?', href: '/rights/jordans-principle', branch: 'rights' },
  { q: 'How do I pay for school?', href: '/rights/education-funding', branch: 'rights' },
  { q: 'What are treaty payments?', href: '/rights/treaty-payments', branch: 'rights' },
  { q: "Can I see my Nation's books?", href: '/rights/band-finances', branch: 'rights' },
  { q: 'What am I actually entitled to?', href: '/what-applies', branch: 'rights' },

  // Money — the everyday mechanics
  { q: 'Do I have to file taxes if my income is exempt?', href: '/money/taxes', branch: 'money' },
  { q: 'Where does my money actually go?', href: '/money/budgeting', branch: 'money' },
  { q: 'Will my money last until payday?', href: '/money/forecast', branch: 'money' },
  { q: 'How do I stop paying so much interest?', href: '/money/debt', branch: 'money' },
  { q: 'How do I build credit from zero?', href: '/money/credit', branch: 'money' },
  { q: 'How do I open a bank account?', href: '/money/banking', branch: 'money' },
  { q: 'TFSA, RRSP, FHSA or RESP — which should I use?', href: '/money/saving', branch: 'money' },
  { q: 'How do I start investing?', href: '/money/investing', branch: 'money' },
  { q: 'How do we build wealth that lasts generations?', href: '/money/seven-generations', branch: 'money' },

  // Path — the moment you are in
  { q: 'I just got my first job.', href: '/path/first-job', branch: 'path' },
  { q: "I'm leaving home for school.", href: '/path/leaving-home', branch: 'path' },
  { q: 'Someone died. What happens to their house on reserve?', href: '/moments/someone-passed', branch: 'path' },
  { q: "I'm short this month.", href: '/moments/short-this-month', branch: 'path' },
  { q: 'Money just arrived. What should I do first?', href: '/moments/money-arrived', branch: 'path' },
  { q: 'A letter came and I do not understand it.', href: '/moments/letter-came', branch: 'path' },
  { q: "I'm helping an elder with their money.", href: '/path/supporting-elders', branch: 'path' },

  // Self — the part nobody puts on a form
  { q: 'Why does money stress me out so much?', href: '/self/stress', branch: 'self' },
  { q: 'How do I talk to family about money?', href: '/self/conversations', branch: 'self' },
  { q: 'How do I get confident with money?', href: '/self/confidence', branch: 'self' },
];

export const BRANCH_LABELS: Record<SiteQuestion['branch'], string> = {
  rights: 'What you are entitled to',
  money: 'Everyday money',
  path: 'The moment you are in',
  self: 'The part nobody puts on a form',
};
