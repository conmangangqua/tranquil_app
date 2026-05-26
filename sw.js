// Hub Icon Cache - Service Worker
// Cache icons từ GitHub Releases & Pages mãi mãi (đến khi user clear cache).
// Bypass cache-control max-age=300 ngắn ngủi của GitHub CDN.
const CACHE = 'hub-icons-v1';
const ICON_HOSTS = new Set([
  'github.com',
  'objects.githubusercontent.com',
  'raw.githubusercontent.com',
  'avatars.githubusercontent.com'
]);
const ICON_EXT_RE = /\.(png|jpe?g|webp|svg|gif|ico)(\?|$)/i;

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!ICON_HOSTS.has(url.hostname)) return;
  if (!ICON_EXT_RE.test(url.pathname)) return;

  event.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(resp => {
          // Cache cả opaque (cross-origin) lẫn cors-clean response
          if (resp && (resp.ok || resp.type === 'opaque')) {
            cache.put(event.request, resp.clone()).catch(() => {});
          }
          return resp;
        }).catch(() => new Response('', { status: 504 }));
      })
    )
  );
});
