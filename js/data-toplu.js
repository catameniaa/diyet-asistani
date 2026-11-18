/* Toplu beslenme menü taslağı — yemek grupları ve aylık sıklıklar
   Kaynak: T.C. Sağlık Bakanlığı Halk Sağlığı Genel Müdürlüğü (2020).
   Toplu Beslenme Sistemleri (Toplu Tüketim Yerleri) İçin Ulusal Menü
   Planlama ve Uygulama Rehberi.
     · EK-1 "Temel Menü Planlamada Kullanılan Yemek Grupları Örnekleri":
       1. grup ana (kap) yemekler; 2. grup çorba, pilav-makarna, börek,
       zeytinyağlı; 3. grup meyve, salata, yoğurt-cacık-ayran, tatlı.
     · Menü planlama ilkeleri (s. 8–9) ve işyeri menüleri (Bölüm 4,
       s. 110–111): kap seçimi, birlikte verilmeyecek yemekler.
     · Tablo 4.5 (s. 113): çalışanların menülerinde yemeklerin aylık
       (21 gün) verilme sıklığı — azami ve asgari, kış ve yaz.
   Değerler rehberin çevrim içi kopyasından okundu; basılı rehberle
   doğrulanmalı (kaynak notu: "toplu45").

   Yemek adlarının bir kısmı EK-1 örnekleri, kalanı aynı alt gruba giren
   yaygın yemeklerdir. Kızartma yöntemli EK-1 örnekleri (sigara böreği,
   mücver, şakşuka, balık tava, şinitzel) alınmadı: rehber işyeri
   menülerinde kızartma uygulanmamasını söylüyor (s. 116).

   Etiketler (e, boşlukla ayrılır) "benzer içerikli yemekler aynı menüde
   verilmez" ilkesi (s. 8) için: ortak etiketli iki yemek aynı öğünde not
   çıkarır. baklagil · patates · bulgur · sut · meyve · tatli
   EK-1 komposto ve hoşafı da tatlılar arasında sayar: iki tatlı (ör.
   muhallebi + kabak tatlısı) aynı öğüne gelmez. */
