/**
 * Every First Nation in British Columbia.
 *
 * The spine is Indigenous Services Canada's First Nations Location dataset,
 * which is drawn from the Band Governance Management System — the federal
 * registry of bands. That is the only list here; nothing is added from memory.
 *
 * ON THE COUNT
 * You will see 203 quoted most often, and ISC's "BC Region" contains 204 bands.
 * This holds 201, because it is filtered to bands whose administrative office
 * is actually in British Columbia — the BC Region also administers a few
 * whose offices sit outside the province. Three numbers, three slightly
 * different questions. The page says so rather than picking one and hoping.
 *
 * ON WHAT IS MISSING
 * Tribal Council is blank for 64 of them. Blank means no confident match was
 * found, not that the Nation is unaffiliated — those are very different claims
 * and only one of them is supported. Nothing on the site may render a blank as
 * "independent".
 *
 * ON MATCHING TO THE LEDGER
 * Joining this list to the ledger is the point: it turns a directory into a
 * briefing. It is also where a wrong answer does real damage, so matching is
 * deliberately strict — normalised exact match, or the registry name appearing
 * as a whole phrase. A missed match shows nothing, which is honest. A wrong
 * match would attribute one Nation's affairs to another, which is not.
 */
import directory from '../data/bc/first-nations.json';
import { getEntries, type LedgerEntry } from './ledger';
import { getEditions } from './nations-data';

export interface BcNation {
  bandNumber: number;
  name: string;
  people: string | null;
  tribalCouncil: string | null;
  lat: number | null;
  lon: number | null;
}

export interface BriefMention {
  date: string;
  headline: string;
  url: string;
}

export interface BcNationProfile extends BcNation {
  slug: string;
  /** Ledger records that name this Nation. */
  records: LedgerEntry[];
  /** Brief editions whose text names this Nation. */
  mentions: BriefMention[];
}

export const DIRECTORY_META = {
  source: directory.source,
  sourceUrl: directory.sourceUrl,
  retrieved: directory.retrieved,
  scope: directory.scope,
  enrichment: directory.enrichment,
  count: directory.count,
};

/** Fold to a comparable form: no diacritics, no punctuation, no band suffix. */
function normalise(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[łŁ]/g, 'l')
    .replace(/[ʔ’'ʼ`ʻʼ]/g, '')
    .toLowerCase()
    .replace(/\b(first nations?|indian band|band|nation|tribe|government|council)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Does `haystack` contain `needle` as a whole run of words?
 *
 * Substring matching is not safe here. "Ashcroft" is inside "Ashcroft Indian
 * Band" (correct) but plain `includes` also matched every Nation against any
 * ledger entity that folded down to an empty or near-empty string — which is
 * how a first pass attributed ledger records to 198 of 201 Nations. Attributing
 * one Nation's affairs to another is the worst thing this page could do, so the
 * test is word-boundary anchored and both sides must be substantial.
 */
function containsPhrase(haystack: string, needle: string): boolean {
  if (needle.length < MIN_KEY || haystack.length < MIN_KEY) return false;
  return new RegExp(`(^| )${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(haystack);
}

/** Shortest fold we will match on. Below this, names collide. */
const MIN_KEY = 6;

export function bcSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[łŁ]/g, 'l')
    .replace(/[ʔ’'ʼ`ʻʼ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Too short to match safely — "Kwikwetlem" is fine, "Cook" is not. */
function tooAmbiguous(key: string): boolean {
  return key.length < MIN_KEY;
}

let cache: BcNationProfile[] | undefined;

export function getBcNations(): BcNationProfile[] {
  if (cache) return cache;

  const entries = getEntries();
  const editions = getEditions();

  // Pre-flatten the searchable text of each edition once.
  const editionText = editions.map((e) => ({
    date: e.date,
    headline: e.headline,
    url: e.url,
    text: normalise(
      [
        e.headline,
        e.throughLine,
        e.lead?.headline ?? '',
        ...e.sections.flatMap((s) =>
          s.items.flatMap((i) => [i.headline, ...i.paragraphs, i.whyItMatters ?? '']),
        ),
      ].join(' '),
    ),
  }));

  const usedSlugs = new Map<string, string>();

  cache = (directory.nations as BcNation[])
    .map((nation) => {
      let slug = bcSlug(nation.name);
      if (usedSlugs.has(slug) && usedSlugs.get(slug) !== nation.name) {
        slug = `${slug}-${nation.bandNumber}`;
      }
      usedSlugs.set(slug, nation.name);

      const key = normalise(nation.name);
      const safe = !tooAmbiguous(key);

      const records = safe
        ? entries.filter((entry) =>
            entry.nations.some((n) => {
              const other = normalise(n);
              if (!other || other.length < MIN_KEY) return false;
              // Only the ledger name may be the longer of the two. That covers
              // "Ashcroft" matching "Ashcroft Indian Band" — the same body,
              // named more fully. The reverse direction is deliberately not
              // allowed: it made a record about the Nisga'a Nation appear on
              // each of the four Nisga'a Villages as though it were about that
              // village. A Nation and its constituent communities are related,
              // not interchangeable, and this page must not blur them.
              return other === key || containsPhrase(other, key);
            }),
          )
        : [];

      const mentions = safe
        ? editionText
            .filter((e) => containsPhrase(e.text, key))
            .map(({ date, headline, url }) => ({ date, headline, url }))
        : [];

      return { ...nation, slug, records, mentions };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));

  return cache;
}

export function getBcNation(slug: string): BcNationProfile | null {
  return getBcNations().find((n) => n.slug === slug) ?? null;
}

/** Group by People/Nation, largest first — the axis most people think in. */
export function groupByPeople(): { people: string; nations: BcNationProfile[] }[] {
  const groups = new Map<string, BcNationProfile[]>();
  for (const nation of getBcNations()) {
    const key = nation.people ?? 'Not recorded';
    groups.set(key, [...(groups.get(key) ?? []), nation]);
  }
  return [...groups.entries()]
    .map(([people, nations]) => ({ people, nations }))
    .sort((a, b) => b.nations.length - a.nations.length || a.people.localeCompare(b.people));
}
