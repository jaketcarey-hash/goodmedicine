/**
 * Who is in the house.
 *
 * Every benefit in this country is calculated on a household, not a person,
 * and the site used to hold only flags: `hasChildren` on the calendar profile,
 * a separate `hasChildren` string in the Benefits Finder's saved answers, and
 * nothing anywhere that knew how many children or how old they were. An
 * entitlement figure built on a flag is an illustration; one built on a
 * household is hers.
 *
 * **This is now the one place who-lives-here is asked**, and the other two read
 * it rather than holding their own answer — `getProfile()` overlays what is
 * here, so a surface reading the calendar profile gets the household's answer
 * without knowing the household exists. Neither of the old keys was deleted;
 * orphaning data that people already have is the failure `storage-keys.ts`
 * exists to prevent, and a device with no household still behaves exactly as
 * it did.
 *
 * **This module depends on nothing but its own key.** Reading sideways into the
 * calendar or the Benefits Finder lives in `household-draft.ts`, because a
 * canonical source that reaches upward into the things that read it cannot be
 * read by them.
 *
 * **Birth years, not birthdates.** The Canada Child Benefit bands at six and
 * ends at eighteen, so a year is all the arithmetic needs — and a year is
 * markedly less of a child's information to keep on a device than a full date
 * of birth. Storing the least that answers the question is the rule here.
 *
 * **Years unfiled is asked, never assumed.** It is the multiplier on
 * everything retroactive, and guessing it would be guessing the headline.
 */

import { STORAGE_KEYS } from './storage-keys';

export interface Child {
  id: string;
  /** Year of birth. Age bands are all any benefit here needs. */
  birthYear: number;
}

export interface Household {
  /** One or two — the split every federal benefit table draws. */
  adults: 1 | 2;
  children: Child[];
  province: string | null;
  /** Null until asked; false is a different statement from unknown. */
  hasStatus: boolean | null;
  elderInHousehold: boolean;
  /**
   * Tax years with no return filed. 0 means up to date.
   * Capped at 10 because that is how far back CRA will reach.
   */
  yearsUnfiled: number;
  /**
   * Her Nation, by directory slug. Optional and stays optional — plenty of
   * people are members of a Nation outside BC, are not registered, or simply
   * do not want to say, and none of that should cost them a working tool.
   * Nothing in the arithmetic depends on it; it only turns the directory
   * from a national reference into her own file.
   */
  nationSlug?: string | null;
  /**
   * Stored beside the slug at the moment of choosing, because the picker has
   * them and nothing else does. Directory slugs carry collision handling, so
   * re-deriving a band number from a slug elsewhere would be a mismatch
   * waiting to happen — see band-office.ts.
   */
  nationName?: string | null;
  nationBandNumber?: number | null;
  updatedAt: string;
}

export const MAX_RETRO_YEARS = 10;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getHousehold(): Household | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOUSEHOLD);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Household;
    if (!parsed || typeof parsed.adults !== 'number') return null;
    return { ...parsed, children: parsed.children ?? [] };
  } catch {
    return null;
  }
}

export function saveHousehold(h: Household): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    STORAGE_KEYS.HOUSEHOLD,
    JSON.stringify({ ...h, updatedAt: new Date().toISOString() }),
  );
}

export function makeChild(birthYear: number): Child {
  return { id: generateId(), birthYear };
}

/**
 * The facts the household is authoritative for, in the shape the calendar
 * profile holds them.
 *
 * Deliberately three fields and no more. Every one of them is something the
 * household was *asked* outright, and a flag derived from a real answer beats
 * a flag somebody ticked in a different form on a different day. Anything the
 * household cannot answer as well as the profile does — whether she is a
 * student, employed, or Section 87 exempt — stays the profile's own.
 *
 * Null when there is no household, which is the signal to leave the profile
 * entirely alone.
 */
export interface HouseholdOverlay {
  hasChildren: boolean;
  isElder: boolean;
  /** Present only when the household actually states one. */
  province?: string;
}

/** Which profile fields the household answers for. The calendar form reads
 *  this to know what it must stop asking. */
export const HOUSEHOLD_OWNED = ['hasChildren', 'isElder', 'province'] as const;

export function householdOverlay(): HouseholdOverlay | null {
  const h = getHousehold();
  if (!h) return null;
  const overlay: HouseholdOverlay = {
    hasChildren: h.children.length > 0,
    isElder: h.elderInHousehold,
  };
  // A household with no province must not blank one the calendar already
  // holds. Absence here means "not answered", never "answered none", and an
  // overlay that carries the null would turn the first into the second.
  if (h.province) overlay.province = h.province;
  return overlay;
}

/** The fields the household is answering for right now. Province drops out
 *  when the household has not been asked it, because a field nobody answered
 *  is a field the calendar should still be free to ask. */
export function householdAnsweredFields(): readonly string[] {
  const overlay = householdOverlay();
  if (!overlay) return [];
  return HOUSEHOLD_OWNED.filter((f) => f !== 'province' || overlay.province !== undefined);
}
