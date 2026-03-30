/**
 * Prompt Builder — generates context-rich prompts for Claude AI.
 *
 * Each function takes user-supplied data and returns a carefully structured
 * prompt string. The prompts set First Nations / Section 87 context, include
 * the user's specific situation, and ask for plain-language, actionable guidance.
 *
 * Nothing here touches a network. Prompts are assembled on-device and only
 * leave when the user explicitly copies or opens Claude.
 */

// ── Shared preamble ──────────────────────────────────────────

const IDENTITY =
  'I am a First Nations person in Canada with Status under the Indian Act.';

const CLOSING =
  'Please use Canadian context and be aware of Section 87 of the Indian Act where relevant. Explain in plain language. Be direct and practical.';

function wrap(body: string): string {
  return `${IDENTITY}\n\n${body.trim()}\n\n${CLOSING}`;
}

// ── Section 87 deep analysis ─────────────────────────────────

interface Section87Situation {
  hasStatus: boolean;
  workLocation: string;
  employerLocation: string;
  benefitsReserve: string;
  livesOnReserve: string;
}

export function buildSection87Prompt(situation: Section87Situation): string {
  const labels: Record<string, string> = {
    'on-reserve': 'on reserve',
    'off-reserve': 'off reserve',
    mixed: 'a mix of on-reserve and off-reserve',
    yes: 'yes',
    no: 'no',
    'not-sure': 'not sure',
  };

  const loc = labels[situation.workLocation] ?? situation.workLocation;
  const emp = labels[situation.employerLocation] ?? situation.employerLocation;
  const ben = labels[situation.benefitsReserve] ?? situation.benefitsReserve;
  const res = labels[situation.livesOnReserve] ?? situation.livesOnReserve;

  return wrap(`I need a detailed analysis of whether my employment income qualifies for the Section 87 tax exemption under the Indian Act. Here is my situation:

- Status: ${situation.hasStatus ? 'I have registered Indian Status' : 'I do not have Status'}
- Where I perform my work duties: ${loc}
- Employer located on reserve: ${emp}
- Work primarily benefits reserve residents: ${ben}
- I live on reserve: ${res}

Please walk me through the connecting factors test (the "Williams test" / Bastien and Dubé framework) as it applies to my specific facts. For each connecting factor — location of work duties, employer residence, nature and purpose of employment, and employee residence — explain how my situation weighs for or against exemption.

Then give me:
1. Your overall assessment of whether my income is likely exempt, likely not exempt, or in a grey zone
2. What documentation I should gather to support my position
3. Whether I should seek a professional opinion, and what kind of professional to look for
4. How this affects my tax filing strategy (Form T90, RRSP vs TFSA, etc.)
5. Any risks I should be aware of if I claim or do not claim the exemption`);
}

// ── CRA notice explainer ─────────────────────────────────────

export function buildCRANoticePrompt(noticeType: string, details: string): string {
  return wrap(`I received a notice from the Canada Revenue Agency (CRA) and I need help understanding what it means and what I should do.

Type of notice: ${noticeType}

What the notice says (in my own words): ${details}

Please help me understand:
1. What this notice means in plain language — what is the CRA telling me?
2. Is there a deadline I need to worry about? What happens if I miss it?
3. What are my options? Can I dispute this or request a review?
4. Does my First Nations Status or Section 87 exemption change anything about how I should respond?
5. Step-by-step: what should I do right now, and in what order?
6. Should I get professional help, and if so, what kind?

If this relates to income I believe is exempt under Section 87, explain how the Notice of Objection process works and what evidence I would need.`);
}

// ── NIHB appeal helper ───────────────────────────────────────

