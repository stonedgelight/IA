/* ~1% · service worker: funciona sem rede. Sobe a versão a cada publicação. */
const CACHE = 'umporcento-0.1.0';
const FICHEIROS = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHEIROS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;   // a folha (script.google.com) passa direto
  e.respondWith(
    caches.match(e.request).then(hit => {
      const rede = fetch(e.request).then(resp => { if (resp && resp.ok) caches.open(CACHE).then(c => c.put(e.request, resp.clone())); return resp; }).catch(() => hit);
      return hit || rede;
    })
  );
});
