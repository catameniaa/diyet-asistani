/* Klinik değerlendirme hesaplayıcıları — GLIM malnütrisyon tanısı,
   yeniden beslenme (refeeding) riski, eGFR ve böbrek hastalığında protein.

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
  const { fmt, esc } = DA;
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

  /* ---- eGFR (CKD-EPI 2021) ve böbrek hastalığında protein ----
     Inker LA ve ark. N Engl J Med 2021;385:1737–49 (ırk katsayısız):
       eGFR = 142 × min(Kr/κ, 1)^α × max(Kr/κ, 1)^−1,200 × 0,9938^yaş × 1,012 [kadın]
       κ 0,7 (K) / 0,9 (E); α −0,241 (K) / −0,302 (E); Kr mg/dl (IDMS).
     GFR kategorileri (KDIGO): G1 ≥90, G2 60–89, G3a 45–59, G3b 30–44,
     G4 15–29, G5 <15. Albüminüri (UACR, mg/g): A1 <30, A2 30–300, A3 >300.
     Kategori raporlanan (yuvarlanmış) eGFR'den: ekranda 60 yazıp G3a demek
     çelişki olurdu.
     Protein:
       KDIGO 2024 (diyaliz dışı): G3–G5'te 0,8 g/kg/gün; ilerleme riski olan
         KBH'de >1,3 g/kg/gün'den kaçınılır; gönüllü ve izlemde 0,3–0,4
         g/kg/gün + ketoasit analogları düşünülebilir. Sodyum <2 g/gün.
       KDOQI 2020 (metabolik olarak stabil): G3–G5 diyabetsiz 0,55–0,60 ya da
         0,28–0,43 g/kg/gün + keto/amino asit analogları; diyabetli 0,6–0,8;
         diyaliz (HD, PD) 1,0–1,2 g/kg/gün.
     İki kılavuz birlikte gösterilir: hedef seçimi diyetisyenindir. */
  const GFR_KAT = [[90, 'G1', 'Normal ya da yüksek'], [60, 'G2', 'Hafif azalmış'], [45, 'G3a', 'Hafif–orta azalmış'],
    [30, 'G3b', 'Orta–ileri azalmış'], [15, 'G4', 'İleri derecede azalmış'], [-Infinity, 'G5', 'Böbrek yetmezliği']];
  function egfrHesap(cins, yas, kr) {
    const k = cins === 'K' ? 0.7 : 0.9, a = cins === 'K' ? -0.241 : -0.302;
    return 142 * Math.pow(Math.min(kr / k, 1), a) * Math.pow(Math.max(kr / k, 1), -1.2) * Math.pow(0.9938, yas) * (cins === 'K' ? 1.012 : 1);
  }
  DA.calcs.push({
    id: 'egfr', title: 'eGFR ve böbrekte protein', desc: 'CKD-EPI 2021 · KDIGO evresi · KDIGO/KDOQI protein hedefi', ico: 'pulse',
    fields: [
      { k: 'sex', l: 'Cinsiyet', t: 'sex' }, num_('yas', 'Yaş (yıl)', '', false, [18, 110, 'yıl']),
      num_('kre', 'Serum kreatinin (mg/dl)', 'örn. 1,2', false, [0.1, 20, 'mg/dl']),
      num_('w', 'Kilo (kg)', 'protein hedefi için', true, [20, 250, 'kg']),
      num_('uacr', 'İdrar albümin/kreatinin (mg/g)', 'isteğe bağlı', true, [0, 10000, 'mg/g']),
      { k: 'dm', l: 'Diyabet', t: 'sel', o: [['yok', 'Yok'], ['var', 'Var']], def: 'yok' },
      { k: 'diy', l: 'Diyaliz', t: 'sel', o: [['yok', 'Diyaliz yok'], ['hd', 'Hemodiyaliz'], ['pd', 'Periton diyalizi']], def: 'yok' }
    ],
    req: ['yas', 'kre'],
    run(v) {
      if (v.yas < 18) return { err: 'CKD-EPI 2021 eşitliği 18 yaş ve üstü içindir.' };
      const cins = v.sex === 'K' ? 'K' : 'E', e = Math.round(egfrHesap(cins, v.yas, v.kre));
      const kat = GFR_KAT.find((x) => e >= x[0]), diyaliz = v.diy === 'hd' || v.diy === 'pd';
      const g35 = ['G3a', 'G3b', 'G4', 'G5'].indexOf(kat[1]) >= 0, w = v.w > 0 ? v.w : null;
      const gram = (a, b) => (w ? fmt(a * w, 0) + (b != null ? '–' + fmt(b * w, 0) : '') + ' g/gün' : 'kilo girilmedi');
      const rows = [];
      if (diyaliz) rows.push(R('eGFR', 'diyalizde kullanılmaz', 'kreatinin diyalizle değişir'));
      else {
        rows.push(R('eGFR (CKD-EPI 2021)', e + ' ml/dk/1,73 m²', '', true));
        rows.push(R('GFR kategorisi (KDIGO)', kat[1] + ' — ' + kat[2]));
      }
      if (v.uacr >= 0 && isFinite(v.uacr)) {
        const A = v.uacr < 30 ? ['A1', 'normal ya da hafif artmış'] : v.uacr <= 300 ? ['A2', 'orta derecede artmış'] : ['A3', 'ciddi artmış'];
        rows.push(R('Albüminüri', A[0] + ' — ' + A[1], fmt(v.uacr, 0) + ' mg/g'));
      }
      if (diyaliz) {
        rows.push(R('Protein (KDOQI 2020)', gram(1.0, 1.2), '1,0–1,2 g/kg/gün · ' + (v.diy === 'hd' ? 'hemodiyaliz' : 'periton diyalizi'), true));
      } else if (g35) {
        rows.push(R('Protein (KDIGO 2024)', gram(0.8), '0,8 g/kg/gün', true));
        if (v.dm === 'var') rows.push(R('Protein (KDOQI 2020)', gram(0.6, 0.8), '0,6–0,8 g/kg/gün · diyabetli'));
        else {
          rows.push(R('Protein (KDOQI 2020)', gram(0.55, 0.6), '0,55–0,60 g/kg/gün · diyabetsiz'));
          rows.push(R('Çok düşük protein (KDOQI 2020)', gram(0.28, 0.43), '0,28–0,43 g/kg/gün + keto/amino asit analogları'));
        }
        rows.push(R('Üst sınır (KDIGO 2024)', 'en fazla ' + gram(1.3), '>1,3 g/kg/gün’den kaçınılır'));
      } else {
        rows.push(R('Protein (KDIGO 2024)', 'en fazla ' + gram(1.3), 'ilerleme riski varsa >1,3 g/kg/gün’den kaçınılır; kısıtlama önerisi G3–G5 için', true));
      }
      if (!diyaliz) rows.push(R('Sodyum (KDIGO 2024)', '<2 g/gün', 'yaklaşık 5 g tuz'));
      return {
        rows, tone: 'info', badge: diyaliz ? null : [kat[1], ['G1', 'G2'].indexOf(kat[1]) >= 0 ? 'ok' : kat[1] === 'G3a' ? 'warn' : 'bad'],
        note: 'eGFR: CKD-EPI 2021 (Inker ve ark., NEJM 2021), ırk katsayısız; ≥18 yaş, kararlı kreatinin, IDMS standardında ölçüm. ' +
          'Kronik böbrek hastalığı tanısı için bulgunun ≥3 ay sürmesi gerekir; G1–G2 tek başına KBH demek değildir. ' +
          'Protein kısıtlaması metabolik olarak stabil hastada, hekim ve diyetisyen izleminde uygulanır; hangi ağırlığın (gerçek, ' +
          'standart, ödemsiz) kullanılacağı klinik karara bağlıdır. Kaynaklar: KDIGO 2024 KBH kılavuzu; KDOQI 2020 beslenme kılavuzu.'
      };
    }
  });

  /* ---- IDDSI düzeyleri ----
     © The International Dysphagia Diet Standardisation Initiative 2019 @
     https://iddsi.org/framework/ — CC BY-SA 4.0. Dil çevirisi dışında türev
     çalışmaya izin verilmiyor: tanımlar ve test eşikleri IDDSI posterinden
     değiştirilmeden çevrildi, kısaltılmadı ya da yorum eklenmedi. Türkçe adlar
     uygulamanın çevirisidir; resmî Türkçe çeviri bulunamadı (doğrulanmalı),
     İngilizce resmî ad yanında durur. IDDSI logosu ve renk kodları
     kullanılmadı: logo resmî malzemelere ayrılmış. */
  const IDDSI = [
    [0, 'Thin', 'İnce', 'İçecek', 'Su gibi akar.', 'Akış testi: 10 saniye sonra şırıngada 1 ml’den az kalır.'],
    [1, 'Slightly Thick', 'Hafif koyu', 'İçecek', 'Sudan koyu; standart pipetten akar.', 'Akış testi: 10 saniye sonra 1–4 ml kalır.'],
    [2, 'Mildly Thick', 'Az koyu', 'İçecek', 'Bardaktan yudumlanır; standart pipetle içmek çaba ister.', 'Akış testi: 10 saniye sonra 4–8 ml kalır.'],
    [3, 'Moderately Thick · Liquidised', 'Orta koyu · Sıvılaştırılmış', 'İçecek ve yiyecek',
      'Bardaktan içilebilir ya da kaşıkla yenir; geniş pipetle içmek çaba ister.',
      'Akış testi: 10 saniye sonra 8 ml’den az kalmaz. Çatal damlatma testi: çatal dişlerinin arasından topak topak, yavaşça damlar.'],
    [4, 'Extremely Thick · Pureed', 'Çok koyu · Püre', 'İçecek ve yiyecek',
      'Pürüzsüz, topaksız, yapışkan değil; çiğneme gerekmez. Kaşıkla yenir.',
      'Çatal damlatma testi: çatalın üstünde yığın hâlinde durur, sürekli akmaz ya da damlamaz. Kaşık eğme testi: kaşıkta şeklini korur, kaşık eğilince kolayca düşer.'],
    [5, 'Minced & Moist', 'Kıyılmış ve nemli', 'Yiyecek', 'Çok yumuşak, küçük, nemli topaklar; az çiğneme gerekir.',
      'Topak boyutu yetişkinde 4 mm, çocukta 2 mm. Çatal baskı testi ile denetlenir.'],
    [6, 'Soft & Bite-Sized', 'Yumuşak ve lokma boyutunda', 'Yiyecek', 'Yumuşak, yumuşacık ve her yeri nemli; ince sıvı sızmaz. Çiğneme gerekir.',
      'Parça yetişkinde en fazla 1,5 × 1,5 cm, bebek ve çocukta 8 × 8 mm. Çatal baskı testi: başparmak tırnağı beyazlayana kadar bastırılınca tamamen ezilir, eski şekline dönmez.'],
    [7, 'Regular · Easy to Chew', 'Normal · Kolay çiğnenen', 'Yiyecek', 'Normal: farklı dokulardaki günlük yiyecekler. Kolay çiğnenen: yumuşak dokulu günlük yiyecekler.',
      'Normal düzey için özel test yok.']
  ];
  DA.calcs.push({
    id: 'iddsi', title: 'IDDSI düzeyleri', desc: 'Disfajide içecek kıvamı ve yiyecek dokusu · 0–7', ico: 'drip',
    view() {
      return {
        title: 'IDDSI düzeyleri', tab: 'referans', back: 'referans', ico: 'drip',
        fav: { h: '#/hesapla/iddsi', t: 'IDDSI düzeyleri', ico: 'drip' },
        html: '<div class="note">İçecekler 0–4, yiyecekler 3–7 düzeyleriyle tanımlanır. Düzey, kapsamlı klinik değerlendirmeyle seçilir; ' +
          'testler ürünün servis koşulunda (özellikle sıcaklık) yapılır.</div>' +
          IDDSI.map((d) => '<div class="card iddsi" data-duzey="' + d[0] + '"><div class="row" style="gap:var(--s-3);align-items:flex-start">' +
            '<span class="iddsi-no" aria-hidden="true">' + d[0] + '</span><div class="grow"><h2 style="margin:0">' + esc(d[2]) + '</h2>' +
            '<div class="small muted">' + esc(d[1]) + ' · ' + esc(d[3]) + '</div>' +
            '<p class="small mt-s" style="margin-bottom:var(--s-1)">' + esc(d[4]) + '</p><p class="small" style="margin:0"><b>Test:</b> ' + esc(d[5]) + '</p>' +
            '</div></div></div>').join('') +
          '<div class="card"><h2>Testler</h2><p class="small">Akış testi: 10 ml’lik şırınga 10 ml çizgisine doldurulur, uç parmakla kapatılır; ' +
          'parmak çekilip 10 saniye akıtılır ve kalan hacim okunur. Geçiş yiyecekleri: 1,5 × 1,5 cm örneğe 1 ml su eklenip 1 dakika beklenir, ' +
          'ardından çatal baskı testi yapılır. Ayrıntılı yönergeler iddsi.org’da.</p></div>' +
          '<p class="tiny muted">© The International Dysphagia Diet Standardisation Initiative 2019 @ https://iddsi.org/framework/ · ' +
          'CreativeCommons Attribution Sharealike 4.0 (https://creativecommons.org/licenses/by-sa/4.0/legalcode). Dil çevirisi dışında türev ' +
          'çalışmaya izin verilmez. Türkçe adlar ve metin bu uygulamanın çevirisidir; İngilizce adlar resmîdir.</p>'
      };
    }
  });
})();
