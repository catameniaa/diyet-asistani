/* Menü yazım kuralları — Dyt. Can Bayramoğlu'nun diyet listesi kuralları
   (Kasım 2026). Menü planlayıcıda öğünler doldukça kurala uymayan yerler
   gösterilir; hiçbir şey kendiliğinden değiştirilmez.

     · Ara öğün ana öğün gibi olmaz: ekmek yerine galeta.
     · Ara öğünde karbonhidrat (meyve, galeta…) protein ya da yağlı tohumla
       eşlenir — özellikle diyabette.
     · Gece peynir ya da peynir-ekmek yazılmaz: süt, kefir ya da tarçınlı
       yoğurt; istenirse yanında meyve ya da galeta.
     · Bulgur pilavının yanına ekmek yazılmaz; biri artırılır.
     · Meyve çoğunlukla ara öğünde, ana öğünde ara sıra.
     · Yazım sırası: çorba ve sıvılar öğünün başına, ekmek sonuna.

   Bunlar klinik eşik değil, yazım kuralıdır: uyarı olarak çıkar, karar
   diyetisyenindir (ör. potasyum kısıtlamasında meyve-sebze dağılımı başka
   olur). Besin türü adından ve kategorisinden anlaşılır; iki veritabanının
   (temel liste ve TÜBER Ek 2.3.1) kategori adları farklı olduğu için ikisi
   de sayılır. Kendi eklenen besinlerin kategorisi olmadığından onlarda
   yalnız ad bakılır. */
