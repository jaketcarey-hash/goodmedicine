export interface GlossaryEntry {
  term: string;
  definition: string;
  category: 'general' | 'indigenous' | 'canadian';
  relatedTerms?: string[];
  articleLink?: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  // ──────────────────────────────────────────
  // GENERAL FINANCIAL TERMS
  // ──────────────────────────────────────────
  {
    term: 'APR (Annual Percentage Rate)',
    definition:
      'The yearly cost of borrowing money, expressed as a percentage. APR includes interest and certain fees, making it a more complete picture of what a loan actually costs compared to the interest rate alone.',
    category: 'general',
    relatedTerms: ['Interest rate', 'Fixed rate', 'Variable rate'],
    articleLink: '/money/debt',
  },
  {
    term: 'Asset',
    definition:
      'Anything you own that has financial value. Assets include cash in the bank, a vehicle, investments, or property. Your total assets minus your total debts equals your net worth.',
    category: 'general',
    relatedTerms: ['Net worth', 'Liability', 'Equity'],
  },
  {
    term: 'Balance',
    definition:
      'The amount of money in an account at a given time, or the amount still owing on a loan or credit card. A positive bank balance means you have funds available; a loan balance means you still owe money.',
    category: 'general',
    relatedTerms: ['Overdraft', 'Principal'],
    articleLink: '/money/banking',
  },
  {
    term: 'Bankruptcy',
    definition:
      'A legal process for people who cannot repay their debts. It can eliminate most debts but seriously damages your credit for years and may require you to give up certain assets. It should be a last resort after exploring other options.',
    category: 'general',
    relatedTerms: ['Debt', 'Credit score', 'Default'],
    articleLink: '/money/debt',
  },
  {
    term: 'Budget',
    definition:
      'A plan for how you will spend and save your money over a set period, usually a month. A budget helps you see where your money goes and make deliberate choices about priorities.',
    category: 'general',
    relatedTerms: ['Net income', 'Gross income'],
    articleLink: '/money/budgeting',
  },
  {
    term: 'Capital gains',
    definition:
      'The profit you make when you sell an investment or property for more than you paid. In Canada, 50% of capital gains are added to your taxable income. Some capital gains may be exempt under Section 87 for Status Indians.',
    category: 'general',
    relatedTerms: ['Equity', 'Portfolio', 'Section 87'],
    articleLink: '/money/investing',
  },
  {
    term: 'Co-signer',
    definition:
      'A person who signs a loan with you and agrees to repay it if you cannot. Having a co-signer can help you qualify for credit, but it puts real financial risk on the other person if payments are missed.',
    category: 'general',
    relatedTerms: ['Secured debt', 'Credit score'],
    articleLink: '/money/credit',
  },
  {
    term: 'Compound interest',
    definition:
      'Interest calculated on both the original amount and the interest already earned. Over time, compounding causes savings to grow faster and debts to grow larger. Starting early makes a significant difference because of this effect.',
    category: 'general',
    relatedTerms: ['Interest rate', 'Principal', 'Yield'],
    articleLink: '/money/saving',
  },
  {
    term: 'Credit score',
    definition:
      'A number between 300 and 900 that represents how reliably you have handled borrowed money. Lenders, landlords, and some employers check this score. Paying bills on time and keeping balances low are the two biggest factors.',
    category: 'general',
    relatedTerms: ['Credit report', 'Default'],
    articleLink: '/money/credit',
  },
  {
    term: 'Credit report',
    definition:
      'A detailed record of your borrowing history, maintained by Equifax and TransUnion in Canada. It lists every credit account, payment history, and any collections or public records. You can request a free copy of your own report.',
    category: 'general',
    relatedTerms: ['Credit score'],
    articleLink: '/money/credit',
  },
  {
    term: 'Debit',
    definition:
      'A transaction that takes money directly from your bank account, as opposed to borrowing. When you use a debit card, the money leaves your account immediately rather than being billed to you later.',
    category: 'general',
    relatedTerms: ['Balance', 'Overdraft'],
    articleLink: '/money/banking',
  },
  {
    term: 'Debt',
    definition:
      'Money you owe to someone else, whether a bank, credit card company, family member, or other lender. Not all debt is harmful — a mortgage or student loan can build toward something — but high-interest debt like credit cards can trap you.',
    category: 'general',
    relatedTerms: ['Secured debt', 'Unsecured debt', 'Default', 'Interest rate'],
    articleLink: '/money/debt',
  },
  {
    term: 'Default',
    definition:
      'Failing to repay a debt according to the agreed terms. Defaulting damages your credit score, may trigger collection calls, and can lead to legal action. On-reserve, Section 89 provides some protection against seizure of property.',
    category: 'general',
    relatedTerms: ['Credit score', 'Garnishment', 'Section 89 (property seizure protection)'],
    articleLink: '/money/debt',
  },
  {
    term: 'Deduction',
    definition:
      'An amount subtracted from your income before tax is calculated, reducing the total tax you owe. Common deductions include RRSP contributions, child care expenses, and union dues.',
    category: 'general',
    relatedTerms: ['Gross income', 'Net income'],
    articleLink: '/money/taxes',
  },
  {
    term: 'Dividend',
    definition:
      'A payment made by a company to its shareholders, usually from profits. Dividends provide income from investments without selling them. In Canada, eligible dividends receive favourable tax treatment.',
    category: 'general',
    relatedTerms: ['Portfolio', 'Yield', 'Capital gains'],
    articleLink: '/money/investing',
  },
  {
    term: 'Down payment',
    definition:
      'The upfront cash you pay when buying a home or other large purchase. In Canada, the minimum down payment is 5% for homes under $500,000. A larger down payment means a smaller mortgage and less interest paid over time.',
    category: 'general',
    relatedTerms: ['Mortgage', 'Equity'],
    articleLink: '/money/saving',
  },
  {
    term: 'Equity',
    definition:
      'The portion of an asset you actually own. For a home, equity is the market value minus the remaining mortgage. Equity grows as you pay down the loan or if the property value rises.',
    category: 'general',
    relatedTerms: ['Asset', 'Mortgage', 'Net worth'],
  },
  {
    term: 'Fixed rate',
    definition:
      'An interest rate that stays the same for the entire term of the loan or mortgage. Fixed rates provide certainty — your payment amount will not change — but may start higher than variable rates.',
    category: 'general',
    relatedTerms: ['Variable rate', 'Mortgage', 'Interest rate'],
    articleLink: '/money/debt',
  },
  {
    term: 'Garnishment',
    definition:
      'A legal order requiring your employer to send part of your paycheque directly to a creditor. Garnishment typically happens after a court judgment for unpaid debt. Certain income sources like EI and social assistance have partial protection.',
    category: 'general',
    relatedTerms: ['Default', 'Debt'],
  },
  {
    term: 'Gross income',
    definition:
      'Your total earnings before any deductions like income tax, CPP, or EI premiums are taken off. The number on your job offer is usually gross income; your actual take-home pay (net income) will be lower.',
    category: 'general',
    relatedTerms: ['Net income', 'Deduction', 'T4 slip'],
    articleLink: '/money/taxes',
  },
  {
    term: 'Interest rate',
    definition:
      'The percentage a lender charges you to borrow money, or the percentage a bank pays you for keeping money in a savings account. Lower rates are better for borrowing; higher rates are better for saving.',
    category: 'general',
    relatedTerms: ['APR (Annual Percentage Rate)', 'Fixed rate', 'Variable rate', 'Compound interest'],
  },
  {
    term: 'Liability',
    definition:
      'Any financial obligation or debt you owe. Liabilities include mortgages, student loans, credit card balances, and money borrowed from family. Your net worth is your assets minus your liabilities.',
    category: 'general',
    relatedTerms: ['Asset', 'Debt', 'Net worth'],
  },
  {
    term: 'Liquidity',
    definition:
      'How quickly and easily you can turn an asset into cash without losing value. A savings account is highly liquid; a house is not. Having some liquid savings matters for unexpected expenses.',
    category: 'general',
    relatedTerms: ['Asset', 'Balance'],
    articleLink: '/money/saving',
  },
  {
    term: 'Mortgage',
    definition:
      'A loan specifically for buying property, where the property itself serves as collateral. In Canada, mortgages typically have 5-year terms within a longer 25-year amortization. On-reserve, Ministerial Loan Guarantees may be required.',
    category: 'general',
    relatedTerms: ['Down payment', 'Equity', 'Fixed rate', 'Variable rate', 'Ministerial Loan Guarantee'],
  },
  {
    term: 'Net income',
    definition:
      'The amount of money you actually take home after all deductions. This is the number that matters for budgeting because it reflects what you actually have to work with each pay period.',
    category: 'general',
    relatedTerms: ['Gross income', 'Deduction', 'Budget'],
    articleLink: '/money/budgeting',
  },
  {
    term: 'Net worth',
    definition:
      'The total value of everything you own minus everything you owe. It can be negative, and that is normal early in life. Tracking net worth over time is one of the clearest measures of financial progress.',
    category: 'general',
    relatedTerms: ['Asset', 'Liability'],
  },
  {
    term: 'Overdraft',
    definition:
      'When you spend more money than is in your bank account. Banks may cover the shortfall but charge overdraft fees or interest. Setting up overdraft protection in advance is cheaper than being hit with surprise charges.',
    category: 'general',
    relatedTerms: ['Balance', 'Debit'],
    articleLink: '/money/banking',
  },
  {
    term: 'Portfolio',
    definition:
      'The collection of all your investments — stocks, bonds, mutual funds, GICs, and other assets held together. Diversifying your portfolio across different types of investments reduces risk.',
    category: 'general',
    relatedTerms: ['Asset', 'Dividend', 'Yield'],
    articleLink: '/money/investing',
  },
  {
    term: 'Principal',
    definition:
      'The original amount of money borrowed or invested, not including interest or earnings. On a loan, your payments go toward both principal and interest; paying down principal faster saves money over time.',
    category: 'general',
    relatedTerms: ['Interest rate', 'Compound interest', 'Balance'],
  },
  {
    term: 'Refinance',
    definition:
      'Replacing an existing loan with a new one, usually to get a lower interest rate or different terms. Refinancing can reduce your monthly payments, but watch for penalties on the old loan and fees on the new one.',
    category: 'general',
    relatedTerms: ['Mortgage', 'Interest rate', 'Fixed rate'],
  },
  {
    term: 'Secured debt',
    definition:
      'A loan backed by collateral — something the lender can take if you do not repay. Mortgages and car loans are common examples. Secured loans typically have lower interest rates because the lender has less risk.',
    category: 'general',
    relatedTerms: ['Unsecured debt', 'Mortgage', 'Debt'],
    articleLink: '/money/debt',
  },
  {
    term: 'Term',
    definition:
      'The length of time a financial agreement lasts. A mortgage term is the period your interest rate is locked in (often 5 years). A GIC term is how long your money is locked up. Longer terms often offer better rates.',
    category: 'general',
    relatedTerms: ['Fixed rate', 'Mortgage'],
  },
  {
    term: 'Unsecured debt',
    definition:
      'Debt not backed by any collateral. Credit cards, personal lines of credit, and payday loans are unsecured. Because the lender cannot seize a specific asset, these loans usually carry higher interest rates.',
    category: 'general',
    relatedTerms: ['Secured debt', 'Credit score', 'Debt'],
    articleLink: '/money/debt',
  },
  {
    term: 'Variable rate',
    definition:
      'An interest rate that changes with the market, usually tied to the Bank of Canada prime rate. Variable rates may start lower than fixed rates but can increase, making payments less predictable.',
    category: 'general',
    relatedTerms: ['Fixed rate', 'Interest rate', 'Mortgage'],
  },
  {
    term: 'Yield',
    definition:
      'The income earned on an investment, expressed as a percentage of its value. Yield includes interest and dividends. A higher yield means more income, but often comes with more risk.',
    category: 'general',
    relatedTerms: ['Dividend', 'Interest rate', 'Portfolio'],
    articleLink: '/money/investing',
  },

  // ──────────────────────────────────────────
  // INDIGENOUS-SPECIFIC TERMS
  // ──────────────────────────────────────────
  {
    term: 'Band council resolution (BCR)',
    definition:
      'A formal decision passed by an elected band council, similar to a bylaw. BCRs are often required for housing loans on-reserve, land designations, and accessing certain federal programs. If you are applying for on-reserve financing, expect to need a BCR.',
    category: 'indigenous',
    relatedTerms: ['Ministerial Loan Guarantee', 'On-reserve'],
    articleLink: '/rights/band-finances',
  },
  {
    term: 'Capital account',
    definition:
      'One of two types of band trust accounts held by Indigenous Services Canada (ISC). Capital accounts hold money from land sales and non-renewable resource royalties. Spending from this account requires a band council resolution and ministerial approval.',
    category: 'indigenous',
    relatedTerms: ['Revenue account', 'Trust fund (ISC-held)', 'Band council resolution (BCR)'],
    articleLink: '/rights/band-finances',
  },
  {
    term: 'Connecting factors test',
    definition:
      'The legal test used by courts to determine whether a Status Indian\'s income is "situated on a reserve" and therefore tax-exempt under Section 87. Factors include where the work is done, where the employer is located, and who benefits from the work. This is what determines whether your specific income qualifies for the exemption.',
    category: 'indigenous',
    relatedTerms: ['Section 87', 'Williams test', 'On-reserve'],
    articleLink: '/rights/section-87',
  },
  {
    term: 'Economic development corporation',
    definition:
      'A business entity created by a First Nation to manage commercial ventures and investments on behalf of the community. These corporations generate own-source revenue, create local jobs, and reduce dependence on federal funding.',
    category: 'indigenous',
    relatedTerms: ['Own-source revenue', 'Band council resolution (BCR)'],
    articleLink: '/rights/band-finances',
  },
  {
    term: 'First Nations Financial Management Board (FNFMB)',
    definition:
      'A national institution that helps First Nations strengthen their financial management practices. The FNFMB provides certification, tools, and training so communities can access long-term financing and build investor confidence in their governance.',
    category: 'indigenous',
    relatedTerms: ['First Nations Tax Commission', 'Own-source revenue'],
    articleLink: '/rights/band-finances',
  },
  {
    term: 'First Nations Tax Commission',
    definition:
      'A national institution that supports First Nations in exercising their tax jurisdiction on-reserve. It helps communities create property tax systems that generate local revenue for infrastructure and services.',
    category: 'indigenous',
    relatedTerms: ['First Nations Financial Management Board (FNFMB)', 'Own-source revenue'],
    articleLink: '/rights/band-finances',
  },
  {
    term: 'Indian Act',
    definition:
      'Federal legislation that governs many aspects of First Nations life in Canada, including band governance, reserve lands, and tax exemptions. Originally a tool of control, it still defines key rights like Section 87 tax exemptions and Section 89 property protections that affect your finances directly.',
    category: 'indigenous',
    relatedTerms: ['Section 87', 'Section 89 (property seizure protection)', 'Status Indian'],
    articleLink: '/rights/section-87',
  },
  {
    term: 'Indian moneys',
    definition:
      'Funds collected, received, or held by the Crown for the use and benefit of First Nations or their members. These include money from land surrenders, resource royalties, and other sources held in trust accounts managed by ISC.',
    category: 'indigenous',
    relatedTerms: ['Capital account', 'Revenue account', 'Trust fund (ISC-held)'],
    articleLink: '/rights/band-finances',
  },
  {
    term: "Jordan's Principle",
    definition:
      'A child-first principle ensuring First Nations children can access the products, services, and supports they need when they need them. If there is a jurisdictional dispute about who should pay, the government of first contact must pay and resolve the billing later. It covers health, education, social, and other services.',
    category: 'indigenous',
    relatedTerms: ['NIHB (Non-Insured Health Benefits)', 'Status Indian'],
    articleLink: '/rights/jordans-principle',
  },
  {
    term: 'Ministerial Loan Guarantee',
    definition:
      'A federal guarantee that backs loans for on-reserve housing when land cannot be used as collateral (because reserve land cannot be seized under Section 89). Without this guarantee, most banks will not lend for on-reserve homes. Your band council must pass a BCR to support the application.',
    category: 'indigenous',
    relatedTerms: ['Band council resolution (BCR)', 'Section 89 (property seizure protection)', 'Mortgage'],
  },
  {
    term: 'NIHB (Non-Insured Health Benefits)',
    definition:
      'A federal program that covers health-related services not covered by provincial health insurance or private plans, including dental, vision, mental health, medical transportation, and prescription drugs. Available to registered First Nations and recognized Inuit.',
    category: 'indigenous',
    relatedTerms: ['NIHB predetermination', 'Status Indian'],
    articleLink: '/rights/nihb',
  },
  {
    term: 'NIHB predetermination',
    definition:
      'A pre-approval process for certain NIHB services, particularly dental work over a certain cost. Your provider submits a treatment plan to NIHB before doing the work so you know in advance what will be covered. Always ask your provider about predetermination for major treatments.',
    category: 'indigenous',
    relatedTerms: ['NIHB (Non-Insured Health Benefits)'],
    articleLink: '/rights/nihb',
  },
  {
    term: 'OCAP principles',
    definition:
      'Ownership, Control, Access, and Possession — standards that govern how First Nations data should be collected, protected, used, and shared. OCAP ensures that communities maintain authority over their own information. This app follows OCAP principles by keeping all your data on your device.',
    category: 'indigenous',
    relatedTerms: [],
  },
  {
    term: 'On-reserve',
    definition:
      'Living or working on land designated as a reserve under the Indian Act. Your location matters for finances because it affects tax exemptions (Section 87), access to housing programs (Ministerial Loan Guarantees), and property protections (Section 89).',
    category: 'indigenous',
    relatedTerms: ['Section 87', 'Section 89 (property seizure protection)', 'Ministerial Loan Guarantee'],
    articleLink: '/rights/section-87',
  },
  {
    term: 'Own-source revenue',
    definition:
      'Income a First Nation generates independently, outside federal transfers. Sources include business profits, property taxes, resource royalties, and investment returns. Own-source revenue gives communities greater financial independence and self-determination.',
    category: 'indigenous',
    relatedTerms: ['Economic development corporation', 'First Nations Tax Commission'],
    articleLink: '/rights/band-finances',
  },
  {
    term: 'Pass system (historical)',
    definition:
      'A system used from the 1880s to the 1940s that required First Nations people to obtain a pass from an Indian Agent to leave their reserve. Though never actually law, it was enforced and restricted economic participation for generations. Understanding this history helps explain why financial systems were not built to serve Indigenous people.',
    category: 'indigenous',
    relatedTerms: ['Indian Act'],
  },
  {
    term: 'Per-capita distribution',
    definition:
      'A payment made by a First Nation to its members, usually from settlement funds, resource revenues, or other band income. These payments are divided equally among eligible members. Whether a per-capita distribution is taxable depends on the source of the funds and Section 87 analysis.',
    category: 'indigenous',
    relatedTerms: ['Revenue account', 'Section 87', 'Trust fund (ISC-held)'],
    articleLink: '/rights/treaty-payments',
  },
  {
    term: 'Post-Secondary Student Support Program (PSSSP)',
    definition:
      'A federal program that provides funding to First Nations and Inuit students for post-secondary education, covering tuition, books, travel, and living expenses. Funding is administered through your band or tribal council and is limited, so apply early.',
    category: 'indigenous',
    relatedTerms: ['Band council resolution (BCR)'],
    articleLink: '/rights/education-funding',
  },
  {
    term: 'Revenue account',
    definition:
      'One of two types of band trust accounts held by ISC. Revenue accounts hold money from renewable resource royalties, fines, and interest. Bands have more flexibility spending from revenue accounts than capital accounts, but ISC still maintains oversight.',
    category: 'indigenous',
    relatedTerms: ['Capital account', 'Trust fund (ISC-held)'],
    articleLink: '/rights/band-finances',
  },
  {
    term: 'Section 87',
    definition:
      'The section of the Indian Act that exempts the personal property of a Status Indian situated on a reserve from taxation. In practice, this can apply to employment income, investment income, and purchases — but only when specific conditions (the connecting factors test) are met. It does not mean all income is automatically tax-free.',
    category: 'indigenous',
    relatedTerms: ['Connecting factors test', 'Williams test', 'Status Indian', 'T90 form (Section 87 exempt income)'],
    articleLink: '/rights/section-87',
  },
  {
    term: 'Section 89 (property seizure protection)',
    definition:
      'The section of the Indian Act that protects the real and personal property of a Status Indian situated on a reserve from seizure by non-Indigenous creditors. This is why standard mortgages do not work on-reserve — the lender cannot foreclose. It protects you, but it also limits access to certain financial products.',
    category: 'indigenous',
    relatedTerms: ['Section 87', 'Ministerial Loan Guarantee', 'On-reserve'],
  },
  {
    term: 'Secure Certificate of Indian Status',
    definition:
      'The current, secure-format status card issued by Indigenous Services Canada. It confirms your registration under the Indian Act and is needed to access Section 87 tax exemptions, NIHB coverage, and other programs. The older laminated card is being phased out.',
    category: 'indigenous',
    relatedTerms: ['Status Indian', 'Section 87', 'NIHB (Non-Insured Health Benefits)'],
  },
  {
    term: 'Self-government agreement',
    definition:
      'A negotiated agreement between a First Nation and the federal (and sometimes provincial) government that transfers governance powers from the Indian Act to the community. Self-governing nations set their own rules around taxation, land management, and financial administration.',
    category: 'indigenous',
    relatedTerms: ['Indian Act', 'Treaty rights'],
  },
  {
    term: 'Specific claim',
    definition:
      'A claim made by a First Nation against the federal government for failing to meet obligations under historic treaties or for mismanaging band funds or reserve lands. Successful claims result in financial compensation, which may be distributed to members as per-capita payments.',
    category: 'indigenous',
    relatedTerms: ['Treaty rights', 'Per-capita distribution', 'Trust fund (ISC-held)'],
  },
  {
    term: 'Status Indian',
    definition:
      'A person registered under the Indian Act. Status determines eligibility for Section 87 tax exemptions, NIHB health coverage, and other federal programs. Status is not the same as band membership — they are separate but related.',
    category: 'indigenous',
    relatedTerms: ['Indian Act', 'Section 87', 'Secure Certificate of Indian Status'],
  },
  {
    term: 'Treaty rights',
    definition:
      'Rights held by First Nations as set out in treaties signed with the Crown. These can include rights to land, hunting, fishing, education, health, and annuity payments. Treaty rights are constitutionally protected under Section 35 of the Constitution Act, 1982.',
    category: 'indigenous',
    relatedTerms: ['Self-government agreement', 'Specific claim'],
    articleLink: '/rights/treaty-payments',
  },
  {
    term: 'Trust fund (ISC-held)',
    definition:
      'Money held by the federal government on behalf of a First Nation, managed by Indigenous Services Canada. These funds come from land surrenders, resource extraction, and settlements. Many communities are working to take direct control of their trust funds for self-determined investment.',
    category: 'indigenous',
    relatedTerms: ['Capital account', 'Revenue account', 'Indian moneys'],
    articleLink: '/rights/band-finances',
  },
  {
    term: 'Williams test',
    definition:
      'The Supreme Court of Canada decision (Williams v. Canada, 1992) that established the connecting factors test for determining whether income is situated on a reserve for Section 87 purposes. Rather than a single rule, the court said all relevant factors must be weighed together.',
    category: 'indigenous',
    relatedTerms: ['Section 87', 'Connecting factors test'],
    articleLink: '/rights/section-87',
  },

  // ──────────────────────────────────────────
  // CANADIAN PROGRAM TERMS
  // ──────────────────────────────────────────
  {
    term: 'Canada Child Benefit (CCB)',
    definition:
      'A tax-free monthly payment to eligible families to help with the cost of raising children under 18. The amount depends on your family income and number of children. You must file a tax return each year to keep receiving it, even if your income is zero.',
    category: 'canadian',
    relatedTerms: ['GST/HST credit', 'Net income'],
    articleLink: '/money/taxes',
  },
  {
    term: 'Canada Education Savings Grant (CESG)',
    definition:
      'A federal grant that adds 20% to the first $2,500 you contribute to a child\'s RESP each year, up to $500 per year and $7,200 lifetime. Lower-income families may receive additional CESG. It is free money you get just for saving for a child\'s education.',
    category: 'canadian',
    relatedTerms: ['Registered Education Savings Plan (RESP)', 'Canada Learning Bond (CLB)'],
    articleLink: '/money/saving',
  },
  {
    term: 'Canada Learning Bond (CLB)',
    definition:
      'A federal grant of up to $2,000 deposited into a child\'s RESP for families with lower incomes. No personal contribution is required — you just need to open the RESP and apply. Many eligible families do not claim it simply because they do not know it exists.',
    category: 'canadian',
    relatedTerms: ['Registered Education Savings Plan (RESP)', 'Canada Education Savings Grant (CESG)'],
    articleLink: '/money/saving',
  },
  {
    term: 'Canada Pension Plan (CPP)',
    definition:
      'A mandatory pension program that most working Canadians contribute to through payroll deductions. It provides retirement income starting as early as age 60, plus disability and survivor benefits. The amount you receive depends on how much and how long you contributed.',
    category: 'canadian',
    relatedTerms: ['Old Age Security (OAS)', 'Employment Insurance (EI)', 'T4 slip'],
    articleLink: '/path/supporting-elders',
  },
  {
    term: 'Canada Workers Benefit',
    definition:
      'A refundable tax credit for low-income workers. If you earn a modest working income, this benefit puts extra money back in your pocket at tax time. You must file a tax return to receive it.',
    category: 'canadian',
    relatedTerms: ['Net income', 'GST/HST credit'],
    articleLink: '/money/taxes',
  },
  {
    term: 'Child care expense deduction',
    definition:
      'A tax deduction for child care costs that allows working parents to reduce their taxable income. The deduction generally must be claimed by the lower-income spouse. Eligible expenses include daycare, day camps, and some boarding school fees.',
    category: 'canadian',
    relatedTerms: ['Deduction', 'Net income'],
    articleLink: '/money/taxes',
  },
  {
    term: 'Common-law partner',
    definition:
      'A person you have lived with in a conjugal relationship for at least 12 continuous months. In Canada, common-law partners have similar tax obligations and benefit eligibility as married spouses, including for CCB, GST credit, and income-tested programs.',
    category: 'canadian',
    relatedTerms: ['Canada Child Benefit (CCB)', 'Net income'],
  },
  {
    term: 'Consumer Price Index (CPI)',
    definition:
      'A measure of how the average price of goods and services changes over time — essentially, the official measure of inflation. When CPI rises, your money buys less. Government benefits like OAS and CPP are adjusted for CPI so they keep up with rising costs.',
    category: 'canadian',
    relatedTerms: ['Old Age Security (OAS)', 'Canada Pension Plan (CPP)'],
  },
  {
    term: 'Disability Tax Credit (DTC)',
    definition:
      'A non-refundable tax credit for people with a severe and prolonged impairment. Qualifying for the DTC also unlocks other programs, including the RDSP. A medical practitioner must complete the T2201 form to certify eligibility.',
    category: 'canadian',
    relatedTerms: ['Registered Disability Savings Plan (RDSP)'],
    articleLink: '/money/taxes',
  },
  {
    term: 'Employment Insurance (EI)',
    definition:
      'A federal program that provides temporary income when you lose your job through no fault of your own, or when you take parental leave, sick leave, or compassionate care leave. You must have worked enough insurable hours to qualify.',
    category: 'canadian',
    relatedTerms: ['Canada Pension Plan (CPP)', 'Gross income'],
    articleLink: '/path/first-job',
  },
  {
    term: 'First Home Savings Account (FHSA)',
    definition:
      'A registered account that combines the tax benefits of an RRSP and a TFSA for first-time home buyers. Contributions are tax-deductible (like an RRSP), and withdrawals for a qualifying home purchase are tax-free (like a TFSA). The lifetime contribution limit is $40,000.',
    category: 'canadian',
    relatedTerms: ["Home Buyers' Plan (HBP)", 'Tax-Free Savings Account (TFSA)', 'Registered Retirement Savings Plan (RRSP)'],
    articleLink: '/money/saving',
  },
  {
    term: 'GST/HST credit',
    definition:
      'A quarterly tax-free payment that helps low- and modest-income individuals and families offset the sales tax they pay. You receive it automatically when you file your tax return. The amount is based on your family income and size.',
    category: 'canadian',
    relatedTerms: ['Canada Child Benefit (CCB)', 'Canada Workers Benefit'],
    articleLink: '/money/taxes',
  },
  {
    term: 'Guaranteed Income Supplement (GIS)',
    definition:
      'A monthly non-taxable benefit for low-income Old Age Security recipients. GIS provides significant additional income for seniors who have little or no other income. You must file a tax return annually to maintain eligibility.',
    category: 'canadian',
    relatedTerms: ['Old Age Security (OAS)', 'Canada Pension Plan (CPP)'],
    articleLink: '/path/supporting-elders',
  },
  {
    term: "Home Buyers' Plan (HBP)",
    definition:
      'A program that lets you withdraw up to $60,000 from your RRSP tax-free to buy or build your first home. The money must be repaid to your RRSP over 15 years. If you do not repay, the amounts are added to your taxable income.',
    category: 'canadian',
    relatedTerms: ['Registered Retirement Savings Plan (RRSP)', 'First Home Savings Account (FHSA)', 'Down payment'],
    articleLink: '/money/saving',
  },
  {
    term: 'Lifelong Learning Plan (LLP)',
    definition:
      'A program that lets you withdraw up to $10,000 per year (to a maximum of $20,000) from your RRSP to finance full-time education for yourself or your spouse. The money must be repaid over 10 years.',
    category: 'canadian',
    relatedTerms: ['Registered Retirement Savings Plan (RRSP)', 'Post-Secondary Student Support Program (PSSSP)'],
    articleLink: '/rights/education-funding',
  },
  {
    term: 'Old Age Security (OAS)',
    definition:
      'A monthly pension paid to most Canadians aged 65 and older who have lived in Canada for at least 10 years after turning 18. Unlike CPP, you do not need to have worked to receive OAS. Higher-income seniors may have to repay some or all of it (the OAS clawback).',
    category: 'canadian',
    relatedTerms: ['Guaranteed Income Supplement (GIS)', 'Canada Pension Plan (CPP)'],
    articleLink: '/path/supporting-elders',
  },
  {
    term: 'Registered Disability Savings Plan (RDSP)',
    definition:
      'A long-term savings plan for people eligible for the Disability Tax Credit. The government adds matching grants and bonds of up to $4,500 per year. An RDSP is one of the most powerful savings tools in Canada for eligible individuals — the government contributions can be several times your own.',
    category: 'canadian',
    relatedTerms: ['Disability Tax Credit (DTC)'],
    articleLink: '/money/saving',
  },
  {
    term: 'Registered Education Savings Plan (RESP)',
    definition:
      'A tax-sheltered savings account for a child\'s post-secondary education. The government adds grants (CESG and CLB) on top of your contributions. When the student withdraws for school, the growth and grants are taxed in their hands — usually at a very low rate.',
    category: 'canadian',
    relatedTerms: ['Canada Education Savings Grant (CESG)', 'Canada Learning Bond (CLB)'],
    articleLink: '/money/saving',
  },
  {
    term: 'Registered Retirement Income Fund (RRIF)',
    definition:
      'An account you must convert your RRSP into by the end of the year you turn 71. A RRIF requires you to withdraw a minimum amount each year, which is taxable income. It is the spending-down phase of your retirement savings.',
    category: 'canadian',
    relatedTerms: ['Registered Retirement Savings Plan (RRSP)', 'Old Age Security (OAS)'],
  },
  {
    term: 'Registered Retirement Savings Plan (RRSP)',
    definition:
      'A tax-deferred savings account for retirement. Contributions reduce your taxable income now, and the investments grow tax-free inside the plan. You pay tax when you withdraw, ideally in retirement when your income and tax rate are lower.',
    category: 'canadian',
    relatedTerms: ['Tax-Free Savings Account (TFSA)', "Home Buyers' Plan (HBP)", 'Registered Retirement Income Fund (RRIF)'],
    articleLink: '/money/saving',
  },
  {
    term: 'Tax-Free Savings Account (TFSA)',
    definition:
      'A flexible registered account where your investments grow completely tax-free and withdrawals are not taxed. Available to Canadian residents 18 and older with a SIN. Contribution room accumulates each year even if you do not open one right away.',
    category: 'canadian',
    relatedTerms: ['Registered Retirement Savings Plan (RRSP)', 'First Home Savings Account (FHSA)'],
    articleLink: '/money/saving',
  },
  {
    term: 'T4 slip',
    definition:
      'A form your employer gives you each year showing your total earnings and deductions (income tax, CPP, EI). You need your T4 to file your tax return. If you worked for multiple employers, you will receive a T4 from each one.',
    category: 'canadian',
    relatedTerms: ['Gross income', 'Net income', 'T90 form (Section 87 exempt income)'],
    articleLink: '/money/taxes',
  },
  {
    term: 'T90 form (Section 87 exempt income)',
    definition:
      'The CRA form used to report employment income that is exempt from tax under Section 87 of the Indian Act. Even though the income is not taxed, reporting it on your return is essential — it is used to calculate benefits like CCB, GST credit, and GIS, which are based on your total income.',
    category: 'canadian',
    relatedTerms: ['Section 87', 'T4 slip', 'Canada Child Benefit (CCB)', 'GST/HST credit'],
    articleLink: '/rights/section-87',
  },
  {
    term: 'Working income tax benefit',
    definition:
      'The former name for the Canada Workers Benefit. If you see this term on older documents, it refers to the same refundable tax credit for low-income working Canadians, now called the Canada Workers Benefit.',
    category: 'canadian',
    relatedTerms: ['Canada Workers Benefit'],
    articleLink: '/money/taxes',
  },
  {
    term: 'Notice of Assessment (NOA)',
    definition:
      'A statement the CRA sends after processing your tax return, confirming your income, deductions, credits, and any refund or balance owing. Your NOA also shows your RRSP contribution room for the following year. Lenders and landlords sometimes ask for it as proof of income.',
    category: 'canadian',
    relatedTerms: ['Registered Retirement Savings Plan (RRSP)', 'T4 slip', 'Deduction'],
    articleLink: '/money/taxes',
  },
];

/** Category labels for display */
export const CATEGORY_LABELS: Record<GlossaryEntry['category'], string> = {
  general: 'General',
  indigenous: 'Indigenous Rights',
  canadian: 'Canadian Programs',
};
