/* TürKomp — cihaza içe aktarılan Türk besin veri bankası

   Neden içe aktarma: TürKomp (Ulusal Gıda Kompozisyon Veri Tabanı, Tarım ve
   Orman Bakanlığı / TÜBİTAK MAM) açık lisanslı değil; veri seti firmalara
   satılıyor. Depo ve site herkese açık olduğu için verinin uygulamayla
   gelmesi, TürKomp'un tamamını herkesin indirebileceği bir dosya yapardı.
   Bu yüzden veri depoya girmez: diyetisyen kendi elindeki dosyayı bir kez
   seçer, dönüştürülmüş hâli yalnız bu cihazda IndexedDB'de durur
   ('dyt-veri' / 'banka' / 'turkomp'). Danışan kaydından ayrı tutulur: her
   kayıtta 1 MB'lık başvuru verisini yeniden yazmak ve yedeğe katmak
   gereksizdi. Yedeğe girmez; cihaz değişince dosya yeniden yüklenir.

   Beklenen dosya (Turkomp_clean.json):
     { meta: { source, notes },
       nutrients: { anahtar: { name, unit } },
       foods: [ { id, name, url, values: { anahtar: sayı }, ranges: { anahtar: [min, maks] } } ] }
   Değerler 100 g yenilebilir kısım içindir. Dosyada olmayan öge
   ölçülmemiştir, SIFIR DEĞİLDİR (dosyanın kendi notu da böyle).

   Dosya dışarıdan gelir: her alan denetlenir, tek bir bozuk değer bütün
   dosyayı reddeder. Yarım içe aktarılmış bir veri bankası yanlış toplam
   üretirdi; "hepsi ya da hiçbiri" daha güvenli. */