export function buildNIHBAppealPrompt(
  serviceType: string,
  denialReason: string,
  details: string,
): string {
  return wrap(`I am a Status Indian and my Non-Insured Health Benefits (NIHB) claim was denied. I need help understanding the denial and preparing an appeal.

Service that was denied: ${serviceType}
Reason given for denial: ${denialReason}
Additional details about my situation: ${details}

Please help me with:
1. Why NIHB might have denied this specific service — what are common reasons?
2. Is this the kind of denial that can be successfully appealed?
3. Walk me through the NIHB appeal process step by step — timelines, forms, who to contact
4. What supporting documentation should I gather? (e.g., letter from my healthcare provider, medical necessity statement)
5. Draft a brief, professional appeal letter I can adapt for my situation — include the key points that tend to strengthen an appeal
6. If the internal appeal fails, what are my next options?
7. Are there any patient advocacy organizations or legal resources that help with NIHB appeals?`);
}

// ── Budget advice ────────────────────────────────────────────

export function buildBudgetAdvicePrompt(
  income: number,
  expenses: number,
  topCategories: string[],
): string {
  const diff = income - expenses;
  const status = diff > 0
    ? `a monthly surplus of $${Math.round(diff)}`
    : diff < 0
      ? `a monthly shortfall of $${Math.round(Math.abs(diff))}`
      : 'income and expenses that are exactly balanced';

  const cats = topCategories.length > 0
    ? `My biggest spending categories are: ${topCategories.join(', ')}.`
    : '';

  return wrap(`I need practical budgeting advice tailored to my situation. Here is my current picture:

- Monthly income: $${Math.round(income)}
- Monthly expenses: $${Math.round(expenses)}
- That gives me ${status}
${cats}

Please give me:
1. An honest assessment of where I stand — am I in a solid position, a tight one, or in trouble?
2. The most impactful changes I could make, based on my spending pattern
3. A realistic savings target given my income level
4. Whether I should prioritize a TFSA, emergency fund, or debt repayment — and in what order
5. Any benefits or credits I might be leaving on the table (GST credit, CCB, provincial programs) that could improve my cash flow
6. If my income is on-reserve or exempt under Section 87, how that changes the savings strategy (TFSA vs RRSP)
7. One or two small, concrete steps I can take this week`);
}

// ── Benefits deep dive ───────────────────────────────────────

interface BenefitsSituation {
  hasStatus: boolean;
  age: string;
  onReserve: string;
  hasChildren: boolean;
  employed: string;
  filesTaxes: string;
}

export function buildBenefitsPrompt(situation: BenefitsSituation): string {
  const ageLabels: Record<string, string> = {
    'under18': 'under 18',
    '18-24': '18 to 24',
    '25-64': '25 to 64',
    '65+': '65 or older',
  };

  const reserveLabels: Record<string, string> = {
    yes: 'on reserve',
    no: 'off reserve',
    parttime: 'part-time on reserve',
  };

  const employLabels: Record<string, string> = {
    'on-reserve': 'employed, working on reserve',
    'off-reserve': 'employed, working off reserve',
    'not-working': 'not currently working',
    student: 'a student',
  };

  const taxLabels: Record<string, string> = {
    yes: 'filed taxes recently',
    no: 'have not filed taxes recently',
    unsure: 'not sure if my taxes are filed',
  };

  return wrap(`I want a comprehensive review of every federal and provincial benefit, credit, and program I might be eligible for. Here is my situation:

- Status: ${situation.hasStatus ? 'registered Indian Status' : 'no Status'}
- Age: ${ageLabels[situation.age] ?? situation.age}
- Residence: ${reserveLabels[situation.onReserve] ?? situation.onReserve}
- Children under 18: ${situation.hasChildren ? 'yes' : 'no'}
- Employment: ${employLabels[situation.employed] ?? situation.employed}
- Tax filing: ${taxLabels[situation.filesTaxes] ?? situation.filesTaxes}

Please give me a complete list organized by priority — the ones worth the most money or most urgently needed first. For each benefit, include:
1. What it is and roughly how much it is worth
2. Whether I likely qualify based on my situation
3. Exactly how to apply — the specific steps, phone numbers, or websites
4. Any deadlines I should know about

Also flag any benefits I am currently missing because I have not filed taxes, and estimate how much I could be leaving on the table.

Cover federal programs (CCB, GST credit, GIS, OAS, EI, CLB, NIHB, Jordan's Principle, PSSSP), Indigenous-specific programs (Section 87, NIHB, Jordan's Principle, PSSSP, ISETS), and common provincial programs.`);
}

