/* TÜBER 2022 Ek 3.4.1/3.4.2 — yaş, cinsiyet ve aktiviteye göre enerji ve besin ögesi hedefleri,
   Ek 3.1.2 — seçilen enerji düzeyinin elzem enerji ve isteğe bağlı payı. */
(function () {
  'use strict';
  const { esc, fmt, icon } = DA;
  const H = () => DA.data.hedef;
  const OE = () => DA.data.oruntuEnerji;

  const cell = (v) => v == null ? '<span class="muted">—</span>'
    : Array.isArray(v) ? fmt(v[0], 2) + '–' + fmt(v[1], 2)
    : typeof v === 'number' ? fmt(v, 2) : esc(String(v));

  /* Yaş (yıl) → sütun dizini. 2 yaş altı ve tablo dışı için null. */
  function bandOf(sex, age) {
    const c = H()[sex].c;
    for (let i = 0; i < c.length; i++) {
      const y = c[i].y;
      if (y === '70+') { if (age > 70) return i; continue; }
      if (y.indexOf('-') > 0) { const p = y.split('-'); if (age >= +p[0] && age <= +p[1]) return i; }
      else if (Math.floor(age) === +y) return i;
    }
    return null;
  }
  DA.hedefBand = bandOf;

  const S = () => DA.state().ui;
  function sel() {
    const ui = S(), p = DA.state().profile || {};
    const sex = ui.hdSex || (p.sex === 'K' ? 'K' : 'E');
    const T = H()[sex];
    let i = ui.hdCol;
    if (i == null || i >= T.c.length) { i = bandOf(sex, p.age || 30); if (i == null) i = T.c.length - 4; }
    const pi = Math.min(ui.hdPal || 0, T.c[i].pal.length - 1);
    return { sex, T, i, pi };
  }

  function hedefHtml(sex, T, i, pi) {
    const col = T.c[i], kcal = col.kcal[pi];
    /* enerjiye bağlı satırları gram karşılığıyla göster */
    const gram = (r) => {
      if (r.u !== '% kkal' || !Array.isArray(r.v[i])) return '';
      const kc = r.n === 'Yağ' ? 9 : 4;
      return ' <span class="muted tiny">' + fmt(kcal * r.v[i][0] / 100 / kc, 0) + '–' +
        fmt(kcal * r.v[i][1] / 100 / kc, 0) + ' g</span>';
    };
    return '<div class="card">' +
      '<div class="res hl"><span class="l">Enerji hedefi</span><span class="v">' + fmt(kcal, 0) +
      ' kcal<span class="sub">' + esc(col.y) + ' yaş · ' + esc(H().pal[col.pal[pi]]) + '</span></span></div>' +
      (col.pal.length > 1 ? '<div class="seg mt">' + col.pal.map((a, j) =>
        '<button class="' + (j === pi ? 'on' : '') + '" data-act="hdPal" data-i="' + j + '">' +
        esc(H().pal[a]) + '<br><span class="muted tiny">' + col.kcal[j] + ' kcal</span></button>').join('') + '</div>' : '') +
      '</div>' +
      '<div class="scrollx"><table class="t"><thead><tr><th>Besin ögesi</th><th class="n">Hedef</th><th>Birim</th></tr></thead><tbody>' +
      T.r.map((r) => '<tr><td>' + esc(r.n) + '</td><td class="n"><b>' + cell(r.v[i]) + '</b>' + gram(r) +
        '</td><td class="muted tiny">' + esc(r.u) + '</td></tr>').join('') +
      '<tr><td>Doymuş yağ asitleri</td><td class="n"><b>' + esc(H().doymus) + '</b></td><td class="muted tiny">% kkal</td></tr>' +
      '</tbody></table></div>' +
      '<p class="muted tiny">“% kkal” satırlarındaki gram karşılıkları ' + fmt(kcal, 0) + ' kkal üzerinden hesaplandı. ' +
      '<b>Protein g/gün</b> karşılanması gereken en düşük miktardır (PRI); <b>protein % kkal</b> ise kabul edilebilir dağılım aralığıdır.</p>';
  }

  /* ---- Ek 3.4.3: örüntü bu profilin hedeflerini ne kadar karşılıyor? ---- */
  const IC = () => DA.data.icerik;
  const KA = () => DA.data.karsilama;

  function karsilamaHtml(sex, T, i, pi) {
    const K = KA(), ic = IC();
    if (!K) return '';
    const col = T.c[i], pal = col.pal[pi], kcal = col.kcal[pi];
    const row = K.c.find((c) => c[0] === sex && c[1] === col.y && c[2] === pal);
    if (!row) return '<details class="acc"><summary>Örüntü hedefleri karşılıyor mu?</summary><div class="body">' +
      '<p class="muted small">Bu yaş-cinsiyet-aktivite bileşimi Ek 3.4.3’te yer almıyor. ' +
      'Tabloda 10 yaş üstü için hem az hem orta aktif, diğer yaş gruplarında yalnızca az aktif sütunu vardır.</p></div></details>';

    const v = row[4], ham = K.ham;
    const pct = [];
    K.r.forEach((n, j) => { if (j === 0 || ham.indexOf(j) >= 0) return; pct.push({ n, x: v[j] }); });
    const num = (x) => typeof x === 'number' ? x : parseFloat(String(x).split('-')[0]);
    const eksik = pct.filter((p) => p.n.indexOf('Sodyum') < 0 && num(p.x) < 95);
    const tone = (p) => p.n.indexOf('Sodyum') >= 0 ? (num(p.x) <= 100 ? 'ok' : 'bad')
      : num(p.x) >= 95 ? 'ok' : num(p.x) >= 80 ? 'warn' : 'bad';

    return '<details class="acc"><summary>Örüntü bu hedefleri karşılıyor mu?' +
      ' <span class="muted tiny">Ek 3.4.3 · ' + row[3] + ' kkal</span></summary><div class="body">' +
      (eksik.length ? '<div class="note warn">Hedefin altında kalan: <b>' +
        eksik.map((p) => esc(p.n) + ' %' + p.x).join('</b>, <b>') + '</b></div>'
        : '<div class="note ok">Tüm besin ögeleri hedefin %95’i ve üzerinde.</div>') +
      '<table class="t"><tbody>' + pct.map((p) =>
        '<tr><td>' + esc(p.n) + (p.n.indexOf('Sodyum') >= 0 ? ' <span class="muted tiny">üst sınırın yüzdesi</span>' : '') +
        '</td><td class="n"><span class="badge ' + tone(p) + '">%' + esc(p.x) + '</span></td></tr>').join('') +
      '</tbody></table>' +
      '<div class="sect">Örüntünün kendi değerleri</div><table class="t"><tbody>' +
      ham.map((j) => '<tr><td>' + esc(K.r[j]) + '</td><td class="n"><b>' + esc(v[j]) + '</b></td></tr>').join('') +
      '</tbody></table>' +
      '<ul class="tight muted tiny">' + K.n.map((x) => '<li>' + x + '</li>').join('') + '</ul>' +
      '<p class="muted tiny" style="margin-bottom:0">Kaynak: ' + esc(K.src) + '</p></div></details>';
  }

  /* Ek 3.2.1 — örüntünün ham besin ögesi içeriği */
  function icerikHtml(kcal) {
    const ic = IC();
    if (!ic) return '';
    let i = 0;
    ic.kcal.forEach((k, j) => { if (Math.abs(k - kcal) < Math.abs(ic.kcal[i] - kcal)) i = j; });
    const cv = (v) => v == null ? '—' : Array.isArray(v) ? fmt(v[0], 2) + ' / ' + fmt(v[1], 2) : fmt(v, 2);
    return '<details class="acc"><summary>Örüntünün besin ögesi içeriği' +
      ' <span class="muted tiny">Ek 3.2.1 · ' + ic.kcal[i] + ' kkal</span></summary><div class="body">' +
      '<div class="scrollx"><table class="t"><thead><tr><th>Besin ögesi</th><th class="n">İçerik</th><th>Birim</th></tr></thead><tbody>' +
      ic.r.map((r) => '<tr><td>' + esc(r.n) + '</td><td class="n"><b>' + cv(r.v[i]) + '</b>' +
        (r.p ? '<br><span class="muted tiny">(' + cv(r.p[i]) + ')</span>' : '') +
        '</td><td class="muted tiny">' + esc(r.u) + '</td></tr>').join('') +
      '</tbody></table></div><ul class="tight muted tiny">' + ic.n.map((x) => '<li>' + x + '</li>').join('') + '</ul>' +
      '<p class="muted tiny" style="margin-bottom:0">Kaynak: ' + esc(ic.src) + '</p></div></details>';
  }

  /* Ek 3.1.2 — en yakın enerji düzeyi için elzem enerji ve isteğe bağlı pay */
  function enerjiHtml(kcal) {
    const O = OE(), L = O.kcal;
    let i = 0;
    L.forEach((k, j) => { if (Math.abs(k - kcal) < Math.abs(L[i] - kcal)) i = j; });
    return '<details class="acc"><summary>Elzem enerji ve isteğe bağlı pay' +
      ' <span class="muted tiny">Ek 3.1.2 · ' + L[i] + ' kkal</span></summary><div class="body">' +
      O.g.map((g) => '<div class="sect">' + esc(g.t) + '</div><table class="t"><tbody>' +
        g.r.map((r) => '<tr><td>' + esc(r.n) + '</td><td class="n"><b>' + cell(r.v[i]) + '</b> ' + esc(r.u) +
          (r.p && r.p[i] != null ? '<br><span class="muted tiny">(' + cell(r.p[i]) + ')</span>' : '') +
          '</td></tr>').join('') + '</tbody></table>').join('') +
      '<p class="muted tiny">' + esc(O.pn) + '</p>' +
      '<ul class="tight muted tiny">' + O.n.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
      '<p class="muted tiny" style="margin-bottom:0">Kaynak: ' + esc(O.src) + '</p></div></details>';
  }

  /* Tüm yaş gruplarını yan yana gösteren geniş tablo */
  function gridHtml(sex, hi) {
    const T = H()[sex];
    return '<div class="scrollx"><table class="t xt"><thead><tr><th>Besin ögesi</th>' +
      T.c.map((c, i) => '<th class="n' + (i === hi ? ' on' : '') + '">' + esc(c.y) + '<br>' +
        '<span class="tiny">' + c.kcal.join('/') + '</span></th>').join('') + '</tr></thead><tbody>' +
      T.r.map((r) => '<tr><td>' + esc(r.n) + ' <span class="muted tiny">' + esc(r.u) + '</span></td>' +
        r.v.map((v, i) => '<td class="n' + (i === hi ? ' on' : '') + '">' + cell(v) + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div>';
  }

  DA.calcs.push({
    id: 'hedef', data: ['hedef','tuber'], title: 'Yaşa göre besin ögesi hedefleri', desc: 'TÜBER Ek 3.4 — enerji, makro ve mikro hedefleri', ico: 'book',
    view() {
      const { sex, T, i, pi } = sel();
      setTimeout(() => { const c = DA.$('.chips .chip.on'); if (c) c.scrollIntoView({ block: 'nearest', inline: 'center' }); }, 0);
      return {
        title: 'Besin ögesi hedefleri', tab: 'hesapla', back: 'hesapla', ico: 'book',
        fav: { h: '#/hesapla/hedef', t: 'Besin ögesi hedefleri', ico: 'book' },
        html:
          '<div class="card"><div class="seg mb">' +
          ['E', 'K'].map((s) => '<button class="' + (s === sex ? 'on' : '') + '" data-act="hdSex" data-s="' + s + '">' +
            (s === 'E' ? 'Erkek' : 'Kadın') + '</button>').join('') + '</div>' +
          '<div class="sect" style="margin-top:0">Yaş grubu</div><div class="chips">' +
          T.c.map((c, j) => '<button class="chip' + (j === i ? ' on' : '') + '" data-act="hdCol" data-i="' + j + '">' +
            esc(c.y) + '</button>').join('') + '</div></div>' +
          hedefHtml(sex, T, i, pi) +
          karsilamaHtml(sex, T, i, pi) +
          icerikHtml(T.c[i].kcal[pi]) +
          enerjiHtml(T.c[i].kcal[pi]) +
          '<details class="acc"><summary>Tüm yaş grupları</summary><div class="body">' + gridHtml(sex, i) + '</div></details>' +
          '<a class="btn ghost block" href="#/hesapla/oruntu">' + icon('book') + ' Bu enerji düzeyinin porsiyon örüntüsü</a>' +
          '<div class="note">Kaynak: ' + esc(H().src) + '. AA = az aktif · OA = orta aktif · A = aktif. ' + esc(H().n) + '</div>' +
          '<div class="card"><p class="muted tiny" style="margin-bottom:0">' + esc(H().bug) + '</p></div>'
      };
    }
  });

  /* Değişim listesi panelinde: bu enerji düzeyine hangi yaş-cinsiyet grupları denk geliyor? */
  DA.hedefLink = (kcal) => {
    if (!DA.data.hedef) return '';
    const hit = [];
    ['E', 'K'].forEach((s) => H()[s].c.forEach((c) => c.kcal.forEach((k, j) => {
      if (Math.abs(k - kcal) <= 100) hit.push((s === 'E' ? 'Erkek' : 'Kadın') + ' ' + c.y + ' yaş · ' + H().pal[c.pal[j]] + ' (' + k + ')');
    })));
    if (!hit.length) return '';
    return '<details class="acc"><summary>Bu enerji düzeyi kime denk geliyor?' +
      ' <span class="muted tiny">Ek 3.4</span></summary><div class="body">' +
      '<ul class="tight">' + hit.slice(0, 18).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
      (hit.length > 18 ? '<p class="muted tiny">ve ' + (hit.length - 18) + ' grup daha.</p>' : '') +
      '<a class="btn ghost block" href="#/hesapla/hedef">' + icon('book') + ' Besin ögesi hedeflerini aç</a></div></details>';
  };

  DA.actions.hdSex = (el) => { const ui = S(); ui.hdSex = el.dataset.s; ui.hdCol = null; ui.hdPal = 0; DA.save(); DA.render(); };
  DA.actions.hdCol = (el) => { const ui = S(); ui.hdCol = +el.dataset.i; ui.hdPal = 0; DA.save(); DA.render(); };
  DA.actions.hdPal = (el) => { S().hdPal = +el.dataset.i; DA.save(); DA.render(); };
})();
