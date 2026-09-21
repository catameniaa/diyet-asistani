/* Hesaplayıcılar */
(function () {
  'use strict';
  const { esc, num, fmt } = DA;
  const num_ = (k, l, ph, opt) => ({ k, l, t: 'num', ph: ph || '', opt: !!opt });
  const SEX = { k: 'sex', l: 'Cinsiyet', t: 'sex' };
  const R = (l, v, s, hl) => ({ l, v, s, hl });

  function bmiCat(b) {
    if (b < 16) return ['Ciddi zayıflık', 'bad'];
    if (b < 18.5) return ['Zayıf', 'warn'];
    if (b < 25) return ['Normal', 'ok'];
    if (b < 30) return ['Fazla kilolu', 'warn'];
    if (b < 35) return ['Obez (evre I)', 'bad'];
    if (b < 40) return ['Obez (evre II)', 'bad'];
    return ['Obez (evre III)', 'bad'];
  }
  /* Henry 2005 dinlenme enerji harcaması (DEH) eşitlikleri — TÜBER 2022 Tablo 10.3.
     Ağırlık kg, boy m. Yaş sınırları kaynaktaki dipnota göre: 0-<3, 3-<10, 10-<18,
     18-<30, 30-59, ≥60. TÜBER bazal (BEH) yerine dinlenme (DEH) terimini kullanır. */
  function henry(sex, age, w, hM) {
    const E = sex === 'E';
    if (age < 3) return E ? 28.2 * w + 859 * hM - 371 : 30.4 * w + 703 * hM - 287;
    if (age < 10) return E ? 15.1 * w + 74.2 * hM + 306 : 15.9 * w + 210 * hM + 349;
    if (age < 18) return E ? 15.6 * w + 266 * hM + 299 : 9.40 * w + 249 * hM + 462;
    if (age < 30) return E ? 14.4 * w + 313 * hM + 113 : 10.4 * w + 615 * hM - 282;
    if (age < 60) return E ? 11.4 * w + 541 * hM - 137 : 8.18 * w + 502 * hM - 11.6;
    return E ? 11.4 * w + 541 * hM - 256 : 8.52 * w + 421 * hM + 10.7;
  }
  const henryBand = (age) => age < 3 ? '0–3' : age < 10 ? '3–10' : age < 18 ? '10–18' :
    age < 30 ? '18–30' : age < 60 ? '30–60' : '>60';

  /* İlk grup TÜBER 2022 Ek 4.8.3 (EFSA/FAO-WHO-UNU) yaşam biçimi sınıflaması,
     ikinci grup yaygın kullanılan klasik aktivite katsayıları. */
  const PAL = [
    ['1.3', 'Yatağa/sandalyeye bağımlı · 1,2–1,39'],
    ['1.4', 'Az aktif · evde, ulaşımda taşıt · 1,4'],
    ['1.5', 'Az aktif · masa başı iş · 1,5'],
    ['1.7', 'Orta aktif · günde ~1 saat yürüyüş · 1,6–1,79'],
    ['1.9', 'Aktif · ayakta çalışma veya düzenli egzersiz · 1,8–1,99'],
    ['2.1', 'Çok aktif · sporcu, ağır beden işi · ≥2,0'],
    ['1.2', 'Klasik: Hareketsiz (1,2)'],
    ['1.375', 'Klasik: Hafif aktif (1,375)'],
    ['1.55', 'Klasik: Orta aktif (1,55)'],
    ['1.725', 'Klasik: Çok aktif (1,725)']
  ];

  DA.calcs = [
    { id: 'enerji', data: ['pal'], title: 'Enerji ihtiyacı & makrolar', desc: 'BMH, TEH, hedef kcal, KH/protein/yağ gramı', ico: 'heart',
      fields: [SEX, num_('age', 'Yaş'), num_('h', 'Boy (cm)'), num_('w', 'Kilo (kg)'),
        { k: 'formula', l: 'Formül', t: 'sel', o: [['mifflin', 'Mifflin–St Jeor (önerilen)'], ['henry', 'Henry 2005 (TÜBER 2022)'], ['hb', 'Harris–Benedict (revize)'], ['katch', 'Katch–McArdle (yağ % gerekli)']], def: 'mifflin' },
        num_('fat', 'Vücut yağ % (Katch için)', '', true),
        { k: 'pal', l: 'Fiziksel aktivite düzeyi (PAL)', t: 'sel', o: PAL, def: '1.375' },
        { k: 'goal', l: 'Hedef', t: 'sel', o: [['-750', 'Hızlı kilo ver (−750 kcal)'], ['-500', 'Kilo ver (−500 kcal)'], ['-250', 'Yavaş kilo ver (−250 kcal)'], ['0', 'Kilo koru'], ['250', 'Yavaş kilo al (+250 kcal)'], ['500', 'Kilo al (+500 kcal)']], def: '0' },
        num_('cho', 'Karbonhidrat %', '50'), num_('pro', 'Protein %', '20')],
      req: ['age', 'h', 'w'],
      help: () => (DA.pal ? DA.pal.helpHtml() : ''),
      run(v) {
        const mif = 10 * v.w + 6.25 * v.h - 5 * v.age + (v.sex === 'E' ? 5 : -161);
        const hb = v.sex === 'E' ? 88.362 + 13.397 * v.w + 4.799 * v.h - 5.677 * v.age : 447.593 + 9.247 * v.w + 3.098 * v.h - 4.33 * v.age;
        const lbm = isFinite(v.fat) ? v.w * (1 - v.fat / 100) : NaN;
        const kat = isFinite(lbm) ? 370 + 21.6 * lbm : NaN;
        const hen = henry(v.sex, v.age, v.w, v.h / 100);
        let bmh = v.formula === 'hb' ? hb : v.formula === 'katch' ? kat : v.formula === 'henry' ? hen : mif;
        if (!isFinite(bmh)) return { err: 'Katch–McArdle için vücut yağ yüzdesi gerekli.' };
        const pal = parseFloat(v.pal), goal = parseFloat(v.goal);
        /* TÜBER faktöriyel yöntem (Tablo 10.2): çocuk ve adolesanda büyüme çarpanı
           PAL'e EKLENİR — TEH = DEH × (PAL + 0,01); PAL ile çarpılmaz. */
        const buyume = (v.formula === 'henry' && v.age < 18) ? 0.01 : 0;
        const teh = bmh * (pal + buyume), hedef = teh + goal;
        const cho = isFinite(v.cho) ? v.cho : 50, pro = isFinite(v.pro) ? v.pro : 20, fat = 100 - cho - pro;
        const isHenry = v.formula === 'henry';
        const rows = [
          R(isHenry ? 'DEH (Henry 2005)' : 'BMH (seçili formül)', fmt(bmh, 0) + ' kcal',
            'Mifflin ' + fmt(mif, 0) + ' · Henry ' + fmt(hen, 0) + ' · Harris-Benedict ' + fmt(hb, 0) + (isFinite(kat) ? ' · Katch ' + fmt(kat, 0) : '') +
            (isHenry ? ' · eşitlik: ' + henryBand(v.age) + ' yaş' : '')),
          R('TEH' + (buyume ? ' (DEH × (PAL + 0,01))' : isHenry ? ' (DEH × PAL)' : ' (BMH × PAL)'), fmt(teh, 0) + ' kcal',
            buyume ? 'Çocuk ve adolesanda büyüme çarpanı PAL’e eklenir (TÜBER Tablo 10.2)' : ''),
          R('Hedef enerji', fmt(hedef, 0) + ' kcal/gün', '', true)];
        let note = '', tone = 'info';
        if (fat < 0 || fat > 100) { note = 'Karbonhidrat + protein yüzdesi 100’ü aşıyor.'; tone = 'bad'; }
        else {
          const g = { c: hedef * cho / 100 / 4, p: hedef * pro / 100 / 4, f: hedef * fat / 100 / 9 };
          rows.push(R('Karbonhidrat (%' + fmt(cho, 0) + ')', fmt(g.c, 0) + ' g', fmt(g.c / v.w, 1) + ' g/kg'));
          rows.push(R('Protein (%' + fmt(pro, 0) + ')', fmt(g.p, 0) + ' g', fmt(g.p / v.w, 2) + ' g/kg'));
          rows.push(R('Yağ (%' + fmt(fat, 0) + ')', fmt(g.f, 0) + ' g', fmt(g.f / v.w, 2) + ' g/kg'));
          this._last = { kcal: Math.round(hedef), p: Math.round(g.p), c: Math.round(g.c), f: Math.round(g.f) };
        }
        if (isHenry && !note) note = 'Henry 2005 eşitlikleri TÜBER 2022’de (Tablo 10.3) Türkiye referans değerlerinin hesaplanmasında kullanılan yöntemdir; bazal (BEH) yerine dinlenme enerji harcaması (DEH) verir. Kaynağın yayımlanmış tablosu için Enerji referans değerleri ekranına bakabilirsin.';
        const low = v.sex === 'E' ? 1500 : 1200;
        if (hedef < low) { note = 'Hedef enerji ' + low + ' kcal altında. Klinik gözetim olmadan çok düşük enerjili plan önerilmez.'; tone = 'warn'; }
        return { rows, note, tone, actions: [{ label: 'Menü hedefi olarak kaydet', act: 'saveTargets' }] };
      } },
    { id: 'bki', title: 'Beden kitle indeksi (BKİ)', desc: 'BKİ, sınıf ve sağlıklı kilo aralığı', ico: 'calc',
      fields: [num_('w', 'Kilo (kg)'), num_('h', 'Boy (cm)'), num_('age', 'Yaş (isteğe bağlı)', '', true)], req: ['w', 'h'],
      run(v) {
        const m = v.h / 100, b = v.w / (m * m), c = bmiCat(b);
        const rows = [R('BKİ', fmt(b, 1) + ' kg/m²', '', true), R('Sınıf (WHO)', c[0]), R('Sağlıklı kilo aralığı', fmt(18.5 * m * m, 1) + ' – ' + fmt(24.9 * m * m, 1) + ' kg', 'BKİ 18,5–24,9')];
        if (b >= 25) rows.push(R('Normal üst sınıra fark', fmt(v.w - 24.9 * m * m, 1) + ' kg'));
        if (b < 18.5) rows.push(R('Normal alt sınıra fark', fmt(18.5 * m * m - v.w, 1) + ' kg'));
        const note = isFinite(v.age) && v.age < 18 ? '18 yaş altında BKİ yaş-cinsiyet persentili ile yorumlanır (WHO/Neyzi eğrileri); bu sınıflama yetişkinler içindir.' :
          'BKİ kas kütlesini ve yağ dağılımını ayırt etmez; sporcu, yaşlı ve gebede dikkatli yorumlayın.';
        return { rows, badge: c, note, tone: 'info' };
      } },
    { id: 'ideal', title: 'İdeal kilo', desc: 'Devine, Robinson, Miller, Hamwi + düzeltilmiş kilo', ico: 'calc',
      fields: [SEX, num_('h', 'Boy (cm)'), num_('w', 'Mevcut kilo (kg, isteğe bağlı)', '', true)], req: ['h'],
      run(v) {
        const inch = v.h / 2.54, over = Math.max(0, inch - 60), E = v.sex === 'E';
        const dev = (E ? 50 : 45.5) + 2.3 * over, rob = (E ? 52 : 49) + (E ? 1.9 : 1.7) * over, mil = (E ? 56.2 : 53.1) + (E ? 1.41 : 1.36) * over, ham = (E ? 48 : 45.5) + (E ? 2.7 : 2.2) * over;
        const rows = [R('Devine', fmt(dev, 1) + ' kg', '', true), R('Robinson', fmt(rob, 1) + ' kg'), R('Miller', fmt(mil, 1) + ' kg'), R('Hamwi', fmt(ham, 1) + ' kg', '±%10: ' + fmt(ham * 0.9, 1) + '–' + fmt(ham * 1.1, 1)),
          R('BKİ 18,5–24,9 aralığı', fmt(18.5 * Math.pow(v.h / 100, 2), 1) + ' – ' + fmt(24.9 * Math.pow(v.h / 100, 2), 1) + ' kg')];
        if (isFinite(v.w)) {
          rows.push(R('İdeal kilo yüzdesi (Devine)', '%' + fmt(v.w / dev * 100, 0), 'Mevcut / ideal × 100'));
          rows.push(R('Düzeltilmiş kilo', fmt(dev + 0.25 * (v.w - dev), 1) + ' kg', 'İdeal + 0,25 × (mevcut − ideal); obezitede enerji/protein hesabı için'));
        }
        return { rows, note: 'Formüller 152 cm (60 inç) üstü boy için geliştirilmiştir. Klinik kararlarda BKİ ve vücut kompozisyonu ile birlikte değerlendirin.', tone: 'info' };
      } },
    { id: 'bel', title: 'Bel/kalça oranı & vücut yağı', desc: 'Bel-kalça oranı, bel çevresi riski, US Navy yağ %', ico: 'calc',
      fields: [SEX, num_('h', 'Boy (cm)'), num_('waist', 'Bel çevresi (cm)'), num_('hip', 'Kalça çevresi (cm)', '', true), num_('neck', 'Boyun çevresi (cm, yağ % için)', '', true)], req: ['waist'],
      run(v) {
        const E = v.sex === 'E', rows = [];
        const wr = E ? (v.waist >= 102 ? ['Yüksek risk', 'bad'] : v.waist >= 94 ? ['Artmış risk', 'warn'] : ['Risk düşük', 'ok']) : (v.waist >= 88 ? ['Yüksek risk', 'bad'] : v.waist >= 80 ? ['Artmış risk', 'warn'] : ['Risk düşük', 'ok']);
        rows.push(R('Bel çevresi riski', wr[0], E ? 'Eşikler: ≥94 artmış, ≥102 yüksek (cm)' : 'Eşikler: ≥80 artmış, ≥88 yüksek (cm)', true));
        if (isFinite(v.hip)) { const whr = v.waist / v.hip; rows.push(R('Bel/kalça oranı', fmt(whr, 2), whr > (E ? 0.9 : 0.85) ? 'WHO’ya göre abdominal obezite (E >0,90 · K >0,85)' : 'WHO eşiğinin altında (E 0,90 · K 0,85)')); }
        if (isFinite(v.h)) rows.push(R('Bel/boy oranı', fmt(v.waist / v.h, 2), '≥0,5 kardiyometabolik risk artışı'));
        if (isFinite(v.neck) && isFinite(v.h)) {
          let bf = NaN;
          if (E && v.waist > v.neck) bf = 495 / (1.0324 - 0.19077 * Math.log10(v.waist - v.neck) + 0.15456 * Math.log10(v.h)) - 450;
          if (!E && isFinite(v.hip) && v.waist + v.hip > v.neck) bf = 495 / (1.29579 - 0.35004 * Math.log10(v.waist + v.hip - v.neck) + 0.221 * Math.log10(v.h)) - 450;
          if (isFinite(bf)) {
            const cat = E ? (bf < 6 ? 'Esansiyel' : bf < 14 ? 'Sporcu' : bf < 18 ? 'Fit' : bf < 25 ? 'Ortalama' : 'Obez') : (bf < 14 ? 'Esansiyel' : bf < 21 ? 'Sporcu' : bf < 25 ? 'Fit' : bf < 32 ? 'Ortalama' : 'Obez');
            rows.push(R('Vücut yağı (US Navy)', '%' + fmt(bf, 1), 'ACE sınıfı: ' + cat + ' · tahmini değer, ±3–4 puan sapabilir'));
          } else rows.push(R('Vücut yağı (US Navy)', '—', E ? 'Bel ve boyun çevresini kontrol edin' : 'Kadınlarda kalça çevresi de gerekli'));
        }
        return { rows, badge: wr, tone: 'info', note: 'Çevre ölçümleri standart noktalardan (bel: son kaburga ile kristal iliaka arası orta nokta; kalça: en geniş nokta) alınmalıdır.' };
      } },
    { id: 'kilokaybi', title: 'Kilo kaybı yüzdesi', desc: 'İstemsiz kilo kaybının klinik anlamlılığı', ico: 'calc',
      fields: [num_('usual', 'Olağan kilo (kg)'), num_('w', 'Şimdiki kilo (kg)'), { k: 'per', l: 'Süre', t: 'sel', o: [['w1', '1 hafta'], ['m1', '1 ay'], ['m3', '3 ay'], ['m6', '6 ay']], def: 'm1' }], req: ['usual', 'w'],
      run(v) {
        const pct = (v.usual - v.w) / v.usual * 100;
        const th = { w1: [1, 2], m1: [5, 5], m3: [7.5, 7.5], m6: [10, 10] }[v.per];
        let cat = ['Anlamlı değil', 'ok'];
        if (pct > th[1]) cat = ['Ciddi kilo kaybı', 'bad']; else if (pct >= th[0]) cat = ['Anlamlı kilo kaybı', 'warn'];
        if (pct < 0) cat = ['Kilo artışı', 'info'];
        return { rows: [R('Kilo değişimi', fmt(v.w - v.usual, 1) + ' kg'), R('Kayıp yüzdesi', '%' + fmt(pct, 1), '', true), R('Değerlendirme', cat[0])], badge: cat, tone: 'info', note: 'Ölçütler (Blackburn): anlamlı — 1 hf %1–2, 1 ay %5, 3 ay %7,5, 6 ay %10; ciddi — sırasıyla >%2, >%5, >%7,5, >%10.' };
      } },
    { id: 'sivi', title: 'Sıvı ihtiyacı', desc: 'Yetişkin, yaşlı ve çocuk (Holliday–Segar)', ico: 'calc',
      fields: [num_('w', 'Kilo (kg)'), { k: 'grp', l: 'Grup', t: 'sel', o: [['ad', 'Yetişkin (30–35 ml/kg)'], ['ya', 'Yaşlı ≥65 (25–30 ml/kg)'], ['co', 'Çocuk (Holliday–Segar)']], def: 'ad' }], req: ['w'],
      run(v) {
        let lo, hi, s = '';
        if (v.grp === 'co') { lo = hi = v.w <= 10 ? 100 * v.w : v.w <= 20 ? 1000 + 50 * (v.w - 10) : 1500 + 20 * (v.w - 20); s = '≤10 kg 100 ml/kg · 10–20 kg 1000 + 50/kg · >20 kg 1500 + 20/kg'; }
        else { const r = v.grp === 'ya' ? [25, 30] : [30, 35]; lo = r[0] * v.w; hi = r[1] * v.w; }
        return { rows: [R('Günlük sıvı', lo === hi ? fmt(lo, 0) + ' ml' : fmt(lo, 0) + ' – ' + fmt(hi, 0) + ' ml', s, true), R('Bardak (200 ml)', fmt(lo / 200, 1) + (lo === hi ? '' : ' – ' + fmt(hi / 200, 1)))], note: 'Ateş, ishal, kusma, yüksek sıcaklık ve böbrek/kalp yetmezliği gibi durumlarda ihtiyaç değişir; hekimle birlikte planlayın.', tone: 'info' };
      } },
    { id: 'enteral', title: 'Enteral beslenme hacmi', desc: 'Formül hacmi, saatlik hız, protein katkısı', ico: 'calc',
      fields: [num_('kcal', 'Hedef enerji (kcal/gün)'), num_('dens', 'Formül enerji yoğunluğu (kcal/ml)', '1'), num_('prot', 'Formül proteini (g/100 ml)', '4', true), num_('hours', 'Verilme süresi (saat/gün)', '24')], req: ['kcal'],
      run(v) {
        const dens = isFinite(v.dens) ? v.dens : 1, hours = isFinite(v.hours) ? v.hours : 24;
        const vol = v.kcal / dens, rows = [R('Formül hacmi', fmt(vol, 0) + ' ml/gün', '', true), R('Hız', fmt(vol / hours, 0) + ' ml/saat', hours + ' saatte')];
        if (isFinite(v.prot)) rows.push(R('Sağlanan protein', fmt(vol * v.prot / 100, 0) + ' g/gün'));
        rows.push(R('Serbest su (formül ~%' + fmt(dens >= 1.5 ? 76 : dens >= 1.2 ? 80 : 85, 0) + ' su)', fmt(vol * (dens >= 1.5 ? 0.76 : dens >= 1.2 ? 0.8 : 0.85), 0) + ' ml/gün', 'Toplam sıvı ihtiyacı için serbest su flushları eklenir'));
        return { rows, note: 'Başlangıç hızı ve ilerleme protokolü kurum/kılavuz ve hekim kararına göre belirlenir.', tone: 'info' };
      } },
    { id: 'gir', title: 'Glukoz infüzyon hızı (GIR)', desc: 'Dekstroz % ve hıza göre mg/kg/dk', ico: 'calc',
      fields: [num_('w', 'Kilo (kg)'), num_('dex', 'Dekstroz %', '10'), num_('rate', 'Hız (ml/saat)')], req: ['w', 'dex', 'rate'],
      run(v) {
        const mgmin = v.dex * 10 * v.rate / 60, gir = mgmin / v.w, gday = v.dex * 10 * v.rate * 24 / 1000;
        return { rows: [R('GIR', fmt(gir, 2) + ' mg/kg/dk', '', true), R('Dekstroz', fmt(gday, 0) + ' g/gün'), R('Dekstrozdan enerji', fmt(gday * 3.4, 0) + ' kcal/gün', '3,4 kcal/g')], note: 'Yenidoğan ve çocuklarda hedef GIR klinik duruma göre belirlenir.', tone: 'info' };
      } }
  ];

  const byId = (id) => DA.calcs.find((c) => c.id === id);

  function prefill(c, q) {
    const p = Object.assign({}, DA.state().profile);
    const cid = q && q.get('c');
    if (cid) {
      const cl = DA.state().clients.find((x) => x.id === cid);
      if (cl) {
        p.sex = cl.sex || p.sex; p.h = cl.h || p.h;
        /* Yaş: önce doğum tarihinden (gün hassasiyetiyle), yoksa doğum yılından */
        if (cl.bdate && DA.growth) { const mo = DA.growth.months(cl.bdate); if (isFinite(mo)) p.age = Math.floor(mo / 12); }
        else if (cl.bdate) p.age = new Date().getFullYear() - parseInt(cl.bdate.slice(0, 4), 10);
        else if (cl.birth) p.age = new Date().getFullYear() - cl.birth;
        if (cl.pal) p.pal = cl.pal;
        const last = (cl.meas || []).slice().sort((a, b) => a.d.localeCompare(b.d)).pop();
        if (last && last.w) p.w = last.w;
        if (last && last.fat) p.fat = last.fat;
        if (last && last.h) p.h = last.h;
        const bel = (cl.meas || []).slice().sort((a, b) => a.d.localeCompare(b.d)).filter((x) => x.waist).pop();
        if (bel) p.waist = bel.waist;
        if (last && last.hip) p.hip = last.hip;
      }
    }
    return p;
  }

  function fieldHtml(f, val) {
    const v = val == null ? '' : val;
    if (f.t === 'sex') return '<div class="fld"><span>Cinsiyet</span><div class="seg"><label><input type="radio" name="sex" value="K" data-live="calc"' + (v === 'K' ? ' checked' : '') + '><span>Kadın</span></label><label><input type="radio" name="sex" value="E" data-live="calc"' + (v !== 'K' ? ' checked' : '') + '><span>Erkek</span></label></div></div>';
    if (f.t === 'sel') return '<label class="fld"><span>' + esc(f.l) + '</span><select name="' + f.k + '" data-live="calc">' + (typeof f.o === 'function' ? f.o() : f.o).map((o) => '<option value="' + o[0] + '"' + (String(v || f.def) === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select></label>';
    return '<label class="fld"><span>' + esc(f.l) + '</span><input type="text" inputmode="decimal" autocomplete="off" name="' + f.k + '" placeholder="' + esc(f.ph) + '" value="' + esc(v) + '" data-live="calc"></label>';
  }

  function readValues(form, c) {
    const v = {};
    c.fields.forEach((f) => {
      const el = form.elements[f.k];
      if (f.t === 'sex') v.sex = (form.querySelector('input[name=sex]:checked') || {}).value || 'E';
      else if (f.t === 'sel') v[f.k] = el.value;
      else v[f.k] = num(el.value);
    });
    return v;
  }

  /* Makul giriş aralıkları: alan anahtarına göre [alt, üst, birim].
     Hesaplayıcı kendi alanında rng ile değiştirebilir; rng: false ile kapatabilir. */
  const RANGE = {
    h: [40, 230, 'cm'], w: [1, 400, 'kg'], age: [0, 120, 'yaş'],
    waist: [30, 250, 'cm'], hip: [40, 250, 'cm'], neck: [15, 80, 'cm'], fat: [2, 70, '%'],
    w0: [1, 400, 'kg'], hafta: [1, 45, 'hafta'], ates: [30, 45, '°C'],
    cho: [0, 100, '%'], pro: [0, 100, '%'], gtid: [1, 300, 'ünite'],
    bg: [20, 900, 'mg/dL'], hedef: [50, 300, 'mg/dL'], gi: [0, 120, ''], kh: [0, 1000, 'g'], g: [0, 5000, 'g']
  };
  function rangeWarnings(c, v) {
    const out = [];
    c.fields.forEach((f) => {
      if (f.rng === false) return;
      const r = f.rng || RANGE[f.k];
      const x = v[f.k];
      if (!r || !isFinite(x)) return;
      if (x < r[0] || x > r[1]) out.push(f.l.replace(/\s*\(.*$/, '') + ': ' + fmt(x, 1) + (r[2] ? ' ' + r[2] : '') +
        ' — beklenen ' + r[0] + '–' + r[1] + (r[2] ? ' ' + r[2] : ''));
    });
    return out;
  }

  /* Danışandan açıldıysa (?c=) sonucu o dosyaya işleyebilmek için */
  let curClient = null, lastRes = null;

  function resultHtml(c, v) {
    const missing = c.req.filter((k) => !isFinite(v[k]));
    if (missing.length) return '<div class="muted center small" style="padding:18px 6px">Sonucu görmek için gerekli değerleri gir.</div>';
    const r = c.run(v);
    if (r.err) return '<div class="note bad">' + esc(r.err) + '</div>' + (r.html || '');
    const warn = rangeWarnings(c, v);
    let h = warn.length ? '<div class="note warn"><b>Girdiyi kontrol et:</b><br>' + warn.map(esc).join('<br>') + '</div>' : '';
    h += (r.badge ? '<div class="mb"><span class="badge ' + r.badge[1] + '">' + esc(r.badge[0]) + '</span></div>' : '');
    h += r.rows.map((x) => '<div class="res' + (x.hl ? ' hl' : '') + '"><span class="l">' + esc(x.l) + '</span><span class="v">' + esc(x.v) + (x.s ? '<span class="sub">' + esc(x.s) + '</span>' : '') + '</span></div>').join('');
    if (r.html) h += r.html; // hesaplayıcının kendi ürettiği blok (tablo, grafik)
    if (r.note) h += '<div class="note ' + (r.tone === 'info' ? '' : r.tone) + '">' + esc(r.note) + '</div>';
    if (r.actions) h += r.actions.map((a) => '<button class="btn sec block mt-s" data-act="' + a.act + '">' + esc(a.label) + '</button>').join('');
    /* özet: vurgulu satırlar, yoksa ilk iki satır */
    const hi = r.rows.filter((x) => x.hl);
    /* Zaman çizgisinde karşılaştırabilmek için baş satırın sayısal değeri de saklanır */
    const bas = (hi.length ? hi : r.rows)[0];
    const sayi = bas ? DA.num(String(bas.v).replace(/[^0-9,.\-]/g, '')) : NaN;
    lastRes = { t: c.title, ico: c.ico, s: (hi.length ? hi : r.rows.slice(0, 2)).map((x) => x.l + ': ' + x.v).join(' · '),
      k: bas ? bas.l : '', v: isFinite(sayi) ? sayi : null,
      u: bas ? String(bas.v).replace(/[0-9,.\-]/g, '').trim() : '' };
    if (curClient) h += '<button class="btn ghost block mt-s" data-act="saveToClient">' + DA.icon('users') + ' Danışan dosyasına kaydet</button>';
    return h;
  }

  DA.live.calc = (el) => {
    const form = el.closest('form'), c = byId(form.dataset.calc);
    const v = readValues(form, c);
    // ortak profili hatırla
    const p = DA.state().profile;
    ['sex', 'age', 'h', 'w', 'waist'].forEach((k) => { if (v[k] != null && (k === 'sex' || isFinite(v[k]))) p[k] = v[k]; });
    DA.save();
    DA.$('#calcOut').innerHTML = resultHtml(c, v);
  };
  DA.actions.saveToClient = () => {
    if (!curClient || !lastRes) return DA.toast('Önce değerleri gir');
    DA.saveCalcToClient(curClient, lastRes);
  };
  DA.actions.saveTargets = () => {
    const c = byId('enerji');
    if (!c._last) return DA.toast('Önce değerleri gir');
    DA.state().targets = Object.assign({}, c._last); DA.save();
    DA.toast('Kaydedildi: ' + c._last.kcal + ' kcal · menü planlayıcıda hedef olarak kullanılacak');
  };

  /* ---- Bilgi mimarisi ----
     Her hesaplayıcı bir bölüme (hesapla / referans) ve bir gruba yazılır.
     Listede sıralama buradaki sıraya göredir; burada olmayan yeni bir hesaplayıcı
     Hesapla sekmesinin sonundaki "Diğer" grubuna düşer. */
  DA.IA = {
    hesapla: [
      ['Antropometri', ['bki', 'ideal', 'bel', 'kilokaybi']],
      ['Enerji ve makrolar', ['enerji', 'sivi', 'stres']],
      ['Değişim ve karbonhidrat', ['degisim', 'khsayim', 'khdagilim', 'gy']],
      ['Çocuk ve gebelik', ['cocuk', 'cocukenerji', 'gebelik']],
      ['Tarama', ['nrs', 'must', 'mnasf', 'diyabetrisk']],
      ['Spor beslenmesi', ['sporcu', 'terleme', 'sporke']],
      ['Klinik', ['enteral', 'gir']]
    ],
    referans: [
      ['TÜBER referans değerleri', ['tuber', 'hedef', 'oruntu', 'enerjiref']],
      ['Porsiyon ve besin değerleri', ['porsiyon', 'porsiyonbesin', 'istege']],
      ['Yaşam dönemleri', ['bebek', 'gebe', 'pal', 'vejetaryen']],
      ['Örnek planlar', ['ornekmenu']],
      ['Yöntem', ['yontem']]
    ]
  };
  /* id → bölüm */
  DA.calcSection = (id) => {
    let sec = 'hesapla';
    Object.keys(DA.IA).forEach((k) => DA.IA[k].forEach((g) => { if (g[1].indexOf(id) >= 0) sec = k; }));
    return sec;
  };
  /* Bir bölümün grupları; listede olmayan hesaplayıcılar Hesapla'nın sonuna eklenir */
  function groupsOf(sec) {
    const yerlesik = {};
    Object.keys(DA.IA).forEach((k) => DA.IA[k].forEach((g) => g[1].forEach((id) => { yerlesik[id] = 1; })));
    const out = DA.IA[sec].map((g) => [g[0], g[1].map(byId).filter(Boolean)]).filter((g) => g[1].length);
    if (sec === 'hesapla') {
      const kalan = DA.calcs.filter((c) => !yerlesik[c.id]);
      if (kalan.length) out.push(['Diğer', kalan]);
    }
    return out;
  }
  DA.calcGroups = groupsOf;

  DA.calcListHtml = (sec) => groupsOf(sec).map((g) =>
    '<div class="sect">' + esc(g[0]) + '</div><div class="list">' + g[1].map((c) =>
      '<a class="li chev" href="#/hesapla/' + c.id + '"><span class="ic">' + DA.icon(c.ico) + '</span>' +
      '<span class="grow"><div class="t">' + esc(c.title) + '</div><div class="s">' + esc(c.desc) + '</div></span></a>').join('') +
    '</div>').join('');

  DA.views.hesapla = (parts, q) => {
    const id = parts[0];
    if (!id) {
      curClient = null;
      return { title: 'Hesaplayıcılar', tab: 'hesapla',
        html: DA.calcListHtml('hesapla') +
          '<p class="muted small center">Girdiğin boy, kilo, yaş ve cinsiyet hesaplayıcılar arasında hatırlanır.</p>' +
          '<a class="btn ghost block" href="#/referans">' + DA.icon('book') + ' TÜBER referans tabloları</a>' };
    }
    const c = byId(id);
    if (!c) return { title: 'Bulunamadı', back: 'hesapla', html: '<div class="card">Hesaplayıcı bulunamadı.</div>' };
    /* Ekranın ihtiyaç duyduğu veri henüz yüklenmediyse yükle ve yeniden çiz */
    if (c.data && !DA.hazir(c.data)) {
      DA.need(c.data).then(() => DA.render(true)).catch(() => DA.toast('Veri yüklenemedi'));
      return { title: c.title, tab: DA.calcSection(c.id), back: DA.calcSection(c.id), ico: c.ico,
        html: '<div class="card"><div class="empty">' + DA.icon(c.ico || 'calc') + '<div>Yükleniyor…</div></div></div>' };
    }
    if (c.view) {
      /* kendi arayüzünü çizen hesaplayıcı; sekme ve geri hedefi merkezden belirlenir */
      const out = c.view(parts.slice(1), q), sec = DA.calcSection(c.id);
      out.tab = sec; if (out.back === 'hesapla' || !out.back) out.back = sec;
      return out;
    }
    curClient = q.get('c') || null; lastRes = null;
    const pf = prefill(c, q);
    let clientLine = '';
    if (q.get('c')) { const cl = DA.state().clients.find((x) => x.id === q.get('c')); if (cl) clientLine = '<div class="note ok">Danışan bilgileri dolduruldu: ' + esc(cl.name) + '</div>'; }
    return {
      title: c.title, tab: DA.calcSection(c.id), back: q.get('c') ? 'danisan/' + q.get('c') : DA.calcSection(c.id),
      ico: c.ico, fav: { h: '#/hesapla/' + c.id, t: c.title, ico: c.ico },
      html: clientLine + '<form class="card" data-calc="' + c.id + '" onsubmit="return false">' + c.fields.map((f) => fieldHtml(f, pf[f.k])).join('') + '</form><div class="card" id="calcOut"></div>' +
        (typeof c.help === 'function' ? c.help() : (c.help || '')),
      mount(app) { const form = DA.$('form[data-calc]', app); DA.$('#calcOut').innerHTML = resultHtml(c, readValues(form, c)); }
    };
  };
})();
