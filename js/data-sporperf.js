/* Spor beslenmesi — performans, vücut bileşimi ve takviye verileri.
   TÜBER 2022 Bölüm 8.2'nin (js/data-sporcu.js) vermediği ayrıntılar için.

   Kaynaklar:
   [ACSM]  Thomas DT, Erdman KA, Burke LM. Position of the Academy of Nutrition
           and Dietetics, Dietitians of Canada, and the American College of
           Sports Medicine: Nutrition and Athletic Performance.
           J Acad Nutr Diet 2016;116(3):501–528. doi:10.1016/j.jand.2015.12.006
           — Tablo 1 (günlük karbonhidrat), Tablo 2 (akut yakıt stratejileri),
             protein bölümü.
   [IOC]   Maughan RJ, Burke LM, ve ark. IOC consensus statement: dietary
           supplements and the high-performance athlete.
           Br J Sports Med 2018;52(7):439–455. doi:10.1136/bjsports-2018-099027
           — Tablo 3 (performansı doğrudan artıran takviyeler).
   [DW]    Durnin JVGA, Womersley J. Br J Nutr 1974;32:77–97, Tablo 5
           (s. 86–87): dört deri kıvrımı (biseps, triseps, subskapular,
           suprailiak) toplamının log10'undan vücut yoğunluğu.
   [JP]    Jackson AS, Pollock ML. Br J Nutr 1978;40:497–504 (erkek, 3 ve 7
           bölge); Jackson AS, Pollock ML, Ward A. Med Sci Sports Exerc
           1980;12:175–181 (kadın, 3 ve 7 bölge).
   [Siri]  Siri WE 1961: % yağ = 495 / yoğunluk − 450.

   Değerler kaynak metinden; hiçbiri uygulama içinde türetilmedi. */
