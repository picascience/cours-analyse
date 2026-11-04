// Permet d'ouvrir le cours sans connexion après une première visite.
// Pages : réseau d'abord (pour avoir la dernière version), cache si hors ligne.
// Fichiers KaTeX / icônes : cache d'abord.
const CACHE = 'analyse1-v1';
const KATEX = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/';
const PRECACHE = [
  './', 'index.html', 'videos.html', 'manifest.webmanifest',
  'icon-180.png', 'icon-192.png', 'icon-512.png',
  KATEX + 'katex.min.css', KATEX + 'katex.min.js', KATEX + 'contrib/auto-render.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !req.url.startsWith(KATEX)) return; // YouTube etc. : pas touché

  if (req.mode === 'navigate' || (sameOrigin && url.pathname.endsWith('.html'))) {
    e.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match('index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    }))
  );
});