(function () {
  'use strict';

  /* alt grup → ad, grup, Tablo 4.5 satırı */
  const ALT = {
    bparca: { ad: 'Büyük parça et', g: 1, t: 'bparca' },
    kparca: { ad: 'Küçük parça et', g: 1, t: 'kparca' },
    kofte: { ad: 'Köfte', g: 1, t: 'kofte' },
    balik: { ad: 'Balık', g: 1, t: 'balik' },
    tavuk: { ad: 'Tavuk, hindi', g: 1, t: 'tavuk' },
    etlisebze: { ad: 'Etli sebze', g: 1, t: 'sebzeDolma' },
    dolma: { ad: 'Etli dolma, sarma', g: 1, t: 'sebzeDolma' },
    etlibaklagil: { ad: 'Etli kuru baklagil', g: 1, t: 'etlibaklagil' },
    corba: { ad: 'Çorba', g: 2, t: 'corba' },
    pilav: { ad: 'Pilav, makarna', g: 2, t: 'pilav' },
    borek: { ad: 'Börek', g: 2, t: 'borek' },
    zysebze: { ad: 'Zeytinyağlı sebze', g: 2, t: 'zysebze' },
    zybaklagil: { ad: 'Zeytinyağlı kuru baklagil', g: 2, t: 'zybaklagil' },
    salata: { ad: 'Salata', g: 3, t: 'salata' },
    meyve: { ad: 'Meyve', g: 3, t: 'meyve' },
    yogurt: { ad: 'Yoğurt', g: 3, t: 'yogurt' },
    ayran: { ad: 'Ayran, cacık', g: 3, t: 'ayran' },
    komposto: { ad: 'Komposto, hoşaf', g: 3, t: 'komposto' },
    sutlu: { ad: 'Sütlü tatlı', g: 3, t: 'sutlu' },
    tatli: { ad: 'Diğer tatlı', g: 3, t: 'tatli' },
    /* Kahvaltı: rehber yumurta ve/veya peynir gibi bir protein kaynağını
       şart koşar; zeytin, çiğ sebze ya da meyve çeşitlilik verir (s. 9).
       Kahvaltının kap düzeni rehberde sayıyla verilmemiş. */
    yumurta: { ad: 'Yumurta', k: true },
    peynir: { ad: 'Peynir', k: true },
    zeytin: { ad: 'Zeytin', k: true },
    kahvaltilik: { ad: 'Tatlı kahvaltılık', k: true },
    cigsebze: { ad: 'Çiğ sebze', k: true },
    kmeyve: { ad: 'Meyve', k: true }
  };

  /* Tablo 4.5 — [ad, azami kış, azami yaz, asgari kış, asgari yaz] (21 gün).
     Yazın etli kuru baklagil asgarisi tabloda "–": 0 alındı. "Garnitür
     yoğurt (1/2 porsiyon)" satırı (4, 6, 2, 6) taslakta ayrı kap olarak
     üretilmediği için alınmadı. */
  const TABLO45 = {
    bparca: ['Büyük parça et', 4, 4, 2, 3],
    kparca: ['Küçük parça et', 4, 4, 2, 1],
    kofte: ['Köfteler', 4, 4, 3, 4],
    balik: ['Balık', 2, 1, 1, 1],
    tavuk: ['Tavuk, hindi', 4, 4, 3, 4],
    sebzeDolma: ['Etli sebze, dolmalar ve sebze garnitürleri', 8, 8, 7, 6],
    etlibaklagil: ['Etli kuru baklagiller', 4, 2, 2, 0],
    corba: ['Çorbalar', 6, 5, 4, 5],
    pilav: ['Pilav ve makarnalar', 9, 9, 9, 9],
    borek: ['Börekler', 4, 4, 4, 3],
    zysebze: ['Zeytinyağlı sebze', 3, 4, 3, 3],
    zybaklagil: ['Zeytinyağlı kuru baklagiller', 2, 2, 1, 1],
    salata: ['Salatalar', 5, 5, 4, 5],
    meyve: ['Meyveler', 6, 6, 4, 4],
    yogurt: ['Yoğurt', 3, 3, 3, 2],
    ayran: ['Ayran, cacık', 4, 4, 3, 3],
    komposto: ['Komposto, hoşaf', 2, 2, 2, 2],
    sutlu: ['Sütlü tatlılar', 3, 3, 2, 2],
    tatli: ['Diğer tatlılar', 2, 2, 2, 2]
  };

  /* [kimlik, ad, alt grup, etiketler] */
  const YEMEK = [
    /* 1. grup — büyük parça et */
    ['ankara-tava', 'Ankara tava', 'bparca'], ['dana-rosto', 'Dana rosto', 'bparca'],
    ['firin-kuzu', 'Fırında kuzu', 'bparca'], ['et-doner', 'Et döner', 'bparca'], ['sogus-et', 'Söğüş et', 'bparca'],
    /* küçük parça et */
    ['coban-kavurma', 'Çoban kavurma', 'kparca'], ['et-sote', 'Et sote', 'kparca'], ['macar-gulas', 'Macar gulaş', 'kparca'],
    ['orman-kebabi', 'Orman kebabı', 'kparca'], ['tas-kebabi', 'Tas kebabı', 'kparca'],
    /* köfte */
    ['firin-kofte', 'Fırın köfte', 'kofte'], ['izmir-kofte', 'İzmir köfte', 'kofte'], ['dalyan-kofte', 'Dalyan köfte', 'kofte'],
    ['hasanpasa-kofte', 'Hasanpaşa köfte', 'kofte'], ['kadinbudu-kofte', 'Kadınbudu köfte', 'kofte'], ['adana-kofte', 'Adana köfte', 'kofte'],
    /* balık */
    ['balik-bugulama', 'Balık buğulama', 'balik'], ['firin-levrek', 'Fırında levrek', 'balik'], ['firin-somon', 'Fırında somon', 'balik'],
    /* tavuk, hindi */
    ['firin-tavuk', 'Fırın tavuk', 'tavuk'], ['tavuk-sote', 'Tavuk sote', 'tavuk'], ['tavuk-guvec', 'Tavuk güveç', 'tavuk'],
    ['hindi-sote', 'Hindi sote', 'tavuk'], ['tavuk-haslama', 'Tavuk haşlama', 'tavuk'],
    /* etli sebze */
    ['etli-bamya', 'Etli bamya', 'etlisebze'], ['etli-patates', 'Etli patates', 'etlisebze', 'patates'],
    ['karniyarik', 'Karnıyarık', 'etlisebze'], ['kabak-musakka', 'Kabak musakka', 'etlisebze'],
    ['patates-oturtma', 'Patates oturtma', 'etlisebze', 'patates'], ['etli-taze-fasulye', 'Etli taze fasulye', 'etlisebze'],
    ['etli-bezelye', 'Etli bezelye', 'etlisebze'], ['etli-turlu', 'Etli türlü', 'etlisebze'],
    ['patlican-musakka', 'Patlıcan musakka', 'etlisebze'], ['etli-kereviz', 'Etli kereviz', 'etlisebze'],
    /* etli dolma, sarma */
    ['etli-biber-dolma', 'Etli biber dolması', 'dolma'], ['etli-kabak-dolma', 'Etli kabak dolması', 'dolma'],
    ['lahana-sarma', 'Kıymalı lahana sarması', 'dolma'], ['yaprak-sarma', 'Kıymalı yaprak sarması', 'dolma'],
    ['etli-enginar-dolma', 'Etli enginar dolması', 'dolma'],
    /* etli kuru baklagil */
    ['etli-kuru-fasulye', 'Etli kuru fasulye', 'etlibaklagil', 'baklagil'], ['etli-nohut', 'Etli nohut', 'etlibaklagil', 'baklagil'],
    ['kiymali-mercimek', 'Kıymalı yeşil mercimek', 'etlibaklagil', 'baklagil'], ['etli-barbunya', 'Etli barbunya', 'etlibaklagil', 'baklagil'],

    /* 2. grup — çorba */
    ['mercimek-corbasi', 'Mercimek çorbası', 'corba', 'baklagil'], ['ezogelin', 'Ezogelin çorbası', 'corba', 'baklagil'],
    ['domates-corbasi', 'Domates çorbası', 'corba'], ['sehriye-corbasi', 'Şehriye çorbası', 'corba'],
    ['tarhana-corbasi', 'Tarhana çorbası', 'corba'], ['mantar-corbasi', 'Mantar çorbası', 'corba'],
    ['yayla-corbasi', 'Yayla çorbası', 'corba', 'sut'], ['sebze-corbasi', 'Sebze çorbası', 'corba'],
    /* pilav, makarna */
    ['bulgur-pilavi', 'Bulgur pilavı', 'pilav', 'bulgur'], ['pirinc-pilavi', 'Pirinç pilavı', 'pilav'],
    ['sehriyeli-pilav', 'Şehriyeli pirinç pilavı', 'pilav'], ['ic-pilav', 'İç pilav', 'pilav'],
    ['meyhane-pilavi', 'Meyhane pilavı', 'pilav', 'bulgur'], ['ozbek-pilavi', 'Özbek pilavı', 'pilav'],
    ['firin-makarna', 'Fırın makarna', 'pilav'], ['spagetti', 'Spagetti napoliten', 'pilav'], ['eriste', 'Erişte', 'pilav'],
    /* börek */
    ['ispanakli-borek', 'Ispanaklı börek', 'borek'], ['kol-boregi', 'Kol böreği', 'borek'], ['su-boregi', 'Su böreği', 'borek'],
    ['milfoy-borek', 'Milföy börek', 'borek'], ['talas-boregi', 'Talaş böreği', 'borek'], ['patatesli-borek', 'Patatesli börek', 'borek', 'patates'],
    /* zeytinyağlı sebze */
    ['imam-bayildi', 'İmam bayıldı', 'zysebze'], ['zy-biber-dolma', 'Zeytinyağlı biber dolması', 'zysebze'],
    ['zy-enginar', 'Zeytinyağlı enginar', 'zysebze'], ['zy-taze-fasulye', 'Zeytinyağlı taze fasulye', 'zysebze'],
    ['zy-pirasa', 'Zeytinyağlı pırasa', 'zysebze'], ['zy-kereviz', 'Zeytinyağlı kereviz', 'zysebze'], ['zy-bamya', 'Zeytinyağlı bamya', 'zysebze'],
    /* zeytinyağlı kuru baklagil */
    ['barbunya-pilaki', 'Zeytinyağlı barbunya', 'zybaklagil', 'baklagil'], ['fasulye-pilaki', 'Fasulye pilaki', 'zybaklagil', 'baklagil'],
    ['zy-borulce', 'Zeytinyağlı kuru börülce', 'zybaklagil', 'baklagil'],

    /* 3. grup — salata */
    ['coban-salata', 'Çoban salata', 'salata'], ['mevsim-salata', 'Mevsim salata', 'salata'], ['akdeniz-salata', 'Akdeniz salata', 'salata'],
    ['kisir', 'Kısır', 'salata', 'bulgur'], ['piyaz', 'Piyaz', 'salata', 'baklagil'], ['patates-salatasi', 'Patates salatası', 'salata', 'patates'],
    ['havuc-salatasi', 'Havuç salatası', 'salata'],
    /* meyve */
    ['mevsim-meyvesi', 'Mevsim meyvesi', 'meyve', 'meyve'],
    /* yoğurt, ayran, cacık */
    ['yogurt', 'Yoğurt', 'yogurt', 'sut'], ['ayran', 'Ayran', 'ayran', 'sut'], ['cacik', 'Cacık', 'ayran', 'sut'],
    /* komposto, hoşaf */
    ['elma-kompostosu', 'Elma kompostosu', 'komposto', 'meyve tatli'], ['ayva-kompostosu', 'Ayva kompostosu', 'komposto', 'meyve tatli'],
    ['kayisi-hosafi', 'Kuru kayısı hoşafı', 'komposto', 'meyve tatli'],
    /* sütlü tatlı */
    ['firin-sutlac', 'Fırın sütlaç', 'sutlu', 'sut tatli'], ['muhallebi', 'Muhallebi', 'sutlu', 'sut tatli'], ['keskul', 'Keşkül', 'sutlu', 'sut tatli'],
    ['kazandibi', 'Kazandibi', 'sutlu', 'sut tatli'],
    /* diğer tatlı */
    ['irmik-helvasi', 'İrmik helvası', 'tatli', 'tatli'], ['kabak-tatlisi', 'Kabak tatlısı', 'tatli', 'tatli'], ['ayva-tatlisi', 'Ayva tatlısı', 'tatli', 'tatli'],
    ['revani', 'Revani', 'tatli', 'tatli'],

    /* Kahvaltı */
    ['haslanmis-yumurta', 'Haşlanmış yumurta', 'yumurta'], ['menemen', 'Menemen', 'yumurta'], ['peynirli-omlet', 'Peynirli omlet', 'yumurta'],
    ['beyaz-peynir', 'Beyaz peynir', 'peynir'], ['kasar-peyniri', 'Kaşar peyniri', 'peynir'], ['lor-peyniri', 'Lor peyniri', 'peynir'],
    ['tulum-peyniri', 'Tulum peyniri', 'peynir'],
    ['siyah-zeytin', 'Siyah zeytin', 'zeytin'], ['yesil-zeytin', 'Yeşil zeytin', 'zeytin'],
    ['bal', 'Bal', 'kahvaltilik'], ['recel', 'Reçel', 'kahvaltilik'], ['tahin-pekmez', 'Tahin, pekmez', 'kahvaltilik'],
    ['domates-salatalik', 'Domates, salatalık', 'cigsebze'], ['sogus', 'Söğüş (domates, salatalık, biber)', 'cigsebze'],
    ['yesillik', 'Yeşillik (maydanoz, roka)', 'cigsebze'],
    ['k-mevsim-meyvesi', 'Mevsim meyvesi', 'kmeyve']
  ].map((x) => ({ id: x[0], ad: x[1], a: x[2], e: x[3] || '' }));

  DA.data.toplu = { ALT, TABLO45, YEMEK };
})();
