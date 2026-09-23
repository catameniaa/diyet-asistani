/* TÜBER 2022 Ek 5 — yaş gruplarına göre örnek menü planları */
(function () {
  'use strict';
  const { esc, icon } = DA;
  const M = () => DA.data.ornekMenu;
  const S = () => DA.state().ui;

  const text = (m) => m.t + ' — ' + m.ek + '\n' + m.d + '\n\n' +
    m.o.map((o) => o[0].toUpperCase() + '\n' + o[1].map((x) => '• ' + x).join('\n')).join('\n\n') +
    '\n\nKaynak: ' + M().src + '\n' + DA.dyt();

  /* Menüdeki öğün sayısı ve toplam öğe — kısa künye */
  const kunye = (m) => m.o.length + ' öğün · ' + m.o.reduce((a, o) => a + o[1].length, 0) + ' öğe';

  function cardHtml(m) {
    return '<div class="card"><div class="sect" style="margin-top:0"><span>' + esc(m.t) +
      ' <span class="muted tiny">' + esc(m.ek) + '</span></span></div>' +
      '<p class="muted small">' + esc(m.d) + '</p>' +
      m.o.map((o) => '<div class="sect">' + esc(o[0]) + '</div><ul class="tight">' +
        o[1].map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>').join('') +
      '<div class="grid2 mt"><button class="btn sec block" data-act="omCopy" data-id="' + esc(m.id) + '">' +
      icon('share') + ' Kopyala</button>' +
      '<a class="btn sec block" href="#/yazdir/ornekmenu/' + esc(m.id) + '">' + icon('note') + ' Yazdır</a></div>' +
      (m.gebe
        ? '<a class="btn ghost block mt-s" href="#/hesapla/gebe">' + icon('heart') + ' Gebelik ve emzirme referansları</a>'
        : '<button class="btn ghost block mt-s" data-act="omHedef" data-id="' + esc(m.id) + '">' +
          icon('book') + ' Bu profilin besin ögesi hedefleri</button>') +
      '</div>';
  }

  DA.calcs.push({
    id: 'ornekmenu', data: ['ornekMenu','hedef'], title: 'Örnek menü planları (TÜBER)', desc: 'Çocuktan yaşlıya, gebe ve emzirenler için 8 günlük menü', ico: 'menu',
    view(parts, q) {
      const d = M(), ui = S();
      if (q && q.get('m')) ui.omSec = q.get('m');
      const sec = d.m.find((x) => x.id === ui.omSec) || d.m[0];
      setTimeout(() => { const c = DA.$('.chips .chip.on'); if (c) c.scrollIntoView({ block: 'nearest', inline: 'center' }); }, 0);
      return {
        title: 'Örnek menü planları', tab: 'hesapla', back: 'hesapla', ico: 'menu',
        fav: { h: '#/hesapla/ornekmenu', t: 'Örnek menüler', ico: 'menu' },
        html:
          '<div class="card"><div class="sect" style="margin-top:0">Profil</div><div class="chips">' +
          d.m.map((x) => '<button class="chip' + (x === sec ? ' on' : '') + '" data-act="omPick" data-id="' + esc(x.id) + '">' +
            esc(x.t.replace(/ \(.*\)/, '')) + '</button>').join('') + '</div>' +
          '<p class="muted tiny" style="margin-bottom:0">' + esc(sec.ek) + ' · ' + esc(kunye(sec)) + '</p></div>' +
          cardHtml(sec) +
          '<div class="row gap mb"><a class="btn ghost sm" href="#/hesapla/porsiyon?t=olcu">' + icon('table') + ' Porsiyon ölçüleri</a>' +
          '<a class="btn ghost sm" href="#/hesapla/porsiyonbesin">' + icon('apple') + ' Porsiyon besin değerleri</a></div>' +
          '<div class="note">Kaynak: ' + esc(d.src) + '. Menüler örnektir; danışanın enerji gereksinimi, ' +
          'besin tercihleri ve klinik durumuna göre uyarlanmalıdır.</div>'
      };
    }
  });

  DA.views._printOrnek = (parts) => {
    const m = M().m.find((x) => x.id === parts[0]) || M().m[0];
    return {
      title: 'Örnek menü', tab: 'referans', back: 'hesapla/ornekmenu', noRecent: true,
      html: '<div class="noprint grid2 mb"><button class="btn block" data-act="doPrint">PDF olarak kaydet / yazdır</button>' +
        '<button class="btn ghost block" data-act="omCopy" data-id="' + esc(m.id) + '">Metin olarak paylaş</button></div>' +
        '<div class="printdoc">' + DA.antet() + '<h2>' + esc(m.t) + '</h2>' +
        '<div class="alt">' + esc(m.d) + '</div>' +
        m.o.map((o) => '<div class="blok"><h3>' + esc(o[0]) + '</h3>' +
          '<ul>' + o[1].map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>').join('') +
        DA.dipnot('menü örnektir, kişiye göre uyarlanmalıdır.', M().src) + '</div>'
    };
  };

  DA.actions.omPick = (el) => { S().omSec = el.dataset.id; DA.save(); DA.render(); };
  DA.actions.omCopy = (el) => {
    const m = M().m.find((x) => x.id === el.dataset.id);
    if (m) DA.shareText(m.t + ' — örnek menü', text(m));
  };
  /* Menü profilini besin ögesi hedefleri ekranına taşı */
  DA.actions.omHedef = (el) => {
    const m = M().m.find((x) => x.id === el.dataset.id);
    if (!m || !DA.data.hedef) return;
    const T = DA.data.hedef[m.sex];
    const i = T.c.findIndex((c) => c.y === m.age);
    if (i < 0) return DA.toast('Bu yaş grubu hedef tablosunda yok');
    const ui = S();
    ui.hdSex = m.sex; ui.hdCol = i; ui.hdPal = 0;
    DA.save();
    DA.go('hesapla/hedef');
  };
})();
