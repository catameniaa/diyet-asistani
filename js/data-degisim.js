/* Besin değişim listesi — her satır, grubundaki 1 değişimin (ya da yazılı
   karşılığın) ev ölçüsüdür. Diyet listesi yazıcının seçenekleri ve
   Referans → "Besin değişim listesi" buradan gelir.

   Kaynak: Dyt. Can Bayramoğlu'nun izinli olarak sağladığı iki değişim
   listesi (Kasım 2026). Kaynakların adları, sahiplerinin isteğiyle
   uygulamada, kodda ve commit'lerde geçmez. Satırdaki k alanı hangisinden
   geldiğini gösterir:
     A — ana kaynak: 7 gruplu, brüt-net gramlı liste. Süt, et, ekmek-tahıl-
         baklagil, meyve, sebze, yağ ve yağlı tohum gruplarında esas.
         Tahıl ve baklagil ölçüleri pişmiş ve tepeleme kaşıkla; sebzelerde
         çiğ ölçü, pişmişi 5–6 yemek kaşığı.
     B — ikinci liste (TÜBER 2022 ve TürKomp'a dayandığını belirtir):
         yemekler, tatlılar, markalı ürünler ve A'da olmayan besinler.

   Grup makroları hiçbir kaynaktan ALINMADI: kcal ve makrolar uygulamanın
   kendi değişim değerleriyle hesaplanır (js/exchange.js). A kuru
   baklagilleri ekmek grubunda sayar; uygulamada Dyt. Can Bayramoğlu'nun
   kuralıyla ayrı "kuru baklagil" değişimidir (15 g KH + 5 g protein).

   Kararlar (17–18 Kasım 2026, Dyt. Can Bayramoğlu'na soruldu):
     · A ile B çeliştiğinde A geçerli. Önceki günün kararlarından A'dan
       farklı olanlarda da A seçildi: et 1 değişim 30 g çiğ / 20 g pişmiş
       (önce 30 g pişmiş denmişti); mercimek 2 yemek kaşığı (önce 4);
       pişmiş sebze 5–6 yemek kaşığı (önce bazılarında 4); market (light)
       yoğurdu 3/4 su bardağı (4 tepeleme yk, 150 g), ev yoğurdu 1 su bardağı
       (200 g) — önce tersi seçilmişti
     · yoğurt satırlarında gramaj listeye de yazılır
     · ayran 1,5 su bardağı = 1 büyük su bardağı (300 g)
     · çorba 1 küçük kase = 1 ekmek + 1 yağ (A ve B'de yalnız ekmek)
     · süzme yoğurt 2 tepeleme yk (50 g) = 1 süt (B'den)
     · A'da "light" yazan süt, yoğurt ve ayran yarım yağlı süt değişimine,
       ev yoğurdu ve kefir tam yağlı süt değişimine bağlandı. Tam yağlı
       süt/yoğurt/ayran aynı ölçüyle ayrıca seçenek olur (uygulamanın
       değişim listesi iki yağ düzeyinde aynı ölçüyü kullanır).
   Alınmayanlar: kıyma, biftek, hindi füme ve yaban mersini (kullanıcı
   atladı; kıyma, biftek ve yaban mersini A'da da var, istenirse eklenir);
   B'nin A ile çelişen ya da A'nın kapsadığı satırları (ör. haşlanmış mısır
   "4 yk 40 g"; A'da koçan mısır "4 yk tane 90 g"). */
