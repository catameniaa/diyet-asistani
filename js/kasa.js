/* Uygulama kilidi — parola + şifreli veri + kurtarma kodu.

   Neden: danışan verisi sağlık verisidir (KVKK'da özel nitelikli). Telefonda
   localStorage düz metin duruyordu; şifreli yedek yalnız cihaz dışına çıkan
   dosyayı koruyordu. Kilit kurulunca kayıt diskte şifreli durur.

   Anahtar düzeni
     · Veri anahtarı (DEK): rastgele 256 bit AES-GCM. Bütün kayıt ve anlık
       kopyalar bununla şifrelenir; yalnız bellekte durur.
     · DEK iki kez sarılır: paroladan türetilen anahtarla ve bir kez gösterilen
       kurtarma koduyla (PBKDF2-SHA256, 310 000 tur). Parola unutulursa kod
       açar; ikisi de kaybolursa veri açılamaz — kurtarma yolu bilerek yok,
       sunucu yok. Bu yüzden dosya yedeği hâlâ şart.
     · Parola değişince yalnız DEK yeniden sarılır; veri yeniden şifrelenmez.

   Zarf (localStorage 'dyt.v1'):
     { format, v, tema, anahtar: { parola: {salt, iv, data, iter},
       kurtarma: {…} }, iv, data }
   Tema şifresiz: kilit ekranı kullanıcının temasıyla açılsın. Başka alan yok.

   Yazma: DA.save() eşzamanlı, şifreleme eşzamansız. Kayıtlar sıraya girer;
   art arda gelen kayıtlar birleştirilir, en son durum yazılır. Kilitlenmeden
   önce sıranın bitmesi beklenir (DA.kasa.bekle). */
