const CACHE_NAME = 'intense-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/mdui.css',
  '/mdui.js',
  '/animate.css',
  '/icons/Default.css',
  '/icons/Default.woff2',
  'icons/Outlined.css',
  'icons/Outlined.woff2'
];

// Install: cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache, update in background
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => cached); // fallback to cache on error
      return cached || fetchPromise;
    })
  );
});
