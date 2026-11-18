/* Klinik değerlendirme hesaplayıcıları — GLIM malnütrisyon tanısı ve
   yeniden beslenme (refeeding) riski.

   GLIM: Cederholm T ve ark. GLIM criteria for the diagnosis of
   malnutrition. Clin Nutr 2019;38:1–9 (J Cachexia Sarcopenia Muscle
   2019;10:207–217). İki adım: önce geçerli bir araçla risk taraması
   (NRS-2002, MUST, MNA-SF), sonra en az 1 fenotipik + 1 etiyolojik ölçütle
   tanı; evre yalnız fenotipik ölçütlerden.
     Fenotipik: kilo kaybı >%5 (6 ay içinde) ya da >%10 (6 aydan uzun);
       BKİ <20 (<70 yaş) ya da <22 (≥70 yaş); kas kütlesinde azalma.
     Etiyolojik: gereksinimin ≤%50'si >1 hafta, herhangi bir azalma >2
       hafta ya da emilimi bozan kronik GİS durumu; akut ya da kronik
       hastalıkla ilişkili inflamasyon.
     Evre 1 (orta): kayıp %5–10 (6 ay içinde) ya da %10–20 (6 aydan uzun);
       BKİ <20 (<70) ya da <22 (≥70); hafif–orta kas kaybı.
     Evre 2 (ağır): kayıp >%10 (6 ay içinde) ya da >%20 (6 aydan uzun);
       BKİ <18,5 (<70) ya da <20 (≥70); ciddi kas kaybı.
   Tablo 3'te yaş eşiği "<70 / >70", Tablo 4'te "<70 / ≥70" yazılı; 70 yaş
   ≥70 grubuna alındı. Asya eşikleri (18,5 / 20) seçenek olarak alınmadı,
   notta yazılı.

   Yeniden beslenme: NICE CG32 Nutrition support for adults (2006, son
   gözden geçirme 2017). Yüksek risk: aşağıdakilerden 1'i — BKİ <16, son
   3–6 ayda istemsiz kayıp >%15, >10 gün çok az ya da hiç beslenmeme,
   beslenme öncesi düşük K, P ya da Mg; ya da 2'si — BKİ <18,5, kayıp >%10,
   >5 gün çok az ya da hiç beslenmeme, alkol kötüye kullanımı ya da insülin,
   kemoterapi, antiasit, diüretik. Başlangıç en fazla 10 kcal/kg/gün, 4–7
   günde tam gereksinime; uç durumda (BKİ <14 ya da >15 gün yok denecek
   kadar az alım) 5 kcal/kg/gün ve sürekli kalp ritmi izlemi. >5 gün çok az
   yiyene ilk 2 gün gereksinimin en fazla %50'si. */
