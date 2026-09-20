/* TÜBER 2022 — Ek 2.1: Besin gruplarına göre standart porsiyon ölçüleri (s. 262–271)
   Ek 2.1.1/2.1.3/2.1.5/2.1.7/2.1.9 → ölçüler
   Ek 2.1.2/2.1.4/2.1.6/2.1.8/2.1.10 → yaş ve cinsiyete göre günlük porsiyon önerileri

   Porsiyon değerleri kaynaktaki gibi metin olarak saklanır (kesir ve aralıklar korunsun diye);
   sayısal karşılaştırma gerektiğinde js/porsiyon.js içindeki parse() ile çözülür. */
(function () {
  'use strict';

  DA.data.porsiyon = {
    src: 'TÜBER 2022, Ek 2.1.1–2.1.10 (s. 262–271)',
    yas: ['2-3', '4-6', '7-10', '11-14', '15-18', '18-49', '50-70', '70+'],

    /* ---- Ek 2.1.1/3/5/7/9 — 1 standart porsiyon ne kadar? ---- */
    olcu: [
      { g: 'Süt, yoğurt, peynir', ek: 'Ek 2.1.1', kcal: '≈150 kkal', f: [
        ['Süt', '1 kupa veya 240 mL'],
        ['Yoğurt', '1 küçük kase veya 200 mL'],
        ['Yoğurt (ev yapımı)', '1 kupa veya 1 küçük kase veya 240 mL'],
        ['Kefir', '1 kupa veya 240 mL'],
        ['Ayran', '1,5 kupa veya 1 büyük bardak veya 1 büyük hazır ayran veya 350 mL'],
        ['Beyaz peynir', '3 parmak veya 2 kibrit kutusu veya 60 g'],
        ['Kaşar peyniri', '2 parmak veya 40 g']
      ] },

      { g: 'Et, tavuk, balık, yumurta, kuru baklagil, yağlı tohum', ek: 'Ek 2.1.3', kcal: '≈150–200 kkal', f: [
        ['Yumurta', '2 küçük boy veya 100 g'],
        ['Kırmızı et (pişmiş)', '3-4 adet ızgara köfte veya 1 adet Adana köfte veya 10-14 adet İnegöl köfte veya 2 hamburger köfte veya 1 el ayası kadar et veya 1 adet büyük pirzola veya 80 g'],
        ['Tavuk eti (pişmiş)', '1 orta boy baget veya 1 el ayası kadar et veya 80 g'],
        ['Balık (pişmiş)', '1 el büyüklüğünde ince bir dilim veya 1 el ayası büyüklüğünde kalın bir dilim veya 150 g'],
        ['Hamsi vb. küçük balıklar (pişmiş)', '12-13 adet veya 150 g'],
        ['Ton balığı konserve', 'Suyu süzülmüş 100 g'],
        ['Karides ve diğer deniz ürünleri (pişmiş)', '12-15 adet küçük veya 100 g'],
        ['Nohut, fasulye, barbunya, iç bakla, börülce (haşlanmış)', '¾ kupa veya 2 küçük kepçe veya 8-10 yemek kaşığı veya 130 g'],
        ['Fındık', '28-30 adet veya 1 avuç veya 30 g'],
        ['Ceviz', '4-5 adet büyük boy veya 6-7 adet orta boy veya 10-12 adet küçük boy tam ceviz içi veya 1 avuç veya 30 g'],
        ['Badem', '24-26 adet veya 1 avuç veya 30 g'],
        ['Yer fıstığı', '27-30 adet veya 1 avuç veya 30 g'],
        ['Kaju', '18-20 adet veya 1 avuç veya 30 g'],
        ['Ayçiçeği çekirdeği', '1 kupa veya 5 avuç veya 60 g (kabuklu ölçü)'],
        ['Kabak çekirdeği', '½ kupa veya 2,5 avuç veya 40 g (kabuklu ölçü)'],
        ['Antep fıstığı', '2 avuç veya 60 g (kabuklu ölçü)']
      ], n: 'Yemek yapımında ilave edilebilecek yağın enerjiye katkısı dikkate alınmamıştır.' },

      { g: 'Ekmek ve tahıllar', ek: 'Ek 2.1.5', kcal: '≈150 kkal', f: [
        ['Ekmek', '2 ince dilim veya 50 g'],
        ['Pide, bazlama, lavaş', '¼ adet küçük veya ⅛ adet büyük veya 50 g'],
        ['Simit', '½ adet veya 50 g'],
        ['Hamburger ekmeği', '1 küçük veya ¾ orta veya ⅔ büyük'],
        ['Bulgur (pişmiş)', '½ kupa veya 1 silme orta kepçe veya 4-5 yemek kaşığı veya 90 g'],
        ['Pirinç (pişmiş)', '½ kupa veya 1 silme orta kepçe veya 4-5 yemek kaşığı veya 90 g'],
        ['Makarna (haşlanmış)', '½ kupa veya 1 silme orta kepçe veya 4-5 yemek kaşığı veya 75 g'],
        ['Çorba (tahıl, kuru baklagil, sebze vb.)', '¾ kupa veya 1,5 orta kepçe veya 180 mL veya 1 küçük kase — belirtilen ölçüler ½ standart porsiyondur'],
        ['Galeta veya grissini', '30 g'],
        ['Buğday/pirinç gevreği', '½ kupa veya 1 silme orta kepçe veya 30 g'],
        ['Yulaf ezmesi / müsli', '¼ kupa veya 30 g veya 1 silme çok küçük kepçe'],
        ['Mısır gevreği', '1 kupa veya 2 silme orta kepçe veya 30 g'],
        ['Yufka', '⅓ yufka veya 50 g'],
        ['Patlamış mısır', '3 kupa veya 1 büyük kase veya 25 g']
      ], n: 'Çiğ pirinç ve makarna için 1 standart porsiyon 30 g, çiğ bulgur için 25 g’dır. Yarım kiloluk makarna paketi ≈15 porsiyondur. ' +
           'Pilav ve makarnanın 1 standart porsiyonu garnitür ölçüsüdür; ana yemekten sonra ikinci kap olarak servis edilen pilav/makarna 2 standart porsiyona eşittir. ' +
           'Tam tahıllar tercih edilmelidir.' },

      { g: 'Sebzeler', ek: 'Ek 2.1.7', kcal: '25–85 kkal', f: [
        ['Koyu yeşil yapraklı sebzeler (pişmiş) — ıspanak, pazı, semizotu, karalahana, asma yaprağı', '1 kupa veya 1 yumruk veya 5-6 yemek kaşığı veya 2 orta kepçe veya 10-25 asma yaprağı'],
        ['Salata yeşillikleri (çiğ) — kıvırcık, marul, maydanoz, tere, roka, nane, dereotu, radika, reyhan', '2 kupa veya 2 yumruk veya 1 büyük kase dolusu (6 kupa doğranmamış çiğ ıspanaktan 1 kupa ıspanak yemeği çıkar)'],
        ['Diğer yeşil sebzeler (pişmiş) — brokoli, bamya, taze fasulye, taze bakla, bezelye, yeşil kabak, enginar, kuşkonmaz, brüksel lahanası', '1 kupa veya 1 yumruk veya 5-6 yemek kaşığı veya 2 orta kepçe'],
        ['Sivri/dolmalık biber, salatalık (çiğ, doğranmış)', '1 kupa veya 1 yumruk veya 1 küçük kase'],
        ['Iceberg marul (doğranmış, söğüş veya salata)', '2 kupa veya 2 yumruk veya 1 büyük kase'],
        ['Domates, havuç (çiğ veya pişmiş)', '1 orta boy veya 1 kupa veya 1 yumruk'],
        ['Kırmızı biber, turp, bal kabağı, pancar, patlıcan, kırmızı lahana (doğranmış)', '1 kupa veya 1 küçük kase veya 5-6 yemek kaşığı veya 2 orta kepçe'],
        ['Beyaz sebzeler — soğan, kereviz, lahana, karnabahar, pırasa, mantar, yer elması, şalgam', '1 kupa veya 1 yumruk veya 2 orta kepçe veya 5-6 yemek kaşığı'],
        ['Patates (nişastalı)', '½ orta boy veya 1 bilgisayar faresi büyüklüğü veya ½ kupa doğranmış/püre veya 6-10 cm uzunluğunda kesilmiş 8-10 adet'],
        ['Taze mısır (nişastalı)', '½ kupa haşlanmış; ½ adet 20-22 cm büyük koçan = 1,5 standart porsiyon'],
        ['Sebze suları', '150 mL']
      ], n: '1 standart porsiyon yaklaşık: pişmiş sebzelerde 150 g, salata/söğüş yeşil yapraklılarda 75 g, diğer çiğ tüketilenlerde 150 g, patates ve mısırda 90 g. ' +
           'Orta kepçe: 9 cm çapında 2 No’lu kepçe, 125 mL.' },

      { g: 'Meyveler', ek: 'Ek 2.1.9', kcal: '50–100 kkal', f: [
        ['Elma, portakal, şeftali, nektarin', '1 orta boy (7 cm çapında) veya 1 yumruk büyüklüğünde'],
        ['Armut, ayva', '1 küçük boy veya 1 kg’a 5 adet giren büyüklükte'],
        ['Mandalina', '2 orta boy; 6 cm çapında'],
        ['Limon', '2 büyük; 6,5 cm çapında'],
        ['Kivi', '2 orta boy; 5 cm çapında'],
        ['Muz', '1 el uzunluğu veya dilimlenmiş ⅔ küçük kase'],
        ['Trabzon hurması', '2 yemek kaşığı dolusu'],
        ['Karpuz, kavun', 'Kibrit kutusu büyüklüğünde 4-5 dilim veya 3 parmak genişliği ve uzunluğunda 2 dilim veya 9×6×2 cm 3 üçgen dilim veya 8 kg’lık karpuzun 1/16’sı'],
        ['Kiraz, vişne', '13-15 iri boy veya 1 küçük kase'],
        ['Çilek', '7-8 iri veya 15 orta boy'],
        ['Üzüm çeşitleri', '20 iri veya 25-30 küçük taneli veya 1 küçük kase'],
        ['Böğürtlen, ahududu, dut', '50-60 adet veya 1 küçük kase'],
        ['Yaban mersini', '1 küçük kase'],
        ['Nar', '10 cm çapında yarım veya tanelenmiş 1 küçük kase'],
        ['Kayısı', '4 büyük veya 7-8 küçük'],
        ['İncir', '2 adet; 6,5 cm çapında'],
        ['Yenidünya', '8 büyük veya 12 küçük boy'],
        ['Ananas', '1 parmak (1,5 cm) kalınlığında 2 ince dilim'],
        ['Erik', '1 büyük veya 3-5 küçük'],
        ['Kuru kayısı, kuru erik, kuru incir', '3-4 adet'],
        ['Kuru üzüm', '20-30 adet veya 30 g'],
        ['Hurma', '1 büyük veya 3 adet küçük']
      ], n: '1 standart porsiyon: kuru meyvelerde 30 g, muzda 100 g, Trabzon hurmasında 80 g, diğer tüm meyvelerde 150 g. ' +
           'Dilimlenmiş büyük meyve veya küçük taneli meyvede 1 küçük kase = 1 standart porsiyon.' }
    ],

    /* ---- Ek 2.1.2/6/8/10 — yaş ve cinsiyete göre günlük toplam porsiyon ----
       Satır sırası yas[] ile aynı; [erkek, kadın] */
    gunluk: [
      { g: 'Süt, yoğurt, peynir', ek: 'Ek 2.1.2', u: 'porsiyon/gün',
        v: [['2½', '2'], ['2½', '2½'], ['3', '3'], ['3', '3'], ['3', '3'], ['3', '3'], ['3', '3'], ['3', '3']] },
      { g: 'Ekmek ve tahıllar', ek: 'Ek 2.1.6', u: 'porsiyon/gün',
        v: [['2½', '2½'], ['2½–3', '2½'], ['3–4', '3–3½'], ['4½–5', '4–4½'], ['7–8', '4–5'], ['5', '3½–4'], ['4–4½', '3½'], ['4', '3']] },
      { g: 'Sebzeler', ek: 'Ek 2.1.8', u: 'porsiyon/gün',
        v: [['1–2', '1–2'], ['2', '2'], ['2–2½', '2–2½'], ['2–2½ – 3½', '2–2½ – 3'], ['3½–4', '3½'], ['3½', '2½'], ['2½–3', '2½'], ['2½', '2½']] },
      { g: 'Meyveler', ek: 'Ek 2.1.10', u: 'porsiyon/gün',
        v: [['1½', '1½'], ['1½–2', '1½'], ['2', '2'], ['2½', '2–2½'], ['2½–3', '2½'], ['2½', '2'], ['2–2½', '2'], ['2', '2']] }
    ],

    /* ---- Ek 2.1.4 — et, tavuk, balık, yumurta, kuru baklagil, yağlı tohum ---- */
    et: {
      ek: 'Ek 2.1.4',
      c: [
        ['Et, tavuk, balık, yumurta', 'toplam porsiyon/gün'],
        ['Et, tavuk', 'porsiyon/gün'],
        ['Yumurta', 'porsiyon'],
        ['Balık', 'porsiyon/hafta'],
        ['Kuru baklagiller', 'porsiyon/hafta'],
        ['Yağlı tohumlar', 'porsiyon/gün']
      ],
      E: [
        ['¾–1', '¼–⅓', 'her gün ½', '⅔–1', '1', '⅛ (⅓)'],
        ['1–1½', '⅓–¾', 'her gün ½', '1–1½', '1–2', '¼ (½)'],
        ['1½', '¾', 'her gün ½', '1½–2', '3', '½ (1)'],
        ['1½', '¾', 'her gün ½', '2', '3', '½ (1)'],
        ['2', '1¼', 'her gün ½', '2', '3–4', '1 (1⅓)'],
        ['1½', '¾', 'haftada 2½', '2', '3', '½ (1)'],
        ['1½', '¾', 'haftada 2½', '2', '3', '½ (1)'],
        ['1½', '¾', 'haftada 2½', '2', '3', '½ (1)']
      ],
      K: [
        ['¾–1', '¼–⅓', 'her gün ½', '⅔–1', '1', '⅛ (⅓)'],
        ['1', '½', 'her gün ½', '1–1½', '1–2', '¼ (½)'],
        ['1½', '¾', 'her gün ½', '1½–2', '3', '½ (1)'],
        ['1½', '¾', 'her gün ½', '2', '3', '½ (1)'],
        ['1½', '1', 'her gün ½', '2', '3', '½ (1)'],
        ['1½', '¾', 'haftada 2½', '2', '3', '½ (1)'],
        ['1½', '¾', 'haftada 2½', '2', '3', '½ (1)'],
        ['1½', '¾', 'haftada 2½', '2', '3', '½ (1)']
      ],
      n: [
        'Yağlı tohumlarda parantez içindeki değer üst porsiyon sınırıdır.',
        'Et miktarı: ⅓ porsiyon pişmiş ≈ 25-30 g · ¾ porsiyon ≈ 60 g · 1 porsiyon ≈ 80 g · 1¼ porsiyon ≈ 100 g.',
        'TÜBER 2015’te önerilen 60-100 g/gün toplam et tüketiminin en fazla ½–⅓’ünün kırmızı etten, kalanının kanatlı etinden karşılanması önerilir. ' +
        'Bu miktar haftada toplam 2½–3 porsiyona eşittir. İşlenmiş et ürünleri isteğe bağlı tercihler sınıfındadır; yüksek sodyum içerikleri nedeniyle tüketimi en aza indirilmelidir.',
        'Yağlı tohum-sert kabuklu yemişlerin et, tavuk, balık ve yumurtadan bağımsız olarak, mümkünse her gün tüketilmesi önerilir.'
      ]
    },

    n: '10-18 yaş grubu için orta aktif, diğer yaş grupları için az aktif enerji gereksinimine göre belirlenmiştir. ' +
       'Ayrıntılı değerlendirme için Ek 2.3.1 ve Ek 3.1.1’e bakın.'
  };
})();
