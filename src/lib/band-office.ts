/**
 * Naming the door the site keeps telling people to knock on.
 *
 * At least ten pages send a reader to their band office — post-secondary
 * funding, an NIHB appeal, an estate, a treaty annuity, a tax clinic referral
 * — and until now none of them could say where that office is. "Ask your band
 * office" is only advice if the reader knows which office and how to reach it,
 * and someone who moved away, or grew up away, very often does not.
 *
 * **No lookup table here, deliberately.** Slugs in the directory carry
 * collision handling (a band number is appended when two Nations normalise to
 * the same name), so re-deriving them in a second place would be a mismatch
 * waiting to happen. The picker already holds the name and the band number at
 * the moment someone chooses their Nation, so it stores those alongside the
 * slug and every other component reads them. One writer, one source.
 *
 * The registry link is built rather than copied: 201 phone numbers held here
 * would rot quietly, and this repo fails its own build over a stale figure.
 */

import { getHousehold } from './household-store';

export interface KnownNation {
  name: string;
  slug: string;
  bandNumber: number;
}

/** The reader's Nation, if they have named it and it carries a band number. */
export function knownNation(): KnownNation | null {
  const h = getHousehold();
  if (!h?.nationSlug || !h.nationName || !h.nationBandNumber) return null;
  return { name: h.nationName, slug: h.nationSlug, bandNumber: h.nationBandNumber };
}

/** The federal registry's own profile page — address, phone, fax, website. */
export function registryUrl(bandNumber: number): string {
  return `https://fnp-ppn.aadnc-aandc.gc.ca/fnp/Main/Search/FNMain.aspx?BAND_NUMBER=${bandNumber}&lang=eng`;
}
