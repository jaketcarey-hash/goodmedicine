/**
 * The Nations material, read at build time.
 *
 * Editions are the source of truth as JSON — the HTML the pipeline used to
 * produce was only ever a render of this. Two contracts coexist, because the
 * daily and weekly briefs were built by different tracks:
 *
 *   daily  — "The Nations This Morning". A numbered source register at the
 *            bottom, items referring to it by id.
 *   weekly — "The Nations This Week". Flat section arrays, sources nested per
 *            item.
 *
 * Rather than teach every page about both, `normalise()` flattens them into one
 * shape: a headline, a through-line, one lead item, a list of sections each
 * holding items, and a single deduplicated source register. Pages only ever see
 * that. Adding a third cadence later means one more branch here and no template
 * changes anywhere.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface Source {
  id: number;
  label: string;
  url: string;
  date?: string;
  type?: string;
}

export interface BriefItem {
  headline: string;
  /** The body, already split into paragraphs. */
  paragraphs: string[];
  whyItMatters?: string;
  unknowns?: string[];
  nextCatalyst?: string;
  status?: string;
  sourceIds: number[];
}

export interface BriefSection {
  title: string;
  items: BriefItem[];
}

export interface SweepGroup {
  domain: string;
  items: { line: string; label?: string; url?: string }[];
}

export interface Edition {
  slug: string;
  date: string;
  dateLong: string;
  cadence: 'daily' | 'weekly';
  title: string;
  headline: string;
  throughLine: string;
  readTime?: string;
  status?: string;
  lead: BriefItem | null;
  sections: BriefSection[];
  whatHappensNext: string[];
  stillWatching: string[];
  sweep: SweepGroup[];
  bright: BriefItem | null;
  sources: Source[];
  url: string;
}

/* ------------------------------------------------------------------ */

const files = import.meta.glob<Record<string, any>>('../data/nations/*.json', {
  eager: true,
  import: 'default',
});

/** "2026-08-04" from ".../2026-08-04.json"; the -weekly suffix marks cadence. */
function parsePath(path: string): { slug: string; date: string; cadence: 'daily' | 'weekly' } {
  const slug = path.split('/').pop()!.replace(/\.json$/, '');
  return {
    slug,
    date: slug.replace(/-weekly$/, ''),
    cadence: slug.endsWith('-weekly') ? 'weekly' : 'daily',
  };
}

function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Short form for datelines and archive rows: "4 August 2026". */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-CA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Collects nested sources into one numbered register, reusing an id when the
 * same URL appears twice. The weekly contract repeats sources across sections,
 * so without this the register would list the same outlet five times.
 */
function createRegister() {
  const byUrl = new Map<string, Source>();

  return {
    add(raw: { label?: string; url?: string; date?: string; type?: string }[] = []): number[] {
      const ids: number[] = [];
      for (const s of raw) {
        if (!s?.url) continue;
        const existing = byUrl.get(s.url);
        if (existing) {
          ids.push(existing.id);
          continue;
        }
        const entry: Source = {
          id: byUrl.size + 1,
          label: s.label ?? s.url,
          url: s.url,
          date: s.date,
          type: s.type,
        };
        byUrl.set(s.url, entry);
        ids.push(entry.id);
      }
      return ids;
    },
    all(): Source[] {
      return [...byUrl.values()];
    },
  };
}

function normaliseDaily(raw: any, base: ReturnType<typeof parsePath>): Edition {
  const sources: Source[] = (raw.sources ?? []).map((s: any) => ({
    id: s.id,
    label: s.label,
    url: s.url,
    date: s.date,
    type: s.type,
  }));

  const lead: BriefItem | null = raw.oneThing
    ? {
        headline: raw.oneThing.headline,
        paragraphs: raw.oneThing.paragraphs ?? [],
        whyItMatters: raw.oneThing.whyItMatters,
        unknowns: raw.oneThing.unknowns ?? [],
        nextCatalyst: raw.oneThing.nextCatalyst,
        status: raw.oneThing.status,
        sourceIds: raw.oneThing.sourceIds ?? [],
      }
    : null;

  // Developments arrive flat with a section label on each; group them while
  // preserving the order the brief put them in.
  const sections: BriefSection[] = [];
  for (const dev of raw.developments ?? []) {
    const title = dev.section ?? 'Developments';
    let section = sections.find((s) => s.title === title);
    if (!section) {
      section = { title, items: [] };
      sections.push(section);
    }
    section.items.push({
      headline: dev.headline,
      paragraphs: [dev.whatHappened].filter(Boolean),
      whyItMatters: dev.whyItMatters,
      unknowns: [dev.whatRemainsUnknown].filter(Boolean),
      nextCatalyst: dev.nextCatalyst,
      status: dev.status,
      sourceIds: dev.sourceIds ?? [],
    });
  }

  return {
    ...base,
    dateLong: raw.meta?.dateLong ?? longDate(base.date),
    title: raw.meta?.title ?? 'The Nations This Morning',
    headline: raw.meta?.headline ?? '',
    throughLine: raw.throughLine ?? '',
    readTime: raw.meta?.readTime,
    status: raw.meta?.status,
    lead,
    sections,
    whatHappensNext: raw.whatHappensNext ?? [],
    stillWatching: raw.stillWatching ?? [],
    sweep: [],
    bright: null,
    sources,
    url: `/nations/archive/${base.slug}`,
  };
}

