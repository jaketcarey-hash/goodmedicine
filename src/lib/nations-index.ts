/**
 * The ledger, indexed by who it is about.
 *
 * The ledger reads chronologically, which is the wrong axis for the people
 * most likely to want it. A Nation's finance director does not want to know
 * what happened in March; they want to know what has been recorded about their
 * Nation, and about the Nations they sit across the table from.
 *
 * Names are used exactly as the ledger records them, because the ledger's own
 * evidence standard requires Nations, Inuit and Métis governments and
 * organizations to be named as they name themselves. No normalising, no
 * tidying, no merging near-matches — a near-match might be two distinct
 * governments, and guessing is how you erase one.
 */
import { getEntries, type LedgerEntry } from './ledger';

export interface NationProfile {
  /** The name exactly as the ledger records it. */
  name: string;
  slug: string;
  records: LedgerEntry[];
  /** Distinct sectors across their records, most common first. */
  sectors: string[];
  places: string[];
  firstSeen: string;
  lastSeen: string;
}

/**
 * Letters that carry meaning but do not decompose under Unicode NFD, because
 * they are distinct letters rather than a base plus a combining accent.
 *
 * Without this, Gitxaała slugs to "gitxaa-a-nation" — the ł becomes a hyphen
 * and the name is mangled in its own URL. On a site whose standard is naming
 * Nations as they name themselves, that is not a cosmetic bug.
 */
const LETTERS: Record<string, string> = {
  ł: 'l', Ł: 'l',
  đ: 'd', Đ: 'd',
  ø: 'o', Ø: 'o',
  æ: 'ae', Æ: 'ae',
  œ: 'oe', Œ: 'oe',
  ŧ: 't', Ŧ: 't',
  ƛ: 'tl',
  ʔ: '', // glottal stop — silent in a slug, never dropped from the display name
};

/**
 * URL-safe slug. Unicode is folded for the slug only; the display name is
 * never touched and is always rendered exactly as the ledger records it.
 */
export function slugify(name: string): string {
  return name
    .replace(/[łŁđĐøØæÆœŒŧŦƛʔ]/g, (c) => LETTERS[c] ?? c)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'ʼ`ʼ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function rank(values: string[]): string[] {
  const tally = new Map<string, number>();
  for (const v of values) tally.set(v, (tally.get(v) ?? 0) + 1);
  return [...tally.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
}

let cache: NationProfile[] | undefined;

export function getNationProfiles(): NationProfile[] {
  if (cache) return cache;

  const byName = new Map<string, LedgerEntry[]>();
  for (const entry of getEntries()) {
    for (const name of entry.nations) {
      if (!name?.trim()) continue;
      const list = byName.get(name) ?? [];
      list.push(entry);
      byName.set(name, list);
    }
  }

  // Two different names must never collapse onto one page.
  const slugs = new Map<string, string>();

  cache = [...byName.entries()]
    .map(([name, records]) => {
      let slug = slugify(name);
      if (slugs.has(slug) && slugs.get(slug) !== name) {
        slug = `${slug}-${slugs.size}`;
      }
      slugs.set(slug, name);

      const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
      return {
        name,
        slug,
        records: sorted,
        sectors: rank(records.flatMap((r) => r.sectors)),
        places: rank(records.flatMap((r) => r.places)),
        firstSeen: sorted[sorted.length - 1].date,
        lastSeen: sorted[0].date,
      };
    })
    .sort((a, b) => b.records.length - a.records.length || a.name.localeCompare(b.name));

  return cache;
}

export function getNationProfile(slug: string): NationProfile | null {
  return getNationProfiles().find((p) => p.slug === slug) ?? null;
}
