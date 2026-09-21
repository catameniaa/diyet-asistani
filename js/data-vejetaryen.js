/* TÜBER 2022 Bölüm 8.3 — Vejetaryen beslenmesi (s. 180–185) ve Tablo 8.5 (s. 181)
   Betül Çiçek, Gülşah Kaner Tohtak */
(function () {
  'use strict';

  DA.data.vejetaryen = {
    src: 'TÜBER 2022, Bölüm 8.3 ve Tablo 8.5 (s. 180–185)',

    /* ---- 8.3.1 Vejetaryen diyet türleri ---- */
    tur: [
      { k: 'vegan', l: 'Vegan', d: 'Et ve et ürünleri, yumurta, süt ve süt ürünleri dahil hiçbir hayvansal '
        + 'kaynaklı besin tüketilmez. Diyet tahıllar, kuru baklagiller, yağlı tohumlar, sebze ve meyvelerden oluşur.',
        risk: ['B12 vitamini', 'Riboflavin (B2)', 'D vitamini', 'Kalsiyum', 'Demir', 'Çinko', 'Omega-3'] },
      { k: 'lakto', l: 'Lakto-vejetaryen', d: 'Bitkisel besinlerle birlikte süt ve süt ürünleri tüketilir. '
        + 'Et ve et ürünleri ile yumurta tüketilmez.',
        risk: ['B12 vitamini', 'Demir', 'Çinko'] },
      { k: 'ovo', l: 'Ovo-vejetaryen', d: 'Bitkisel besinlerle birlikte yumurta tüketilir. '
        + 'Et ve et ürünleri ile süt ve süt ürünleri tüketilmez.',
        risk: ['Kalsiyum', 'Demir', 'Riboflavin (B2)'] },
      { k: 'laktoovo', l: 'Lakto-ovo vejetaryen', d: 'Bitkisel besinlerle birlikte süt ve süt ürünleri ile '
        + 'yumurta tüketilir. Et ve et ürünleri tüketilmez. Günümüzde en sık uygulanan vejetaryen beslenme şeklidir.',
        risk: ['Demir'] },
      { k: 'polo', l: 'Polo-vejetaryen', d: 'Bitkisel besinlerle birlikte tavuk ve kümes hayvanları tüketilir. '
        + 'Kırmızı et ve et ürünleri tüketilmez.', risk: [] },
      { k: 'pesko', l: 'Pesko-vejetaryen', d: 'Bitkisel besinlerle birlikte süt ve süt ürünleri, yumurta, '
        + 'balık çeşitleri, midye ve su ürünleri tüketilir. Kırmızı et ve et ürünleri tüketilmez.', risk: [] },
      { k: 'semi', l: 'Semi-vejetaryen (fleksitaryen)', d: 'Yumurta, süt ve süt ürünleri tüketiminde sınırlama '
        + 'yoktur. Yalnızca tavuk ve balık sınırlı miktarda tüketilir. Kırmızı et ve et ürünleri tüketilmez.', risk: [] }
    ],

    /* ---- 8.3.2 Makro besin ögeleri ---- */
    makro: [
      { n: 'Protein', v: '1 g/kg/gün', s: 'Sağlıklı yetişkinlerdeki gibi vücut ağırlığının kilogramı başına 1 gram. '
        + 'Enerjinin %10–20’si proteinden. Veganlarda soya fasulyesi kaliteli protein alımını artırır.' },
      { n: 'Karbonhidrat', v: 'Enerjinin %45–60’ı', s: 'Tam tahıl ürünleri, saflaştırılmamış tahıllar, sebze ve meyve tercih edilir.' },
      { n: 'Yağ', v: 'Enerjinin %20–35’i', s: 'Toplam yağın 1/3’ü doymuş, 1/3’ü çoklu doymamış, 1/3’ü tekli doymamış yağ asitlerinden.' },
      { n: 'Kolesterol', v: '< 300 mg/gün', s: 'Günlük alım bu miktarı aşmamalıdır.' },
      { n: 'Sıvı', v: 'Vejetaryen olmayanlarla aynı', s: 'Vejetaryen bireylerin sıvı gereksinimi farklı değildir.' }
    ],

    /* ---- Tablo 8.5 — günlük porsiyon miktarları ---- */
    porsiyon: {
      t: 'Vejetaryenler için günlük besin grubu porsiyonları', ek: 'Tablo 8.5',
      r: [
        { g: 'Tahıl grubu (ekmek, pirinç vb.)', p: '3–6', o: [
          'Ekmek: 2 ince dilim veya 50 g',
          'Kahvaltılık gevrek: 1 kupa veya 30 g',
          'Pişmiş pirinç, bulgur: ½ kupa veya 4–5 yemek kaşığı veya 90 g',
          'Haşlanmış makarna: ½ kupa veya 4–5 yemek kaşığı veya 75 g'] },
        { g: 'Sebze grubu', p: '3–5', o: [
          'Pişmiş sebze: 1 kupa veya 1 yumruk veya 4–5 yemek kaşığı veya 150 g',
          'İri doğranmış çiğ yeşil yapraklı sebzeler: 2 kupa veya 2 yumruk veya 1 büyük kase veya 75 g'] },
        { g: 'Meyve grubu', p: '2–4', o: [
          'Büyük meyveler: 1 kupa veya 1 yumruk büyüklüğünde veya 150 g',
          'Dilimlenmiş büyük meyve veya küçük taneli meyve: 1 kupa veya 1 küçük kase',
          'Kuru kayısı, erik, incir: 3–4 adet',
          'Kuru üzüm: 20–30 adet veya 30 g'] },
        { g: 'Süt ve süt ürünleri grubu', p: '0–3', o: [
          'Süt: 1 orta boy kupa veya 240 mL',
          'Yoğurt: 1 orta boy kupa veya 1 küçük kase veya 200 mL',
          'Beyaz peynir: üç parmak veya iki kibrit kutusu büyüklüğünde veya 60 g',
          'Kaşar peyniri: iki parmak veya 40 g'] },
        { g: 'Yumurta, kuru baklagiller grubu', p: '2–3', o: [
          'Pişmiş kuru baklagiller: ¾ kupa veya 2 küçük kepçe veya 8–10 yemek kaşığı veya 130 g',
          '1 yumurta: 1 küçük boy veya 50 g',
          'Fındık: 30 adet veya 1 avuç veya 30 g',
          'Ceviz: 4 adet veya 30 g',
          'Fındık/fıstık ezmesi: 1 tatlı kaşığı dolusu veya 25 g'] },
        { g: 'Katı-sıvı yağlar, şekerler', p: 'Tercihe bağlı', o: [] }
      ]
    },

    /* ---- 8.3.2 Dikkat edilecek besin ögeleri ---- */
    dikkat: [
      { n: 'B12 vitamini', s: 'Veganlarda karşılaşılan en büyük sorunlardan biri. Uzun süre vegan diyeti '
        + 'uygulayanlarda anemi ve geri dönüşsüz sinir hasarı gelişebilir. Özellikle veganların diyeti '
        + 'B12 açısından diyetisyen tarafından kontrol edilmelidir. Yaşlı, gebe-emziren, bebek ve çocuklarda önemlidir.' },
      { n: 'Riboflavin (B2)', s: 'Veganlarda B12 ile birlikte en sık görülen eksikliklerden biri.' },
      { n: 'D vitamini', s: 'Düzenli güneş ışığına maruz kalınmalıdır. Deri rengi koyu olanlar, bebek ve çocuk, '
        + 'yaşlı, eve bağımlı, kapalı giyim tarzı olanlar ve özellikle veganlar dikkat etmelidir.' },
      { n: 'Kalsiyum', s: 'Süt ve ürünlerini tüketmeyen veganlar yeşil yapraklı sebze, kuruyemiş, kuru baklagil ve '
        + 'tam tahıl ürünlerinden almalıdır. Pratik yol: seçilen her porsiyon besinin yaklaşık 100–150 mg kalsiyum içermesi.' },
      { n: 'Demir', s: 'Sebze ve tahıllardaki demirin kullanılabilirliği etteki demire göre düşüktür. '
        + 'Her öğünde C vitamininden zengin bir besin (turunçgil, brokoli, domates, yeşil biber) tüketilmelidir. '
        + 'Çay ve kahve demir ve çinko emilimini azaltır; yemekten 1 saat önce ya da 2 saat sonra içilmelidir.' },
      { n: 'Çinko', s: 'Lakto-ovo vejetaryenler süt, peynir, yoğurt ve yumurtadan yeterince alır. '
        + 'Kırmızı et, kümes hayvanı ve deniz ürünü tüketmeyenlerde yetersiz kalabilir. '
        + 'Mayalandırılmış tahıl ürünleri tercih edildiğinde çinko yetersizliği oluşmaz.' },
      { n: 'Omega-3', s: 'Veganların diyeti omega-3 açısından yetersiz, omega-6 açısından yüksektir. '
        + 'Denge bozulduğunda büyüme döneminde beyin gelişimi, görme ve merkezi sinir sisteminde sorunlara, '
        + 'yetişkinlikte kalp-damar ve iltihabi hastalık riskinde artışa yol açabilir. '
        + 'Ceviz, keten tohumu, kanola yağı ve soya ürünleri kullanılmalıdır.' }
    ],

    /* ---- 8.3.3 Özel gruplar ---- */
    ozel: [
      { g: 'Bebek', s: 'Vejetaryen annelerin sütünün içeriği vejetaryen olmayanlarınkine benzer; anne sütüyle '
        + 'beslemeye özen gösterilmelidir. Ticari bebek mamaları, hayvan sütleri ve soya sütü anne sütünün yerini almaz. '
        + 'Anne kalsiyum, demir, çinko ve B12 vitaminini yeterli almalıdır.' },
      { g: 'Çocuk', s: 'Lakto-ovo vejetaryen beslenen çocukların büyümesi vejetaryen olmayanlara benzer. '
        + 'Çok katı vejetaryen beslenmede büyüme geriliği görülebilir; enerji, protein, B12, D vitamini, kalsiyum ve '
        + 'riboflavin eksikliği ile ilişkilidir. Ara öğün eklemek ve öğün sıklığını artırmak yardımcı olur; '
        + 'fındık/fıstık ezmesi, avokado ve bitkisel yağlar gibi enerji yoğunluğu yüksek besinler eklenmelidir. '
        + 'Vegan çocukların protein gereksinimi biraz daha fazladır.' },
      { g: 'Adolesan', s: 'Vejetaryen adolesanlar diyetle daha fazla posa, demir, folat, A ve C vitamini alır; '
        + 'daha fazla meyve-sebze, daha az tatlı-tuzlu atıştırmalık ve fast-food tüketir. '
        + 'Vegan beslenenlerde kalsiyum, demir, B12 ve D vitamini alımına dikkat edilmelidir.' },
      { g: 'Sporcu', s: 'Vejetaryen sporcular enerji, protein, yağ ve bazı mikro besin ögelerini (demir, kalsiyum, '
        + 'riboflavin, çinko, D ve B12 vitamini) yetersiz alabilir; spor diyetisyeni danışmanlığında plan gerekir.' }
    ],

    /* ---- 8.3.4 Öneriler ---- */
    tamamlama: 'Bazı bitkisel besinler birlikte tüketildiğinde elzem amino asitler dengelenir. '
      + 'Örnek: etsiz pişirilen kuru fasulye yemeğiyle birlikte bulgur ya da pirinç pilavı.',
    fayda: 'İyi planlanmış vejetaryen diyet; gebelik, emziklilik, bebeklik, adolesan dönem ve yaşlılık dahil '
      + 'yaşam döngüsünün tüm aşamalarına uyarlanabilir. Kalp damar hastalıkları, hipertansiyon, diyabet, '
      + 'obezite ve bazı kanser türlerinin görülme riskini azalttığı bildirilmiştir.'
  };
})();
