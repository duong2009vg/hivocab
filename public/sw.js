// HiVocab Service Worker — PWA Cache Engine
const CACHE_NAME = 'hivocab-shell-v17';
const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/logo-mark.svg',
  '/themes.css',
  '/css/hivocab.min.css',
  '/fonts/material-symbols-outlined.woff2',
  '/data/sound/correct.mp3',
  '/data/sound/incorrect.mp3'
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

  // Bỏ qua /assets/ của Vite (đã có content hash, tránh lỗi cross-world service worker resource mismatch)
  if (url.pathname.startsWith('/assets/')) return;

  // Xử lý các tài nguyên cùng origin
  if (url.origin === self.location.origin) {
    const isNavigationRequest = event.request.mode === 'navigate'
      || event.request.destination === 'document'
      || event.request.headers.get('accept')?.includes('text/html');

    const offlineResponse = () => new Response(
      'Không thể kết nối mạng. Vui lòng tải lại trang.',
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      },
    );

    // 1. Navigation requests (HTML documents): LUÔN ưu tiên mạng (Network-First)
    // để trình duyệt luôn nhận file index.html mới nhất, tránh tình trạng chunk hash bị lệch sau khi deploy
    if (isNavigationRequest) {
      event.respondWith(
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              }).catch(() => {});
            }
            return networkResponse;
          })
          .catch(() => {
            // Khi không có kết nối internet: dùng app shell đã lưu trong cache
            return caches.match(event.request).then((cached) => {
              if (cached) return cached;
              return caches.match('/').then((shell) => shell || offlineResponse());
            });
          })
      );
      return;
    }

    // 2. Static non-HTML assets (CSS, SVG, fonts): Stale-While-Revalidate
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              return cache.put(event.request, responseClone);
            }).catch(() => {});
          }
          return networkResponse;
        }).catch(() => {
          if (cachedResponse) return cachedResponse;
          return offlineResponse();
        });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
