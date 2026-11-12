/* Service worker : garde l'application en mémoire pour qu'elle s'ouvre sans internet.
   Stratégie : réseau d'abord (toujours la dernière version quand il y a du réseau, avec un délai de 4 s),
   puis le cache si le réseau est absent ou trop lent.
   >>> Change VERSION à chaque mise à jour du code, pour renouveler le cache. <<< */
const VERSION = 'v15';
const CACHE = 'carnet-atelier-' + VERSION;
const TIMEOUT_MS = 4000;
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './css/auth.css',
  './css/base.css',
  './css/components.css',
  './css/print.css',
  './js/auth/crypto.js',
  './js/auth/gate.js',
  './js/auth/screens.js',
  './js/auth/service.js',
  './js/auth/session.js',
  './js/auth/settings-ui.js',
  './js/auth/store.js',
  './js/config.js',
  './js/core/dom.js',
  './js/core/events.js',
  './js/core/format.js',
  './js/core/storage.js',
  './js/domain/clients.js',
  './js/domain/fiches.js',
  './js/domain/messages.js',
  './js/domain/phone.js',
  './js/features/atelier.js',
  './js/features/backup.js',
  './js/features/call.js',
  './js/features/clients-ui.js',
  './js/features/detail.js',
  './js/features/form.js',
  './js/features/github-backup.js',
  './js/features/list.js',
  './js/features/receipt.js',
  './js/features/settings.js',
  './js/main.js',
  './js/pwa.js',
  './js/ui/sheets.js',
  './js/ui/toast.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('carnet-atelier-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const timeout = ms => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await Promise.race([fetch(request, { cache: 'no-cache' }), timeout(TIMEOUT_MS)]);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const hit = await cache.match(request, { ignoreSearch: true });
    if (hit) return hit;
    if (request.mode === 'navigate') {
      const page = await cache.match('./index.html');
      if (page) return page;
    }
    throw err;
  }
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  event.respondWith(networkFirst(req));
});
