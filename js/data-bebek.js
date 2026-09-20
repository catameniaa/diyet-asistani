/* TÜBER 2022 — 7.2 Tamamlayıcı beslenme ve 0–2 yaş referans değerleri (s. 130–135)
   Tablo 7.2 besin yapısı/sıklık/miktar · 7.3 enerji yoğunluğuna göre öğün sıklığı
   Tablo 7.4 enerji ve protein · 7.5 karbonhidrat, yağ, lif, su
   Tablo 7.6 vitaminler · 7.7 mineraller
   Değer: sayı · [alt, üst] aralık · metin · null (tanımlanmamış) */
(function () {
  'use strict';

  DA.data.bebek = {
    src: 'TÜBER 2022, Tablo 7.2–7.7 (s. 130–133)',

    /* Tablo 7.4 — 6-24 aylık çocuklarda günlük enerji ve protein */
    enerji: {
      t: 'Enerji ve protein', ek: 'Tablo 7.4',
      r: [
        { y: '6-8 ay', K: [549, 599], E: [597, 661], ar: 1.12, pri: 1.31 },
        { y: '9-11 ay', K: [625, 673], E: [688, 742], ar: 1.12, pri: 1.31, ort: true },
        { y: '1 yaş', K: 712, E: 777, ar: 0.95, pri: 1.14 },
        { y: '2 yaş', K: 946, E: 1028, ar: 0.79, pri: 0.97 }
      ],
      n: 'Enerji: AR (ortalama gereksinim). Protein: AR ve PRI, g/kg/gün. 6-8 ve 9-11 ay için protein değerleri kaynakta ortaktır.'
    },

    /* Anne sütüne ek olarak tamamlayıcı besinlerden alınması gereken enerji */
    ekEnerji: [['6-8 ay', 200], ['9-11 ay', 300], ['12-24 ay', 550]],

    /* Tablo 7.2 — sunulan besinlerin yapısı, sıklığı, miktarı */
    ogun: [
      { y: '6-8 ay', kcal: 200, yapi: 'Başlangıçta muhallebi kıvamında iyi ezilmiş besinler; sonra ezilmiş aile yemekleriyle devam edilir.',
        s: '2-3 ana + 1-2 ara', m: '2-3 tatlı kaşığı ile başlanır, dereceli olarak artırılır. 125 mL' },
      { y: '9-11 ay', kcal: 300, yapi: 'İnce doğranmış, ezilmiş; bebeğin kendi eliyle kavrayıp yiyebildiği besinler.',
        s: '3-4 ana + 1-2 ara', m: '125 mL' },
      { y: '12-23 ay', kcal: 550, yapi: 'Aile besinleri verilir; gerekirse ezilir, ince doğranır.',
        s: '3-4 ana + 1-2 ara', m: '180 mL' }
    ],
    ogunN: 'Ara öğünler bebeğin iştahına bağlı olarak eklenebilir. kkal sütunu anne sütüne ek olarak tamamlayıcı besinlerden alınması gereken enerjidir.',

    /* Tablo 7.3 — enerji yoğunluğuna göre öğün sıklığı */
    yogunluk: [[0.6, '5-6'], [0.8, '4'], [1.0, '3']],

    /* Tablo 7.5 — karbonhidrat, yağ, lif ve su */
    makro: {
      t: 'Karbonhidrat, yağ, lif ve su', ek: 'Tablo 7.5',
      c: [['Toplam karbonhidrat', '% enerji', 'RI'], ['Lif', 'g/gün', 'AI'], ['Toplam yağ', '% enerji', 'AI'],
        ['Doymuş yağ', '% enerji', 'AI'], ['Linoleik asit', '% enerji', 'AI'], ['α-linolenik asit', '% enerji', 'AI'],
        ['EPA+DHA', 'mg/gün', 'AI'], ['DHA', 'mg/gün', 'AI'], ['Su (tüm içecekler)', 'L/gün', 'AI']],
      r: [
        { y: '7-11 ay', v: [null, null, 40, 'Olabildiğince az', 4, 0.5, null, 100, '0,8–1,0'] },
        { y: '1 yaş', v: [[45, 60], 10, [35, 40], 'Olabildiğince az', 4, 0.5, null, 100, '1,1–1,2'] },
        { y: '2 yaş', v: [[45, 60], 10, [35, 40], 'Olabildiğince az', 4, 0.5, 250, null, '1,3'] }
      ]
    },

    /* Tablo 7.6 — vitaminler (AI/PRI ve UL) */
    vit: {
      t: 'Vitaminler', ek: 'Tablo 7.6',
      c: [['A vitamini', 'µg', 'retinol eşdeğeri'], ['C vitamini', 'mg', ''], ['D vitamini', 'µg', '1 µg = 40 IU'],
        ['E vitamini', 'mg', 'α-tokoferol'], ['K vitamini', 'µg', ''], ['Tiamin', 'mg/MJ', ''],
        ['Riboflavin', 'mg', ''], ['Niasin', 'mg NE/MJ', ''], ['B6 vitamini', 'mg', ''],
        ['Folat', 'µg', ''], ['B12 vitamini', 'µg', ''], ['Pantotenik asit', 'mg', ''],
        ['Biotin', 'µg', ''], ['Kolin', 'mg/gün', '']],
      r: [
        { y: '7-11 ay', ai: [[190, 250], 20, 10, 5, 10, 0.1, 0.4, 1.6, 0.3, 80, 1.5, 3, 6, 160],
          ul: [null, null, 35, null, null, null, null, null, null, null, null, null, null, null] },
        { y: '12-23 ay', ai: [250, 20, 15, 6, 12, 0.1, 0.6, 1.6, 0.6, 120, 1.5, 4, 20, 140],
          ul: [800, null, 50, 100, null, null, null, 150, 5, 200, null, null, null, null] }
      ],
      n: 'Niasin UL değeri nikotinamid içindir. Kaynakta K vitamini birimi “mg” yazılmıştır; verilen büyüklükler µg’dır.'
    },

    /* Tablo 7.7 — mineraller (AI/PRI ve UL) */
    min: {
      t: 'Mineraller', ek: 'Tablo 7.7',
      c: [['Kalsiyum', 'mg', ''], ['Demir', 'mg', ''], ['Çinko', 'mg', ''], ['Magnezyum', 'mg', ''],
        ['Bakır', 'mg', ''], ['Sodyum', 'g', 'güvenli alım 1,1 g/gün'], ['Potasyum', 'mg', ''],
        ['Fosfor', 'mg', ''], ['İyot', 'µg', ''], ['Flor', 'mg', ''], ['Manganez', 'mg', ''],
        ['Molibden', 'µg', ''], ['Selenyum', 'µg', ''], ['Klor', 'g', 'güvenli alım 1,7 g/gün']],
      r: [
        { y: '7-11 ay', ai: [280, 11, 2.9, 80, 0.4, 0.2, 750, 160, 70, 0.4, [0.02, 0.5], 10, 15, 0.3],
          ul: [null, null, null, null, null, null, null, null, null, null, null, null, null, null] },
        { y: '12-23 ay', ai: [450, 7, 4.3, 170, 0.7, null, 800, 250, 90, 0.6, 0.5, 15, 15, null],
          ul: [null, null, 7, null, 1, null, null, null, 200, 1.5, null, 100, 60, null] }
      ],
      n: 'Molibden UL kaynakta 0,1 mg/gün olarak verilmiştir (100 µg).'
    },

    /* 7.2.5 — bazı tamamlayıcı besinler ve özellikleri */
    besin: [
      ['Yumurta', '6. aydan itibaren az miktarda (¼) yumurta sarısı başlanır; miktarı 2-3 gün aralıklarla artırılarak 7-10 gün içinde tam yumurta sarısına geçilir. Demirden zengindir, 6. ayda boşalmaya başlayan demir depolarını destekler.'],
      ['Et, tavuk, balık', 'Demir ve B12’den zengin. 6. aydan itibaren sebze pürelerine kıyma ya da çok küçük parçalar hâlinde eklenir. Tavuğun demirden zengin but kısmı tercih edilir. Balık kılçıksız verilir.'],
      ['İnek sütü', 'Protein-kazein ve sodyum içeriği yüksek, demir içeriği ve biyoyararlılığı düşüktür. 8. aydan sonra temel içecek olmamak kaydıyla az miktarda başlanabilir.'],
      ['Yoğurt', 'Besin değeri sütle aynıdır; bağırsak mikrobiyotasını olumlu etkiler, sindirimi kolaydır. 6. aydan itibaren verilir.'],
      ['Peynir', 'Pastörize sütten yapılmış ve tuzsuz olması koşuluyla 6. ayda küçük miktarlarda verilebilir.'],
      ['Meyve püreleri', '6. aydan sonra püre şeklinde. İlk tercih mevsimine göre elma ve şeftali; turunçgiller gaz ve alerji riski nedeniyle 8-9. aylardan sonra. Püreye şeker eklenmez.'],
      ['Sebze püreleri', '6. aydan itibaren püre şeklinde. Taze hazırlanır, bekletilmeden verilir.'],
      ['Kuru baklagiller', 'Mercimek, nohut, fasulye 7-8. aylarda sebze pürelerine ve çorbalara ezilerek eklenir, sonra doğal şekliyle verilir.'],
      ['Tahıllar', 'Katı, taneli ya da koyu kıvamda çorbalar verilebilir. Ev yemeklerine alışan bebeklere az miktarlarda pilav-makarna şeklinde verilir.'],
      ['Şeker', 'Yaşamın ilk 1 yılında şeker ve şeker eklenmiş besinler önerilmez; tat tercihlerini değiştirir ve obeziteye yol açabilir.'],
      ['Bal', '<b>1 yaşından küçük çocuklara verilmez.</b> Clostridium botulinum sporları içerebilir; süt çocuklarının mide asidi düzeyi bu sporları öldürmeye yetmez (botulizm riski).'],
      ['Pekmez', 'Demir ve kalsiyumdan zengindir, tatlandırıcı olarak kullanılabilir.'],
      ['Meyve suyu', '1 yaşından küçüklere meyve suyu yerine meyve püresi önerilir. 1-3 yaşta taze meyve suyu 120 mL/gün ile sınırlanır.'],
      ['Su', 'İlk 6 ayda su gereksinimi anne sütüyle karşılanır. 6-12 aylık dönemde günde 1-2 su bardağı kaynatılıp soğutulmuş temiz su verilebilir.'],
      ['İşlenmiş et ürünleri', 'Sucuk, salam, sosis vb. tamamlayıcı beslenmede yer almaz.']
    ],

    /* Öneriler listesi */
    oneri: [
      'Tamamlayıcı beslenme döneminde bebek, ilk 6 ayda olduğu gibi isteğe bağlı sık sık emzirilir. Emzirme 2 yaş ve sonrasına kadar sürdürülür.',
      'Tamamlayıcı besinlere 6. ayda 1-2 tatlı kaşığı ile başlanır; zaman içinde miktarı, tolere ettikçe çeşidi artırılır.',
      'Besinler bebek açken, gündüz saatlerinde ve 3-5 gün ara ile başlanır. Bir seferde birden fazla besin başlanmaz. Bebek tadı beğenmediyse ya da ishal-kusma olduysa kısa bir aradan sonra tekrar denenir.',
      'Kaşık ya da bardakla beslenme yöntemi kullanılır; bebeğin her öğünde aktif olarak yemesi sağlanır.',
      'Alerjen besinler (yumurta, balık vb.) ve gluten içeren besinler, tamamlayıcı beslenme döneminin herhangi bir zamanında (6-12 ay) başlanabilir.',
      'İki saat içinde tüketilmeyen besinler buzdolabında tutulur.',
      'Bebek hastalandığında hastalık süresince ve sonrasında normalden daha fazla emzirilir; sıvı alımı ve öğün sayısı artırılır.',
      'Yeterli ve dengeli beslenmenin en iyi göstergesi referanslara uygun büyüme ve gelişmedir; ağırlık ve boy büyüme eğrileriyle izlenir.'
    ]
  };
})();
