// HiVocab Service Worker — PWA Cache Engine
const CACHE_NAME = 'hivocab-shell-v13';
const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/logo-mark.svg',
  '/themes.css',
  '/css/hivocab.min.css',
  '/fonts/material-symbols-outlined.woff2'
];

// Các domain CDN/external — để browser tự xử lý, không intercept
const BYPASS_HOSTS = [
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.payos.vn',
  'static.cloudflareinsights.com',
  'accounts.google.com',
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

  let url;
  try {
    url = new URL(event.request.url);
  } catch (e) {
    return; // URL không hợp lệ, bỏ qua
  }

  // Bỏ qua chrome-extension và non-http URLs
  if (!url.protocol.startsWith('http')) return;

  // Bỏ qua CDN và external domains — để browser xử lý trực tiếp
  if (BYPASS_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith('.' + host))) return;

  // Bỏ qua các API requests và Supabase để luôn nhận dữ liệu mới nhất
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co')) return;

  // Bỏ qua Cloudflare analytics
  if (url.hostname.includes('cloudflareinsights.com')) return;

  // Stale-While-Revalidate cho static assets cùng origin
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              try {
                cache.put(event.request, responseClone);
              } catch (e) {
                // Bỏ qua lỗi cache (vd: chrome-extension scheme)
              }
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
