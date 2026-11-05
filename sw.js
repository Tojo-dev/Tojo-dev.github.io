/* Service worker du Carnet d'atelier.
   Change le numéro de VERSION à chaque mise à jour de l'application
   pour que les téléphones récupèrent les nouveaux fichiers. */
const VERSION = 'v10';
const CACHE = 'carnet-atelier-' + VERSION;
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('carnet-atelier-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // Pages : réseau d'abord s'il y en a (pour les mises à jour), sinon le cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Autres fichiers : cache d'abord
  event.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
