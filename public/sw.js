/**
 * Good Medicine — Service Worker
 * Offline-first strategy: precache everything at install,
 * serve from cache, update in background.
 */

const CACHE_NAME = 'gm-v3';

// These get populated at build time or manually
const PRECACHE_URLS = [
  '/',
  '/money',
  '/money/banking',
  '/money/budgeting',
  '/money/saving',
  '/money/credit',
  '/money/debt',
  '/money/investing',
  '/money/taxes',
  '/money/budget-tool',
  '/money/savings-tracker',
  '/money/net-worth',
  '/money/debt-planner',
  '/rights',
  '/rights/section-87',
  '/rights/section-87-checker',
  '/rights/nihb',
  '/rights/treaty-payments',
  '/rights/education-funding',
  '/rights/band-finances',
  '/rights/jordans-principle',
  '/path',
  '/path/leaving-home',
  '/path/first-job',
  '/path/building-life',
  '/path/raising-family',
  '/path/supporting-elders',
  '/path/giving-back',
  '/self',
  '/self/benefits',
  '/self/stress',
  '/self/confidence',
  '/self/conversations',
  '/learn',
  '/calendar',
  '/glossary',
  '/ask-ai',
  '/tools/life-simulator',
  '/tools/tax-estimator',
  '/favicon.svg',
  '/manifest.json',
];

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

// Fetch: cache-first for all content
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
