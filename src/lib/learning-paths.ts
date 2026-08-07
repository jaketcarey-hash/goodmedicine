/**
 * Learning path definitions — pure data.
 * Each path is a curated sequence of articles forming a coherent journey.
 */

export interface PathStep {
  title: string;
  path: string;
  estimatedMinutes: number;
  /** Articles are read and marked complete; tools count as done when opened
   *  from the path — using the tool is the completion. */
  kind?: 'article' | 'tool';
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  colour: 'clay' | 'water' | 'sage' | 'berry';
  estimatedMinutes: number;
  steps: PathStep[];
}

export const learningPaths: LearningPath[] = [
  {
    id: 'financial-foundations',
    name: 'Financial Foundations',
    description: 'The essentials, in order — and after each idea, the tool that puts it to work.',
    colour: 'clay',
    estimatedMinutes: 55,
    steps: [
      { title: 'Banking Basics', path: '/money/banking', estimatedMinutes: 6 },
      { title: 'Budgeting That Works', path: '/money/budgeting', estimatedMinutes: 6 },
      { title: 'Budget Snapshot — try one month', path: '/money/budget-tool', estimatedMinutes: 3, kind: 'tool' },
      { title: 'Understanding Credit', path: '/money/credit', estimatedMinutes: 6 },
      { title: 'Saving and Growing', path: '/money/saving', estimatedMinutes: 6 },
      { title: 'Savings Tracker — set a goal', path: '/money/savings-tracker', estimatedMinutes: 3, kind: 'tool' },
      { title: 'Taxes and Filing', path: '/money/taxes', estimatedMinutes: 6 },
      { title: 'Dealing with Debt', path: '/money/debt', estimatedMinutes: 5 },
      { title: 'Debt Planner — map what you owe', path: '/money/debt-planner', estimatedMinutes: 3, kind: 'tool' },
      { title: 'Investing 101', path: '/money/investing', estimatedMinutes: 5 },
      { title: 'Your Money Plan — bring it together', path: '/money/plan', estimatedMinutes: 4, kind: 'tool' },
    ],
  },
  {
    id: 'know-your-rights',
    name: 'Know Your Rights',
    description: "Your rights are powerful tools. Learn what you're entitled to.",
    colour: 'water',
    estimatedMinutes: 30,
    steps: [
      { title: 'Section 87 Tax Exemption', path: '/rights/section-87', estimatedMinutes: 8 },
      { title: 'Non-Insured Health Benefits', path: '/rights/nihb', estimatedMinutes: 8 },
      { title: 'Education Funding', path: '/rights/education-funding', estimatedMinutes: 7 },
      { title: 'Band Finances and Trusts', path: '/rights/band-finances', estimatedMinutes: 7 },
    ],
  },
  {
    id: 'leaving-for-school',
    name: 'Leaving for School',
    description: 'Everything you need to know before heading to school.',
    colour: 'sage',
    estimatedMinutes: 30,
    steps: [
      { title: 'Education Funding', path: '/rights/education-funding', estimatedMinutes: 7 },
      { title: 'Banking Basics', path: '/money/banking', estimatedMinutes: 6 },
      { title: 'Budgeting That Works', path: '/money/budgeting', estimatedMinutes: 6 },
      { title: 'Taxes and Filing', path: '/money/taxes', estimatedMinutes: 6 },
      { title: 'Leaving Home', path: '/path/leaving-home', estimatedMinutes: 5 },
    ],
  },
  {
    id: 'starting-a-family',
    name: 'Starting a Family',
    description: 'Financial knowledge for growing families.',
    colour: 'berry',
    estimatedMinutes: 25,
    steps: [
      { title: 'Raising a Family', path: '/path/raising-family', estimatedMinutes: 7 },
      { title: 'Saving and Growing', path: '/money/saving', estimatedMinutes: 6 },
      { title: 'Building a Life', path: '/path/building-life', estimatedMinutes: 6 },
      { title: "Jordan's Principle", path: '/rights/jordans-principle', estimatedMinutes: 6 },
    ],
  },
];

export function getPathById(id: string): LearningPath | undefined {
  return learningPaths.find((p) => p.id === id);
}

export function getPathsContaining(articlePath: string): LearningPath[] {
  return learningPaths.filter((p) => p.steps.some((s) => s.path === articlePath));
}

export function getNextStep(pathId: string, completedPaths: string[]): PathStep | null {
  const path = getPathById(pathId);
  if (!path) return null;
  return path.steps.find((s) => !completedPaths.includes(s.path)) ?? null;
}
