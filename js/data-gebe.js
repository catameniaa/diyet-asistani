/* TÜBER 2022 — 7.3 Gebelik ve emzirme döneminde beslenme (s. 136–139)
   Tablo 7.8 ağırlık kazanımı · 7.9 besin ögesi alım miktarları · 7.10 besin grubu porsiyonları */
(function () {
  'use strict';

  DA.data.gebe = {
    src: 'TÜBER 2022, Tablo 7.8–7.10 (s. 137–139)',

    /* Tablo 7.8 — gebelik öncesi BKİ'ye göre önerilen toplam ağırlık kazanımı (IOM) */
    kazanim: {
      t: 'Gebelikte önerilen toplam ağırlık kazanımı', ek: 'Tablo 7.8 (IOM)',
      tekil: [
        { l: 'Zayıf / düşük vücut ağırlığı', bki: '< 18,5', hi: 18.49, v: [12.5, 18] },
        { l: 'Normal vücut ağırlığı', bki: '18,5 – 24,9', lo: 18.5, hi: 24.9, v: [11.5, 16] },
        { l: 'Fazla kilolu', bki: '25,0 – 29,9', lo: 25, hi: 29.9, v: [7, 11.5] },
        { l: 'Obez', bki: '≥ 30,0', lo: 30, v: [5, 9] }
      ],
      cogul: [['İkiz gebelikler', '15,9 – 20,4 kg'], ['Üçüz gebelikler', 'En az 23 kg']],
      diger: [['Kısa boylu kadınlar (<157 cm)', 'Normal kadına göre önerilenin alt sınırı (11,5 kg)']]
    },

    /* Tablo 7.9 — yetişkin kadın / gebe / emziren günlük öneriler */
    besin: {
      t: 'Besin ögeleri için önerilen günlük alım', ek: 'Tablo 7.9',
      g: [
        ['Makro besin ögeleri', [
          ['Karbonhidrat', 'enerji %', '45–60', '45–60', '45–60'],
          ['Karbonhidrat', 'g/gün', 'en az 130', 'en az 175', 'en az 210'],
          ['Sükroz', 'enerji %', 'en fazla %10', 'en fazla %10', 'en fazla %10'],
          ['Protein', 'enerji %', '12–20', '12–20', '12–20'],
          ['Yağ', 'enerji %', '20–35', '20–35', '20–35'],
          ['Doymuş yağ', '', 'Mümkün olduğunca az', 'Mümkün olduğunca az', 'Mümkün olduğunca az'],
          ['EPA + DHA', 'mg/gün', '250', '250–350', '250–350'],
          ['Posa', 'g/gün', '25', '25', '25']
        ]],
        ['Vitaminler', [
          ['A vitamini', 'µg/gün', '650', '700', '1300'],
          ['C vitamini', 'mg/gün', '95', '105', '155'],
          ['D vitamini', 'µg/gün', '15', '15', '15'],
          ['E vitamini', 'mg/gün', '11', '11', '11'],
          ['Tiamin', 'mg/1000 kkal', '0,4', '0,4', '0,4'],
          ['Riboflavin', 'mg/gün', '1,6', '1,9', '1,2'],
          ['Niasin', 'mg/1000 kkal', '6,6', '6,6', '6,6'],
          ['B6 vitamini', 'mg/gün', '1,6', '1,8', '1,7'],
          ['B12 vitamini', 'µg/gün', '4,0', '4,5', '5,0'],
          ['Folat', 'µg/gün', '330', '600', '500']
        ]],
        ['Mineraller', [
          ['Demir', 'mg/gün', '16', '16–27', '16–27'],
          ['Kalsiyum', 'mg/gün', '950–1000', '950–1000', '950–1000'],
          ['İyot', 'µg/gün', '150', '200', '200'],
          ['Çinko', 'mg/gün', '7,5–12,7', '9,1–14,3', '10,4–15,6']
        ]]
      ],
      n: 'Riboflavin emzirme sütununda kaynakta 1,2 mg/gün yazılmıştır; yetişkin kadın değerinin (1,6) altındadır. ' +
         'Kaynaktaki değer aynen aktarılmıştır.'
    },

    /* Tablo 7.10 — besin gruplarından günlük porsiyon */
    porsiyon: {
      t: 'Besin gruplarından günlük önerilen porsiyon', ek: 'Tablo 7.10',
      r: [
        ['Süt, yoğurt, peynir', '3 porsiyon', '4 porsiyon', '4–5 porsiyon'],
        ['Et, tavuk, balık, yumurta, kuru baklagil, yağlı tohum', '2,5–3 porsiyon', '3–4 porsiyon', '4–5 porsiyon'],
        ['Ekmek ve tahıllar', '7 porsiyon', '7–8 porsiyon', '8–10 porsiyon'],
        ['Sebze ve meyveler', 'En az 5 porsiyon', 'En az 5 porsiyon', 'En az 5 porsiyon']
      ]
    },

    sut: ['19-50 yaş kadın', 'Gebe', 'Emziren'],

    not: [
      'Türkiye’de gebelik öncesi BKİ ortalaması 26,7 kg/m²’dir; kadınların büyük çoğunluğu gebeliğe fazla kilolu başlamaktadır.',
      'Ağırlık artışı sağlıksız besinlerle değil; süt ve süt ürünleri, kırmızı et ve beyaz etler, yumurta, kuru baklagiller, yağlı tohumlar ve sebze-meyve tüketimiyle sağlanmalıdır.',
      'Gebelik ve emzirmede düşük yağlı diyetler kullanılmamalıdır; artan enerji ve elzem yağ asidi gereksinimini karşılamada yetersiz kalabilir. Doymuş yağ ≤ %7-8 olmalı, tekli ve çoklu doymamış yağ asitlerine ağırlık verilmelidir.',
      'Emzirme dönemine obez olarak başlayan kadınlarda emzirme süresi ve oranı daha düşüktür. İlk 4-6 aya kadar ağırlık kaybı için aceleci olunmamalı; enerjisi düşük diyetler süt verimini etkiler.'
    ]
  };
})();