(function () {
  'use strict';
  const { esc, fmt } = DA;
  const VT = 'dyt-veri', DEPO = 'banka', ANAHTAR = 'turkomp';
  const AZAMI_BOYUT = 20 * 1024 * 1024;

  /* Öge grupları ve gruptaki sıra. Dosyadaki sıra kapsama göre (en çok
     ölçülen önce) dizili; ekranda besin ögesi türüne göre okunmalı.
     Tanınmayan öge "diğer"e düşer, atılmaz. */
  const GRUP = [
    ['makro', 'Enerji ve makro besin ögeleri', ['enerji_kcal', 'enerji_kj', 'su', 'protein', 'azot', 'yag_toplam',
      'karbonhidrat', 'lif_toplam_diyet', 'kul', 'alkol']],
    ['kh', 'Karbonhidratlar ve posa', ['sakaroz', 'glukoz', 'fruktoz', 'laktoz', 'maltoz', 'nisasta',
      'lif_suda_cozunur', 'lif_suda_cozunmeyen']],
    ['ya', 'Yağ asitleri ve kolesterol', ['yag_asitleri_toplam_doymus', 'yag_asitleri_toplam_tekli_doymamis',
      'yag_asitleri_toplam_coklu_doymamis', /^yag_asidi_/, 'kolesterol']],
    ['vit', 'Vitaminler', ['a_vitamini', 'retinol', 'beta_karoten', 'lutein', 'likopen', 'd_3_vitamini_kolekalsiferol',
      'd_vitamini_iu', 'e_vitamini', 'alfa_tokoferol', 'e_vitamini_iu', 'k_1_vitamini', 'k_2_vitamini', 'tiamin',
      'riboflavin', 'niasin', 'niasin_esdegerleri_toplam', 'b_6_vitamini_toplam', 'folat_gida', 'folik_asit_sentetik',
      'b_12_vitamini', 'c_vitamini', 'l_askorbik_asit']],
    ['min', 'Mineraller', ['sodyum_na', 'tuz', 'potasyum_k', 'kalsiyum_ca', 'magnezyum_mg', 'fosfor_p', 'demir_fe',
      'cinko_zn', 'selenyum_se', 'iyot_i']],
    ['aa', 'Amino asitler', ['izolosin', 'losin', 'lizin', 'metiyonin', 'sistin', 'fenilalanin', 'tirozin', 'treonin',
      'triptofan', 'valin', 'histidin', 'arjinin', 'alanin', 'aspartik_asit', 'glutamik_asit', 'glisin', 'prolin', 'serin']],
    ['diger', 'Şeker alkolleri, tatlandırıcılar ve diğer', ['sorbitol', 'd_mannitol', 'ksilitol', 'aspartam',
      'asesulfam_k', 'sodyum_sakkarin']]
  ];
  /* Ana ögeler: özet kutuları, enerji dağılımı ve 100 kcal başına sıralama */
  const ANA = { kcal: 'enerji_kcal', prot: 'protein', yag: 'yag_toplam', kh: 'karbonhidrat' };
  /* Ana bileşenlerin toplamı 100 g'dan bu kadar saparsa ayrıntıda uyarılır */
  const TOPLAM_SAPMA = 5;
  const TOPLAM_OGE = ['su', 'kul', 'protein', 'yag_toplam', 'karbonhidrat', 'lif_toplam_diyet', 'alkol'];

  const nesne = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const sayiMi = (x) => typeof x === 'number' && isFinite(x);

  /* Yağ asitleri karbon ve çift bağ sayısına göre: 4:0, 6:0 … 22:6 */
  function yaSirasi(k) {
    const m = /^yag_asidi_(\d+)_(\d+)/.exec(k);
    return m ? +m[1] * 100 + +m[2] : 99999;
  }

  /* Ham dosya → motorun beklediği biçim. Hata varsa { hata } döner. */
  function donustur(J) {
    const red = (m) => ({ hata: m });
    if (!nesne(J) || !nesne(J.nutrients) || !Array.isArray(J.foods)) {
      return red('Dosya TürKomp biçiminde değil: "nutrients" ve "foods" bulunamadı.');
    }
    if (!(nesne(J.meta) && /t[üu]rkomp/i.test(String(J.meta.source || '')))) {
      return red('Dosyanın kaynağı TürKomp olarak görünmüyor (meta.source).');
    }
    if (!J.foods.length || J.foods.length > 20000) return red('Besin sayısı geçersiz: ' + J.foods.length);
    const tanim = {};
    for (const k of Object.keys(J.nutrients)) {
      const n = J.nutrients[k];
      if (!/^[a-z0-9_]{1,80}$/.test(k) || !nesne(n) || typeof n.name !== 'string' || !n.name.trim() ||
        n.name.length > 120 || typeof n.unit !== 'string' || n.unit.length > 20) {
        return red('Geçersiz besin ögesi tanımı: ' + k);
      }
      tanim[k] = { ad: n.name.trim(), birim: n.unit.trim() };
    }
    /* öge sırası: grup listesindeki sıra, tanınmayan sonda */
    const oge = [], yer = {};
    GRUP.forEach((g) => {
      const ic = [];
      g[2].forEach((x) => {
        if (x instanceof RegExp) Object.keys(tanim).filter((k) => x.test(k) && !yer[k]).sort((a, b) => yaSirasi(a) - yaSirasi(b))
          .forEach((k) => { if (!yer[k]) { yer[k] = 1; ic.push(k); } });
        else if (tanim[x] && !yer[x]) { yer[x] = 1; ic.push(x); }
      });
      ic.forEach((k) => oge.push([k, '', tanim[k].ad, tanim[k].birim, g[0]]));
    });
    Object.keys(tanim).forEach((k) => { if (!yer[k]) oge.push([k, '', tanim[k].ad, tanim[k].birim, 'diger']); });
    const sutun = {};
    oge.forEach((o, j) => { sutun[o[0]] = j + 2; });

    const b = [], ar = {}, gorulen = {};
    for (const f of J.foods) {
      if (!nesne(f)) return red('Geçersiz besin kaydı.');
      const id = String(f.id);
      if (!/^\d{1,9}$/.test(id)) return red('Geçersiz besin kimliği: ' + id.slice(0, 20));
      if (gorulen[id]) return red('Aynı kimlik iki kez: ' + id);
      gorulen[id] = 1;
      if (typeof f.name !== 'string' || !f.name.trim() || f.name.length > 200) return red('Geçersiz besin adı (kimlik ' + id + ').');
      if (!nesne(f.values)) return red('Değerler eksik: ' + f.name);
      const r = new Array(oge.length + 2);
      r[0] = id; r[1] = f.name.replace(/\s+/g, ' ').trim();
      for (const k of Object.keys(f.values)) {
        if (!sutun[k]) return red('Tanımsız öge "' + k + '": ' + f.name);
        const v = f.values[k];
        if (!sayiMi(v) || v < 0) return red('Geçersiz değer (' + k + '): ' + f.name);
        r[sutun[k]] = v;
      }
      if (f.ranges != null) {
        if (!nesne(f.ranges)) return red('Geçersiz aralık: ' + f.name);
        for (const k of Object.keys(f.ranges)) {
          const a = f.ranges[k];
          if (!sutun[k] || !Array.isArray(a) || a.length !== 2 || !sayiMi(a[0]) || !sayiMi(a[1]) || a[0] > a[1]) {
            return red('Geçersiz aralık (' + k + '): ' + f.name);
          }
          (ar[id] = ar[id] || {})[k] = [a[0], a[1]];
        }
      }
      b.push(r);
    }
    return {
      veri: {
        kaynak: 'TürKomp – Ulusal Gıda Kompozisyon Veri Tabanı (turkomp.tarimorman.gov.tr)',
        oge, ogeGrup: GRUP.map((g) => [g[0], g[1]]), grup: null, b, ar
      }
    };
  }

  /* ---- IndexedDB ---- */
  function vtAc() {
    return new Promise((ok, hata) => {
      const r = indexedDB.open(VT, 1);
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(DEPO)) r.result.createObjectStore(DEPO); };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => hata(r.error);
    });
  }
  function islem(tur, fn) {
    return vtAc().then((db) => new Promise((ok, hata) => {
      const t = db.transaction(DEPO, tur), s = t.objectStore(DEPO);
      let sonuc;
      const r = fn(s);
      if (r) r.onsuccess = () => { sonuc = r.result; };
      t.oncomplete = () => { db.close(); ok(sonuc); };
      t.onerror = t.onabort = () => { db.close(); hata(t.error); };
    }));
  }

  let _denendi = false;
  /* Cihazdaki kaydı belleğe alır; yoksa false */
  function yukle() {
    if (DA.data.turkomp) return Promise.resolve(true);
    return islem('readonly', (s) => s.get(ANAHTAR)).then((k) => {
      _denendi = true;
      if (k && k.veri && Array.isArray(k.veri.b)) {
        DA.data.turkomp = k.veri;
        DA.data.turkompBilgi = { d: k.d, dosya: k.dosya };
        return true;
      }
      return false;
    }, () => { _denendi = true; return false; });
  }

  /* Metin → denetle → kaydet → belleğe al. { hata } ya da { besin, oge } döner. */
  function icerAktar(metin, dosyaAdi) {
    let J;
    try { J = JSON.parse(metin); } catch (e) { return Promise.resolve({ hata: 'Dosya okunamadı: geçerli bir JSON değil.' }); }
    const d = donustur(J);
    if (d.hata) return Promise.resolve(d);
    const kayit = { surum: 1, d: DA.today(), dosya: String(dosyaAdi || '').slice(0, 120), veri: d.veri };
    return islem('readwrite', (s) => s.put(kayit, ANAHTAR)).then(() => {
      DA.data.turkomp = d.veri;
      DA.data.turkompBilgi = { d: kayit.d, dosya: kayit.dosya };
      _denendi = true;
      return { besin: d.veri.b.length, oge: d.veri.oge.length };
    }, (e) => ({ hata: 'Cihaza kaydedilemedi: ' + ((e && e.message) || 'bilinmeyen hata') }));
  }
  function sil() {
    return islem('readwrite', (s) => s.delete(ANAHTAR)).then(() => {
      delete DA.data.turkomp; delete DA.data.turkompBilgi;
      _denendi = true;
    });
  }

  DA.live.turkompDosya = (el) => {
    const f = el.files && el.files[0];
    el.value = '';
    if (!f) return;
    if (f.size > AZAMI_BOYUT) { DA.toast('Dosya çok büyük (' + fmt(f.size / 1048576, 1) + ' MB)'); return; }
    f.text().then((m) => icerAktar(m, f.name)).then((s) => {
      if (s.hata) { DA.sheet('TürKomp içe aktarılamadı', '<div class="note bad">' + esc(s.hata) + '</div>' +
        '<p class="muted small">Cihazdaki önceki veri değişmedi.</p>'); return; }
      DA.toast(fmt(s.besin, 0) + ' besin, ' + s.oge + ' öge yüklendi');
      if (location.hash.indexOf('#/turkomp') === 0) DA.render(false); else DA.go('turkomp');
    });
  };
  DA.actions.turkompSil = () => {
    if (!confirm('TürKomp verisi bu cihazdan silinecek. Dosya elindeyse yeniden yükleyebilirsin. Devam edilsin mi?')) return;
    sil().then(() => { DA.toast('TürKomp verisi silindi'); DA.render(false); });
  };

  const dosyaDugmesi = (etiket, sinif) => '<label class="btn ' + sinif + ' block" style="cursor:pointer">' + DA.icon('save') + ' ' +
    etiket + '<input type="file" accept="application/json,.json" data-change="turkompDosya" hidden></label>';

  /* ---- kaynak tanımı (js/bls.js motoru) ---- */
  const T = {
    id: 'turkomp', ad: 'TürKomp', rota: 'turkomp', listeBaslik: 'TürKomp', detayBaslik: 'TürKomp besini',
    veri: () => DA.data.turkomp,
    ana: ANA,
    samanlik: (r) => DA.vb.katla(r[1]) + ' ' + r[0],
    ara: (Td, q) => DA.vb.araDuz(Td, q),
    yerTutucu: 'Besin ara: sucuk, tarhana, beyaz peynir…',
    bosAciklama: 'Adın bir kelimesinin başını yaz (ör. "kaş" → kaşar). Türkçe harfsiz yazım da olur (sut = süt).',
    aciklama: (B) => fmt(B.b.length, 0) + ' besin · ' + B.oge.length + ' besin ögesi · 100 g yenilebilir kısım. ' +
      'Ögelerin çoğu her besinde ölçülmemiş; ölçülmeyen "veri yok" görünür.',
    altBilgi: () => {
      const bi = DA.data.turkompBilgi || {};
      return '<p class="muted tiny center">Kaynak: TürKomp – Ulusal Gıda Kompozisyon Veri Tabanı (turkomp.tarimorman.gov.tr). ' +
        (bi.dosya ? 'Dosya: ' + esc(bi.dosya) + ' · ' : '') + (bi.d ? 'yüklendi: ' + esc(DA.fdate(bi.d)) + '. ' : '') +
        'Veri yalnız bu cihazda; yedeğe girmez.</p>' +
        '<div class="grid2">' + dosyaDugmesi('Dosyayı değiştir', 'ghost') +
        '<button class="btn ghost block" data-act="turkompSil">' + DA.icon('trash') + ' Cihazdan sil</button></div>';
    },
    satirAlt: (r) => 'TürKomp · ' + esc(r[0]),
    detayAlt: (r) => 'TürKomp kimliği ' + esc(r[0]),
    aralik: (r, k) => { const a = DA.data.turkomp.ar[r[0]]; return a && a[k] ? a[k] : null; },
    notlar(r) {
      const v = (k) => DA.vb.deger(r, k, T);
      let h = '';
      /* Protein ya da yağı ölçülmemiş besin de alındı (Can'ın kararı, 21 Kasım
         2026: "tüm besinlerin tüm değerleri"). Menüye eklenirse toplam eksik
         kalacağı için açıkça söylenir. */
      const eksik = [];
      if (v('protein') === undefined) eksik.push('protein');
      if (v('yag_toplam') === undefined) eksik.push('yağ');
      if (eksik.length) {
        h += '<div class="note warn" id="tkEksik">Bu besinde ' + eksik.join(' ve ') + ' ölçülmemiş. ' +
          'Menü ya da geriçağırma toplamında bu ögeler eksik kalır.</div>';
      }
      /* Kaynak notu "turkompToplam": ana bileşenler 100 g'ı tutmuyorsa kaynakta
         bir değer hatalı ya da bir bileşen eksik olabilir. Değer değiştirilmez. */
      const t = TOPLAM_OGE.reduce((s, k) => s + (typeof v(k) === 'number' ? v(k) : 0), 0);
      if (typeof v('su') === 'number' && Math.abs(t - 100) > TOPLAM_SAPMA) {
        h += '<div class="note warn" id="tkToplam">Su, kül, protein, yağ, karbonhidrat, posa ve alkol toplamı 100 g’da <b>' +
          fmt(t, 1) + ' g</b>. Kaynakta bir değer hatalı ya da bir bileşen verilmemiş olabilir (doğrulanmalı); değerler ' +
          'olduğu gibi gösteriliyor.' + (DA.kaynakRozet ? DA.kaynakRozet('turkomp') : '') + '</div>';
      }
      return h;
    },
    bilgi: () => '<p>Değerler 100 g yenilebilir kısım içindir. Değerin yanındaki aralık kaynaktaki en düşük ve en yüksek ' +
      'ölçümdür (aralık yoksa tek değer verilmiş). <b>Veri yok</b>: o besinde ölçülmemiş; sıfır anlamına gelmez.</p>' +
      '<p>Birimler kaynaktaki gibidir: tuz <b>mg</b>, A vitamini RE, niasin eşdeğeri NE, E vitamini α-TE.</p>' +
      '<p class="muted" style="margin-bottom:0">Kaynak: TürKomp – Ulusal Gıda Kompozisyon Veri Tabanı ' +
      '(turkomp.tarimorman.gov.tr). Veri uygulamayla dağıtılmaz; bu cihaza senin dosyandan yüklendi.</p>'
  };
  DA.vb.kaynakEkle(T);

  DA.views.turkomp = (parts, q) => {
    DA.vb.aktif('turkomp');
    if (DA.data.turkomp) return DA.vb.gorunum('turkomp', parts, q);
    if (!_denendi) {
      return {
        title: 'TürKomp', tab: 'besin', back: 'besin', noRecent: true,
        html: DA.iskelet('liste', 'TürKomp verisi hazırlanıyor', 8),
        mount() { yukle().then(() => DA.render(true)); }
      };
    }
    return {
      title: 'TürKomp', tab: 'besin', back: 'besin', noRecent: true,
      html: DA.vb.kaynakSecici() + DA.emptyState('apple', {
        baslik: 'TürKomp bu cihaza henüz yüklenmedi',
        aciklama: 'TürKomp verisi telif nedeniyle uygulamayla gelmiyor. Elindeki TürKomp dosyasını (Turkomp_clean.json) ' +
          'bir kez seç; veri yalnız bu cihazda saklanır, yedeğe girmez. Telefon değişince dosyayı yeniden yüklersin.'
      }) + dosyaDugmesi('TürKomp dosyasını seç', '')
    };
  };

  /* Testler ve sonraki adım (menü analizi) için */
  DA.turkomp = { donustur, icerAktar, yukle, sil, ANA };
})();
