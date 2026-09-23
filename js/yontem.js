/* TÜBER 2022 Tablo 10.1–10.2 ve Ek 1.2.2 — yöntem, tanımlar ve kısaltmalar.
   Uygulamanın her yerinde geçen PRI/AI/EAR/UL etiketlerinin karşılığı burada. */
(function () {
  'use strict';
  const { esc, fmt, icon } = DA;
  const Y = () => DA.data.yontem;

  function drvHtml() {
    const d = Y().drv;
    return '<div class="scrollx"><table class="t"><thead><tr><th>Kısaltma</th><th>IOM</th><th>EFSA</th><th>Ne demek</th></tr></thead><tbody>' +
      d.r.map((x) => '<tr><td><b>' + esc(x.k) + '</b></td><td class="muted">' + esc(x.iom) + '</td>' +
        '<td class="muted">' + esc(x.efsa) + '</td><td>' + esc(x.ad) + '</td></tr>').join('') +
      '</tbody></table></div>' +
      d.r.map((x) =>
        '<details class="acc"><summary>' + esc(x.k) + ' — ' + esc(x.ad) + '</summary><div class="body">' +
        '<p class="muted tiny">' + esc(x.en) + '</p>' +
        '<p>' + esc(x.d) + '</p>' +
        '<div class="sect" style="margin-top:6px">Ne için kullanılır</div><p>' + esc(x.kullan) + '</p>' +
        (x.dikkat ? '<div class="note warn">' + esc(x.dikkat) + '</div>' : '') +
        '</div></details>').join('') +
      '<p class="muted tiny">' + esc(d.dip) + '</p>';
  }

  function faktorHtml() {
    const f = Y().faktoriyel;
    return '<table class="t"><tbody>' + f.r.map((x) =>
      '<tr><td>' + esc(x.g) + '<div class="muted tiny">' + esc(x.a) + '</div></td>' +
      '<td class="n"><b>' + esc(x.f) + '</b></td></tr>').join('') + '</tbody></table>' +
      '<p class="muted small">' + esc(f.n) + '</p>' +
      '<div class="note">' + esc(f.pal) + '</div>' +
      '<div class="note ok">' + esc(f.hedef) + '</div>';
  }

  function aminoHtml() {
    const a = Y().aminoasit;
    return '<div class="scrollx"><table class="t xt"><thead><tr><th>Yaş</th>' +
      a.c.map((c) => '<th class="n">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' +
      a.r.map((r) => '<tr><td>' + esc(r.y) + '</td>' +
        r.v.map((v) => '<td class="n">' + fmt(v, 1) + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div>' +
      '<p class="muted tiny">Birim: ' + esc(a.birim) + ' · ' + esc(a.kukurtlu) + '</p>' +
      '<p class="muted small" style="margin-bottom:0">' + esc(a.n) + '</p>';
  }

  function kisaltHtml() {
    return '<table class="t"><tbody>' + Y().kisalt.map((k) =>
      '<tr><td style="white-space:nowrap"><b>' + esc(k[0]) + '</b></td><td class="small">' + esc(k[1]) + '</td></tr>').join('') +
      '</tbody></table>';
  }

  DA.calcs.push({
    id: 'yontem', data: ['yontem'], title: 'Yöntem ve tanımlar',
    desc: 'PRI, AI, EAR, RI ve UL ne demek · faktöriyel yöntem · amino asit örüntüsü', ico: 'info',
    view() {
    const y = Y();
    return {
      title: 'Yöntem ve tanımlar', tab: 'referans', back: 'referans', ico: 'info',
      fav: { h: '#/hesapla/yontem', t: 'Yöntem ve tanımlar', ico: 'info' },
      html:
        '<div class="note">Uygulamadaki tablolarda geçen <b>PRI</b>, <b>AI</b>, <b>EAR/AR</b>, <b>RI</b> ve ' +
        '<b>UL</b> etiketlerinin ne anlama geldiği ve hangisinin ne için kullanıldığı.</div>' +
        '<div class="sect"><span>' + esc(y.drv.t) + ' <span class="muted tiny">' + esc(y.drv.ek) + '</span></span></div>' +
        '<div class="card">' + drvHtml() + '</div>' +
        '<div class="sect"><span>' + esc(y.faktoriyel.t) + ' <span class="muted tiny">' + esc(y.faktoriyel.ek) + '</span></span></div>' +
        '<div class="card">' + faktorHtml() +
        '<a class="btn ghost block mt-s" href="#/hesapla/enerjiref">' + icon('heart') + ' Enerji referans değerleri</a></div>' +
        '<div class="sect"><span>' + esc(y.aminoasit.t) + ' <span class="muted tiny">' + esc(y.aminoasit.ek) + '</span></span></div>' +
        '<div class="card">' + aminoHtml() + '</div>' +
        '<div class="sect"><span>Kısaltmalar</span></div>' +
        '<div class="card">' + kisaltHtml() + '</div>' +
        '<div class="note">Kaynak: ' + esc(y.src) + '.</div>'
    };
    }
  });
})();
