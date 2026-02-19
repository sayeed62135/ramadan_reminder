const CACHE_NAME = 'ramadan-2026-v1';
const ASSETS = [
  './ramadan-2026.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;700&family=Noto+Nastaliq+Urdu&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
];

// Install: cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache local files first (guaranteed), external CDN best-effort
      return cache.addAll(['./ramadan-2026.html', './manifest.json'])
        .then(() => {
          // Try CDN files but don't fail install if unavailable
          return Promise.allSettled(
            ASSETS.slice(2).map(url =>
              fetch(url).then(r => cache.put(url, r)).catch(() => {})
            )
          );
        });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful GET responses
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('./ramadan-2026.html');
        }
      });
    })
  );
});

// Background sync / push notification handler (future-ready)
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'রমজান', body: '' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '🌙',
      badge: '🌙',
      vibrate: [200, 100, 200],
    })
  );
});
