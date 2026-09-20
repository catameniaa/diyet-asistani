/* TÜBER 2022 Ek 3.1.1 — enerji düzeyine göre besin grubu porsiyonları.
   Hem kendi başına bir referans tablosu, hem de değişim listesi hesaplayıcısında
   "resmî öneri" karşılaştırması olarak kullanılır. */
(function () {
  'use strict';
  const { esc, fmt } = DA;
  const num = (v) => { const n = parseFloat(v); return isFinite(n) ? n : 0; };

  /* ---- kesirli porsiyon gösterimi: 2½, ⅛, ⅔ ---- */
  const FR = [[0.125, '⅛'], [0.25, '¼'], [0.3333, '⅓'], [0.5, '½'], [0.6667, '⅔'], [0.75, '¾']];
  function frac(n) {
    if (n == null) return '?';
    const w = Math.floor(n + 1e-6), r = n - w;
    let f = '';
    FR.forEach((p) => { if (Math.abs(r - p[0]) < 0.02) f = p[1]; });
    if (!f) return numTxt(n);
    return (w ? String(w) : '') + f;
  }
  const numTxt = (n) => (Math.abs(n % 1) < 1e-6 ? String(Math.round(n)) : fmt(n, 2));
  const cell = (v) => v == null ? '<span class="muted">?</span>'
    : Array.isArray(v) ? frac(v[0]) + '–' + frac(v[1]) : frac(v);

  /* Hedef enerjiye en yakın sütun */
  function nearest(kcal) {
    const L = DA.data.tuber.oruntu.kcal;
    let bi = 0;
    L.forEach((k, i) => { if (Math.abs(k - kcal) < Math.abs(L[bi] - kcal)) bi = i; });
    return bi;
  }
  DA.oruntuIndex = nearest;

  /* Bir enerji düzeyinin tüm satırları — dikey kart */
  function columnHtml(i) {
    const O = DA.data.tuber.oruntu;
    return '<div class="scrollx"><table class="t"><thead><tr><th>Besin grubu</th><th class="n">Porsiyon</th><th>Birim</th></tr></thead><tbody>' +
      O.r.map((r) => {
        if (!r.v) return '<tr class="gh"><td colspan="3"><b>' + esc(r.n) + '</b></td></tr>';
        return '<tr><td' + (r.lvl === 2 ? ' class="sub2"' : '') + '>' + (r.lvl === 2 ? '↳ ' : '') + esc(r.n) +
          (r.note ? '<br><span class="muted tiny">' + esc(r.note) + '</span>' : '') + '</td>' +
          '<td class="n"><b>' + cell(r.v[i]) + '</b></td><td class="muted tiny">' + esc(r.u) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* Tüm enerji düzeyleri — geniş tablo */
  function gridHtml(hi) {
    const O = DA.data.tuber.oruntu;
    return '<div class="scrollx"><table class="t xt"><thead><tr><th>Besin grubu</th>' +
      O.kcal.map((k, i) => '<th class="n' + (i === hi ? ' on' : '') + '">' + k + '</th>').join('') +
      '</tr></thead><tbody>' + O.r.map((r) => {
        if (!r.v) return '<tr class="gh"><td colspan="' + (O.kcal.length + 1) + '"><b>' + esc(r.n) + '</b></td></tr>';
        return '<tr><td>' + (r.lvl === 2 ? '↳ ' : '') + esc(r.n) + ' <span class="muted tiny">' + esc(r.u) + '</span></td>' +
          r.v.map((v, i) => '<td class="n' + (i === hi ? ' on' : '') + '">' + cell(v) + '</td>').join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  const notesHtml = () => '<p class="muted tiny">' + esc(DA.data.tuber.oruntu.bugs) + '</p>';

  DA.oruntu = {
    frac,
    /* Değişim listesi ekranı için açılır karşılaştırma paneli */
    panel(kcal, counts) {
      const O = DA.data.tuber.oruntu, i = nearest(kcal), lvl = O.kcal[i];
      const d = Math.abs(lvl - kcal);
      return (DA.hedefLink ? DA.hedefLink(kcal) : '') +
        '<details class="acc"><summary>TÜBER’e göre bu enerji düzeyinde porsiyonlar' +
        ' <span class="muted tiny">(' + lvl + ' kkal)</span></summary><div class="body">' +
        (d > 100 ? '<p class="muted tiny">Hedefin ' + fmt(kcal, 0) + ' kkal; tabloda en yakın örüntü <b>' + lvl + ' kkal</b>.</p>' : '') +
        columnHtml(i) +
        compareHtml(i, counts) +
        '<p class="muted tiny">Kaynak: ' + esc(O.src) + '</p>' + notesHtml() +
        '</div></details>';
    },
    gridHtml, columnHtml, nearest
  };

  /* Değişim sayılarıyla kaba karşılaştırma.
     TÜBER porsiyonu ile değişim birimi aynı büyüklükte değildir; dönüşüm yaklaşıktır. */
  const DEG = { sut: 1.2, et: 2.5, eyg: 2, sebze: 1.5, meyve: 1.25, tohum: 2.5 };
  function compareHtml(i, counts) {
    if (!counts) return '';
    const O = DA.data.tuber.oruntu, rows = [];
    O.r.forEach((r) => {
      if (!r.ex || !r.v) return;
      const v = r.v[i];
      if (v == null) return;
      const mid = Array.isArray(v) ? (v[0] + v[1]) / 2 : v;
      let hedef, birim;
      if (r.ex === 'yag') { hedef = mid / 5; birim = fmt(mid, 0) + ' g ≈ ' + fmt(hedef, 1) + ' değişim'; }
      else { hedef = mid * DEG[r.ex]; birim = frac(mid) + ' porsiyon ≈ ' + fmt(hedef, 1) + ' değişim'; }
      /* süt satırı hem tam hem yarım yağlı değişimleri kapsar */
      const cur = (counts[r.ex] || 0) + (r.ex === 'sut' ? (counts.sutyy || 0) : 0);
      const off = hedef ? Math.abs(cur - hedef) / hedef : 0;
      rows.push('<tr><td>' + esc(r.n) + '<br><span class="muted tiny">' + birim + '</span></td>' +
        '<td class="n"><b>' + fmt(cur, 1) + '</b><br><span class="muted tiny">planda</span></td>' +
        '<td class="n"><span class="badge ' + (off <= 0.25 ? 'ok' : off <= 0.5 ? 'warn' : 'bad') + '">' +
        (off <= 0.25 ? 'uyumlu' : cur > hedef ? 'yüksek' : 'düşük') + '</span></td></tr>');
    });
    if (!rows.length) return '';
    return '<div class="sect">Planınla karşılaştırma</div>' +
      '<table class="t"><tbody>' + rows.join('') + '</tbody></table>' +
      '<p class="muted tiny">Dönüşüm <b>yaklaşıktır</b>: TÜBER porsiyonu değişim biriminden büyüktür ' +
      '(örn. 1 tahıl porsiyonu = 50 g ekmek ≈ 2 ekmek değişimi; 1 süt porsiyonu = 240 mL ≈ 1,2 süt değişimi). ' +
      'Kesin eşleştirme için porsiyon tanımlarına bakın.</p>';
  }

  /* ---- kendi başına referans ekranı ---- */
  DA.calcs.push({
    id: 'oruntu', title: 'Beslenme örüntüleri (TÜBER)', desc: '1000–3200 kkal için besin grubu porsiyonları', ico: 'book',
    view() {
      const ui = DA.state().ui;
      const kcal = num(ui.oruntuK) || (DA.state().targets && DA.state().targets.kcal) || 1800;
      const i = nearest(kcal);
      /* seçili enerji düzeyi ekran dışında kalmasın */
      setTimeout(() => { const c = DA.$('.chips .chip.on'); if (c) c.scrollIntoView({ block: 'nearest', inline: 'center' }); }, 0);
      return {
        title: 'Beslenme örüntüleri', tab: 'hesapla', back: 'hesapla', ico: 'book',
        fav: { h: '#/hesapla/oruntu', t: 'Beslenme örüntüleri', ico: 'book' },
        html:
          '<div class="card"><div class="sect" style="margin-top:0">Enerji düzeyi</div>' +
          '<div class="chips">' +
          DA.data.tuber.oruntu.kcal.map((k, j) =>
            '<button class="chip' + (j === i ? ' on' : '') + '" data-act="oruntuPick" data-k="' + k + '">' + k + '</button>').join('') +
          '</div></div>' +
          '<div class="card">' + columnHtml(i) + '</div>' +
          '<details class="acc"><summary>Tüm enerji düzeyleri (1000–3200 kkal)</summary><div class="body">' +
          gridHtml(i) + '</div></details>' +
          '<a class="btn ghost block mt" href="#/hesapla/porsiyon">' + DA.icon('table') + ' Yaş ve cinsiyete göre porsiyon önerileri</a>' +
          '<a class="btn ghost block mt-s" href="#/hesapla/hedef">' + DA.icon('book') + ' Bu enerji düzeyinin besin ögesi hedefleri</a>' +
          '<div class="note">Kaynak: ' + esc(DA.data.tuber.oruntu.src) + '. ' +
          'Hangi enerji düzeyinin hangi yaş ve aktivite grubuna denk geldiği için Ek 1.1.1–1.1.4’e bakın.</div>' +
          '<div class="card">' + notesHtml() + '</div>'
      };
    }
  });
  DA.actions.oruntuPick = (el) => { DA.state().ui.oruntuK = +el.dataset.k; DA.save(); DA.render(); };

})();
