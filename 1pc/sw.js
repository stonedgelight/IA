/* ~1% · service worker: funciona sem rede. Sobe a versão a cada publicação (a app compara-a com a sua). */
const CACHE = 'umporcento-0.2.0';
const FICHEIROS = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];

self.addEventListener('install', e => {
  // cache: 'reload' = vai ao servidor, ignora a cache HTTP do browser (o GitHub Pages manda guardar 10 min)
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHEIROS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;   // a folha (script.google.com) passa direto
  // rede primeiro, sempre confirmada com o servidor (cache: 'no-cache' -> 304 se não mudou); sem rede, a cópia guardada
  e.respondWith(
    fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }).then(resp => {
      if (resp && resp.ok) { const copia = resp.clone(); caches.open(CACHE).then(c => c.put(e.request.url, copia)); }
      if (resp.redirected) return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: resp.headers });
      return resp;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html')))
  );
});