function normaliseWeekly(raw: any, base: ReturnType<typeof parsePath>): Edition {
  const register = createRegister();

  const lead: BriefItem | null = raw.oneThing
    ? {
        headline: raw.oneThing.headline,
        paragraphs: raw.oneThing.paragraphs ?? [],
        status: raw.oneThing.status,
        sourceIds: register.add(raw.oneThing.sources),
      }
    : null;

  const SECTION_KEYS: [string, string][] = [
    ['econ', 'Economic Sovereignty'],
    ['land', 'Land, Water & Rights'],
    ['governance', 'Governance & Policy'],
    ['home', 'Closer to Home'],
  ];

  const sections: BriefSection[] = [];
  for (const [key, title] of SECTION_KEYS) {
    const items = (raw[key] ?? []).map((item: any) => ({
      headline: item.headline,
      paragraphs: [item.what ?? item.text].filter(Boolean),
      whyItMatters: item.why,
      status: item.status,
      sourceIds: register.add(item.sources),
    }));
    if (items.length) sections.push({ title, items });
  }

  const bright: BriefItem | null = raw.bright
    ? {
        headline: raw.bright.headline,
        paragraphs: [raw.bright.text].filter(Boolean),
        sourceIds: register.add(raw.bright.sources),
      }
    : null;

  const sweep: SweepGroup[] = (raw.sweep ?? []).map((group: any) => ({
    domain: group.domain,
    items: group.items ?? [],
  }));

  return {
    ...base,
    dateLong: longDate(base.date),
    title: 'The Nations This Week',
    headline: raw.meta?.headline ?? '',
    throughLine: '',
    lead,
    sections,
    whatHappensNext: [],
    stillWatching: (raw.stillWatching ?? []).map((s: any) =>
      typeof s === 'string' ? s : s.line,
    ),
    sweep,
    bright,
    sources: register.all(),
    url: `/nations/archive/${base.slug}`,
  };
}

/** Every edition, newest first. */
export function getEditions(): Edition[] {
  return Object.entries(files)
    .map(([path, raw]) => {
      const base = parsePath(path);
      return base.cadence === 'weekly'
        ? normaliseWeekly(raw, base)
        : normaliseDaily(raw, base);
    })
    .sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date)));
}

export function getLatestEdition(): Edition | null {
  return getEditions()[0] ?? null;
}

export function getEdition(slug: string): Edition | null {
  return getEditions().find((e) => e.slug === slug) ?? null;
}

/* ---------------------------- The ledger ---------------------------- */

export interface LedgerRecord {
  id: string;
  date: string;
  effective_date: string | null;
  event: string;
  stage: string;
  confidence: 'high' | 'medium' | 'low';
  [key: string]: unknown;
}

export interface LedgerSummary {
  total: number;
  high: number;
  medium: number;
  low: number;
  coverageStart: string;
  coverageEnd: string;
  stages: string[];
  records: LedgerRecord[];
}

let ledgerCache: LedgerSummary | null | undefined;

export function getLedger(): LedgerSummary | null {
  if (ledgerCache !== undefined) return ledgerCache;

  try {
    // Read rather than import: the ledger still lives in public/ until the
    // dossier is ported, and it is large enough that bundling it would be waste.
    const raw = JSON.parse(
      readFileSync(
        join(process.cwd(), 'public', 'nations', 'ytd-2026', 'event-ledger.json'),
        'utf-8',
      ),
    );

    const records: LedgerRecord[] = raw.records ?? [];
    const tally = (level: string) => records.filter((r) => r.confidence === level).length;

    ledgerCache = {
      total: records.length,
      high: tally('high'),
      medium: tally('medium'),
      low: tally('low'),
      coverageStart: raw.coverage_start,
      coverageEnd: raw.coverage_end,
      stages: raw.stage_vocabulary ?? [],
      records,
    };
  } catch {
    ledgerCache = null;
  }

  return ledgerCache;
}
