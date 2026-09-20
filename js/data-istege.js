/* TÜBER 2022 — Ek 2.1.11: İsteğe bağlı tercih edilen besinlerin enerji değerlerinin
   standart enerji değerine göre katları (s. 272–273). 1 standart miktar = 75 kkal.
   Ek 2.1.12: Yağlı tohum ve sert kabuklu yemişlerin porsiyon karşılıkları (s. 274).

   kat: sayı ya da [alt, üst] aralık — belirtilen miktar tüketildiğinde 75 kkal'in kaç katı. */
(function () {
  'use strict';

  DA.data.istege = {
    src: 'TÜBER 2022, Ek 2.1.11 (s. 272–273)',
    birim: 75,
    g: [
      { t: 'Sürülebilirler, tatlandırıcılar', f: [
        { n: 'Tereyağı', m: [['1 tatlı kaşığı silme / 5 g', 0.5], ['1 tatlı kaşığı dolu / 15 g', 1.5],
          ['1 yemek kaşığı silme / 8-9 g', 1], ['1 piknik paket / 15 g', 1.5], ['1 piknik paket / 20 g', 2]] },
        { n: 'Kaymak', m: [['5 tatlı kaşığı silme / 25 g', 2], ['1 tatlı kaşığı dolu / 15 g', 1],
          ['1 yemek kaşığı silme / 8-9 g', 0.6667], ['1 yemek kaşığı dolu / 25 g', 2]] },
        { n: 'Krema (sıvı)', m: [['1 kupa / 238 g', 11], ['1 kupa çırpılmış / 120 g', 6],
          ['1 yemek kaşığı / 15 g', 0.75], ['3 tatlı kaşığı / 25 g', 1]] },
        { n: 'Kahve kreması (toz)', m: [['2 tatlı kaşığı silme / 5 g', 0.3333]] },
        { n: 'Bal', m: [['2 tatlı kaşığı / 6 g', 0.5], ['1 yemek kaşığı / 15 g', 0.6667], ['1 piknik paket / 25 g', 1]] },
        { n: 'Reçel', m: [['4 tatlı kaşığı / 30 g', 1], ['1 yemek kaşığı / 15 g', 0.5], ['1 piknik paket / 30 g', 1]] },
        { n: 'Şeker', m: [['5 tatlı kaşığı silme / 20 g', 1], ['1 tatlı kaşığı dolu / 10 g', 0.5],
          ['2½ yemek kaşığı silme / 20 g', 0.5], ['1 yemek kaşığı dolu / 20 g', 1]] },
        { n: 'Pekmez', m: [['1 tatlı kaşığı / 8-9 g', 0.3333], ['3 tatlı kaşığı / 27 g', 1], ['1 yemek kaşığı / 17-18 g', 0.6667]] },
        { n: 'Fındık ezmesi', m: [['1 tatlı kaşığı silme / 8-9 g', 0.5], ['1 tatlı kaşığı dolu / 25 g', 1],
          ['1 yemek kaşığı silme / 15 g', 1], ['1 yemek kaşığı dolu / 37-38 g', 2.5], ['1 piknik paket / 15 g', 1]] },
        { n: 'Tahin / pekmez', m: [['1 piknik paket / 20 g', 1]] },
        { n: 'Tahin helva', m: [['1 piknik paket / 20 g', 1]] },
        { n: 'Çikolata', m: [['3 küçük parça / 15 g', 1]] },
        { n: 'Cezerye', m: [['1 küçük paket / 50 g', 1]] }
      ] },

      { t: 'Dondurmalar', f: [
        { n: 'Mini çubuk dondurma', m: [['60-70 mL', 2]] },
        { n: 'Büyük çubuk dondurma', m: [['75-85 mL', 4]] },
        { n: 'Küçük külah dondurma', m: [['100-120 mL', [2.5, 3]]] },
        { n: 'Büyük külah dondurma', m: [['160 mL', 4]] },
        { n: 'Mini kupada dondurma', m: [['100 mL', 2]] },
        { n: 'Mini sandviç dondurma', m: [['60 mL', 1]] },
        { n: 'Büyük sandviç dondurma', m: [['145 mL', 3]] },
        { n: 'Maraş dondurma', m: [['2 top / 80-90 g', 2]] },
        { n: 'Kesme Maraş dondurma', m: [['2 dilim / 100 g', 2.5]] }
      ] },

      { t: 'Pastane ürünleri — tuzlular', f: [
        { n: 'Galeta', m: [['3 adet küçük / 15 g', 1]] },
        { n: 'Tuzlu kuru pasta', m: [['1 adet / 15-20 g', 1]] },
        { n: 'Susamlı çubuk', m: [['2 adet / 15 g', 1]] },
        { n: 'Susamlı küçük simit', m: [['1 adet / 15-17 g', 1]] },
        { n: 'Pastane simiti (büyük)', m: [['1 adet / 60-90 g', [3, 5]]] },
        { n: 'Açma, börek çeşitleri', m: [['1 adet / 20-90 g', [1, 4]]] },
        { n: 'Kol böreği, Karaköy böreği', m: [['1 adet / 120 g', 6]] },
        { n: 'Talaş böreği', m: [['1 adet / 135 g', 8]] },
        { n: 'Su böreği', m: [['2 dilim / 110-160 g', [4, 6]]] },
        { n: 'Sebzeli veya kıymalı börek', m: [['2 dilim / 150 g', [6, 7]]] },
        { n: 'Poğaça çeşitleri', m: [['1 adet / 75-100 g', [4, 5]]] },
        { n: 'Paskalya', m: [['1 adet / 215-225 g', [6, 12]]] },
        { n: 'Küçük pizza', m: [['1 adet / 20 g', 1]] }
      ] },

      { t: 'Pastane ürünleri — tatlılar', f: [
        { n: 'Tatlı kuru pastalar (karışık)', m: [['1 adet / 10-20 g', [1, 2]]] },
        { n: 'Tahinli çörek', m: [['1 adet, 20 cm çapında / 300 g', [18, 20]]] },
        { n: 'Koko', m: [['4 adet / 80-100 g', [5, 7]]] },
        { n: 'Beze', m: [['4 adet / 20 g', 1]] },
        { n: 'Ay çöreği', m: [['1 adet / 90-115 g', [4, 7]]] },
        { n: 'Baklava', m: [['3 adet / 75-120 g', [4, 7]]] },
        { n: 'Kuru baklava', m: [['3 adet / 130-150 g', [8, 9]]] },
        { n: 'Fıstıklı sarma', m: [['4 adet / 75-130 g', [4, 6]]] },
        { n: 'Fıstık ezmesi (tatlı)', m: [['1 adet / 15 g', 1]] },
        { n: 'Padişah tatlısı', m: [['4 adet / 120-140 g', [7, 8]]] },
        { n: 'Sarığı burma', m: [['1 adet / 30-35 g', 3]] },
        { n: 'Şöbiyet', m: [['3 adet / 130 g', 6]] },
        { n: 'Bülbül yuvası', m: [['5 adet / 70 g', 4]] },
        { n: 'Havuç dilimi', m: [['1 dilim / 100 g', 5]] },
        { n: 'Güllü baklava', m: [['1 adet / 60-90 g', [4, 5]]] },
        { n: 'Küçük ekler pasta', m: [['3-4 adet / 90-110 g', [4, 5]]] },
        { n: 'Kadayıf', m: [['1 dilim / 140-160 g', [6, 7]]] },
        { n: 'Künefe', m: [['1 dilim / 100 g', 4]] },
        { n: 'Yaş pasta', m: [['2 kibrit kutusu büyüklüğü / 50 g', 2], ['1 dilim veya tek kişilik ürün / 150 g', 6]] },
        { n: 'Tulumba tatlısı', m: [['3 adet / 100 g', 4]] },
        { n: 'Profiterol', m: [['2 adet / 120 g', 5]] }
      ] },

      { t: 'Paketli bisküvi, kek, kraker, gofret, barlar', f: [
        { n: 'Pötibör bisküvi, finger vb. sade bisküviler', m: [['3 adet / 20 g', 1]] },
        { n: 'Kakao veya kakao droplu bisküviler', m: [['2-2½ adet / 17 g', 1]] },
        { n: 'Kremalı sandviç bisküviler', m: [['2 adet / 15-20 g', [1, 1.3333]]] },
        { n: 'Bebe bisküvisi', m: [['4 adet / 17 g', 1]] },
        { n: 'Fındıklı kurabiye', m: [['2-2½ adet / 15 g', 1]] },
        { n: 'Kepekli veya tam buğday unlu bisküviler', m: [['2 adet / 14-18 g', [1, 1.3333]]] },
        { n: 'Kek', m: [['1 adet / 40-45 g', 2.5], ['1 kibrit kutusu büyüklüğünde / 15 g', 1]] },
        { n: 'Gofret', m: [['1 parmak kalınlığında 4 küçük veya 2 büyük / 16 g', 1]] },
        { n: 'Çikolata kaplamalı bar, gofret, bisküvi', m: [['1 adet / 40-45 g', 3]] },
        { n: 'Tuzlu çubuk kraker', m: [['16-17 adet / 18 g', 1]] },
        { n: 'Susamlı çubuk kraker', m: [['4 adet / 16 g', 1]] },
        { n: 'Peynirli kraker', m: [['11-12 küçük veya 5 büyük / 16 g', 1]] },
        { n: 'Peynir kremalı kraker', m: [['2 adet / 16 g', 1]] },
        { n: 'Balık kraker', m: [['24-25 adet / 16 g', 1]] },
        { n: 'Kepekli kraker', m: [['4 adet / 18 g', 1]] }
      ] },

      { t: 'Cafe ürünleri', f: [
        { n: 'Caffè latte (yağsız veya yağlı sütlü)', m: [['1 kupa / 240 mL', [1, 1.5]]] },
        { n: 'Cappuccino (yağsız veya yağlı sütlü)', m: [['1 kupa / 240 mL', [0.75, 1.25]]] },
        { n: 'Caffè mocha, kremalı', m: [['1 kupa / 240 mL', [2, 2.5]]] },
        { n: 'White chocolate mocha', m: [['240 mL', [3, 3.5]]] },
        { n: 'Filtre kahve', m: [['1 kupa / 240 mL', 0]] },
        { n: 'Buzlu caffè latte (yağsız sütlü)', m: [['1½ kupa / 360 mL', [1, 1.5]]] },
        { n: 'Buzlu karamel macchiato (yağsız sütle)', m: [['360 mL', 1]] },
        { n: 'Cookie çeşitleri', m: [['1 adet / 80-90 g', [5, 6]]] },
        { n: 'Kruvasan çeşitleri', m: [['1 adet / 50-100 g', [3, 5]]] },
        { n: 'Muffin çeşitleri', m: [['1 adet / 130-140 g', 7]] },
        { n: 'Kek çeşitleri', m: [['1 büyük dilim / 130-150 g', [6, 7]]] },
        { n: 'Waffle', m: [['1 adet / 75 g', 5]] },
        { n: 'Pasta çeşitleri', m: [['1 dilim / 130-160 g', [6, 7]]] },
        { n: 'Brownie / ıslak kek', m: [['1 dilim / 75-160 g', [5, 10]]] },
        { n: 'Cheesecake çeşitleri', m: [['1 dilim / 175-200 g', 9]] },
        { n: 'Sandviç çeşitleri', m: [['1 adet / 160-180 g', [6, 7]]] },
        { n: 'Cup cake', m: [['1 adet büyük, dolgusuz veya dolgulu / 120-150 g', [7, 8]], ['1 adet küçük / 20-25 g', 1]] }
      ] },

      { t: 'Cipsler', f: [
        { n: 'Klasik cips', m: [['½ kase, 6-7 adet / 15 g', 1]] },
        { n: 'Soğan halkası', m: [['½ kase, 6-7 adet / 15 g', 1]] },
        { n: 'Fırında cips', m: [['½ kase, 6-7 adet / 15 g', 1]] }
      ] },

      { t: 'Şeker eklenmiş tüm içecekler', f: [
        { n: 'Şeker eklenmiş içecekler', m: [['½ kupa / 125 g', 1]] }
      ], n: 'Enerji içecekleri, gazlı içecekler, aromalı içecekler (soğuk çay), kolalı içecekler, aromalı doğal mineralli içecek, ' +
            'aromalı şurup ve içecek tozu, aromalı su, meyveli içecek ve tozu, meyveli doğal mineralli içecek, yapay soda, ' +
            'meyveli şurup, sporcu içecekleri ve suları, meyve nektarı, meyve suyu konsantresi.' },

      { t: 'İçeceklere eklenen krema ve şuruplar', f: [
        { n: 'Krema', m: [['Sıcak-soğuk içeceklere (240-700 mL) eklenen ekstra miktar', [1, 1.3333]]] },
        { n: 'Şuruplar', m: [['1 pompa / 10-15 g', [0.25, 1]]] }
      ] },

      { t: 'İşlenmiş et ürünleri', f: [
        { n: 'İşlenmiş et ürünleri (sucuk, salam, sosis vb.)', m: [['20-30 g', 1]] }
      ] }
    ],

    n: [
      'Bu miktarlar <b>önerilen miktarlar değildir</b>; profesyonelleri bilgilendirmek ve bireylerin kontrollü tüketimine ' +
      'fayda sağlamak amacıyla hazırlanmıştır.',
      'Tablo, Ek 3.1.1’deki isteğe bağlı tüketilebilecek besinler için ayrılan pay dikkate alınarak kullanılır.',
      'Pastane ürünleri, paketli ürünler ve cafe ürünleri trans yağ asitleri içeren yağlar ve yüksek miktarda sodyum içerebilir.',
      'Rafine tahıl ürünleri yerine tam tahıl unlu olanlar tercih edilmelidir.',
      'İsteğe göre ilk sırada tercih edilecek sağlıklı alternatifler yağlı tohumlar ve sert kabuklu yemişlerdir (Ek 2.1.12).'
    ]
  };

  /* ---- Ek 2.1.12 — yağlı tohum ve sert kabuklu yemiş porsiyon karşılıkları ---- */
  DA.data.tohum = {
    src: 'TÜBER 2022, Ek 2.1.12 (s. 274)',
    net: ['Ceviz', 'Yer fıstığı', 'Badem', 'Kaju', 'Fındık'],
    kabuklu: ['Ayçiçek çekirdeği', 'Kabak çekirdeği', 'Antep fıstığı'],
    /* her porsiyon için: besin → [gram, ölçü1, ölçü2, …] */
    r: [
      { p: '1⅓ porsiyon', v: {
        'Ceviz': ['40 g', '14-18 yarım'],
        'Yer fıstığı': ['40 g', '¼ kupa', '32-40 adet', '1 × 60 mL kepçe, silme'],
        'Badem': ['40 g', '¼ kupa', '34-36 adet', '1 × 60 mL kepçe, silme'],
        'Kaju': ['40 g', '¼ kupa', '25-26 adet', '1 × 60 mL kepçe, silme'],
        'Fındık': ['40 g', '¼ kupa', '38-40 adet', '1 × 60 mL kepçe, silme'],
        'Ayçiçek çekirdeği': ['74 g', '6 avuç'],
        'Kabak çekirdeği': ['54 g', '⅔ kupa', '2,5 avuç'],
        'Antep fıstığı': ['75 g', '½ kupa', '2,5 avuç', '1 × 125 mL kepçe, silme'] } },
      { p: '1 porsiyon', v: {
        'Ceviz': ['30 g', '10-13 yarım', '1 avuç'],
        'Yer fıstığı': ['30 g', '27-30 adet', '1 avuç'],
        'Badem': ['30 g', '24-26 adet', '1 avuç'],
        'Kaju': ['30 g', '18-20 adet', '1 avuç'],
        'Fındık': ['30 g', '28-30 adet', '1 avuç'],
        'Ayçiçek çekirdeği': ['56 g', '1 kupa', '5 avuç', '2 × 125 mL kepçe, silme'],
        'Kabak çekirdeği': ['41 g', '½ kupa', '2 avuç', '1 × 125 mL kepçe, silme'],
        'Antep fıstığı': ['57 g', '2 avuç', '1 × 90 mL kepçe, silme'] } },
      { p: '¾ porsiyon', v: {
        'Ceviz': ['25 g', '9-10 yarım'],
        'Yer fıstığı': ['25 g', '23-25 adet'],
        'Badem': ['25 g', '20-22 adet'],
        'Kaju': ['25 g', '16-17 adet'],
        'Fındık': ['25 g', '23-25 adet'],
        'Ayçiçek çekirdeği': ['46 g', '4 avuç', '2 × 125 mL kepçe, silme'],
        'Kabak çekirdeği': ['34 g', '1,5 avuç', '1 × 90 mL kepçe, silme'],
        'Antep fıstığı': ['47 g', '⅓ kupa', '1,5 avuç'] } },
      { p: '⅔ porsiyon', v: {
        'Ceviz': ['20 g', '7-8 yarım'],
        'Yer fıstığı': ['20 g', '16-20 adet', '1 × 30 mL kepçe, silme'],
        'Badem': ['20 g', '17-18 adet', '1 × 30 mL kepçe, silme'],
        'Kaju': ['20 g', '12-13 adet', '1 × 30 mL kepçe, silme'],
        'Fındık': ['20 g', '19-20 adet', '1 × 30 mL kepçe, silme'],
        'Ayçiçek çekirdeği': ['37 g', '3 avuç'],
        'Kabak çekirdeği': ['27 g', '⅓ kupa'],
        'Antep fıstığı': ['38 g', '¼ kupa', '1 × 60 mL kepçe, silme'] } },
      { p: '½ porsiyon', v: {
        'Ceviz': ['15 g', '5-7 yarım'],
        'Yer fıstığı': ['15 g', '13-15 adet', '1 avucun yarısı'],
        'Badem': ['15 g', '12-13 adet', '1 avucun yarısı'],
        'Kaju': ['15 g', '9-10 adet', '1 avucun yarısı'],
        'Fındık': ['15 g', '14-15 adet', '1 avucun yarısı'],
        'Ayçiçek çekirdeği': ['28 g', '½ kupa', '2,5 avuç', '1 × 125 mL kepçe, silme'],
        'Kabak çekirdeği': ['20 g', '¼ kupa', '1 avuç', '1 × 60 mL kepçe, silme'],
        'Antep fıstığı': ['28 g', '1 avuç'] } }
    ],
    n: 'Kabuklu ağırlıklar ayçiçek, kabak çekirdeği ve Antep fıstığı için kabuklu ölçüdür. ' +
       'Avuç ölçüleri ölçüm kolaylığı için verilmiş yaklaşık değerlerdir; avucun doldurulma durumuna göre önemli farklılık gösterebilir.'
  };
})();
