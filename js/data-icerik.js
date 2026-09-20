/* TÜBER 2022 — Ek 3.2.1: Beslenme örüntülerinin enerji ve besin ögesi içerikleri (s. 292)
   Bazı satırlar iki değerlidir: [tam yağlı süt ürünleriyle, yarım yağlı süt ürünleriyle].
   Parantezli ikinci satır (p) ilave yağ olarak tereyağı kullanıldığı durumdur;
   ana değerler ilave yağ olarak zeytinyağı kullanıldığı duruma aittir. */
(function () {
  'use strict';

  DA.data.icerik = {
    src: 'TÜBER 2022, Ek 3.2.1 (s. 292)',
    kcal: [1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200],
    /* n: ad · u: birim · k: hedef tablosundaki karşılığı (yoksa null) · v: değerler
       değer: sayı · [tamYağlı, yarımYağlı] · null */
    r: [
      { n: 'Enerji', u: 'kkal', k: null, v: [1000, 1200, 1405, 1601, 1800, 2002, 2199, 2395, 2601, 2799, 3000, 3198] },
      { n: 'Protein', u: 'g', k: 'Protein|g/gün', v: [46, 59, 77, 84, 91, 95, 98, 102, 117, 118, 122, 127] },
      { n: 'Protein', u: '% kkal', k: null, v: [19, 20, 22, 21, 20, 19, 18, 17, 18, 17, 16, 16] },
      { n: 'Protein kalite puanı', u: 'DIAAS', k: null, v: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100] },
      { n: 'Karbonhidrat', u: 'g', k: 'Karbonhidrat|g/gün', v: [122, 142, 161, 185, 209, 237, 261, 293, 314, 340, 370, 384] },
      { n: 'Karbonhidrat', u: '% kkal', k: null, v: [49, 47, 46, 46, 46, 47, 48, 49, 48, 49, 50, 48] },
      { n: 'Lif', u: 'g', k: 'Lif|g/gün', v: [17, 17, 24, 29, 30, 35, 38, 40, 43, 45, 47, 51] },
      { n: 'Yağ', u: 'g', k: null, v: [[40, 38], [48, 46], [55, 51], [61, 60], [70, 69], [80, 78], [89, 89], [97, 94], [102, 100], [112, 110], [118, 117], [133, 131]] },
      { n: 'Yağ', u: '% kkal', k: null, v: [[35, 33], [35, 33], [34, 32], [33, 33], [34, 34], [35, 34], [36, 35], [35, 34], [34, 34], [35, 34], [34, 34], [36, 36]] },
      { n: 'Elzem kaloriler içindeki sıvı yağ katkısı', u: 'g', k: null, v: [15, 15, 15, 20, 25, 30, 35, 40, 40, 45, 50, 50] },
      { n: 'İlave yağ miktarı', u: 'g', k: null, v: [[0, 5], [0, 7], [0, 5], [0, 8], [0, 10], [4, 13], [8, 18], [10, 18], [13, 21], [17, 27], [18, 28], [23, 32]] },
      { n: 'Doymuş yağ asitleri', u: 'g', k: null, v: [[15, 10], [18, 12], [20, 13], [20, 15], [24, 17], [25, 18], [26, 19], [27, 20], [29, 21], [30, 23], [31, 24], [33, 26]],
        p: [[15, 12], [18, 15], [20, 15], [20, 18], [24, 21], [26, 23], [29, 26], [31, 27], [33, 30], [37, 34], [37, 34], [41, 39]] },
      { n: 'Doymuş yağ asitleri', u: '% kkal', k: null, v: [[13, 9], [14, 9], [12, 8], [11, 8], [12, 8], [11, 8], [11, 8], [10, 7], [10, 7], [10, 7], [9, 7], [9, 7]],
        p: [[13, 10], [14, 11], [12, 10], [11, 10], [12, 10], [12, 10], [12, 11], [12, 10], [12, 10], [12, 11], [11, 10], [12, 11]] },
      { n: 'Linoleik asit (C18:2, n-6)', u: 'g', k: null, v: [[9, 9], [10, 11], [13, 13], [15, 16], [17, 17], [20, 20], [22, 22], [24, 24], [25, 25], [26, 27], [29, 29], [31, 31]],
        p: [[10, 10], [10, 11], [13, 13], [15, 16], [17, 18], [19, 20], [22, 23], [24, 24], [25, 25], [27, 27], [29, 30], [29, 31]] },
      { n: 'Linoleik asit (C18:2, n-6)', u: '% kkal', k: null,
        v: [[8, 8], [8, 8], [8, 8], [9, 9], [8, 9], [9, 9], [9, 9], [9, 9], [8, 9], [8, 9], [9, 9], [9, 9]],
        p: [[9, 9], [8, 8], [8, 8], [9, 9], [8, 9], [9, 9], [9, 9], [9, 9], [9, 9], [9, 9], [9, 9], [8, 9]] },
      { n: 'α-linolenik asit (C18:3, n-3)', u: 'g', k: null,
        v: [[0.8, 0.8], [1.2, 1.1], [1.7, 1.6], [1.8, 1.7], [1.9, 1.8], [2, 1.9], [2.1, 2], [2.1, 2], [2.1, 2], [2.3, 2.2], [2.4, 2.3], [3.4, 3.3]] },
      { n: 'α-linolenik asit (C18:3, n-3)', u: '% kkal', k: null,
        v: [[0.7, 0.7], [0.9, 0.8], [1.1, 1.0], [1, 0.9], [0.9, 0.9], [0.9, 0.8], [0.9, 0.8], [0.8, 0.8], [0.8, 0.7], [0.7, 0.7], [0.7, 0.7], [1, 0.9]] },
      { n: 'Kolesterol', u: 'mg', k: null,
        v: [[222, 193], [257, 215], [282, 238], [282, 240], [298, 247], [298, 247], [298, 247], [298, 247], [329, 278], [329, 278], [329, 278], [329, 278]],
        p: [[227, 205], [257, 232], [282, 250], [282, 259], [298, 271], [307, 278], [317, 290], [322, 290], [360, 331], [372, 346], [372, 346], [384, 360]] },
      { n: 'Kalsiyum', u: 'mg', k: 'Kalsiyum|mg/gün', v: [762, 926, 1014, 1052, 1236, 1284, 1337, 1346, 1369, 1388, 1398, 1429] },
      { n: 'Demir', u: 'mg', k: 'Demir|mg/gün', v: [8.1, 9.1, 12.7, 14.7, 16.1, 17.7, 19.7, 20.3, 22.7, 23.3, 24.0, 25.4] },
      { n: 'Magnezyum', u: 'mg', k: 'Magnezyum|mg/gün', v: [214, 244, 313, 355, 393, 427, 474, 481, 536, 550, 558, 598] },
      { n: 'Fosfor', u: 'mg', k: 'Fosfor|mg/gün', v: [1016, 1225, 1476, 1613, 1788, 1879, 1990, 2042, 2249, 2282, 2337, 2458] },
      { n: 'Potasyum', u: 'mg', k: 'Potasyum|g/gün', kx: 1000, v: [2012, 2330, 2894, 3135, 3474, 3839, 4081, 4143, 4345, 4623, 4708, 4869] },
      { n: 'Sodyum', u: 'mg', k: 'Sodyum|mg/gün', ul: true, v: [875, 961, 1111, 1242, 1422, 1549, 1665, 1890, 2126, 2132, 2132, 2132] },
      { n: 'Çinko', u: 'mg', k: 'Çinko|mg/gün', v: [7, 8, 11, 12, 13, 14, 15, 15, 19, 19, 19, 20] },
      { n: 'Bakır', u: 'mg', k: 'Bakır|mg/gün', v: [1.06, 1.17, 1.60, 1.81, 1.93, 2.12, 2.30, 2.40, 2.64, 2.74, 2.85, 3.07] },
      { n: 'A vitamini', u: 'µg', k: 'A vitamini|µg RE/gün',
        v: [[729, 702], [747, 756], [944, 836], [1006, 961], [1180, 1073], [1639, 1516], [1887, 1766], [1893, 1769], [1902, 1778], [2197, 2074], [2175, 2054], [2193, 2071]],
        p: [[729, 727], [747, 791], [944, 861], [1006, 1001], [1180, 1123], [1659, 1581], [1927, 1855], [1943, 1858], [1966, 1888], [2254, 2183], [2265, 2194], [2307, 2243]] },
      { n: 'D vitamini', u: 'µg', k: 'D vitamini|µg/gün', v: [1.0, 1.6, 1.6, 1.7, 1.7, 1.8, 1.7, 2.0, 2.0, 2.0, 3.6, 3.6] },
      { n: 'E vitamini', u: 'mg', k: 'E vitamini|mg/gün', v: [6.4, 7.0, 8.7, 10.2, 11.5, 13.2, 14.8, 15.6, 16.4, 17.6, 18.5, 19.8] },
      { n: 'K vitamini', u: 'µg', k: 'K vitamini|µg/gün', v: [94, 150, 186, 215, 223, 243, 267, 275, 284, 302, 329, 381] },
      { n: 'C vitamini', u: 'mg', k: 'C vitamini|mg/gün', v: [83, 86, 116, 121, 130, 159, 172, 172, 172, 195, 197, 195] },
      { n: 'Tiamin', u: 'mg', k: null, v: [0.7, 0.8, 1.0, 1.1, 1.3, 1.4, 1.4, 1.5, 1.6, 1.7, 1.7, 1.8] },
      { n: 'Riboflavin', u: 'mg', k: 'Riboflavin|mg/gün', v: [1.4, 1.7, 2.0, 2.0, 2.3, 2.4, 2.5, 2.6, 2.8, 2.8, 2.9, 2.9] },
      { n: 'B6 vitamini', u: 'mg', k: 'B6 vitamini|mg/gün', v: [1.0, 1.1, 1.5, 1.6, 1.8, 1.9, 2.1, 2.2, 2.3, 2.5, 2.5, 2.7] },
      { n: 'B12 vitamini', u: 'µg', k: 'B12 vitamini|µg/gün', v: [3.2, 4.4, 5.3, 5.4, 5.9, 5.9, 5.9, 5.9, 6.9, 6.9, 6.9, 6.9] },
      { n: 'Folat', u: 'µg', k: 'Folat|µg/gün', v: [188, 207, 269, 315, 342, 384, 412, 436, 458, 477, 504, 540] },
      { n: 'Niasin', u: 'mg', k: null, v: [9, 11, 15, 18, 19, 20, 22, 22, 26, 26, 27, 27] }
    ],
    n: [
      'İki değerli satırlarda ilk değer <b>tam yağlı</b>, ikinci değer <b>yarım yağlı</b> süt, yoğurt ve peynir kullanıldığı durumu gösterir.',
      'Parantez içindeki ikinci satır ilave yağ olarak <b>tereyağı</b> kullanıldığı durumdur; ana değerler ilave yağ olarak <b>zeytinyağı</b> kullanıldığı duruma aittir.',
      'Sıvı yağ miktarı yarı yarıya zeytinyağı ve ayçiçek yağı ile hesaplanmıştır. Ayçiçek yağı yerine soya yağı kullanıldığında α-linolenik asit katkısı %1,3–1,4 düzeyine ulaşır.',
      '1000–1800 kkal örüntülerde tam yağlı süt ürünleri kullanıldığında isteğe göre tüketilen besinler için enerji açığı daha düşük olduğundan ilave yağ kullanılmamıştır.',
      'Örüntülerin besin değerleri az yağlı et ve yağlı balık tüketildiği varsayılarak hesaplanmıştır.'
    ],
    /* Ek 3.4.3 dipnotları — örüntülerin hedefleri karşılama durumu hakkında */
    karsilama: [
      'Beslenme örüntüleri <b>D vitamini hariç</b> diğer besin ögelerini yeterli düzeyde (%100’e yakın, %100 veya üzerinde) sağlamaktadır. ' +
      'Besinlerde D vitamini çok az bulunduğundan örüntülerin yeterli miktarda D vitamini sağlaması mümkün değildir; örüntüler yeterli alım miktarının ancak <b>%6–25</b>’ini karşılar.',
      'Örüntülerin besinlerden gelen <b>sodyum</b> içeriği tolere edilebilir alım miktarının altındadır.',
      '<b>Potasyumun</b> karşılanma oranı örüntünün enerji içeriği azaldıkça düşer: 2000–3200 kkal örüntüler yeterli alımın %85–100’ünü karşılarken, ' +
      'daha düşük enerji düzeylerinde oran %70’e iner.',
      '10 yaş ve üzeri çocuk ve adolesanların orta aktif olması önerildiğinden, >10 yaş için karşılama durumu hem az aktif hem orta aktif enerji harcamasına göre belirlenmiştir. ' +
      'Diğer yaş gruplarında (3200 kkal hariç) az aktif enerji harcaması esas alınmıştır.'
    ],
    karsilamaSrc: 'TÜBER 2022, Ek 3.4.3 (s. 296–299)'
  };
})();