(function () {
  'use strict';

  DA.data.sporperf = {
    /* [ACSM] Tablo 1 — antrenman yüküne göre günlük karbonhidrat (g/kg/gün).
       "Hafif" bandı düşük şiddetli ve beceri temelli çalışmayı kapsar;
       dinlenme günü için de bu band kullanılır. */
    khGun: [
      { k: 'hafif', l: 'Dinlenme / hafif', d: 'Düşük şiddet ya da beceri çalışması', g: [3, 5] },
      { k: 'orta', l: 'Orta', d: 'Günde yaklaşık 1 saat orta şiddet', g: [5, 7] },
      { k: 'yuksek', l: 'Yüksek', d: 'Günde 1–3 saat orta-yüksek şiddet', g: [6, 10] },
      { k: 'cokyuksek', l: 'Çok yüksek', d: 'Günde 4–5 saatten fazla orta-yüksek şiddet', g: [8, 12] }
    ],

    /* [ACSM] protein: günlük 1,2–2,0 g/kg; anahtar antrenmandan sonra ve
       gün boyunca 3–5 saatte bir 0,3 g/kg. */
    protein: { gun: [1.2, 2.0], doz: 0.3, araSaat: [3, 5] },

    /* [ACSM] Tablo 2 — akut yakıt stratejileri */
    yakit: {
      genel: { g: [7, 12], n: '90 dakikadan kısa müsabakaya hazırlık: 24 saatlik günlük yakıt gereksinimi.' },
      yukleme: { g: [10, 12], saat: [36, 48], esikDk: 90,
        n: '90 dakikadan uzun, kesintisiz ya da aralıklı müsabaka öncesi karbonhidrat yüklemesi.' },
      once: { g: [1, 4], saat: [1, 4], n: 'Müsabakadan 1–4 saat önce; tür, miktar ve zamanlama sporcunun denediğine göre.' },
      sirasinda: [
        { maxDk: 45, l: 'Gerekmez' },
        { maxDk: 75, l: 'Az miktarda karbonhidrat ya da ağızda çalkalama' },
        { maxDk: 150, l: 'Saatte 30–60 g', gSaat: [30, 60] },
        { maxDk: 99999, l: 'Saatte 90 g’a kadar', gSaat: [0, 90] }
      ],
      hizli: { gSaat: [1.0, 1.2], ilkSaat: 4, aralikEsik: 8,
        n: 'İki yorucu seans arası 8 saatten kısaysa: ilk 4 saat boyunca saatte 1,0–1,2 g/kg, sonra günlük gereksinime dönülür.' }
    },

    /* [IOC] Tablo 3 — kanıtı yeterli görülen performans takviyeleri.
       kg: vücut ağırlığına göre doz aralığı; sabit: kiloya bağlı olmayan doz. */
    takviye: [
      { k: 'kafein', l: 'Kafein', kanit: 'İyi kanıt',
        kg: [3, 6], birim: 'mg',
        p: 'Susuz kafein (tablet ya da toz) olarak egzersizden ~60 dakika önce.',
        alt: 'Daha düşük doz (<3 mg/kg, ~200 mg) egzersiz öncesinde ve sırasında, karbonhidrat kaynağıyla birlikte.',
        y: '9 mg/kg ve üzeri dozlar yarar eklemeden bulantı, kaygı, uykusuzluk ve huzursuzluk riskini artırır.' },
      { k: 'kreatin', l: 'Kreatin monohidrat', kanit: 'İyi kanıt',
        sabit: 'Yükleme: ~20 g/gün, 4 eşit doza bölünerek 5–7 gün · İdame: 3–5 g/gün tek doz',
        p: 'Karışık protein/karbonhidrat kaynağıyla birlikte alınması kas alımını artırabilir.',
        y: 'Uygun protokolle uzun süreli kullanımda (4 yıla kadar) olumsuz sağlık etkisi bildirilmemiş. Çoğu sudan oluşan '
          + '~1–2 kg ağırlık artışı, vücut ağırlığının önemli olduğu dallarda sorun olabilir.' },
      { k: 'nitrat', l: 'Nitrat', kanit: 'İyi kanıt',
        sabit: '5–9 mmol (310–560 mg) nitrat, egzersizden 2–3 saat önce',
        p: 'Yeşil yapraklı ve kök sebzeler (ıspanak, roka, kereviz, pancar) nitrattan zengindir. 3 günden uzun düzenli alım da yararlı görünür.',
        y: 'Az yan etki; duyarlı sporcularda mide-bağırsak yakınması olabilir, önce antrenmanda denenmeli.' },
      { k: 'bikarbonat', l: 'Sodyum bikarbonat', kanit: 'İyi kanıt',
        kg: [0.2, 0.4], birim: 'g',
        p: 'Tek doz, egzersizden 60–150 dakika önce. Alternatif: müsabakadan önceki 2–4 gün, günde 3–4 küçük doz.',
        y: 'Mide-bağırsak sıkıntısı iyi bilinir ve yararı ortadan kaldırabilir. Küçük, karbonhidratlı bir öğünle almak, '
          + 'sodyum sitrat kullanmak ya da dozu bölmek önerilir.' },
      { k: 'betaalanin', l: 'Beta-alanin', kanit: 'Olası yarar',
        kg: [65, 65], birim: 'mg', gunluk: true,
        p: 'Günlük ~65 mg/kg, bölünmüş dozlarla (3–4 saatte bir 0,8–1,6 g), 10–12 hafta.',
        y: 'Deride döküntü ve geçici karıncalanma (parestezi) olabilir.' }
    ],
    takviyeN: 'Takviyeler yetersiz beslenmeyi telafi etmez. Ürün doping maddesiyle kontamine olabilir; bağımsız test '
      + 'edilmiş ürün seçilmeli ve protokol önce antrenmanda denenmelidir (IOC 2018). Kişisel risk-yarar değerlendirmesi '
      + 'olmadan, özellikle genç sporcularda, kullanılmamalıdır (TÜBER 2022, 8.2.5).',

    /* Deri kıvrımı denklemleri */
    dw: {
      /* [DW] Tablo 5: yoğunluk = c − m · log10(dört kıvrım toplamı).
         Yaş aralıkları kaynaktaki örneklemle sınırlı: erkek 17–72, kadın 16–68. */
      E: [{ min: 17, max: 19, c: 1.1620, m: 0.0630 }, { min: 20, max: 29, c: 1.1631, m: 0.0632 },
        { min: 30, max: 39, c: 1.1422, m: 0.0544 }, { min: 40, max: 49, c: 1.1620, m: 0.0700 },
        { min: 50, max: 72, c: 1.1715, m: 0.0779 }],
      K: [{ min: 16, max: 19, c: 1.1549, m: 0.0678 }, { min: 20, max: 29, c: 1.1599, m: 0.0717 },
        { min: 30, max: 39, c: 1.1423, m: 0.0632 }, { min: 40, max: 49, c: 1.1333, m: 0.0612 },
        { min: 50, max: 68, c: 1.1339, m: 0.0645 }]
    },
    /* [JP] yoğunluk = a − b·Σ + c·Σ² − d·yaş */
    jp: {
      E3: { a: 1.10938, b: 0.0008267, c: 0.0000016, d: 0.0002574, yas: [18, 61], bolge: ['gogus', 'abdominal', 'uyluk'] },
      K3: { a: 1.0994921, b: 0.0009929, c: 0.0000023, d: 0.0001392, yas: [18, 55], bolge: ['triseps', 'suprailiak', 'uyluk'] },
      E7: { a: 1.112, b: 0.00043499, c: 0.00000055, d: 0.00028826, yas: [18, 61],
        bolge: ['gogus', 'aksiller', 'triseps', 'subskapular', 'abdominal', 'suprailiak', 'uyluk'] },
      K7: { a: 1.097, b: 0.00046971, c: 0.00000056, d: 0.00012828, yas: [18, 55],
        bolge: ['gogus', 'aksiller', 'triseps', 'subskapular', 'abdominal', 'suprailiak', 'uyluk'] }
    },
    siri: [495, 450]
  };
})();