(function () {
  'use strict';
  const { esc, icon } = DA;
  const K = DA._kasa;
  const KASA = 'diyet-asistani-kasa', SURUM = 1, TUR = 310000;
  const ABC = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';   /* Crockford base32: 0/O, 1/I/L karışmaz */
  const sub = () => (self.crypto && crypto.subtle) || null;
  const b64 = (x) => DA._b64(x), deB64 = (x) => DA._deB64(x);

  let dek = null;          /* CryptoKey — yalnız kilit açıkken */
  let anahtarlar = null;   /* sarılı DEK'ler */
  let tema = 'auto';
  let kurtarmaHam = null;  /* kurtarma koduyla açıldı, yeni parola bekleniyor */
  let mod = 'parola';      /* kilit ekranı: 'parola' | 'kurtar' | 'yeni' */

  /* ---- kriptografi ---- */
  async function kek(gizli, tuz, tur) {
    const ham = await sub().importKey('raw', new TextEncoder().encode(gizli), 'PBKDF2', false, ['deriveKey']);
    return sub().deriveKey({ name: 'PBKDF2', salt: tuz, iterations: tur, hash: 'SHA-256' },
      ham, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function sar(dekHam, gizli) {
    const tuz = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const k = await kek(gizli, tuz, TUR);
    const d = await sub().encrypt({ name: 'AES-GCM', iv }, k, dekHam);
    return { salt: b64(tuz), iv: b64(iv), data: b64(d), iter: TUR };
  }
  /* Yanlış gizli sözcükte AES-GCM doğrulaması düşer */
  async function coz(sarili, gizli) {
    const k = await kek(gizli, deB64(sarili.salt), sarili.iter || TUR);
    try { return new Uint8Array(await sub().decrypt({ name: 'AES-GCM', iv: deB64(sarili.iv) }, k, deB64(sarili.data))); }
    catch (e) { throw new Error('yanlis'); }
  }
  const dekAl = (ham) => sub().importKey('raw', ham, 'AES-GCM', false, ['encrypt', 'decrypt']);
  async function veriSifrele(metin) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const d = await sub().encrypt({ name: 'AES-GCM', iv }, dek, new TextEncoder().encode(metin));
    return { iv: b64(iv), data: b64(d) };
  }
  async function veriCoz(iv, data, anahtar) {
    const d = await sub().decrypt({ name: 'AES-GCM', iv: deB64(iv) }, anahtar || dek, deB64(data));
    return new TextDecoder().decode(d);
  }

  /* Kurtarma kodu: 24 karakter (120 bit), dörtlü gruplar */
  function kodUret() {
    const b = crypto.getRandomValues(new Uint8Array(24));
    let s = '';
    for (let i = 0; i < 24; i++) s += ABC[b[i] & 31] + (i % 4 === 3 && i < 23 ? '-' : '');
    return s;
  }
  /* Elle yazılan kodu toparla: küçük harf, boşluk, O/I/L karışıklığı */
  const kodNormal = (k) => String(k || '').toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/[^0-9A-Z]/g, '');

  /* ---- yazma sırası ---- */
  let yaziliyor = null, bekleyen = null;
  function yazici(state) {
    bekleyen = JSON.stringify(state);
    tema = (state.ui && state.ui.theme) || 'auto';
    if (!yaziliyor) yaziliyor = calis();
  }
  async function calis() {
    try {
      while (bekleyen != null) {
        const metin = bekleyen; bekleyen = null;
        const v = await veriSifrele(metin);
        const zarf = { format: KASA, v: SURUM, tema, anahtar: anahtarlar, iv: v.iv, data: v.data };
        try { localStorage.setItem(DA.depoAnahtari, JSON.stringify(zarf)); K.zarf = zarf; }
        catch (e) { if (DA.toast) DA.toast('Kaydedilemedi: tarayıcı depolaması dolu ya da kapalı'); }
      }
    } finally { yaziliyor = null; }
  }
  const bekle = () => yaziliyor || Promise.resolve();

  /* Kilit açık: yazıcı ve kopya şifreleyicisi devrede */
  function devreye(anahtar) {
    dek = anahtar;
    K.yazici = yazici;
    K.sifrele = async (metin) => JSON.stringify(Object.assign({ format: KASA + '-kopya', v: SURUM }, await veriSifrele(metin)));
    K.coz = async (metin) => { const o = JSON.parse(metin); return veriCoz(o.iv, o.data); };
  }

  /* ---- dış arayüz ---- */
  const kasa = DA.kasa = {
    kurulu: () => !!K.zarf,
    acik: () => !!K.yazici,
    bekle,

    /* Kilidi kur. Kurtarma kodunu döner; bir daha gösterilmez. */
    async kur(parola) {
      if (!sub()) throw new Error('Bu tarayıcıda şifreleme yok');
      if (K.zarf) throw new Error('Kilit zaten kurulu');
      if (!parola || parola.length < 8) throw new Error('Parola en az 8 karakter olmalı');
      const ham = crypto.getRandomValues(new Uint8Array(32)), kod = kodUret();
      anahtarlar = { parola: await sar(ham, parola), kurtarma: await sar(ham, kodNormal(kod)) };
      devreye(await dekAl(ham));
      K.zarf = { format: KASA };          /* ilk yazım gerçek zarfı koyar */
      yazici(DA.state());
      await bekle();
      /* Kilitten önce alınmış kopyalar düz metindi: kalırlarsa veri açıkta */
      if (DA.depoTemizle) { await DA.depoTemizle(); if (DA.depoAnlik) await DA.depoAnlik(true); }
      return kod;
    },

    async kilitAc(parola) {
      if (!K.zarf || K.yazici) return;
      const z = K.zarf;
      const ham = await coz(z.anahtar.parola, parola);
      const anahtar = await dekAl(ham);
      let metin;
      try { metin = await veriCoz(z.iv, z.data, anahtar); }
      catch (e) { throw new Error('bozuk'); }
      anahtarlar = z.anahtar; tema = z.tema || 'auto';
      DA._durumAta(JSON.parse(metin));
      devreye(anahtar);
    },

    /* Kurtarma koduyla aç: veri çözülür ama yeni parola belirlenene kadar
       uygulamaya geçilmez — eski parola unutulmuştur. */
    async kurtar(kod) {
      if (!K.zarf || K.yazici) return;
      const ham = await coz(K.zarf.anahtar.kurtarma, kodNormal(kod));
      kurtarmaHam = ham; mod = 'yeni';
    },
    async yeniParolaKur(parola) {
      if (!kurtarmaHam) throw new Error('Önce kurtarma koduyla aç');
      if (!parola || parola.length < 8) throw new Error('Parola en az 8 karakter olmalı');
      const z = K.zarf, ham = kurtarmaHam;
      const anahtar = await dekAl(ham);
      const metin = await veriCoz(z.iv, z.data, anahtar);
      anahtarlar = { parola: await sar(ham, parola), kurtarma: z.anahtar.kurtarma };
      tema = z.tema || 'auto';
      kurtarmaHam = null; mod = 'parola';
      DA._durumAta(JSON.parse(metin));
      devreye(anahtar);
      DA.save(); await bekle();
    },

    async parolaDegistir(eski, yeni) {
      if (!K.yazici) throw new Error('Kilit açık değil');
      if (!yeni || yeni.length < 8) throw new Error('Yeni parola en az 8 karakter olmalı');
      const ham = await coz(anahtarlar.parola, eski);
      anahtarlar = { parola: await sar(ham, yeni), kurtarma: anahtarlar.kurtarma };
      DA.save(); await bekle();
    },
    async yeniKod(parola) {
      if (!K.yazici) throw new Error('Kilit açık değil');
      const ham = await coz(anahtarlar.parola, parola), kod = kodUret();
      anahtarlar = { parola: anahtarlar.parola, kurtarma: await sar(ham, kodNormal(kod)) };
      DA.save(); await bekle();
      return kod;
    },

    /* Kilidi kaldır: kayıt düz metne döner, şifreli kopyalar silinir. */
    async kaldir(parola) {
      if (!K.yazici) throw new Error('Kilit açık değil');
      await coz(anahtarlar.parola, parola);
      await bekle();
      dek = null; anahtarlar = null;
      K.zarf = null; K.yazici = null; K.sifrele = null; K.coz = null;
      DA.save();
      if (DA.depoTemizle) { await DA.depoTemizle(); if (DA.depoAnlik) await DA.depoAnlik(true); }
    },

    /* Belleği boşalt, kilit ekranına dön */
    async kilitle() {
      if (!K.yazici) return;
      await bekle();
      dek = null; K.yazici = null; K.sifrele = null; K.coz = null;
      mod = 'parola';
      DA._durumAta({ ui: { theme: tema } });
      if (DA.closeSheet) DA.closeSheet();
      DA.render(false);
    },

    /* Uygulama arka plandan dönünce: süre dolduysa kilitle. Test de bunu
       çağırır (görünürlük olayı tarayıcıda taklit edilemiyor). */
    gorunur(gecenMs) {
      if (!K.yazici) return false;
      const dk = +((DA.state().ui || {}).kilitSure);
      const sure = (isFinite(dk) && dk >= 0 ? dk : 5) * 60000;
      if (gecenMs >= sure) { kasa.kilitle(); return true; }
      return false;
    },

    /* Parola da kod da kayıp: veriyi tamamen sil */
    async sifirla() {
      await bekle();
      dek = null; anahtarlar = null; kurtarmaHam = null; mod = 'parola';
      K.zarf = null; K.yazici = null; K.sifrele = null; K.coz = null;
      try { localStorage.removeItem(DA.depoAnahtari); } catch (e) { /* yok say */ }
      if (DA.depoTemizle) await DA.depoTemizle();
      DA._durumAta({});
      DA.save();
    }
  };

  let gizlendi = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') gizlendi = Date.now();
    else if (gizlendi) { kasa.gorunur(Date.now() - gizlendi); gizlendi = 0; }
  });

  /* ---- kilit ekranı ---- */
  DA.views._kilitEkrani = () => {
    const form = mod === 'yeni'
      ? '<p class="small">Kurtarma kodu doğru. Eski parola artık geçmeyecek; yeni bir parola belirle.</p>' +
        '<form data-form="kasaYeni"><label class="fld"><span>Yeni parola</span><input type="password" name="p1" autocomplete="new-password" required></label>' +
        '<label class="fld"><span>Yeni parola (tekrar)</span><input type="password" name="p2" autocomplete="new-password" required></label>' +
        '<button class="btn block" type="submit">Parolayı kaydet ve aç</button></form>'
      : mod === 'kurtar'
        ? '<p class="small">Kilidi kurarken gösterilen 24 karakterlik kurtarma kodunu yaz. Tire ve boşluk önemli değil.</p>' +
          '<form data-form="kasaKurtar"><label class="fld"><span>Kurtarma kodu</span><input type="text" name="k" autocomplete="off" autocapitalize="characters" spellcheck="false" required></label>' +
          '<button class="btn block" type="submit">Kodla aç</button></form>' +
          '<button class="btn ghost block mt-s" data-act="kasaMod" data-m="parola">Parolayla aç</button>'
        : '<form data-form="kasaAc"><label class="fld"><span>Parola</span><input type="password" name="p" autocomplete="current-password" required></label>' +
          '<button class="btn block" type="submit">Kilidi aç</button></form>' +
          '<button class="btn ghost block mt-s" data-act="kasaMod" data-m="kurtar">Parolamı unuttum</button>';
    return {
      title: DA.APP, noRecent: true, noHeader: true,
      html: '<div class="kilit-ekran"><div class="kilit-kart card">' +
        '<img src="icons/icon-192.png" alt="" width="72" height="72" class="kilit-logo">' +
        '<h2>' + esc(DA.APP) + '</h2><p class="muted small">Veriler bu cihazda şifreli duruyor.</p>' +
        form + '<p class="uyari-metin small" id="kasaHata" role="alert" aria-live="assertive"></p>' +
        (mod !== 'yeni' ? '<button class="btn danger sm block mt" data-act="kasaSifirla">Parola ve kod kayıp: verileri sil</button>' : '') +
        '</div></div>'
    };
  };
  const hata = (m) => { const e = DA.$('#kasaHata'); if (e) e.textContent = m; };
  const mesgul = (f, on) => { const b = f && f.querySelector('button[type=submit]'); if (b) { b.disabled = on; b.textContent = on ? 'Açılıyor…' : b.dataset.etiket || b.textContent; } };

  DA.actions.kasaMod = (el) => { mod = el.dataset.m; DA.render(false); };
  DA.forms.kasaAc = async (f) => {
    const p = f.p.value; hata('');
    const b = f.querySelector('button[type=submit]'); b.dataset.etiket = b.textContent; mesgul(f, true);
    try { await kasa.kilitAc(p); DA.render(false); }
    catch (e) {
      mesgul(f, false);
      hata(e.message === 'bozuk' ? 'Parola doğru ama kayıt çözülemedi; kayıt bozulmuş olabilir. Dosya yedeğinden dön.' : 'Parola yanlış.');
      f.p.value = ''; f.p.focus();
    }
  };
  DA.forms.kasaKurtar = async (f) => {
    hata('');
    const b = f.querySelector('button[type=submit]'); b.dataset.etiket = b.textContent; mesgul(f, true);
    try { await kasa.kurtar(f.k.value); DA.render(false); }
    catch (e) { mesgul(f, false); hata('Kurtarma kodu yanlış.'); }
  };
  DA.forms.kasaYeni = async (f) => {
    hata('');
    if (f.p1.value !== f.p2.value) return hata('Parolalar aynı değil.');
    if (f.p1.value.length < 8) return hata('Parola en az 8 karakter olmalı.');
    try { await kasa.yeniParolaKur(f.p1.value); DA.render(false); DA.toast('Yeni parola kaydedildi'); }
    catch (e) { hata(e.message); }
  };
  DA.actions.kasaSifirla = async () => {
    if (!confirm('Parola ve kurtarma kodu olmadan şifreli veri AÇILAMAZ. Bu cihazdaki tüm veriler silinecek ve uygulama boş başlayacak. ' +
      'Dosya yedeğin varsa sonra geri yükleyebilirsin. Devam edilsin mi?')) return;
    await kasa.sifirla(); DA.render(false); DA.toast('Veriler silindi; kilit kaldırıldı');
  };

  /* ---- Ayarlar: güvenlik kartı ---- */
  const SURELER = [[0, 'Hemen'], [1, '1 dk'], [5, '5 dk'], [15, '15 dk']];
  DA.kasaKarti = () => {
    if (!sub()) return '<div class="card"><h2>Uygulama kilidi</h2><p class="small muted">Bu tarayıcı şifrelemeyi desteklemiyor.</p></div>';
    if (!K.zarf) {
      return '<div class="card"><h2>Uygulama kilidi</h2><p class="small">Kapalı. Açınca danışan verileri bu cihazda şifreli durur ' +
        've uygulama parolayla açılır. Parolanı unutursan bir kez gösterilecek kurtarma kodu açar.</p>' +
        '<button class="btn block" data-act="kasaKurForm">' + icon('lock') + ' Kilidi kur</button></div>';
    }
    const dk = +((DA.state().ui || {}).kilitSure), sec = isFinite(dk) && dk >= 0 ? dk : 5;
    return '<div class="card"><h2>Uygulama kilidi</h2><p class="small"><b>Açık.</b> Veriler şifreli; uygulama arka planda ' +
      (sec ? sec + ' dakikadan uzun kalınca' : 'kalınca hemen') + ' kilitlenir.</p>' +
      '<div class="small muted mb">Otomatik kilit</div><div class="seg mb">' + SURELER.map((x) =>
        '<button class="' + (x[0] === sec ? 'on' : '') + '" data-act="kasaSure" data-dk="' + x[0] + '" aria-pressed="' + (x[0] === sec) + '">' + x[1] + '</button>').join('') + '</div>' +
      '<button class="btn block" data-act="kasaKilitle">' + icon('lock') + ' Şimdi kilitle</button>' +
      '<div class="grid2 mt-s"><button class="btn sec block" data-act="kasaParolaForm">Parolayı değiştir</button>' +
      '<button class="btn sec block" data-act="kasaKodForm">Yeni kurtarma kodu</button></div>' +
      '<button class="btn ghost block mt-s" data-act="kasaKaldirForm">Kilidi kaldır</button></div>';
  };
  DA.actions.kasaSure = (el) => { DA.state().ui.kilitSure = +el.dataset.dk; DA.save(); DA.render(true); };
  DA.actions.kasaKilitle = () => kasa.kilitle();

  const parolaAlani = (ad, etiket, yeni) => '<label class="fld"><span>' + etiket + '</span><input type="password" name="' + ad +
    '" autocomplete="' + (yeni ? 'new-password' : 'current-password') + '" required></label>';
  DA.actions.kasaKurForm = () => DA.sheet('Uygulama kilidi',
    '<form data-form="kasaKur"><p class="small">Kurmadan önce bir dosya yedeği al: parolayı da kurtarma kodunu da kaybedersen ' +
    'bu cihazdaki veri açılamaz.</p>' + parolaAlani('p1', 'Parola (en az 8 karakter)', true) + parolaAlani('p2', 'Parola (tekrar)', true) +
    '<p class="uyari-metin small" id="kasaFormHata" role="alert"></p><button class="btn block" type="submit">Kilidi kur</button></form>');
  const formHata = (m) => { const e = DA.$('#kasaFormHata'); if (e) e.textContent = m; };
  DA.forms.kasaKur = async (f) => {
    if (f.p1.value !== f.p2.value) return formHata('Parolalar aynı değil.');
    if (f.p1.value.length < 8) return formHata('Parola en az 8 karakter olmalı.');
    try { const kod = await kasa.kur(f.p1.value); kodGoster(kod, 'Kilit kuruldu'); }
    catch (e) { formHata(e.message); }
  };
  /* Kod bir kez gösterilir; "Bitti" ancak saklandığı onaylanınca açılır */
  function kodGoster(kod, baslik) {
    DA.sheet(baslik, '<p class="small">Kurtarma kodun. Parolanı unutursan veriler yalnız bununla açılır. ' +
      'Parolalar uygulamasına ya da güvenli bir nota kaydet; <b>bir daha gösterilmez.</b></p>' +
      '<div class="kurtarma-kod" id="kurtarmaKod">' + esc(kod) + '</div>' +
      '<button class="btn sec block mt-s" data-act="kasaKodKopyala">Kopyala</button>' +
      '<label class="row gap small mt"><input type="checkbox" id="kodOnay" data-change="kasaKodOnay"> Kodu güvenli bir yere kaydettim</label>' +
      '<button class="btn block mt" id="kodBitti" data-act="kasaKodBitti" disabled>Bitti</button>');
  }
  DA.actions.kasaKodKopyala = () => {
    const t = (DA.$('#kurtarmaKod') || {}).textContent || '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(() => DA.toast('Kopyalandı'), () => DA.toast('Kopyalanamadı; kodu elle seç'));
    } else DA.toast('Kopyalanamadı; kodu elle seç');
  };
  DA.live.kasaKodOnay = (el) => { const b = DA.$('#kodBitti'); if (b) b.disabled = !el.checked; };
  DA.actions.kasaKodBitti = () => { DA.closeSheet(); DA.render(true); };

  DA.actions.kasaParolaForm = () => DA.sheet('Parolayı değiştir', '<form data-form="kasaParola">' +
    parolaAlani('eski', 'Şu anki parola') + parolaAlani('p1', 'Yeni parola', true) + parolaAlani('p2', 'Yeni parola (tekrar)', true) +
    '<p class="uyari-metin small" id="kasaFormHata" role="alert"></p><button class="btn block" type="submit">Değiştir</button></form>');
  DA.forms.kasaParola = async (f) => {
    if (f.p1.value !== f.p2.value) return formHata('Yeni parolalar aynı değil.');
    try { await kasa.parolaDegistir(f.eski.value, f.p1.value); DA.closeSheet(); DA.toast('Parola değişti'); }
    catch (e) { formHata(e.message === 'yanlis' ? 'Şu anki parola yanlış.' : e.message); }
  };
  DA.actions.kasaKodForm = () => DA.sheet('Yeni kurtarma kodu', '<form data-form="kasaKod"><p class="small">Eski kod geçersiz olur.</p>' +
    parolaAlani('p', 'Parola') + '<p class="uyari-metin small" id="kasaFormHata" role="alert"></p><button class="btn block" type="submit">Kod üret</button></form>');
  DA.forms.kasaKod = async (f) => {
    try { kodGoster(await kasa.yeniKod(f.p.value), 'Yeni kurtarma kodu'); }
    catch (e) { formHata(e.message === 'yanlis' ? 'Parola yanlış.' : e.message); }
  };
  DA.actions.kasaKaldirForm = () => DA.sheet('Kilidi kaldır', '<form data-form="kasaKaldir"><p class="small">Veriler bu cihazda yeniden ' +
    'şifresiz durur.</p>' + parolaAlani('p', 'Parola') + '<p class="uyari-metin small" id="kasaFormHata" role="alert"></p>' +
    '<button class="btn danger block" type="submit">Kilidi kaldır</button></form>');
  DA.forms.kasaKaldir = async (f) => {
    try { await kasa.kaldir(f.p.value); DA.closeSheet(); DA.render(true); DA.toast('Kilit kaldırıldı'); }
    catch (e) { formHata(e.message === 'yanlis' ? 'Parola yanlış.' : e.message); }
  };
})();
