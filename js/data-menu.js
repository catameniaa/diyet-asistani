/* TÜBER 2022 — Ek 5: Yaş gruplarına göre örnek menü planları (s. 384–…)
   Her menü: { t: başlık, d: günlük düzen açıklaması, o: [[öğün adı, [besinler]], …] } */
(function () {
  'use strict';

  DA.data.ornekMenu = {
    src: 'TÜBER 2022, Ek 5 — Yaş gruplarına göre örnek menü planları',
    m: [
      { id: 'ek51', t: 'Erkek çocuk (4 yaş)', ek: 'Ek 5.1',
        d: 'Sabah kahvaltısını evde yapıyor, kreşe gidiyor.',
        o: [
          ['Sabah kahvaltısı', ['½ su bardağı süt', '1 adet haşlanmış yumurta', '½ porsiyon beyaz peynir',
            '1 yemek kaşığı tahin-pekmez', 'Söğüş salata', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (kuşluk)', ['1 orta boy elma']],
          ['Öğle yemeği', ['½ kase mercimek çorbası', '1 porsiyon etli bezelye', '½ kase yoğurt', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (ikindi)', ['1 su bardağı süt', '1 dilim kek']],
          ['Akşam yemeği', ['1 porsiyon sulu (terbiyeli) köfte', '1 porsiyon şehriyeli pirinç pilavı', 'Mevsim salata']],
          ['Ara öğün (gece)', ['1 ince dilim tam tahıllı ekmek', '1 porsiyon mandalina']]
        ] },
      { id: 'ek52', t: 'Kız çocuk (10 yaş)', ek: 'Ek 5.2',
        d: 'Okula servisle gidip geliyor, öğle yemeğini okulda yemekhanede yiyor, okul sonrası etüde kalıyor, spor yapmıyor.',
        o: [
          ['Sabah kahvaltısı', ['1 su bardağı süt', '1 adet haşlanmış yumurta', '3-4 adet zeytin',
            '1 tatlı kaşığı bal', 'Söğüş sebze', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (kuşluk)', ['1 orta boy elma']],
          ['Öğle yemeği', ['1 porsiyon etli kuru fasulye', '1 porsiyon sebzeli bulgur pilavı', '1 kase yoğurt', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (ikindi)', ['1 avuç fındık']],
          ['Akşam yemeği', ['1 porsiyon etli biber dolma (yoğurtlu)', '1 dilim peynirli tepsi böreği',
            '1 kase kuru üzüm hoşafı', '1 ince dilim tam tahıllı ekmek']],
          ['Ara öğün (gece)', ['1 orta boy portakal']]
        ] }
    ]
  };
})();
