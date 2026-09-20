/* TÜBER 2022 — Ek 3.4.1 / 3.4.2: Yaş, cinsiyet ve fiziksel aktivite düzeyine göre
   enerji ve besin ögesi hedefleri (s. 294–295)
   AA = az aktif · OA = orta aktif · A = aktif

   c[] = sütunlar: { y: yaş, pal: [aktivite etiketleri], kcal: [karşılık gelen enerji] }
   r[] = satırlar: { n: ad, u: birim, v: [her sütun için değer] }
   değer: sayı · [alt, üst] aralık · metin */
(function () {
  'use strict';

  const ROWS = [
    ['Karbonhidrat', 'g/gün'], ['Karbonhidrat', '% kkal'], ['Yağ', '% kkal'],
    ['Protein kalitesi', 'DIAAS %'], ['Protein', 'g/gün'], ['Protein', '% kkal'],
    ['Linoleik asit', '% kkal'], ['α-linolenik asit', '% kkal'],
    ['Lif', 'g/gün'], ['Kalsiyum', 'mg/gün'], ['Demir', 'mg/gün'], ['Magnezyum', 'mg/gün'],
    ['Fosfor', 'mg/gün'], ['Potasyum', 'g/gün'], ['Sodyum', 'mg/gün'], ['Çinko', 'mg/gün'],
    ['Bakır', 'mg/gün'], ['A vitamini', 'µg RE/gün'], ['D vitamini', 'µg/gün'], ['E vitamini', 'mg/gün'],
    ['K vitamini', 'µg/gün'], ['C vitamini', 'mg/gün'], ['Tiamin', 'mg/1000 kkal'], ['Riboflavin', 'mg/gün'],
    ['B6 vitamini', 'mg/gün'], ['B12 vitamini', 'µg/gün'], ['Folat', 'µg/gün'], ['Niasin', 'mg/1000 kkal']
  ];
  const rep = (v, n) => new Array(n).fill(v);
  const KH = [45, 60], YAG = [20, 35], YAG_K = [35, 40];

  /* ---- Ek 3.4.1 — Erkek (22 sütun) ---- */
  const E_COL = [
    ['2', ['AA'], [1000]], ['3', ['AA'], [1200]], ['4', ['AA'], [1200]], ['5', ['AA'], [1200]],
    ['6', ['AA'], [1400]], ['7', ['AA'], [1400]], ['8', ['AA'], [1600]], ['9', ['AA'], [1600]],
    ['10', ['AA', 'OA'], [1600, 1800]], ['11', ['AA', 'OA'], [1800, 2000]], ['12', ['AA', 'OA'], [1800, 2000]],
    ['13', ['AA', 'OA'], [2000, 2200]], ['14', ['AA', 'OA'], [2200, 2400]], ['15', ['AA', 'OA'], [2400, 2600]],
    ['16', ['AA', 'OA'], [2400, 2800]], ['17', ['AA', 'OA', 'A'], [2600, 2800, 3200]],
    ['18', ['AA', 'OA', 'A'], [2600, 3000, 3200]], ['19-24', ['AA', 'OA'], [2200, 2600]],
    ['25-50', ['AA', 'OA'], [2200, 2400]], ['51-64', ['AA', 'OA'], [2000, 2200]],
    ['65-70', ['AA', 'OA'], [1800, 2200]], ['70+', ['AA', 'OA'], [1800, 2000]]
  ];
  const E_VAL = [
    rep(130, 22),
    rep(KH, 22),
    [YAG_K, YAG_K].concat(rep(YAG, 20)),
    rep(100, 22),
    [11.8, 12.9, 14.0, 15.6, 18.2, 20.8, 23.4, 25.9, 28.4, 31.5, 35.0, 39.9, 45.0, 49.8, 53.3, 55.7, 53.0, 63.1, 63.1, 65.1, 60.8, 62.3],
    rep([5, 20], 9).concat(rep([8, 20], 4), rep([9, 20], 3), rep([10, 20], 4), rep([12, 20], 2)),
    rep(4, 22),
    rep(0.5, 22),
    [10, 10, 14, 14, 14, 16, 16, 16, 16, 19, 19, 19, 19, 21, 21, 21, 25, 25, 25, 25, 25, 25],
    [450, 450].concat(rep(800, 7), rep(1150, 7), rep(1000, 3), rep(950, 3)),
    rep(7, 5).concat(rep(11, 17)),
    [170].concat(rep(230, 7), rep(300, 8), rep(350, 6)),
    [250, 250].concat(rep(440, 7), rep(640, 7), rep(550, 6)),
    [3, 3, 3.8, 3.8, 3.8, 3.8, 3.8].concat(rep(4.5, 5), rep(4.7, 10)),
    [1500, 1500].concat(rep(1900, 5), rep(2200, 5), rep(2300, 10)),
    [4.3, 4.3, 5.5, 5.5, 5.5, 7.4, 7.4, 7.4, 7.4].concat(rep(10.7, 4), rep(14.2, 3), rep([9.4, 16.3], 6)),
    [0.7].concat(rep(1, 7), rep(1.3, 8), rep(1.6, 6)),
    [250, 250, 300, 300, 300].concat(rep(400, 4), rep(600, 5), rep(750, 8)),
    rep(15, 21).concat([20]),
    [6].concat(rep(9, 7), rep(13, 14)),
    [30, 30].concat(rep(55, 5), rep(60, 5), rep(75, 5), rep(120, 5)),
    [20, 20, 30, 30, 30].concat(rep(45, 4), rep(70, 4), rep(100, 3), rep(110, 6)),
    rep(0.4, 22),
    [0.6, 0.6, 0.7, 0.7, 0.7].concat(rep(1, 3), rep(1.4, 5), rep(1.6, 9)),
    [0.6, 0.6, 0.7, 0.7, 0.7].concat(rep(1, 3), rep(1.4, 5), rep(1.7, 9)),
    rep(1.5, 5).concat(rep(2.5, 4), rep(3.5, 4), rep(4, 9)),
    [120, 120, 140, 140, 140].concat(rep(200, 4), rep(270, 4), rep(330, 9)),
    rep(6.6, 22)
  ];

  /* ---- Ek 3.4.2 — Kadın (23 sütun) ---- */
  const K_COL = [
    ['2', ['AA'], [1000]], ['3', ['AA'], [1000]], ['4', ['AA'], [1200]], ['5', ['AA'], [1200]],
    ['6', ['AA'], [1200]], ['7', ['AA'], [1400]], ['8', ['AA'], [1400]], ['9', ['AA'], [1400]],
    ['10', ['AA'], [1600]], ['11', ['AA', 'OA'], [1600, 1800]], ['12', ['AA', 'OA'], [1800, 2000]],
    ['13', ['AA', 'OA'], [1800, 2000]], ['14', ['AA', 'OA'], [1800, 2000]], ['15', ['AA'], [2000]],
    ['16', ['AA'], [2000]], ['17', ['AA'], [2200]], ['18', ['AA'], [2200]], ['19-24', ['AA'], [1800]],
    ['25-39', ['AA'], [1800]], ['40-50', ['AA', 'OA'], [1600, 1800]], ['51-64', ['AA', 'OA'], [1600, 1800]],
    ['65-70', ['AA', 'OA'], [1600, 1800]], ['70+', ['AA', 'OA'], [1400, 1600]]
  ];
  const K_VAL = [
    rep(130, 23),
    rep(KH, 23),
    [YAG_K, YAG_K].concat(rep(YAG, 21)),
    rep(100, 23),
    [11.2, 12.5, 13.8, 15.5, 18.0, 20.4, 23.0, 25.9, 29.0, 32.5, 36.6, 40.5, 43.5, 44.9, 45.9, 46.3, 47.3, 55.2, 55.2, 55.2, 63.3, 60.2, 58.0],
    rep([5, 20], 5).concat(rep([7, 20], 4), rep([9, 20], 4), rep([10, 20], 3), [[12, 20]], rep([14, 20], 6)),
    rep(4, 23),
    rep(0.5, 23),
    [10].concat(rep(14, 3), rep(16, 4), rep(19, 4), rep(21, 3), rep(25, 8)),
    [450, 450].concat(rep(800, 7), rep(1150, 7), rep(1000, 4), rep(950, 3)),
    rep(7, 5).concat(rep(11, 5), rep(13, 6), rep([11, 16], 7)),
    [170].concat(rep(230, 7), rep(250, 8), rep(300, 7)),
    [250, 250].concat(rep(440, 7), rep(640, 7), rep(550, 7)),
    [3, 3].concat(rep(3.8, 6), rep(4.5, 4), rep(4.7, 11)),
    [1500, 1500].concat(rep(1900, 5), rep(2200, 5), rep(2300, 11)),
    [4.3, 4.3, 5.5, 5.5, 5.5].concat(rep(7.4, 4), rep(10.7, 4), rep(11.9, 3), rep([7.5, 12.7], 7)),
    [0.7].concat(rep(1, 7), rep(1.1, 8), rep(1.3, 7)),
    [250, 250, 300, 300, 300].concat(rep(400, 4), rep(600, 5), rep(650, 9)),
    rep(15, 22).concat([20]),
    [6].concat(rep(9, 7), rep(11, 15)),
    [30, 30].concat(rep(55, 5), rep(60, 5), rep(75, 5), rep(90, 6)),
    [20, 20, 30, 30, 30].concat(rep(45, 4), rep(70, 4), rep(90, 3), rep(95, 7)),
    rep(0.4, 23),
    [0.6, 0.6, 0.7, 0.7, 0.7].concat(rep(1, 4), rep(1.4, 4), rep(1.6, 10)),
    [0.6, 0.6, 0.7, 0.7, 0.7].concat(rep(1, 4), rep(1.4, 4), rep(1.6, 10)),
    rep(1.5, 5).concat(rep(2.5, 4), rep(3.5, 4), rep(4, 10)),
    [120, 120, 140, 140, 140].concat(rep(200, 4), rep(270, 4), rep(330, 10)),
    rep(6.6, 22).concat([6.7])
  ];

  const mk = (cols, vals) => ({
    c: cols.map((c) => ({ y: c[0], pal: c[1], kcal: c[2] })),
    r: ROWS.map((n, i) => ({ n: n[0], u: n[1], v: vals[i] }))
  });

  DA.data.hedef = {
    src: 'TÜBER 2022, Ek 3.4.1–3.4.2 (s. 294–295)',
    pal: { AA: 'Az aktif', OA: 'Orta aktif', A: 'Aktif' },
    E: mk(E_COL, E_VAL),
    K: mk(K_COL, K_VAL),
    doymus: 'Mümkün olduğunca az',
    n: 'Enerji hedefleri Ek 1.1.1–1.1.5 ve Ek 3.3.1’den, besin ögesi hedefleri Ek 1.2.1, 1.3.1, 1.4.1, ' +
       '1.5.1–1.5.2 ve 1.5.4’ten yararlanılarak hazırlanmıştır.',
    bug: 'Kaynakta potasyum satırının birimi “mg/gün” yazılmıştır; verilen değerler (3–4,7) g/gün büyüklüğündedir. ' +
         'Tabloda g/gün olarak gösterilmiştir.'
  };

  /* ---- Ek 3.1.2 — örüntülerin elzem enerji düzeyi ve isteğe bağlı pay (s. 291) ----
     Her satır: [ana değer dizisi, parantez içi (yağlı tohum üst porsiyondan tüketildiğinde)] */
  DA.data.oruntuEnerji = {
    src: 'TÜBER 2022, Ek 3.1.2 (s. 291)',
    kcal: [1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200],
    g: [
      { t: 'Yarım yağlı / yağsız süt ve ürünleri tüketildiğinde', k: 'yy', r: [
        { n: 'Elzem enerji alt düzeyi', u: 'kkal',
          v: [936, 1073, 1312, 1482, 1635, 1790, 1897, 2069, 2237, 2330, 2504, 2640],
          p: [975, 1119, 1410, 1583, 1735, 1888, 1995, 2167, 2336, 2428, 2601, 2705] },
        { n: 'İsteğe göre tüketilen besinler için enerji açığı', u: 'kkal/gün',
          v: [64, 127, 88, 118, 165, 210, 303, 331, 363, 470, 496, 560],
          p: [25, 81, 5, 17, 65, 111, 206, 233, 264, 372, 399, 495] },
        { n: 'İlave şeker', u: 'g', v: [5, 16, 12, 12, 19, 24, 35, 44, 44, 59, 62, 69],
          p: [0, 10, 0, 5, 5, 20, 25, 30, 32, 45, 55, 55] },
        { n: 'İlave şekerin enerjiye katkısı', u: '%', v: [2, 5, 3, 3, 4, 5, 7, 7, 7, 8, 8, 9],
          p: [0, 4, 0, 1, 3, 4, 6, 6, 6, 7, 7, 8] },
        { n: 'İlave yağ', u: 'g', v: [5, 7, 5, 8, 10, 13, 18, 18, 21, 27, 28, 32],
          p: [4, 5, 0, 0, 5, 5, 12, 13, 15, 22, 24, 31] },
        { n: 'Toplam yağın enerjiye maksimum katkısı', u: '%',
          v: [33, 33, 32, 32, 34, 34, 35, 34, 33, 34, 34, 35], p: null }
      ] },
      { t: 'Tam yağlı süt ve ürünleri tüketildiğinde', k: 'ty', r: [
        { n: 'Elzem enerji alt düzeyi', u: 'kkal',
          v: [1013, 1154, 1410, 1565, 1733, 1886, 1993, 2165, 2334, 2426, 2600, 2735],
          p: [null, 1200, null, 1595, 1799, 1984, 2091, 2263, 2432, 2525, 2698, 2800] },
        { n: 'İsteğe göre tüketilen besinler için enerji açığı', u: 'kkal/gün',
          v: [0, 46, 0, 35, 67, 114, 207, 235, 266, 374, 400, 465],
          p: [0, 0, 0, 5, 0, 16, 109, 137, 168, 275, 302, 400] },
        { n: 'İlave şeker', u: 'g', v: [0, 12, 0, 10, 17, 26, 35, 35, 38, 55, 60, 65],
          p: [0, 0, 0, 0, 0, 4, 25, 25, 28, 48, 52, 65] },
        { n: 'İlave şekerin enerjiye katkısı', u: '%', v: [0, 4, 0, 3, 4, 4, 6, 6, 6, 8, 8, 8],
          p: [0, 0, 0, 0, 0, 1, 5, 4, 4, 7, 6, 8] },
        { n: 'İlave yağ', u: 'g', v: [0, 0, 0, 0, 0, 4, 9, 12, 15, 20, 21, 27],
          p: [0, 0, 0, 0, 0, 0, 0, 8, 8, 10, 12, 18] },
        { n: 'Toplam yağın enerjiye maksimum katkısı', u: '%',
          v: [35, 35, 34, 33, 34, 35, 35, 35, 34, 35, 34, 36],
          p: [null, 38, null, 35, 37, 37, 36, 36, 35, 36, 35, 36] }
      ] }
    ],
    pn: 'Parantez içindeki değerler, isteğe bağlı yağlı tohum / sert kabuklu yemişin üst porsiyon miktarından ' +
        'tüketildiği durumu gösterir.',
    n: [
      'Elzem enerji düzeyleri az yağlı / yağı ayrılmış kırmızı et veya tavuk tüketildiği varsayılarak hesaplanmıştır.',
      'Şeker miktarları TBSA 2010 medyan ve 97,5 persentil dilimde tüketim miktarlarından, şekerin enerji alım düzeyi ' +
      'içindeki payı <%10 olacak şekilde ayarlanmıştır.',
      'İlave yağ: zeytinyağı, fındık yağı, kanola yağı, tereyağı veya trans yağ içermeyen margarin çeşitleri ya da diğer bitkisel yağlar.',
      'Yağlı tohum ve sert kabuklu yemişler, isteğe bağlı tercih edilen gıdalar yerine tüketilebilecek en sağlıklı alternatiftir.'
    ]
  };
})();
