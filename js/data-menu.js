/* TÜBER 2022 — Ek 5: Yaş gruplarına göre örnek menü planları (s. 384–391)
   Her menü: { id, t: başlık, ek, d: günlük düzen, sex, age, o: [[öğün, [besinler]], …] }
   sex/age yalnızca besin ögesi hedefleri ekranına bağlanmak için kullanılır. */
(function () {
  'use strict';

  DA.data.ornekMenu = {
    src: 'TÜBER 2022, Ek 5 — Yaş gruplarına göre örnek menü planları',
    m: [
      { id: 'ek51', t: 'Erkek çocuk (4 yaş)', ek: 'Ek 5.1', sex: 'E', age: '4',
        d: 'Sabah kahvaltısını evde yapıyor, kreşe gidiyor.',
        o: [
          ['Sabah kahvaltısı', ['½ su bardağı süt', '1 adet haşlanmış yumurta', '½ porsiyon beyaz peynir',
            '1 yemek kaşığı tahin-pekmez', 'Söğüş salata', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (kuşluk)', ['1 orta boy elma']],
          ['Öğle yemeği', ['½ kase mercimek çorbası', '1 porsiyon etli bezelye', '½ kase yoğurt', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (ikindi)', ['1 su bardağı süt', '1 dilim kek']],
          ['Akşam yemeği', ['1 porsiyon sulu (terbiyeli) köfte', '1 porsiyon şehriyeli pirinç pilavı', 'Mevsim salata',
            '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (gece)', ['1 porsiyon mandalina']]
        ] },

      { id: 'ek52', t: 'Kız çocuk (10 yaş)', ek: 'Ek 5.2', sex: 'K', age: '10',
        d: 'Okula servisle gidip geliyor, öğle yemeğini okulda yemekhanede yiyor, okul sonrası etüde kalıyor, spor yapmıyor.',
        o: [
          ['Sabah kahvaltısı', ['1 su bardağı süt', '1 adet haşlanmış yumurta', '3-4 adet zeytin',
            '1 tatlı kaşığı bal', 'Söğüş sebze', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (kuşluk)', ['1 orta boy elma']],
          ['Öğle yemeği', ['1 porsiyon etli kuru fasulye', '1 porsiyon sebzeli bulgur pilavı', '1 kase yoğurt',
            '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (ikindi)', ['1 avuç fındık']],
          ['Akşam yemeği', ['1 porsiyon etli biber dolma (yoğurtlu)', '1 dilim peynirli tepsi böreği',
            '1 kase kuru üzüm hoşafı', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (gece)', ['1 orta boy portakal']]
        ] },

      { id: 'ek53', t: 'Adolesan erkek (16 yaş)', ek: 'Ek 5.3', sex: 'E', age: '16',
        d: 'Okul basketbol takımında oynuyor, haftada 4 kez antrenman yapıyor.',
        o: [
          ['Sabah kahvaltısı', ['1 su bardağı süt', '1 adet haşlanmış yumurta', '1 tatlı kaşığı bal',
            '3-4 adet ceviz', 'Söğüş sebze', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (kuşluk)', ['1 dilim havuçlu kek', '1 su bardağı limonata']],
          ['Öğle yemeği', ['1 kase ezogelin çorba', '1 porsiyon mantarlı tavuk sote',
            '1 porsiyon şehriyeli pirinç pilavı', 'Çoban salata', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (ikindi)', ['1 adet peynirli tost', '1 su bardağı ayran', '1 orta boy portakal']],
          ['Akşam yemeği', ['1 porsiyon kıymalı ıspanak (yoğurt ile)', '1 porsiyon soslu spagetti',
            'Mevsim salata', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (gece)', ['1 orta boy elma', '1 kase sütlaç']]
        ] },

      { id: 'ek54', t: 'Yetişkin kadın (42 yaş)', ek: 'Ek 5.4', sex: 'K', age: '40-50',
        d: 'Memur, eşi ve 2 çocuğuyla yaşıyor, ev işleri dışında bir aktivitesi yok, işe servisle gidiyor.',
        o: [
          ['Sabah kahvaltısı', ['Açık çay / bitki çayı', '1 porsiyon peynir', '3-4 adet zeytin',
            '1 tatlı kaşığı tahin-pekmez', 'Söğüş sebze', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (kuşluk)', ['1 orta boy elma']],
          ['Öğle yemeği', ['1 porsiyon etli nohut', '1 porsiyon bulgur pilavı', '1 kase yoğurt',
            'Mevsim salata', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (ikindi)', ['½ adet simit', '1 su bardağı ayran']],
          ['Akşam yemeği', ['1 porsiyon yayla çorba', '1 porsiyon sebzeli fırın köfte', 'Mevsim salata',
            '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (gece)', ['½ kase yoğurt', '1 orta boy portakal']]
        ] },

      { id: 'ek55', t: 'Yetişkin erkek (36 yaş)', ek: 'Ek 5.5', sex: 'E', age: '25-50',
        d: 'Bekar, tek başına yaşıyor; öğle yemeklerini işyeri yemekhanesinde, akşamları dışarıda veya evde basit yemekleri kendi hazırlayarak tüketiyor.',
        o: [
          ['Sabah kahvaltısı', ['Açık çay / bitki çayı', '1 adet sebzeli omlet', '3-4 adet zeytin',
            '1 tatlı kaşığı bal', '1 tatlı kaşığı tereyağı', 'Söğüş sebze', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (kuşluk)', ['1 orta boy elma', '2 adet mandalina']],
          ['Öğle yemeği', ['1 porsiyon etli kuru fasulye', '1 porsiyon bulgur pilavı', '1 kase cacık',
            'Mevsim salata', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (ikindi)', ['1 adet peynirli tost', '1 su bardağı ayran']],
          ['Akşam yemeği', ['1 porsiyon kırmızı tarhana çorbası', '1 porsiyon tavuk sote',
            '1 porsiyon soslu makarna', 'Çoban salata', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (gece)', ['1 kase yoğurt', '1 orta boy elma']]
        ] },

      { id: 'ek56', t: 'Yaşlı erkek (68 yaş)', ek: 'Ek 5.6', sex: 'E', age: '65-70',
        d: 'Emekli, eşiyle birlikte yaşıyor, genellikle evde oturuyor.',
        o: [
          ['Sabah kahvaltısı', ['1 su bardağı süt', '1 porsiyon beyaz peynir', '1 tatlı kaşığı bal',
            '3-4 adet zeytin', 'Söğüş sebze', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (kuşluk)', ['1 orta boy portakal']],
          ['Öğle yemeği', ['1 porsiyon etli türlü (kış)', '1 dilim talaş böreği', '1 su bardağı ayran',
            'Çoban salata', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (ikindi)', ['1 orta boy portakal']],
          ['Akşam yemeği', ['1 kase domates çorba', '1 porsiyon İzmir köfte', '1 porsiyon soslu makarna',
            'Mevsim salata', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (gece)', ['½ kase yoğurt', '1 orta boy elma']]
        ] },

      { id: 'ek57', t: 'Gebe kadın (25 yaş, 8 aylık gebe)', ek: 'Ek 5.7', gebe: true,
        d: 'Gebeliğin son üç ayı.',
        o: [
          ['Sabah kahvaltısı', ['1 su bardağı süt', '1 haşlanmış yumurta', '1 yemek kaşığı pekmez',
            '1 tatlı kaşığı tahin', 'Söğüş sebze', '2 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (kuşluk)', ['1 orta boy elma', '4 adet ceviz']],
          ['Öğle yemeği', ['1 porsiyon et haşlama', '1 porsiyon zeytinyağlı taze fasulye',
            '1 porsiyon peynirli makarna', '1 kase yoğurt', 'Mevsim salata', '2 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (ikindi)', ['1 kase muhallebi']],
          ['Akşam yemeği', ['1 kase domates çorbası', '1 porsiyon orman kebabı', '2 dilim peynirli kol böreği',
            '1 kase kuru kayısı hoşafı', 'Mevsim salata', '2 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (gece)', ['½ kase yoğurt', '1 orta boy elma']]
        ] },

      { id: 'ek58', t: 'Emziren anne (30 yaş, 3 aylık bebek)', ek: 'Ek 5.8', gebe: true,
        d: 'Emzirme döneminin ilk aylarında.',
        o: [
          ['Sabah kahvaltısı', ['1 su bardağı süt', '1 porsiyon beyaz peynir', '1 adet haşlanmış yumurta',
            '3-4 adet zeytin', '1 yemek kaşığı pekmez', '1 tatlı kaşığı tahin', 'Söğüş sebze',
            '2 orta dilim tam tahıllı ekmek']],
          ['Ara öğün (kuşluk)', ['1 orta boy elma', '½ su bardağı süt']],
          ['Öğle yemeği', ['1 kase sebze çorba', '1 porsiyon kıymalı semizotu (yoğurtlu)',
            '1 porsiyon soslu spagetti', 'Mevsim salata', '1 orta dilim tam tahıllı ekmek']],
          ['Ara öğün (ikindi)', ['1 adet peynirli tost', '1 su bardağı ayran']],
          ['Akşam yemeği', ['1 kase tarhana çorbası', '1 porsiyon balık buğulama',
            '1 porsiyon zeytinyağlı barbunya', '1 dilim helva', 'Mevsim salata', '1 orta dilim tam tahıllı ekmek']],
          ['Ara öğün (gece)', ['1 orta boy portakal', '½ kase yoğurt']]
        ] }
    ]
  };
})();
