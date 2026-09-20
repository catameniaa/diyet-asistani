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
    ekle(G, 'Çocukta TEH büyüme payı ×1,01', '1892 kcal', deger(r, 'TEH'));
    kosul(G, 'Çocukta TEH etiketinde büyüme payı görünür',
      (r.rows.find((x) => x.l.indexOf('TEH') === 0) || {}).l === 'TEH (DEH × PAL × 1,01)');
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
