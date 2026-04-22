/**
 * Moments progress — quietly tracks which moments a person has opened,
 * which prompts they've copied, which calls they've tapped through.
 *
 * There is no visible "checklist" in the UI. This store exists so the
 * breadcrumb and any future "you've been here before" signal can work
 * without asking the user to manage state.
 */

import { STORAGE_KEYS } from './storage-keys';

export interface MomentProgress {
  slug: string;
  firstOpened: string;
  lastOpened: string;
  sectionsRead: string[];
  promptsCopied: string[];
  callsTapped: string[];
  notes?: string;
}

type ProgressMap = Record<string, MomentProgress>;

function read(): ProgressMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MOMENTS_PROGRESS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function write(map: ProgressMap): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MOMENTS_PROGRESS, JSON.stringify(map));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

function ensure(slug: string, map: ProgressMap): MomentProgress {
  const now = new Date().toISOString();
  if (!map[slug]) {
    map[slug] = {
      slug,
      firstOpened: now,
      lastOpened: now,
      sectionsRead: [],
      promptsCopied: [],
      callsTapped: [],
    };
  }
  return map[slug];
}

export function markOpened(slug: string): void {
  const map = read();
  const entry = ensure(slug, map);
  entry.lastOpened = new Date().toISOString();
  write(map);
}

export function markPromptCopied(slug: string, promptId: string): void {
  const map = read();
  const entry = ensure(slug, map);
  if (!entry.promptsCopied.includes(promptId)) {
    entry.promptsCopied.push(promptId);
  }
  entry.lastOpened = new Date().toISOString();
  write(map);
}

export function markCallTapped(slug: string, callId: string): void {
  const map = read();
  const entry = ensure(slug, map);
  if (!entry.callsTapped.includes(callId)) {
    entry.callsTapped.push(callId);
  }
  entry.lastOpened = new Date().toISOString();
  write(map);
}

export function getProgress(slug: string): MomentProgress | null {
  return read()[slug] ?? null;
}

export function getAllProgress(): MomentProgress[] {
  return Object.values(read()).sort(
    (a, b) => new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime(),
  );
}
