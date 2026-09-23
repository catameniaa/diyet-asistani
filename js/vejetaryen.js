/* TÜBER 2022 Bölüm 8.3 — vejetaryen beslenmesi referans ekranı.
   Diyet türü seçilince o türün risk taşıyan besin ögeleri öne çıkarılır. */
(function () {
  'use strict';
  const { esc, fmt, icon } = DA;
  const V = () => DA.data.vejetaryen;

  const S = () => {
    const u = DA.state().ui;
    if (!u.vej) u.vej = { tur: 'laktoovo' };
    return u.vej;
  };

  DA.actions.vejTur = (el) => { S().tur = el.dataset.k; DA.save(); DA.render(true); };

  function turHtml() {
    const s = S();
    return '<div class="chips">' + V().tur.map((t) =>
      '<button class="chip' + (s.tur === t.k ? ' on' : '') + '" data-act="vejTur" data-k="' + t.k + '">' +
      esc(t.l) + '</button>').join('') + '</div>';
  }

  function secilenHtml() {
    const t = V().tur.find((x) => x.k === S().tur) || V().tur[0];
    return '<div class="card"><div class="sect" style="margin-top:0"><span>' + esc(t.l) + '</span></div>' +
      '<p class="small">' + esc(t.d) + '</p>' +
      (t.risk.length
        ? '<div class="sect">Bu türde dikkat edilecekler</div><div class="chips wrap">' +
          t.risk.map((r) => '<span class="chip warn">' + esc(r) + '</span>').join('') + '</div>'
        : '<div class="note ok">Hayvansal kaynak kısıtlaması sınırlı olduğu için kaynak bu türde ayrıca ' +
          'riskli besin ögesi saymıyor; yine de genel dikkat listesi geçerlidir.</div>') +
      '</div>';
  }

  function makroHtml() {
    return '<table class="t"><tbody>' + V().makro.map((m) =>
      '<tr><td>' + esc(m.n) + '<div class="muted tiny">' + esc(m.s) + '</div></td>' +
      '<td class="n" style="white-space:nowrap">' + esc(m.v) + '</td></tr>').join('') + '</tbody></table>';
  }

  function porsiyonHtml() {
    const p = V().porsiyon;
    return '<div class="scrollx"><table class="t"><thead><tr><th>Besin grubu</th><th class="n">Porsiyon</th></tr></thead><tbody>' +
      p.r.map((r) => '<tr><td>' + esc(r.g) + '</td><td class="n"><b>' + esc(r.p) + '</b></td></tr>').join('') +
      '</tbody></table></div>' +
      p.r.filter((r) => r.o.length).map((r) =>
        '<details class="acc"><summary>' + esc(r.g) + ' <span class="muted tiny">' + esc(r.p) + ' porsiyon</span></summary>' +
        '<div class="body"><ul>' + r.o.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div></details>').join('');
  }

  function dikkatHtml() {
    const risk = (V().tur.find((x) => x.k === S().tur) || {}).risk || [];
    const oncelik = (n) => risk.some((r) => r.split(' ')[0] === n.split(' ')[0]);
    return V().dikkat.slice().sort((a, b) => (oncelik(b.n) ? 1 : 0) - (oncelik(a.n) ? 1 : 0)).map((d) =>
      '<details class="acc"' + (oncelik(d.n) ? ' open' : '') + '><summary>' + esc(d.n) +
      (oncelik(d.n) ? ' <span class="badge warn">seçili türde riskli</span>' : '') +
      '</summary><div class="body"><p style="margin-bottom:0">' + esc(d.s) + '</p></div></details>').join('');
  }

  DA.calcs.push({
    id: 'vejetaryen', data: ['vejetaryen'], title: 'Vejetaryen beslenmesi',
    desc: 'Diyet türleri, porsiyon miktarları ve dikkat edilecek besin ögeleri', ico: 'leaf',
    view() {
      const v = V();
      return {
        title: 'Vejetaryen beslenmesi', tab: 'referans', back: 'referans', ico: 'leaf',
        fav: { h: '#/hesapla/vejetaryen', t: 'Vejetaryen beslenmesi', ico: 'leaf' },
        html:
          '<div class="note ok">' + esc(v.fayda) + '</div>' +
          '<div class="sect"><span>Diyet türü</span></div>' +
          '<div class="card">' + turHtml() + '</div>' +
          secilenHtml() +
          '<div class="sect"><span>Makro besin ögeleri</span></div>' +
          '<div class="card">' + makroHtml() + '</div>' +
          '<div class="sect"><span>' + esc(v.porsiyon.t) + ' <span class="muted tiny">' + esc(v.porsiyon.ek) + '</span></span></div>' +
          '<div class="card">' + porsiyonHtml() + '</div>' +
          '<div class="sect"><span>Dikkat edilecek besin ögeleri</span></div>' +
          dikkatHtml() +
          '<div class="card"><div class="sect" style="margin-top:0"><span>Protein tamamlama</span></div>' +
          '<p class="small" style="margin-bottom:0">' + esc(v.tamamlama) + '</p></div>' +
          '<div class="sect"><span>Özel gruplar</span></div>' +
          v.ozel.map((o) => '<details class="acc"><summary>' + esc(o.g) + '</summary>' +
            '<div class="body"><p style="margin-bottom:0">' + esc(o.s) + '</p></div></details>').join('') +
          '<div class="note">Kaynak: ' + esc(v.src) + '.</div>'
      };
    }
  });
})();
