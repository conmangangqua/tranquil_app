// Hub Asset Cache - Service Worker
// Cache icons (app icon từ GitHub Releases) + CDN scripts (Lucide từ unpkg) mãi mãi
// để bypass cache-control max-age ngắn ngủi → no flash, no re-download mỗi lần mở.
const CACHE = 'hub-assets-v2';

// Hosts có icon raster (PNG/JPG/...) — cache theo extension.
const ICON_HOSTS = new Set([
  'github.com',
  'objects.githubusercontent.com',
  'raw.githubusercontent.com',
  'avatars.githubusercontent.com',
]);
const ICON_EXT_RE = /\.(png|jpe?g|webp|svg|gif|ico)(\?|$)/i;

// Hosts có CDN JS/CSS — cache toàn bộ requests (lucide library, fonts).
const CDN_HOSTS = new Set([
  'unpkg.com',
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
]);

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e =>
  e.waitUntil(
    // Dọn cache version cũ
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))),
    ).then(() => self.clients.claim()),
  ),
);

function shouldCache(url) {
  if (ICON_HOSTS.has(url.hostname)) return ICON_EXT_RE.test(url.pathname);
  if (CDN_HOSTS.has(url.hostname)) return true;
  return false;
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!shouldCache(url)) return;

  event.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(resp => {
          if (resp && (resp.ok || resp.type === 'opaque')) {
            cache.put(event.request, resp.clone()).catch(() => {});
          }
          return resp;
        }).catch(() => new Response('', { status: 504 }));
      }),
    ),
  );
});
