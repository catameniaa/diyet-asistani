/* Diyet Asistanı — tarayıcı tarafı doğrulama testleri.
   tools/test/run.js bu dosyayı açık sayfaya enjekte eder ve TEST.calis() çağırır.
   Uygulama kodunun bir parçası değildir; index.html'e eklenmez.

   İki tür test var:
   1) Hesaplayıcı testleri — bilinen girdi → bilinen çıktı. Beklenen değerler
      elle, kaynaktaki formülden hesaplanmıştır (uygulamadan türetilmemiştir).
   2) Veri bütünlük testleri — TÜBER tablolarının satır/sütun sayıları ve
      tablolar arası tutarlılık. Elle yapılan doğrulamaları kalıcılaştırır. */
(function () {
  'use strict';

  const out = [];
  const ekle = (grup, ad, bek, bul) => {
    out.push({ grup, ad, bek: String(bek), bul: String(bul), ok: String(bek) === String(bul) });
  };
  const kosul = (grup, ad, k, ayrinti) => {
    out.push({ grup, ad, bek: 'doğru', bul: k ? 'doğru' : (ayrinti || 'yanlış'), ok: !!k });
  };

  /* ---------- hesaplayıcı yardımcıları ---------- */
  const calc = (id) => DA.calcs.find((c) => c.id === id);
  function calistir(id, v) {
    const c = calc(id);
    if (!c || !c.run) return { err: 'hesaplayıcı yok: ' + id };
    return c.run(v);
  }
  /* Satırı etiketine göre bul; etiket yüzde/parantez taşıdığı için ön ek eşleşmesi yeterli */
  function deger(res, etiket) {
    if (!res || !res.rows) return '(satır yok)';
    const r = res.rows.find((x) => x.l === etiket) || res.rows.find((x) => x.l.indexOf(etiket) === 0);
    return r ? r.v : '(satır yok: ' + etiket + ')';
  }

  /* ================= 1. HESAPLAYICI TESTLERİ ================= */
  function hesapTestleri() {
    const G = 'hesap';

    /* --- BKİ: 70 kg / 1,70 m = 24,2 --- */
    let r = calistir('bki', { w: 70, h: 170 });
    ekle(G, 'BKİ 70 kg / 170 cm', '24,2 kg/m²', deger(r, 'BKİ'));
    ekle(G, 'BKİ 24,2 sınıfı', 'Normal', deger(r, 'Sınıf (WHO)'));
    ekle(G, 'BKİ 170 cm sağlıklı aralık', '53,5 – 72 kg', deger(r, 'Sağlıklı kilo aralığı'));

    r = calistir('bki', { w: 100, h: 170 });
    ekle(G, 'BKİ 100 kg / 170 cm', '34,6 kg/m²', deger(r, 'BKİ'));
    ekle(G, 'BKİ 34,6 sınıfı', 'Obez (evre I)', deger(r, 'Sınıf (WHO)'));
    ekle(G, 'BKİ 50 kg / 170 cm sınıfı', 'Zayıf', deger(calistir('bki', { w: 50, h: 170 }), 'Sınıf (WHO)'));
    ekle(G, 'BKİ 18,5 tam sınırı normal sayılır', 'Normal',
      deger(calistir('bki', { w: 18.5 * 2.89, h: 170 }), 'Sınıf (WHO)'));
    ekle(G, 'BKİ 25,0 tam sınırı fazla kilolu sayılır', 'Fazla kilolu',
      deger(calistir('bki', { w: 25 * 2.89, h: 170 }), 'Sınıf (WHO)'));

    /* --- İdeal kilo: Devine erkek 180 cm = 50 + 2,3 × (70,87 − 60) = 75,0 kg --- */
    r = calistir('ideal', { sex: 'E', h: 180 });
    ekle(G, 'Devine erkek 180 cm', '75 kg', deger(r, 'Devine'));
    ekle(G, 'Robinson erkek 180 cm', '72,6 kg', deger(r, 'Robinson'));
    ekle(G, 'Hamwi erkek 180 cm', '77,3 kg', deger(r, 'Hamwi'));
    ekle(G, 'Devine kadın 165 cm', '56,9 kg', deger(calistir('ideal', { sex: 'K', h: 165 }), 'Devine'));
    /* Düzeltilmiş kilo: ideal + 0,25 × (mevcut − ideal) = 74,99 + 0,25 × 45,01 = 86,2 */
    ekle(G, 'Düzeltilmiş kilo (E, 180 cm, 120 kg)', '86,2 kg',
      deger(calistir('ideal', { sex: 'E', h: 180, w: 120 }), 'Düzeltilmiş kilo'));

    /* --- Enerji: Mifflin–St Jeor erkek 30 y / 180 cm / 80 kg = 1780 kcal --- */
    r = calistir('enerji', { sex: 'E', age: 30, h: 180, w: 80, formula: 'mifflin', pal: '1.55', goal: '-500', cho: 50, pro: 20 });
    ekle(G, 'Mifflin BMH (E, 30 y, 180 cm, 80 kg)', '1780 kcal', deger(r, 'BMH'));
    ekle(G, 'TEH = BMH × 1,55', '2759 kcal', deger(r, 'TEH'));
    ekle(G, 'Hedef = TEH − 500', '2259 kcal/gün', deger(r, 'Hedef enerji'));
    ekle(G, 'KH %50 = 2259 × 0,5 ÷ 4', '282 g', deger(r, 'Karbonhidrat'));
    ekle(G, 'Protein %20 = 2259 × 0,2 ÷ 4', '113 g', deger(r, 'Protein'));
    ekle(G, 'Yağ %30 = 2259 × 0,3 ÷ 9', '75 g', deger(r, 'Yağ'));

    ekle(G, 'Mifflin BMH (K, 40 y, 165 cm, 65 kg)', '1320 kcal',
      deger(calistir('enerji', { sex: 'K', age: 40, h: 165, w: 65, formula: 'mifflin', pal: '1.2', goal: '0', cho: 50, pro: 20 }), 'BMH'));
    /* Harris–Benedict (revize) erkek 30 y / 180 cm / 80 kg */
    ekle(G, 'Harris–Benedict BMH (E, 30 y, 180 cm, 80 kg)', '1854 kcal',
      deger(calistir('enerji', { sex: 'E', age: 30, h: 180, w: 80, formula: 'hb', pal: '1.2', goal: '0', cho: 50, pro: 20 }), 'BMH'));
    /* Henry 2005, 30–60 yaş erkek: 11,4 × 70 + 541 × 1,75 − 137 = 1607,75 */
    ekle(G, 'Henry DEH (E, 35 y, 175 cm, 70 kg)', '1608 kcal',
      deger(calistir('enerji', { sex: 'E', age: 35, h: 175, w: 70, formula: 'henry', pal: '1.4', goal: '0', cho: 50, pro: 20 }), 'DEH (Henry 2005)'));
    /* 18 yaş altında TÜBER büyüme payı: DEH × PAL × 1,01
       Henry 10–18 y erkek: 15,6 × 32 + 266 × 1,40 + 299 = 1170,6 → × 1,6 × 1,01 */
    r = calistir('enerji', { sex: 'E', age: 10, h: 140, w: 32, formula: 'henry', pal: '1.6', goal: '0', cho: 50, pro: 20 });
    ekle(G, 'Henry çocuk DEH (E, 10 y, 140 cm, 32 kg)', '1171 kcal', deger(r, 'DEH (Henry 2005)'));
    /* TÜBER Tablo 10.2: TEH = DEH × (PAL + 0,01) — 1170,6 × 1,61 = 1884,7 */
    ekle(G, 'Çocukta TEH = DEH × (PAL + 0,01)', '1885 kcal', deger(r, 'TEH'));
    kosul(G, 'Çocukta TEH etiketinde büyüme çarpanı görünür',
      (r.rows.find((x) => x.l.indexOf('TEH') === 0) || {}).l === 'TEH (DEH × (PAL + 0,01))');
    /* Yetişkinde büyüme çarpanı uygulanmaz: 11,4 × 70 + 541 × 1,75 − 137 = 1607,75; × 1,6 = 2572,4 */
    ekle(G, 'Yetişkinde TEH = DEH × PAL (büyüme çarpanı yok)', '2572 kcal',
      deger(calistir('enerji', { sex: 'E', age: 35, h: 175, w: 70, formula: 'henry', pal: '1.6', goal: '0', cho: 50, pro: 20 }), 'TEH'));
    /* Katch–McArdle yağ yüzdesi olmadan hata vermeli */
    kosul(G, 'Katch–McArdle yağ % olmadan hata verir',
      !!calistir('enerji', { sex: 'E', age: 30, h: 180, w: 80, formula: 'katch', pal: '1.2', goal: '0', cho: 50, pro: 20 }).err);
    /* KH + protein yüzdesi 100'ü aşarsa uyarı */
    ekle(G, 'KH %70 + protein %40 uyarısı', 'bad',
      calistir('enerji', { sex: 'E', age: 30, h: 180, w: 80, formula: 'mifflin', pal: '1.2', goal: '0', cho: 70, pro: 40 }).tone);

    /* --- Sıvı --- */
    ekle(G, 'Sıvı yetişkin 70 kg (30–35 ml/kg)', '2100 – 2450 ml', deger(calistir('sivi', { w: 70, grp: 'ad' }), 'Günlük sıvı'));
    ekle(G, 'Sıvı yaşlı 60 kg (25–30 ml/kg)', '1500 – 1800 ml', deger(calistir('sivi', { w: 60, grp: 'ya' }), 'Günlük sıvı'));
    ekle(G, 'Holliday–Segar 8 kg', '800 ml', deger(calistir('sivi', { w: 8, grp: 'co' }), 'Günlük sıvı'));
    ekle(G, 'Holliday–Segar 15 kg', '1250 ml', deger(calistir('sivi', { w: 15, grp: 'co' }), 'Günlük sıvı'));
    ekle(G, 'Holliday–Segar 25 kg', '1600 ml', deger(calistir('sivi', { w: 25, grp: 'co' }), 'Günlük sıvı'));

    /* --- Enteral: 1800 kcal ÷ 1,5 kcal/ml = 1200 ml; 20 saatte 60 ml/saat --- */
    r = calistir('enteral', { kcal: 1800, dens: 1.5, prot: 6, hours: 20 });
    ekle(G, 'Enteral hacim 1800 kcal / 1,5 kcal/ml', '1200 ml/gün', deger(r, 'Formül hacmi'));
    ekle(G, 'Enteral hız 1200 ml / 20 saat', '60 ml/saat', deger(r, 'Hız'));
    ekle(G, 'Enteral protein 1200 ml × 6 g/100 ml', '72 g/gün', deger(r, 'Sağlanan protein'));

    /* --- GIR: %10 dekstroz, 6 ml/saat, 3 kg = (10 × 6) ÷ (6 × 3) = 3,33 mg/kg/dk --- */
    r = calistir('gir', { w: 3, dex: 10, rate: 6 });
    ekle(G, 'GIR %10 dekstroz 6 ml/sa 3 kg', '3,33 mg/kg/dk', deger(r, 'GIR'));
    ekle(G, 'GIR günlük dekstroz', '14 g/gün', deger(r, 'Dekstroz'));
    ekle(G, 'GIR %12,5 dekstroz 20 ml/sa 10 kg', '4,17 mg/kg/dk',
      deger(calistir('gir', { w: 10, dex: 12.5, rate: 20 }), 'GIR'));

    /* --- Kilo kaybı (Blackburn eşikleri) --- */
    ekle(G, 'Kilo kaybı 80→74 kg, 3 ay (%7,5)', 'Anlamlı kilo kaybı',
      deger(calistir('kilokaybi', { usual: 80, w: 74, per: 'm3' }), 'Değerlendirme'));
    ekle(G, 'Kilo kaybı 80→72 kg, 3 ay (%10)', 'Ciddi kilo kaybı',
      deger(calistir('kilokaybi', { usual: 80, w: 72, per: 'm3' }), 'Değerlendirme'));
    ekle(G, 'Kilo kaybı 70→66,5 kg, 1 ay (%5)', 'Anlamlı kilo kaybı',
      deger(calistir('kilokaybi', { usual: 70, w: 66.5, per: 'm1' }), 'Değerlendirme'));
    ekle(G, 'Kilo kaybı 70→69 kg, 1 ay (%1,4)', 'Anlamlı değil',
      deger(calistir('kilokaybi', { usual: 70, w: 69, per: 'm1' }), 'Değerlendirme'));
    ekle(G, 'Kilo artışı 70→73 kg', 'Kilo artışı',
      deger(calistir('kilokaybi', { usual: 70, w: 73, per: 'm1' }), 'Değerlendirme'));

    /* --- Karbonhidrat sayımı: 500 ve 1800 kuralları --- */
    r = calistir('khsayim', { gtid: 40, kh: 60, bg: 200, hedef: 100 });
    ekle(G, '500 kuralı: 500 ÷ 40', '1 Ü / 12,5 g KH', deger(r, 'İ:KH oranı'));
    ekle(G, '1800 kuralı: 1800 ÷ 40', '45 mg/dL', deger(r, 'Düzeltme faktörü'));
    ekle(G, 'Öğün bolusu 60 g ÷ 12,5', '4,8 Ü', deger(r, 'Öğün bolusu'));
    ekle(G, 'Düzeltme dozu (200 − 100) ÷ 45', '2,2 Ü', deger(r, 'Düzeltme dozu'));
    ekle(G, 'Toplam bolus', '7 Ü', deger(r, 'Toplam bolus'));
    ekle(G, 'Hekimin verdiği İ:KH oranı korunur', '1 Ü / 10 g KH',
      deger(calistir('khsayim', { ikh: 10, idf: 50, kh: 45 }), 'İ:KH oranı'));
    ekle(G, 'Kan şekeri 60 mg/dL hipoglisemi uyarısı', 'bad', calistir('khsayim', { gtid: 40, bg: 60 }).tone);
    kosul(G, 'Girdisiz karbonhidrat sayımı hata verir', !!calistir('khsayim', {}).err);

    /* --- Bel çevresi ve oranlar --- */
    r = calistir('bel', { sex: 'E', waist: 105, hip: 100, h: 180, neck: 40 });
    ekle(G, 'Bel 105 cm erkek riski', 'Yüksek risk', deger(r, 'Bel çevresi riski'));
    ekle(G, 'Bel/kalça 105/100', '1,05', deger(r, 'Bel/kalça oranı'));
    ekle(G, 'Bel/boy 105/180', '0,58', deger(r, 'Bel/boy oranı'));
    ekle(G, 'Bel 85 cm kadın riski', 'Artmış risk', deger(calistir('bel', { sex: 'K', waist: 85 }), 'Bel çevresi riski'));
    ekle(G, 'Bel 75 cm kadın riski', 'Risk düşük', deger(calistir('bel', { sex: 'K', waist: 75 }), 'Bel çevresi riski'));
    ekle(G, 'Bel 94 cm erkek tam sınırı', 'Artmış risk', deger(calistir('bel', { sex: 'E', waist: 94 }), 'Bel çevresi riski'));

    /* --- Gebelik (DRI ek enerji + IOM 2009 kazanım) --- */
    r = calistir('gebelik', { durum: 't2', h: 165, w0: 60 });
    ekle(G, 'Gebelik öncesi BKİ 60/1,65²', '22 kg/m²', deger(r, 'Gebelik öncesi BKİ'));
    ekle(G, '2. trimester ek enerji', '+340 kcal/gün', deger(r, 'Ek enerji'));
    ekle(G, '2. trimester ek protein', '+25 g/gün', deger(r, 'Ek protein'));
    ekle(G, 'Normal BKİ toplam kazanım (IOM)', '11,5–16 kg', deger(r, 'Önerilen toplam kazanım'));
    r = calistir('gebelik', { durum: 't3', h: 160, w0: 85 });
    ekle(G, '3. trimester ek enerji', '+452 kcal/gün', deger(r, 'Ek enerji'));
    ekle(G, 'Obez BKİ toplam kazanım (IOM)', '5–9 kg', deger(r, 'Önerilen toplam kazanım'));
    ekle(G, '1. trimesterde ek protein yok', '+0 g/gün',
      deger(calistir('gebelik', { durum: 't1', h: 165, w0: 60 }), 'Ek protein'));
    ekle(G, 'Laktasyon ilk 6 ay ek enerji', '+500 kcal/gün',
      deger(calistir('gebelik', { durum: 'l1', h: 165, w0: 60 }), 'Ek enerji'));

    /* --- Çocuk enerji (DRI EER) --- */
    /* 0–36 ay: 89 × kg − 100 + 22 (7–12 ay) */
    r = calistir('cocukenerji', { sex: 'E', age: 0.75, w: 9, h: NaN, pa: 'act' });
    ekle(G, 'EER bebek 9 kg (7–12 ay)', '723 kcal/gün', deger(r, 'Tahmini enerji gereksinimi'));
    ekle(G, 'Protein RDA 7–12 ay (1,2 g/kg)', '10,8 g/gün', deger(r, 'Protein RDA'));
    ekle(G, 'Sıvı 9 kg', '900 ml/gün', deger(r, 'Sıvı (Holliday–Segar)'));
    /* 3–8 yaş erkek, aktif (PA 1,26): 88,5 − 61,9×6 + 1,26×(26,7×20 + 903×1,15) + 20 */
    r = calistir('cocukenerji', { sex: 'E', age: 6, w: 20, h: 115, pa: 'act' });
    ekle(G, 'EER erkek 6 yaş 20 kg 115 cm aktif', '1718 kcal/gün', deger(r, 'Tahmini enerji gereksinimi'));
    ekle(G, 'Protein RDA 4–8 yaş (0,95 g/kg)', '19 g/gün', deger(r, 'Protein RDA'));
    kosul(G, 'Çocuk enerji 19 yaşta hata verir', !!calistir('cocukenerji', { sex: 'E', age: 19, w: 60, h: 175, pa: 'act' }).err);
    kosul(G, '3 yaş üstünde boy olmadan hata verir', !!calistir('cocukenerji', { sex: 'E', age: 5, w: 18, h: NaN, pa: 'act' }).err);

    /* --- Stres faktörü (Harris–Benedict × aktivite × stres × ateş) --- */
    r = calistir('stres', { sex: 'E', age: 50, h: 175, w: 70, akt: '1.2', stres: '1.3', ates: 39 });
    ekle(G, 'Harris–Benedict BMH (E, 50 y, 175 cm, 70 kg)', '1582 kcal', deger(r, 'BMH (Harris–Benedict)'));
    ekle(G, '25–30 kcal/kg kontrol aralığı (70 kg)', '1750–2100 kcal/gün', deger(r, 'Kontrol: 25–30 kcal/kg'));
    ekle(G, 'Protein 1,2–2,0 g/kg (70 kg)', '84–140 g/gün', deger(r, 'Protein 1,2–2,0 g/kg'));
    ekle(G, '35 kcal/kg üstünde aşırı besleme uyarısı', 'warn', r.tone);

    /* --- Glisemik yük --- */
    r = calistir('gy', { f: '', gi: 70, g: 100, kh: 30 });
    ekle(G, 'Glisemik yük 70 × 30 ÷ 100', '21', deger(r, 'Glisemik yük'));
    ekle(G, 'GL 21 sınıfı', 'Yüksek glisemik yük', (r.badge || [])[0]);
    r = calistir('gy', { f: '', gi: 50, g: 100, kh: 15 });
    ekle(G, 'Glisemik yük 50 × 15 ÷ 100', '7,5', deger(r, 'Glisemik yük'));
    ekle(G, 'GL 7,5 sınıfı', 'Düşük glisemik yük', (r.badge || [])[0]);

    /* --- Enerji referans tablosu (Ek 1.1.x) hesaplayıcıyla uyumlu mu? ---
       Kaynak DEH'i yuvarlayarak yayımladığı için %1,5 tolerans bırakılıyor. */
    if (DA.data.enerjiRef) {
      const ER = DA.data.enerjiRef;
      const ornek = [
        ['Erkek 10 yaş medyan, orta aktif', 'cocuk', 'E', (r2) => r2.y === 10 && r2.p === 'M', 1, 10, 'henry', '1.6'],
        ['Kız 14 yaş medyan, aktif', 'cocuk', 'K', (r2) => r2.y === 14 && r2.p === 'M', 2, 14, 'henry', '1.8'],
        ['Yetişkin erkek 30-39, 50. persentil, orta aktif', 'yetiskin', 'E', (r2) => r2.y === '30-39' && r2.p === 50, 1, 35, 'henry', '1.6'],
        ['Yetişkin kadın 40-49, 50. persentil, az aktif', 'yetiskin', 'K', (r2) => r2.y === '40-49' && r2.p === 50, 0, 45, 'henry', '1.4']
      ];
      ornek.forEach((o) => {
        const row = ER[o[1]][o[2]].find(o[3]);
        if (!row) { kosul(G, 'Enerji referans satırı bulundu: ' + o[0], false); return; }
        const res = calistir('enerji', { sex: o[2], age: o[5], h: row.b, w: row.w,
          formula: o[6], pal: o[7], goal: '0', cho: 50, pro: 20 });
        const hes = parseFloat(String(deger(res, 'TEH')).replace(/[^0-9]/g, ''));
        const fark = Math.abs(hes - row.teh[o[4]]) / row.teh[o[4]];
        kosul(G, 'Hesaplayıcı Ek 1.1.x ile uyumlu — ' + o[0],
          fark < 0.015, 'tablo ' + row.teh[o[4]] + ' · hesap ' + hes + ' (%' + (fark * 100).toFixed(1) + ')');
      });
    }

    /* --- Spor beslenmesi (Bölüm 8.2) --- */
    if (DA.data.sporcu) {
      /* 70 kg, yoğun antrenman (8-10 g/kg), kuvvet sporu (1,6-1,7 g/kg) */
      r = calistir('sporcu', { w: 70, yuk: '3', dal: 'kuv', kcal: NaN, sure: NaN });
      ekle(G, 'Sporcu KH 70 kg × 8–10 g/kg', '560–700 g/gün', deger(r, 'Karbonhidrat'));
      ekle(G, 'Sporcu protein 70 kg × 1,6–1,7 g/kg', '112–119 g/gün', deger(r, 'Protein'));
      ekle(G, 'Toparlanma KH 70 kg × 1–1,5 g/kg', '70–105 g', deger(r, 'Toparlanma karbonhidratı'));
      /* 70 kg, 1 saat antrenman (5-6 g/kg), dayanıklılık (1,2-1,4 g/kg) — kaynaktaki örnek */
      r = calistir('sporcu', { w: 70, yuk: '1', dal: 'day', kcal: 3000, sure: 120 });
      ekle(G, 'Sporcu KH 70 kg × 5–6 g/kg (kaynak örneği)', '350–420 g/gün', deger(r, 'Karbonhidrat'));
      ekle(G, 'Sporcu protein dayanıklılık 70 kg', '84–98 g/gün', deger(r, 'Protein'));
      /* Yağ: 3000 kkal × %20–35 ÷ 9 = 67–117 g */
      ekle(G, 'Sporcu yağ 3000 kkal × %20–35', '67–117 g/gün', deger(r, 'Yağ'));
      ekle(G, '120 dk antrenmanda egzersiz içi KH', '30–60 g', deger(r, 'Egzersiz sırasında karbonhidrat'));
      ekle(G, '40 dk antrenmanda egzersiz içi KH', 'Gerekmez',
        deger(calistir('sporcu', { w: 70, yuk: '1', dal: 'day', kcal: NaN, sure: 40 }), 'Egzersiz sırasında karbonhidrat'));
      ekle(G, '180 dk antrenmanda egzersiz içi KH', '90 g’a kadar',
        deger(calistir('sporcu', { w: 70, yuk: '3', dal: 'day', kcal: NaN, sure: 180 }), 'Egzersiz sırasında karbonhidrat'));

      /* Terleme oranı — kaynaktaki örnek: 70 → 68 kg, 90 dakika = 1,3 L/saat */
      r = calistir('terleme', { w1: 70, w2: 68, dk: 90, icilen: NaN });
      ekle(G, 'Terleme oranı (kaynak örneği: 70→68 kg, 90 dk)', '1,3 L/saat', deger(r, 'Terleme oranı'));
      ekle(G, 'Kaybın %150’si yerine konur (2 kg)', '3000 mL', deger(r, 'Yerine konacak sıvı'));
      ekle(G, '%2,9 kayıp dehidrasyon uyarısı', 'bad', r.tone);
      /* Sayılar Türkçe virgülle yazılmalı (SVG/metin karışmasın diye fmt kullanılıyor) */
      kosul(G, 'Terleme sonucunda ondalık ayırıcı virgül',
        !(r.rows || []).some((x) => /\d\.\d/.test(String(x.v) + ' ' + String(x.s || ''))),
        'noktalı değer var');
      /* İçilen sıvı ter kaybına eklenir: 1 kg kayıp + 0,5 L içilmiş = 1,5 L / 60 dk */
      ekle(G, 'İçilen sıvı terleme oranına ekleniyor', '1,5 L/saat',
        deger(calistir('terleme', { w1: 70, w2: 69, dk: 60, icilen: 500 }), 'Terleme oranı'));
      ekle(G, '%1 kayıpta uyarı yok', 'ok', calistir('terleme', { w1: 70, w2: 69.3, dk: 60, icilen: NaN }).tone);
      kosul(G, 'Terleme süresi sıfırsa hata verir', !!calistir('terleme', { w1: 70, w2: 68, dk: 0 }).err);

      /* Kullanılabilir enerji — kaynaktaki örnek: 60 kg, %15 yağ, 2800 − 1500 = 1300 ÷ 51 = 25,5 */
      r = calistir('sporke', { alim: 2800, egzersiz: 1500, w: 60, yag: 15, h: NaN });
      ekle(G, 'Yağsız kütle 60 kg × (1 − %15)', '51 kg', deger(r, 'Yağsız vücut kütlesi'));
      ekle(G, 'KE (kaynak örneği: 1300 ÷ 51)', '25,5 kcal/kg', deger(r, 'Kullanılabilir enerji'));
      ekle(G, 'KE 25,5 değerlendirmesi', 'Düşük kullanılabilir enerji (DKE)', deger(r, 'Değerlendirme'));
      ekle(G, 'KE 25,5 tonu', 'bad', r.tone);
      /* Eşikler: <30 DKE, 30-45 azalmış, ≥45 yeterli */
      ekle(G, 'KE 40 kcal/kg değerlendirmesi', 'Azalmış kullanılabilir enerji',
        deger(calistir('sporke', { alim: 3000, egzersiz: 1000, w: 60, yag: 16.67, h: NaN }), 'Değerlendirme'));
      ekle(G, 'KE 50 kcal/kg değerlendirmesi', 'Yeterli kullanılabilir enerji',
        deger(calistir('sporke', { alim: 3500, egzersiz: 1000, w: 60, yag: 16.67, h: NaN }), 'Değerlendirme'));
      ekle(G, 'BKİ 17,5 altında kesin DKE göstergesi', 'bad',
        calistir('sporke', { alim: 3500, egzersiz: 500, w: 45, yag: 12, h: 165 }).tone);
      kosul(G, 'Geçersiz yağ oranında hata verir', !!calistir('sporke', { alim: 2800, egzersiz: 1500, w: 60, yag: 0 }).err);
    }

    /* --- Çocuk persentil: WHO medyanında z = 0 --- */
    if (DA.growth) {
      const zMed = DA.growth.z('wfa', 'E', 24, DA.growth.lms('wfa', 'E', 24)[1]);
      ekle(G, 'WHO medyanında z-skoru (erkek, 24 ay, ağırlık)', '0', String(Math.round(zMed * 1e6) / 1e6));
      ekle(G, 'z = 0 persentili', '%50', DA.growth.pct(0));
    }
  }

  /* ================= 2. VERİ BÜTÜNLÜK TESTLERİ ================= */
  function veriTestleri() {
    const G = 'veri';
    const D = DA.data;
    const KCAL = [1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200];

    /* --- Ek 1.5.1–1.5.5, protein, makro: satır uzunluğu = 2 (cinsiyet, yaş) + sütun sayısı --- */
    const T = D.tuber || {};
    ['ek151', 'ek152', 'ek153', 'ek154', 'ek155', 'pro', 'makro', 'diger'].forEach((k) => {
      const t = T[k];
      if (!t) { kosul(G, 'TÜBER tablosu var: ' + k, false, 'tablo yok'); return; }
      const bozuk = t.r.filter((row) => row.length !== t.c.length + 2);
      kosul(G, 'TÜBER ' + k + ': ' + t.r.length + ' satır × ' + t.c.length + ' sütun tutarlı',
        bozuk.length === 0, bozuk.length + ' satırda sütun sayısı uyuşmuyor');
      kosul(G, 'TÜBER ' + k + ': başlıklar [ad, birim] biçiminde',
        t.c.every((c) => Array.isArray(c) && c.length === 2));
      if (t.ref) kosul(G, 'TÜBER ' + k + ': referans türü sayısı sütun sayısına eşit', t.ref.length === t.c.length);
    });

    /* --- Ek 3.1.1 örüntü: 12 enerji düzeyi --- */
    if (T.oruntu) {
      ekle(G, 'Ek 3.1.1 enerji düzeyi sayısı', 12, T.oruntu.kcal.length);
      ekle(G, 'Ek 3.1.1 enerji düzeyleri', KCAL.join(','), T.oruntu.kcal.join(','));
      const bozuk = T.oruntu.r.filter((row) => row.v && row.v.length !== 12);
      kosul(G, 'Ek 3.1.1 her satırda 12 değer', bozuk.length === 0, bozuk.length + ' satır eksik');
    }

    /* --- Ek 3.4.1/3.4.2 hedefler: her satırda sütun sayısı kadar değer --- */
    ['E', 'K'].forEach((s) => {
      const h = D.hedef && D.hedef[s];
      if (!h) { kosul(G, 'Ek 3.4 hedef tablosu var: ' + s, false); return; }
      const bozuk = h.r.filter((row) => row.v.length !== h.c.length);
      kosul(G, 'Ek 3.4 ' + s + ': ' + h.r.length + ' satır × ' + h.c.length + ' sütun tutarlı',
        bozuk.length === 0, bozuk.length + ' satırda değer sayısı uyuşmuyor');
      kosul(G, 'Ek 3.4 ' + s + ': her sütunda yaş, PAL ve enerji var',
        h.c.every((c) => c.y && Array.isArray(c.pal) && Array.isArray(c.kcal) && c.pal.length === c.kcal.length));
    });

    /* --- Ek 3.2.1 içerik: 12 enerji düzeyi, enerji satırı başlıkla uyumlu --- */
    if (D.icerik) {
      ekle(G, 'Ek 3.2.1 enerji düzeyleri', KCAL.join(','), D.icerik.kcal.join(','));
      const bozuk = D.icerik.r.filter((row) => row.v.length !== 12);
      kosul(G, 'Ek 3.2.1 her satırda 12 değer', bozuk.length === 0, bozuk.length + ' satır eksik');
      const en = D.icerik.r.find((row) => row.n === 'Enerji');
      const sapan = en ? en.v.map((v, i) => Math.abs(v - KCAL[i])).filter((d) => d > 10) : [1];
      kosul(G, 'Ek 3.2.1 enerji satırı başlıktan ±10 kkal içinde', sapan.length === 0,
        sapan.length + ' sütunda sapma');
      /* İçerik satırlarının hedef tablosundaki karşılığı gerçekten var mı */
      const hedefAdlari = {};
      ['E', 'K'].forEach((s) => (D.hedef[s].r || []).forEach((row) => { hedefAdlari[row.n + '|' + row.u] = 1; }));
      const kopuk = D.icerik.r.filter((row) => row.k && !hedefAdlari[row.k]).map((row) => row.k);
      kosul(G, 'Ek 3.2.1 → Ek 3.4 satır eşleşmeleri geçerli', kopuk.length === 0, 'eşleşmeyen: ' + kopuk.join(', '));
    }

    /* --- Ek 3.4.3 karşılama: 28 besin ögesi satırı, her sütunda 28 değer --- */
    if (D.karsilama) {
      ekle(G, 'Ek 3.4.3 besin ögesi satırı sayısı', 28, D.karsilama.r.length);
      const bozuk = D.karsilama.c.filter((col) => col[4].length !== D.karsilama.r.length);
      kosul(G, 'Ek 3.4.3 ' + D.karsilama.c.length + ' sütunun hepsinde ' + D.karsilama.r.length + ' değer',
        bozuk.length === 0, bozuk.length + ' sütun eksik');
      kosul(G, 'Ek 3.4.3 sütun başlıkları [cinsiyet, yaş, PAL, enerji]',
        D.karsilama.c.every((c) => (c[0] === 'E' || c[0] === 'K') && c[1] && c[2] && c[3] > 0));
      /* Enerji hedefini karşılama satırı her sütunda %100 civarında olmalı */
      const sapan = D.karsilama.c.filter((c) => typeof c[4][0] === 'number' && Math.abs(c[4][0] - 100) > 3);
      kosul(G, 'Ek 3.4.3 enerji karşılama her sütunda %100 ± 3', sapan.length === 0,
        sapan.length + ' sütunda sapma');
      /* Sütunların enerji düzeyi Ek 3.4.1/3.4.2 hedef tablosunda gerçekten var mı */
      const varOlan = {};
      ['E', 'K'].forEach((s) => (D.hedef[s].c || []).forEach((c) => c.kcal.forEach((k) => { varOlan[s + '|' + c.y + '|' + k] = 1; })));
      const eksik = D.karsilama.c.filter((c) => !varOlan[c[0] + '|' + c[1] + '|' + c[3]])
        .map((c) => c[0] + ' ' + c[1] + ' yaş ' + c[3] + ' kkal');
      kosul(G, 'Ek 3.4.3 sütunları Ek 3.4.1/3.4.2 ile eşleşiyor', eksik.length === 0, 'eşleşmeyen: ' + eksik.join(' · '));
    }

    /* --- Ek 2.3.1 porsiyon besin değerleri: enerji = 4P + 4KH + 9Y --- */
    if (D.porsiyonBesin) {
      const c = D.porsiyonBesin.c;
      const satirlar = [];
      D.porsiyonBesin.g.forEach((g) => g.f.forEach((f) => satirlar.push(f)));
      ekle(G, 'Ek 2.3.1 sütun sayısı', 19, c.length);
      ekle(G, 'Ek 2.3.1 besin sayısı', 97, satirlar.length);
      const bozuk = satirlar.filter((row) => row.length !== c.length + 1);
      kosul(G, 'Ek 2.3.1 ' + satirlar.length + ' besinde sütun sayısı tutarlı', bozuk.length === 0,
        bozuk.length + ' satırda uyuşmazlık');
      /* 1=porsiyon(g) 2=enerji 3=protein 4=KH 6=yağ */
      /* Yapraklı sebzelerde değerler tam sayıya yuvarlandığı için birkaç kkal'lik
         fark oransal olarak büyük görünür; bu yüzden hem oran hem mutlak eşik aranır. */
      const sapan = satirlar.filter((row) => {
        const kcal = row[2], hesap = 4 * row[3] + 4 * row[4] + 9 * row[6], fark = Math.abs(hesap - kcal);
        return kcal > 0 && fark / kcal > 0.25 && fark > 10;
      }).map((row) => row[0] + ' (' + row[2] + ' kkal)');
      kosul(G, 'Ek 2.3.1 enerji = 4P + 4KH + 9Y (±%25 ve ±10 kkal)', sapan.length === 0, 'sapan: ' + sapan.join(', '));
    }

    /* --- Ek 5.1–5.8 örnek menüler --- */
    if (D.ornekMenu) {
      ekle(G, 'Ek 5 örnek menü sayısı', 8, D.ornekMenu.m.length);
      const bos = D.ornekMenu.m.filter((m) => !m.o || !m.o.length || m.o.some((o) => !o[1] || !o[1].length));
      kosul(G, 'Her örnek menüde öğün ve besin var', bos.length === 0, bos.map((m) => m.id).join(', '));
      const kimlik = D.ornekMenu.m.map((m) => m.id);
      kosul(G, 'Örnek menü kimlikleri benzersiz', new Set(kimlik).size === kimlik.length);
    }

    /* --- Ek 2.1.1–2.1.10 porsiyon ölçüleri --- */
    if (D.porsiyon) {
      ekle(G, 'Ek 2.1 yaş grubu sayısı', 8, D.porsiyon.yas.length);
      kosul(G, 'Ek 2.1 ölçü listelerinde besin var',
        D.porsiyon.olcu.every((g) => g.f && g.f.length && g.f.every((f) => f.length === 2)));
    }

    /* --- Ek 3.3.1 eşleştirme: her satırda çocuk ve yetişkin için 3 PAL sütunu --- */
    if (D.eslestirme) {
      ekle(G, 'Ek 3.3.1 PAL sütunu sayısı', 3, D.eslestirme.pal.length);
      const bozuk = D.eslestirme.r.filter((row) => row.c.length !== 3 || row.y.length !== 3);
      kosul(G, 'Ek 3.3.1 her enerji düzeyinde 3+3 hücre', bozuk.length === 0, bozuk.length + ' satır');
      ekle(G, 'Ek 3.3.1 enerji düzeyleri', KCAL.join(','), D.eslestirme.r.map((x) => x.k).join(','));
    }

    /* --- Ek 4.8 PAL sınıfları: aralıklar artan ve bitişik --- */
    if (D.pal) {
      const s = D.pal.sinif;
      let bitisik = true;
      for (let i = 1; i < s.length; i++) if (Math.abs(s[i].r[0] - s[i - 1].r[1]) > 0.02) bitisik = false;
      kosul(G, 'PAL sınıf aralıkları bitişik', bitisik);
      kosul(G, 'PAL temsil değeri kendi aralığı içinde',
        s.every((x) => x.v >= x.r[0] && x.v <= x.r[1]));
    }

    /* --- Tablo 7.8 gebelikte kazanım bantları: BKİ eşleştirmesi (düzeltilen hata) --- */
    if (D.gebe) {
      const bul = (bki) => (D.gebe.kazanim.tekil.find((b) =>
        (b.lo == null || bki >= b.lo) && (b.hi == null || bki <= b.hi)) || {}).l;
      ekle(G, 'BKİ 17,0 gebelik bandı', 'Zayıf / düşük vücut ağırlığı', bul(17));
      ekle(G, 'BKİ 22,0 gebelik bandı', 'Normal vücut ağırlığı', bul(22));
      ekle(G, 'BKİ 27,0 gebelik bandı', 'Fazla kilolu', bul(27));
      ekle(G, 'BKİ 32,0 gebelik bandı', 'Obez', bul(32));
    }

    /* --- Tablo 7.4 bebek enerji: erkek değerleri kız değerlerinden yüksek --- */
    if (D.bebek) {
      const ters = D.bebek.enerji.r.filter((row) => {
        const k = Array.isArray(row.K) ? row.K[0] : row.K, e = Array.isArray(row.E) ? row.E[0] : row.E;
        return typeof k === 'number' && typeof e === 'number' && e < k;
      });
      kosul(G, 'Tablo 7.4 erkek enerjisi kızdan düşük değil', ters.length === 0, ters.length + ' satır');
    }

    /* --- Ek 1.1.1-1.1.4 enerji referans değerleri --- */
    if (D.enerjiRef) {
      const ER = D.enerjiRef, PALS = ER.pal.map((p) => p[0]);
      ekle(G, 'Ek 1.1.1 erkek çocuk satır sayısı', 34, ER.cocuk.E.length);
      ekle(G, 'Ek 1.1.2 kız çocuk satır sayısı', 34, ER.cocuk.K.length);
      ekle(G, 'Ek 1.1.3 yetişkin erkek satır sayısı', 30, ER.yetiskin.E.length);
      ekle(G, 'Ek 1.1.4 yetişkin kadın satır sayısı', 30, ER.yetiskin.K.length);
      /* Faktöriyel yöntem (Tablo 10.2): yetişkin DEH×PAL, çocuk DEH×(PAL+0,01) */
      let sapan = 0, bakilan = 0;
      [['cocuk', ER.buyume], ['yetiskin', 0]].forEach((g) => ['E', 'K'].forEach((s) => {
        ER[g[0]][s].forEach((row) => {
          row.teh.forEach((t, i) => {
            bakilan++;
            if (Math.abs(row.deh * (PALS[i] + g[1]) - t) > 2.5) sapan++;
          });
        });
      }));
      kosul(G, 'Ek 1.1.x: TEH = DEH × PAL bağıntısı (' + bakilan + ' hücre)', sapan === 0, sapan + ' hücre sapıyor');
      /* Her satırda boy, ağırlık, DEH makul aralıkta ve TEH artan sırada */
      const bozuk = [].concat(ER.cocuk.E, ER.cocuk.K, ER.yetiskin.E, ER.yetiskin.K).filter((r) =>
        !(r.b > 50 && r.b < 210) || !(r.w > 5 && r.w < 150) || !(r.deh > 400 && r.deh < 3000) ||
        r.teh.some((t, i) => i && t <= r.teh[i - 1]));
      kosul(G, 'Ek 1.1.x: değerler makul ve TEH sütunları artan', bozuk.length === 0, bozuk.length + ' satır');
      ekle(G, 'Ek 1.1.4 gebelik/emzirme ek enerji satırı', 4, ER.ek.r.length);
      /* Yetişkinde her yaş grubunda tam olarak 5/25/50/75/95 persentilleri olmalı */
      const bozukPct = [];
      ['E', 'K'].forEach((s) => {
        const grup = {};
        ER.yetiskin[s].forEach((r) => { (grup[r.y] = grup[r.y] || []).push(r.p); });
        Object.keys(grup).forEach((k) => {
          if (grup[k].join(',') !== '5,25,50,75,95') bozukPct.push(s + ' ' + k + ' → ' + grup[k].join(','));
        });
      });
      kosul(G, 'Ek 1.1.3/1.1.4: her yaş grubunda 5/25/50/75/95 persentili',
        bozukPct.length === 0, bozukPct.join(' · '));
      /* Çocukta her yaşta medyan ve 85. persentil satırı */
      const bozukCocuk = [];
      ['E', 'K'].forEach((s) => {
        const grup = {};
        ER.cocuk[s].forEach((r) => { (grup[r.y] = grup[r.y] || []).push(r.p); });
        Object.keys(grup).forEach((k) => {
          if (grup[k].join(',') !== 'M,P85') bozukCocuk.push(s + ' ' + k + ' yaş → ' + grup[k].join(','));
        });
      });
      kosul(G, 'Ek 1.1.1/1.1.2: her yaşta medyan ve 85. persentil',
        bozukCocuk.length === 0, bozukCocuk.join(' · '));
    }

    /* --- Tablo 10.1 / 10.2 ve Ek 1.2.2 --- */
    if (D.yontem) {
      const Y = D.yontem;
      ekle(G, 'Tablo 10.1 referans değer türü sayısı', 5, Y.drv.r.length);
      kosul(G, 'Tablo 10.1: her türde IOM, EFSA karşılığı ve tanım var',
        Y.drv.r.every((x) => x.k && x.iom && x.efsa && x.ad && x.d && x.kullan));
      const kk = Y.drv.r.map((x) => x.k);
      kosul(G, 'Tablo 10.1 kısaltmaları benzersiz', new Set(kk).size === kk.length);
      ekle(G, 'Tablo 10.2 faktöriyel yöntem satırı', 2, Y.faktoriyel.r.length);
      ekle(G, 'Ek 1.2.2 amino asit sütunu', 9, Y.aminoasit.c.length);
      const ba = Y.aminoasit.r.filter((r) => r.v.length !== Y.aminoasit.c.length);
      kosul(G, 'Ek 1.2.2 her satırda 9 amino asit', ba.length === 0, ba.length + ' satır');
      /* Örüntü yaşla azalır: bebek > 6 ay-3 yıl > 3 yaş üstü */
      const azalan = Y.aminoasit.c.every((c, i) =>
        Y.aminoasit.r[0].v[i] >= Y.aminoasit.r[1].v[i] && Y.aminoasit.r[1].v[i] >= Y.aminoasit.r[2].v[i]);
      kosul(G, 'Ek 1.2.2: amino asit gereksinimi yaşla azalıyor', azalan);
      kosul(G, 'Kısaltma listesi dolu ve ikili', Y.kisalt.length > 25 && Y.kisalt.every((k) => k.length === 2 && k[0] && k[1]));
      /* Tablo 10.1'deki kısaltmalar kısaltma listesinde de geçiyor mu */
      const liste = Y.kisalt.map((k) => k[0]);
      const eksik = kk.filter((k) => liste.indexOf(k) < 0);
      kosul(G, 'Tablo 10.1 kısaltmaları listede de tanımlı', eksik.length === 0, 'eksik: ' + eksik.join(', '));
    }

    /* --- Bölüm 8.2 spor beslenmesi verisi --- */
    if (D.sporcu) {
      const SP = D.sporcu;
      ekle(G, 'Spor KH yük kademesi', 3, SP.kh.yuk.length);
      kosul(G, 'KH yük aralıkları artan ve tutarlı',
        SP.kh.yuk.every((y, i) => y.g[0] < y.g[1] && (!i || y.g[0] >= SP.kh.yuk[i - 1].g[0])));
      ekle(G, 'Spor dalı protein aralığı', 2, SP.pro.dal.length);
      kosul(G, 'Kuvvet sporu proteini dayanıklılıktan yüksek',
        SP.pro.dal[1].g[0] > SP.pro.dal[0].g[0]);
      ekle(G, 'Kullanılabilir enerji bandı', 3, SP.ke.band.length);
      kosul(G, 'KE bantları artan sırada',
        SP.ke.band.every((b, i) => !i || b.max > SP.ke.band[i - 1].max));
      kosul(G, 'KE bantlarının hepsinde etiket, ton ve açıklama var',
        SP.ke.band.every((b) => b.l && b.tone && b.ne));
      ekle(G, 'Spor zamanlama aşaması', 4, SP.zaman.length);
      kosul(G, 'Her zamanlama aşamasında en az bir öneri', SP.zaman.every((z) => z.r && z.r.length));
      kosul(G, 'Sıvı eşikleri makul', SP.sivi.dehidrasyonEsik === 2 && SP.sivi.onceMl === 500 &&
        SP.sivi.sirasindaMl[0] < SP.sivi.sirasindaMl[1] && SP.sivi.sonrasiYuzde === 150);
      ekle(G, 'İdrar rengi kademesi', 3, SP.sivi.idrar.length);
      kosul(G, 'Besin desteği listesi ikili ve dolu',
        SP.destek.length >= 5 && SP.destek.every((d) => d.length === 2 && d[0] && d[1]));
    }

    /* --- Bölüm 8.3 vejetaryen verisi --- */
    if (D.vejetaryen) {
      const VJ = D.vejetaryen;
      ekle(G, 'Vejetaryen diyet türü sayısı', 7, VJ.tur.length);
      kosul(G, 'Her türde anahtar, ad, tanım ve risk listesi var',
        VJ.tur.every((t) => t.k && t.l && t.d && Array.isArray(t.risk)));
      const tk = VJ.tur.map((t) => t.k);
      kosul(G, 'Diyet türü anahtarları benzersiz', new Set(tk).size === tk.length);
      /* Vegan en kısıtlı tür: en çok riskli besin ögesi onda olmalı */
      const vegan = VJ.tur.find((t) => t.k === 'vegan');
      kosul(G, 'Vegan en çok riskli besin ögesine sahip',
        VJ.tur.every((t) => t.risk.length <= vegan.risk.length));
      ekle(G, 'Tablo 8.5 besin grubu sayısı', 6, VJ.porsiyon.r.length);
      kosul(G, 'Tablo 8.5 her grupta porsiyon miktarı var', VJ.porsiyon.r.every((x) => x.g && x.p));
      ekle(G, 'Dikkat edilecek besin ögesi sayısı', 7, VJ.dikkat.length);
      kosul(G, 'Dikkat listesindeki her madde açıklamalı', VJ.dikkat.every((x) => x.n && x.s));
      /* Türlerin risk listesindeki her öge, dikkat listesinde de yer almalı */
      const dikkatAd = VJ.dikkat.map((x) => x.n.split(' ')[0]);
      const kopuk = [];
      VJ.tur.forEach((t) => t.risk.forEach((x) => {
        if (dikkatAd.indexOf(x.split(' ')[0]) < 0) kopuk.push(t.k + ' → ' + x);
      }));
      kosul(G, 'Tür risk listeleri dikkat listesiyle eşleşiyor', kopuk.length === 0, kopuk.join(' · '));
      ekle(G, 'Özel grup sayısı', 4, VJ.ozel.length);
    }

    /* --- Glisemik indeks listesi --- */
    if (D.gi) {
      kosul(G, 'GI değerleri 0–150 aralığında', D.gi.every((g) => g[1] > 0 && g[1] <= 150));
      const adlar = D.gi.map((g) => g[0]);
      kosul(G, 'GI besin adları benzersiz', new Set(adlar).size === adlar.length);
    }

    /* --- WHO büyüme eğrileri: medyanda z her zaman 0 --- */
    if (DA.growth) {
      let sapan = 0, denenen = 0;
      ['wfa', 'hfa', 'bmi'].forEach((ind) => ['E', 'K'].forEach((s) => {
        for (let mo = 0; mo <= 60; mo += 6) {
          const p = DA.growth.lms(ind, s, mo);
          if (!p) continue;
          denenen++;
          if (Math.abs(DA.growth.z(ind, s, mo, p[1])) > 1e-6) sapan++;
        }
      }));
      kosul(G, 'WHO eğrileri: medyanda z = 0 (' + denenen + ' nokta)', denenen > 0 && sapan === 0, sapan + ' nokta sapıyor');
    }

    /* --- Besin veritabanı --- */
    const besinler = DA.foods && DA.foods.all ? DA.foods.all() : null;
    if (besinler) {
      const kimlik = besinler.map((f) => f.id);
      kosul(G, 'Besin kimlikleri benzersiz (' + besinler.length + ' kayıt)', new Set(kimlik).size === kimlik.length);
      const eksik = besinler.filter((f) => !(f.kcal >= 0) || !f.n);
      kosul(G, 'Her besinde ad ve enerji var', eksik.length === 0, eksik.length + ' kayıt eksik');
    }

    /* --- Bilgi mimarisi: IA ile hesaplayıcı listesi örtüşüyor --- */
    const idler = DA.calcs.map((c) => c.id);
    kosul(G, 'Hesaplayıcı kimlikleri benzersiz', new Set(idler).size === idler.length);
    const iaIdler = [];
    Object.keys(DA.IA).forEach((s) => DA.IA[s].forEach((g) => g[1].forEach((id) => iaIdler.push(id))));
    const yok = iaIdler.filter((id) => idler.indexOf(id) < 0);
    kosul(G, 'IA’daki her kimlik gerçek bir hesaplayıcı', yok.length === 0, 'eksik: ' + yok.join(', '));
    const listelenmeyen = idler.filter((id) => iaIdler.indexOf(id) < 0);
    kosul(G, 'Her hesaplayıcı bir IA grubunda listeli', listelenmeyen.length === 0,
      'listelenmeyen: ' + listelenmeyen.join(', '));
    /* Tembel yüklenen veri anahtarları tanımlı olmalı */
    const tanimsiz = DA.calcs.filter((c) => (c.data || []).some((k) => !DA.LAZY[k]))
      .map((c) => c.id);
    kosul(G, 'Hesaplayıcıların bildirdiği veri anahtarları DA.LAZY’de tanımlı',
      tanimsiz.length === 0, 'tanımsız: ' + tanimsiz.join(', '));
    /* Tüm tembel veri anahtarları yüklendikten sonra gerçekten dolu olmalı */
    const bosVeri = Object.keys(DA.LAZY).filter((k) => !DA.data[k]);
    kosul(G, 'Tembel veri anahtarlarının hepsi yüklendi', bosVeri.length === 0, 'boş: ' + bosVeri.join(', '));
  }

  window.TEST = {
    calis() {
      out.length = 0;
      try { hesapTestleri(); } catch (e) { kosul('hesap', 'hesap testleri çalıştı', false, e.message); }
      try { veriTestleri(); } catch (e) { kosul('veri', 'veri testleri çalıştı', false, e.message); }
      return out;
    }
  };
})();
