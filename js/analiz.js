/* Menü besin analizi — BeBiS benzeri ayrıntılı değerlendirme (#/analiz/<menü>)

   Neden: menü ekranı enerji ve makroyu, mikro besinde de yalnız TÜBER
   porsiyon tablosundaki 13 ögeyi gösteriyordu. BLS ve TürKomp menüye
   girebildiği için menünün tamamı ortak bir öge listesinde toplanır ve
   TÜBER 2022 referans değerleriyle karşılaştırılır. Geriçağırma da menü
   olarak tutulduğu için aynı ekran geriçağırma analizidir.

   Ortak öge listesi BLS'nin 68 ögesi + selenyum (BLS'de yok, TürKomp'ta ve
   TÜBER'de var). Her besin kendi kaynağından bu listeye eşlenir:
     BLS       anahtarlar aynı
     TürKomp   yalnız tanımı aynı olan ögeler (TK tablosu); türetilenler
               aşağıda gerekçesiyle
     uygulama  makrolar + TÜBER Ek 2.3.1 porsiyon panelinden tanımı açık olanlar

   Eksik değer SIFIR DEĞİLDİR: bir ögesi ölçülmemiş besin toplama girmez ve
   o öge "en az" diye işaretlenir; kaç besinde veri olmadığı yazılır. */
