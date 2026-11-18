// Guarda la app en el celular para gastar casi nada de datos y funcionar sin internet.
// Al publicar cambios, sube el número de versión.
const CACHE = 'mis-gastos-v4';
const APP = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const propio = new URL(req.url).origin === self.location.origin;

  if (!propio) {
    // Tipografías y la herramienta de Excel nunca cambian: se descargan una vez y se usan del celular.
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return r;
    })));
    return;
  }

  // La app: abre al instante con la copia guardada y revisa en segundo plano si hay versión nueva
  // (la novedad aparece la siguiente vez que abras la app).
  e.respondWith(caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true }).then(hit => {
    const red = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || red;
  })));
});
