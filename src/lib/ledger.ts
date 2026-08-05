/**
 * Shaping the event ledger for reading.
 *
 * The raw record carries eighteen possible stages. Eighteen is the right
 * resolution for the record and the wrong resolution for a reader, so stages
 * are grouped into four bands that answer the question people actually bring:
 * has this happened, or is it still being talked about?
 *
 * The exact stage is never discarded — it stays on every record and is shown
 * on the chip. The band is a lens over it, not a replacement.
 */
import { getLedger, type LedgerRecord } from './nations-data';

export type Band = 'early' | 'committed' | 'done' | 'contested';

export const BAND_STAGES: Record<Band, string[]> = {
  early: ['discussion', 'proposal', 'consultation', 'option'],
  committed: ['MOU', 'legislation introduced', 'financing committed'],
  done: [
    'provincial ratification',
    'legally effective',
    'permit or approval',
    'financial close',
    'transaction closed',
    'construction',
    'operational',
    'implementation',
  ],
  contested: ['litigation', 'judgment', 'restructuring'],
};

export const BAND_ORDER: Band[] = ['early', 'committed', 'done', 'contested'];

export const BAND_LABEL: Record<Band, string> = {
  early: 'Still being discussed',
  committed: 'Committed, not yet done',
  done: 'Done or in force',
  contested: 'Before the courts',
};

export const BAND_MEANING: Record<Band, string> = {
  early: 'A proposal, a consultation, or an option — real, but nothing is binding yet.',
  committed:
    'An agreement signed or money pledged. The decision is made; the transaction is not finished.',
  done: 'Closed, approved, legally in force, or operating. This has actually happened.',
  contested: 'In litigation, decided by a court, or being restructured.',
};

export function bandOf(stage: string): Band {
  const found = BAND_ORDER.find((band) =>
    BAND_STAGES[band].some((s) => s.toLowerCase() === stage.toLowerCase()),
  );
  return found ?? 'early';
}

export interface LedgerEntry extends LedgerRecord {
  band: Band;
  year: string;
  amountValue: number | null;
  amountLabel: string | null;
  /** What the figure actually counts. Never show the amount without it. */
  amountQualifier: string | null;
  sectors: string[];
  places: string[];
  nations: string[];
  sourceCount: number;
}

/** Compact money, because "$3.6 billion" reads and "$3,600,000,000" does not. */
export function formatAmount(value: number, currency = 'CAD'): string {
  const prefix = currency === 'CAD' ? '$' : `${currency} `;
  if (value >= 1_000_000_000) {
    const n = value / 1_000_000_000;
    return `${prefix}${n % 1 === 0 ? n : n.toFixed(1)} billion`;
  }
  if (value >= 1_000_000) {
    const n = value / 1_000_000;
    return `${prefix}${n % 1 === 0 ? n : n.toFixed(1)} million`;
  }
  return `${prefix}${value.toLocaleString('en-CA')}`;
}

export function getEntries(): LedgerEntry[] {
  const ledger = getLedger();
  if (!ledger) return [];

  return ledger.records
    .map((record) => {
      const amount = record.amount as
        | { value: number; currency?: string; qualifier?: string }
        | null;

      return {
        ...record,
        band: bandOf(record.stage),
        year: record.date.slice(0, 4),
        amountValue: amount?.value ?? null,
        amountLabel: amount ? formatAmount(amount.value, amount.currency) : null,
        amountQualifier: amount?.qualifier ?? null,
        sectors: (record.sector_theme as string[]) ?? [],
        places: (record.province_or_territory as string[]) ?? [],
        nations: (record.nations_and_indigenous_organizations as string[]) ?? [],
        sourceCount:
          ((record.primary_sources as unknown[]) ?? []).length +
          ((record.independent_verification as unknown[]) ?? []).length,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export interface BandCount {
  band: Band;
  label: string;
  meaning: string;
  count: number;
  /** Share of the whole, as a percentage, for the bar width. */
  share: number;
}

export function getBandCounts(entries: LedgerEntry[]): BandCount[] {
  return BAND_ORDER.map((band) => {
    const count = entries.filter((e) => e.band === band).length;
    return {
      band,
      label: BAND_LABEL[band],
      meaning: BAND_MEANING[band],
      count,
      share: entries.length ? (count / entries.length) * 100 : 0,
    };
  });
}

/** Every distinct value of a list-valued field, most common first. */
export function facetOf(entries: LedgerEntry[], key: 'sectors' | 'places'): string[] {
  const tally = new Map<string, number>();
  for (const entry of entries) {
    for (const value of entry[key]) {
      tally.set(value, (tally.get(value) ?? 0) + 1);
    }
  }
  return [...tally.entries()].sort((a, b) => b[1] - a[1]).map(([value]) => value);
}

/*
 * There is deliberately no `totalDisclosed()` here. The amounts measure
 * different things — a purchase price, a guarantee's capacity, ten years of
 * grant funding, a government estimate of trade enabled — and summing them
 * would manufacture a headline figure that no single record supports. Every
 * amount travels with its qualifier instead.
 */
