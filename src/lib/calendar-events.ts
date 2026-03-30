/**
 * Master list of financial events for First Nations communities.
 * Pure data — no side effects, no storage.
 */

import type { CalendarEvent, CalendarProfile } from './calendar-store';

// Shorthand helpers for relevance filters
const always = () => true;
const ifEmployed = (p: CalendarProfile) => p.isEmployed;
const ifNotExempt = (p: CalendarProfile) => !p.incomeExempt;
const ifExempt = (p: CalendarProfile) => p.incomeExempt;
const ifHasKids = (p: CalendarProfile) => p.hasChildren;
const ifStudent = (p: CalendarProfile) => p.isStudent;
const ifElder = (p: CalendarProfile) => p.isElder;
const ifBandMonth = (month: number) => (p: CalendarProfile) =>
  p.bandDistributionMonths.includes(month);

export const CALENDAR_EVENTS: CalendarEvent[] = [
  // ================================================================
  // JANUARY
  // ================================================================
  {
    id: 'jan-rrsp-planning',
    title: 'RRSP contribution deadline approaching',
    description:
      'The RRSP deadline is in early March. If your income is not Section 87 exempt, now is the time to plan contributions. If your income IS exempt, an RRSP likely will not help you — consider a TFSA instead.',
    month: 0,
    category: 'tax',
    relevantIf: ifNotExempt,
    actionUrl: '/money/saving',
    priority: 'medium',
  },
  {
    id: 'jan-goals-review',
    title: 'Review last year\'s financial goals',
    description:
      'Start the year by looking back. What worked? What didn\'t? Even a quick five-minute reflection helps set direction.',
    month: 0,
    category: 'tax',
    relevantIf: always,
    actionUrl: '/path',
    priority: 'low',
  },

  // ================================================================
  // FEBRUARY
  // ================================================================
  {
    id: 'feb-t4-slips',
    title: 'T4 slips arrive — check Box 71',
    description:
      'Your T4 should arrive by the end of February. If you work on-reserve or your income is Section 87 exempt, check Box 71 — it should show your exempt employment income. If it doesn\'t, contact your employer before filing.',
    month: 1,
    category: 'tax',
    relevantIf: ifEmployed,
    actionUrl: '/rights/section-87',
    priority: 'high',
  },
  {
    id: 'feb-rrsp-warning',
    title: 'RRSP deadline is March 1',
    description:
      'If your income is Section 87 exempt, contributing to an RRSP may not reduce your taxes. A TFSA is usually the better choice for tax-exempt income. Make sure you understand which applies to you before contributing.',
    month: 1,
    category: 'tax',
    relevantIf: always,
    actionUrl: '/money/saving',
    priority: 'high',
  },
  {
    id: 'feb-gis-renewal',
    title: 'GIS renewal period',
    description:
      'If you receive the Guaranteed Income Supplement, renewal materials are sent around this time. Filing your taxes on time is the easiest way to auto-renew. Don\'t let this lapse — it\'s money you\'re entitled to.',
    month: 1,
    category: 'benefits',
    relevantIf: ifElder,
    priority: 'high',
  },

  // ================================================================
  // MARCH
  // ================================================================
  {
    id: 'mar-rrsp-deadline',
    title: 'RRSP contribution deadline — March 1',
    description:
      'Last day to contribute to an RRSP for the previous tax year. Remember: if your income is exempt, this likely won\'t benefit you.',
    month: 2,
    day: 1,
    category: 'tax',
    relevantIf: ifNotExempt,
    priority: 'high',
  },
  {
    id: 'mar-tax-season',
    title: 'Tax season is open — file early',
    description:
      'Filing early means getting your benefits faster. GST/HST credit, Canada Child Benefit, and other payments depend on your return being filed — even if you owe nothing.',
    month: 2,
    category: 'tax',
    relevantIf: always,
    actionUrl: '/money/taxes',
    priority: 'high',
  },
  {
    id: 'mar-free-tax-clinics',
    title: 'Free tax clinic season begins',
    description:
      'Community volunteer tax clinics run from March through April. These are free and available to people with modest incomes. Check with your band office or friendship centre for locations.',
    month: 2,
    category: 'tax',
    relevantIf: always,
    priority: 'medium',
  },

  // ================================================================
  // APRIL
  // ================================================================
  {
    id: 'apr-filing-deadline',
    title: 'Tax filing deadline — April 30',
    description:
      'Your personal tax return is due April 30. Even if your income is exempt, filing ensures you receive GST/HST credits, CCB, and other benefits. Not filing costs you money.',
    month: 3,
    day: 30,
    category: 'tax',
    relevantIf: always,
    actionUrl: '/money/taxes',
    priority: 'high',
  },
  {
    id: 'apr-benefits-warning',
    title: 'Haven\'t filed yet? Benefits may stop',
    description:
      'If you don\'t file your taxes, the CRA will pause your GST/HST credit and Canada Child Benefit payments. File as soon as possible to avoid interruption.',
    month: 3,
    category: 'benefits',
    relevantIf: always,
    priority: 'high',
  },
  {
    id: 'apr-education-funding',
    title: 'Band education funding applications',
    description:
      'Many bands have spring deadlines for post-secondary education funding (PSSSP) for the fall semester. Check with your band\'s education department now — don\'t wait until summer.',
    month: 3,
    category: 'education',
    relevantIf: ifStudent,
    actionUrl: '/rights/education-funding',
    priority: 'high',
  },

  // ================================================================
  // MAY
  // ================================================================
  {
    id: 'may-nihb-reset',
    title: 'NIHB annual benefit resets',
    description:
      'Some Non-Insured Health Benefits categories reset around this time. If you\'ve been putting off dental, vision, or mental health appointments, check your coverage limits.',
    month: 4,
    category: 'health',
    relevantIf: always,
    actionUrl: '/rights/nihb',
    priority: 'medium',
  },
  {
    id: 'may-band-distributions',
    title: 'Spring band distributions',
    description:
      'Some bands issue per-capita or resource-revenue distributions in spring. If your band distributes in May, plan ahead for how you\'ll use it.',
    month: 4,
    category: 'band',
    relevantIf: ifBandMonth(4),
    priority: 'medium',
  },
  {
    id: 'may-resp-review',
    title: 'Review RESP contributions',
    description:
      'If you have children, check whether you\'re getting the Canada Education Savings Grant (20% match up to $500/year). The Canada Learning Bond is available for lower-income families — no contribution required.',
    month: 4,
    category: 'education',
    relevantIf: ifHasKids,
    actionUrl: '/money/saving',
    priority: 'medium',
  },

  // ================================================================
  // JUNE
  // ================================================================
  {
    id: 'jun-indigenous-day',
    title: 'National Indigenous Peoples Day — June 21',
    description:
      'A day to celebrate the heritage, cultures, and contributions of First Nations, Inuit, and Metis peoples. Many communities hold events and gatherings.',
    month: 5,
    day: 21,
    category: 'band',
    relevantIf: always,
    priority: 'low',
  },
  {
    id: 'jun-jordans-principle',
    title: 'Jordan\'s Principle — summer planning',
    description:
      'School\'s almost out. If your child needs support for summer programming, respite care, or therapeutic services, Jordan\'s Principle applications should be submitted now.',
    month: 5,
    category: 'benefits',
    relevantIf: ifHasKids,
    actionUrl: '/rights/jordans-principle',
    priority: 'medium',
  },
  {
    id: 'jun-midyear-checkin',
    title: 'Mid-year budget check-in',
    description:
      'Halfway through the year. How are you tracking against your goals? A quick review now can prevent December surprises.',
    month: 5,
    category: 'tax',
    relevantIf: always,
    actionUrl: '/money/budgeting',
    priority: 'low',
  },

  // ================================================================
  // JULY
  // ================================================================
  {
    id: 'jul-ccb-recalculation',
    title: 'Canada Child Benefit recalculates',
    description:
      'New CCB amounts start in July, based on your previous year\'s tax return. If your income changed, expect a different payment. If you didn\'t file, you may not receive anything.',
    month: 6,
    category: 'benefits',
    relevantIf: ifHasKids,
    priority: 'high',
  },
  {
    id: 'jul-treaty-day',
    title: 'Treaty Day — check your specific dates',
    description:
      'Treaty Day dates vary by treaty. Check with your band office or treaty organization for the date relevant to your community. Treaty payments are typically issued around this time.',
    month: 6,
    category: 'band',
    relevantIf: (p) => p.treatyArea !== null && p.treatyArea !== 'Unceded territory',
    priority: 'medium',
  },
  {
    id: 'jul-student-employment',
    title: 'Summer employment — Section 87 implications',
    description:
      'Working off-reserve this summer? Your employment income may not qualify for Section 87 tax exemption if the work is performed off-reserve. Understand the rules so tax season doesn\'t surprise you.',
    month: 6,
    category: 'tax',
    relevantIf: ifStudent,
    actionUrl: '/rights/section-87',
    priority: 'medium',
  },

  // ================================================================
  // AUGUST
  // ================================================================
  {
    id: 'aug-psssp',
    title: 'PSSSP disbursements — back to school',
    description:
      'Post-Secondary Student Support Program funding for fall semester should be confirmed. If you haven\'t heard from your band\'s education department, follow up now.',
    month: 7,
    category: 'education',
    relevantIf: ifStudent,
    actionUrl: '/rights/education-funding',
    priority: 'high',
  },
  {
    id: 'aug-nihb-school',
    title: 'NIHB claims before school starts',
    description:
      'Book dental and vision appointments before classes begin. NIHB covers these for Status First Nations — get your children\'s check-ups done while there\'s still time.',
    month: 7,
    category: 'health',
    relevantIf: ifHasKids,
    actionUrl: '/rights/nihb',
    priority: 'medium',
  },
  {
    id: 'aug-education-confirm',
    title: 'Education funding confirmations',
    description:
      'Confirm your funding letter, living allowance amounts, and tuition payment timelines. Know exactly what\'s covered before the semester starts so there are no gaps.',
    month: 7,
    category: 'education',
    relevantIf: ifStudent,
    priority: 'medium',
  },

  // ================================================================
  // SEPTEMBER
  // ================================================================
  {
    id: 'sep-student-budget',
    title: 'Fall semester — student budget planning',
    description:
      'New semester, new expenses. Map out your living allowance, tuition coverage, and any gaps. A simple spending plan now prevents stress in November.',
    month: 8,
    category: 'education',
    relevantIf: ifStudent,
    actionUrl: '/money/budgeting',
    priority: 'medium',
  },
  {
    id: 'sep-band-distributions',
    title: 'Fall band distributions',
    description:
      'Some bands issue distributions in the fall. If your band distributes in September, plan ahead — decide before the money arrives how you\'ll use it.',
    month: 8,
    category: 'band',
    relevantIf: ifBandMonth(8),
    priority: 'medium',
  },
  {
    id: 'sep-resp-contribution',
    title: 'RESP contribution before year-end',
    description:
      'There\'s still time to contribute to your child\'s RESP and get the government match this year. Even small amounts trigger the 20% Canada Education Savings Grant.',
    month: 8,
    category: 'education',
    relevantIf: ifHasKids,
    actionUrl: '/money/saving',
    priority: 'low',
  },

  // ================================================================
  // OCTOBER
  // ================================================================
  {
    id: 'oct-financial-checkin',
    title: 'Fall financial check-in',
    description:
      'Three months left in the year. Are you on track? Review your savings, spending, and any year-end actions you need to take.',
    month: 9,
    category: 'tax',
    relevantIf: always,
    actionUrl: '/money/budgeting',
    priority: 'low',
  },
  {
    id: 'oct-heating-support',
    title: 'Heating cost support programs',
    description:
      'Provincial heating and utility assistance programs often open in the fall. Check what\'s available in your province — these programs are time-limited.',
    month: 9,
    category: 'benefits',
    relevantIf: always,
    priority: 'medium',
  },
  {
    id: 'oct-open-enrollment',
    title: 'Open enrolment for workplace benefits',
    description:
      'If you have workplace benefits, open enrolment often happens in the fall. Review your coverage — especially health, dental, and life insurance. Make changes before the deadline.',
    month: 9,
    category: 'benefits',
    relevantIf: ifEmployed,
    priority: 'medium',
  },

  // ================================================================
  // NOVEMBER
  // ================================================================
  {
    id: 'nov-year-end-planning',
    title: 'Year-end tax planning',
    description:
      'Last chance for deductions before December 31. If you have employment income that\'s not exempt, consider RRSP top-ups or charitable donations.',
    month: 10,
    category: 'tax',
    relevantIf: ifNotExempt,
    priority: 'medium',
  },
  {
    id: 'nov-tfsa-planning',
    title: 'TFSA contribution room resets January 1',
    description:
      'New TFSA room opens on January 1. If you have unused room from this year, you can still contribute. The TFSA is especially powerful for Section 87 exempt income — growth is never taxed.',
    month: 10,
    category: 'tax',
    relevantIf: always,
    actionUrl: '/money/saving',
    priority: 'medium',
  },
  {
    id: 'nov-holiday-planning',
    title: 'Community holiday planning',
    description:
      'December spending can sneak up. Set a budget now for gifts, travel, and gatherings. Knowing your number ahead of time makes the season less stressful.',
    month: 10,
    category: 'band',
    relevantIf: always,
    actionUrl: '/money/budgeting',
    priority: 'low',
  },

  // ================================================================
  // DECEMBER
  // ================================================================
  {
    id: 'dec-tfsa-deadline',
    title: 'TFSA contribution deadline — December 31',
    description:
      'Last day to contribute to your TFSA for this year. Any unused room carries forward, but the government match on RESPs does not — use it or lose it.',
    month: 11,
    day: 31,
    category: 'tax',
    relevantIf: always,
    actionUrl: '/money/saving',
    priority: 'medium',
  },
  {
    id: 'dec-charitable-donations',
    title: 'Year-end charitable donations',
    description:
      'If you make charitable donations and have taxable income, December 31 is the deadline for this tax year\'s receipts. Donations can reduce the tax you owe.',
    month: 11,
    category: 'tax',
    relevantIf: ifNotExempt,
    priority: 'low',
  },
  {
    id: 'dec-band-holiday',
    title: 'Band holiday distributions',
    description:
      'Some bands issue holiday or year-end distributions in December. If yours does, plan in advance — decide what portion goes to spending, saving, and sharing.',
    month: 11,
    category: 'band',
    relevantIf: ifBandMonth(11),
    priority: 'medium',
  },
  {
    id: 'dec-year-reflection',
    title: 'Reflect on your financial year',
    description:
      'What did you learn about money this year? What felt good? What was hard? Setting intentions now, while the year is fresh, gives next year a stronger start.',
    month: 11,
    category: 'tax',
    relevantIf: always,
    actionUrl: '/path',
    priority: 'low',
  },
];