(function () {
  'use strict';
  const { esc } = DA;

  const ARA = ['Kuşluk', 'İkindi', 'Gece ara öğünü'];
  const ANA = ['Kahvaltı', 'Öğle', 'Akşam'];
  const GECE = 'Gece ara öğünü';
  /* foods.js'teki öğün sırası; ondan önce yüklenirsek diye yedek */
  const ogunler = () => (DA.foods && DA.foods.ogunler) || ['Kahvaltı', 'Kuşluk', 'Öğle', 'İkindi', 'Akşam', 'Gece ara öğünü'];

  const KAT = {
    sut: ['Süt & Ürünleri', 'Süt-Yoğurt-Peynir'],
    tahil: ['Tahıl & Ekmek', 'Ekmek ve tahıllar'],
    meyve: ['Meyve', 'Meyveler'],
    esli: ['Süt & Ürünleri', 'Süt-Yoğurt-Peynir', 'Kuruyemiş & Tohum', 'Et, Balık & Tavuk', 'Yumurta & Baklagil',
      'Et, tavuk, balık, yumurta, kuru baklagil, yağlı tohum'],
    icecek: ['İçecek'],
    tatli: ['Yağ, Şeker & Tatlı']
  };
  const icinde = (liste, k) => liste.indexOf(k) >= 0;

  /* \b Türkçe harflerde işe yaramıyor (JS'de "ü" kelime harfi sayılmaz:
     /\bsüt\b/ "sütlaç"ı da yakalıyordu). Sınırlar elle yazıldı; "sütü"
     TÜBER adı ("İnek sütü, tam yağlı") için. */
  const SUT_AD = /(^|[\s(,/])sütü?($|[\s(),/])/;
  const ESLI_AD = /yoğurt|kefir|ayran|peynir|yumurta|badem|ceviz|fındık|fıstık|tahin|(^|\s)lor($|[\s(,])/;

  /* Bir besinin kural açısından türü */
  function tur(f) {
    const ad = DA.trLower(f && f.n), kat = (f && f.cat) || '';
    const galeta = /galeta|grissini/.test(ad);
    const ekmek = galeta || /ekmek|ekmeği|simit|lavaş|bazlama/.test(ad);
    const meyve = icinde(KAT.meyve, kat);
    const sivi = /çorba/.test(ad) || icinde(KAT.icecek, kat) || SUT_AD.test(ad) ||
      /ayran|kefir|boza|suyu/.test(ad) || /^su($|\s)/.test(ad);
    return {
      sivi, ekmek, galeta, meyve,
      bulgur: /bulgur/.test(ad),
      peynir: /peynir(?!li)/.test(ad),
      kh: meyve || ekmek || icinde(KAT.tahil, kat) || /bisküvi|kraker|gevre/.test(ad) ||
        (icinde(KAT.tatli, kat) && f.c >= 15),
      esli: icinde(KAT.esli, kat) || SUT_AD.test(ad) || ESLI_AD.test(ad)
    };
  }
  /* Yazım sırası: sıvı 0, öteki 1, ekmek 2 */
  const sira = (t) => (t.sivi ? 0 : t.ekmek ? 2 : 1);

  const besin = (it) => (DA.foods && DA.foods.get(it.id)) || { n: it.n || '' };
  const turler = (liste) => (liste || []).map((it) => tur(besin(it)));
  const herhangi = (ts, k) => ts.some((t) => t[k]);

  /* Menüyü kurallara göre tarar. Dönen her kayıt: k = kural, d = 'uyari' |
     'bilgi', t = metin, ogun = öğün (birden çok öğünü kapsayanlarda dizi). */
  function denetle(m) {
    const out = [], M = m.meals || {};
    const T = {};
    ogunler().forEach((o) => { T[o] = turler(M[o]); });

    ARA.forEach((o) => {
      const ts = T[o] || [];
      if (!ts.length) return;
      if (ts.some((t) => t.ekmek && !t.galeta)) {
        out.push({ k: 'araEkmek', d: 'uyari', ogun: o,
          t: o + ': ara öğün ana öğün gibi olmasın — ekmek yerine galeta (ör. 2 galeta + 1 su bardağı kefir).' });
      }
      if (herhangi(ts, 'kh') && !herhangi(ts, 'esli')) {
        out.push({ k: 'araEs', d: 'uyari', ogun: o,
          t: o + ': karbonhidrat tek başına — yanına protein ya da yağlı tohum ekle (ör. meyve + yoğurt, meyve + badem). Diyabette özellikle.' });
      }
    });

    if (herhangi(T[GECE] || [], 'peynir')) {
      out.push({ k: 'gecePeynir', d: 'uyari', ogun: GECE,
        t: 'Gece ara öğünü: peynir ya da peynir-ekmek yazılmaz — süt, kefir ya da tarçınlı yoğurt; istersen yanında meyve ya da galeta.' });
    }

    ogunler().forEach((o) => {
      const ts = T[o] || [];
      if (herhangi(ts, 'bulgur') && herhangi(ts, 'ekmek')) {
        out.push({ k: 'bulgurEkmek', d: 'uyari', ogun: o,
          t: o + ': bulgur pilavının yanına ekmek yazılmaz — ekmeği çıkar, pilavı ya da ekmeği artır.' });
      }
    });

    const anaMeyve = ANA.filter((o) => herhangi(T[o] || [], 'meyve'));
    if (anaMeyve.length && !ARA.some((o) => herhangi(T[o] || [], 'meyve'))) {
      out.push({ k: 'meyveAna', d: 'bilgi', ogun: anaMeyve,
        t: 'Meyve yalnız ana öğünde (' + anaMeyve.join(', ') + '); genelde ara öğünde yazılır.' });
    }

    const bozuk = ogunler().filter((o) => {
      const r = (T[o] || []).map(sira);
      return r.some((x, i) => i > 0 && x < r[i - 1]);
    });
    if (bozuk.length) {
      out.push({ k: 'sira', d: 'bilgi', ogun: bozuk,
        t: bozuk.join(', ') + ': yazım sırası — çorba ve sıvılar başa, ekmek sona.' });
    }
    return out;
  }

  /* Her öğünü yazım sırasına dizer. Kararlı sıralama: aynı türden besinler
     girildiği sırada kalır (iki sıvıdan önce yazılan yine önde). */
  function diz(m) {
    let degisti = false;
    ogunler().forEach((o) => {
      const l = (m.meals || {})[o];
      if (!l || l.length < 2) return;
      const s = l.map((it, i) => ({ it, i, r: sira(tur(besin(it))) }))
        .sort((a, b) => a.r - b.r || a.i - b.i);
      if (s.some((x, i) => x.i !== i)) { degisti = true; m.meals[o] = s.map((x) => x.it); }
    });
    return degisti;
  }

  function kartHtml(m) {
    const dolu = ogunler().some((o) => ((m.meals || {})[o] || []).length);
    if (!dolu) return '';
    const s = denetle(m);
    if (!s.length) {
      return '<div class="note ok" id="menuKural"><b>Menü yazım kurallarına uygun.</b> ' +
        'Ara öğünler, gece öğünü ve yazım sırası kontrol edildi.</div>';
    }
    const liste = (x) => '<li data-kural="' + x.k + '">' + esc(x.t) + '</li>';
    const uy = s.filter((x) => x.d === 'uyari'), bi = s.filter((x) => x.d === 'bilgi');
    return '<div class="card" id="menuKural"><div class="sect" style="margin-top:0">Menü yazım kuralları</div>' +
      (uy.length ? '<div class="note warn"><ul class="tight" style="margin:0">' + uy.map(liste).join('') + '</ul></div>' : '') +
      (bi.length ? '<div class="note"><ul class="tight" style="margin:0">' + bi.map(liste).join('') + '</ul></div>' : '') +
      (s.some((x) => x.k === 'sira') ? '<button class="btn sec sm block" data-act="menuDiz" data-m="' + esc(m.id) + '">Yazım sırasına diz</button>' : '') +
      '</div>';
  }

  /* Geri alınabilir: eski öğün sırası saklanır. */
  DA.actions.menuDiz = (el) => {
    const m = DA.state().menus.find((x) => x.id === el.dataset.m);
    if (!m) return;
    const eski = JSON.parse(JSON.stringify(m.meals));
    if (!diz(m)) return DA.toast('Öğünler zaten yazım sırasında');
    DA.save(); DA.render(true);
    DA.silGeriAl('Öğünler yazım sırasına dizildi', () => { m.meals = eski; });
  };

  DA.menuKural = { tur, denetle, diz, kartHtml };
})();
