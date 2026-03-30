/**
 * Learning progress — stored entirely on-device.
 * No server, no tracking, no accounts. Your pace, your path.
 */

export interface LearningProgress {
  completedArticles: string[];
  activePath: string | null;
  pathProgress: Record<string, string[]>;
  knowledgeChecks: Record<string, boolean>;
}

const STORAGE_KEY = 'gm_learning';

function getProgress(): LearningProgress {
  if (typeof window === 'undefined') {
    return { completedArticles: [], activePath: null, pathProgress: {}, knowledgeChecks: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completedArticles: [], activePath: null, pathProgress: {}, knowledgeChecks: {} };
    return JSON.parse(raw);
  } catch {
    return { completedArticles: [], activePath: null, pathProgress: {}, knowledgeChecks: {} };
  }
}

function save(progress: LearningProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function markArticleComplete(pagePath: string): void {
  const progress = getProgress();

  if (!progress.completedArticles.includes(pagePath)) {
    progress.completedArticles.push(pagePath);
  }

  // Update any paths that include this article
  for (const [pathId, completed] of Object.entries(progress.pathProgress)) {
    if (!completed.includes(pagePath)) {
      // The caller decides completion — we just record the article globally.
      // Path-level completion is tracked separately via completePathStep.
    }
  }

  save(progress);
}

export function completePathStep(pathId: string, pagePath: string): void {
  const progress = getProgress();

  // Ensure the article is also marked globally
  if (!progress.completedArticles.includes(pagePath)) {
    progress.completedArticles.push(pagePath);
  }

  if (!progress.pathProgress[pathId]) {
    progress.pathProgress[pathId] = [];
  }

  if (!progress.pathProgress[pathId].includes(pagePath)) {
    progress.pathProgress[pathId].push(pagePath);
  }

  save(progress);
}

export function isArticleComplete(pagePath: string): boolean {
  return getProgress().completedArticles.includes(pagePath);
}

export function getPathProgress(pathId: string): string[] {
  return getProgress().pathProgress[pathId] ?? [];
}

export function getOverallProgress(): { completed: number; total: number } {
  const progress = getProgress();
  return {
    completed: progress.completedArticles.length,
    total: 0, // Caller provides total from path definitions
  };
}

export function getCompletedArticles(): string[] {
  return getProgress().completedArticles;
}

export function startPath(pathId: string): void {
  const progress = getProgress();
  progress.activePath = pathId;

  if (!progress.pathProgress[pathId]) {
    progress.pathProgress[pathId] = [];
  }

  save(progress);
}

export function getActivePath(): string | null {
  return getProgress().activePath;
}

export function clearActivePath(): void {
  const progress = getProgress();
  progress.activePath = null;
  save(progress);
}
