/* ============================================================
   IVY.HK · service worker
   Offline-first for the app shell, network-first for navigation,
   and an auto-update path that reloads the page when a new
   version is deployed.
   ============================================================ */
const VERSION = 'ivy-v3';
const CORE = [
  './',
  './index.html',
  './css/style.css',
  './js/game.js',
  './manifest.json',
  './image/hamm.png',
  './image/cake_64.svg',
  './image/heart_192.png',
  './image/heart_512.png',
  './image/icon.svg',
  './image/icon_maskable.png',
  './image/og.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // fonts & analytics pass through

  // Navigations: try the network first so a fresh deploy is picked up,
  // fall back to the cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html', { ignoreSearch: true }))
    );
    return;
  }

  // Static assets: cache first, refresh in the background.
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
