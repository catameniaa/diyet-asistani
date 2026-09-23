/* TÜBER 2022 Ek 2.1 — standart porsiyon ölçüleri ve yaş/cinsiyete göre günlük öneriler.
   İki sekme: "Yaşa göre öneri" (kaç porsiyon) ve "Ölçüler" (1 porsiyon ne kadar). */
(function () {
  'use strict';
  const { esc, icon, trLower } = DA;
  const P = () => DA.data.porsiyon;

  /* "2½–3" → [2.5, 3] · "¾" → [0.75, 0.75] · sayısal olmayan → null */
  const FRAC = { '½': .5, '¼': .25, '¾': .75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': .125, '⅕': .2 };
  function one(s) {
    const m = String(s).trim().match(/^(\d+)?\s*([½¼¾⅓⅔⅛⅕])?$/);
    if (!m || (!m[1] && !m[2])) return null;
    return (m[1] ? +m[1] : 0) + (m[2] ? FRAC[m[2]] : 0);
  }
  function parse(s) {
    const p = String(s).split(/\s*[–-]\s*/).map(one).filter((x) => x != null);
    return p.length ? [Math.min.apply(null, p), Math.max.apply(null, p)] : null;
  }
  DA.porsiyonParse = parse;

  /* Yaş (yıl) → yas[] dizini */
  function bandOf(age) {
    const B = [[2, 3], [4, 6], [7, 10], [11, 14], [15, 18], [18, 49], [50, 70], [71, 200]];
    for (let i = 0; i < B.length; i++) if (age >= B[i][0] && age <= B[i][1]) return i;
    return age < 2 ? -1 : B.length - 1;
  }
  DA.porsiyonBand = bandOf;

  /* ---- yaşa göre öneri ---- */
  function gunlukHtml(bi, sex) {
    const p = P(), si = sex === 'K' ? 1 : 0;
    const rows = p.gunluk.map((g) =>
      '<tr><td>' + esc(g.g) + '<br><span class="muted tiny">' + esc(g.ek) + '</span></td>' +
      '<td class="n"><b>' + esc(g.v[bi][si]) + '</b><br><span class="muted tiny">' + esc(g.u) + '</span></td></tr>').join('');

    const e = p.et, er = e[sex === 'K' ? 'K' : 'E'][bi];
    const etRows = e.c.map((c, i) =>
      '<tr><td>' + esc(c[0]) + '<br><span class="muted tiny">' + esc(c[1]) + '</span></td>' +
      '<td class="n"><b>' + esc(er[i]) + '</b></td></tr>').join('');

    return '<div class="card"><div class="sect" style="margin-top:0">Günlük toplam porsiyon</div>' +
      '<table class="t"><tbody>' + rows + '</tbody></table></div>' +
      '<div class="card"><div class="sect" style="margin-top:0"><span>Et, tavuk, balık, yumurta, kuru baklagil, yağlı tohum ' +
      '<span class="muted tiny">' + esc(e.ek) + '</span></span></div>' +
      '<table class="t"><tbody>' + etRows + '</tbody></table>' +
      '<details class="acc mt"><summary>Notlar</summary><div class="body"><ul>' +
      e.n.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div></details></div>';
  }

  /* ---- porsiyon ölçüleri ---- */
  function olcuHtml(filt) {
    const s = trLower(filt || '').trim();
    let hit = 0;
    const html = P().olcu.map((g, gi) => {
      const fs = g.f.filter((f) => !s || trLower(f[0] + ' ' + f[1]).includes(s));
      if (!fs.length) return '';
      hit += fs.length;
      return '<div class="card"><div class="sect" style="margin-top:0"><span>' + esc(g.g) +
        ' <span class="muted tiny">' + esc(g.ek) + ' · 1 porsiyon ' + esc(g.kcal) + '</span></span></div>' +
        '<table class="t"><tbody>' + fs.map((f, fi) =>
          '<tr id="po-' + gi + '-' + g.f.indexOf(f) + '"><td style="width:40%"><b>' + esc(f[0]) + '</b></td><td>' + esc(f[1]) + '</td></tr>').join('') +
        '</tbody></table>' +
        (g.n && !s ? '<p class="muted tiny" style="margin-bottom:0">' + esc(g.n) + '</p>' : '') + '</div>';
    }).join('');
    if (!hit) return '<div class="card"><div class="empty">' + icon('search') + '<div>“' + esc(filt) + '” için ölçü bulunamadı.</div></div></div>';
    return html;
  }

  DA.calcs.push({
    id: 'porsiyon', data: ['porsiyon'], title: 'Porsiyon ölçüleri (TÜBER)', desc: '1 porsiyon ne kadar · yaşa göre kaç porsiyon', ico: 'bowl',
    view(parts, q) {
      const ui = DA.state().ui;
      if (q && q.get('t')) ui.poTab = q.get('t');
      if (q && q.get('ara') != null) { ui.poQ = q.get('ara'); ui.poTab = 'olcu'; }
      const tab = ui.poTab === 'olcu' ? 'olcu' : 'yas';
      const prof = DA.state().profile || {};
      const sex = ui.poSex || prof.sex || 'E';
      let bi = ui.poBand;
      if (bi == null) { const b = bandOf(prof.age || 30); bi = b < 0 ? 5 : b; }
      const p = P();
      /* seçili yaş grubu ekran dışında kalmasın */
      if (tab === 'yas') setTimeout(() => { const c = DA.$('.chips .chip.on'); if (c) c.scrollIntoView({ block: 'nearest', inline: 'center' }); }, 0);

      return {
        title: 'Porsiyon ölçüleri', tab: 'hesapla', back: 'hesapla', ico: 'bowl',
        fav: { h: '#/hesapla/porsiyon', t: 'Porsiyon ölçüleri', ico: 'bowl' },
        html:
          '<div class="seg mb"><button class="' + (tab === 'yas' ? 'on' : '') + '" data-act="poTab" data-t="yas">Yaşa göre öneri</button>' +
          '<button class="' + (tab === 'olcu' ? 'on' : '') + '" data-act="poTab" data-t="olcu">Ölçüler</button></div>' +

          (tab === 'yas'
            ? '<div class="card"><div class="sect" style="margin-top:0">Yaş grubu</div>' +
              '<div class="chips">' + p.yas.map((y, i) =>
                '<button class="chip' + (i === bi ? ' on' : '') + '" data-act="poBand" data-i="' + i + '">' + esc(y === '70+' ? '70+' : y + ' yaş') + '</button>').join('') + '</div>' +
              '<div class="seg"><button class="' + (sex === 'E' ? 'on' : '') + '" data-act="poSex" data-s="E">Erkek</button>' +
              '<button class="' + (sex === 'K' ? 'on' : '') + '" data-act="poSex" data-s="K">Kadın</button></div></div>' +
              gunlukHtml(bi, sex) +
              '<a class="btn ghost block" href="#/hesapla/oruntu">' + icon('book') + ' Enerji düzeyine göre örüntüler (Ek 3.1.1)</a>' +
              '<div class="note">' + esc(p.n) + '</div>'
            : '<label class="fld mb"><span>Besin ara</span><input type="search" id="poQ" value="' + esc(ui.poQ || '') +
              '" placeholder="örn. ceviz, bulgur, karpuz" data-live="poQ"></label>' +
              '<div id="poList">' + olcuHtml(ui.poQ) + '</div>') +

          '<a class="btn ghost block" href="#/hesapla/porsiyonbesin">' + icon('apple') + ' Bu porsiyonların besin değerleri (Ek 2.3.1)</a>' +
          '<div class="note">Kaynak: ' + esc(p.src) + '</div>'
      };
    }
  });

  DA.actions.poTab = (el) => { DA.state().ui.poTab = el.dataset.t; DA.save(); DA.render(); };
  DA.actions.poBand = (el) => { DA.state().ui.poBand = +el.dataset.i; DA.save(); DA.render(); };
  DA.actions.poSex = (el) => { DA.state().ui.poSex = el.dataset.s; DA.save(); DA.render(); };
  DA.live.poQ = (el) => {
    DA.state().ui.poQ = el.value; DA.save();
    const o = DA.$('#poList'); if (o) o.innerHTML = olcuHtml(el.value);
  };
})();
