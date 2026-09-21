/* Depolama dayanıklılığı: anlık kopyalar (IndexedDB) ve depolama teşhisi.

   Neden ayrı bir depo? localStorage tek bir anahtarda tutuluyor. O anahtar
   bozulursa, yanlış bir geri yükleme üzerine yazarsa ya da bir kayıt yarım
   kalırsa elde bir şey kalmıyor. IndexedDB ayrı bir depolama arka ucu:
   localStorage bozulsa da anlık kopyalar ayakta kalır.

   Neyi KURTARMAZ: cihazı kaybetmek, "site verilerini temizle", uygulamayı
   ana ekrandan silmek. Bunlar için dosya yedeği şart. */
(function () {
  'use strict';

  const DB = 'dyt-depo', STORE = 'anlik', SURUM = 1;
  const TUT = 12;                 /* saklanacak anlık kopya sayısı */
  const ARALIK = 10 * 60 * 1000;  /* en sık bu aralıkla kopya alınır */
  let sonKopya = 0, yazilyor = false;

  function ac() {
    return new Promise((ok, hata) => {
      if (!self.indexedDB) return hata(new Error('IndexedDB yok'));
      const r = indexedDB.open(DB, SURUM);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'ts' });
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => hata(r.error);
    });
  }

  function islem(mod, fn) {
    return ac().then((d) => new Promise((ok, hata) => {
      const t = d.transaction(STORE, mod), s = t.objectStore(STORE);
      let sonuc;
      try { sonuc = fn(s); } catch (e) { hata(e); return; }
      t.oncomplete = () => { d.close(); ok(sonuc && sonuc.result !== undefined ? sonuc.result : sonuc); };
      t.onerror = () => { d.close(); hata(t.error); };
    }));
  }

  /* ---- anlık kopya ---- */

  const ozet = (S) => ({
    danisan: (S.clients || []).length,
    menu: (S.menus || []).length,
    staj: (S.journal || []).length,
    besin: (S.customFoods || []).length
  });

  /* DA.save() her çağrıldığında tetiklenir; aralık dolmadıysa hiçbir şey yapmaz. */
  DA.depoAnlik = (zorla) => {
    const simdi = Date.now();
    if (!zorla && (yazilyor || simdi - sonKopya < ARALIK)) return Promise.resolve(false);
    yazilyor = true;
    const S = DA.state();
    let json;
    try { json = JSON.stringify(S); } catch (e) { yazilyor = false; return Promise.resolve(false); }
    return islem('readwrite', (st) => {
      st.put({ ts: simdi, json, ozet: ozet(S), boyut: json.length });
      /* En eskileri at: anahtar zaman damgası olduğu için sıra doğal. */
      const cur = st.openCursor();
      const hepsi = [];
      cur.onsuccess = (e) => {
        const c = e.target.result;
        if (c) { hepsi.push(c.key); c.continue(); return; }
        hepsi.sort((a, b) => a - b);
        hepsi.slice(0, Math.max(0, hepsi.length - TUT)).forEach((k) => st.delete(k));
      };
    }).then(() => { sonKopya = simdi; yazilyor = false; return true; })
      .catch(() => { yazilyor = false; return false; });
  };

  DA.depoListe = () => islem('readonly', (st) => st.getAll())
    .then((a) => (a || []).sort((x, y) => y.ts - x.ts))
    .catch(() => []);

  DA.depoSil = (ts) => islem('readwrite', (st) => st.delete(ts)).then(() => true).catch(() => false);

  DA.depoTemizle = () => islem('readwrite', (st) => st.clear()).then(() => true).catch(() => false);

  /* ---- teşhis ---- */

  DA.depoDurum = async () => {
    const d = { kalici: null, kullanim: null, kota: null, anlik: 0, sonAnlik: null, ls: null };
    try { if (navigator.storage && navigator.storage.persisted) d.kalici = await navigator.storage.persisted(); }
    catch (e) { /* desteklenmiyor */ }
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const e = await navigator.storage.estimate();
        d.kullanim = e.usage; d.kota = e.quota;
      }
    } catch (e) { /* desteklenmiyor */ }
    try { d.ls = (localStorage.getItem('dyt.v1') || '').length; } catch (e) { d.ls = null; }
    const liste = await DA.depoListe();
    d.anlik = liste.length;
    d.sonAnlik = liste[0] || null;
    return d;
  };

  /* Kalıcı depolama izni yoksa bir kez daha iste (kullanıcı etkileşiminden sonra
     tarayıcılar daha cömert davranıyor). */
  DA.depoKaliciIste = async () => {
    try {
      if (!(navigator.storage && navigator.storage.persist)) return null;
      return await navigator.storage.persist();
    } catch (e) { return null; }
  };

  /* Açılışta bir kopya al: en azından bu oturumun başlangıç hâli elde olsun. */
  if (!DA.depoKilit || !DA.depoKilit()) {
    setTimeout(() => DA.depoAnlik(true), 2500);
  }
})();
