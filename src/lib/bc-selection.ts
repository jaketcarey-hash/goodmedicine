/**
 * The one thing the map and the directory both need to know.
 *
 * They are separate Astro islands with independent hydration roots, so they
 * cannot simply share a store — each would get its own copy, and the bug would
 * be silent. A tiny event bus on `window` is the honest mechanism here: no
 * bundling assumptions, no shared-module sleight of hand, and it works
 * whichever island hydrates first.
 *
 * Two facts travel, and only two. The filter the directory is applying, so the
 * map can show where those Nations are; and the Nation the map has selected,
 * so the directory can jump to it. Anything more and the two components start
 * co-ordinating rather than answering each other.
 *
 * Late listeners get the current value on subscribe, because the map is
 * `client:idle` and the directory is `client:load` — the directory can and does
 * publish a filter before the map exists to hear it.
 */

export interface BcFilter {
  /** Slugs currently shown by the directory. Null means no filter is applied. */
  slugs: string[] | null;
  /** What the person typed or chose, for the map to say out loud. */
  describe: string;
}

const FILTER_EVENT = 'bc:filter';
const SELECT_EVENT = 'bc:select';

let currentFilter: BcFilter = { slugs: null, describe: '' };
let currentSelection: string | null = null;

export function publishFilter(filter: BcFilter): void {
  currentFilter = filter;
  window.dispatchEvent(new CustomEvent<BcFilter>(FILTER_EVENT, { detail: filter }));
}

export function onFilter(handler: (f: BcFilter) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<BcFilter>).detail);
  window.addEventListener(FILTER_EVENT, listener);
  handler(currentFilter); // whatever was published before this island woke up
  return () => window.removeEventListener(FILTER_EVENT, listener);
}

export function publishSelection(slug: string | null): void {
  currentSelection = slug;
  window.dispatchEvent(new CustomEvent<string | null>(SELECT_EVENT, { detail: slug }));
}

export function onSelection(handler: (slug: string | null) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<string | null>).detail);
  window.addEventListener(SELECT_EVENT, listener);
  handler(currentSelection);
  return () => window.removeEventListener(SELECT_EVENT, listener);
}
