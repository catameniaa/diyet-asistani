/* TÜBER 2022 Ek 5 — yaş gruplarına göre örnek menü planları */
(function () {
  'use strict';
  const { esc, icon } = DA;
  const M = () => DA.data.ornekMenu;

  const text = (m) => m.t + ' — ' + m.ek + '\n' + m.d + '\n\n' +
    m.o.map((o) => o[0].toUpperCase() + '\n' + o[1].map((x) => '• ' + x).join('\n')).join('\n\n') +
    '\n\nKaynak: ' + M().src + '\n' + DA.dyt();

  function cardHtml(m) {
    return '<div class="card"><div class="sect" style="margin-top:0"><span>' + esc(m.t) +
      ' <span class="muted tiny">' + esc(m.ek) + '</span></span></div>' +
      '<p class="muted small">' + esc(m.d) + '</p>' +
      m.o.map((o) => '<div class="sect">' + esc(o[0]) + '</div><ul class="tight">' +
        o[1].map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>').join('') +
      '<button class="btn sec block mt" data-act="omCopy" data-id="' + esc(m.id) + '">' + icon('share') + ' Menüyü kopyala</button></div>';
  }

  DA.calcs.push({
    id: 'ornekmenu', title: 'Örnek menü planları (TÜBER)', desc: 'Yaş gruplarına göre günlük menü örnekleri', ico: 'menu',
    view() {
      const d = M();
      return {
        title: 'Örnek menü planları', tab: 'hesapla', back: 'hesapla', ico: 'menu',
        fav: { h: '#/hesapla/ornekmenu', t: 'Örnek menüler', ico: 'menu' },
        html: d.m.map(cardHtml).join('') +
          '<div class="note">Kaynak: ' + esc(d.src) + '. Porsiyon karşılıkları için Ek 2.1 porsiyon ölçülerine bakın.</div>' +
          '<a class="btn ghost block" href="#/hesapla/porsiyon?t=olcu">' + icon('table') + ' Porsiyon ölçüleri</a>'
      };
    }
  });

  DA.actions.omCopy = (el) => {
    const m = M().m.find((x) => x.id === el.dataset.id);
    if (m) DA.shareText(m.t + ' — örnek menü', text(m));
  };
})();