(function () {
  'use strict';
  const { fmt } = DA;
  const R = (l, v, s, hl) => ({ l, v, s, hl });
  const num_ = (k, l, ph, opt, rng) => ({ k, l, t: 'num', ph: ph || '', opt: !!opt, rng });
  const bkiHesap = (w, h) => w / Math.pow(h / 100, 2);

  /* ---- GLIM ---- */
  DA.calcs.push({
    id: 'glim', title: 'GLIM malnütrisyon tanısı', desc: 'Fenotipik + etiyolojik ölçüt · evre 1/2', ico: 'gauge',
    fields: [
      num_('yas', 'Yaş (yıl)', '', false, [18, 110, 'yıl']), num_('w', 'Şimdiki kilo (kg)', '', false, [20, 250, 'kg']),
      num_('h', 'Boy (cm)', '', false, [120, 220, 'cm']), num_('once', 'Önceki kilo (kg)', 'kilo kaybı için', true, [20, 250, 'kg']),
      { k: 'sure', l: 'Kilo kaybının süresi', t: 'sel', o: [['ic', 'Son 6 ay içinde'], ['dis', '6 aydan uzun sürede']], def: 'ic' },
      { k: 'kas', l: 'Kas kütlesi (geçerli yöntemle)', t: 'sel',
        o: [['yok', 'Azalma yok ya da ölçülmedi'], ['hafif', 'Hafif–orta azalma'], ['ciddi', 'Ciddi azalma']], def: 'yok' },
      { k: 'alim', l: 'Besin alımı ya da emilimi', t: 'sel',
        o: [['yok', 'Azalma yok'], ['h1', '1 haftadan uzun, gereksinimin ≤%50’si'], ['h2', '2 haftadan uzun, herhangi bir azalma'],
          ['gis', 'Emilimi bozan kronik GİS durumu']], def: 'yok' },
      { k: 'inf', l: 'Hastalık yükü, inflamasyon', t: 'sel',
        o: [['yok', 'Yok'], ['akut', 'Akut hastalık ya da yaralanma'], ['kronik', 'Kronik hastalıkla ilişkili']], def: 'yok' }
    ],
    req: ['yas', 'w', 'h'],
    run(v) {
      const bki = bkiHesap(v.w, v.h), yasli = v.yas >= 70;
      const kayip = v.once > 0 ? (v.once - v.w) / v.once * 100 : null, ic = v.sure !== 'dis';
      const fen = [];
      /* [ölçüt, evre] */
      if (kayip != null) {
        const sinir = ic ? [5, 10] : [10, 20];
        if (kayip > sinir[0]) fen.push(['Kilo kaybı %' + fmt(kayip, 1) + (ic ? ' (6 ay içinde)' : ' (6 aydan uzun)'), kayip > sinir[1] ? 2 : 1]);
      }
      const bs = yasli ? [22, 20] : [20, 18.5];
      if (bki < bs[0]) fen.push(['BKİ ' + fmt(bki, 1) + ' (<' + fmt(bs[0], 1) + (yasli ? ', ≥70 yaş)' : ', <70 yaş)'), bki < bs[1] ? 2 : 1]);
      if (v.kas === 'hafif') fen.push(['Kas kütlesinde hafif–orta azalma', 1]);
      if (v.kas === 'ciddi') fen.push(['Kas kütlesinde ciddi azalma', 2]);
      const eti = [];
      if (v.alim === 'h1') eti.push('Alım >1 hafta gereksinimin ≤%50’si');
      if (v.alim === 'h2') eti.push('Alım >2 hafta azalmış');
      if (v.alim === 'gis') eti.push('Emilimi bozan kronik GİS durumu');
      if (v.inf === 'akut') eti.push('Akut hastalık ya da yaralanma');
      if (v.inf === 'kronik') eti.push('Kronik hastalıkla ilişkili inflamasyon');
      const evre = fen.reduce((a, x) => Math.max(a, x[1]), 0);
      let tani, badge;
      if (fen.length && eti.length) {
        tani = 'Malnütrisyon — evre ' + evre + (evre === 2 ? ' (ağır)' : ' (orta)');
        badge = [tani, evre === 2 ? 'bad' : 'warn'];
      } else if (fen.length) {
        tani = 'Tanı konmaz: etiyolojik ölçüt yok'; badge = ['Etiyolojik ölçüt yok', 'info'];
      } else {
        tani = 'GLIM ölçütleri karşılanmıyor'; badge = ['Fenotipik ölçüt yok', 'ok'];
      }
      return {
        rows: [
          R('BKİ', fmt(bki, 1) + ' kg/m²'),
          R('Kilo kaybı', kayip == null ? 'girilmedi' : '%' + fmt(kayip, 1), kayip == null ? '' : (ic ? 'son 6 ay içinde' : '6 aydan uzun sürede')),
          R('Fenotipik ölçüt', fen.length ? fen.map((x) => x[0]).join(' · ') : 'yok'),
          R('Etiyolojik ölçüt', eti.length ? eti.join(' · ') : 'yok'),
          R('Sonuç', tani, '', true)
        ],
        badge, tone: 'info',
        note: 'Kaynak: GLIM (Cederholm ve ark., Clin Nutr 2019). Önce geçerli bir araçla risk taraması yapılır (NRS-2002, MUST, MNA-SF); ' +
          'tanı için en az 1 fenotipik ve 1 etiyolojik ölçüt gerekir, evre yalnız fenotipik ölçütlerden belirlenir. ' +
          'Kas kütlesi DXA, BİA, BT ya da MR ile; bunlar yoksa fizik muayene ya da baldır, üst kol çevresiyle değerlendirilir. ' +
          'Asya kökenlilerde BKİ eşiği <18,5 (<70 yaş) ve <20 (≥70 yaş). Etiyolojik ölçüt tedaviye yön verir.'
      };
    }
  });

  /* ---- Yeniden beslenme riski (NICE CG32) ---- */
  DA.calcs.push({
    id: 'refeeding', title: 'Yeniden beslenme (refeeding) riski', desc: 'NICE ölçütleri · başlangıç enerjisi · elektrolit', ico: 'alert',
    fields: [
      num_('w', 'Şimdiki kilo (kg)', '', false, [20, 250, 'kg']), num_('h', 'Boy (cm)', '', false, [120, 220, 'cm']),
      num_('once', '3–6 ay önceki kilo (kg)', 'kilo kaybı için', true, [20, 250, 'kg']),
      num_('gun', 'Çok az ya da hiç beslenmediği gün', '0', true, [0, 120, 'gün']),
      { k: 'elek', l: 'Beslenme öncesi K, P, Mg', t: 'sel', o: [['yok', 'Normal ya da bilinmiyor'], ['dusuk', 'Biri ya da birkaçı düşük']], def: 'yok' },
      { k: 'oyku', l: 'Alkol ya da ilaç öyküsü', t: 'sel',
        o: [['yok', 'Yok'], ['var', 'Alkol kötüye kullanımı ya da insülin, kemoterapi, antiasit, diüretik']], def: 'yok' }
    ],
    req: ['w', 'h'],
    run(v) {
      const bki = bkiHesap(v.w, v.h), gun = v.gun > 0 ? v.gun : 0;
      const kayip = v.once > 0 ? (v.once - v.w) / v.once * 100 : null;
      const bir = [], iki = [];
      if (bki < 16) bir.push('BKİ <16');
      if (kayip != null && kayip > 15) bir.push('kayıp >%15');
      if (gun > 10) bir.push('>10 gün beslenmeme');
      if (v.elek === 'dusuk') bir.push('düşük K, P ya da Mg');
      if (bki < 18.5) iki.push('BKİ <18,5');
      if (kayip != null && kayip > 10) iki.push('kayıp >%10');
      if (gun > 5) iki.push('>5 gün beslenmeme');
      if (v.oyku === 'var') iki.push('alkol ya da ilaç');
      const yuksek = bir.length >= 1 || iki.length >= 2, uc = bki < 14 || gun > 15;
      const rows = [
        R('BKİ', fmt(bki, 1) + ' kg/m²'),
        R('Kilo kaybı (3–6 ay)', kayip == null ? 'girilmedi' : '%' + fmt(kayip, 1)),
        R('Tek başına yeten ölçüt', bir.length ? bir.join(' · ') : 'yok'),
        R('İkisi gereken ölçüt', iki.length ? iki.length + ': ' + iki.join(' · ') : 'yok')
      ];
      let badge;
      if (yuksek && uc) {
        rows.push(R('Risk', 'Çok yüksek risk', 'BKİ <14 ya da >15 gün yok denecek kadar az alım', true));
        rows.push(R('Başlangıç enerjisi', 'en fazla ' + fmt(5 * v.w, 0) + ' kcal/gün', '5 kcal/kg/gün · sürekli kalp ritmi izlemi'));
        badge = ['Çok yüksek risk', 'bad'];
      } else if (yuksek) {
        rows.push(R('Risk', 'Yüksek risk', '', true));
        rows.push(R('Başlangıç enerjisi', 'en fazla ' + fmt(10 * v.w, 0) + ' kcal/gün', '10 kcal/kg/gün'));
        badge = ['Yüksek risk', 'bad'];
      } else {
        rows.push(R('Risk', 'Yüksek risk ölçütü yok', '', true));
        badge = ['Yüksek risk ölçütü yok', 'ok'];
      }
      if (yuksek) {
        rows.push(R('Tam gereksinime', '4–7 günde, kademeli'));
        rows.push(R('Potasyum', fmt(2 * v.w, 0) + '–' + fmt(4 * v.w, 0) + ' mmol/gün', '2–4 mmol/kg/gün'));
        rows.push(R('Fosfat', fmt(0.3 * v.w, 0) + '–' + fmt(0.6 * v.w, 0) + ' mmol/gün', '0,3–0,6 mmol/kg/gün'));
        rows.push(R('Magnezyum', fmt(0.2 * v.w, 0) + ' mmol/gün IV ya da ' + fmt(0.4 * v.w, 0) + ' oral', '0,2 mmol/kg/gün IV · 0,4 oral'));
        rows.push(R('Tiamin', '200–300 mg/gün oral', 'beslenmeden hemen önce ve ilk 10 gün; B kompleks ve multivitamin-mineral ile'));
      } else if (gun > 5) {
        rows.push(R('İlk 2 gün', 'gereksinimin en fazla %50’si', '>5 gün çok az ya da hiç beslenmemiş', true));
      }
      return {
        rows, badge, tone: 'info',
        note: 'Kaynak: NICE CG32 Nutrition support for adults (2006, son gözden geçirme 2017). Elektrolitler beslenme öncesi düzeyleri ' +
          'yüksek değilse verilir; beslenmeden önce düşük düzeyi düzeltmek gerekli sayılmaz. Elektrolit ve vitamin desteği hekim istemiyle; ' +
          'ağırlık şimdiki kilodur.'
      };
    }
  });
})();
