/* Ek hesaplayıcılar: gebelik/laktasyon, stres faktörü, çocuk enerji-protein, glisemik yük */
(function () {
  'use strict';
  const { fmt, esc } = DA;
  const num_ = (k, l, ph, opt) => ({ k, l, t: 'num', ph: ph || '', opt: !!opt });
  const R = (l, v, s, hl) => ({ l, v, s, hl });

  /* ---------- Gebelik ve laktasyon ---------- */
  /* Ek enerji: DRI/IOM. Gebelikte önerilen ağırlık kazanımı: IOM 2009, gebelik öncesi BKİ'ye göre. */
  const GAIN = [
    { max: 18.5, l: 'Zayıf (BKİ <18,5)', tot: [12.5, 18], wk: [0.44, 0.58] },
    { max: 25, l: 'Normal (BKİ 18,5–24,9)', tot: [11.5, 16], wk: [0.35, 0.50] },
    { max: 30, l: 'Fazla kilolu (BKİ 25–29,9)', tot: [7, 11.5], wk: [0.23, 0.33] },
    { max: Infinity, l: 'Obez (BKİ ≥30)', tot: [5, 9], wk: [0.17, 0.27] }
  ];

  DA.calcs.push({
    id: 'gebelik', data: ['gebe'], title: 'Gebelik ve laktasyon', desc: 'Ek enerji, protein ve önerilen ağırlık kazanımı', ico: 'pregnant',
    help: () => (DA.gebe ? DA.gebe.helpHtml() : ''),
    fields: [
      { k: 'durum', l: 'Durum', t: 'sel', def: 't2', o: [
        ['t1', 'Gebelik — 1. trimester'], ['t2', 'Gebelik — 2. trimester'], ['t3', 'Gebelik — 3. trimester'],
        ['l1', 'Laktasyon — ilk 6 ay'], ['l2', 'Laktasyon — 6–12 ay']] },
      num_('bmh', 'Gebelik öncesi günlük enerji (kcal)', 'örn. 2000', true),
      num_('h', 'Boy (cm)'), num_('w0', 'Gebelik öncesi ağırlık (kg)'),
      num_('w', 'Şimdiki ağırlık (kg)', '', true), num_('hafta', 'Gebelik haftası', '', true)
    ],
    req: ['h', 'w0'],
    run(v) {
      const EK = { t1: [0, 'ek enerji önerilmez (bazı kaynaklarda +70 kcal)'], t2: [340, ''], t3: [452, ''], l1: [500, ''], l2: [400, ''] };
      const PRO = { t1: 0, t2: 25, t3: 25, l1: 25, l2: 25 };
      const gebe = v.durum[0] === 't';
      const bmi0 = v.w0 / Math.pow(v.h / 100, 2);
      const band = GAIN.find((g) => bmi0 < g.max);
      const ek = EK[v.durum][0];

      const rows = [R('Gebelik öncesi BKİ', fmt(bmi0, 1) + ' kg/m²', band.l, true),
        R('Ek enerji', (ek ? '+' + ek : '+0') + ' kcal/gün', EK[v.durum][1] || 'DRI ek enerji önerisi'),
        R('Ek protein', '+' + PRO[v.durum] + ' g/gün', PRO[v.durum] ? 'Gebeliğin 2. yarısı ve laktasyonda' : '1. trimesterde ek protein önerilmez')];
      if (isFinite(v.bmh)) rows.push(R('Toplam hedef enerji', fmt(v.bmh + ek, 0) + ' kcal/gün', fmt(v.bmh, 0) + ' + ' + ek, true));

      if (gebe) {
        rows.push(R('Önerilen toplam kazanım', fmt(band.tot[0], 1) + '–' + fmt(band.tot[1], 1) + ' kg', 'IOM 2009, tüm gebelik'));
        rows.push(R('Haftalık kazanım (2.–3. trimester)', fmt(band.wk[0], 2) + '–' + fmt(band.wk[1], 2) + ' kg/hafta'));
        if (isFinite(v.w) && isFinite(v.hafta) && v.hafta > 0) {
          const kazanim = v.w - v.w0;
          rows.push(R('Şu ana kadar kazanım', (kazanim >= 0 ? '+' : '−') + fmt(Math.abs(kazanim), 1) + ' kg', v.hafta + '. hafta'));
          if (v.hafta > 13) {
            const hf = v.hafta - 13;
            const bekLo = band.tot[0] * 0.15 + band.wk[0] * hf, bekHi = band.tot[1] * 0.2 + band.wk[1] * hf;
            rows.push(R('Bu haftada beklenen aralık', fmt(bekLo, 1) + '–' + fmt(bekHi, 1) + ' kg',
              kazanim < bekLo ? 'Beklenenin altında' : kazanim > bekHi ? 'Beklenenin üstünde' : 'Beklenen aralıkta'));
          }
        }
      }
      return { rows, badge: [band.l, bmi0 < 18.5 || bmi0 >= 30 ? 'warn' : 'ok'],
        note: 'Ek enerji ve protein değerleri DRI/IOM önerileridir; ağırlık kazanımı aralıkları IOM 2009’a göredir (tekil gebelik). Çoğul gebelikte ve klinik durumlarda hekim/kurum protokolü geçerlidir.', tone: 'info' };
    }
  });

  /* ---------- Stres ve aktivite faktörü ---------- */
  /* Klasik Long (1979) faktörleri. Güncel pratikte indirekt kalorimetri ya da 25–30 kcal/kg tercih edilir. */
  const STRES = [['1', 'Stres yok (1,0)'], ['1.1', 'Elektif cerrahi (1,1)'], ['1.2', 'Hafif enfeksiyon (1,2)'],
    ['1.3', 'Kemik kırığı / orta travma (1,3)'], ['1.4', 'Sepsis / peritonit (1,4)'], ['1.5', 'Çoklu travma (1,5)'],
    ['1.6', 'Ağır enfeksiyon (1,6)'], ['1.7', 'Yanık %30–50 (1,7)'], ['1.8', 'Yanık %50–70 (1,8)'], ['2', 'Yanık >%70 (2,0)']];

  DA.calcs.push({
    id: 'stres', title: 'Stres ve aktivite faktörü', desc: 'Klinik hastada BMH × aktivite × stres, kcal/kg kontrolü', ico: 'pulse',
    fields: [
      { k: 'sex', l: 'Cinsiyet', t: 'sex' }, num_('age', 'Yaş'), num_('h', 'Boy (cm)'), num_('w', 'Kilo (kg)'),
      { k: 'akt', l: 'Aktivite', t: 'sel', def: '1.2', o: [['1.1', 'Yatak istirahati (1,1)'], ['1.2', 'Yatağa bağımlı, hareketli (1,2)'], ['1.3', 'Yatak dışı / ayaktaki hasta (1,3)']] },
      { k: 'stres', l: 'Stres faktörü', t: 'sel', def: '1', o: STRES },
      num_('ates', 'Vücut sıcaklığı (°C)', '37', true)
    ],
    req: ['age', 'h', 'w'],
    run(v) {
      const E = v.sex === 'E';
      const hb = E ? 88.362 + 13.397 * v.w + 4.799 * v.h - 5.677 * v.age : 447.593 + 9.247 * v.w + 3.098 * v.h - 4.33 * v.age;
      const akt = parseFloat(v.akt), st = parseFloat(v.stres);
      /* Ateş faktörü: 37 °C üzerindeki her 1 °C için ×1,13 */
      const fev = isFinite(v.ates) && v.ates > 37 ? Math.pow(1.13, v.ates - 37) : 1;
      const teh = hb * akt * st * fev;
      const rows = [
        R('BMH (Harris–Benedict)', fmt(hb, 0) + ' kcal'),
        R('Aktivite × stres' + (fev > 1 ? ' × ateş' : ''), '×' + fmt(akt * st * fev, 2), 'Aktivite ' + fmt(akt, 2) + ' · stres ' + fmt(st, 2) + (fev > 1 ? ' · ateş ' + fmt(fev, 2) : '')),
        R('Hedef enerji', fmt(teh, 0) + ' kcal/gün', fmt(teh / v.w, 1) + ' kcal/kg', true),
        R('Kontrol: 25–30 kcal/kg', fmt(25 * v.w, 0) + '–' + fmt(30 * v.w, 0) + ' kcal/gün', 'Çoğu kritik hastada önerilen aralık'),
        R('Protein 1,2–2,0 g/kg', fmt(1.2 * v.w, 0) + '–' + fmt(2 * v.w, 0) + ' g/gün', 'Kritik hastada yaygın aralık')
      ];
      const kkg = teh / v.w;
      let note = 'Long (1979) stres faktörleri klasik bir yaklaşımdır ve çoğu hastada gereksinimi olduğundan yüksek tahmin edebilir. Mümkünse indirekt kalorimetri, değilse 25–30 kcal/kg aralığı tercih edilir. Kurum protokolünüz geçerlidir.';
      let tone = 'info';
      if (kkg > 35) { note = 'Hesaplanan enerji ' + fmt(kkg, 0) + ' kcal/kg — aşırı besleme riski. ' + note; tone = 'warn'; }
      return { rows, note, tone };
    }
  });

  /* ---------- Çocuk enerji ve protein ---------- */
  /* Enerji: DRI Tahmini Enerji Gereksinimi (EER) denklemleri. Protein: DRI RDA (g/kg/gün). */
  /* PA katsayısı cinsiyete göre farklıdır: [erkek, kız] */
  const PAV = { sed: [1, 1], low: [1.13, 1.16], act: [1.26, 1.31], very: [1.42, 1.56] };
  const PA_O = [['sed', 'Sedanter'], ['low', 'Az aktif'], ['act', 'Aktif'], ['very', 'Çok aktif']];
  function proteinRda(y) {
    if (y < 0.5) return [1.52, '0–6 ay (AI)'];
    if (y < 1) return [1.2, '7–12 ay'];
    if (y < 4) return [1.05, '1–3 yaş'];
    if (y < 9) return [0.95, '4–8 yaş'];
    if (y < 14) return [0.95, '9–13 yaş'];
    if (y < 19) return [0.85, '14–18 yaş'];
    return [0.8, 'Yetişkin'];
  }

  DA.calcs.push({
    id: 'cocukenerji', data: ['growth'], title: 'Çocuk enerji ve protein', desc: 'DRI tahmini enerji gereksinimi (EER) ve protein RDA', ico: 'baby',
    fields: [
      { k: 'sex', l: 'Cinsiyet', t: 'sex' },
      Object.assign(num_('age', 'Yaş (yıl; bebekte ondalık, örn. 0,5)'), { rng: [0, 18, 'yaş'] }),
      num_('w', 'Ağırlık (kg)'), num_('h', 'Boy (cm; 3 yaş üstü için gerekli)', '', true),
      { k: 'pa', l: 'Fiziksel aktivite (3 yaş üstü)', t: 'sel', def: 'act', o: PA_O }
    ],
    req: ['age', 'w'],
    run(v) {
      const y = v.age, E = v.sex === 'E';
      if (y < 0 || y > 18) return { err: 'Bu hesaplayıcı 0–18 yaş içindir.' };
      let eer, kaynak;
      if (y < 3) {
        const add = y < 0.25 ? 175 : y < 0.5 ? 56 : y < 1 ? 22 : 20;
        eer = 89 * v.w - 100 + add;
        kaynak = 'EER (0–36 ay): 89 × kg − 100 + ' + add;
      } else {
        if (!isFinite(v.h)) return { err: '3 yaş üstünde EER için boy gerekli.' };
        const pa = (PAV[v.pa] || PAV.act)[E ? 0 : 1], m = v.h / 100, add = y < 9 ? 20 : 25;
        eer = E ? 88.5 - 61.9 * y + pa * (26.7 * v.w + 903 * m) + add
                : 135.3 - 30.8 * y + pa * (10 * v.w + 934 * m) + add;
        kaynak = 'EER (' + (E ? 'erkek' : 'kız') + ', ' + (y < 9 ? '3–8' : '9–18') + ' yaş), PA ' + fmt(pa, 2);
      }
      const pr = proteinRda(y);
      const rows = [
        R('Tahmini enerji gereksinimi', fmt(eer, 0) + ' kcal/gün', fmt(eer / v.w, 0) + ' kcal/kg', true),
        R('Formül', kaynak),
        R('Protein RDA', fmt(pr[0] * v.w, 1) + ' g/gün', pr[0] + ' g/kg/gün · ' + pr[1]),
        R('Sıvı (Holliday–Segar)', fmt(fluid(v.w), 0) + ' ml/gün', 'İlk 10 kg 100 ml/kg, sonraki 10 kg 50, sonrası 20')
      ];
      return { rows,
        note: 'Değerler DRI (IOM) denklemlerine dayanır ve sağlıklı çocuk içindir. Büyümeyi ayrıca persentil ile izleyin — Çocuk persentil (WHO) hesaplayıcısı. Hastalık, yakalama büyümesi ve prematüritede kurum protokolü geçerlidir.',
        tone: 'info', actions: [{ label: 'Persentil hesaplayıcısına git', act: 'goPersentil' }] };
    }
  });
  function fluid(w) { return w <= 10 ? w * 100 : w <= 20 ? 1000 + (w - 10) * 50 : 1500 + (w - 20) * 20; }
  DA.actions.goPersentil = () => DA.go('hesapla/cocuk');

  /* ---------- Glisemik yük ---------- */
  DA.calcs.push({
    id: 'gy', data: ['gi'], title: 'Glisemik indeks ve yük', desc: 'GI listesinden seç ya da elle gir, porsiyonun glisemik yükü', ico: 'gauge',
    fields: [
      { k: 'f', l: 'Besin', t: 'sel', def: '', o: () => [['', 'Elle gir']].concat((DA.data.gi || []).map((g, i) => [String(i), g[0] + ' (GI ' + g[1] + ')'])) },
      num_('gi', 'Glisemik indeks (elle değiştirilebilir)', '', true),
      num_('g', 'Porsiyon (g)', '100', true),
      num_('kh', 'Porsiyondaki karbonhidrat (g)', '', true)
    ],
    req: [],
    run(v) {
      const sel = v.f !== '' ? (DA.data.gi || [])[parseInt(v.f, 10)] : null;
      const gi = isFinite(v.gi) ? v.gi : (sel ? sel[1] : NaN);
      if (!isFinite(gi)) return { rows: [R('Glisemik yük', '—', 'Besin seç ya da GI değerini gir')], html: giTable(),
        note: 'Listeden besin seçtiğinde GI ve karbonhidrat otomatik gelir; istersen üzerine yazabilirsin.', tone: 'info' };

      const food = sel && sel[2] ? DA.data.foods.find((x) => x.id === sel[2]) : null;
      const gram = isFinite(v.g) ? v.g : 100;
      const kh = isFinite(v.kh) ? v.kh : (food ? food.c * gram / 100 : NaN);
      const giCat = gi <= 55 ? ['Düşük GI', 'ok'] : gi <= 69 ? ['Orta GI', 'warn'] : ['Yüksek GI', 'bad'];
      const rows = [R('Glisemik indeks', fmt(gi, 0), giCat[0] + ' · düşük ≤55, orta 56–69, yüksek ≥70')];

      if (!isFinite(kh)) {
        rows.push(R('Glisemik yük', '—', 'Porsiyondaki karbonhidratı gir'));
        return { rows, badge: giCat, html: giTable(), note: giNote(), tone: 'info' };
      }
      const gl = gi * kh / 100;
      const glCat = gl <= 10 ? ['Düşük glisemik yük', 'ok'] : gl <= 19 ? ['Orta glisemik yük', 'warn'] : ['Yüksek glisemik yük', 'bad'];
      rows.push(R('Porsiyondaki karbonhidrat', fmt(kh, 1) + ' g', food ? food.n + ' · ' + fmt(gram, 0) + ' g porsiyon' : fmt(gram, 0) + ' g porsiyon'));
      rows.push(R('Glisemik yük', fmt(gl, 1), 'GI × karbonhidrat ÷ 100 · düşük ≤10, orta 11–19, yüksek ≥20', true));
      rows.push(R('Karbonhidrat değişimi', fmt(kh / 15, 1), '15 g = 1 değişim'));
      return { rows, badge: glCat, html: giTable(), note: giNote(), tone: 'info' };
    }
  });

  function giNote() {
    return 'GI değerleri YAKLAŞIKTIR: çeşit, olgunluk, pişirme süresi ve öğünün bileşimi GI’yi belirgin değiştirir. Klinik kullanımda kendi kaynağınızın değerini girin.';
  }
  function giTable() {
    return '<details class="acc mt"><summary>Glisemik indeks tablosu</summary><div class="body">' +
      '<div class="scrollx"><table class="t"><thead><tr><th>Besin</th><th class="n">GI</th><th>Sınıf</th></tr></thead><tbody>' +
      (DA.data.gi || []).map((g) => '<tr><td>' + esc(g[0]) + '</td><td class="n">' + g[1] + '</td><td>' +
        (g[1] <= 55 ? 'Düşük' : g[1] <= 69 ? 'Orta' : 'Yüksek') + '</td></tr>').join('') +
      '</tbody></table></div><p class="muted tiny" style="margin-bottom:0">Glukoz = 100 referanslı yaklaşık değerler.</p></div></details>';
  }
})();
