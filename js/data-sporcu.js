/* TÜBER 2022 Bölüm 8.2 — Spor beslenmesi (s. 173–178)
   Gülgün Ersoy, Aslı Devrim Lanpir

   Sayısal öneriler hesaplayıcılarda kullanılır; metin kısımları referans panellerinde. */
(function () {
  'use strict';

  DA.data.sporcu = {
    src: 'TÜBER 2022, Bölüm 8.2 — Spor Beslenmesi (s. 173–178)',

    /* ---- 8.2.3 Enerji ---- */
    enerji: {
      arac: [2000, 5000],
      yogun: [6000, 12000],
      n: 'Sporcuların enerji gereksinimi günde 2000–5000 kkal arasında değişir; günde 4–5 saat '
         + 'antrenman yapan ve müsabakaya hazırlanan dayanıklılık sporcularında 6000–12000 kkal’e çıkabilir.'
    },

    /* ---- Kullanılabilir enerji (KE) ve RED-S ---- */
    ke: {
      t: 'Kullanılabilir enerji (KE)',
      f: 'KE = (günlük enerji alımı − egzersiz için harcanan enerji) ÷ yağsız vücut kütlesi',
      band: [
        { max: 29.99, l: 'Düşük kullanılabilir enerji (DKE)', tone: 'bad',
          ne: 'Metabolik hızda azalma, menstrüel bozukluk ve düşük kemik mineral yoğunluğunu içeren '
              + 'endokrin ve metabolik bozukluklara yol açar. RED-S açısından değerlendirilmelidir.' },
        { max: 44.99, l: 'Azalmış kullanılabilir enerji', tone: 'warn',
          ne: 'Fizyolojik belirtilerin hafif olarak görülmeye başlandığı düzey. Erken müdahale edilmezse '
              + 'DKE’ye bağlı tüm belirtiler gelişebilir.' },
        { max: 9999, l: 'Yeterli kullanılabilir enerji', tone: 'ok',
          ne: 'KE 45 kkal/kg yağsız kütle ve üzeri. Enerji alımı vücut işlevlerini desteklemeye yeterli.' }
      ],
      bkiEsik: 17.5,
      bkiN: 'BKİ’nin 17,5 kg/m² altında olması da düşük kullanılabilir enerjinin kesin bir göstergesidir.',
      redsN: 'RED-S (Sporda Relatif Enerji Eksikliği), IOC tarafından tanımlanan ve “Kadın Sporcu Triadı” '
             + '(yeme bozukluğu, menstrüel düzensizlik, kemik mineral yoğunluğunda azalma) temelinde '
             + 'genişletilen bir sendromdur. Kemik sağlığını, menstrüel işlevi, metabolik hızı, bağışıklık '
             + 'sistemini, protein sentezini, kardiyovasküler ve psikolojik sağlığı etkiler. Kadın sporcularda '
             + 'daha yaygındır ama genç erkek sporcuları da etkiler. Görünümün ve düşük vücut ağırlığının '
             + 'ön planda olduğu sıklet ve dayanıklılık dallarında risk artar.'
    },

    /* ---- 8.2.3 Karbonhidrat ---- */
    kh: {
      /* Antrenman süresine göre g/kg — kaynak 5–10 g/kg aralığını örneklerle veriyor */
      yuk: [
        { l: 'Hafif · günde ~1 saat antrenman', s: 1, g: [5, 6] },
        { l: 'Orta · günde 2 saat antrenman', s: 2, g: [6, 8] },
        { l: 'Yoğun · günde 3–4 saat antrenman', s: 3, g: [8, 10] }
      ],
      pct: [60, 65], pctYogun: 70,
      n: 'Sporcuların karbonhidrat gereksinimi enerjinin %60–65’i, çok yoğun antrenmanlarda ve '
         + 'dayanıklılık sporlarında %70’e kadar çıkar. Yüksek ve düşük enerji alan sporcularda hem yüzde '
         + 'hem de vücut ağırlığı başına öneri birlikte değerlendirilmelidir.',
      depo: 'Kaslarda 300–400 g, karaciğerde 75–100 g glikojen deposu bulunur. Yüksek karbonhidratlı '
            + 'beslenme ile depolar yaklaşık 1,5–2 kat artırılabilir.'
    },

    /* ---- 8.2.3 Protein ---- */
    pro: {
      dal: [
        { k: 'day', l: 'Dayanıklılık sporları', g: [1.2, 1.4] },
        { k: 'kuv', l: 'Kuvvet sporları', g: [1.6, 1.7] }
      ],
      pct: [12, 15],
      n: 'Önerilen protein miktarı, protein veya amino asit destekleri kullanılmadan da diyetle karşılanabilir.'
    },

    /* ---- 8.2.3 Yağ ---- */
    yag: { pct: [20, 35],
      n: 'Dinlenirken ve düşük şiddette egzersizde yağlar öncelikli enerji kaynağıdır; şiddet arttıkça '
         + 'vücut enerji için daha fazla karbonhidrat kullanır. Mesafe koşucuları, bisikletçiler ve '
         + 'kürekçiler enerji kaybını dengelemek için daha fazla yağa gereksinim duyabilir.' },

    /* ---- 8.2.2 Sıvı ---- */
    sivi: {
      dehidrasyonEsik: 2,
      onceMl: 500, onceSaat: 4,
      sirasindaMl: [150, 350], sirasindaDk: [15, 20],
      sonrasiYuzde: 150,
      yarimKgMl: [450, 675],
      sodyumGL: [0.5, 0.7], potasyumGL: 0.8,
      sporIcecegiKh: [6, 8],
      n: 'Vücut ağırlığının yalnızca %2’si kadar su kaybı bile egzersiz performansını olumsuz etkiler. '
         + 'Susama hissi güvenilir bir gösterge değildir: performansa zarar veren düzeye ulaşılana kadar '
         + 'susama hissedilmez, hissedildiğinde de gereksinimin yaklaşık yarısı tüketilerek bırakılır.',
      idrar: [
        ['Limonata rengi', 'İyi', 'ok'],
        ['Elma suyu rengi', 'Orta', 'warn'],
        ['Çay rengi', 'Kötü', 'bad']
      ],
      idrarN: 'İdrar rengi, sıvı dengesindeki değişimin ölçülebildiği pratik ve güvenilir yöntemlerden biridir; '
              + 'renk koyulaştıkça dehidrasyon düzeyi artar.',
      ors: 'Evde oral rehidrasyon sıvısı: 350 mL vişne suyu (31 g şeker, 686 mg potasyum) + 200 mL su '
           + '+ 1,5 g tuz (¼ çay kaşığı, 600 mg sodyum).'
    },

    /* ---- 8.2.4 Zamanlama ---- */
    zaman: [
      { t: 'Antrenman/müsabakadan 3–4 saat önce', r: [
        'Ana öğün tüketilir; sindirim için gerekli süre sağlanır.',
        'Bol sıvı, düşük yağ ve posa (mide-bağırsak şikâyetlerini önlemek için).',
        'Glisemik indeksi düşük ve orta karbonhidrattan zengin, orta düzey protein içeren öğün.',
        'Sporcunun alışkın olduğu ve sevdiği yiyeceklerden seçilir.'
      ] },
      { t: 'Egzersizden 1–4 saat önce', r: [
        'ACSM: 1–4 g/kg karbonhidrat. Tür, miktar ve zamanlama antrenmana ve bireysel deneyime göre seçilir.',
        'Yüksek yağlı, proteinli ve lifli besinler egzersiz sırasında sindirim sorunu yapabilir.'
      ] },
      { t: 'Egzersiz sırasında', r: [
        '45 dakikaya kadar: karbonhidrat tüketimine gerek yoktur.',
        '45–75 dakika: az miktarda karbonhidrat ya da ağızda karbonhidrat çalkalama.',
        '1–2,5 saat: 30–60 g karbonhidrat.',
        '2,5 saatin üzeri: 90 grama kadar karbonhidrat.',
        '1 saati aşan, sıcak ve nemli havadaki egzersizlerde saatte 30–60 g karbonhidrat içeren içecek.'
      ] },
      { t: 'Egzersiz sonrası (toparlanma)', r: [
        'İlk 30 dakika–2 saat içinde 1–1,5 g/kg karbonhidrat; sonra 2 saatte bir, 4–6 saat boyunca tekrarlanır.',
        'Egzersizden hemen sonra ya da iki saat içinde 20–25 g iyi kaliteli protein '
          + '(10 g elzem amino asit, 3 g lösin içeren).',
        'Egzersiz sonrası karbonhidrat/protein oranı 3/1–4/1 olmalıdır.',
        'Kaybedilen her yarım kg için 450–675 mL (yaklaşık 2–3 su bardağı) sıvı.'
      ] }
    ],

    /* ---- 8.2.3 Mikro besin ögeleri ---- */
    mikro: [
      { n: 'Kalsiyum', v: '1200 mg/gün',
        s: 'Genç erkek ve kadın sporcularda ortalama gereksinim; yaklaşık 4 porsiyon süt ve ürünleriyle karşılanır. '
           + 'Yetersiz alım düşük kemik mineral yoğunluğuna ve stres kırıklarına yol açar.' },
      { n: 'Demir', v: 'Düzenli izlem',
        s: 'Hemoglobin ve miyoglobinin yapısında yer alır, dayanıklılık performansında önemlidir. '
           + 'Başta kadın sporcular olmak üzere tüm sporcuların kan demir düzeyi belirli aralıklarla kontrol edilmelidir.' },
      { n: 'Sodyum', v: 'Önerilenin ~1,5 katı',
        s: 'Kan hacminin korunmasına ve sıvı tüketme isteğinin uyarılmasına yardım eder. '
           + 'Sporcular terle oluşan tuz kaybı nedeniyle daha fazlasına gereksinim duyar.' },
      { n: 'D vitamini', v: 'İzlem ve gerekirse destek',
        s: 'Eksiklik saptanan sporculara IOC 8–16 hafta boyunca haftada 50 000 IU, daha uzun sürede '
           + 'haftalık 10 000 IU önerir. Toksisite için sürekli takip gerekir.' }
    ],

    /* ---- 8.2.5 Besin destekleri ---- */
    destek: [
      ['Kreatin', 'Kuvveti ve gücü artırır.'],
      ['Kafein', 'Dayanıklılığı ve reaksiyon zamanını geliştirir. Egzersizden ~60 dakika önce 3–6 mg/kg ya da '
        + 'günlük toplam 250 mg. ≥9 mg/kg alımda dehidrasyon ve diürez gibi sorunlar çıkar.'],
      ['Sodyum bikarbonat / sitrat', 'Alkalileştirici ajanlar; anaerobik egzersiz performansını artırır.'],
      ['Beta-alanin', 'Anaerobik ve aerobik egzersiz performansını geliştirir.'],
      ['Nitrat', 'Dayanıklılık egzersizlerinde oksijenli solunumu geliştirir.']
    ],
    destekN: 'Besin destekleri yetersiz beslenmeyi telafi etmez. Sporcular kişisel risk-yarar analizi yapılmadan '
             + 'bu ürünleri kullanmamalıdır. Genç sporcuların dikkati doping maddeleriyle kontamine olabilen '
             + 'ürünlere çekilmeli; klinik sorun dışında kullanılmamalıdır. Seçimde yaş, cinsiyet, spor dalı ve '
             + 'amatör/profesyonel olma durumu gözetilir.',

    /* ---- 8.2.6 Uyku ---- */
    uyku: {
      esik: 7,
      n: 'Egzersiz sonrası toparlanmanın en önemli etmenlerinden biri yeterli ve kaliteli uykudur. '
         + 'Elit sporcular gecede 7 saatin altı uyku ve düşük uyku kalitesine özellikle duyarlıdır. '
         + 'Uyumadan önce kafein ve alkolden uzak durulmalı, son öğünde ağır yemeklerden kaçınılmalı, '
         + 'karanlık ve sessiz bir ortamda uyunmalıdır. Gün içinde kısa uyku (kestirme) teşvik edilir.'
    },

    ogun: 'Sporcuların da üç ana, üç ara öğün tüketerek artan enerji ve besin ögesi gereksinimini karşılaması önerilir.',
    vejetaryen: 'Vejetaryen sporcular enerji, protein, yağ ve bazı mikro besin ögelerini (demir, kalsiyum, '
                + 'riboflavin, çinko, D ve B12 vitamini) yetersiz alabilir; spor diyetisyeni danışmanlığında '
                + 'iyi planlanmış bir diyet gerekir.'
  };
})();
