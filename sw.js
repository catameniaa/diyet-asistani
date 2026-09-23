/* Çevrimdışı çalışma: önce ağ (3 sn), olmazsa önbellek */
const CACHE = 'diyet-asistani-v32';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/core.js', 'js/depo.js', 'js/kripto.js', 'js/data-foods.js', 'js/data-cards.js', 'js/data-ref.js', 'js/data-growth.js', 'js/data-gi.js', 'js/data-tuber.js', 'js/data-oruntu.js', 'js/data-porsiyon.js', 'js/data-pal.js', 'js/data-menu.js', 'js/data-bebek.js', 'js/data-gebe.js', 'js/data-hedef.js', 'js/data-istege.js', 'js/data-icerik.js', 'js/data-porsiyonbesin.js', 'js/data-karsilama.js', 'js/data-eslestirme.js', 'js/data-enerji.js', 'js/data-yontem.js', 'js/data-sporcu.js', 'js/data-vejetaryen.js', 'js/calc.js', 'js/growth.js', 'js/exchange.js', 'js/carbcount.js', 'js/khdagilim.js', 'js/calc-extra.js', 'js/tarama.js', 'js/tuber.js', 'js/oruntu.js', 'js/porsiyon.js', 'js/pal.js', 'js/enerjiref.js', 'js/yontem.js', 'js/sporcu.js', 'js/vejetaryen.js', 'js/ornekmenu.js', 'js/bebek.js', 'js/gebe.js', 'js/diyabetrisk.js', 'js/hedef.js', 'js/istege.js', 'js/porsiyonbesin.js', 'js/search.js', 'js/foods.js',
  'js/clients.js', 'js/reference.js', 'js/journal.js', 'js/cards.js', 'js/kaynaknot.js', 'js/more.js', 'js/boot.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});
/* Yeni sürüm, kullanıcı “Yenile” diyene kadar beklemede kalır */
self.addEventListener('message', (e) => { if (e.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch(req, { signal: ctrl.signal });
      clearTimeout(t);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') { const idx = await cache.match('index.html'); if (idx) return idx; }
      throw err;
    }
  })());
});
