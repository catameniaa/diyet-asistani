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
  const PAL = [['1.2', 'Hareketsiz (1,2)'], ['1.375', 'Hafif aktif (1,375)'], ['1.55', 'Orta aktif (1,55)'], ['1.725', 'Çok aktif (1,725)'], ['1.9', 'Aşırı aktif (1,9)']];

  DA.calcs = [
    { id: 'enerji', title: 'Enerji ihtiyacı & makrolar', desc: 'BMH, TEH, hedef kcal, KH/protein/yağ gramı', ico: 'heart',
      fields: [SEX, num_('age', 'Yaş'), num_('h', 'Boy (cm)'), num_('w', 'Kilo (kg)'),
        { k: 'formula', l: 'Formül', t: 'sel', o: [['mifflin', 'Mifflin–St Jeor (önerilen)'], ['hb', 'Harris–Benedict (revize)'], ['katch', 'Katch–McArdle (yağ % gerekli)']], def: 'mifflin' },
        num_('fat', 'Vücut yağ % (Katch için)', '', true),
        { k: 'pal', l: 'Fiziksel aktivite düzeyi (PAL)', t: 'sel', o: PAL, def: '1.375' },
        { k: 'goal', l: 'Hedef', t: 'sel', o: [['-750', 'Hızlı kilo ver (−750 kcal)'], ['-500', 'Kilo ver (−500 kcal)'], ['-250', 'Yavaş kilo ver (−250 kcal)'], ['0', 'Kilo koru'], ['250', 'Yavaş kilo al (+250 kcal)'], ['500', 'Kilo al (+500 kcal)']], def: '0' },
        num_('cho', 'Karbonhidrat %', '50'), num_('pro', 'Protein %', '20')],
      req: ['age', 'h', 'w'],
      run(v) {
        const mif = 10 * v.w + 6.25 * v.h - 5 * v.age + (v.sex === 'E' ? 5 : -161);
        const hb = v.sex === 'E' ? 88.362 + 13.397 * v.w + 4.799 * v.h - 5.677 * v.age : 447.593 + 9.247 * v.w + 3.098 * v.h - 4.33 * v.age;
        const lbm = isFinite(v.fat) ? v.w * (1 - v.fat / 100) : NaN;
        const kat = isFinite(lbm) ? 370 + 21.6 * lbm : NaN;
        let bmh = v.formula === 'hb' ? hb : v.formula === 'katch' ? kat : mif;
        if (!isFinite(bmh)) return { err: 'Katch–McArdle için vücut yağ yüzdesi gerekli.' };
        const pal = parseFloat(v.pal), goal = parseFloat(v.goal);
        const teh = bmh * pal, hedef = teh + goal;
        const cho = isFinite(v.cho) ? v.cho : 50, pro = isFinite(v.pro) ? v.pro : 20, fat = 100 - cho - pro;
        const rows = [R('BMH (seçili formül)', fmt(bmh, 0) + ' kcal', 'Mifflin ' + fmt(mif, 0) + ' · Harris-Benedict ' + fmt(hb, 0) + (isFinite(kat) ? ' · Katch ' + fmt(kat, 0) : '')),
          R('TEH (BMH × PAL)', fmt(teh, 0) + ' kcal'), R('Hedef enerji', fmt(hedef, 0) + ' kcal/gün', '', true)];
        let note = '', tone = 'info';
        if (fat < 0 || fat > 100) { note = 'Karbonhidrat + protein yüzdesi 100’ü aşıyor.'; tone = 'bad'; }
        else {
          const g = { c: hedef * cho / 100 / 4, p: hedef * pro / 100 / 4, f: hedef * fat / 100 / 9 };
          rows.push(R('Karbonhidrat (%' + fmt(cho, 0) + ')', fmt(g.c, 0) + ' g', fmt(g.c / v.w, 1) + ' g/kg'));
          rows.push(R('Protein (%' + fmt(pro, 0) + ')', fmt(g.p, 0) + ' g', fmt(g.p / v.w, 2) + ' g/kg'));
          rows.push(R('Yağ (%' + fmt(fat, 0) + ')', fmt(g.f, 0) + ' g', fmt(g.f / v.w, 2) + ' g/kg'));
          this._last = { kcal: Math.round(hedef), p: Math.round(g.p), c: Math.round(g.c), f: Math.round(g.f) };
        }
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
        if (cl.birth) p.age = new Date().getFullYear() - cl.birth;
        const last = (cl.meas || []).slice().sort((a, b) => a.d.localeCompare(b.d)).pop();
        if (last && last.w) p.w = last.w;
        if (last && last.fat) p.fat = last.fat;
      }
    }
    return p;
  }

  function fieldHtml(f, val) {
    const v = val == null ? '' : val;
    if (f.t === 'sex') return '<div class="fld"><span>Cinsiyet</span><div class="seg"><label><input type="radio" name="sex" value="K" data-live="calc"' + (v === 'K' ? ' checked' : '') + '><span>Kadın</span></label><label><input type="radio" name="sex" value="E" data-live="calc"' + (v !== 'K' ? ' checked' : '') + '><span>Erkek</span></label></div></div>';
    if (f.t === 'sel') return '<label class="fld"><span>' + esc(f.l) + '</span><select name="' + f.k + '" data-live="calc">' + f.o.map((o) => '<option value="' + o[0] + '"' + (String(v || f.def) === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select></label>';
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

  function resultHtml(c, v) {
    const missing = c.req.filter((k) => !isFinite(v[k]));
    if (missing.length) return '<div class="muted center small" style="padding:18px 6px">Sonucu görmek için gerekli değerleri gir.</div>';
    const r = c.run(v);
    if (r.err) return '<div class="note bad">' + esc(r.err) + '</div>';
    let h = (r.badge ? '<div class="mb"><span class="badge ' + r.badge[1] + '">' + esc(r.badge[0]) + '</span></div>' : '');
    h += r.rows.map((x) => '<div class="res' + (x.hl ? ' hl' : '') + '"><span class="l">' + esc(x.l) + '</span><span class="v">' + esc(x.v) + (x.s ? '<span class="sub">' + esc(x.s) + '</span>' : '') + '</span></div>').join('');
    if (r.html) h += r.html; // hesaplayıcının kendi ürettiği blok (tablo, grafik)
    if (r.note) h += '<div class="note ' + (r.tone === 'info' ? '' : r.tone) + '">' + esc(r.note) + '</div>';
    if (r.actions) h += r.actions.map((a) => '<button class="btn sec block mt-s" data-act="' + a.act + '">' + esc(a.label) + '</button>').join('');
    return h;
  }

  DA.live.calc = (el) => {
    const form = el.closest('form'), c = byId(form.dataset.calc);
    const v = readValues(form, c);
    // ortak profili hatırla
    const p = DA.state().profile;
    ['sex', 'age', 'h', 'w'].forEach((k) => { if (v[k] != null && (k === 'sex' || isFinite(v[k]))) p[k] = v[k]; });
    DA.save();
    DA.$('#calcOut').innerHTML = resultHtml(c, v);
  };
  DA.actions.saveTargets = () => {
    const c = byId('enerji');
    if (!c._last) return DA.toast('Önce değerleri gir');
    DA.state().targets = Object.assign({}, c._last); DA.save();
    DA.toast('Kaydedildi: ' + c._last.kcal + ' kcal · menü planlayıcıda hedef olarak kullanılacak');
  };

  DA.views.hesapla = (parts, q) => {
    const id = parts[0];
    if (!id) {
      return { title: 'Hesaplayıcılar', tab: 'hesapla', html: '<div class="list">' + DA.calcs.map((c) =>
        '<a class="li chev" href="#/hesapla/' + c.id + '"><span class="ic">' + DA.icon(c.ico) + '</span><span class="grow"><div class="t">' + esc(c.title) + '</div><div class="s">' + esc(c.desc) + '</div></span></a>').join('') + '</div>' +
        '<p class="muted small center">Girdiğin boy, kilo, yaş ve cinsiyet hesaplayıcılar arasında hatırlanır.</p>' };
    }
    const c = byId(id);
    if (!c) return { title: 'Bulunamadı', back: 'hesapla', html: '<div class="card">Hesaplayıcı bulunamadı.</div>' };
    const pf = prefill(c, q);
    let clientLine = '';
    if (q.get('c')) { const cl = DA.state().clients.find((x) => x.id === q.get('c')); if (cl) clientLine = '<div class="note ok">Danışan bilgileri dolduruldu: ' + esc(cl.name) + '</div>'; }
    return {
      title: c.title, tab: 'hesapla', back: q.get('c') ? 'danisan/' + q.get('c') : 'hesapla',
      html: clientLine + '<form class="card" data-calc="' + c.id + '" onsubmit="return false">' + c.fields.map((f) => fieldHtml(f, pf[f.k])).join('') + '</form><div class="card" id="calcOut"></div>',
      mount(app) { const form = DA.$('form[data-calc]', app); DA.$('#calcOut').innerHTML = resultHtml(c, readValues(form, c)); }
    };
  };
})();
