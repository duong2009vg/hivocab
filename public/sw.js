// HiVocab Service Worker — PWA Cache Engine
const CACHE_NAME = 'hivocab-shell-v1';
const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/logo-mark.svg',
  '/themes.css',
  '/css/hivocab.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Bỏ qua các request API và Supabase để luôn nhận dữ liệu mới nhất
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co')) return;

  // Stale-While-Revalidate cho static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
