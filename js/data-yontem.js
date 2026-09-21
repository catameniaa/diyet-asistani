/* TÜBER 2022 — Yöntem ve tanımlar
   Tablo 10.1 (s. 224)  Diyet referans değerleri: IOM ve EFSA karşılıkları, tanım, kullanım
   Tablo 10.2 (s. 225)  Faktöriyel yöntem ile toplam enerji harcamasının hesaplanması
   Ek 1.2.2   (s. 252)  Amino asit puanlama örüntüsü
   Kısaltmalar (s. xx-xxi) */
(function () {
  'use strict';

  DA.data.yontem = {
    src: 'TÜBER 2022, Tablo 10.1-10.2 (s. 224-225), Ek 1.2.2 (s. 252)',

    /* ---- Tablo 10.1 — Diyet referans değerleri ---- */
    drv: {
      t: 'Diyet referans değerleri', ek: 'Tablo 10.1',
      n: 'IOM (Tıp Enstitüsü) DRI, EFSA (Avrupa Gıda Güvenliği Otoritesi) DRV adını kullanır. '
         + 'TÜBER 2022 EFSA kısaltmalarını temel alır.',
      r: [
        { k: 'PRI', iom: 'RDA', efsa: 'PRI',
          ad: 'Diyetle alınması öngörülen (önerilen) miktar',
          en: 'Recommended Dietary Allowances / Population Reference Intakes',
          d: 'Toplumdaki bireylerin tamamına yakınının (%97,5) gereksinimini karşılayan besin ögesi miktarı.',
          kullan: 'Beslenme örüntüsü ve plan hazırlamakta kullanılır: yetersizlik riski çok düşük, fazlalık riski en az olan örüntüler verir.',
          dikkat: 'Yetersiz alım sıklığının (prevalansının) belirlenmesinde kullanılması önerilmez.' },
        { k: 'EAR', iom: 'EAR', efsa: 'AR',
          ad: 'Ortalama (tahmini) gereksinim miktarı',
          en: 'Estimated Average Requirement / Average Requirement',
          d: 'Toplumdaki bireylerin yarısının (%50) gereksinimini yeterli düzeyde karşılayan besin ögesi miktarı.',
          kullan: 'Kesişim noktası (cut-point) yöntemiyle toplumda yetersiz alım sıklığını tahmin etmek için kullanılır.' },
        { k: 'AI', iom: 'AI', efsa: 'AI',
          ad: 'Yeterli alım miktarı',
          en: 'Adequate Intake',
          d: 'EAR ve PRI belirlenemediğinde saptanır; toplumdaki sağlıklı bireylerin günlük ortalama alım miktarları incelenerek bulunur.',
          kullan: 'Toplumda besin ögesini yeterli alanların durumunu ortaya koymak için kullanılır.' },
        { k: 'RI', iom: 'AMDR', efsa: 'RI',
          ad: 'Makro besin ögelerinin referans alım aralığı',
          en: 'Acceptable Macronutrient Distribution Ranges / Reference Intakes Ranges',
          d: 'Enerji alımının yüzdesi olarak ifade edilir. Sağlığın sürdürülmesi ve bazı kronik hastalık riskinin düşük olmasıyla ilişkili kabul edilen alım aralığıdır.',
          kullan: 'Makro besin ögelerini aralığın içinde, altında veya üstünde alanların durumunu değerlendirmek için kullanılır.' },
        { k: 'UL', iom: 'UL', efsa: 'UL',
          ad: 'Tolere edilebilir üst düzey alım miktarı',
          en: 'Tolerable Upper Intake Levels',
          d: 'Besinlerle ve besin destekleriyle sürekli alındığında sağlık üzerinde ters etki yapmadığına karar verilen üst sınır.',
          kullan: 'Besin + zenginleştirilmiş besin + takviyeden gelen toplam miktarın değerlendirilmesinde kullanılır; minerallerde suyun içeriği de eklenir.' }
      ],
      dip: 'FAO/WHO bu değerleri Besin Ögesi Referans Değeri (NRV) olarak tanımlar. Besin etiketlerindeki '
           + '“Beslenme Referans Değeri”ni karşılama oranları bu değerlere göre hesaplanır.'
    },

    /* ---- Tablo 10.2 — Faktöriyel yöntem ---- */
    faktoriyel: {
      t: 'Faktöriyel yöntem ile toplam enerji harcaması', ek: 'Tablo 10.2',
      r: [
        { g: 'Çocuk ve adolesanlar', f: 'TEH = DEH × (PAL + 0,01)',
          a: 'Dinlenme enerji harcaması × (fiziksel aktivite düzeyi + büyüme çarpanı)' },
        { g: 'Yetişkinler', f: 'TEH = DEH × PAL',
          a: 'Dinlenme enerji harcaması × fiziksel aktivite düzeyi' }
      ],
      n: 'DEH, yaş ve cinsiyete uygun Henry 2005 eşitlikleriyle (Tablo 10.3) hesaplanır. '
         + 'WHO/FAO/UNU 2004 Uzmanlar Komitesi toplam enerji harcamasının tahmininde faktöriyel yöntemi önermektedir.',
      pal: 'TBSA verilerine göre 60-69 yaş erkek ve kadınlarda ortalama PAL 1,71; 70-79 yaşta erkekte 1,64, '
           + 'kadında 1,62’dir (orta aktif yaşam biçimi). Bu nedenle Türkiye ortalaması Ek 1.1.3-1.1.4’te '
           + 'orta aktif (PAL = 1,6) sütununa karşılık gelir.',
      hedef: 'WHO/FAO/UNU 2004: PAL 1,7 düzeyinde aktif olan bireylerde şişmanlık, kardiyovasküler hastalık, '
             + 'diyabet ve bazı kanserlerin görülme riski daha düşüktür. Sağlığı koruyan ve geliştiren düzey PAL ≥ 1,7’dir.'
    },

    /* ---- Ek 1.2.2 — Amino asit puanlama örüntüsü ---- */
    aminoasit: {
      t: 'Amino asit puanlama örüntüsü', ek: 'Ek 1.2.2',
      birim: 'mg/g protein',
      c: ['Histidin', 'İzolösin', 'Lösin', 'Lizin', 'Kükürtlü AA', 'Aromatik AA', 'Treonin', 'Triptofan', 'Valin'],
      r: [
        { y: 'Bebek: 0-6 ay', v: [21, 55, 96, 69, 33, 94, 44, 17, 55] },
        { y: 'Çocuk: 6 ay-3 yıl', v: [20, 32, 66, 57, 27, 52, 31, 8.5, 43] },
        { y: 'Çocuk (>3 yaş), adolesan ve yetişkin', v: [16, 30, 61, 48, 23, 41, 25, 6.6, 40] }
      ],
      n: 'Değerler, proteinin 1 gramında yaşa göre bulunması önerilen sindirilebilir elzem amino asit '
         + 'miktarlarını gösterir. Besinin veya diyetin protein kalitesi (DIAAS) bu örüntüye göre belirlenir. '
         + 'Bebek örüntüsü insan sütünün ham amino asit içeriğinden çıkarılmıştır.',
      kukurtlu: 'Kükürtlü amino asitler: metiyonin + sistein · Aromatik amino asitler: fenilalanin + tirozin'
    },

    /* ---- Kısaltmalar (s. xx-xxi), beslenme ile ilgili olanlar ---- */
    kisalt: [
      ['AI', 'Yeterli Alım Miktarı (Adequate Intake)'],
      ['ALA', 'Alfa linolenik asit'],
      ['AMDR', 'Makro besin ögelerinin referans alım aralığı (Acceptable Macronutrient Distribution Ranges)'],
      ['AR', 'Tahmini ortalama gereksinim (Average Requirement)'],
      ['BKİ', 'Beden kütle indeksi'],
      ['BMH', 'Bazal metabolizma hızı (Basal Metabolic Rate)'],
      ['CHO', 'Karbonhidrat'],
      ['DASH', 'Hipertansiyonu durdurmak için diyetsel yaklaşımlar (Dietary Approaches to Stop Hypertension)'],
      ['DHA', 'Dokosahekzaenoik asit (n-3)'],
      ['DIAAS', 'Sindirilebilir elzem amino asit skoru (Digestible Essential Amino Acids Score)'],
      ['DKE', 'Düşük kullanılabilir enerji'],
      ['DMH', 'Dinlenme metabolik hızı (Resting Metabolic Rate)'],
      ['DRI', 'Diyet referans değerleri (Dietary Reference Intakes) — IOM'],
      ['DRV', 'Diyet referans değerleri (Dietary Reference Values) — EFSA'],
      ['EAR', 'Tahmini ortalama gereksinim (Estimated Average Requirement)'],
      ['EFSA', 'Avrupa Gıda Güvenliği Otoritesi'],
      ['EPA', 'Eikosapentaenoik asit (n-3)'],
      ['ESPGHAN', 'Avrupa Pediatrik Gastroenteroloji, Hepatoloji ve Beslenme Birliği'],
      ['FAO', 'Birleşmiş Milletler Gıda ve Tarım Örgütü'],
      ['GKM', 'Günlük karşılama miktarı'],
      ['IAA', 'Elzem amino asit (Indispensable Amino Acid)'],
      ['IOM', 'Ulusal Bilimler Akademisi Tıp Enstitüsü (Institute of Medicine)'],
      ['KE', 'Kullanılabilir enerji'],
      ['KVH', 'Kardiyovasküler hastalıklar'],
      ['LA', 'Linoleik asit'],
      ['MGRS', 'Çok merkezli büyüme referans çalışması (Multicentre Growth Reference Study)'],
      ['PAL', 'Fiziksel aktivite düzeyi (Physical Activity Level)'],
      ['PRI', 'Önerilen günlük alım miktarı (Population Reference Intakes)'],
      ['RDA', 'Önerilen günlük alım miktarı (Recommended Dietary Allowances)'],
      ['RI', 'Makro besin ögelerinin referans alım aralığı (Reference Intakes Ranges)'],
      ['TBSA', 'Türkiye Beslenme ve Sağlık Araştırması'],
      ['TGK', 'Türkiye Gıda Kodeksi'],
      ['TNSA', 'Türkiye Nüfus ve Sağlık Araştırması'],
      ['UL', 'Tolere edilebilir üst düzey alım miktarı (Tolerable Upper Intake Levels)'],
      ['WHO', 'Dünya Sağlık Örgütü']
    ]
  };
})();
