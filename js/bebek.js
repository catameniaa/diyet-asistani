/* TÜBER 2022 — 7-24 ay tamamlayıcı beslenme ve referans değerleri */
(function () {
  'use strict';
  const { esc, fmt, icon } = DA;
  const B = () => DA.data.bebek;

  const cell = (v) => v == null ? '<span class="muted">—</span>'
    : Array.isArray(v) ? fmt(v[0], 2) + '–' + fmt(v[1], 2)
    : typeof v === 'number' ? fmt(v, 2) : esc(String(v));

  /* Tablo 7.6/7.7 — AI/PRI ve UL sütunlu tablo */
  function refTable(T) {
    return '<div class="card"><div class="sect" style="margin-top:0"><span>' + esc(T.t) +
      ' <span class="muted tiny">' + esc(T.ek) + '</span></span></div>' +
      '<div class="scrollx"><table class="t xt"><thead><tr><th>Besin ögesi</th>' +
      T.r.map((r) => '<th class="n" colspan="2">' + esc(r.y) + '</th>').join('') +
      '</tr><tr><th></th>' + T.r.map(() => '<th class="n tiny">AI/PRI</th><th class="n tiny">UL</th>').join('') +
      '</tr></thead><tbody>' +
      T.c.map((c, i) => '<tr><td>' + esc(c[0]) + ' <span class="muted tiny">' + esc(c[1]) +
        (c[2] ? ' · ' + esc(c[2]) : '') + '</span></td>' +
        T.r.map((r) => '<td class="n"><b>' + cell(r.ai[i]) + '</b></td><td class="n muted">' + cell(r.ul[i]) + '</td>').join('') +
        '</tr>').join('') +
      '</tbody></table></div>' + (T.n ? '<p class="muted tiny" style="margin-bottom:0">' + esc(T.n) + '</p>' : '') + '</div>';
  }

  function enerjiHtml() {
    const e = B().enerji;
    return '<div class="card"><div class="sect" style="margin-top:0"><span>' + esc(e.t) +
      ' <span class="muted tiny">' + esc(e.ek) + '</span></span></div>' +
      '<div class="scrollx"><table class="t xt"><thead><tr><th>Yaş</th>' +
      '<th class="n">Enerji kız</th><th class="n">Enerji erkek</th><th class="n">Protein AR</th><th class="n">Protein PRI</th></tr></thead><tbody>' +
      e.r.map((r) => '<tr><td>' + esc(r.y) + '</td>' +
        '<td class="n">' + cell(r.K) + '</td><td class="n">' + cell(r.E) + '</td>' +
        '<td class="n' + (r.ort ? ' muted' : '') + '">' + fmt(r.ar, 2) + '</td>' +
        '<td class="n' + (r.ort ? ' muted' : '') + '"><b>' + fmt(r.pri, 2) + '</b></td></tr>').join('') +
      '</tbody></table></div>' +
      '<p class="muted tiny">Enerji kkal/gün · protein g/kg/gün. ' + esc(e.n) + '</p>' +
      '<div class="sect">Anne sütüne ek olarak tamamlayıcı besinlerden</div>' +
      '<table class="t"><tbody>' + B().ekEnerji.map((x) =>
        '<tr><td>' + esc(x[0]) + '</td><td class="n"><b>' + x[1] + '</b> kkal/gün</td></tr>').join('') + '</tbody></table></div>';
  }

  function makroHtml() {
    const m = B().makro;
    return '<div class="card"><div class="sect" style="margin-top:0"><span>' + esc(m.t) +
      ' <span class="muted tiny">' + esc(m.ek) + '</span></span></div>' +
      '<div class="scrollx"><table class="t xt"><thead><tr><th>Besin ögesi</th>' +
      m.r.map((r) => '<th class="n">' + esc(r.y) + '</th>').join('') + '</tr></thead><tbody>' +
      m.c.map((c, i) => '<tr><td>' + esc(c[0]) + ' <span class="muted tiny">' + esc(c[1]) + ' · ' + esc(c[2]) + '</span></td>' +
        m.r.map((r) => '<td class="n">' + cell(r.v[i]) + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div><p class="muted tiny" style="margin-bottom:0">Su sütunu tüm içecekleri kapsar.</p></div>';
  }

  function ogunHtml() {
    const b = B();
    return '<div class="card"><div class="sect" style="margin-top:0"><span>Öğün yapısı, sıklığı ve miktarı ' +
      '<span class="muted tiny">Tablo 7.2</span></span></div>' +
      b.ogun.map((o) => '<div class="sect">' + esc(o.y) + ' <span class="muted tiny">' + o.kcal + ' kkal/gün</span></div>' +
        '<table class="t"><tbody>' +
        '<tr><td style="width:30%">Yapı</td><td>' + esc(o.yapi) + '</td></tr>' +
        '<tr><td>Sıklık</td><td>' + esc(o.s) + ' öğün</td></tr>' +
        '<tr><td>Miktar</td><td>' + esc(o.m) + '</td></tr></tbody></table>').join('') +
      '<p class="muted tiny">' + esc(b.ogunN) + '</p>' +
      '<div class="sect">Enerji yoğunluğuna göre öğün sıklığı <span class="muted tiny">Tablo 7.3</span></div>' +
      '<table class="t"><thead><tr><th>Enerji (kkal/g-mL)</th><th class="n">Öğün sıklığı/gün</th></tr></thead><tbody>' +
      b.yogunluk.map((x) => '<tr><td>' + fmt(x[0], 1) + '</td><td class="n"><b>' + esc(x[1]) + '</b></td></tr>').join('') +
      '</tbody></table></div>';
  }

  DA.calcs.push({
    id: 'bebek', data: ['bebek'], title: 'Tamamlayıcı beslenme (6–24 ay)', desc: 'Öğün yapısı, enerji-protein, vitamin ve mineral referansları', ico: 'baby',
    view() {
      const b = B();
      return {
        title: 'Tamamlayıcı beslenme', tab: 'hesapla', back: 'hesapla', ico: 'baby',
        fav: { h: '#/hesapla/bebek', t: 'Tamamlayıcı beslenme', ico: 'baby' },
        html:
          '<div class="note ok">Tamamlayıcı besinlere ideal olarak <b>6. ayın sonunda</b> başlanır. Emzirme, isteğe bağlı sık sık ' +
          've 2 yaş ve sonrasına kadar sürdürülür.</div>' +
          ogunHtml() + enerjiHtml() + makroHtml() +
          refTable(b.vit) + refTable(b.min) +
          '<details class="acc"><summary>Besinler ve özellikleri <span class="muted tiny">7.2.5</span></summary><div class="body">' +
          '<table class="t"><tbody>' + b.besin.map((x) =>
            '<tr><td style="width:28%"><b>' + esc(x[0]) + '</b></td><td>' + x[1] + '</td></tr>').join('') +
          '</tbody></table></div></details>' +
          '<details class="acc"><summary>Tamamlayıcı beslenme önerileri</summary><div class="body"><ul class="tight">' +
          b.oneri.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div></details>' +
          '<a class="btn ghost block" href="#/hesapla/cocuk">' + icon('baby') + ' Büyüme persentilleri (WHO)</a>' +
          '<div class="note">Kaynak: ' + esc(b.src) + '. AI = yeterli alım · PRI = beslenme ile alınması önerilen miktar · ' +
          'UL = tolere edilebilir üst alım düzeyi. 2 yaş ve üzeri için TÜBER Ek 1.5 tabloları geçerlidir.</div>'
      };
    }
  });
})();
