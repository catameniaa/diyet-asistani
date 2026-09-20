/* TÜBER 2022 — Ek 3.1.1: Enerji düzeylerine göre besin gruplarından önerilen
   günlük veya haftalık porsiyon miktarları (1000–3200 kkal), s. 290.

   Satır: { n: ad, u: birim, v: [12 enerji düzeyi için değer] }
     değer: sayı · [alt, üst] aralık · null (kaynakta okunamıyor)
     lvl 1 = ana grup, 2 = alt kırılım, 0 = yalnızca başlık satırı
   Kaynakta iki hücre dizgi hatasıyla basılmıştır (aşağıda `bug` ile işaretli);
   uydurmamak için bu hücreler boş bırakıldı. */
(function () {
  'use strict';
  const T = DA.data.tuber;

  T.oruntu = {
    t: 'Enerji düzeyine göre önerilen porsiyonlar',
    src: 'TÜBER 2022, Ek 3.1.1 (s. 290)',
    kcal: [1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200],
    /* Değişim listesi grup anahtarıyla eşleşen satırlar (kaba karşılaştırma için) */
    r: [
      { n: 'Süt, yoğurt, peynir', u: 'porsiyon/gün', lvl: 1, ex: 'sut',
        v: [2, 2.5, 2.5, 2.5, 3, 3, 3, 3, 3, 3, 3, 3],
        note: '1 kupa süt (240 mL) · 1 küçük kase yoğurt (240 mL) · 60 g beyaz peynir · 40 g kaşar peyniri' },
      { n: 'Kalsiyum EAR’ını karşılayan en az miktar', u: 'porsiyon/gün', lvl: 2,
        v: [1.5, 1.5, [1.5, 2.5], 1.5, [1.75, 2.5], [1.75, 2.5], 2.5, 2.5, 2.5, 2.5, 2.5, 2.5] },

      { n: 'Et, tavuk, balık, yumurta, kuru baklagil, yağlı tohum grubu', lvl: 0 },
      { n: 'Et, tavuk veya balık, yumurta', u: 'porsiyon/gün', lvl: 1, ex: 'et',
        v: [0.75, 1, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 2, 2, 2, 2],
        note: '150 g pişmiş balık · 2 adet yumurta · 80 g pişmiş kırmızı et veya tavuk · ¾ kupa pişmiş kuru baklagil · 30 g yağlı tohum 1 porsiyondur' },
      { n: 'Balık', u: 'porsiyon/hafta', lvl: 2, bug: [0, 2],
        v: [null, 1, null, 2, 2, 2, 2, 2, 2, 2, 2, 2] },
      { n: 'Yumurta', u: 'porsiyon/hafta', lvl: 2,
        v: [3, 3, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 3, 3, 3, 3] },
      { n: 'Kuru baklagiller', u: 'porsiyon/gün', lvl: 1,
        v: [0.125, 0.125, [0.25, 0.5], 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.6667] },
      { n: 'Kuru baklagiller', u: 'porsiyon/hafta', lvl: 2,
        v: [1, 1, 2, 3, 3, 3, 3, 3.5, 3.5, 3.5, 4, 4] },
      { n: 'Yağlı tohum, sert kabuklu yemişler', u: 'porsiyon/gün', lvl: 1, ex: 'tohum',
        v: [[0.125, 0.3333], [0.25, 0.5], [0.5, 1], [0.5, 1], [0.5, 1], [0.5, 1], [0.5, 1], [0.5, 1], [0.5, 1], [0.5, 1], [0.5, 1], [1, 1.3333]],
        note: 'Alt–üst porsiyon aralığı. İsteğe bağlı kaloriler azaltılmak istenirse üst porsiyondan tüketilir.' },

      { n: 'Ekmek ve tahıllar', u: 'porsiyon/gün', lvl: 1, ex: 'eyg',
        v: [2.5, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 7, 8, 8],
        note: '2 ince dilim veya 50 g ekmek · ½ kupa veya 1 orta kepçe pişmiş pilav-makarna 1 porsiyondur. En az yarısı tam tahıl olmalıdır.' },
      { n: 'Meyveler', u: 'porsiyon/gün', lvl: 1, ex: 'meyve',
        v: [1.5, 1.5, 2, 2, 2, 2.5, 2.5, 2.5, 2.5, 3, 3, 3],
        note: '150 g taze meyve veya 30 g kuru meyve 1 porsiyondur.' },
      { n: 'Sebzeler', u: 'porsiyon/gün', lvl: 1, ex: 'sebze',
        v: [1.25, 1.5, 2, 2.5, 2.5, 3, 3.5, 3.5, 3.5, 4, 4, 4],
        note: '150 g çiğ veya pişmiş sebze 1 porsiyondur; çiğ yaprak sebzede 75 g (1 büyük kase).' },
      { n: 'Yeşil yapraklı sebzeler', u: 'porsiyon/hafta', lvl: 2, bug: [3],
        v: [1, 1, 1, null, 2, 3, 4, 4, 4, 4, 4, 4] },
      { n: 'Diğer yeşil sebzeler', u: 'porsiyon/hafta', lvl: 2,
        v: [2, 2, [3, 4], [3, 4], [3, 4], [3, 5], [3, 5], [3, 5], [3, 5], [3, 6], [3, 6], [3, 6]] },
      { n: 'Kırmızı, turuncu, mavi, mor sebzeler', u: 'porsiyon/hafta', lvl: 2,
        v: [3, 3, 4, 5, 5, 7, 8, 8, 8, 9, 9, 9] },
      { n: 'Beyaz sebzeler', u: 'porsiyon/hafta', lvl: 2,
        v: [2, 2, [3, 4], [3, 4], [3, 4], [3, 5], [3, 6], [3, 6], [3, 6], [3, 6], [3, 6], [3, 6]] },
      { n: 'Nişastalı sebzeler', u: 'porsiyon/hafta', lvl: 2,
        v: [1, 2, 2, 3, 3, 3, 3.5, 3.5, 3.5, 6, 6, 6] },

      { n: 'Sıvı yağ', u: 'g/gün', lvl: 1, ex: 'yag',
        v: [15, 15, 15, 20, 25, 30, 35, 40, 40, 45, 50, 50],
        note: 'Örüntülerin besin değerleri zeytinyağı ile hesaplanmıştır.' },
      { n: 'İsteğe bağlı pay — yarım yağlı süt grubuyla', u: 'kat/gün', lvl: 1,
        v: [[0, 1], [1, 2], [0, 1], [0, 2], [1, 2], [2, 3], [3, 4], [3, 5], [4, 5], [5, 6], [5, 7], [7, 8]],
        note: 'Standart miktara göre kaç kat isteğe bağlı besin (şeker, tatlı, kızartma vb.) tüketilebileceğini gösterir.' },
      { n: 'İsteğe bağlı pay — tam yağlı süt grubuyla', u: 'kat/gün', lvl: 2,
        v: [0, [0, 1], 0, [0, 1], [0, 1], [0, 2], [2, 3], 3, [2, 4], [4, 5], [4, 5], [5, 6]] }
    ],
    /* Kaynaktaki dizgi hataları */
    bugs: 'Ek 3.1.1’de “Balık (porsiyon/hafta)” satırının 1000 ve 1400 kkal hücreleri kesir yerine “%” karakteriyle, ' +
          '“Yeşil yapraklı sebzeler” satırının 1600 kkal hücresi ise paydası basılmamış “1/” olarak yer alıyor. ' +
          'Bu üç hücre tahmin edilmeyip boş bırakılmıştır.'
  };
})();
