/**
 * The documents that turn knowing into getting.
 *
 * The site can now tell someone they may be owed money. Between knowing and
 * receiving sits a request nobody has taught her how to make, and that gap is
 * where most people stop — not from lack of will, but because a blank page
 * addressed to a federal department is genuinely intimidating and the words
 * feel like they have to be right.
 *
 * Three rules:
 *
 * 1. **A draft, never a submission.** Nothing here sends anything, and
 *    nothing here can. Every document is hers to read, change and sign.
 *
 * 2. **A blank stays a blank.** Where a fact is missing it renders as a
 *    marked gap she fills in, never as a plausible guess. A letter that
 *    invents a date on her behalf is a letter that can be contradicted by
 *    her own records, in writing, to the body deciding her claim.
 *
 * 3. **State facts and make a request.** These letters do not argue law.
 *    Asserting an entitlement in a document she has not had checked is how
 *    a reasonable request becomes a claim she has to defend — so each one
 *    says what happened, says what is being asked for, and stops.
 *
 * The tone is plain and firm, and it never apologises for asking. She is
 * requesting something she may be entitled to, from a body that exists to
 * provide it.
 */

export interface LetterBlank {
  token: string;
  label: string;
}

export interface Letter {
  id: string;
  /** What it is, in her words. */
  title: string;
  /** What it is for, and what happens after she sends it. */
  purpose: string;
  /** Who it goes to and how. */
  sendTo: string;
  body: string;
  blanks: LetterBlank[];
  /** Anything she should settle before sending. */
  before?: string;
}

const BLANK = (label: string) => `[${label}]`;

export interface LetterInputs {
  /** Years with no return filed, from the household. */
  yearsUnfiled?: number;
  childCount?: number;
  /** True when the saved Section 87 check came out likely exempt. */
  likelyExempt?: boolean;
}

/**
 * Back-filing years — a summary for a tax clinic, not a form.
 *
 * Deliberately not a mock T1-ADJ. CRA's adjustment mechanism is its own form
 * and My Account, and producing something that looks like an official form
 * but is not would be worse than producing nothing. What actually unblocks
 * someone is walking into a free clinic already knowing which years, which
 * slips and what to ask — so that is what this is.
 */
export function backFilingSummary(input: LetterInputs = {}): Letter {
  const years = input.yearsUnfiled ?? 0;
  const yearLine =
    years > 0
      ? `I have not filed for ${years} tax ${years === 1 ? 'year' : 'years'}: ${BLANK('list the years')}.`
      : `The years I need to file are: ${BLANK('list the years')}.`;

  return {
    id: 'back-filing',
    title: 'What to bring to a tax clinic',
    purpose:
      'A page to hand across the table so the appointment starts with the facts instead of twenty minutes of questions. Free clinics file back years for people on modest incomes, and many band offices run one or know the nearest.',
    sendTo: 'Bring it to a free tax clinic, a band office, or a tax preparer.',
    before:
      'Gather whatever slips you can find first — T4s, T5s, benefit statements. Missing slips are not a reason to stay away; CRA holds copies of most of them and a clinic can pull them.',
    blanks: [
      { token: 'list the years', label: 'Which tax years are missing' },
      { token: 'your name', label: 'Your full name' },
      { token: 'SIN', label: 'Your Social Insurance Number' },
    ],
    body: `WHAT I NEED HELP WITH

I would like to file my outstanding tax returns and claim any benefits I was
entitled to in those years.

${yearLine}

My name: ${BLANK('your name')}
SIN: ${BLANK('SIN')}
${input.childCount ? `Children in my care: ${input.childCount}` : `Children in my care: ${BLANK('how many, and their birth years')}`}

WHAT I AM HOPING TO CLAIM

- The Canada Child Benefit for the years above, if I was eligible
- The Canada Groceries and Essentials Benefit for those years
- Anything else that is paid from a filed return
${input.likelyExempt ? `
SOMETHING TO CHECK

Some or all of my employment income may be exempt from tax under Section 87 of
the Indian Act. Please check Box 71 on my T4s. If tax was withheld on income
that was exempt, I would like to know whether an adjustment can be requested
for those years.` : ''}

QUESTIONS I HAVE

${BLANK('anything you want to ask — write it here so you do not forget')}
`,
  };
}

/** A reimbursement request for health costs already paid. */
export function nihbRequest(): Letter {
  return {
    id: 'nihb',
    title: 'Asking to be reimbursed for a health cost',
    purpose:
      'Non-Insured Health Benefits reimburses costs you have already paid — dental, vision, prescriptions, medical travel — but only when a claim is made. Claims have time limits, so the older receipts are the urgent ones.',
    sendTo:
      'Your regional NIHB office. A band health office or health director will have the current address and can often submit it with you.',
    before:
      'Find the receipt. A claim without proof of payment will not go far, and a photograph of the receipt is usually enough.',
    blanks: [
      { token: 'your name', label: 'Your full name' },
      { token: 'status number', label: 'Your registration number' },
      { token: 'date of the expense', label: 'When you paid it' },
      { token: 'what it was for', label: 'What the cost was for' },
      { token: 'amount', label: 'What you paid' },
    ],
    body: `To the Non-Insured Health Benefits program,

I am writing to request reimbursement for a health cost I paid myself.

Name: ${BLANK('your name')}
Registration number: ${BLANK('status number')}

Date of the expense: ${BLANK('date of the expense')}
What it was for: ${BLANK('what it was for')}
Amount paid: ${BLANK('amount')}

I have attached the receipt.

Please let me know if anything further is needed to process this, and what the
outcome is.

Thank you,
${BLANK('your name')}
`,
  };
}

/** A Jordan's Principle request for a child. */
export function jordansPrincipleRequest(): Letter {
  return {
    id: 'jordans-principle',
    title: "Making a Jordan's Principle request for a child",
    purpose:
      "Jordan's Principle covers products, services and supports a First Nations child needs — health, education, social. The government of first contact pays and settles jurisdiction afterwards, so a request does not wait on anyone agreeing whose bill it is. Requests can cover things already paid for. For an Inuit child the equivalent route is the Inuit Child First Initiative — ask for it by name.",
    sendTo:
      "The Jordan's Principle Call Centre (1-855-572-4453, open at all hours) or a regional focal point. A band office or health director can make the request with you.",
    before:
      'Write down what the child needs and why, in your own words. A letter from a doctor, teacher or support worker helps but is not required to start.',
    blanks: [
      { token: "child's name", label: "The child's full name" },
      { token: 'date of birth', label: "The child's date of birth" },
      { token: 'registration number', label: "The child's registration number, if they have one" },
      { token: 'what is needed', label: 'What the child needs' },
      { token: 'why it is needed', label: 'Why they need it' },
      { token: 'your name', label: 'Your name and relationship to the child' },
    ],
    body: `To whom it may concern,

I am making a request under Jordan's Principle for a First Nations child in my
care.

Child's name: ${BLANK("child's name")}
Date of birth: ${BLANK('date of birth')}
Registration number: ${BLANK('registration number')}

What is needed: ${BLANK('what is needed')}

Why it is needed: ${BLANK('why it is needed')}

I am asking that this request be considered under Jordan's Principle so that
the child receives what they need without waiting for a decision about which
government is responsible for paying.

Please confirm you have received this and let me know what happens next, and by
when.

${BLANK('your name')}
`,
  };
}

export function allLetters(input: LetterInputs = {}): Letter[] {
  const letters = [backFilingSummary(input), nihbRequest()];
  // A request for a child is only offered where there is a child.
  if ((input.childCount ?? 0) > 0) letters.push(jordansPrincipleRequest());
  return letters;
}
