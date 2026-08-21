/**
 * Strong Fire — Service Worker
 *
 * Offline-first, which means the last-known-good copy of everything is on the
 * device and the site works on a dead connection. That is the point of it and
 * it does not change.
 *
 * What did change, on 21 August 2026, is that it was also offline-first for
 * HTML, with a cache name typed in by hand. The two together meant a returning
 * visitor was served the previous version of the site in full: cached HTML,
 * which names cached hashed assets, which were also there. `activate` deletes
 * every cache whose key is not CACHE_NAME — and CACHE_NAME never moved, so it
 * deleted nothing. Ten deploys in a day reached nobody who had been here
 * before, and the background revalidation only ever prepared the version you
 * would see on the visit after this one.
 *
 * So:
 *
 * - **The cache name is stamped at build time** from the precache list, which
 *   contains hashed filenames. New assets, new cache, and the old one is
 *   actually deleted on activate.
 * - **Navigations go to the network first** and fall back to the cache. HTML
 *   is the one thing that must be current, because it names every other
 *   version-stamped file on the page. Offline still works — the fallback is
 *   the same cache it always was.
 * - **Hashed assets stay cache-first**, which is free and safe: a filename
 *   containing a content hash cannot go stale without becoming a different
 *   filename.
 */

// Replaced at build time by scripts/generate-sw.js.
const CACHE_NAME = 'gm-__BUILD_ID__';

// Auto-generated at build time by scripts/generate-sw.js
const PRECACHE_URLS = ['__PRECACHE_URLS__'];

// Install: precache all content
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests (fonts, analytics, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    // But cache Google Fonts
    if (event.request.url.includes('fonts.googleapis.com') ||
        event.request.url.includes('fonts.gstatic.com')) {
      event.respondWith(
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return response;
          });
        })
      );
      return;
    }
    return;
  }

  /* HTML: network first, cache as the safety net.
   *
   * A page carries the names of every hashed asset it needs, so serving a
   * stale one serves a stale site entire. Falling back to the cache the moment
   * the network fails keeps this working on no signal, which is the whole
   * reason the cache exists. */
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((cached) => cached || caches.match('/')),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Serve from cache, but update in background
        fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response);
            });
          }
        }).catch(() => {});

        return cached;
      }

      // Not in cache — fetch from network, cache it
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(() => {
        // Offline and not cached — return offline page if it's a navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
