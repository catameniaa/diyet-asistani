/* TÜBER 2022 — gebelik ve emzirme referans tabloları (Tablo 7.8–7.10) */
(function () {
  'use strict';
  const { esc, fmt, icon } = DA;
  const G = () => DA.data.gebe;

  function kazanimHtml(bki) {
    const k = G().kazanim;
    const hit = bki > 0 ? k.tekil.find((r) => (r.lo == null || bki >= r.lo) && (r.hi == null || bki <= r.hi)) : null;
    return '<div class="card"><div class="sect" style="margin-top:0"><span>' + esc(k.t) +
      ' <span class="muted tiny">' + esc(k.ek) + '</span></span></div>' +
      '<table class="t"><thead><tr><th>Gebelik öncesi BKİ</th><th class="n">Toplam kazanım</th></tr></thead><tbody>' +
      k.tekil.map((r) => '<tr' + (r === hit ? ' class="on"' : '') + '><td>' + esc(r.l) +
        '<br><span class="muted tiny">' + esc(r.bki) + ' kg/m²</span></td>' +
        '<td class="n"><b>' + fmt(r.v[0], 1) + '–' + fmt(r.v[1], 1) + '</b> kg</td></tr>').join('') +
      '</tbody></table>' +
      '<div class="sect">Çoğul gebelikler ve diğer durumlar</div><table class="t"><tbody>' +
      k.cogul.map((x) => '<tr><td>' + esc(x[0]) + '</td><td class="n"><b>' + esc(x[1]) + '</b></td></tr>').join('') +
      k.diger.map((x) => '<tr><td>' + esc(x[0]) + '</td><td><b>' + esc(x[1]) + '</b></td></tr>').join('') +
      '</tbody></table></div>';
  }

  function besinHtml() {
    const b = G().besin, s = G().sut;
    return '<div class="card"><div class="sect" style="margin-top:0"><span>' + esc(b.t) +
      ' <span class="muted tiny">' + esc(b.ek) + '</span></span></div>' +
      '<div class="scrollx"><table class="t xt"><thead><tr><th>Besin ögesi</th>' +
      s.map((x) => '<th class="n">' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' +
      b.g.map(([gn, rows]) =>
        '<tr class="gh"><td colspan="4"><b>' + esc(gn) + '</b></td></tr>' +
        rows.map((r) => '<tr><td>' + esc(r[0]) + (r[1] ? ' <span class="muted tiny">' + esc(r[1]) + '</span>' : '') + '</td>' +
          '<td class="n">' + esc(r[2]) + '</td><td class="n"><b>' + esc(r[3]) + '</b></td><td class="n"><b>' + esc(r[4]) + '</b></td></tr>').join('')
      ).join('') + '</tbody></table></div>' +
      '<p class="muted tiny" style="margin-bottom:0">' + esc(b.n) + '</p></div>';
  }

  function porsiyonHtml() {
    const p = G().porsiyon, s = G().sut;
    return '<div class="card"><div class="sect" style="margin-top:0"><span>' + esc(p.t) +
      ' <span class="muted tiny">' + esc(p.ek) + '</span></span></div>' +
      '<div class="scrollx"><table class="t xt"><thead><tr><th>Besin grubu</th>' +
      s.map((x) => '<th class="n">' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' +
      p.r.map((r) => '<tr><td>' + esc(r[0]) + '</td><td class="n">' + esc(r[1]) +
        '</td><td class="n"><b>' + esc(r[2]) + '</b></td><td class="n"><b>' + esc(r[3]) + '</b></td></tr>').join('') +
      '</tbody></table></div></div>';
  }

  DA.gebe = {
    /* Gebelik hesaplayıcısının altındaki referans paneli */
    helpHtml() {
      if (!DA.data.gebe) return '';
      const p = DA.state().profile || {};
      const bki = (p.h > 0 && p.w > 0) ? p.w / Math.pow(p.h / 100, 2) : 0;
      return '<details class="acc"><summary>TÜBER referans tabloları <span class="muted tiny">Tablo 7.8–7.10</span></summary>' +
        '<div class="body">' + kazanimHtml(bki) + porsiyonHtml() +
        '<a class="btn ghost block" href="#/hesapla/gebe">' + icon('heart') + ' Besin ögesi tablosunun tamamı</a></div></details>';
    }
  };

  DA.calcs.push({
    id: 'gebe', title: 'Gebelik ve emzirme referansları', desc: 'Ağırlık kazanımı, besin ögesi ve porsiyon önerileri', ico: 'heart',
    view() {
      const p = DA.state().profile || {};
      const bki = (p.h > 0 && p.w > 0) ? p.w / Math.pow(p.h / 100, 2) : 0;
      return {
        title: 'Gebelik ve emzirme', tab: 'hesapla', back: 'hesapla', ico: 'heart',
        fav: { h: '#/hesapla/gebe', t: 'Gebelik referansları', ico: 'heart' },
        html:
          (bki ? '<div class="note">Profildeki boy ve kiloya göre BKİ <b>' + fmt(bki, 1) +
            '</b> kg/m²; aşağıdaki tabloda ilgili satır vurgulandı.</div>' : '') +
          kazanimHtml(bki) + porsiyonHtml() + besinHtml() +
          '<details class="acc"><summary>Klinik notlar</summary><div class="body"><ul class="tight">' +
          G().not.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div></details>' +
          '<a class="btn ghost block" href="#/hesapla/gebelik">' + icon('calc') + ' Ek enerji ve protein hesapla</a>' +
          '<div class="note">Kaynak: ' + esc(G().src) + '. Ağırlık kazanımı aralıkları IOM’a göredir.</div>'
      };
    }
  });
})();
