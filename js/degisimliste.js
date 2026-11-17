/* Referans → Besin değişim listesi (veri: js/data-degisim.js).

   Neden: uygulamada her grubun yalnız iki üç porsiyon örneği vardı
   (js/exchange.js); danışana "ekmek yerine ne yiyebilirim" sorusunun cevabı
   ve diyet listesi yazarken bakılan tablo elde ya da başka bir sitedeydi.
   Burada grup grup ev ölçüsü ve miktar; yemek ve tatlılarda değişim
   karşılığı ve ondan hesaplanan kcal.

   kcal uygulamanın değişim değerlerinden hesaplanır (js/exchange.js), kaynak
   listedeki kcal kopyalanmaz: iki farklı sebze değeriyle (6+2 / 6+1) aynı
   ekranda iki farklı kcal görünmesin. */
(function () {
  'use strict';
  const { esc, fmt, icon } = DA;
  const V = () => DA.data.degisim;
  const U = () => DA.state().ui;
  const grup = (k) => (DA.exchange ? DA.exchange.groups.find((g) => g.k === k) : null);
  const kcal = (d) => Object.keys(d || {}).reduce((t, k) => { const g = grup(k); return t + (g ? d[k] * DA.exchange.kcalOf(g) : 0); }, 0);
  const karsilik = (d) => (DA.liste ? DA.liste.karsilik(d) : '');
  /* Grubun kendi 1 değişimi dışındaki karşılık satırda yazılır (ör. çorba
     1 ekmek + 1 yağ, boza 2,5 ekmek) */
  const tekDegisim = (r) => { const k = Object.keys(r.d); return k.length === 1 && k[0] === r.g && r.d[k[0]] === 1; };
  const kategori = (k) => k === 'tatli' || k === 'yemek';

  function bas(k) {
    const g = grup(k);
    if (!g) return 'Karşılık her satırda; kcal değişimlerden hesaplanır.';
    return '1 değişim: KH ' + fmt(g.c, 0) + ' g · protein ' + fmt(g.p, 0) + ' g · yağ ' + fmt(g.f, 0) + ' g · ' + fmt(DA.exchange.kcalOf(g), 0) + ' kcal' +
      (k === 'sut' ? '. Light (yarım yağlı) ürünler yarım yağlı süt değişimi sayılır (yağ 3 g); tam yağlısı aynı ölçüyle 1 süt değişimidir.' : '') +
      (k === 'baklagil' ? '. Ölçüler pişmiş, tepeleme kaşıkla.' : '') +
      (k === 'sebze' ? '. Pişmiş sebzede 1 değişim 5–6 yemek kaşığı.' : '');
  }
  function listeHtml() {
    const D = V(), u = U(), q = DA.trLower(String(u.dlQ || '')).trim(), sec = u.dlGrup || '';
    let bulunan = 0;
    const html = D.gruplar.filter((g) => !sec || g[0] === sec).map((g) => {
      const rows = D.satirlar.filter((r) => r.g === g[0] && (!q || DA.trLower(r.ad + ' ' + r.olcu + ' ' + r.not).indexOf(q) >= 0));
      if (!rows.length) return '';
      bulunan += rows.length;
      const kat = kategori(g[0]);
      return '<div class="card dl-grup" data-g="' + g[0] + '"><h2>' + esc(g[1]) + ' <span class="muted tiny">' + rows.length + '</span></h2>' +
        '<p class="muted tiny" style="margin-top:-4px">' + esc(bas(g[0])) + '</p>' +
        '<table class="t"><thead><tr><th>Besin</th><th>Ölçü</th>' + (kat ? '<th>Karşılık</th><th class="n">kcal</th>' : '<th>Miktar</th>') + '</tr></thead><tbody>' +
        rows.map((r) => '<tr data-id="' + esc(r.id) + '"><td><b>' + esc(r.ad) + '</b>' +
          (r.not ? '<div class="muted tiny">' + esc(r.not) + '</div>' : '') +
          (!kat && !tekDegisim(r) ? '<div class="tiny dl-kars">' + esc(r.serbest ? 'serbest' : '= ' + karsilik(r.d)) + '</div>' : '') + '</td>' +
          '<td>' + esc(r.olcu) + (r.pisOlcu ? '<div class="muted tiny">Pişmiş: ' + esc(r.pisOlcu) + '</div>' : '') + '</td>' +
          (kat ? '<td>' + esc(karsilik(r.d)) + '</td><td class="n">' + fmt(kcal(r.d), 0) + '</td>' : '<td>' + esc(r.miktar || '–') + '</td>') +
          '</tr>').join('') + '</tbody></table></div>';
    }).join('');
    return bulunan ? html : DA.emptyState('search', { baslik: 'Bulunamadı', aciklama: '“' + (u.dlQ || '') + '” bu grupta yok. Grubu "Tümü" yapıp yeniden dene.' });
  }

  DA.calcs.push({
    id: 'degisimliste', data: ['degisim'], title: 'Besin değişim listesi',
    desc: 'Grup grup 1 değişimin ev ölçüsü · yemek ve tatlıların karşılığı', ico: 'table',
    view() {
      const D = V(), u = U(), sec = u.dlGrup || '';
      return {
        title: 'Besin değişim listesi', tab: 'referans', back: 'referans', ico: 'table',
        fav: { h: '#/hesapla/degisimliste', t: 'Besin değişim listesi', ico: 'table' },
        html: '<div class="chips mb" id="dlGruplar">' + [['', 'Tümü']].concat(D.gruplar).map((g) =>
            '<button class="chip' + (g[0] === sec ? ' on' : '') + '" data-act="dlGrup" data-g="' + g[0] + '" aria-pressed="' + (g[0] === sec) + '">' + esc(g[1].split(',')[0].split(' ve ')[0]) + '</button>').join('') + '</div>' +
          '<label class="fld mb"><span>Besin ara</span><input type="search" value="' + esc(u.dlQ || '') + '" placeholder="örn. bulgur, lor, kiraz" data-live="dlAra"></label>' +
          '<div id="dlList">' + listeHtml() + '</div>' +
          '<div class="note">Her satır bir değişimin karşılığıdır: aynı gruptaki besinler bu miktarlarda birbirinin yerine kullanılır. ' +
          'Diyet listesi yazarken bu satırlar seçenek olarak gelir. KH, protein, yağ ve kcal uygulamanın değişim değerlerinden hesaplanır.</div>'
      };
    }
  });
  DA.actions.dlGrup = (el) => { U().dlGrup = el.dataset.g || ''; DA.save(); DA.render(true); };
  DA.live.dlAra = (el) => {
    U().dlQ = el.value; DA.save();
    const o = DA.$('#dlList'); if (o) o.innerHTML = listeHtml();
  };
})();
