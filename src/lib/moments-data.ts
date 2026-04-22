/**
 * Moments — places to come when life shifts.
 *
 * Every moment follows the same shape so that, when someone is stressed,
 * the interface doesn't ask them to learn something new. The voice is
 * warm and soft: offering, not pronouncing. Sitting beside, not in front.
 */

export interface MomentPrompt {
  id: string;
  title: string;
  body: string;
  why: string;
}

export interface MomentCall {
  id: string;
  label: string;
  number?: string;
  numberHref?: string;
  script: string;
}

export interface MomentSection {
  id: string;
  heading?: string;
  paragraphs: string[];
}

export type MomentTone = 'heavy' | 'neutral' | 'warm';

export interface Moment {
  slug: string;
  title: string;
  cardPrompt: string;
  cardHint?: string;
  tone: MomentTone;
  published: boolean;
  opening?: string;
  sections?: MomentSection[];
  prompts?: MomentPrompt[];
  calls?: MomentCall[];
  watchFor?: string[];
  closingNote?: string;
  relatedTools?: { label: string; href: string }[];
  relatedArticles?: { label: string; href: string }[];
}

export const MOMENTS: Moment[] = [
  {
    slug: 'someone-passed',
    title: 'Someone passed',
    cardPrompt: 'When someone you love has passed',
    tone: 'heavy',
    published: true,
    opening:
      "Take the time you need. Most of the financial pieces can wait, and most have longer than they feel like they do. This page will be here when you want it — or when someone in the family asks a question and you'd like somewhere to look.",
    sections: [
      {
        id: 'things-to-know',
        heading: 'Some things, when you’re ready',
        paragraphs: [
          "The funeral is its own piece. Costs are usually paid first, by family or from the deceased’s account. The rest of the estate has its own pace.",
          "If they had Status and property on reserve, the estate moves through ISC, not provincial probate. A different path — slower, less expensive, less familiar to most lawyers.",
          "A Status card needs to be cancelled eventually. There’s no rush on the date.",
          "Some benefits shift for the household — CPP survivor, OAS allowance, CCB if there are children. Most are retroactive to the day they passed, so the timing of the call isn’t what matters.",
          "Memorial costs belong in this picture, not outside it. A feast or a giveaway is part of the financial reality, not separate from it.",
        ],
      },
      {
        id: 'gentle-start',
        heading: 'A gentle place to start, if you want one',
        paragraphs: [
          "Nothing needs doing today.",
          "When it’s time, gathering a few things in one place helps: Status card, SIN, a will if there was one, bank statements, any land or housing papers from the reserve. Someone else in the family can photograph them, so you don’t have to remember for everyone.",
        ],
      },
    ],
    prompts: [
      {
        id: 'estate-process',
        title: 'Understanding the estate process',
        body: "My [relation] passed on [date]. They were a Status Indian and had [property / bank accounts / a house on reserve]. Could you explain, in plain English, the difference between ISC estate administration and provincial probate — and what I should expect in the first month? I’d like to understand before I call anyone.",
        why: "Naming the specifics (Status, on reserve), asking for plain English, and asking for a time horizon gives Claude enough to give you a real answer, not a generic one.",
      },
      {
        id: 'survivor-benefits',
        title: 'Benefits that may have shifted',
        body: "My [relation] passed on [date]. They were [age] and had been receiving [CPP / OAS / other]. I’m the [spouse / adult child / dependent]. Could you walk me through, in plain English, which federal benefits I might be eligible for now — CPP survivor, OAS allowance, CCB — and what the first steps look like?",
        why: "We named the relationships and what they were receiving. That’s what makes the answer specific instead of a list of every possible benefit.",
      },
    ],
    calls: [
      {
        id: 'isc-estates',
        label: 'ISC Estates Unit',
        number: '1-888-917-9977',
        numberHref: 'tel:+18889179977',
        script:
          "My [relation] passed. They were a Status Indian with property on reserve. I’d like to understand the estate process and what documents you’ll need.",
      },
      {
        id: 'service-canada',
        label: 'Service Canada',
        number: '1-800-277-9914',
        numberHref: 'tel:+18002779914',
        script:
          "I’d like to apply for the CPP survivor benefit. I don’t have all the documents yet — could you walk me through what’s needed?",
      },
      {
        id: 'band-admin',
        label: 'Your band’s administration office',
        script:
          "Ask about membership removal for the deceased, any on-reserve housing transfer, and whether there are community supports for memorial costs.",
      },
    ],
    watchFor: [
      "Funeral home financing paperwork is worth reading fully before signing — the fees on those loans are among the worst in the consumer market.",
      "Scammers read obituaries. Calls claiming to be from a bank or government asking for account details after a death are a known pattern. Calling back on the number from the statement is the safer move.",
      "Closing accounts quickly isn’t necessary — estate administration usually needs them open until it’s processed.",
    ],
    closingNote: "Come back when you need to. The page doesn’t move.",
  },

  {
    slug: 'money-arrived',
    title: 'Money arrived',
    cardPrompt: 'When money has arrived',
    cardHint: 'A settlement, per capita, treaty payment, refund, or gift.',
    tone: 'warm',
    published: true,
    opening:
      "Money arrived. There’s no rush. Most decisions can wait a week, a month, sometimes longer. The things that feel most urgent — a family member calling, a big purchase you’ve been waiting for, a worry about where to put it — can all sit for a few days. You have time.",
    sections: [
      {
        id: 'things-to-know',
        heading: 'Some things, when you’re ready',
        paragraphs: [
          "What kind of money this is matters for taxes. A per capita distribution, a settlement, a treaty payment, a tax refund, and an inheritance are all treated differently by the CRA. Before any big move, it’s worth knowing which category this one falls into.",
          "A week or two of the money sitting in a savings account doesn’t cost anything — it earns a bit of interest while you decide. The pressure to do something now is almost always a feeling, not a deadline.",
          "Family will ask. That’s normal. Saying “let me think for a week” doesn’t disrespect the ask — it protects both the money and the relationship.",
          "Section 87 doesn’t automatically follow the money into whatever you do with it next. Where an investment is held matters more than where you live. Worth understanding before you hand anything to an advisor.",
          "If it’s a large sum, the first question isn’t what to invest in. It’s: what would I regret a year from now.",
        ],
      },
      {
        id: 'gentle-start',
        heading: 'A gentle place to start, if you want one',
        paragraphs: [
          "If it’s sitting in a chequing account, moving it to a HISA (high-interest savings account) at any bank takes ten minutes and lets the money earn a little while you think. Any bank works.",
          "A piece of paper with three columns helps: things I want, things my family wants, things that will matter in ten years. There’s no rush to act on any of it. The list clarifies on its own over a week or two.",
          "For any single decision over a few thousand dollars, two weeks is a reasonable waiting period. Most people who regret a decision made it in the first forty-eight hours.",
        ],
      },
    ],
    prompts: [
      {
        id: 'tax-treatment',
        title: 'Understand what kind of money this is',
        body: "I received $[amount] from [settlement / per capita / treaty / tax refund / inheritance / other] on [date]. I’m a Status Indian and I [live on reserve / live off reserve]. Could you explain, in plain English, how this type of payment is treated for taxes, what I’ll need to report (if anything), and whether Section 87 applies to what I do with it next?",
        why: "Naming the type of money, your Status situation, and Section 87 specifically — so the answer addresses your actual tax picture, not a generic list.",
      },
      {
        id: 'think-through-first-decision',
        title: 'Think through the first decision',
        body: "I just received a large sum of money and I don’t have to decide what to do with it immediately. Could you help me think through questions I should ask myself before I make any moves? Not what I should do — what I should think about. My situation: [briefly: your family, any debt, any urgent needs, your age].",
        why: "Asking for questions, not answers, keeps the decision with you. Claude is helping you think, not telling you what to do.",
      },
    ],
    calls: [
      {
        id: 'cra-individual',
        label: 'CRA Individual Income Tax',
        number: '1-800-959-8281',
        numberHref: 'tel:+18009598281',
        script:
          "I received $[amount] from [source]. I want to understand how this should be reported on my next tax return, and whether any of it is exempt under Section 87.",
      },
      {
        id: 'band-admin',
        label: 'Your band’s administration office',
        script:
          "Is there guidance from the Nation on tax treatment for this distribution? And is there a trust or pooled investment option for members that I should know about?",
      },
      {
        id: 'tax-advisor',
        label: 'An Indigenous-experienced tax advisor (for settlements over ~$25K)',
        script:
          "I received a settlement. I’d like a one-hour consultation to understand the tax picture and my options before I move any of the money.",
      },
    ],
    watchFor: [
      "Unsolicited calls and offers in the first sixty days after a large sum arrives are almost always a scam. Car dealerships, boat dealers, and high-fee investment schemes read settlement lists.",
      "Anyone promising a “quick” or “guaranteed” return on an investment is selling something dangerous. Real investing is boring on purpose.",
      "When family asks for a loan, writing down the amount, the date, and what’s expected back protects the relationship more than a handshake does. Silence and a week to think is also a reasonable answer.",
    ],
    closingNote: "The money will wait for you. Come back when you’re ready.",
    relatedTools: [
      { label: 'Distribution Planner', href: '/tools/distribution-planner' },
      { label: 'Settlement Simulator', href: '/tools/settlement-simulator' },
    ],
  },

  {
    slug: 'letter-came',
    title: 'A letter came',
    cardPrompt: 'When a letter arrives',
    cardHint: 'From the CRA, ISC, a band office, or a collections agency.',
    tone: 'neutral',
    published: true,
    opening:
      "A letter came — from the CRA, ISC, a band office, a collections agency, or somewhere else that felt official. Two things are usually true about these letters: most have more time built in than they feel like they do, and almost nothing on them means what it looks like to mean on first read.",
    sections: [
      {
        id: 'things-to-know',
        heading: 'Some things, when you’re ready',
        paragraphs: [
          "Read it once, all the way through. Then photograph or scan every page, front and back. If the paper goes missing later, the copy is there.",
          "Look for two pieces of information: what they’re asking for, and when they want it by. Most deadlines are thirty to ninety days, not “immediately.”",
          "A notice is not a judgement. It’s a step in a process that can almost always be responded to. Even a CRA assessment can be objected to. Even a collections notice can be disputed.",
          "The language of official letters is designed to sound final. It rarely is. That design makes people panic or ignore — both work against them.",
          "Not understanding what a letter is asking is the normal starting point, not an embarrassing one. Translating is the first step.",
        ],
      },
      {
        id: 'gentle-start',
        heading: 'A gentle place to start, if you want one',
        paragraphs: [
          "Put the letter somewhere you won’t lose it. An envelope, a folder, a shelf. On the outside, write: what it’s about, when the response is due, and who could help.",
          "If the deadline feels close, marking two weeks before the deadline on a calendar gives a real signal and takes the pressure off the next two weeks.",
          "If the letter mentions a reference or case number, photograph it now. That number is the first thing they’ll ask for on the phone.",
        ],
      },
    ],
    prompts: [
      {
        id: 'translate',
        title: 'Translate the letter into plain English',
        body: "I received this letter from [CRA / ISC / a band office / a collections agency / other]. The main lines say: [paste the main lines or describe]. Could you explain, in plain English, what they’re actually asking for, what my options are, and what the real deadline is?",
        why: "Naming the sender tells Claude what framework the letter is operating under. Asking for options keeps the decision with you.",
      },
      {
        id: 'draft-response',
        title: 'Draft a respectful response',
        body: "I need to respond to a letter from [sender] about [topic]. My situation: [what’s true for you]. I’d like a short, respectful letter that [asks for more time / disputes what they’ve said / asks for clarification / acknowledges and asks what’s next]. Formal but human. Not pleading.",
        why: "“Formal but human. Not pleading.” — the tone stays yours. It also signals to the reader that you know how this process works.",
      },
    ],
    calls: [
      {
        id: 'cra',
        label: 'CRA Individual Inquiries',
        number: '1-800-959-8281',
        numberHref: 'tel:+18009598281',
        script:
          "I received a [type] notice. I’d like to understand what it’s asking and confirm the deadline for my response.",
      },
      {
        id: 'isc',
        label: 'ISC General Inquiries',
        number: '1-800-567-9604',
        numberHref: 'tel:+18005679604',
        script:
          "I received a letter from your office about [topic]. Could you help me understand what it’s asking?",
      },
      {
        id: 'consumer-protection',
        label: 'Consumer Protection BC (for collections letters)',
        number: '1-888-564-9963',
        numberHref: 'tel:+18885649963',
        script:
          "I received a collections notice from [company]. I’d like to understand my rights and what a reasonable response looks like.",
      },
    ],
    watchFor: [
      "Letters using “urgent” or “final” in the subject but offering a thirty-day response window are trying to create pressure. Read the date, not the tone.",
      "Any follow-up call asking for payment by gift card, e-transfer to an individual, or cryptocurrency is a scam. No real agency ever collects this way.",
      "Email or text from “Canada Revenue Agency” with a link to a login page is phishing almost every time. The real CRA mails paper letters first.",
    ],
    closingNote: "You have more time than the letter makes it feel.",
    relatedTools: [
      { label: 'AI Help — Draft a letter', href: '/ask-ai' },
    ],
  },

  {
    slug: 'short-this-month',
    title: 'Short this month',
    cardPrompt: 'When money is tight',
    cardHint: 'Rent is close, a bill is due, and the paycheque doesn’t cover it.',
    tone: 'neutral',
    published: true,
    opening:
      "Being short a month is more common than anyone talks about. Most people, most years, have one like this. The goal of this page is to help you make it through without making the next month worse.",
    sections: [
      {
        id: 'things-to-know',
        heading: 'Some things, when you’re ready',
        paragraphs: [
          "Not every bill is the same. Rent, the utilities you need to keep, and food matter more than most “can’t miss” payments. Some things can be negotiated, paused, or skipped for a month with no lasting harm.",
          "Borrowing from a payday lender, a car title lender, or a high-interest online loan almost always makes next month harder than this one. The math isn’t close.",
          "The less dramatic options — calling a bill provider, asking for an extension, using a band emergency fund if your community has one — usually work and almost always go unused.",
          "If there’s room on a credit card, using it for essentials and paying the minimum this month is often cheaper than a payday loan, even with credit-card interest. Not ideal. Much better than the alternative.",
          "Food banks aren’t a last resort. They’re part of how most communities share the load, and using one this month doesn’t mean using one next month.",
        ],
      },
      {
        id: 'gentle-start',
        heading: 'A gentle place to start, if you want one',
        paragraphs: [
          "Write down what’s actually coming in, what’s actually owed out, and what the real gap is. Sometimes the gap is smaller than the feeling.",
          "Separate the bills into three piles: must pay now, can call about, can wait a few weeks.",
          "Pick one call to make today. Just one. The phone company, the utility, the landlord. “I’m going to be a few days late this month — what are my options?”",
        ],
      },
    ],
    prompts: [
      {
        id: 'prioritise',
        title: 'Prioritise this month’s bills',
        body: "I’m short about $[amount] this month. My bills: [rent $X, utilities $X, phone $X, credit card minimum $X, etc.]. My income this month is $[amount]. Could you help me think through which ones to pay now, which ones to call about, and which ones can safely wait a few weeks? Plain English, and assume I don’t want to hurt my credit more than necessary.",
        why: "The real bills get you a real ranking, not generic advice. Naming the credit concern shapes the order.",
      },
      {
        id: 'missing-benefits',
        title: 'Find money I might have missed',
        body: "I’m short this month. I’m a Status Indian [living on / off] reserve, [employed / between jobs / student / other], [with / without] children. Could you list, in plain English, the federal, provincial, and community benefits I might be eligible for but not currently receiving? Just the ones that apply to my situation.",
        why: "Most people don’t realise what benefits they’re missing until someone asks directly. The specifics narrow the list to what’s actually worth checking.",
      },
      {
        id: 'extension-letter',
        title: 'Ask for an extension',
        body: "I need to write a short, respectful note to [my landlord / utility company / phone provider / credit card company] asking for a two-week extension on this month’s payment because of a temporary cash-flow issue. Formal but honest. Nothing pleading.",
        why: "“Formal but honest. Nothing pleading.” keeps the tone yours. Real adults talk this way — it gets better results than apologies do.",
      },
    ],
    calls: [
      {
        id: 'utility',
        label: 'Your utility company (number on the last bill)',
        script:
          "I’m going to be a few days late this month. Could we set up a short-term payment arrangement?",
      },
      {
        id: 'landlord',
        label: 'Your landlord',
        script:
          "I can pay on [date] instead of the 1st this month. Is that workable?",
      },
      {
        id: 'band-admin',
        label: 'Your band’s administration office',
        script:
          "Does the band have an emergency fund, a short-term loan program, or any supports for members in a tight month?",
      },
      {
        id: '211',
        label: '211 — provincial social services information',
        number: '2-1-1',
        numberHref: 'tel:211',
        script:
          "I’m looking for emergency assistance in [city or region]. Food, utility support, rent — what’s available?",
      },
    ],
    watchFor: [
      "Payday loans and car title loans are almost always the most expensive option. $300 borrowed for two weeks, rolled over six months, ends up costing around $450 in fees on top of the $300 — the next month is worse, not better.",
      "“Buy now, pay later” services (Klarna, Afterpay, Affirm) charge serious late fees and report to credit bureaus. Fine for planned purchases, risky for emergencies.",
      "Cheque-cashing places take a percentage that a bank doesn’t. If there’s a bank account, use it — even if the wait is a few days.",
    ],
    closingNote: "One month doesn’t define anything. Most months aren’t this.",
    relatedTools: [
      { label: 'Budget Snapshot', href: '/money/budget-tool' },
      { label: 'Benefits Finder', href: '/self/benefits' },
      { label: 'Debt Planner', href: '/money/debt-planner' },
    ],
  },

  {
    slug: 'first-paycheque',
    title: 'First paycheque',
    cardPrompt: 'When a first paycheque is coming',
    cardHint: 'Your first job, or a return to work after a long pause.',
    tone: 'warm',
    published: true,
    opening:
      "First paycheques feel bigger and smaller than they really are. Bigger, because the number on the offer letter is in your head. Smaller, once you see what comes out. Neither is a reason to change any plans — just a reason to understand what’s actually happening.",
    sections: [
      {
        id: 'things-to-know',
        heading: 'Some things, when you’re ready',
        paragraphs: [
          "The number on the offer letter is called “gross.” What lands in the account is “net.” The difference is income tax, CPP, EI, and sometimes health benefits or pension contributions. For most Canadians, expect twenty to thirty percent off the top.",
          "If the job is on reserve, and the employer is headquartered on reserve, Section 87 may apply and change the tax picture significantly. Worth checking now, not at tax time.",
          "There’s a form called a TD1 that the employer handed over at hiring. The default setting is fine for most people — but if there are kids, caregiving responsibilities, or tuition credits to claim, it’s worth re-checking.",
          "The first dollar saved from a first paycheque matters more than the last dollar saved twenty years from now. Not because of anything magical. Because you get to practise for longer.",
        ],
      },
      {
        id: 'gentle-start',
        heading: 'A gentle place to start, if you want one',
        paragraphs: [
          "Let the first paycheque land. Look at it. See the gap between what was expected and what arrived.",
          "If it’s possible, opening a separate savings account (HISA) at a different bank from the main one helps more than any investment strategy. When money is inconvenient to spend, you spend less of it.",
          "One small automatic transfer — $20, $50, $100 — into that account on every pay day. Small is better than skipped.",
        ],
      },
    ],
    prompts: [
      {
        id: 'paystub',
        title: 'Understand what’s coming out of my paycheque',
        body: "I just got my first paycheque at a [job type] in [city / on reserve / off reserve]. My gross pay is $[amount per pay period]. Could you explain, in plain English, each line item I should expect to see on the paystub — what CPP, EI, and income tax are taking and why — so I can read my paystubs going forward?",
        why: "Asking for the structure of a paystub, not just the total, means every future paystub will be readable too.",
      },
      {
        id: 'section-87-work',
        title: 'Figure out if Section 87 applies to this job',
        body: "I’m a Status Indian. I just started a job [with / without] my employer’s headquarters on reserve. I [live on / off] reserve. My work [is / is not] primarily for the benefit of a reserve community. Could you explain, in plain English, whether Section 87 is likely to apply to my employment income, and what I’d need to do if it does?",
        why: "Section 87 is the most misunderstood rule in Indigenous personal finance. Asking about the specific work arrangement gives you a real answer, not a general summary.",
      },
    ],
    calls: [
      {
        id: 'payroll',
        label: 'Your employer’s payroll or HR',
        script:
          "I’m [a Status Indian / new to payroll / returning to work after a break]. Could we double-check my TD1 form is set up correctly for my situation?",
      },
      {
        id: 'cra',
        label: 'CRA Individual Inquiries',
        number: '1-800-959-8281',
        numberHref: 'tel:+18009598281',
        script:
          "I’ve just started work and I’d like to understand whether Section 87 applies to my employment income.",
      },
      {
        id: 'band-admin',
        label: 'Your band’s administration office (if working on reserve)',
        script:
          "Does the Nation have guidance for members on Section 87 treatment for on-reserve employment?",
      },
    ],
    watchFor: [
      "Payroll apps offering “instant cash advances” on upcoming paycheques usually charge steep fees. The wait is almost always worth the saving.",
      "The first few paycheques after a life change are when lifestyle spending locks in. Waiting a few pay periods before increasing rent, car payments, or subscriptions saves more than any investment decision.",
      "If the paycheque goes into the same account as everyday spending, most of it disappears before it can be noticed. Separation is the cheapest discipline there is.",
    ],
    closingNote: "A paycheque is a rhythm, not a moment. The second one is easier than the first.",
    relatedTools: [
      { label: 'Tax Estimator', href: '/tools/tax-estimator' },
      { label: 'Savings Tracker', href: '/money/savings-tracker' },
    ],
  },
];

export function getMoment(slug: string): Moment | null {
  return MOMENTS.find((m) => m.slug === slug) ?? null;
}

export function getPublishedMoments(): Moment[] {
  return MOMENTS.filter((m) => m.published);
}
