/* TÜBER 2022 Ek 2.3.1 — besinlerin standart porsiyonlarının besin ögesi içerikleri.
   Porsiyon çarpanıyla ölçeklenebilir; seçilen besinler toplanabilir. */
(function () {
  'use strict';
  const { esc, fmt, icon, trLower } = DA;
  const P = () => DA.data.porsiyonBesin;
  const Z = () => DA.data.zeytin;

  const S = () => (DA.state().ui.pb = DA.state().ui.pb || { sepet: [] });
  const val = (v) => v == null ? '—' : fmt(v, 2);

  function find(name) {
    let out = null;
    P().g.forEach((g) => g.f.forEach((f) => { if (f[0] === name) out = f; }));
    return out;
  }

  /* Seçilenlerin toplamı */
  function toplam() {
    const t = new Array(P().c.length).fill(0), eksik = {};
    S().sepet.forEach((x) => {
      const f = find(x.n);
      if (!f) return;
      for (let i = 1; i < f.length; i++) {
        if (f[i] == null) { eksik[i] = true; continue; }
        t[i - 1] += f[i] * x.k;
      }
    });
    return { t, eksik };
  }

  function sepetHtml() {
    const s = S();
    if (!s.sepet.length) return '<div class="card"><div class="empty">' + icon('apple') +
      '<div>Bir besine dokunarak porsiyon topla.</div></div></div>';
    const { t, eksik } = toplam();
    const C = P().c;
    return '<div class="card">' +
      '<div class="res hl"><span class="l">Toplam enerji</span><span class="v">' + fmt(t[1], 0) +
      ' kcal<span class="sub">' + s.sepet.length + ' besin · ' + fmt(t[0], 0) + ' g</span></span></div>' +
      '<div class="macros mt"><div><b>' + fmt(t[3], 0) + '</b><small>KH g</small></div>' +
      '<div><b>' + fmt(t[2], 0) + '</b><small>Protein g</small></div>' +
      '<div><b>' + fmt(t[5], 0) + '</b><small>Yağ g</small></div>' +
      '<div><b>' + fmt(t[4], 0) + '</b><small>Lif g</small></div></div>' +
      '<div class="list mt">' + s.sepet.map((x, i) =>
        '<div class="li"><span class="grow"><div class="t">' + esc(x.n) + '</div>' +
        '<div class="s">' + fmt(x.k, 2) + ' porsiyon</div></span>' +
        '<button class="btn ghost sm" data-act="pbLess" data-i="' + i + '" aria-label="Azalt">−</button>' +
        '<button class="btn ghost sm" data-act="pbMore" data-i="' + i + '" aria-label="Artır">+</button>' +
        '<button class="btn ghost sm" data-act="pbDel" data-i="' + i + '" aria-label="Kaldır">✕</button></div>').join('') +
      '</div>' +
      '<details class="acc mt"><summary>Besin ögesi dökümü</summary><div class="body">' +
      '<table class="t"><tbody>' + C.map((c, i) => i < 2 ? '' :
        '<tr><td>' + esc(c[0]) + '</td><td class="n"><b>' + fmt(t[i], 2) + '</b> ' + esc(c[1]) +
        (eksik[i + 1] ? ' <span class="muted tiny">(eksik veri var)</span>' : '') + '</td></tr>').join('') +
      '</tbody></table></div></details>' +
      '<div class="row between mt-s"><button class="btn ghost sm" data-act="pbReset">Temizle</button>' +
      '<button class="btn ghost sm" data-act="pbShare">' + icon('share') + ' Paylaş</button></div></div>';
  }

  function listHtml(q) {
    const s = trLower(q || '').trim();
    let hit = 0;
    const html = P().g.map((g) => {
      const fs = g.f.filter((f) => !s || trLower(f[0]).includes(s));
      if (!fs.length) return '';
      hit += fs.length;
      return '<div class="sect">' + esc(g.g) + '</div><div class="list">' +
        fs.map((f) => '<button class="li" data-act="pbAdd" data-n="' + esc(f[0]) + '">' +
          '<span class="grow"><div class="t">' + esc(f[0]) + '</div>' +
          '<div class="s">' + fmt(f[1], 0) + ' g · KH ' + val(f[4]) + ' · P ' + val(f[3]) + ' · Y ' + val(f[6]) + '</div></span>' +
          '<span class="end"><b>' + fmt(f[2], 0) + '</b><br>kcal</span></button>').join('') + '</div>';
    }).join('');
    if (!hit) return '<div class="card"><div class="empty">' + icon('search') + '<div>“' + esc(q) + '” bulunamadı.</div></div></div>';
    return html;
  }

  function zeytinHtml() {
    const z = Z();
    return '<details class="acc"><summary>Sıvı yağ yerine zeytin <span class="muted tiny">Ek 2.3.3</span></summary><div class="body">' +
      '<p class="muted small">Aşağıdaki miktarlar <b>1 tatlı kaşığı (5 g) sıvı yağa</b> eşdeğerdir.</p>' +
      z.r.map((r) => '<div class="sect">' + esc(r.t) + '</div><table class="t"><tbody>' +
        '<tr><td style="width:34%">Eşdeğer miktar</td><td><b>' + esc(r.m) + '</b></td></tr>' +
        '<tr><td>100 g’da</td><td>' + esc(r.e) + '</td></tr>' +
        '<tr><td>Etiket / tebliğ</td><td class="muted">' + esc(r.etiket) + '</td></tr></tbody></table>').join('') +
      '<ul class="tight muted tiny">' + z.n.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
      '<p class="muted tiny" style="margin-bottom:0">Kaynak: ' + esc(z.src) + '</p></div></details>';
  }

  DA.calcs.push({
    id: 'porsiyonbesin', data: ['porsiyonBesin'], title: 'Porsiyon besin değerleri', desc: '97 besinin standart porsiyonunda 19 besin ögesi', ico: 'table',
    view() {
      const s = S();
      return {
        title: 'Porsiyon besin değerleri', tab: 'hesapla', back: 'hesapla', ico: 'table',
        fav: { h: '#/hesapla/porsiyonbesin', t: 'Porsiyon besin değerleri', ico: 'table' },
        html:
          '<div id="pbOut">' + sepetHtml() + '</div>' +
          zeytinHtml() +
          '<label class="fld mb"><span>Besin ara</span><input type="search" value="' + esc(s.q || '') +
          '" placeholder="örn. hamsi, mercimek, ıspanak" data-live="pbQ"></label>' +
          '<div id="pbList">' + listHtml(s.q) + '</div>' +
          '<div class="card"><ul class="tight muted tiny" style="margin-bottom:0">' +
          P().n.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' +
          '<a class="btn ghost block" href="#/hesapla/porsiyon?t=olcu">' + icon('table') + ' Porsiyon ölçüleri (Ek 2.1)</a>' +
          '<div class="note">Değerler <b>1 standart porsiyon</b> içindir. Kaynak: ' + esc(P().src) + '</div>'
      };
    }
  });

  const redraw = () => { const o = DA.$('#pbOut'); if (o) o.innerHTML = sepetHtml(); };

  DA.actions.pbAdd = (el) => {
    const s = S(), n = el.dataset.n, cur = s.sepet.find((x) => x.n === n);
    if (cur) cur.k += 0.5; else s.sepet.push({ n, k: 1 });
    DA.save(); redraw(); DA.toast(n + ' eklendi');
  };
  DA.actions.pbMore = (el) => { S().sepet[+el.dataset.i].k += 0.5; DA.save(); redraw(); };
  DA.actions.pbLess = (el) => {
    const s = S(), i = +el.dataset.i;
    s.sepet[i].k -= 0.5;
    if (s.sepet[i].k <= 0) s.sepet.splice(i, 1);
    DA.save(); redraw();
  };
  DA.actions.pbDel = (el) => { S().sepet.splice(+el.dataset.i, 1); DA.save(); redraw(); };
  DA.actions.pbReset = () => { S().sepet = []; DA.save(); redraw(); };
  DA.actions.pbShare = () => {
    const { t } = toplam(), C = P().c;
    DA.shareText('Porsiyon besin değerleri',
      'Porsiyon besin değerleri (TÜBER 2022, Ek 2.3.1)\n\n' +
      S().sepet.map((x) => '• ' + x.n + ' — ' + DA.fmt(x.k, 2) + ' porsiyon').join('\n') +
      '\n\nTOPLAM\n' + C.map((c, i) => c[0] + ': ' + DA.fmt(t[i], 2) + ' ' + c[1]).join('\n') +
      '\n\n' + DA.dyt());
  };
  DA.live.pbQ = (el) => { S().q = el.value; DA.save(); const o = DA.$('#pbList'); if (o) o.innerHTML = listHtml(el.value); };
})();
