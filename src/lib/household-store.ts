/**
 * Who is in the house.
 *
 * Every benefit in this country is calculated on a household, not a person,
 * and until now the site only held flags: `hasChildren` on the calendar
 * profile, a separate `hasChildren` string in the Benefits Finder's saved
 * answers, and nothing anywhere that knows how many children or how old they
 * are. Those two can already disagree with each other. An entitlement figure
 * built on a flag is an illustration; one built on a household is hers.
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
import { getProfile, hasProfile } from './calendar-store';

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
 * A first draft from what she has already told the site.
 *
 * The calendar profile knows the province and whether there are children and
 * an Elder; the Benefits Finder knows about status and filing. None of it is
 * enough on its own, and all of it is better than an empty form — being asked
 * a third time for something already answered twice is how people conclude a
 * site is not paying attention.
 *
 * Nothing here is saved. It seeds a form she still has to confirm, because a
 * silently pre-filled household is a household nobody checked.
 */
export function draftFromWhatIsKnown(): Household {
  const draft: Household = {
    adults: 1,
    children: [],
    province: null,
    hasStatus: null,
    elderInHousehold: false,
    yearsUnfiled: 0,
    updatedAt: '',
  };
  if (typeof window === 'undefined') return draft;

  if (hasProfile()) {
    const p = getProfile();
    draft.province = p.province;
    draft.elderInHousehold = p.isElder;
    // hasChildren is a flag; it cannot say how many or how old. One child with
    // an unknown birth year is a worse guess than none, so this only marks
    // that the question is worth asking.
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BENEFITS_RESULTS);
    if (raw) {
      const b = JSON.parse(raw);
      if (b?.answers?.hasStatus) draft.hasStatus = b.answers.hasStatus === 'yes';
    }
  } catch {
    /* a malformed saved run is not worth failing a form over */
  }
  return draft;
}

/** Does the calendar profile or the Benefits Finder think there are children? */
export function childrenLikely(): boolean {
  if (typeof window === 'undefined') return false;
  if (hasProfile() && getProfile().hasChildren) return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BENEFITS_RESULTS);
    if (raw) return JSON.parse(raw)?.answers?.hasChildren === 'yes';
  } catch {
    /* ignore */
  }
  return false;
}