(function () {
  'use strict';
  const { esc, fmt } = DA;

  /* ---- TürKomp → ortak öge ----
     Eşlenmeyenler bilerek dışarıda: "sistin" (TürKomp) BLS'deki sistein değil;
     toplam şeker TürKomp'ta galaktozsuz; omega-3/6 toplamı TürKomp'ta yok. */
  const TK = {
    kcal: 'enerji_kcal', su: 'su', prot: 'protein', yag: 'yag_toplam', kh: 'karbonhidrat', lif: 'lif_toplam_diyet', alk: 'alkol',
    sakaroz: 'sakaroz', glukoz: 'glukoz', fruktoz: 'fruktoz', laktoz: 'laktoz', nisasta: 'nisasta',
    lifCoz: 'lif_suda_cozunur', lifCozmez: 'lif_suda_cozunmeyen',
    doymus: 'yag_asitleri_toplam_doymus', tekli: 'yag_asitleri_toplam_tekli_doymamis', coklu: 'yag_asitleri_toplam_coklu_doymamis',
    la: 'yag_asidi_18_2_n_6_cis_cis', ala: 'yag_asidi_18_3_n_3_all_cis', epa: 'yag_asidi_20_5_n_3_all_cis',
    dha: 'yag_asidi_22_6_n_3_all_cis', kol: 'kolesterol',
    vitA: 'a_vitamini', retinol: 'retinol', bkaroten: 'beta_karoten', vitE: 'alfa_tokoferol',
    b1: 'tiamin', b2: 'riboflavin', niasinEs: 'niasin_esdegerleri_toplam', b6: 'b_6_vitamini_toplam', b12: 'b_12_vitamini',
    vitC: 'c_vitamini', folik: 'folik_asit_sentetik',
    na: 'sodyum_na', k: 'potasyum_k', ca: 'kalsiyum_ca', mg: 'magnezyum_mg', p: 'fosfor_p', fe: 'demir_fe', zn: 'cinko_zn',
    iyot: 'iyot_i', se: 'selenyum_se',
    ile: 'izolosin', leu: 'losin', lys: 'lizin', met: 'metiyonin', phe: 'fenilalanin', tyr: 'tirozin', thr: 'treonin',
    trp: 'triptofan', val: 'valin', his: 'histidin'
  };
  /* TürKomp'ta türetilenler:
     D vitamini: TürKomp yalnız D3 (kolekalsiferol) veriyor; BLS D2 + D3. D2
       hemen yalnız mantarda var, bu yüzden D3 alınır.
     K vitamini: BLS K1 + K2; TürKomp ikisini ayrı veriyor, ikisi de ölçülmüşse toplanır.
     Folat eşdeğeri (DFE) = gıda folatı + 1,7 × sentetik folik asit (BLS formülü).
       Folik asit zenginleştirilmemiş besinde yoktur; ölçülmemişse 0 sayılır. */
  function tkTuret(v) {
    const o = {};
    if (typeof v('d_3_vitamini_kolekalsiferol') === 'number') o.vitD = v('d_3_vitamini_kolekalsiferol');
    if (typeof v('k_1_vitamini') === 'number' && typeof v('k_2_vitamini') === 'number') o.vitK = v('k_1_vitamini') + v('k_2_vitamini');
    if (typeof v('folat_gida') === 'number') o.folat = v('folat_gida') + 1.7 * (v('folik_asit_sentetik') || 0);
    return o;
  }
  /* Uygulama besinlerinin TÜBER Ek 2.3.1 porsiyon paneli (js/foods.js MIKRO).
     A vitamini (RE mi RAE mi) ve "Folik asit" (gıda folatı mı DFE mi) kaynakta
     tanımlanmadığı için eşlenmedi — doğrulanmalı. */
  const TUBER_PANEL = {
    'Kolesterol': 'kol', 'Kalsiyum': 'ca', 'Demir': 'fe', 'Çinko': 'zn', 'Potasyum': 'k', 'C vitamini': 'vitC',
    'B1 vitamini': 'b1', 'B2 vitamini': 'b2', 'Niasin eşd.': 'niasinEs', 'B6 vitamini': 'b6', 'B12 vitamini': 'b12'
  };

  /* ---- TÜBER 2022 Ek 1.5 referansları ----
     Sütun adına göre eşlenir (sıraya değil): tablo yeniden çıkarılırsa
     sütun kayması sessizce yanlış hedef vermesin. */
  const ONERI = {
    ek151: { 'A vitamini': 'vitA', 'B6 vitamini': 'b6', 'B12 vitamini': 'b12', 'C vitamini': 'vitC', 'D vitamini': 'vitD',
      'E vitamini': 'vitE', 'K vitamini': 'vitK', 'Folat': 'folat', 'Niasin': 'niasinEs', 'Tiamin': 'b1', 'Riboflavin': 'b2',
      'Biotin': 'biotin', 'Pantotenik asit': 'b5' },
    ek152: { 'Kalsiyum': 'ca', 'Demir': 'fe', 'Bakır': 'cu', 'Magnezyum': 'mg', 'Fosfor': 'p', 'Sodyum': 'na', 'Potasyum': 'k',
      'Selenyum': 'se', 'Çinko': 'zn', 'İyot': 'iyot', 'Flor': 'flor', 'Manganez': 'mn', 'Molibden': 'mo' }
  };
  /* UL toplam alım içindir; dördü biçime özeldir ve besinle karşılaştırılmaz
     ya da yalnız o biçimle karşılaştırılır (EFSA 2006 UL derlemesi, IOM DRI):
       A vitamini → yalnız hazır vitamin A (retinol); karotenler dahil değil
       Folat     → yalnız sentetik folik asit
       Magnezyum → yalnız takviye ve ilaçtaki magnezyum (besindeki değil)
       Nikotinik asit / nikotinamid → yalnız takviye biçimleri */
  const UL = {
    ek154: { 'A vitamini': 'retinol', 'B6 vitamini': 'b6', 'B12 vitamini': 'b12', 'C vitamini': 'vitC', 'D vitamini': 'vitD',
      'E vitamini': 'vitE', 'K vitamini': 'vitK', 'Folat': 'folik', 'Tiamin': 'b1', 'Riboflavin': 'b2' },
    ek155: { 'Kalsiyum': 'ca', 'Demir': 'fe', 'Bakır': 'cu', 'Fosfor': 'p', 'Sodyum': 'na', 'Potasyum': 'k', 'Selenyum': 'se',
      'Çinko': 'zn', 'İyot': 'iyot', 'Flor': 'flor', 'Manganez': 'mn', 'Molibden': 'mo' }
  };
  /* Sodyumun yeterli alımı (2 g) üst hedef gibi okunur: aşmak iyi değildir */
  const UST_HEDEF = { na: 1 };
  /* Görüntüleme eşiği (klinik ölçüt değil): PRI'nin %70'i altı "düşük".
     AI'nin altı yetersizlik demek değildir (TÜBER/EFSA tanımı); renk nötr. */
  const DUSUK = 0.7;

  /* Ortak öge listesi: BLS ögeleri + selenyum (iyottan sonra) */
  function ogeler() {
    const o = DA.data.bls.oge.map((x) => ({ k: x[0], ad: x[2], birim: x[3], grup: x[4] }));
    const i = o.findIndex((x) => x.k === 'iyot');
    o.splice(i + 1, 0, { k: 'se', ad: 'Selenyum', birim: 'µg', grup: 'min' });
    return o;
  }

  /* Bir menü öğesinin 100 g'daki değerleri (ortak anahtarlarla) */
  function vektor(it) {
    const id = String(it.id || '');
    if (/^vb-/.test(id)) {
      const f = DA.vb.besin(id);
      if (!f) return { kaynak: 'yok', v: anlikVektor(it) };
      const T = DA.vb.kaynak(f.vb), r = f.satir, v = {};
      if (f.vb === 'bls') {
        DA.data.bls.oge.forEach((o, j) => { const x = DA.vb.sayi(r[j + 2]); if (x != null) v[o[0]] = x; });
      } else {
        const al = (k) => { const x = DA.vb.sayi(DA.vb.deger(r, k, T)); return x == null ? undefined : x; };
        Object.keys(TK).forEach((k) => { const x = al(TK[k]); if (x !== undefined) v[k] = x; });
        Object.assign(v, tkTuret(al));
      }
      return { kaynak: f.vb, v };
    }
    const f = DA.foods.get(id);
    if (!f) return { kaynak: 'yok', v: {} };
    const v = { kcal: f.kcal, prot: f.p, kh: f.c, yag: f.f };
    if (typeof f.fib === 'number' && !f.custom) v.lif = f.fib;
    if (f.mik && f.por > 0) {
      f.mik.forEach((x) => { const k = TUBER_PANEL[x[0]]; if (k && typeof x[1] === 'number') v[k] = x[1] / f.por * 100; });
    }
    Object.keys(v).forEach((k) => { if (typeof v[k] !== 'number' || !isFinite(v[k])) delete v[k]; });
    return { kaynak: 'uygulama', v };
  }
  /* Veri bankası bu cihazda yoksa öğedeki makro anlık görüntüsü */
  function anlikVektor(it) {
    const s = it.s || {}, v = {};
    [['kcal', 'kcal'], ['prot', 'p'], ['kh', 'c'], ['yag', 'f'], ['lif', 'fib']].forEach((a) => { if (typeof s[a[1]] === 'number') v[a[0]] = s[a[1]]; });
    return v;
  }

  /* ---- hesap ---- */
  function hesapla(m) {
    const O = ogeler(), ogunler = DA.foods.ogunler, satirlar = [];
    ogunler.forEach((og) => (m.meals[og] || []).forEach((it) => {
      if (!(it.g > 0)) return;
      const ve = vektor(it), k = it.g / 100, v = {};
      Object.keys(ve.v).forEach((a) => { v[a] = ve.v[a] * k; });
      const f = DA.foods.ogeBesin(it);
      satirlar.push({ og, ad: (f && f.n) || it.n || it.id, g: it.g, kaynak: ve.kaynak, v });
    }));
    const N = satirlar.length, top = {};
    O.forEach((o) => {
      let t = 0, n = 0;
      satirlar.forEach((s) => { if (typeof s.v[o.k] === 'number') { t += s.v[o.k]; n++; } });
      top[o.k] = { t, n, N };
    });
    const ogun = ogunler.map((og) => {
      const l = satirlar.filter((s) => s.og === og), x = {};
      ['kcal', 'prot', 'kh', 'yag'].forEach((a) => { x[a] = l.reduce((z, s) => z + (s.v[a] || 0), 0); });
      return { og, n: l.length, x };
    }).filter((x) => x.n);
    return { O, satirlar, top, ogun, N };
  }

  /* TÜBER satırı: önce cinsiyet satırları, eşleşmezse çocuk (ortak) satırları.
     Yaş bantları "5", "19-50", "≥70". 70 yaş hem "65-70" hem "≥70"de; tablo
     sırasındaki ilk eşleşme (65-70) alınır. */
  function bant(s) {
    s = String(s || '').trim();
    let m = /^(\d+)\s*-\s*(\d+)$/.exec(s);
    if (m) return [+m[1], +m[2]];
    m = /^≥\s*(\d+)$/.exec(s);
    if (m) return [+m[1], 200];
    m = /^(\d+)$/.exec(s);
    return m ? [+m[1], +m[1]] : null;
  }
  function satirBul(tablo, cins, yas) {
    const y = Math.floor(yas);
    for (const grup of [cins, 'cocuk']) {
      const r = tablo.r.find((x) => { if (x[0] !== grup) return false; const b = bant(x[1]); return b && y >= b[0] && y <= b[1]; });
      if (r) return r;
    }
    return null;
  }
  const aralik = (x) => (Array.isArray(x) ? [x[0], x[1]] : typeof x === 'number' ? [x, x] : null);

  /* Kişi: menüye bağlı danışan, yoksa profil, yoksa ekrandaki seçim */
  function kisi(m) {
    const S = DA.state(), c = m.c && (S.clients || []).find((x) => x.id === m.c);
    const tarih = m.date || DA.today();
    if (c && (c.sex === 'E' || c.sex === 'K')) {
      let yas = null;
      if (c.bdate && /^\d{4}-\d{2}-\d{2}$/.test(c.bdate)) {
        const b = c.bdate.split('-').map(Number), t = tarih.split('-').map(Number);
        yas = t[0] - b[0] - ((t[1] < b[1] || (t[1] === b[1] && t[2] < b[2])) ? 1 : 0);
      } else if (c.birth > 0) yas = +tarih.slice(0, 4) - c.birth;
      if (yas != null) return { cins: c.sex, yas, kaynak: 'danışan (' + c.name + ')' };
    }
    const p = S.profile || {};
    if (p.age > 0) return { cins: p.sex === 'K' ? 'K' : 'E', yas: p.age, kaynak: 'profil' };
    const u = S.ui.analiz;
    if (u && (u.cins === 'E' || u.cins === 'K') && u.yas > 0) return { cins: u.cins, yas: u.yas, kaynak: 'seçim' };
    return null;
  }

  /* Hedefler: { k: { a, b, tur, ul } } — a/b aralık uçları (tek değerde eşit) */
  function hedefler(ki, enerji) {
    const T = DA.data.tuber, O = {};
    ogeler().forEach((o) => { O[o.k] = o; });
    const ceviri = (birim, kanon) => {
      if (birim === kanon) return 1;
      if (birim === 'g' && kanon === 'mg') return 1000;
      if (birim === 'mg' && kanon === 'µg') return 1000;
      if (birim === 'mg/1000 kkal' && kanon === 'mg') return enerji / 1000;
      return null;                                   /* tanınmayan birim: eşleme yapılmaz */
    };
    const H = {};
    ['ek151', 'ek152'].forEach((t) => {
      const tb = T[t], r = satirBul(tb, ki.cins, ki.yas);
      if (!r) return;
      tb.c.forEach((c, j) => {
        const k = ONERI[t][c[0]], ar = aralik(r[j + 2]);
        if (!k || !ar || !O[k]) return;
        const x = ceviri(c[1], O[k].birim);
        if (x == null) return;
        H[k] = { a: ar[0] * x, b: ar[1] * x, tur: (tb.ref || [])[j] || '', enerjiye: c[1] === 'mg/1000 kkal' };
      });
    });
    ['ek154', 'ek155'].forEach((t) => {
      const tb = T[t], r = satirBul(tb, ki.cins, ki.yas);
      if (!r) return;
      tb.c.forEach((c, j) => {
        const k = UL[t][c[0]], v = r[j + 2];
        if (!k || typeof v !== 'number' || !O[k]) return;
        const x = ceviri(c[1], O[k].birim);
        if (x == null) return;
        (H[k] = H[k] || {}).ul = v * x;
        if (k === 'retinol' || k === 'folik') H[k].ulBicim = true;
      });
    });
    return H;
  }
  /* Makro dağılımı ve TÜBER "makro" / "diğer" tabloları */
  function makroHedef(ki) {
    const T = DA.data.tuber, r = satirBul(T.makro, ki.cins, ki.yas), d = satirBul(T.diger, ki.cins, ki.yas);
    const sayi = (x) => (typeof x === 'number' ? x : /^\d+(\.\d+)?$/.test(String(x)) ? parseFloat(x) : null);
    return {
      prot: r && aralik(r[2]), kh: r && aralik(r[3]), yag: r && aralik(r[4]), ala: r && aralik(r[5]), la: r && aralik(r[6]),
      epadha: d && sayi(d[2]), khG: d && sayi(d[4]), lif: d && sayi(d[5])
    };
  }

  /* ---- görünüm ---- */
  const yaz = (x) => DA.vb.yaz(x);
  function rozet(oran, tur, ust) {
    if (oran == null) return '—';
    const y = '%' + fmt(oran * 100, 0);
    let ton;
    if (ust) ton = oran > 1 ? 'warn' : 'ok';
    else if (oran >= 1) ton = 'ok';
    else if (tur === 'AI') ton = 'info';
    else ton = oran >= DUSUK ? 'warn' : 'bad';
    return '<span class="badge ' + ton + '">' + y + '</span>';
  }
  function miktar(o, x) {
    const eksik = x.n < x.N;
    return (eksik ? '≥ ' : '') + '<b>' + yaz(x.t) + '</b>' + DA.birim(o.birim);
  }

  function ozetKart(A, ki) {
    const t = A.top, e = t.kcal.t, M = makroHedef(ki);
    const sat = (ad, deger, hedef, durum) => '<tr><td>' + ad + '</td><td class="n">' + deger + '</td><td class="n muted">' + hedef + '</td><td class="n">' + durum + '</td></tr>';
    const ep = (k, kat) => (e > 0 ? t[k].t * kat / e * 100 : null);
    const aralikYaz = (a) => (a ? (a[0] === a[1] ? fmt(a[0], 1) : fmt(a[0], 1) + '–' + fmt(a[1], 1)) : '—');
    const icinde = (x, a) => {
      if (x == null || !a) return '—';
      if (x < a[0]) return '<span class="badge warn">altında</span>';
      if (a[0] !== a[1] && x > a[1]) return '<span class="badge warn">üstünde</span>';
      return '<span class="badge ok">uygun</span>';
    };
    const ea = (k, kat) => { const x = ep(k, kat); return x == null ? '—' : '%' + fmt(x, 1); };
    const epadha = t.epa.n || t.dha.n ? (t.epa.t + t.dha.t) * 1000 : null;
    return '<div class="card"><h2 style="margin-top:0">Enerji ve makro dağılımı</h2>' +
      '<div class="bls-ozet"><div class="stat"><div class="v">' + fmt(e, 0) + DA.birim('kcal') + '</div><div class="l">enerji</div></div>' +
      '<div class="stat"><div class="v">' + yaz(t.prot.t) + DA.birim('g') + '</div><div class="l">protein</div></div>' +
      '<div class="stat"><div class="v">' + yaz(t.yag.t) + DA.birim('g') + '</div><div class="l">yağ</div></div>' +
      '<div class="stat"><div class="v">' + yaz(t.kh.t) + DA.birim('g') + '</div><div class="l">KH</div></div></div>' +
      '<div class="scrollx mt-s"><table class="t" id="anMakro"><thead><tr><th>Öge</th><th class="n">Menü</th><th class="n">TÜBER</th><th class="n">Durum</th></tr></thead><tbody>' +
      sat('Protein (E%)', ea('prot', 4), aralikYaz(M.prot), icinde(ep('prot', 4), M.prot)) +
      sat('Karbonhidrat (E%)', ea('kh', 4), aralikYaz(M.kh), icinde(ep('kh', 4), M.kh)) +
      sat('Yağ (E%)', ea('yag', 9), aralikYaz(M.yag), icinde(ep('yag', 9), M.yag)) +
      sat('ALA (E%)', ea('ala', 9), M.ala ? '≥ ' + aralikYaz(M.ala) : '—', icinde(ep('ala', 9), M.ala)) +
      sat('LA (E%)', ea('la', 9), M.la ? '≥ ' + aralikYaz(M.la) : '—', icinde(ep('la', 9), M.la)) +
      sat('EPA + DHA (mg)', epadha == null ? '—' : fmt(epadha, 0), M.epadha ? '≥ ' + fmt(M.epadha, 0) : '—', icinde(epadha, M.epadha ? [M.epadha, M.epadha] : null)) +
      sat('Posa (g)', t.lif.n ? (t.lif.n < t.lif.N ? '≥ ' : '') + fmt(t.lif.t, 1) : '—', M.lif ? '≥ ' + fmt(M.lif, 0) : '—', icinde(t.lif.n ? t.lif.t : null, M.lif ? [M.lif, M.lif] : null)) +
      sat('Karbonhidrat (g)', fmt(t.kh.t, 0), M.khG ? '≥ ' + fmt(M.khG, 0) : '—', icinde(t.kh.t, M.khG ? [M.khG, M.khG] : null)) +
      '</tbody></table></div><p class="muted tiny" style="margin-bottom:0">E% genel katsayılarla (protein ve karbonhidrat 4, yağ ve ' +
      'yağ asitleri 9 kcal/g). TÜBER 2022 Ek 1.2 / 1.3 (makro referans alım aralıkları, AI).</p></div>';
  }

  function mikroKart(A, ki, H, enerji) {
    const sat = A.O.filter((o) => H[o.k] && (H[o.k].a != null)).map((o) => {
      const h = H[o.k], x = A.top[o.k];
      const veri = x.n > 0, oranA = veri && h.a > 0 ? x.t / h.a : null, oranB = veri && h.b > 0 ? x.t / h.b : null;
      const hedef = (h.a === h.b ? yaz(h.a) : yaz(h.a) + '–' + yaz(h.b)) + ' <span class="tiny">' + esc(h.tur) + '</span>';
      const ul = h.ul && veri && x.t > h.ul ? '<span class="badge bad" style="display:table;margin-left:auto">UL aşıldı</span>' : '';
      const yuzde = !veri ? '<span class="muted">veri yok</span>'
        : h.a === h.b ? rozet(oranA, h.tur, UST_HEDEF[o.k]) : rozet(oranB, h.tur, UST_HEDEF[o.k]) +
          '<span class="tiny muted" style="display:block">alt uca %' + fmt(oranA * 100, 0) + '</span>';
      /* Hedef yüzdenin altında küçük yazılır: dört sütun 390 px'lik ekrana
         sığmıyor, yüzde sütunu kaydırmanın dışında kalıyordu. */
      return '<tr data-k="' + o.k + '"><td>' + esc(o.ad) + (x.n < x.N && veri ? '<span class="tiny muted" style="display:block">' + (x.N - x.n) + '/' + x.N + ' besinde veri yok</span>' : '') +
        '</td><td class="n">' + (veri ? miktar(o, x) : '—') + '</td><td class="n">' + yuzde + ul +
        '<span class="tiny muted" style="display:block">' + hedef + '</span></td></tr>';
    });
    /* Biçime özel UL: hazır A vitamini (retinol) ve sentetik folik asit ayrı denetlenir */
    const bicim = ['retinol', 'folik'].filter((k) => H[k] && H[k].ul && A.top[k].n && A.top[k].t > H[k].ul).map((k) => {
      const o = A.O.find((x) => x.k === k);
      return '<div class="note bad" data-ul="' + k + '">' + esc(o.ad) + ' ' + yaz(A.top[k].t) + ' ' + esc(o.birim) + ': UL (' + yaz(H[k].ul) + ' ' + esc(o.birim) +
        ') aşıldı. Bu UL yalnız ' + (k === 'retinol' ? 'hazır A vitamini (retinol)' : 'sentetik folik asit') + ' içindir.</div>';
    }).join('');
    const enerjiNot = A.O.some((o) => H[o.k] && H[o.k].enerjiye)
      ? 'Tiamin ve niasin hedefi enerjiye bağlıdır (TÜBER mg/1000 kkal): ' + fmt(enerji, 0) + ' kcal üzerinden. ' : '';
    return '<div class="card"><h2 style="margin-top:0">Vitamin ve mineraller</h2>' + bicim +
      '<div class="scrollx"><table class="t" id="anMikro"><thead><tr><th>Öge</th><th class="n">Menü</th><th class="n">% · hedef</th></tr></thead><tbody>' +
      sat.join('') + '</tbody></table></div>' +
      '<p class="muted tiny" style="margin-bottom:0">' + enerjiNot + 'Hedef TÜBER 2022 Ek 1.5.1 / 1.5.2 (PRI ya da AI), UL Ek 1.5.4 / 1.5.5. ' +
      '“≥” bazı besinlerde o ögenin ölçülmediğini, toplamın en az bu kadar olduğunu söyler. %' + fmt(DUSUK * 100, 0) +
      ' altı kırmızı yalnız görüntü eşiğidir. AI’nin altındaki alım yetersizlik anlamına gelmez (mavi). Aralıklı hedefte (demir: ' +
      'menopoz öncesi/sonrası, çinko: fitat düzeyi) yüzde üst uca, parantezde alt uca göredir. Magnezyum ve niasin UL’si yalnız ' +
      'takviye biçimleri için olduğundan besinle karşılaştırılmaz.</p></div>';
  }

  function digerKart(A, H) {
    const sat = A.O.filter((o) => !(H[o.k] && H[o.k].a != null) && ['kcal', 'prot', 'yag', 'kh'].indexOf(o.k) < 0).map((o) => {
      const x = A.top[o.k];
      return '<tr><td>' + esc(o.ad) + '</td><td class="n">' + (x.n ? miktar(o, x) : '<span class="muted">veri yok</span>') +
        '</td><td class="n muted tiny">' + x.n + '/' + x.N + '</td></tr>';
    });
    return '<details class="acc"><summary>Öteki ögeler (şekerler, yağ asitleri, amino asitler…)</summary><div class="body">' +
      '<table class="t"><thead><tr><th>Öge</th><th class="n">Menü</th><th class="n">veri</th></tr></thead><tbody>' + sat.join('') +
      '</tbody></table></div></details>';
  }

  function ogunKart(A) {
    const e = A.top.kcal.t;
    return '<details class="acc"><summary>Öğünlere göre</summary><div class="body"><div class="scrollx"><table class="t" id="anOgun"><thead><tr>' +
      '<th>Öğün</th><th class="n">kcal</th><th class="n">%</th><th class="n">P</th><th class="n">KH</th><th class="n">Y</th></tr></thead><tbody>' +
      A.ogun.map((o) => '<tr><td>' + esc(o.og) + '</td><td class="n">' + fmt(o.x.kcal, 0) + '</td><td class="n">' +
        (e > 0 ? '%' + fmt(o.x.kcal / e * 100, 0) : '—') + '</td><td class="n">' + fmt(o.x.prot, 1) + '</td><td class="n">' +
        fmt(o.x.kh, 1) + '</td><td class="n">' + fmt(o.x.yag, 1) + '</td></tr>').join('') +
      '</tbody></table></div><p class="muted tiny" style="margin-bottom:0">Makrolar gram.</p></div></details>';
  }

  /* Bir ögeye hangi besin ne kadar katkı veriyor (BeBiS "sıralama grafiği") */
  let katkiOge = 'kcal';
  function katkiHtml(A) {
    const o = A.O.find((x) => x.k === katkiOge) || A.O[0], t = A.top[o.k].t;
    const l = A.satirlar.filter((s) => typeof s.v[o.k] === 'number' && s.v[o.k] > 0).sort((a, b) => b.v[o.k] - a.v[o.k]);
    if (!l.length) return '<p class="muted small" id="anKatkiBos">Menüde bu öge için veri olan besin yok.</p>';
    return '<div class="list" id="anKatkiListe">' + l.map((s) => {
      const p = t > 0 ? s.v[o.k] / t : 0;
      return '<div class="li" style="display:block"><div class="row between"><span class="small">' + esc(s.ad) + ' <span class="muted tiny">' +
        esc(s.og) + ' · ' + fmt(s.g, 0) + ' g</span></span><span class="small"><b>' + yaz(s.v[o.k]) + '</b> ' + esc(o.birim) +
        ' · %' + fmt(p * 100, 0) + '</span></div><div class="bar ince"><i style="width:' + Math.min(100, p * 100) + '%"></i></div></div>';
    }).join('') + '</div>';
  }
  function katkiKart(A) {
    return '<div class="card"><h2 style="margin-top:0">Katkı sıralaması</h2><label class="fld"><span>Öge</span>' +
      '<select data-change="analizKatki" aria-label="Katkısı gösterilecek öge">' + A.O.map((o) => '<option value="' + o.k + '"' +
        (o.k === katkiOge ? ' selected' : '') + '>' + esc(o.ad) + '</option>').join('') + '</select></label>' +
      '<div id="anKatki">' + katkiHtml(A) + '</div></div>';
  }

  /* Düşük ögeler: PRI'nin %70'i altında kalanlar ve onları en yoğun veren besinler */
  function dusukler(A, H) {
    return A.O.filter((o) => { const h = H[o.k], x = A.top[o.k];
      return h && h.tur === 'PRI' && h.a > 0 && x.n === x.N && x.N > 0 && x.t / h.a < DUSUK; });
  }
  function oneriKart(A, H) {
    const d = dusukler(A, H);
    if (!d.length) return '';
    return '<div class="card"><h2 style="margin-top:0">Düşük kalan ögeler</h2><p class="muted small">PRI’nin %' + fmt(DUSUK * 100, 0) +
      '’inden az ve menünün bütün besinlerinde ölçülmüş ögeler. Hangi besinlerden karşılanabileceğini görmek için dokun.</p>' +
      '<div class="chips">' + d.map((o) => '<button class="chip" data-act="analizOneri" data-k="' + o.k + '">' + esc(o.ad) + ' · %' +
        fmt(A.top[o.k].t / H[o.k].a * 100, 0) + '</button>').join('') + '</div></div>';
  }
  /* Kaynak besinler: 100 kcal başına en yoğun olanlar. Karışık yemekler (BLS X, Y)
     öneri olarak anlamsız; 10 kcal altı (çay, su) sıralamada zaten yok. */
  function kaynakBesinler(k, n) {
    const out = [];
    DA.vb.kaynaklar().filter((T) => T.veri()).forEach((T) => {
      const anahtar = T.id === 'bls' ? k : TK[k];
      if (!anahtar || !DA.vb.indeks(T).K[anahtar]) return;
      const B = T.veri(), hepsi = B.b.map((r, i) => i).filter((i) => T.id !== 'bls' || 'XY'.indexOf(B.b[i][0][0]) < 0);
      DA.vb.sirala(hepsi, anahtar, 'cok', 'kcal', T).slice(0, n).forEach((x) => {
        const r = B.b[x[0]];
        out.push({ T, r, kcal100: x[1], g100: DA.vb.sayi(DA.vb.deger(r, anahtar, T)) });
      });
    });
    return out;
  }
  DA.actions.analizOneri = (el) => {
    const k = el.dataset.k, o = ogeler().find((x) => x.k === k);
    if (!o) return;
    const l = kaynakBesinler(k, 10);
    DA.sheet(o.ad + ' — kaynak besinler', l.length ? '<p class="muted small">100 kcal başına en çok ' + esc(o.ad.toLowerCase()) +
      ' veren besinler (karışık yemekler hariç). Sağda 100 g’daki miktar.</p>' + DA.vb.kaynaklar().filter((T) => T.veri()).map((T) => {
        const b = l.filter((x) => x.T === T);
        return b.length ? '<div class="sect">' + esc(T.ad) + '</div><div class="list" data-kaynak="' + T.id + '">' + b.map((x) =>
          '<a class="li chev" href="#/' + T.rota + '/' + esc(x.r[0]) + '"><span class="grow"><div class="t">' + esc(x.r[1]) + '</div>' +
          '<div class="s">100 kcal’de ' + yaz(x.kcal100) + ' ' + esc(o.birim) + '</div></span><span class="end"><b>' + yaz(x.g100) + '</b> ' +
          esc(o.birim) + '</span></a>').join('') + '</div>' : '';
      }).join('') : '<p class="muted">Bu öge için veri bankasında sıralanabilir besin yok.</p>');
  };
  /* Ekrandaki menü görünümde saklanır; adresten okumak "#analiz/x" ile
     "#/analiz/x" yazımlarında farklı sonuç veriyordu. */
  let aktifMenu = null;
  const buradaMi = (id) => location.hash.replace(/^#\/?/, '') === 'analiz/' + id;
  DA.live.analizKatki = (el) => {
    katkiOge = el.value;
    const m = DA.state().menus.find((x) => x.id === aktifMenu);
    const d = DA.$('#anKatki');
    if (m && d) d.innerHTML = katkiHtml(hesapla(m));
  };
  DA.forms.analizKisi = (f) => {
    const d = DA.formData(f), yas = DA.num(d.yas);
    if (!(d.cins === 'E' || d.cins === 'K') || !(yas >= 2 && yas <= 120)) return DA.toast('Cinsiyet ve 2–120 arası yaş gir');
    DA.state().ui.analiz = { cins: d.cins, yas: Math.floor(yas) };
    DA.save(); DA.render(true);
  };
  function kisiFormu() {
    return '<div class="card"><h2 style="margin-top:0">Kıyas için kişi</h2><p class="muted small">Menü bir danışana bağlı değil ve profilde yaş yok. ' +
      'TÜBER referansı yaşa ve cinsiyete göre seçilir.</p><form data-form="analizKisi"><div class="grid2">' +
      '<label class="fld"><span>Cinsiyet</span><select name="cins"><option value="K">Kadın</option><option value="E">Erkek</option></select></label>' +
      '<label class="fld"><span>Yaş</span><input type="text" inputmode="decimal" name="yas" required></label></div>' +
      '<button class="btn block">Karşılaştır</button></form></div>';
  }

  DA.views.analiz = (parts) => {
    const id = parts[0], m = DA.state().menus.find((x) => x.id === id);
    if (!m) return { title: 'Besin analizi', back: 'menu', html: DA.emptyState('menu', { baslik: 'Menü bulunamadı', aciklama: 'Menü silinmiş olabilir.', eylem: { href: '#/menu', etiket: 'Menülere dön', ico: 'menu' } }) };
    /* Ortak öge listesi BLS'den, referanslar TÜBER'den, uygulama besinlerinin
       mikro paneli TÜBER porsiyon tablosundan gelir; menüdeki TürKomp besini
       için cihazdaki kayıt okunur. */
    const gerek = ['bls', 'blsSozluk', 'tuber', 'porsiyonBesin'];
    const vb = DA.vb.gerekenler([m]);
    if (!DA.hazir(gerek) || vb.length) {
      return { title: 'Besin analizi', tab: 'besin', back: 'menu/' + id, noRecent: true,
        html: DA.iskelet('belge', 'Analiz hazırlanıyor'),
        mount() {
          DA.need(gerek).then(() => DA.vb.yukle(vb)).then(() => { DA.foodsInvalidate(); if (buradaMi(id)) DA.render(true); })
            .catch(() => DA.toast('Analiz verisi yüklenemedi'));
        } };
    }
    aktifMenu = id;
    const A = hesapla(m);
    const bas = '<p class="muted small" style="margin-top:0">' + esc(m.title) + ' · ' + esc(DA.fdate(m.date)) + (m.tur === 'geri' ? ' · 24 saatlik geriçağırma' : '') + '</p>';
    if (!A.N) {
      return { title: 'Besin analizi', tab: 'besin', back: 'menu/' + id, html: bas + DA.emptyState('menu', {
        baslik: 'Menüde besin yok', aciklama: 'Analiz için menüye besin ekle. BLS ve TürKomp besinleri vitamin ve mineralleriyle gelir.',
        eylem: { href: '#/menu/' + id, etiket: 'Menüye dön', ico: 'menu' } }) };
    }
    const ki = kisi(m);
    const yok = A.satirlar.filter((s) => s.kaynak === 'yok').length, uyg = A.satirlar.filter((s) => s.kaynak === 'uygulama').length;
    const kapsam = (yok ? '<div class="note warn" id="anYok">' + yok + ' besinin veri bankası bu cihazda yok (TürKomp yüklenmemiş olabilir); ' +
        'yalnız makroları sayıldı.</div>' : '') +
      (uyg ? '<div class="note" id="anUyg">' + uyg + ' besin uygulamanın kendi listesinden: vitamin ve minerallerin çoğu bu besinlerde yok. ' +
        'Tam analiz için BLS ya da TürKomp besini seç.</div>' : '');
    const tg = m.target || DA.state().targets || {}, enerji = tg.kcal > 0 ? tg.kcal : A.top.kcal.t;
    const H = ki ? hedefler(ki, enerji) : {};
    const kiYazi = ki ? '<p class="muted small" id="anKisi">Kıyas: ' + (ki.cins === 'K' ? 'Kadın' : 'Erkek') + ', ' + ki.yas + ' yaş — ' +
      esc(ki.kaynak) + ' · TÜBER 2022</p>' : '';
    const yetersizYas = ki && ki.yas < 2 ? '<div class="note warn">TÜBER Ek 1.5 2 yaştan başlar; 2 yaş altı için bebek tablolarına bak.</div>' : '';
    return {
      title: 'Besin analizi', tab: 'besin', back: 'menu/' + id, ico: 'bars',
      html: bas + kiYazi + kapsam + yetersizYas +
        (ki && ki.yas >= 2 ? ozetKart(A, ki) + mikroKart(A, ki, H, enerji) + oneriKart(A, H) : kisiFormu()) +
        katkiKart(A) + ogunKart(A) + digerKart(A, H) +
        '<p class="muted tiny center">Besin değerleri: BLS 4.0 (Max Rubner-Institut 2025), TürKomp (cihaza yüklenen dosya), ' +
        'uygulama listesi (TÜBER 2022 Ek 2.3.1 ve yaklaşık ortalamalar). Referans: TÜBER 2022.</p>'
    };
  };

  /* Testler için */
  DA.analiz = { hesapla, hedefler, makroHedef, kisi, satirBul, vektor, kaynakBesinler, dusukler, rozet, TK };
})();
