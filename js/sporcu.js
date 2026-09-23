/* TÜBER 2022 Bölüm 8.2 — spor beslenmesi hesaplayıcıları.
   Üç ayrı araç: günlük plan, terleme oranı/rehidrasyon ve kullanılabilir enerji (RED-S). */
(function () {
  'use strict';
  const { esc, fmt, icon } = DA;
  const S = () => DA.data.sporcu;
  const R = (l, v, s, hl) => ({ l, v, s, hl });
  const num_ = (k, l, ph, opt) => ({ k, l, t: 'num', ph: ph || '', opt: !!opt });
  const ara = (a, b, d) => fmt(a, d == null ? 0 : d) + '–' + fmt(b, d == null ? 0 : d);

  /* ---------------- Günlük spor beslenme planı ---------------- */
  DA.calcs.push({
    id: 'sporcu', data: ['sporcu'], title: 'Sporcu beslenme planı',
    desc: 'Karbonhidrat, protein, yağ ve sıvı hedefleri · antrenman yüküne göre', ico: 'run',
    fields: [
      num_('w', 'Vücut ağırlığı (kg)'),
      { k: 'yuk', l: 'Antrenman yükü', t: 'sel', def: '2', o: () =>
        (S() ? S().kh.yuk.map((y) => [String(y.s), y.l]) : []) },
      { k: 'dal', l: 'Spor dalı', t: 'sel', def: 'day', o: () =>
        (S() ? S().pro.dal.map((d) => [d.k, d.l]) : []) },
      num_('kcal', 'Günlük enerji hedefi (kcal, varsa)', 'örn. 3000', true),
      num_('sure', 'Bugünkü antrenman süresi (dakika)', '', true)
    ],
    req: ['w'],
    run(v) {
      const D = S(), w = v.w;
      const yuk = D.kh.yuk.find((y) => String(y.s) === String(v.yuk)) || D.kh.yuk[1];
      const dal = D.pro.dal.find((d) => d.k === v.dal) || D.pro.dal[0];
      const khG = [yuk.g[0] * w, yuk.g[1] * w];
      const proG = [dal.g[0] * w, dal.g[1] * w];

      const rows = [
        R('Karbonhidrat', ara(khG[0], khG[1]) + ' g/gün',
          ara(yuk.g[0], yuk.g[1], 1) + ' g/kg · ' + yuk.l.split(' · ')[0], true),
        R('Protein', ara(proG[0], proG[1]) + ' g/gün',
          ara(dal.g[0], dal.g[1], 1) + ' g/kg · ' + dal.l, true)
      ];

      if (isFinite(v.kcal) && v.kcal > 0) {
        const khPct = [khG[0] * 4 / v.kcal * 100, khG[1] * 4 / v.kcal * 100];
        const proPct = [proG[0] * 4 / v.kcal * 100, proG[1] * 4 / v.kcal * 100];
        const yagG = [v.kcal * D.yag.pct[0] / 100 / 9, v.kcal * D.yag.pct[1] / 100 / 9];
        rows.push(R('Yağ (%' + D.yag.pct[0] + '–' + D.yag.pct[1] + ')', ara(yagG[0], yagG[1]) + ' g/gün',
          fmt(yagG[0] / w, 1) + '–' + fmt(yagG[1] / w, 1) + ' g/kg'));
        rows.push(R('Karbonhidratın enerjiye katkısı', '%' + ara(khPct[0], khPct[1]),
          'Kaynak önerisi %' + D.kh.pct[0] + '–' + D.kh.pct[1] + ', çok yoğun antrenmanda %' + D.kh.pctYogun + '’e kadar'));
        rows.push(R('Proteinin enerjiye katkısı', '%' + ara(proPct[0], proPct[1]),
          'Kaynak önerisi %' + D.pro.pct[0] + '–' + D.pro.pct[1]));
      }

      /* Egzersiz sırası ve sonrası karbonhidrat */
      if (isFinite(v.sure) && v.sure > 0) {
        let sir;
        if (v.sure <= 45) sir = 'Gerekmez';
        else if (v.sure <= 75) sir = 'Az miktarda ya da ağızda çalkalama';
        else if (v.sure <= 150) sir = '30–60 g';
        else sir = '90 g’a kadar';
        rows.push(R('Egzersiz sırasında karbonhidrat', sir, fmt(v.sure, 0) + ' dakikalık antrenman için'));
        const sayi = Math.max(1, Math.round(v.sure / 17.5));
        rows.push(R('Egzersiz sırasında sıvı',
          fmt(D.sivi.sirasindaMl[0], 0) + '–' + fmt(D.sivi.sirasindaMl[1], 0) + ' mL',
          D.sivi.sirasindaDk[0] + '–' + D.sivi.sirasindaDk[1] + ' dakikada bir · toplam yaklaşık ' +
          fmt(sayi * D.sivi.sirasindaMl[0], 0) + '–' + fmt(sayi * D.sivi.sirasindaMl[1], 0) + ' mL'));
      }
      rows.push(R('Egzersizden ' + D.sivi.onceSaat + ' saat önce sıvı', '~' + D.sivi.onceMl + ' mL',
        'Tüketilen sıvının egzersiz öncesi vücuttan uzaklaştırılması için gereken süre'));
      rows.push(R('Toparlanma karbonhidratı', ara(1 * w, 1.5 * w) + ' g',
        'İlk 30 dk–2 saat içinde 1–1,5 g/kg; sonra 2 saatte bir, 4–6 saat boyunca'));
      rows.push(R('Toparlanma proteini', '20–25 g', 'Egzersizden sonra ilk 2 saat içinde, iyi kaliteli protein'));

      return { rows,
        html: '<details class="acc mt"><summary>Zamanlama · ' + esc(D.zaman.length) + ' aşama</summary><div class="body">' +
          D.zaman.map((z) => '<div class="sect" style="margin-top:6px">' + esc(z.t) + '</div><ul>' +
            z.r.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>').join('') + '</div></details>' +
          '<details class="acc"><summary>Mikro besin ögeleri</summary><div class="body"><table class="t"><tbody>' +
          D.mikro.map((m) => '<tr><td>' + esc(m.n) + '<div class="muted tiny">' + esc(m.s) + '</div></td>' +
            '<td class="n">' + esc(m.v) + '</td></tr>').join('') + '</tbody></table></div></details>' +
          '<details class="acc"><summary>Besin destekleri</summary><div class="body">' +
          '<table class="t"><tbody>' + D.destek.map((d) =>
            '<tr><td><b>' + esc(d[0]) + '</b><div class="muted tiny">' + esc(d[1]) + '</div></td></tr>').join('') +
          '</tbody></table><div class="note warn">' + esc(D.destekN) + '</div></div></details>' +
          '<div class="row gap mt"><a class="btn ghost sm" href="#/hesapla/terleme">' + icon('drop') +
          ' Terleme oranı</a><a class="btn ghost sm" href="#/hesapla/sporke">' + icon('flask') +
          ' Kullanılabilir enerji</a></div>',
        note: D.ogun + ' ' + D.kh.n,
        tone: 'info' };
    }
  });

  /* ---------------- Terleme oranı ve rehidrasyon ---------------- */
  DA.calcs.push({
    id: 'terleme', data: ['sporcu'], title: 'Terleme oranı ve rehidrasyon',
    desc: 'Egzersiz öncesi/sonrası tartıdan sıvı kaybı ve yerine koyma planı', ico: 'sweat',
    fields: [
      num_('w1', 'Egzersiz öncesi ağırlık (kg)'),
      num_('w2', 'Egzersiz sonrası ağırlık (kg)'),
      num_('dk', 'Egzersiz süresi (dakika)'),
      num_('icilen', 'Egzersiz sırasında içilen sıvı (mL)', '', true)
    ],
    req: ['w1', 'w2', 'dk'],
    run(v) {
      const D = S();
      if (!(v.dk > 0)) return { err: 'Egzersiz süresi sıfırdan büyük olmalı.' };
      const kayipKg = v.w1 - v.w2;
      const icilenL = (isFinite(v.icilen) ? v.icilen : 0) / 1000;
      /* Kaynaktaki hesap: (öncesi − sonrası) ÷ dakika × 60. İçilen sıvı varsa ter kaybına eklenir. */
      const terL = kayipKg + icilenL;
      const oran = terL / v.dk * 60;
      const kayipPct = kayipKg / v.w1 * 100;
      const yerine = kayipKg * D.sivi.sonrasiYuzde / 100 * 1000;
      const yarim = kayipKg / 0.5;

      const rows = [
        R('Terleme oranı', fmt(oran, 1) + ' L/saat',
          fmt(terL, 2) + ' L ÷ ' + fmt(v.dk, 0) + ' dk × 60' +
          (icilenL ? ' (içilen ' + fmt(v.icilen, 0) + ' mL eklendi)' : ''), true),
        R('Ağırlık kaybı', fmt(kayipKg, 2) + ' kg', '%' + fmt(kayipPct, 1) + ' vücut ağırlığı'),
        R('Yerine konacak sıvı', fmt(yerine, 0) + ' mL',
          'Kaybın %' + D.sivi.sonrasiYuzde + '’si · her yarım kg için ' +
          D.sivi.yarimKgMl[0] + '–' + D.sivi.yarimKgMl[1] + ' mL → ' +
          fmt(yarim * D.sivi.yarimKgMl[0], 0) + '–' + fmt(yarim * D.sivi.yarimKgMl[1], 0) + ' mL', true),
        R('Sodyum', fmt(D.sivi.sodyumGL[0] * yerine / 1000, 1) + '–' + fmt(D.sivi.sodyumGL[1] * yerine / 1000, 1) + ' g',
          ara(D.sivi.sodyumGL[0], D.sivi.sodyumGL[1], 1) + ' g/L'),
        R('Potasyum', fmt(D.sivi.potasyumGL * yerine / 1000, 1) + ' g', fmt(D.sivi.potasyumGL, 1) + ' g/L'),
        R('Sonraki antrenmanda saatlik sıvı', fmt(oran * 1000, 0) + ' mL/saat',
          'Terleme oranı kadar; ' + D.sivi.sirasindaDk[0] + '–' + D.sivi.sirasindaDk[1] +
          ' dakikada bir ' + D.sivi.sirasindaMl[0] + '–' + D.sivi.sirasindaMl[1] + ' mL olarak bölünür')
      ];
      if (v.dk > 60) rows.push(R('Spor içeceği', '%' + D.sivi.sporIcecegiKh[0] + '–' + D.sivi.sporIcecegiKh[1] + ' karbonhidrat',
        '1 saatten uzun egzersizlerde uygun olabilir'));

      let tone = 'ok', note = D.sivi.n;
      if (kayipPct >= D.sivi.dehidrasyonEsik) {
        tone = 'bad';
        note = 'Vücut ağırlığının %' + fmt(kayipPct, 1) + '’i kaybedilmiş — %' + D.sivi.dehidrasyonEsik +
          ' ve üzeri kayıp performansı olumsuz etkiler. Egzersiz sırasında sıvı alımı artırılmalıdır. ' + note;
      } else if (kayipPct < 0) {
        tone = 'warn';
        note = 'Ağırlık artmış: içilen sıvı ter kaybını aşmış olabilir. Aşırı sıvı alımı hiponatremi riski taşır. ' + note;
      }

      return { rows,
        badge: kayipPct >= D.sivi.dehidrasyonEsik ? ['Dehidrasyon', 'bad'] : ['Sıvı dengesi iyi', 'ok'],
        html: '<div class="card"><div class="sect" style="margin-top:0"><span>İdrar rengi ile izlem</span></div>' +
          '<table class="t"><tbody>' + D.sivi.idrar.map((x) =>
            '<tr><td>' + esc(x[0]) + '</td><td class="n"><span class="badge ' + x[2] + '">' + esc(x[1]) + '</span></td></tr>').join('') +
          '</tbody></table><p class="muted tiny">' + esc(D.sivi.idrarN) + '</p>' +
          '<div class="note">' + esc(D.sivi.ors) + '</div></div>',
        note, tone };
    }
  });

  /* ---------------- Kullanılabilir enerji (RED-S) ---------------- */
  DA.calcs.push({
    id: 'sporke', data: ['sporcu'], title: 'Kullanılabilir enerji (RED-S)',
    desc: 'Yağsız kütle başına kullanılabilir enerji ve düşük enerji riski', ico: 'battery',
    fields: [
      num_('alim', 'Günlük enerji alımı (kcal)'),
      num_('egzersiz', 'Egzersiz için harcanan enerji (kcal)'),
      num_('w', 'Vücut ağırlığı (kg)'),
      num_('yag', 'Vücut yağ oranı (%)'),
      num_('h', 'Boy (cm, BKİ kontrolü için)', '', true)
    ],
    req: ['alim', 'egzersiz', 'w', 'yag'],
    run(v) {
      const D = S();
      if (!(v.yag > 0 && v.yag < 70)) return { err: 'Vücut yağ oranı %0–70 arasında olmalı.' };
      const yagsiz = v.w * (1 - v.yag / 100);
      const net = v.alim - v.egzersiz;
      const ke = net / yagsiz;
      const b = D.ke.band.find((x) => ke <= x.max) || D.ke.band[D.ke.band.length - 1];

      const rows = [
        R('Yağsız vücut kütlesi', fmt(yagsiz, 1) + ' kg',
          fmt(v.w, 1) + ' kg × (1 − %' + fmt(v.yag, 1) + ') · yağ kütlesi ' + fmt(v.w - yagsiz, 1) + ' kg'),
        R('Net enerji alımı', fmt(net, 0) + ' kcal', fmt(v.alim, 0) + ' − ' + fmt(v.egzersiz, 0)),
        R('Kullanılabilir enerji', fmt(ke, 1) + ' kcal/kg', 'Yağsız vücut kütlesi başına', true),
        R('Değerlendirme', b.l)
      ];
      let note = b.ne + ' ' + D.ke.redsN, tone = b.tone;
      if (isFinite(v.h) && v.h > 0) {
        const bmi = v.w / Math.pow(v.h / 100, 2);
        rows.push(R('BKİ', fmt(bmi, 1) + ' kg/m²',
          bmi < D.ke.bkiEsik ? 'Eşiğin (' + fmt(D.ke.bkiEsik, 1) + ') altında' : 'Eşiğin üstünde'));
        if (bmi < D.ke.bkiEsik) { note = D.ke.bkiN + ' ' + note; tone = 'bad'; }
      }
      return { rows, badge: [b.l, b.tone], note, tone };
    }
  });
})();