// ── General financial question ───────────────────────────────

export function buildGeneralPrompt(question: string): string {
  return wrap(`I have a financial question and I need straightforward, practical guidance.

My question: ${question}

Please answer with:
1. A clear, direct answer
2. How my First Nations Status might affect the answer (if relevant)
3. Specific next steps I can take
4. Any programs, benefits, or resources I should look into
5. Whether I need professional help for this, and what kind`);
}

// ── Band financial statement explainer ───────────────────────

export function buildBandFinancePrompt(details: string): string {
  return wrap(`I am trying to understand a financial statement or financial report from my First Nation (band council). I want to know whether the finances are healthy and what the numbers mean.

Here is what I am looking at: ${details}

Please help me understand:
1. What the key sections of a band financial statement mean — revenue, expenses, net financial assets, accumulated surplus/deficit, restricted vs unrestricted funds
2. Based on what I have shared, what stands out — anything that looks healthy, concerning, or unusual?
3. What questions should I be asking my Chief and Council about these numbers?
4. How does own-source revenue compare to government transfers — and why does that matter?
5. What does the auditor's report typically say, and what should I look for in it?
6. My rights under the First Nations Financial Transparency Act and band custom codes to access this information
7. How to read the "schedule of remuneration and expenses" for Chief and Council`);
}

// ── Letter writer ────────────────────────────────────────────

export function buildLetterPrompt(
  letterType: string,
  recipientOrg: string,
  situation: string,
): string {
  const typeContext: Record<string, string> = {
    'nihb-appeal': 'This is an appeal of a Non-Insured Health Benefits (NIHB) denial. The letter should reference the NIHB appeals process, include a clear statement of what was denied and why the denial should be reconsidered, and reference medical necessity where applicable.',
    'cra-objection': 'This is a formal Notice of Objection to the CRA under section 165 of the Income Tax Act. It should be sent within 90 days of the assessment. If the issue involves Section 87 of the Indian Act, the letter should clearly reference the connecting factors that support tax-exempt status.',
    'band-housing': 'This is an application or request letter for band housing. It should be respectful and factual, clearly state the housing need, family size, current living situation, and any urgency or safety concerns.',
    'psssp-funding': 'This is an application or supporting letter for the Post-Secondary Student Support Program (PSSSP). It should outline the program of study, how it supports the student and their community, and any relevant financial need.',
    'financial-complaint': 'This is a formal complaint to a financial institution. It should reference specific dates, transactions, and the resolution being sought. It should note if the complainant is a First Nations person whose rights may have been affected.',
    'isc-information': 'This is a formal information request to Indigenous Services Canada (ISC). It should be specific about what information is being requested, reference any applicable legislation (e.g., Access to Information Act, First Nations Financial Transparency Act), and include a deadline for response.',
    'other': 'Draft a professional, clear letter appropriate to the situation described.',
  };

  const context = typeContext[letterType] ?? typeContext['other'];

  return wrap(`I need help drafting a formal letter. Here are the details:

Type of letter: ${letterType.replace(/-/g, ' ')}
Recipient / organization: ${recipientOrg}
My situation: ${situation}

Writing guidance: ${context}

Please draft a complete, ready-to-send letter that:
1. Is professional but not overly formal — clear and human
2. States the facts plainly and specifically
3. References any relevant legislation, policy, or rights
4. Clearly states what outcome I am requesting
5. Includes a reasonable deadline for response where appropriate
6. Leaves placeholders [in brackets] for any specific details I need to fill in (dates, reference numbers, addresses)

Also tell me:
- How to send it (mail, fax, email) and to what address
- Whether I should keep a copy and how to document that I sent it
- Any follow-up steps if I do not hear back`);
}