(function () {
  'use strict';

  /* [ad, ölçü, miktar, not, karşılık (yoksa grubun 1 değişimi), seçenekler]
     seçenekler: k = kaynak ('A' varsayılan), m = marka (ad küçük harfe
     çevrilmez), t = listeye yazılacak metin (ölçü + ad'dan farklıysa),
     s = serbest (değişim düşülmez), p = pişmiş ölçü (sebze), tam = tam
     yağlısı aynı ölçüyle 1 tam yağlı süt değişimi (ad, tam yağlı adı) */
  const R = (ad, olcu, miktar, not, d, o) => ({ ad, olcu, miktar: miktar || '', not: not || '', d, o: o || {} });
  const B = { k: 'B' };
  const BM = { k: 'B', m: 1 };
  const P56 = { p: '5–6 yemek kaşığı' };

  const satirlar = {
    eyg: [
      R('Ekmek (beyaz, buğday)', '1 ince dilim', '25 g'),
      R('Mısır ekmeği', '1 ince dilim', '25 g'),
      R('Çavdar, yulaf, tam buğday ya da kepekli ekmek', '1 ince dilim', '30 g', '', null, { t: '1 ince dilim tam buğday, çavdar ya da kepekli ekmek' }),
      R('Bazlama', '1/5 orta boy', '30 g'),
      R('Lavaş', '1 küçük boy', '30 g'),
      R('Hamburger ekmeği (küçük)', '1/2 adet', '25 g'),
      R('Sandviç ekmeği (küçük)', '1/3 adet', '25 g'),
      R('Böreklik yufka', '1/6 adet', '25 g'),
      R('Galeta', '1,5 büyük boy', '20 g'),
      R('Simit', '1/4 adet (çeyrek)', '25 g', '', null, B),
      R('Grisini', '3–4 adet', '20 g', '', null, B),
      R('Etimek', '2 dilim', '20 g', '', null, B),
      R('Pirinç pilavı', '2 yemek kaşığı (tepeleme)', '20 g pirinç (çiğ)'),
      R('Bulgur pilavı', '3 yemek kaşığı (tepeleme)', '20 g bulgur (çiğ)'),
      R('Makarna', '3 yemek kaşığı (tepeleme)', '20 g (çiğ)'),
      R('Erişte', '3 yemek kaşığı (tepeleme)', '20 g (çiğ)'),
      R('Kuskus', '3 yemek kaşığı', '20 g', '', null, B),
      R('Yarma (aşurelik buğday)', '3 yemek kaşığı (tepeleme)', '25 g (çiğ)'),
      R('Mercimek çorbası', '1 küçük kase', '25 g mercimek (çiğ)', '', { eyg: 1, yag: 1 }),
      R('Şehriye, pirinç, tarhana ya da un çorbası', '1 küçük kase', '20 g (çiğ)', '', { eyg: 1, yag: 1 }),
      R('Yayla çorbası', '1 küçük kase', '', 'Pirinçli', { eyg: 1, yag: 1 }, B),
      R('Un (buğday, mısır)', '3 silme yemek kaşığı', '20 g (çiğ)'),
      R('İrmik', '2 yemek kaşığı', '20 g'),
      R('Nişasta', '3 silme yemek kaşığı', '20 g', '', null, B),
      R('Yulaf ezmesi', '2 yemek kaşığı', '25 g'),
      R('Müsli', '3 yemek kaşığı', '20 g', '', null, B),
      R('Tahıl / mısır gevreği (sade)', '3 yemek kaşığı', '20 g'),
      R('Bisküvi (tuzlu, diyet)', '4 adet', '25 g'),
      R('Patates', '1 küçük boy', '100 g (çiğ, net)'),
      R('Bezelye (iç)', '3 yemek kaşığı (pişmiş)', '', 'Çiğ: 4 yemek kaşığı (125 g)'),
      R('Kestane', '4 orta boy', '40 g'),
      R('Koçan mısır', '1 küçük boy (bütün)', '90 g', 'Ya da 4 yemek kaşığı tane'),
      R('Patlamış mısır (yağsız)', '3 su bardağı', '25 g'),
      R('Leblebi (sarı ya da beyaz)', '1/2 çay bardağı', '25 g'),
      R('Uno Grissuno', '1 paket', '30 g', '', { eyg: 2 }, BM),
      R('Bal', '1 yemek kaşığı', '20 g', '', null, B),
      R('Boza', '1 bardak', '200 ml', '', { eyg: 2.5 }, B)
    ],
    et: [
      R('Kuşbaşı et (yağsız)', '3 orta boy', '30 g çiğ / 20 g pişmiş'),
      R('Köfte', '1 küçük yumurta boyutunda', '40 g çiğ / 30 g pişmiş'),
      R('Tavuk göğsü fileto', '1/4 küçük boy', '30 g çiğ / 20 g pişmiş', 'Derisiz'),
      R('Tavuk baget (kemiksiz)', '1 küçük boy', '30 g çiğ / 20 g pişmiş', 'Derisiz'),
      R('Hindi eti (kemiksiz, derisiz)', '3 parmak boyutunda', '30 g çiğ / 20 g pişmiş'),
      R('Levrek', '1/5 küçük boy', '55 g brüt / 30 g net'),
      R('Alabalık', '1/6 orta boy', '45 g brüt / 30 g net'),
      R('Çipura', '1/4 küçük boy', '60 g brüt / 30 g net'),
      R('Somon', '2 parmak boyutunda', '40 g brüt / 30 g net'),
      R('İstavrit', '4 küçük boy', '60 g brüt / 30 g net'),
      R('Mezgit', '3 orta boy', '100 g brüt / 40 g net'),
      R('Lüfer', '3 yarım parmak boyutunda', '40 g brüt / 30 g net'),
      R('Sazan', '2 parmak boyutunda', '55 g brüt / 40 g net'),
      R('Hamsi', '5 orta boy', '45 g brüt / 30 g net'),
      R('Dardanel ton balığı (konserve)', '1 kutu', '75 g', '', { et: 1.8 }, BM),
      R('Superfresh ton balığı (konserve)', '1 kutu', '135 g brüt / 85 g net', '', { et: 2.3 }, BM),
      R('Yumurta', '1 küçük boy', '55 g brüt / 50 g net'),
      R('Bıldırcın yumurtası', '5 adet', '75 g brüt / 50 g net'),
      R('Beyaz peynir (inek)', '2 parmak boyutunda', '40 g'),
      R('Koyun peyniri', '3 yarım parmak boyutunda', '30 g'),
      R('Keçi peyniri', '2 parmak boyutunda', '40 g'),
      R('Kaşar peyniri (taze ya da eski)', '3 yarım parmak boyutunda', '30 g'),
      R('Lor peyniri', '3 yemek kaşığı (tepeleme)', '50 g'),
      R('Çökelek', '2 yemek kaşığı', '25 g'),
      R('Ezine peyniri', '3 yarım parmak boyutunda', '30 g'),
      R('Tulum peyniri', '3 yarım parmak boyutunda', '30 g'),
      R('Dil peyniri', '3 yarım parmak boyutunda', '30 g'),
      R('Süzme peynir', '2 parmak boyutunda', '40 g'),
      R('Krem peynir', '1 yemek kaşığı (tepeleme)', '45 g'),
      R('Hellim peyniri', '3 yarım parmak boyutunda', '30 g'),
      R('Örgü peyniri', '3 yarım parmak boyutunda', '30 g'),
      R('Çeçil peyniri', '3 yarım parmak boyutunda', '30 g'),
      R('Cheddar peyniri', '3 yarım parmak boyutunda', '30 g'),
      R('Gravyer peyniri', '2 yarım parmak boyutunda', '20 g'),
      R('Sucuk', '4 ince dilim', '20 g', '', null, B),
      R('Pastırma', '3–4 dilim', '25 g', '', null, B)
    ],
    sut: [
      R('Süt (light)', '1 su bardağı', '200 ml', '', { sutyy: 1 }, { t: '1 su bardağı yarım yağlı süt', tam: ['Süt', '1 su bardağı süt'] }),
      R('Yoğurt (light)', '3/4 su bardağı (4 tepeleme yemek kaşığı)', '150 g', '', { sutyy: 1 },
        { t: '3/4 su bardağı (4 tepeleme yemek kaşığı) yarım yağlı yoğurt (150 g)', tam: ['Yoğurt', '3/4 su bardağı (4 tepeleme yemek kaşığı) yoğurt (150 g)'] }),
      R('Ev yoğurdu', '1 su bardağı', '200 g', '', { sut: 1 }, { t: '1 su bardağı ev yoğurdu (200 g)' }),
      R('Ayran (light)', '1,5 su bardağı (1 büyük su bardağı)', '300 g', '', { sutyy: 1 },
        { t: '1,5 su bardağı (1 büyük su bardağı) yarım yağlı ayran', tam: ['Ayran', '1,5 su bardağı (1 büyük su bardağı) ayran'] }),
      R('Kefir', '1 su bardağı', '200 g', '', { sut: 1 }),
      R('Süzme yoğurt', '2 tepeleme yemek kaşığı', '50 g', '', { sut: 1 }, B),
      R('Activia probiyotik yoğurt', '1 kutu', '100 g', '', { sut: 0.6 }, BM),
      R('Süt tozu', '3 yemek kaşığı', '25 g', '', { sut: 1 }, B),
      R('Latte', '1 orta boy', '', '', { sut: 1 }, B)
    ],
    meyve: [
      R('Ahududu', '35 orta boy', '200 g'),
      R('Ananas', '2 parmak kalınlığında 1 dilim', '300 g brüt / 160 g net'),
      R('Armut', '1 küçük boy', '140 g brüt / 125 g net'),
      R('Ayva', '1/2 büyük boy', '140 g brüt / 110 g net'),
      R('Babutsa (kaktüs meyvesi)', '2 orta boy', '250 g brüt / 160 g net'),
      R('Böğürtlen', '35 orta boy', '210 g'),
      R('Çilek', '18 orta boy', '305 g brüt / 300 g net'),
      R('Dut', '3/4 su bardağı (karışık boy)', '115 g'),
      R('Elma', '1 orta boy', '130 g brüt / 120 g net'),
      R('Erik (mürdüm)', '3 orta boy', '115 g brüt / 110 g net'),
      R('Erik (yeşil)', '7 orta boy', '140 g brüt / 130 g net'),
      R('Greyfurt', '1 orta boy', '230 g brüt / 175 g net'),
      R('İncir', '2 küçük boy', '120 g brüt / 110 g net'),
      R('Karayemiş', '23 orta boy', '110 g brüt / 100 g net'),
      R('Karpuz', '1/8 orta boyun yarısı', '330 g brüt / 220 g net'),
      R('Kavun', '1/8 küçük boy', '315 g brüt / 170 g net'),
      R('Kayısı', '7 orta boy', '190 g brüt / 175 g net'),
      R('Kiraz', '11 büyük boy', '120 g brüt / 110 g net'),
      R('Kivi', '2 küçük boy', '125 g brüt / 110 g net'),
      R('Kızılcık', '1 su bardağı', '200 g brüt / 100 g net'),
      R('Limon', '2 büyük boy', '250 g brüt / 200 g net'),
      R('Mandalina', '2 orta boy', '175 g brüt / 140 g net'),
      R('Mango', '1/3 büyük boy', '145 g brüt / 120 g net'),
      R('Muz', '1 küçük boy', '140 g brüt / 85 g net'),
      R('Nar', '1 orta boy', '250 g brüt / 160 g net'),
      R('Portakal', '1 orta boy', '180 g brüt / 140 g net'),
      R('Şeftali', '1 orta boy', '220 g brüt / 185 g net'),
      R('Üzüm', '25 adet (karışık boy)', '100 g'),
      R('Vişne', '35 adet (karışık boy)', '150 g brüt / 125 g net'),
      R('Trabzon hurması', '1 küçük boy', '120 g brüt / 100 g net'),
      R('Yeni dünya', '7 orta boy', '160 g brüt / 120 g net'),
      R('Kuru erik', '3 orta boy', '25 g'),
      R('Kuru incir', '2 küçük boy', '25 g'),
      R('Kuru kayısı', '4 küçük boy', '25 g'),
      R('Kuru üzüm', '1 yemek kaşığı (tepeleme)', '20 g'),
      R('Kuru hurma', '3 orta boy', '25 g'),
      R('Kuru dut', '2 yemek kaşığı (tepeleme)', '20 g')
    ],
    sebze: [
      R('Kırmızı turp', '1 orta boy (çiğ)', '170 g brüt / 150 g net'),
      R('Siyah turp', '1 büyük boy (çiğ)', '115 g brüt / 100 g net'),
      R('Salatalık, acur', '2 orta boy (çiğ)', '250 g brüt / 200 g net'),
      R('Domates', '1 büyük boy (çiğ)', '230 g brüt / 200 g net'),
      R('Kuru soğan', '1/2 orta boy (çiğ)', '85 g brüt / 75 g net'),
      R('Yeşil soğan', '6 orta boy (çiğ)', '140 g brüt / 125 g net'),
      R('Yeşil sivri biber', '8 büyük boy (çiğ)', '145 g brüt / 125 g net'),
      R('Dolmalık biber', '3 büyük boy (çiğ)', '165 g brüt / 150 g net'),
      R('Çarliston biber', '5 büyük boy (çiğ)', '190 g brüt / 175 g net'),
      R('Yeşil biber', '4–5 büyük adet', '', '', null, B),
      R('Asma yaprağı', '8 büyük boy (çiğ)', '35 g'),
      R('Kara lahana', '2 orta boy yaprak (çiğ)', '60 g', '', null, P56),
      R('Beyaz lahana', '3 su bardağı doğranmış (çiğ)', '150 g', '', null, P56),
      R('Kırmızı lahana', '1 su bardağı doğranmış (çiğ)', '80 g', '', null, P56),
      R('Brüksel lahanası', '5 büyük boy (çiğ)', '125 g', '', null, P56),
      R('Pırasa', '1 orta boy (çiğ)', '120 g brüt / 100 g net', '', null, P56),
      R('Taze kabak', '1 büyük boy (çiğ)', '265 g brüt / 250 g net', '', null, P56),
      R('Bal kabağı (kabuksuz)', '1 orta boy kare dilim (çiğ)', '75 g', '', null, P56),
      R('Kereviz', '1/2 orta boy (çiğ)', '170 g brüt / 100 g net', '', null, P56),
      R('Havuç', '2 küçük boy (çiğ)', '135 g brüt / 100 g net', '', null, P56),
      R('Kırmızı pancar', '3/4 küçük boy (çiğ)', '90 g brüt / 75 g net', '', null, P56),
      R('Şalgam', '1 büyük boy (çiğ)', '170 g brüt / 150 g net', '', null, P56),
      R('Patlıcan', '1 büyük boy (çiğ)', '250 g brüt / 200 g net', '', null, P56),
      R('Taze fasulye', '6 orta boy (çiğ)', '85 g', '', null, P56),
      R('Bamya', '30 büyük boy (çiğ)', '95 g brüt / 80 g net', '', null, P56),
      R('Karnabahar', '3 orta boy çiçek (çiğ)', '150 g', '', null, P56),
      R('Pazı', '13 orta boy yaprak (çiğ)', '200 g', '', null, P56),
      R('Ebegümeci', '5 su bardağı doğranmış (çiğ)', '100 g', '', null, P56),
      R('Mantar (kültür)', '8 orta boy (çiğ)', '225 g', '', null, P56),
      R('Yer elması', '2 orta boy (çiğ)', '190 g brüt / 150 g net', '', null, P56),
      R('Taze börülce', '8 orta boy (çiğ)', '100 g', '', null, P56),
      R('Brokoli', '7 karışık boy çiçek (çiğ)', '125 g', '', null, P56),
      R('Taze bakla', '16 büyük boy (çiğ)', '160 g brüt / 150 g net', '', null, P56),
      R('Enginar (çanak)', '2 büyük boy (çiğ)', '225 g', '', null, P56),
      R('Semizotu', '1 küçük bağ (çiğ)', '340 g brüt / 300 g net', '', null, P56),
      R('Ispanak', '1 orta bağ (çiğ)', '225 g brüt / 200 g net', '', null, P56),
      R('Kuru biber', '5 orta boy (çiğ)', '15 g', '', null, P56),
      R('Kuru patlıcan', '6 orta boy (çiğ)', '20 g', '', null, P56),
      R('Kuru bamya', '3 yemek kaşığı (çiğ)', '25 g', '', null, P56),
      R('Roka, marul, maydanoz', 'Serbest', '', '', {}, { k: 'B', s: 1, t: 'Roka, marul, maydanoz (serbest)' }),
      R('Dereotu, nane', 'Serbest', '', '', {}, { k: 'B', s: 1, t: 'Dereotu, nane (serbest)' })
    ],
    yag: [
      R('Sıvı yağ (zeytinyağı, ayçiçek, mısır, soya, kanola, fındık yağı)', '1 tatlı kaşığı', '5 g', '', null,
        { t: '1 tatlı kaşığı sıvı yağ' }),
      R('Zeytin (siyah ya da yeşil)', '10 orta boy', '40 g brüt / 35 g net'),
      R('Avokado', '1/4 küçük boy', '55 g brüt / 40 g net'),
      R('Tereyağı', '1 silme tatlı kaşığı', '5 g', '', null, B),
      R('Margarin', '1 silme tatlı kaşığı', '5 g', '', null, B)
    ],
    tohum: [
      R('Ceviz', '2 bütün orta boy', '20 g brüt / 10 g net'),
      R('Badem', '10 orta boy', '20 g brüt / 10 g net'),
      R('Fındık', '8 orta boy', '20 g brüt / 10 g net'),
      R('Antep fıstığı', '15 orta boy', '20 g brüt / 10 g net'),
      R('Kaju', '7 orta boy', '10 g'),
      R('Yer fıstığı', '13 orta boy', '10 g'),
      R('Ay çekirdeği', '3 yemek kaşığı', '20 g brüt / 10 g net'),
      R('Kabak çekirdeği', '2 yemek kaşığı', '15 g brüt / 10 g net')
    ],
    baklagil: [
      R('Nohut', '3 yemek kaşığı (pişmiş, tepeleme)', '25 g (çiğ)'),
      R('Kuru fasulye', '3 yemek kaşığı (pişmiş, tepeleme)', '25 g (çiğ)'),
      R('Barbunya', '3 yemek kaşığı (pişmiş, tepeleme)', '25 g (çiğ)'),
      R('Mercimek (yeşil, kırmızı)', '2 yemek kaşığı (pişmiş, tepeleme)', '25 g (çiğ)'),
      R('Kuru bakla', '4 yemek kaşığı (pişmiş, tepeleme)', '30 g (çiğ)'),
      R('Kuru börülce', '2 yemek kaşığı (pişmiş, tepeleme)', '35 g (çiğ)'),
      R('Soya fasulyesi', '3 yemek kaşığı (pişmiş)', '30 g (çiğ)', '', null, B),
      R('Mercimek köftesi', '3 adet (2 yemek kaşığı)', '', '', { eyg: 0.5, yag: 1, baklagil: 1 }, B),
      R('Humus', '2 yemek kaşığı', '40 g', '', { yag: 1, baklagil: 0.5 }, B),
      R('Falafel', '2 küçük adet', '', '', { yag: 1, baklagil: 1 }, B)
    ],
    tatli: [
      R('Baklava', '1 orta boy dilim', '', '', { eyg: 1.5, yag: 1.5 }, B),
      R('Sütlü çikolata', '3–4 kare', '20 g', '', { eyg: 1, yag: 1 }, B),
      R('Meyveli dondurma ve külah', '1 top + külah', '', '', { eyg: 1, meyve: 1 }, B),
      R('İHE yulaflı kurabiye', '2 adet', '', '', { eyg: 1, yag: 1 }, BM),
      R('Tulumba tatlısı', '1 büyük boy adet', '', '', { eyg: 2, yag: 1 }, B),
      R('Züber Hi Protein Bar', '1 adet', '45 g', '', { et: 1.7, baklagil: 1 }, BM),
      R('Züber Meyve Bar', '1 adet', '40 g', '', { et: 0.5, meyve: 1.2, yag: 1 }, BM),
      R('Züber Vegan Protein Bar', '1 adet', '45 g', '', { eyg: 1.2, et: 1.2 }, BM),
      R('Fellas High Protein Bar', '1 adet', '45 g', '', { et: 1, baklagil: 1.2 }, BM),
      R('Fellas Protein Bar', '1 adet', '32 g', '', { et: 0.5, baklagil: 1 }, BM),
      R('Fellas Granola Bar', '1 adet', '23 g', '', { eyg: 0.5, yag: 0.4, baklagil: 0.5 }, BM),
      R('Kabak tatlısı', '1 porsiyon', '', '', { eyg: 3, sebze: 1 }, B),
      R('Hatay kömbe', '1 orta boy', '40 g', '', { eyg: 1.4, yag: 1.7 }, B),
      R('İrmik helvası', '1 orta boy kase', '150 g', '', { eyg: 5, yag: 4 }, B),
      R('Revani', '1 orta dilim', '100 g', '', { eyg: 3, meyve: 1, yag: 2 }, B),
      R('Künefe', '1 dilim', '150 g', '', { eyg: 4, yag: 4 }, B)
    ],
    yemek: [
      R('Menemen', '1 dolu tabak', '', '1 porsiyon', { et: 3, sebze: 2, yag: 2 }, B),
      R('Mantı', '6 yemek kaşığı', '', '1 porsiyon', { eyg: 2, et: 1, yag: 1 }, B),
      R('İçli köfte', '2 orta boy adet', '', '', { eyg: 3, et: 2, yag: 2 }, B),
      R('Dürüm çiğ köfte', '1 dürüm', '', '', { eyg: 6, yag: 3 }, B),
      R('Dürüm döner', '1 dürüm', '', '', { eyg: 3, et: 3, yag: 1 }, B),
      R('Yarım ekmek döner', '1 porsiyon (1/2 ekmek)', '', '', { eyg: 4, et: 2, yag: 2 }, B),
      R('Patatesli kır pidesi', '1 tam adet', '', '', { eyg: 4, yag: 2 }, B),
      R('Kıymalı kır pidesi', '1 tam adet', '', '', { eyg: 4, et: 2, yag: 2 }, B),
      R('Hamburger', '1 orta boy adet', '', '', { eyg: 2, et: 2, yag: 1 }, B),
      R('Kuşbaşı, kaşarlı ya da karışık pide', '1 bütün orta boy pide', '', '', { eyg: 4, et: 2, yag: 1 }, B),
      R('Poğaça', '1 orta boy adet', '', '', { eyg: 2, et: 1, yag: 1 }, B),
      R('Bagel cheddar sandviç', '1 sandviç', '', '', { eyg: 4, et: 1.5 }, B),
      R('Kantin kaşarlı tost', '1 tost', '', '', { eyg: 2.5, et: 2 }, B),
      R('Sanpanino Ayvalık tostu', '1 adet', '180 g', '', { eyg: 3, et: 2, yag: 3 }, BM),
      R('Sanpanino kumru', '1 adet', '180 g', '', { eyg: 3, et: 2, yag: 4 }, BM),
      R('Kola', '1 kutu', '330 ml', '', { eyg: 2.5 }, B),
      R('Pizza tost', '1 adet', '180 g', '', { eyg: 4.5, et: 1, yag: 1 }, B),
      R('Tada kaşar peynirli dana salamlı sandviç', '1 adet', '160 g', '', { eyg: 3, et: 2, yag: 0.8 }, BM),
      R('Tada hindi fümeli sandviç', '1 adet', '160 g', '', { eyg: 2.8, et: 2 }, BM),
      R('Tada ton balıklı mısırlı sandviç', '1 adet', '160 g', '', { eyg: 3.2, et: 1.1, yag: 0.7 }, BM),
      R('Tada mozzarella peynirli dana jambonlu sandviç', '1 paket', '160 g', '', { eyg: 2.9, et: 2.5, yag: 0.5 }, BM),
      R('Lahmacun', '1 orta boy', '', '', { eyg: 2, et: 1, yag: 1 }, B),
      R('Biber ya da patlıcan dolması (etsiz)', '1 orta boy adet', '', '', { eyg: 1, sebze: 1, yag: 1 }, B),
      R('Zeytinyağlı yaprak sarma', '4 orta boy adet', '', '', { eyg: 1, yag: 2 }, B),
      R('Patates kızartması (küçük)', '1 küçük boy', '80 g', '', { eyg: 2, yag: 3 }, B),
      R('Patates kızartması (orta)', '1 orta boy', '120 g', '', { eyg: 3, yag: 4 }, B),
      R('Pizza', '1 orta boy dilim', '', '', { eyg: 2, et: 1, yag: 2 }, B),
      R('Çiğ kuruyemiş', '1 avuç', '', '', { meyve: 2, tohum: 3 }, B),
      R('Karnıyarık', '1 adet', '', '', { et: 1, sebze: 1, yag: 2 }, B),
      R('Piliç şinitzel', '25 g', '', '', { eyg: 0.4, et: 0.3, yag: 0.5 }, B)
    ]
  };

  /* Grup sırası ve başlıkları. Değişim grupları js/exchange.js anahtarlarıyla
     aynı; tatlı ve yemek birer kategori, karşılıkları satırda yazılı. */
  const GRUPLAR = [
    ['eyg', 'Ekmek ve tahıl'], ['et', 'Et, tavuk, balık, yumurta, peynir'], ['sut', 'Süt ve yoğurt'],
    ['meyve', 'Meyve'], ['sebze', 'Sebze'], ['yag', 'Yağ'], ['tohum', 'Yağlı tohumlar ve sert kabuklu yemişler'],
    ['baklagil', 'Kuru baklagil'], ['tatli', 'Tatlılar ve çikolatalar'], ['yemek', 'Yemekler']
  ];
  const kucuk = (s) => (s ? s.charAt(0).toLocaleLowerCase('tr-TR') + s.slice(1) : s);
  /* Listeye yazılan metin "ölçü ad (ayrıntı)": ölçünün parantezi sona alınır,
     "1 orta bağ (çiğ) ıspanak" yerine "1 orta bağ ıspanak (çiğ)" yazılsın. */
  const parca = (x) => { const m = /^(.*?)\s*\(([^()]*)\)$/.exec(x); return m ? [m[1], m[2]] : [x, '']; };
  const metin = (r) => {
    const o = parca(r.olcu), a = parca(r.o.m ? r.ad : kucuk(r.ad)), ek = [a[1], o[1]].filter(Boolean).join('; ');
    return o[0] + ' ' + a[0] + (ek ? ' (' + ek + ')' : '');
  };
  const satirListesi = [];
  GRUPLAR.forEach((g) => (satirlar[g[0]] || []).forEach((r, i) => {
    satirListesi.push({
      id: 'd-' + g[0] + '-' + i, g: g[0], k: r.o.k || 'A', ad: r.ad, olcu: r.olcu, miktar: r.miktar, not: r.not,
      d: r.d || { [g[0]]: 1 }, serbest: !!r.o.s, marka: !!r.o.m, pisOlcu: r.o.p || '', tam: r.o.tam || null,
      t: r.o.t || metin(r)
    });
  }));

  /* Diyet listesi yazıcının seçenekleri: her satır bir seçenek; sebzenin
     pişmiş ölçüsü ve light sütün tam yağlısı ayrı seçenek (aynı ölçü,
     başka metin ya da başka grup). */
  const secenekler = [];
  satirListesi.forEach((r) => {
    secenekler.push({ id: r.id, t: r.t, d: r.d, not: r.miktar, g: r.g });
    if (r.pisOlcu) {
      secenekler.push({ id: r.id + '-p', t: r.pisOlcu + ' ' + kucuk(r.ad.replace(/\s*\(.*\)$/, '')) + ' (pişmiş)', d: r.d, not: '', g: r.g });
    }
    if (r.tam) secenekler.push({ id: r.id + '-tam', t: r.tam[1], d: { sut: 1 }, not: r.miktar, g: r.g });
  });

  DA.data.degisim = { gruplar: GRUPLAR, satirlar: satirListesi, secenekler };
})();
