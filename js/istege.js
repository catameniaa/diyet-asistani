/* TÜBER 2022 Ek 2.1.11 / 2.1.12 — isteğe bağlı besinlerin 75 kkal katları.
   Ek 3.1.1’deki "isteğe bağlı pay" ile birleştirilerek günlük bütçe hâline getirilir. */
(function () {
  'use strict';
  const { esc, fmt, icon, trLower } = DA;
  const I = () => DA.data.istege;
  const T = () => DA.data.tohum;

  /* ½, ¾, 1⅓ gibi göster */
  const kat = (v) => Array.isArray(v) ? DA.oruntu.frac(v[0]) + '–' + DA.oruntu.frac(v[1]) : DA.oruntu.frac(v);
  const mid = (v) => Array.isArray(v) ? (v[0] + v[1]) / 2 : v;

  const S = () => (DA.state().ui.ib = DA.state().ui.ib || { sepet: [], sut: 'yy' });

  /* Ek 3.1.1’deki isteğe bağlı pay satırları */
  function pay(kcal) {
    const O = DA.data.tuber && DA.data.tuber.oruntu;
    if (!O) return null;
    const i = DA.oruntu.nearest(kcal);
    const yy = O.r.find((r) => /yarım yağlı/.test(r.n)), ty = O.r.find((r) => /tam yağlı/.test(r.n));
    if (!yy || !ty) return null;
    return { lvl: O.kcal[i], yy: yy.v[i], ty: ty.v[i] };
  }

  function budget() {
    const s = S(), p = pay(s.kcal || (DA.state().targets && DA.state().targets.kcal) || 1800);
    if (!p) return null;
    const v = s.sut === 'ty' ? p.ty : p.yy;
    return { lvl: p.lvl, v, lo: Array.isArray(v) ? v[0] : v, hi: Array.isArray(v) ? v[1] : v };
  }

  const sepetTop = () => S().sepet.reduce((a, x) => a + mid(x.k), 0);

  function bugdetHtml() {
    const b = budget();
    if (!b) return '';
    const t = sepetTop(), B = I().birim;
    const pct = b.hi ? Math.min(100, t / b.hi * 100) : 0;
    const durum = t === 0 ? '' : t <= b.lo ? 'ok' : t <= b.hi ? 'warn' : 'bad';
    return '<div class="card">' +
      '<div class="res hl"><span class="l">Günlük isteğe bağlı pay</span><span class="v">' +
      kat(b.v) + ' kat<span class="sub">' + fmt(b.lo * B, 0) + (b.hi !== b.lo ? '–' + fmt(b.hi * B, 0) : '') +
      ' kkal · ' + b.lvl + ' kkal örüntüsü</span></span></div>' +
      '<div class="seg mt">' +
      [['yy', 'Yarım yağlı süt'], ['ty', 'Tam yağlı süt']].map((x) =>
        '<button class="' + (S().sut === x[0] ? 'on' : '') + '" data-act="ibSut" data-s="' + x[0] + '">' + x[1] + '</button>').join('') +
      '</div>' +
      (t ? '<div class="sect">Seçilenler</div>' +
        '<div class="res"><span class="l">Toplam</span><span class="v">' + fmt(t, 1) + ' kat' +
        '<span class="sub">' + fmt(t * B, 0) + ' kkal</span></span></div>' +
        '<div class="bar' + (durum === 'bad' ? ' over' : '') + '"><i style="width:' + Math.round(pct) + '%"></i></div>' +
        '<p class="' + (durum === 'ok' ? 'muted' : '') + ' tiny">' +
        (durum === 'ok' ? 'Pay içinde.' : durum === 'warn' ? 'Payın üst sınırına yakın.' : 'Payı aşıyor.') + '</p>' +
        '<div class="list">' + S().sepet.map((x, i) =>
          '<div class="li"><span class="grow"><div class="t">' + esc(x.n) + '</div><div class="s">' + esc(x.m) + '</div></span>' +
          '<span class="end">' + kat(x.k) + ' kat</span>' +
          '<button class="btn ghost sm" data-act="ibDel" data-i="' + i + '" aria-label="Kaldır">✕</button></div>').join('') + '</div>' +
        '<button class="btn ghost block mt-s" data-act="ibReset">Listeyi temizle</button>'
        : '<p class="muted tiny" style="margin-bottom:0">Aşağıdan bir besine dokunarak payı somutlaştır.</p>') +
      '</div>';
  }

  function listHtml(q) {
    const s = trLower(q || '').trim();
    let hit = 0;
    const html = I().g.map((g, gi) => {
      const fs = g.f.filter((f) => !s || trLower(f.n).includes(s) || f.m.some((m) => trLower(m[0]).includes(s)));
      if (!fs.length) return '';
      hit += fs.length;
      return '<div class="sect">' + esc(g.t) + '</div><div class="list">' +
        fs.map((f) => f.m.map((m) =>
          '<button class="li" data-act="ibAdd" data-g="' + gi + '" data-n="' + esc(f.n) + '" data-m="' + esc(m[0]) +
          '" data-k="' + esc(JSON.stringify(m[1])) + '">' +
          '<span class="grow"><div class="t">' + esc(f.n) + '</div><div class="s">' + esc(m[0]) + '</div></span>' +
          '<span class="end"><b>' + kat(m[1]) + '</b> kat<br>' + fmt(mid(m[1]) * I().birim, 0) + ' kkal</span></button>').join('')).join('') +
        '</div>' + (g.n && !s ? '<p class="muted tiny">' + esc(g.n) + '</p>' : '');
    }).join('');
    if (!hit) return '<div class="card"><div class="empty">' + icon('search') + '<div>“' + esc(q) + '” bulunamadı.</div></div></div>';
    return html;
  }

  /* Ek 2.1.12 */
  function tohumHtml() {
    const t = T(), all = t.net.concat(t.kabuklu);
    return '<details class="acc"><summary>Sağlıklı alternatif: yağlı tohum ve sert kabuklu yemişler' +
      ' <span class="muted tiny">Ek 2.1.12</span></summary><div class="body">' +
      '<div class="scrollx"><table class="t xt"><thead><tr><th>Besin</th>' +
      t.r.map((r) => '<th class="n">' + esc(r.p) + '</th>').join('') + '</tr></thead><tbody>' +
      all.map((k) => '<tr' + (t.kabuklu.indexOf(k) >= 0 ? ' class="sub"' : '') + '><td>' + esc(k) +
        (t.kabuklu.indexOf(k) >= 0 ? '<br><span class="muted tiny">kabuklu ölçü</span>' : '') + '</td>' +
        t.r.map((r) => { const v = r.v[k] || [];
          return '<td class="n"><b>' + esc(v[0] || '—') + '</b>' +
            (v.length > 1 ? '<br><span class="muted tiny">' + v.slice(1).map(esc).join('<br>') + '</span>' : '') + '</td>'; }).join('') +
        '</tr>').join('') +
      '</tbody></table></div><p class="muted tiny" style="margin-bottom:0">' + esc(t.n) +
      ' Kaynak: ' + esc(t.src) + '</p></div></details>';
  }

  DA.calcs.push({
    id: 'istege', title: 'İsteğe bağlı besinler', desc: 'Tatlı, hamur işi, cips — 75 kkal katları ve günlük pay', ico: 'apple',
    view() {
      const s = S(), O = DA.data.tuber.oruntu;
      const kcal = s.kcal || (DA.state().targets && DA.state().targets.kcal) || 1800;
      const ci = DA.oruntu.nearest(kcal);
      setTimeout(() => { const c = DA.$('.chips .chip.on'); if (c) c.scrollIntoView({ block: 'nearest', inline: 'center' }); }, 0);
      return {
        title: 'İsteğe bağlı besinler', tab: 'hesapla', back: 'hesapla', ico: 'apple',
        fav: { h: '#/hesapla/istege', t: 'İsteğe bağlı besinler', ico: 'apple' },
        html:
          '<div class="card"><div class="sect" style="margin-top:0">Enerji düzeyi</div><div class="chips">' +
          O.kcal.map((k, j) => '<button class="chip' + (j === ci ? ' on' : '') + '" data-act="ibKcal" data-k="' + k + '">' +
            k + '</button>').join('') + '</div></div>' +
          '<div id="ibOut">' + bugdetHtml() + '</div>' +
          tohumHtml() +
          '<label class="fld mb"><span>Besin ara</span><input type="search" value="' + esc(s.q || '') +
          '" placeholder="örn. baklava, cips, latte" data-live="ibQ"></label>' +
          '<div id="ibList">' + listHtml(s.q) + '</div>' +
          '<div class="card"><ul class="tight muted tiny" style="margin-bottom:0">' +
          I().n.map((x) => '<li>' + x + '</li>').join('') + '</ul></div>' +
          '<div class="note">1 standart miktar = <b>75 kkal</b>. Kaynak: ' + esc(I().src) + '. ' +
          'Günlük pay Ek 3.1.1’den alınır ve seçilen süt grubu alternatifine göre değişir.</div>'
      };
    }
  });

  const redraw = () => { const o = DA.$('#ibOut'); if (o) o.innerHTML = bugdetHtml(); };

  DA.actions.ibKcal = (el) => { S().kcal = +el.dataset.k; DA.save(); DA.render(); };
  DA.actions.ibSut = (el) => { S().sut = el.dataset.s; DA.save(); redraw(); };
  DA.actions.ibAdd = (el) => {
    let k; try { k = JSON.parse(el.dataset.k); } catch (e) { k = 0; }
    S().sepet.push({ n: el.dataset.n, m: el.dataset.m, k });
    DA.save(); redraw(); DA.toast(el.dataset.n + ' eklendi');
  };
  DA.actions.ibDel = (el) => { S().sepet.splice(+el.dataset.i, 1); DA.save(); redraw(); };
  DA.actions.ibReset = () => { S().sepet = []; DA.save(); redraw(); };
  DA.live.ibQ = (el) => { S().q = el.value; DA.save(); const o = DA.$('#ibList'); if (o) o.innerHTML = listHtml(el.value); };
})();
