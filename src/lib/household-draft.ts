/**
 * Seeding a household from what she has already said elsewhere.
 *
 * This lives apart from `household-store.ts` on purpose. The household is the
 * canonical answer to who lives here, so it sits at the bottom of the graph and
 * depends on nothing but its own storage key. Reading *sideways* — into the
 * calendar profile, into the Benefits Finder's saved run — is a different job,
 * and doing it from inside the store would point the dependency the wrong way
 * and make `calendar-store` unable to read the household at all.
 *
 * Nothing here saves. It seeds forms she still has to confirm, because a
 * silently pre-filled household is a household nobody checked.
 */

import { STORAGE_KEYS } from './storage-keys';
import { type Household } from './household-store';
import { storedProfile, hasStoredProfile } from './calendar-store';

/** The Benefits Finder's saved answers, or null. Its own shape, read loosely —
 *  a malformed run is not worth failing a form over. */
function savedBenefitAnswers(): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BENEFITS_RESULTS);
    if (!raw) return null;
    return JSON.parse(raw)?.answers ?? null;
  } catch {
    return null;
  }
}

/**
 * A first draft from what she has already told the site.
 *
 * The calendar profile knows the province and whether there is an Elder; the
 * Benefits Finder knows about status. None of it is enough on its own, and all
 * of it is better than an empty form — being asked a third time for something
 * already answered twice is how people conclude a site is not paying attention.
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

  // The *stored* profile, not the overlaid one. This seeds a household from
  // what she told the calendar; reading the overlay here would be the household
  // seeding itself.
  if (hasStoredProfile()) {
    const p = storedProfile();
    draft.province = p.province;
    draft.elderInHousehold = p.isElder;
    // hasChildren is a flag; it cannot say how many or how old. One child with
    // an unknown birth year is a worse guess than none, so this only marks
    // that the question is worth asking.
  }

  const answers = savedBenefitAnswers();
  if (answers?.hasStatus) draft.hasStatus = answers.hasStatus === 'yes';

  return draft;
}

/**
 * Does anything the site holds think there are children?
 *
 * The fallback for when no household has been built yet. Where one exists it
 * answers outright and this is not the question to ask — `getProfile()` already
 * carries the household's answer.
 */
export function childrenLikely(): boolean {
  if (typeof window === 'undefined') return false;
  if (hasStoredProfile() && storedProfile().hasChildren) return true;
  return savedBenefitAnswers()?.hasChildren === 'yes';
}
