/* Besin değişim listesi — sayaçlı giriş, otomatik dağıtım, porsiyon örnekleri */
(function () {
  'use strict';
  const { esc, fmt, num, icon } = DA;

  /* Bir değişim başına: c = karbonhidrat (g), p = protein (g), f = yağ (g), ex = porsiyon örnekleri.
     Grup değerleri derste kullanılan listeye göredir ve diyabet değişim listesiyle aynıdır. */
  const GROUPS = [
    { k: 'sut', l: 'Süt (tam yağlı)', c: 9, p: 6, f: 6, ex: '1 su bardağı süt (200 ml) veya yoğurt (200 g); 2 su bardağı ayran' },
    { k: 'sutyy', l: 'Süt (yarım yağlı)', c: 9, p: 6, f: 3, ex: 'Aynı porsiyonların yarım yağlısı' },
    { k: 'et', l: 'Et', c: 0, p: 6, f: 5, ex: '1 köfte kadar kırmızı et / tavuk / balık (30 g); 1 dilim beyaz peynir (30 g); 1 adet yumurta' },
    { k: 'eyg', l: 'Ekmek ve yerine geçenler', c: 15, p: 2, f: 0, ex: '1 ince dilim ekmek (25 g); 3 yemek kaşığı pilav / makarna / bulgur; 1 küçük boy haşlanmış patates' },
    { k: 'sebze', l: 'Sebze', c: 6, p: 2, f: 0, ex: '4 yemek kaşığı pişmiş sebze yemeği; 1 kase çiğ salata' },
    { k: 'meyve', l: 'Meyve', c: 15, p: 0, f: 0, ex: '1 küçük boy elma; 1 küçük boy muz; 1 orta boy portakal; 12–15 adet üzüm' },
    { k: 'yag', l: 'Yağ', c: 0, p: 0, f: 5, ex: '1 tatlı kaşığı zeytinyağı; 5 adet zeytin' },
    { k: 'tohum', l: 'Yağlı tohum', c: 0, p: 2, f: 5, ex: '2 tam ceviz; 5–6 adet badem' }
  ];
  const kcalOf = (g) => g.c * 4 + g.p * 4 + g.f * 9;
  const byKey = (k) => GROUPS.find((g) => g.k === k);
  const numText = (n) => (n % 1 === 0 ? String(n) : fmt(n, 1)); // 2 / 2,5


  /* ---- durum ----
     Çalışma alanı bağlama göre ayrıdır: '' = genel, aksi hâlde danışan kimliği.
     Eskiden tek bir ortak alan vardı: Ayşe'nin dosyasından "Düzenle" denince
     ekranda son çalışılan (başka bir danışanın) plan duruyor, "Planı danışana
     kaydet" de Ayşe'nin kayıtlı planını onunla eziyordu. */
  const S = () => DA.state().ui;
  const baglam = () => S().exClient || '';
  const danisan = (id) => (DA.state().clients || []).find((x) => x.id === id) || null;
  function alanlar() {
    const u = S();
    if (!u.exAlan) {
      u.exAlan = {};
      /* Eski biçimdeki tek ortak alan genel bağlama taşınır; hiçbir şey kaybolmaz. */
      if (u.ex || u.exT || u.exLock || u.exMeal) {
        u.exAlan[''] = { ex: u.ex || {}, exT: u.exT || null, exLock: u.exLock || {}, exMeal: u.exMeal || {} };
      }
      delete u.ex; delete u.exT; delete u.exLock; delete u.exMeal;
    }
    return u.exAlan;
  }
  /* Danışanın ilk açılışında çalışma alanı kayıtlı planından kurulur. */
  function yeniAlan(k) {
    const p = k && danisan(k) ? danisan(k).plan : null;
    if (p) return { ex: Object.assign({}, p.ex), exT: Object.assign({}, p.hedef, { ts: p.ts || 0 }),
      exLock: {}, exMeal: JSON.parse(JSON.stringify(p.meal || {})) };
    return { ex: {}, exT: null, exLock: {}, exMeal: {} };
  }
  function alan() {
    const A = alanlar(), k = baglam();
    if (!A[k]) A[k] = yeniAlan(k);
    return A[k];
  }
  const counts = () => alan().ex;
  const locks = () => alan().exLock;

  /* ---- hedef ----
     ts = hedefin en son açıkça belirlendiği an: hesaplayıcıdan alındığında,
     elle düzeltildiğinde ya da kayıtlı plandan yüklendiğinde. Eskiden hedef ilk
     açılışta bir kez kopyalanıp takılı kalıyordu; enerji hesaplayıcısında yeni
     hedef kaydedilse de değişim listesi eskisini göstermeye devam ediyordu.
     Artık daha yeni bir hedef sessizce üzerine yazılmaz, ekranda önerilir. */
  const uygunHedef = (t) => !!(t && t.kcal > 0) && (!t.dan || t.dan === baglam());
  /* Hesaplayıcı hedefi gram olarak saklar; iki birim de doldurulur ki
     diyetisyen hangi birimde çalışıyorsa hedef o birimde gelsin. */
  function hesaptanHedef(t, birim) {
    return { kcal: t.kcal, birim: birim || 'yuzde',
      c: Math.round(t.c * 4 / t.kcal * 100), p: Math.round(t.p * 4 / t.kcal * 100),
      cg: Math.round(t.c), pg: Math.round(t.p), ts: t.ts || 0 };
  }
  function target() {
    const a = alan();
    if (!a.exT) {
      const t = DA.state().targets;
      a.exT = uygunHedef(t) ? hesaptanHedef(t) : { kcal: 1800, birim: 'yuzde', c: 50, p: 20, ts: 0 };
    }
    return a.exT;
  }

  /* ---- makro hedefi: tek kaynak ----
     Karbonhidrat ve protein yüzde ya da gram olarak girilir; yağ kalandır.
     Girilen birim sabittir, öteki ondan türetilir: gram modunda enerji
     değişince gramlar yerinde kalır, yüzdeler değişir — "günde 180 g
     karbonhidrat" diyen diyetisyenin niyeti budur.
     Eskiden yalnız yüzde vardı ve "Yağ % (otomatik)" alanı hiç
     güncellenmiyordu: KH %45, P %20 girilince ekran "yağ %30" demeye devam
     ediyor, algoritma doğru olarak %35 kullanıyordu; çıkan plan girilen
     yüzdelere uymuyormuş gibi görünüyordu. */
  const gramMi = (T) => T.birim === 'gram';
  function makro(T) {
    const k = T.kcal > 0 ? T.kcal : 0, sayi = (x) => (isFinite(+x) ? +x : 0);
    const g = gramMi(T) ? { c: sayi(T.cg), p: sayi(T.pg) } : { c: k * sayi(T.c) / 400, p: k * sayi(T.p) / 400 };
    g.f = (k - 4 * g.c - 4 * g.p) / 9;
    const y = (x, kat) => (k ? x * kat / k * 100 : 0);
    return { g, y: { c: y(g.c, 4), p: y(g.p, 4), f: y(g.f, 9) } };
  }
  /* Hedefin kullanıcının biriminde yazılışı: "%50" ya da "225 g" */
  const hedefYazi = (T, M, k) => (gramMi(T) ? fmt(M.g[k], 0) + ' g' : '%' + fmt(M.y[k], 0));
  /* İki hedef aynı planı mı tarif ediyor: enerji ve gramlar (yuvarlanmış) */
  function ayniHedef(a, b) {
    const x = makro(a), y = makro(b), r = Math.round;
    return a.kcal === b.kcal && r(x.g.c) === r(y.g.c) && r(x.g.p) === r(y.g.p);
  }

  /* Bu bağlama önerilebilecek, şu anki hedeften daha yeni hesaplayıcı hedefi.
     Başka bir danışan için hesaplanan hedef önerilmez. Öneri kullanıcının
     çalıştığı birimde gelir. */
  function yeniHedef() {
    const t = DA.state().targets, T = target();
    if (!uygunHedef(t) || !t.ts || t.ts <= (T.ts || 0)) return null;
    const h = hesaptanHedef(t, T.birim);
    return ayniHedef(h, T) ? null : h;
  }
  const cnt = (k) => { const n = counts()[k]; return isFinite(n) ? n : 0; };

  function totals(v) {
    const t = { c: 0, p: 0, f: 0, kcal: 0, n: 0 };
    GROUPS.forEach((g) => {
      const n = isFinite(v[g.k]) ? v[g.k] : 0;
      if (!n) return;
      t.c += n * g.c; t.p += n * g.p; t.f += n * g.f; t.kcal += n * kcalOf(g); t.n += n;
    });
    return t;
  }

  /* ---- otomatik dağıtım: klasik basamaklı hesap ----
     Derste öğretilen yöntem; her sayının nereden geldiği ekranda adım adım
     gösterilir.
       1) Sabit gruplar: süt, sebze, meyve, yağlı tohum — TÜBER Ek 3.1.1
          örüntüsünden, hedef enerjiye göre (DA.oruntu.degisim)
       2) Ekmek = (KH hedefi − o ana kadar gelen KH) ÷ 15
       3) Et    = (protein hedefi − o ana kadar gelen protein) ÷ 6
       4) Yağ   = (yağ hedefi − o ana kadar gelen yağ) ÷ 5
       5) Yuvarlamadan kalan enerji farkı ekmekle kapatılır
     Kilitli gruplar hangi adımda olursa olsun olduğu gibi kalır.

     Eskiden sabit aralıklarda (et 2–8, ekmek 3–14 …) kaba kuvvet arama vardı:
     2800 kkal ve üstünde hiç çözüm bulamıyordu (erişilebilen en yüksek enerji
     ~2670 kkal), sonuçlar aralık sınırlarına yapışıyordu (et 8, yağ 2, süt 1)
     ve neden o sayıların seçildiği görülemiyordu. */
  const KISA = { sut: 'Süt (tam yağlı)', sutyy: 'Süt (yarım yağlı)', et: 'Et', eyg: 'Ekmek',
    sebze: 'Sebze', meyve: 'Meyve', yag: 'Yağ', tohum: 'Yağlı tohum' };

  /* Süt türü. Varsayılan yarım yağlı: TÜBER örüntüleri yarım yağlı sütle
     hesaplanmıştır; tam yağlı süt ise %20 protein hedefinde et yağıyla birlikte
     yağ bütçesini dolduruyor, eklenecek yağa yer bırakmıyordu. Tür kilitle
     değişir:
       · bir süt satırı sıfırdan büyük bir sayıyla kilitliyse süt odur, kilitsiz
         öteki süt sıfırlanır;
       · yarım yağlı 0'da kilitliyse süt tam yağlı olarak hesaplanır;
       · hiçbiri kilitli değilse yarım yağlı. */
  function sutTuru(L) {
    const kilitli = (L.sut ? cnt('sut') : 0) + (L.sutyy ? cnt('sutyy') : 0);
    if (kilitli > 0) return null;
    if (!L.sutyy) return 'sutyy';
    if (!L.sut) return 'sut';
    return null;
  }

  function distribute() {
    const T = target(), L = locks(), A = DA.oruntu.degisim(T.kcal), M = makro(T);
    const hedef = M.g;
    const v = {}, adim = [], uyari = [];
    const topla = (m) => GROUPS.reduce((t, g) => t + (v[g.k] || 0) * g[m], 0);

    /* Kilitli değer olduğu gibi korunur (yarım değişim dahil). */
    GROUPS.forEach((g) => { if (L[g.k]) v[g.k] = cnt(g.k); });

    /* 1) sabit gruplar */
    const tur = sutTuru(L);
    ['sut', 'sutyy'].forEach((k) => { if (!L[k]) v[k] = 0; });
    const sabit = [];
    if (tur) { v[tur] = Math.round(A.sut); sabit.push(tur); }
    ['sebze', 'meyve', 'tohum'].forEach((k) => { if (!L[k]) { v[k] = Math.round(A[k]); sabit.push(k); } });
    adim.push({ tur: 'sabit', kcal: T.kcal,
      gruplar: sabit.map((k) => [KISA[k], v[k]]),
      kilitli: GROUPS.filter((g) => L[g.k]).map((g) => [KISA[g.k], v[g.k]]) });

    /* 2–4) ekmek, et, yağ */
    const hesapla = (k, m, bol, birim) => {
      if (L[k]) { adim.push({ tur: 'kilit', ad: KISA[k], n: v[k] }); return null; }
      const gelen = topla(m), ham = (hedef[m] - gelen) / bol;
      return { gelen, ham, kaydet: (n, not) => { v[k] = n; adim.push({ tur: 'formul', ad: KISA[k], hedef: hedef[m], gelen, bol, ham, n, birim, not }); } };
    };
    const ek = hesapla('eyg', 'c', 15, 'g KH');
    if (ek) {
      ek.kaydet(Math.max(0, Math.round(ek.ham)));
      if (ek.ham < -0.5) uyari.push('Karbonhidrat hedefi yalnız sabit gruplarla ' + fmt(-ek.ham * 15, 0) + ' g aşılıyor; ekmek 0.');
    }
    /* Et yağ bütçesiyle sınırlı: listedeki et orta yağlıdır (6 g protein + 5 g
       yağ). %25–30 protein hedefi bu yüzden yağı %40'ın üstüne çıkarmadan
       tutmuyor; o durumda yağ hedefini aşmayan en yakın plan verilir ve açıkça
       uyarılır. Yağ grubu kilitli değilse eklenen yağ 0'a kadar inebilir. */
    let sinirli = false;
    const et = hesapla('et', 'p', 6, 'g protein');
    if (et) {
      const tavan = Math.max(0, Math.floor((hedef.f - topla('f')) / 5 + 0.5));
      const n = Math.max(0, Math.round(et.ham));
      sinirli = n > tavan;
      et.kaydet(Math.min(n, tavan), sinirli ? 'yağ bütçesi ' + tavan + ' değişime izin veriyor' : '');
    }
    const yg = hesapla('yag', 'f', 5, 'g yağ');
    if (yg) {
      yg.kaydet(Math.max(0, Math.round(yg.ham)));
      if (yg.ham < -0.5) uyari.push('Yağ hedefi sabit gruplardan ve etten gelen yağla ' + fmt(-yg.ham * 5, 0) + ' g aşılıyor; eklenen yağ 0.');
    }

    /* 5) enerji: yuvarlamadan kalan fark ekmekle kapatılır */
    const tol = Math.max(50, T.kcal * 0.03), ekmekKcal = kcalOf(byKey('eyg'));
    let fark = T.kcal - totals(v).kcal;
    if (Math.abs(fark) > tol && !L.eyg) {
      const yeni = Math.max(0, v.eyg + Math.round(fark / ekmekKcal));
      if (yeni !== v.eyg) { adim.push({ tur: 'enerji', fark, d: yeni - v.eyg }); v.eyg = yeni; }
      fark = T.kcal - totals(v).kcal;
    }
    if (Math.abs(fark) > tol) uyari.push('Enerji hedefe ' + fmt(Math.abs(fark), 0) + ' kcal ' + (fark > 0 ? 'eksik' : 'fazla') + ' kaldı.');

    GROUPS.forEach((g) => { if (v[g.k] == null) v[g.k] = 0; });
    const t = totals(v), e = t.kcal || 1;
    const sonuc = { c: t.c * 400 / e, p: t.p * 400 / e, f: t.f * 900 / e };
    if (sinirli) {
      uyari.unshift('Protein hedefi (' + hedefYazi(T, M, 'p') + ') bu listeyle yağ hedefi aşılmadan tutmuyor: et orta yağlıdır ' +
        '(1 değişim 6 g protein + 5 g yağ). Planda protein ' + (gramMi(T) ? fmt(t.p, 0) + ' g' : '%' + fmt(sonuc.p, 0)) + '. ' +
        'Proteini artırmak için yağ yüzdesini yükselt ya da et sayısını elle artırıp kilitle.');
    }
    /* Eklenen yağ 0 matematikte doğru olabilir ama pratikte "pişirmede hiç yağ
       yok" demektir; sessiz geçilmez. */
    if (!L.yag && v.yag === 0 && hedef.f > 0) {
      uyari.push('Eklenen yağ 0: yağ bütçesinin tamamı et, süt ve yağlı tohumdan geliyor; pişirmede yağ kullanılamaz. ' +
        'Protein yüzdesini düşürmek ya da yağ yüzdesini artırmak yer açar.');
    }
    /* Enerji düzeltmesi ya da sınırlar makroları kaydırabilir; 3 puandan büyük
       sapma açıkça yazılır. */
    /* Sapma kararı yüzde puanla verilir; yazılışı kullanıcının biriminde. */
    const sap = [['KH', 'c'], ['protein', 'p'], ['yağ', 'f']].filter((x) => Math.abs(sonuc[x[1]] - M.y[x[1]]) > 3);
    if (sap.length) {
      uyari.push('Hedeften sapma: ' + sap.map((x) => x[0] + ' ' +
        (gramMi(T) ? fmt(t[x[1]], 0) + ' g' : '%' + fmt(sonuc[x[1]], 0)) + ' (hedef ' + hedefYazi(T, M, x[1]) + ')').join(' · ') + '.');
    }
    const a = alan();
    a.ex = v;
    a.adim = { sonuc: Object.assign({}, v), hedef: Object.assign({}, T), satir: adim, uyari };
    DA.save();
    return { kcal: t.kcal, kcalErr: Math.abs(t.kcal - T.kcal), uyari };
  }

  /* Hesap adımları: yalnız plan otomatik dağıtımın sonucuyla aynıyken
     gösterilir. Elle değiştirilen bir planın yanında eski adımlar yanıltır.
     Hedef dağıtımdan sonra değiştiyse adımlar yerine bunu söyleyen bir not
     çıkar: tablo yalnız "Otomatik dağıt"la güncellenir (kilitleri ve elle
     düzeltmeleri ezmemek için kendiliğinden değişmez), ama eskiden bunu
     hiçbir şey söylemiyordu — yüzdeler değişip tablo aynı kalınca plan
     girilen yüzdelere uymuyormuş gibi görünüyordu. */
  function adimlarHtml() {
    const a = alan().adim;
    if (!a || temiz(a.sonuc) !== temiz(counts())) return '';
    if (a.hedef && !ayniHedef(a.hedef, target())) {
      return '<div class="note warn"><b>Hedef değişti.</b> Tablo önceki hedefe göre dağıtılmıştı ' +
        '(' + fmt(a.hedef.kcal, 0) + ' kcal). Yeni hedefe göre doldurmak için yeniden dağıt.' +
        '<button class="btn sm block mt" data-act="exAuto">' + icon('calc') + ' Yeni hedefe göre dağıt</button></div>';
    }
    const n1 = (x) => fmt(x, 1), n0 = (x) => fmt(x, 0);
    const li = a.satir.map((s) => {
      if (s.tur === 'sabit') {
        return '<li><b>Sabit gruplar</b> — TÜBER Ek 3.1.1, ' + n0(s.kcal) + ' kkal örüntüsünden: ' +
          (s.gruplar.length ? s.gruplar.map((x) => esc(x[0]) + ' ' + numText(x[1])).join(' · ') : 'hepsi kilitli') +
          (s.kilitli.length ? '<div class="muted small">Kilitli: ' + s.kilitli.map((x) => esc(x[0]) + ' ' + numText(x[1])).join(' · ') + '</div>' : '') + '</li>';
      }
      if (s.tur === 'kilit') return '<li><b>' + esc(s.ad) + '</b> kilitli: ' + numText(s.n) + '</li>';
      if (s.tur === 'enerji') {
        return '<li><b>Enerji düzeltmesi</b> — yuvarlamadan ' + n0(Math.abs(s.fark)) + ' kcal ' + (s.fark > 0 ? 'eksik' : 'fazla') +
          ' kaldı: ekmek ' + (s.d > 0 ? '+' : '−') + Math.abs(s.d) + '</li>';
      }
      return '<li><b>' + esc(s.ad) + '</b> = (' + n0(s.hedef) + ' ' + esc(s.birim) + ' hedefi − ' + n0(s.gelen) + ') ÷ ' + s.bol +
        ' = ' + n1(s.ham) + ' → <b>' + numText(s.n) + '</b>' + (s.not ? ' <span class="muted small">(' + esc(s.not) + ')</span>' : '') + '</li>';
    }).join('');
    /* Aynı durumun uyarıları tek kutuda: üç ayrı kutu görsel olarak ağırdı. */
    return (a.uyari.length ? '<div class="note warn"><b>Bu hedef bu listeyle tam tutmuyor</b>' +
      '<ul class="tight">' + a.uyari.map((u) => '<li>' + esc(u) + '</li>').join('') + '</ul></div>' : '') +
      '<div class="card"><div class="sect" style="margin-top:0">Hesap adımları</div><ol class="adimlar">' + li + '</ol></div>';
  }

  /* ---- öğünlere dağıtım ----
     Varsayılan enerji payları; grup toplamları birebir korunur. */
  const MEALS = [['kahvalti', 'Kahvaltı', 25], ['ara1', 'Ara öğün', 10], ['ogle', 'Öğle', 30], ['ara2', 'Ara öğün', 10], ['aksam', 'Akşam', 25]];
  const meals = () => alan().exMeal;

  /* Grupların öğünlere uygunluğu — Türk mutfağı alışkanlığı:
     kahvaltıda peynir/yumurta (et grubu), süt, zeytin (yağ), ekmek;
     ara öğünde meyve, süt/yoğurt/ayran, yağlı tohum;
     öğle ve akşamda et, sebze, yağ, ekmek/pilav, yoğurt.
     2 = tercih, 1 = olur, 0,3 = istisna, 0 = hiç.
     Eskiden gruplar yalnız öğünün enerji açığına göre yerleşiyordu: ara öğüne
     "ekmek + yağ + sebze" düşüyor, meyve ve süt ana öğünlerde kalıyordu. */
  const UYGUN = {
    kahvalti: { sut: 2, sutyy: 2, et: 2, eyg: 2, sebze: 1, meyve: 0.3, yag: 2, tohum: 1 },
    ara: { sut: 2, sutyy: 2, et: 0.3, eyg: 1, sebze: 0.3, meyve: 2, yag: 0, tohum: 2 },
    ana: { sut: 1, sutyy: 1, et: 2, eyg: 2, sebze: 2, meyve: 1, yag: 2, tohum: 0.3 }
  };
  const ogunTipi = (mk) => (mk === 'kahvalti' ? 'kahvalti' : mk.indexOf('ara') === 0 ? 'ara' : 'ana');
  /* Esnekliği en az olan grup önce yerleşir (meyve ara öğüne, et ana öğünlere
     ve kahvaltıya); ekmek en son gelir ve kalan enerji boşluklarını kapatır.
     Et sütten önce: yoksa süt kahvaltıyı doldurup peynir/yumurtaya yer bırakmıyordu. */
  const YERLESME = ['meyve', 'et', 'sut', 'sutyy', 'tohum', 'sebze', 'yag', 'eyg'];

  function autoMeals() {
    const tot = totals(counts()).kcal || 1;
    const out = {}, acik = {}, pay = {};
    MEALS.forEach((m) => { out[m[0]] = {}; pay[m[0]] = tot * m[2] / 100; acik[m[0]] = pay[m[0]]; });

    /* Yarım değişim kendi başına bir birimdir; eskiden Math.round ile
       yuvarlanıyordu: planda 1,5 süt varken öğünlere 2 süt dağıtılıyor ve
       uyuşmazlık uyarısı da çıkmıyordu. */
    const units = [];
    GROUPS.forEach((g) => {
      let kalan = cnt(g.k);
      while (kalan >= 1) { units.push({ g, n: 1 }); kalan -= 1; }
      if (kalan > 0.01) units.push({ g, n: kalan });
    });
    units.sort((a, b) => YERLESME.indexOf(a.g.k) - YERLESME.indexOf(b.g.k) || b.n - a.n);

    /* Puan = uygunluk + öğünün boş kalan payı (hedefine ORANLA) − aynı gruptan
       yığılma. Mutlak kcal açığı kullanılsaydı en büyük öğün (öğle, %30) her
       şeyi çekerdi: ilk denemede meyve ara öğüne değil öğleye gitti.
       Ekmek dengeleyici gruptur: yığılma cezası almaz ve açığa daha çok bakar;
       almadığında öğle payı hedefin 5–6 puan altında kalıyordu. */
    units.forEach((u) => {
      const dengeleyici = u.g.k === 'eyg';
      let best = null, bs = -Infinity;
      MEALS.forEach((m) => {
        const w = UYGUN[ogunTipi(m[0])][u.g.k];
        if (!w) return;
        const r = (acik[m[0]] - kcalOf(u.g) * u.n / 2) / pay[m[0]];
        const s = dengeleyici ? w + 4 * r : w + 1.6 * r - (out[m[0]][u.g.k] || 0) * 0.35;
        if (s > bs) { bs = s; best = m[0]; }
      });
      out[best][u.g.k] = (out[best][u.g.k] || 0) + u.n;
      acik[best] -= kcalOf(u.g) * u.n;
    });
    alan().exMeal = out; DA.save();
  }
  const mealTot = (mk) => totals(meals()[mk] || {});
  /* Bir grubun öğünlere dağıtılmış toplamı */
  function assigned(gk) {
    return MEALS.reduce((t, m) => t + ((meals()[m[0]] || {})[gk] || 0), 0);
  }

  function mealsHtml() {
    const any = MEALS.some((m) => mealTot(m[0]).n > 0);
    if (!any) return '<div class="card"><div class="empty">' + icon('menu') +
      '<div>Değişimleri öğünlere bölmek için <b>Öğünlere dağıt</b>’a dokun.</div></div></div>';
    const eksik = GROUPS.map((g) => {
      const d = cnt(g.k) - assigned(g.k);
      return Math.abs(d) > 0.01 ? esc(g.l) + ': ' + (d > 0 ? numText(d) + ' dağıtılmadı' : numText(-d) + ' fazla') : '';
    }).filter(Boolean);
    return '<div class="list">' + MEALS.map((m) => {
      const t = mealTot(m[0]), v = meals()[m[0]] || {};
      const det = GROUPS.filter((g) => v[g.k]).map((g) => esc(KISA[g.k]) + ' ' + numText(v[g.k])).join(' · ');
      return '<button class="li" data-act="exMealEdit" data-m="' + m[0] + '">' +
        '<span class="grow"><div class="t">' + esc(m[1]) + '</div><div class="s">' + (det || 'boş') + '</div></span>' +
        '<span class="end">' + fmt(t.kcal, 0) + ' kcal<br><span class="tiny">%' + fmt(t.kcal / (totals(counts()).kcal || 1) * 100, 0) + '</span></span></button>';
    }).join('') + '</div>' +
    (eksik.length ? '<div class="note warn"><b>Öğün toplamları planla uyuşmuyor:</b><br>' + eksik.join('<br>') + '</div>' : '');
  }

  /* ---- parçalar ---- */
  function rowsHtml() {
    const L = locks();
    return GROUPS.map((g) => {
      const n = cnt(g.k), on = n > 0;
      const macro = [g.c ? g.c + ' KH' : '', g.p ? g.p + ' P' : '', g.f ? g.f + ' Y' : ''].filter(Boolean).join(' · ');
      return '<div class="xrow' + (on ? ' on' : '') + '">' +
        '<button class="lock' + (L[g.k] ? ' on' : '') + '" data-act="exLock" data-k="' + g.k + '" aria-pressed="' + (L[g.k] ? 'true' : 'false') + '" title="Otomatik dağıtımda sabit tut">' + icon('lock') + '</button>' +
        '<span class="grow"><div class="t">' + esc(g.l) + '</div><div class="s">' + macro + ' · ' + kcalOf(g) + ' kcal</div></span>' +
        '<span class="stepper">' +
          '<button data-act="exDec" data-k="' + g.k + '" aria-label="' + esc(g.l) + ' azalt"' + (n <= 0 ? ' disabled' : '') + '>−</button>' +
          '<button class="n' + (on ? '' : ' z') + '" data-act="exSet" data-k="' + g.k + '" aria-label="' + esc(g.l) + ': ' + esc(numText(n)) + ' değişim, değer gir">' + esc(numText(n)) + '</button>' +
          '<button data-act="exInc" data-k="' + g.k + '" aria-label="' + esc(g.l) + ' artır">+</button>' +
        '</span></div>';
    }).join('');
  }

  function barLine(l, cur, hedef, u) {
    const d = cur - hedef, pct = hedef ? Math.min(100, cur / hedef * 100) : 0;
    return '<div class="res"><span class="l">' + esc(l) + '</span><span class="v">' + fmt(cur, 0) + ' / ' + fmt(hedef, 0) + ' ' + u +
      '<span class="sub">' + (Math.abs(d) < 0.5 ? 'hedefte' : (d > 0 ? '+' : '−') + fmt(Math.abs(d), 0) + ' ' + u) + '</span></span></div>' +
      '<div class="bar' + (cur > hedef * 1.05 ? ' over' : '') + '"><i style="width:' + (isFinite(pct) ? Math.round(pct) : 0) + '%"></i></div>';
  }

  function breakdown(v, t) {
    const rows = GROUPS.map((g) => {
      const n = isFinite(v[g.k]) ? v[g.k] : 0;
      if (!n) return '';
      return '<tr><td>' + esc(g.l) + '</td><td class="n">' + fmt(n, 1) + '</td><td class="n">' + fmt(n * g.c, 0) + '</td>' +
        '<td class="n">' + fmt(n * g.p, 0) + '</td><td class="n">' + fmt(n * g.f, 0) + '</td><td class="n">' + fmt(n * kcalOf(g), 0) + '</td></tr>';
    }).join('');
    if (!rows) return '';
    return '<div class="scrollx"><table class="t xt"><thead><tr><th>Grup</th><th class="n">Değişim</th><th class="n">KH</th><th class="n">P</th><th class="n">Y</th><th class="n">kcal</th></tr></thead>' +
      '<tbody>' + rows + '</tbody><tfoot><tr><th>Toplam</th><th class="n">' + fmt(t.n, 1) + '</th><th class="n">' + fmt(t.c, 0) + '</th>' +
      '<th class="n">' + fmt(t.p, 0) + '</th><th class="n">' + fmt(t.f, 0) + '</th><th class="n">' + fmt(t.kcal, 0) + '</th></tr></tfoot></table></div>';
  }

  function portions() {
    return '<details class="acc"><summary>Porsiyon örnekleri (1 değişim)</summary><div class="body">' +
      '<table class="t"><tbody>' + GROUPS.map((g) =>
        '<tr><td style="width:38%"><b>' + esc(g.l) + '</b></td><td>' + esc(g.ex) + '</td></tr>').join('') +
      '</tbody></table><p class="muted tiny">Porsiyonlar yaklaşıktır; besinin cinsine ve pişirme yöntemine göre değişir.</p>' +
      '<a class="btn ghost block" href="#/hesapla/porsiyon?t=olcu">' + icon('table') + ' TÜBER standart porsiyon ölçüleri</a></div></details>';
  }

  function planText() {
    const v = counts(), t = totals(v);
    return DA.APP + ' — Değişim listesi planı\n' +
      GROUPS.filter((g) => cnt(g.k)).map((g) => '• ' + g.l + ': ' + fmt(cnt(g.k), 1) + ' değişim').join('\n') +
      '\n\nToplam: ' + fmt(t.kcal, 0) + ' kcal · KH ' + fmt(t.c, 0) + ' g · Protein ' + fmt(t.p, 0) + ' g · Yağ ' + fmt(t.f, 0) + ' g' +
      (MEALS.some((m) => mealTot(m[0]).n) ? '\n\nÖĞÜNLER\n' + MEALS.map((m) => {
        const mv = meals()[m[0]] || {}, det = GROUPS.filter((g) => mv[g.k]).map((g) => KISA[g.k] + ' ' + numText(mv[g.k])).join(', ');
        return det ? m[1] + ' (' + fmt(mealTot(m[0]).kcal, 0) + ' kcal): ' + det : '';
      }).filter(Boolean).join('\n') : '') +
      '\n\n' + DA.dyt();
  }

  /* TÜBER Ek 3.1.1 karşılaştırması — hedef enerjiye en yakın örüntü */
  function tuberHtml() {
    if (!DA.oruntu || !DA.data.tuber || !DA.data.tuber.oruntu) return '';
    return DA.oruntu.panel(target().kcal, counts());
  }

  /* Çalışma alanı dosyadaki plandan farklı mı. Sıfır değerler ve anahtar
     sırası yok sayılır; yoksa "0 süt" ile "süt yok" farklı sayılırdı. */
  function temiz(v) {
    const o = {};
    Object.keys(v || {}).sort().forEach((k) => {
      const x = v[k];
      if (x && typeof x === 'object') { const t = temiz(x); if (t !== '{}') o[k] = JSON.parse(t); }
      else if (x) o[k] = x;
    });
    return JSON.stringify(o);
  }
  function kaydedilmemis(cl) {
    const a = alan(), p = cl.plan, T = target();
    if (!p) return totals(a.ex).n > 0;
    const h = p.hedef || {};
    return temiz(a.ex) !== temiz(p.ex) || temiz(a.exMeal) !== temiz(p.meal) ||
      !ayniHedef(T, h) || (T.birim || 'yuzde') !== (h.birim || 'yuzde');
  }
  function danisanHtml(cl) {
    const degisik = kaydedilmemis(cl);
    return '<div class="note ' + (degisik ? 'warn' : 'ok') + '"><b>' + esc(cl.name) + '</b> için plan. ' +
      (cl.avoid ? 'Kaçınılan: ' + esc(cl.avoid) + '. ' : '') +
      (degisik ? '<br><b>Kaydedilmemiş değişiklik var.</b>' : cl.plan ? '<br>Dosyadaki planla aynı.' : '') +
      '<button class="btn sm block mt" data-act="exSaveClient" data-id="' + esc(cl.id) + '">' +
      icon('save') + ' Planı danışana kaydet</button>' +
      (degisik && cl.plan ? '<button class="btn sm ghost block mt-s" data-act="exPlanaDon">Dosyadaki plana dön</button>' : '') +
      '</div>';
  }
  function hedefOneriHtml() {
    const h = yeniHedef();
    if (!h) return '';
    const M = makro(h);
    return '<div class="note">Enerji hesaplayıcısında daha yeni bir hedef var: <b>' + fmt(h.kcal, 0) + ' kcal</b> · KH ' +
      hedefYazi(h, M, 'c') + ' · P ' + hedefYazi(h, M, 'p') +
      '<button class="btn sm block mt" data-act="exHedefAl">Bu hedefi kullan</button></div>';
  }

  /* Hedef kartı: enerji, makro birimi (yüzde / gram), KH ve protein alanı.
     Yağ kalandır ve alan değil, canlı güncellenen bir özet olarak gösterilir:
     eskiden devre dışı bir alan olarak duruyor ve hiç güncellenmiyordu. */
  function hedefHtml(T) {
    const gram = gramMi(T);
    const girdi = (ad, etiket, deger) => '<label class="fld"><span>' + etiket + '</span>' +
      '<input type="text" inputmode="decimal" name="' + ad + '" value="' + esc(deger == null ? '' : fmt(+deger, 1)) + '" data-live="exT"></label>';
    const secim = (b, etiket) => '<button class="chip' + ((T.birim || 'yuzde') === b ? ' on' : '') + '" data-act="exBirim" data-b="' + b +
      '" aria-pressed="' + ((T.birim || 'yuzde') === b) + '">' + etiket + '</button>';
    return '<div class="grid2">' + girdi('kcal', 'Enerji (kcal)', T.kcal) +
      '<div class="fld"><span id="exBirimEt">Makro birimi</span><div class="chips" role="group" aria-labelledby="exBirimEt">' +
      secim('yuzde', 'Yüzde') + secim('gram', 'Gram') + '</div></div></div>' +
      '<div class="grid2">' +
      (gram ? girdi('cg', 'Karbonhidrat (g/gün)', T.cg) : girdi('c', 'Karbonhidrat (%)', T.c)) +
      (gram ? girdi('pg', 'Protein (g/gün)', T.pg) : girdi('p', 'Protein (%)', T.p)) + '</div>' +
      '<div id="exMakro" aria-live="polite">' + makroOzetHtml(T) + '</div>';
  }
  /* Üç makronun iki birimde karşılığı; yağ kalan olarak. Kullanıcının
     birimi büyük, öteki birim altta küçük. */
  function makroOzetHtml(T) {
    const M = makro(T), gram = gramMi(T);
    const kutu = (k, etiket) => {
      const ana = gram ? fmt(M.g[k], 0) + DA.birim('g') : '%' + fmt(M.y[k], 0);
      const alt = gram ? '%' + fmt(M.y[k], 0) : fmt(M.g[k], 0) + ' g';
      return '<div' + (M.g[k] < 0 ? ' class="eksi"' : '') + '><b>' + ana + '</b><small>' + etiket + '</small><small class="alt">' + alt + '</small></div>';
    };
    return '<div class="macros mb">' + kutu('c', 'karbonhidrat') + kutu('p', 'protein') + kutu('f', 'yağ (kalan)') + '</div>' +
      (M.g.f < 0 ? '<div class="note bad">Karbonhidrat ve protein enerjinin tamamını aşıyor; yağa yer kalmıyor.</div>'
        : M.y.f < 5 ? '<div class="note warn">Yağa %5’ten az kalıyor; karbonhidrat ya da protein çok yüksek.</div>' : '');
  }

  function outHtml() {
    const v = counts(), t = totals(v), T = target();
    if (!t.n) return '<div class="card"><div class="empty">' + icon('table') +
      '<div>Gruplara değişim ekle ya da <b>Otomatik dağıt</b>’a dokun.</div></div></div>';
    const e = t.kcal || 1;
    const M = makro(T);
    return '<div class="card">' +
      '<div class="res hl"><span class="l">Toplam enerji</span><span class="v">' + fmt(t.kcal, 0) + ' kcal<span class="sub">' + fmt(t.n, 1) + ' değişim</span></span></div>' +
      '<div class="macros mt"><div><b>' + fmt(t.c, 0) + DA.birim('g') + '</b><small>karbonhidrat</small><small class="alt">%' + fmt(t.c * 4 / e * 100, 0) + ' enerji</small></div>' +
      '<div><b>' + fmt(t.p, 0) + DA.birim('g') + '</b><small>protein</small><small class="alt">%' + fmt(t.p * 4 / e * 100, 0) + ' enerji</small></div>' +
      '<div><b>' + fmt(t.f, 0) + DA.birim('g') + '</b><small>yağ</small><small class="alt">%' + fmt(t.f * 9 / e * 100, 0) + ' enerji</small></div>' +
      '<div><b>' + fmt(t.c / 15, 1) + '</b><small>KH değişimi</small></div></div>' +
      '<div class="sect">Hedefe göre</div>' +
      barLine('Enerji', t.kcal, T.kcal, 'kcal') +
      barLine('Karbonhidrat', t.c, M.g.c, 'g') +
      barLine('Protein', t.p, M.g.p, 'g') +
      barLine('Yağ', t.f, Math.max(0, M.g.f), 'g') +
      '</div>' +
      breakdown(v, t) +
      '<button class="btn sec block" data-act="exShare">' + icon('share') + ' Planı paylaş / kopyala</button>' +
      '<div class="grid2 mt-s"><button class="btn ghost block" data-act="exMenu">' + icon('menu') + ' Menü iskeleti</button>' +
      '<a class="btn ghost block" href="#/yazdir/degisim' + (S().exClient ? '/' + S().exClient : '') + '">' + icon('note') + ' Yazdır</a></div>';
  }

  /* ---- görünüm ---- */
  DA.calcs.push({
    id: 'degisim', data: ['tuber','hedef'], title: 'Değişim listesi', desc: 'Sayaçlı giriş, otomatik dağıtım, porsiyon örnekleri', ico: 'swap',
    view(parts, q) {
      const cid = q && q.get('c');
      const cl = cid ? danisan(cid) : null;
      S().exClient = cl ? cl.id : null;
      const T = target();
      return {
        title: 'Değişim listesi', tab: 'hesapla', ico: 'swap',
        fav: { h: '#/hesapla/degisim', t: 'Değişim listesi', ico: 'swap' },
        back: cl ? 'danisan/' + cl.id : 'hesapla',
        html:
          (cl ? '<div id="exDanisan">' + danisanHtml(cl) + '</div>' : '') +
          '<div class="card"><div class="sect" style="margin-top:0">Hedef</div>' +
          '<div id="exHedefOneri">' + hedefOneriHtml() + '</div>' +
          hedefHtml(T) +
          '<button class="btn block" data-act="exAuto">' + icon('calc') + ' Otomatik dağıt</button>' +
          '<p class="muted tiny" style="margin-bottom:0">Süt, sebze, meyve ve yağlı tohum TÜBER örüntüsünden; ekmek KH’den, et proteinden, ' +
          'yağ yağ hedefinden hesaplanır. Kilitli gruplar sabit kalır. Süt yarım yağlı hesaplanır; tam yağlı için satırını kilitle.</p></div>' +
          '<div id="exAdim">' + adimlarHtml() + '</div>' +

          '<div class="sect">Gruplar</div>' +
          '<div class="list" id="exRows">' + rowsHtml() + '</div>' +
          '<div class="row between mb"><button class="btn ghost sm" data-act="exReset">Sıfırla</button>' +
          '<span class="muted tiny">Sayıya dokunarak tam değer gir</span></div>' +

          '<div id="exOut">' + outHtml() + '</div>' +
          '<div id="exTuber">' + tuberHtml() + '</div>' +
          '<div class="sect">Öğünler</div>' +
          '<button class="btn sec block mb" data-act="exMealAuto">' + icon('menu') + ' Öğünlere dağıt (%25 · %10 · %30 · %10 · %25)</button>' +
          '<div id="exMeals">' + mealsHtml() + '</div>' +
          portions() +
          '<div class="note">Değerler derste kullanılan değişim listesine göredir ve diyabet değişim listesiyle aynıdır. Vitamin ve mineral içermez.</div>'
      };
    }
  });

  /* ---- etkileşim ---- */
  const redraw = () => {
    const r = DA.$('#exRows'), o = DA.$('#exOut'), m = DA.$('#exMeals'), tb = DA.$('#exTuber');
    ustBilgi();
    if (r) r.innerHTML = rowsHtml();
    if (o) o.innerHTML = outHtml();
    if (m) m.innerHTML = mealsHtml();
    if (tb) { const open = tb.querySelector('details') && tb.querySelector('details').open; tb.innerHTML = tuberHtml();
      const d = tb.querySelector('details'); if (d && open) d.open = true; }
  };
  function ustBilgi() {
    const ad = DA.$('#exAdim');
    if (ad) ad.innerHTML = adimlarHtml();
    const dn = DA.$('#exDanisan'), cl = danisan(baglam());
    if (dn && cl) dn.innerHTML = danisanHtml(cl);
    const ho = DA.$('#exHedefOneri');
    if (ho) ho.innerHTML = hedefOneriHtml();
  }
  const setCount = (k, n) => { counts()[k] = Math.max(0, Math.round(n * 2) / 2); DA.save(); redraw(); };

  DA.actions.exInc = (el) => setCount(el.dataset.k, cnt(el.dataset.k) + 1);
  DA.actions.exDec = (el) => setCount(el.dataset.k, cnt(el.dataset.k) - 1);
  DA.actions.exLock = (el) => { const L = locks(), k = el.dataset.k; L[k] = !L[k]; DA.save(); redraw(); };
  DA.actions.exReset = () => { const a = alan(); a.ex = {}; a.exLock = {}; a.exMeal = {}; DA.save(); redraw(); DA.toast('Sıfırlandı'); };

  DA.actions.exSet = (el) => {
    const k = el.dataset.k, g = byKey(k);
    DA.sheet(g.l, '<form data-form="exSet" data-k="' + k + '"><label class="fld"><span>Değişim sayısı (yarım için 0,5)</span>' +
      '<input type="text" inputmode="decimal" name="n" value="' + esc(fmt(cnt(k), 1)) + '"></label>' +
      '<button class="btn block" type="submit">Tamam</button></form>');
  };
  DA.forms.exSet = (f) => {
    const n = num(DA.formData(f).n);
    setCount(f.dataset.k, isFinite(n) ? n : 0);
    DA.closeSheet();
  };

  DA.live.exT = (el) => {
    const T = target(), n = num(el.value);
    if (isFinite(n)) { T[el.name] = Math.max(0, n); T.ts = Date.now(); }
    DA.save();
    const mk = DA.$('#exMakro'); if (mk) mk.innerHTML = makroOzetHtml(T);
    ustBilgi();
    const o = DA.$('#exOut'); if (o) o.innerHTML = outHtml();
    const tb = DA.$('#exTuber');
    if (tb) { const d0 = tb.querySelector('details'), open = d0 && d0.open; tb.innerHTML = tuberHtml();
      const d = tb.querySelector('details'); if (d && open) d.open = true; }
  };

  /* Birim değişince değerler karşılığına çevrilir; plan aynı kalır.
     Hedefin kendisi değişmediği için zaman damgası güncellenmez. */
  DA.actions.exBirim = (el) => {
    const T = target(), b = el.dataset.b;
    if ((T.birim || 'yuzde') === b) return;
    const M = makro(T);
    if (b === 'gram') { T.cg = Math.round(M.g.c); T.pg = Math.round(M.g.p); }
    else { T.c = Math.round(M.y.c); T.p = Math.round(M.y.p); }
    T.birim = b;
    DA.save(); DA.render(true);
  };

  DA.actions.exHedefAl = () => {
    const h = yeniHedef();
    if (!h) return;
    alan().exT = h; DA.save(); DA.render(true);
    DA.toast('Hedef güncellendi: ' + h.kcal + ' kcal');
  };
  /* Kaydedilmemiş değişiklikleri atar; geri alınabilir. */
  DA.actions.exPlanaDon = () => {
    const k = baglam(), A = alanlar(), eski = A[k];
    delete A[k]; DA.save(); DA.render(true);
    DA.silGeriAl('Dosyadaki plana dönüldü', () => { alanlar()[k] = eski; DA.save(); DA.render(true); });
  };

  DA.actions.exAuto = () => {
    const T = target();
    if (!(T.kcal > 0)) return DA.toast('Önce hedef enerjiyi gir');
    if (makro(T).y.f < 5) return DA.toast('Yağa en az %5 kalmalı: karbonhidrat ya da protein çok yüksek');
    if (!DA.oruntu || !DA.data.tuber || !DA.data.tuber.oruntu) {
      DA.need(['tuber']).then(() => DA.actions.exAuto()).catch(() => DA.toast('TÜBER verisi yüklenemedi'));
      return;
    }
    const r = distribute();
    redraw();
    DA.toast('Dağıtıldı: ' + Math.round(r.kcal) + ' kcal' +
      (r.uyari.length ? ' · ' + r.uyari.length + ' uyarı' : ' (hedefe ' + Math.round(r.kcalErr) + ' kcal)'));
  };

  DA.actions.exMealAuto = () => {
    if (!totals(counts()).n) return DA.toast('Önce değişim planı oluştur');
    autoMeals(); redraw(); DA.toast('Öğünlere dağıtıldı');
  };
  DA.actions.exMealEdit = (el) => {
    const mk = el.dataset.m, m = MEALS.find((x) => x[0] === mk);
    const v = meals()[mk] || {};
    DA.sheet(m[1], '<div id="exMealBody">' + mealEditHtml(mk, v) + '</div>');
  };
  function mealEditHtml(mk, v) {
    return GROUPS.filter((g) => cnt(g.k) > 0).map((g) => {
      const n = v[g.k] || 0, kalan = cnt(g.k) - assigned(g.k);
      return '<div class="xrow"><span class="grow"><div class="t">' + esc(g.l) + '</div>' +
        '<div class="s">planda ' + numText(cnt(g.k)) + ' · dağıtılmamış ' + numText(Math.max(0, kalan)) + '</div></span>' +
        '<span class="stepper"><button data-act="exMealDec" data-m="' + mk + '" data-k="' + g.k + '"' + (n <= 0 ? ' disabled' : '') + '>−</button>' +
        '<button class="n' + (n ? '' : ' z') + '" disabled>' + numText(n) + '</button>' +
        '<button data-act="exMealInc" data-m="' + mk + '" data-k="' + g.k + '"' + (kalan <= 0.01 ? ' disabled' : '') + '>+</button></span></div>';
    }).join('') + '<p class="muted tiny">Bu öğünün toplamı: <b>' + fmt(mealTot(mk).kcal, 0) + ' kcal</b></p>';
  }
  function setMeal(mk, gk, n) {
    const M = meals();
    M[mk] = M[mk] || {};
    n = Math.round(n * 2) / 2;
    if (n <= 0) delete M[mk][gk]; else M[mk][gk] = n;
    DA.save();
    const b = DA.$('#exMealBody');
    if (b) b.innerHTML = mealEditHtml(mk, M[mk]);
    redraw();
  }
  /* Artırma kalan kadar, en çok 1; azaltma önce yarımı söker. Böylece planda
     1,5 süt varsa öğünlere 1 + 0,5 olarak dağıtılabilir. */
  const ogunDeger = (mk, gk) => (meals()[mk] || {})[gk] || 0;
  DA.actions.exMealInc = (el) => {
    const mk = el.dataset.m, gk = el.dataset.k, kalan = cnt(gk) - assigned(gk);
    if (kalan > 0.01) setMeal(mk, gk, ogunDeger(mk, gk) + Math.min(1, kalan));
  };
  DA.actions.exMealDec = (el) => {
    const mk = el.dataset.m, gk = el.dataset.k, n = ogunDeger(mk, gk), kesir = n % 1;
    setMeal(mk, gk, n - (kesir > 0.01 ? kesir : 1));
  };

  DA.actions.exShare = () => DA.shareText('Değişim listesi planı', planText());

  /* ---- Yazdırma: danışana verilebilir tek sayfalık plan ---- */
  DA.views._printExchange = (parts) => {
    const cid = parts[0];
    const cl = cid ? danisan(cid) : null;
    /* Ekranda ne varsa o basılır: bu bağlamın çalışma alanı. Eskiden danışan
       çıktısı her zaman dosyadaki planı basıyordu; düzenleme ekranındaki
       "Yazdır" başka, ekrandaki plan başka çıkıyordu. Kaydedilmemiş fark
       varsa çıktının üstünde (kâğıda basılmayan) uyarı görünür. */
    S().exClient = cl ? cl.id : null;
    const t0 = totals(counts()), T = target();
    const plan = { d: DA.today(), hedef: T, ex: counts(), meal: meals(),
      top: { kcal: Math.round(t0.kcal), c: Math.round(t0.c), p: Math.round(t0.p), f: Math.round(t0.f) } };
    if (!plan.top.kcal) return { title: 'Plan', back: cl ? 'danisan/' + cl.id : 'hesapla/degisim',
      html: DA.emptyState('swap', { baslik: 'Basılacak plan yok',
        aciklama: 'Değişim listesinde gruplara değişim ekle ya da otomatik dağıt.',
        eylem: { href: '#/hesapla/degisim' + (cl ? '?c=' + esc(cl.id) : ''), etiket: 'Değişim listesine git', ico: 'swap' } }) };
    const uyari = cl && kaydedilmemis(cl)
      ? '<div class="note warn noprint"><b>Bu plan ' + esc(cl.name) + '’in dosyasına kaydedilmedi.</b> ' +
        'Çıktı ekrandaki hâlidir; dosyadaki plan farklı.</div>' : '';
    const orn = GROUPS.filter((g) => plan.ex[g.k]).map((g) =>
      '<tr><td>' + esc(g.l) + '</td><td class="n">' + fmt(plan.ex[g.k], 1) + '</td><td>' + esc(g.ex) + '</td></tr>').join('');
    return {
      title: 'Değişim planı', tab: 'hesapla', back: cl ? 'danisan/' + cl.id : 'hesapla/degisim', noRecent: true,
      html: uyari + '<div class="noprint grid2 mb"><button class="btn block" data-act="doPrint">PDF olarak kaydet / yazdır</button>' +
        '<button class="btn ghost block" data-act="exShare">Metin olarak paylaş</button></div>' +
        '<div class="printdoc">' + DA.antet() + '<h2>Değişim listesi planı</h2>' +
        '<div class="alt">' + (cl ? esc(cl.name) + ' · ' : '') + esc(DA.fdate(plan.d)) +
        ' · hedef ' + fmt(plan.hedef.kcal, 0) + ' kcal</div>' +
        (DA.exchangePlanHtml ? DA.exchangePlanHtml(plan) : '') +
        '<div class="blok"><h3>1 değişim ne kadar?</h3>' +
        '<table><thead><tr><th>Grup</th><th class="n">Adet</th><th>Porsiyon örneği</th></tr></thead><tbody>' + orn + '</tbody></table></div>' +
        (cl && cl.avoid ? '<div class="sat"><b>Kaçınılan:</b> ' + esc(cl.avoid) + '</div>' : '') +
        DA.dipnot('bu plan bireysel tıbbi tavsiye yerine geçmez.') + '</div>'
    };
  };
  /* Kayıtta girilen birim ve iki birimdeki karşılık birlikte tutulur: plan
     yeniden açıldığında aynı birimde, rapor ise iki birimde okunabilsin. */
  function kayitHedefi(T) {
    const M = makro(T), b1 = (x) => Math.round(x * 10) / 10;
    return { kcal: T.kcal, birim: T.birim || 'yuzde',
      c: gramMi(T) ? b1(M.y.c) : T.c, p: gramMi(T) ? b1(M.y.p) : T.p,
      cg: gramMi(T) ? T.cg : b1(M.g.c), pg: gramMi(T) ? T.pg : b1(M.g.p) };
  }
  DA.actions.exSaveClient = (el) => {
    const c = danisan(el.dataset.id);
    if (!c) return DA.toast('Danışan bulunamadı');
    /* Yalnızca bu danışanın kendi çalışma alanı kaydedilir. Ekran başka bir
       bağlamdayken gelen düğme (eski bir sekme, geri tuşu) başka bir planı
       yanlış dosyaya yazmasın. */
    if (baglam() !== c.id) return DA.toast('Bu plan ' + c.name + ' için açılmamış; dosyasından yeniden aç');
    const t = totals(counts());
    if (!t.n) return DA.toast('Önce gruplara değişim ekle');
    const T = target();
    c.plan = { d: DA.today(), ts: Date.now(), hedef: kayitHedefi(T), ex: Object.assign({}, counts()),
      meal: JSON.parse(JSON.stringify(meals())),
      top: { kcal: Math.round(t.kcal), c: Math.round(t.c), p: Math.round(t.p), f: Math.round(t.f) } };
    DA.save();
    ustBilgi();
    DA.toast(c.name + ' dosyasına kaydedildi');
  };
  /* Rapor ve başka ekranlar için: kayıtlı planı okunabilir tabloya çevir */
  DA.exchangePlanHtml = (plan) => {
    if (!plan || !plan.ex) return '';
    const rows = GROUPS.filter((g) => plan.ex[g.k]).map((g) =>
      '<tr><td>' + esc(g.l) + '</td><td class="n">' + fmt(plan.ex[g.k], 1) + '</td>' +
      '<td class="n">' + fmt(plan.ex[g.k] * g.c, 0) + '</td><td class="n">' + fmt(plan.ex[g.k] * g.p, 0) + '</td>' +
      '<td class="n">' + fmt(plan.ex[g.k] * g.f, 0) + '</td></tr>').join('');
    if (!rows) return '';
    const ogun = MEALS.map((mm) => {
      const mv = (plan.meal || {})[mm[0]] || {};
      const det = GROUPS.filter((g) => mv[g.k]).map((g) => KISA[g.k] + ' ' + numText(mv[g.k])).join(', ');
      return det ? '<div class="sat"><b>' + esc(mm[1]) + ':</b> ' + esc(det) + '</div>' : '';
    }).filter(Boolean).join('');
    return '<div class="blok"><h3>Değişim listesi planı <span class="ince">' +
      esc(DA.fdate(plan.d)) + ' · hedef ' + fmt(plan.hedef.kcal, 0) + ' kcal</span></h3>' +
      '<table><thead><tr><th>Grup</th><th class="n">Değişim</th><th class="n">KH</th><th class="n">P</th><th class="n">Y</th></tr></thead>' +
      '<tbody>' + rows + '</tbody><tfoot><tr><th>Toplam</th><th></th><th class="n">' + plan.top.c + '</th>' +
      '<th class="n">' + plan.top.p + '</th><th class="n">' + plan.top.f + '</th></tr></tfoot></table>' +
      '<div class="sat"><b>Toplam enerji:</b> ' + plan.top.kcal + ' kcal</div>' +
      (ogun ? '<div class="mt-s">' + ogun + '</div>' : '') + '</div>';
  };
  DA.actions.exMenu = () => {
    if (DA.menuFromExchange) DA.menuFromExchange(counts(), GROUPS, totals(counts()));
    else DA.toast('Menü planlayıcı bulunamadı');
  };

  /* menü planlayıcının kullanması için */
  DA.exchange = { groups: GROUPS, kcalOf: kcalOf, totals: totals };
})();
