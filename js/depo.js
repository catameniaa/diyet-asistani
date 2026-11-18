/* Depolama: birincil kayıt (IndexedDB), anlık kopyalar ve depolama teşhisi.

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
    liste: (S.listeler || []).length,
    staj: (S.journal || []).length,
    besin: (S.customFoods || []).length
  });

  /* DA.save() her çağrıldığında tetiklenir; aralık dolmadıysa hiçbir şey yapmaz. */
  DA.depoAnlik = (zorla) => {
    const simdi = Date.now(), K = DA._kasa || {};
    /* Kilitliyken bellekteki durum boştur: boş durumun kopyası alınmaz. */
    if (K.zarf && !K.yazici) return Promise.resolve(false);
    if (!zorla && (yazilyor || simdi - sonKopya < ARALIK)) return Promise.resolve(false);
    yazilyor = true;
    const S = DA.state();
    let json;
    try { json = JSON.stringify(S); } catch (e) { yazilyor = false; return Promise.resolve(false); }
    /* Kilit kuruluysa kopya da şifreli: IndexedDB'de düz metin kalsaydı
       kilit yalnız ekranı korur, veriyi korumazdı. */
    const sifreli = !!(K.zarf && K.sifrele);
    return (sifreli ? K.sifrele(json) : Promise.resolve(json)).then((veri) => islem('readwrite', (st) => {
      st.put({ ts: simdi, json: veri, sifreli, ozet: ozet(S), boyut: json.length });
      /* En eskileri at: anahtar zaman damgası olduğu için sıra doğal. */
      const cur = st.openCursor();
      const hepsi = [];
      cur.onsuccess = (e) => {
        const c = e.target.result;
        if (c) { hepsi.push(c.key); c.continue(); return; }
        hepsi.sort((a, b) => a - b);
        hepsi.slice(0, Math.max(0, hepsi.length - TUT)).forEach((k) => st.delete(k));
      };
    })).then(() => { sonKopya = simdi; yazilyor = false; return true; })
      .catch(() => { yazilyor = false; return false; });
  };

  /* Kopyanın düz metni: şifreliyse kasa anahtarıyla çözülür (kilit açık olmalı). */
  DA.depoMetin = async (k) => {
    if (!k.sifreli) return k.json;
    const K = DA._kasa || {};
    if (!K.coz) throw new Error('Bu kopya şifreli; önce kilidi aç');
    return K.coz(k.json);
  };

  DA.depoListe = () => islem('readonly', (st) => st.getAll())
    .then((a) => (a || []).sort((x, y) => y.ts - x.ts))
    .catch(() => []);

  DA.depoSil = (ts) => islem('readwrite', (st) => st.delete(ts)).then(() => true).catch(() => false);

  DA.depoTemizle = () => islem('readwrite', (st) => st.clear()).then(() => true).catch(() => false);

  /* ---- birincil kayıt: IndexedDB (dyt-ana) ----
     Neden: localStorage ~5 MB ile sınırlı ve her yazımda ana iş parçacığını
     bekletiyor; danışan, liste ve menü arttıkça sınır yaklaşıyordu. Kayıt
     artık IndexedDB'de; localStorage 'dyt.v1' eşzamanlı AYNA olarak sürüyor:
       · açılış beklemesin diye ilk durum aynadan eşzamanlı okunur;
       · IndexedDB yazımı eşzamansız: sekme o an kapanırsa ayna daha yenidir,
         açılışta zaman damgasıyla (dyt.v1.ts) hangisinin yeni olduğu seçilir.
     Taşıma kayıpsız: birincil kayıt yoksa aynadaki metin AYNEN yazılır, geri
     okunup karakter karakter karşılaştırılır; tutmazsa localStorage birincil
     kalır ve ayarlarda uyarı çıkar. Ayna hiç silinmez.
     Seçim kuralı (DA.depoBaslat):
       · ikisi aynı → bir şey yapılmaz
       · birincil var, ayna yok ya da birincil eşit/yeni → birincil yüklenir,
         ayna onarılır (bozuk ayna böyle kurtulur)
       · ayna daha yeni (IndexedDB yazımı yarıda kaldı) → ayna kalır,
         birincile yazılır; ayna bozuksa (kilit) birincile YAZILMAZ
       · birincil yok → taşıma (ayna bozuksa taşınmaz, ham metin korunur) */
  const ANA_DB = 'dyt-ana', ANA_ST = 'kayit', TS = DA.depoAnahtari + '.ts';
  const ana = { kaynak: '', goc: null, hata: '', hazir: false };
  function anaAc() {
    return new Promise((ok, hata) => {
      if (!self.indexedDB) return hata(new Error('IndexedDB yok'));
      const r = indexedDB.open(ANA_DB, 1);
      r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains(ANA_ST)) d.createObjectStore(ANA_ST, { keyPath: 'k' }); };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => hata(r.error);
    });
  }
  function anaIslem(mod, fn) {
    return anaAc().then((d) => new Promise((ok, hata) => {
      const t = d.transaction(ANA_ST, mod), st = t.objectStore(ANA_ST);
      let istek;
      try { istek = fn(st); } catch (e) { d.close(); hata(e); return; }
      t.oncomplete = () => { d.close(); ok(istek && istek.result !== undefined ? istek.result : null); };
      t.onerror = () => { d.close(); hata(t.error); };
      t.onabort = () => { d.close(); hata(t.error || new Error('iptal')); };
    }));
  }
  const anaOku = () => anaIslem('readonly', (st) => st.get('ana')).then((r) => r || null);
  const anaYaz = (metin, ts) => anaIslem('readwrite', (st) => st.put({ k: 'ana', metin, ts }));
  const zamanli = (p, ms) => Promise.race([p, new Promise((_, h) => setTimeout(() => h(new Error('IndexedDB yanıt vermedi')), ms))]);

  /* Yazım kuyruğu: art arda kayıtlar birleştirilir, en son metin yazılır */
  let bekleyen = null, akis = null;
  async function bosalt() {
    try {
      while (bekleyen) {
        const b = bekleyen; bekleyen = null;
        await anaYaz(b.metin, b.ts);
      }
      ana.hata = '';
    } catch (e) {
      ana.hata = 'IndexedDB’ye yazılamadı: ' + ((e && e.message) || 'bilinmeyen hata');
      if (DA.toast) DA.toast('Kayıt IndexedDB’ye yazılamadı; tarayıcı depolamasını kontrol et');
    } finally { akis = null; }
  }
  /* DA.save() buradan yazar. Ayna eşzamanlı, birincil sıraya alınır.
     Dönüş: kayıt bir yerde güvende mi (ayna yazıldı ya da birincil hazır) */
  DA.depoYaz = (metin) => {
    const ts = Date.now();
    let ayna = true;
    try { localStorage.setItem(DA.depoAnahtari, metin); localStorage.setItem(TS, String(ts)); } catch (e) { ayna = false; }
    if (self.indexedDB) { bekleyen = { metin, ts }; if (!akis) akis = bosalt(); }
    if (!ayna && ana.hazir && !ana.aynaUyari) {
      ana.aynaUyari = true;
      if (DA.toast) DA.toast('localStorage dolu; kayıt IndexedDB’de sürüyor');
    }
    return ayna || ana.hazir;
  };
  /* Bekleyen birincil yazım bitene kadar (test ve sayfa kapanışı için) */
  DA.depoBekle = () => akis || Promise.resolve();
  addEventListener('pagehide', () => { if (bekleyen && !akis) akis = bosalt(); });

  DA.depoBaslat = async () => {
    /* Her çağrı sıfırdan karar verir (açılışta bir kez; testte yeniden) */
    ana.kaynak = ''; ana.goc = null; ana.hata = ''; ana.hazir = false;
    let L = null, Lts = 0;
    try { L = localStorage.getItem(DA.depoAnahtari); Lts = +(localStorage.getItem(TS) || 0); } catch (e) { /* ayna okunamıyor */ }
    let r;
    try { r = await zamanli(anaOku(), 2500); } catch (e) { ana.kaynak = 'ayna'; ana.hata = (e && e.message) || 'IndexedDB açılamadı'; return ana.kaynak; }
    try {
      if (r && typeof r.metin === 'string') {
        if (L === r.metin) { ana.kaynak = 'idb'; ana.hazir = true; return ana.kaynak; }
        /* Birincil kayıt okunamıyorsa sağlam aynanın üzerine yazılmaz: ayna
           yüklü kalır, ilk kayıt birincili onarır. */
        let gecerli = true;
        try { JSON.parse(r.metin); } catch (e) { gecerli = false; }
        if (!gecerli) {
          ana.hata = 'IndexedDB’deki kayıt okunamadı; aynadan açıldı';
          ana.kaynak = 'ayna'; ana.hazir = !(DA.depoKilit && DA.depoKilit()); return ana.kaynak;
        }
        if (L == null || (r.ts || 0) >= Lts) {
          DA._yukle(r.metin);
          try { localStorage.setItem(DA.depoAnahtari, r.metin); localStorage.setItem(TS, String(r.ts || Date.now())); } catch (e) { /* ayna yazılamadı */ }
          ana.kaynak = 'idb'; ana.hazir = true; return ana.kaynak;
        }
        if (DA.depoKilit && DA.depoKilit()) { ana.kaynak = 'kilit'; return ana.kaynak; }
        await anaYaz(L, Lts);
        ana.kaynak = 'ayna-yeni'; ana.hazir = true; return ana.kaynak;
      }
      if (L == null) { ana.kaynak = 'bos'; ana.hazir = true; return ana.kaynak; }
      if (DA.depoKilit && DA.depoKilit()) { ana.kaynak = 'kilit'; return ana.kaynak; }
      const ts = Lts || Date.now();
      await anaYaz(L, ts);
      const g = await anaOku();
      if (g && g.metin === L) {
        ana.goc = ts; ana.kaynak = 'goc'; ana.hazir = true;
        try { if (!Lts) localStorage.setItem(TS, String(ts)); } catch (e) { /* yok say */ }
        return ana.kaynak;
      }
      ana.kaynak = 'ayna'; ana.hata = 'IndexedDB’ye taşıma doğrulanamadı; kayıt localStorage’da kalıyor';
      return ana.kaynak;
    } catch (e) {
      ana.kaynak = 'ayna'; ana.hata = (e && e.message) || 'IndexedDB hatası';
      return ana.kaynak;
    }
  };
  /* Kasa sıfırlama: ayna, zaman damgası ve birincil kayıt birlikte silinir */
  DA.depoAnaSil = async () => {
    bekleyen = null; await DA.depoBekle();
    try { localStorage.removeItem(DA.depoAnahtari); localStorage.removeItem(TS); } catch (e) { /* yok say */ }
    try { await anaIslem('readwrite', (st) => st.delete('ana')); } catch (e) { /* yok say */ }
  };
  DA.depoAna = () => Object.assign({}, ana);

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
    try { d.ls = (localStorage.getItem(DA.depoAnahtari) || '').length; } catch (e) { d.ls = null; }
    d.ana = DA.depoAna();
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
