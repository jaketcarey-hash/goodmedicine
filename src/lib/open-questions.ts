/**
 * What isn't known yet.
 *
 * Every outlet publishes what happened. Almost nobody keeps a public register
 * of what is still open — which deal has not closed, whose terms are
 * undisclosed, which ruling is pending. The brief and the ledger already
 * produce that material and then throw it away: unknowns sit inside one
 * edition, still-watching lines roll forward week to week and vanish, and a
 * ledger record's unresolved questions are only visible if you open that
 * record.
 *
 * This collects them into one register.
 *
 * The most useful signal falls out of collecting them: when the same question
 * appears in several editions, it has been carried. `firstSeen` is the earliest
 * edition that raised it and `carriedIn` counts how many have repeated it, so
 * the register can be sorted by how long something has gone unanswered rather
 * than by when it was last mentioned.
 *
 * Nothing here asserts an answer. An item leaves the register when the source
 * material stops carrying it — which, honestly, is a weaker signal than a
 * resolution and is described that way on the page.
 */
import { getEditions } from './nations-data';
import { getEntries } from './ledger';

export type QuestionSource = 'ledger' | 'brief';

export interface OpenQuestion {
  /** The open question itself. */
  question: string;
  /** What it is about — the event or headline it hangs off. */
  subject: string;
  source: QuestionSource;
  /** Where to read the full context. */
  url: string;
  /** Earliest date this was recorded. */
  firstSeen: string;
  /** Most recent date it was repeated. */
  lastSeen: string;
  /** How many separate editions or records carried it. */
  carriedIn: number;
  /** Days between firstSeen and the newest material on the site. */
  daysOpen: number;
  /** Set for ledger items, so a reader can see how settled the thing is. */
  stage?: string;
  confidence?: string;
}

/** Loose key for spotting the same question restated across editions. */
function key(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 12)
    .join(' ');
}

function daysBetween(a: string, b: string): number {
  const ms = Date.parse(b) - Date.parse(a);
  return Number.isFinite(ms) ? Math.max(0, Math.round(ms / 86_400_000)) : 0;
}

export function getOpenQuestions(): OpenQuestion[] {
  const collected = new Map<string, OpenQuestion>();

  const add = (item: Omit<OpenQuestion, 'carriedIn' | 'daysOpen' | 'lastSeen'>) => {
    const text = item.question?.trim();
    if (!text || text.length < 12) return;

    const k = key(text);
    if (!k) return;

    const existing = collected.get(k);
    if (existing) {
      existing.carriedIn += 1;
      // Keep the earliest sighting, and point at the most recent context.
      if (item.firstSeen < existing.firstSeen) existing.firstSeen = item.firstSeen;
      if (item.firstSeen > existing.lastSeen) {
        existing.lastSeen = item.firstSeen;
        existing.url = item.url;
        existing.subject = item.subject;
      }
      return;
    }

    collected.set(k, {
      ...item,
      question: text,
      lastSeen: item.firstSeen,
      carriedIn: 1,
      daysOpen: 0,
    });
  };

  // The ledger: every record carries unresolved questions.
  for (const entry of getEntries()) {
    const raw = entry.unresolved_questions;
    const list = Array.isArray(raw) ? raw : raw ? [raw as string] : [];
    for (const question of list) {
      add({
        question: String(question),
        subject: entry.event,
        source: 'ledger',
        url: `/nations/ledger/${entry.id}`,
        firstSeen: entry.date,
        stage: entry.stage,
        confidence: entry.confidence,
      });
    }
  }

  // The briefs: lead unknowns, per-development unknowns, and still-watching.
  for (const edition of getEditions()) {
    if (edition.lead) {
      for (const unknown of edition.lead.unknowns ?? []) {
        add({
          question: unknown,
          subject: edition.lead.headline,
          source: 'brief',
          url: edition.url,
          firstSeen: edition.date,
        });
      }
    }

    for (const section of edition.sections) {
      for (const item of section.items) {
        for (const unknown of item.unknowns ?? []) {
          add({
            question: unknown,
            subject: item.headline,
            source: 'brief',
            url: edition.url,
            firstSeen: edition.date,
          });
        }
      }
    }

    for (const line of edition.stillWatching) {
      add({
        question: line,
        subject: edition.headline,
        source: 'brief',
        url: edition.url,
        firstSeen: edition.date,
      });
    }
  }

  // Age against the newest material on the site, not against today — the site
  // is only as current as its last edition, and dating from "now" would quietly
  // inflate every number whenever the pipeline stalls.
  const items = [...collected.values()];
  const newest = items.reduce((max, i) => (i.lastSeen > max ? i.lastSeen : max), '0000-00-00');
  for (const item of items) {
    item.daysOpen = daysBetween(item.firstSeen, newest);
  }

  return items.sort(
    (a, b) =>
      b.carriedIn - a.carriedIn ||
      b.daysOpen - a.daysOpen ||
      a.question.localeCompare(b.question),
  );
}

export interface OpenQuestionStats {
  total: number;
  fromLedger: number;
  fromBriefs: number;
  carried: number;
  oldestDays: number;
  asOf: string;
}

export function getOpenQuestionStats(questions: OpenQuestion[]): OpenQuestionStats {
  return {
    total: questions.length,
    fromLedger: questions.filter((q) => q.source === 'ledger').length,
    fromBriefs: questions.filter((q) => q.source === 'brief').length,
    carried: questions.filter((q) => q.carriedIn > 1).length,
    oldestDays: questions.reduce((max, q) => Math.max(max, q.daysOpen), 0),
    asOf: questions.reduce((max, q) => (q.lastSeen > max ? q.lastSeen : max), ''),
  };
}
