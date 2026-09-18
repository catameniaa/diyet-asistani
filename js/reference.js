/* Klinik hızlı referans */
(function () {
  'use strict';
  const { esc } = DA;
  let q = '';
  function listHtml() {
    const s = DA.trLower(q);
    const items = DA.data.ref.filter((r) => !s || DA.trLower(r.t + ' ' + r.tags + ' ' + r.h.replace(/<[^>]+>/g, ' ')).includes(s));
    if (!items.length) return DA.emptyState('search', 'Sonuç yok.');
    return items.map((r) => '<details class="acc"' + (s ? ' open' : '') + '><summary>' + esc(r.t) + '</summary><div class="body">' + r.h + '</div></details>').join('');
  }
  DA.live.refSearch = (el) => { q = el.value; DA.$('#refList').innerHTML = listHtml(); };
  DA.views.referans = () => ({
    title: 'Klinik referans', tab: 'referans',
    html: '<input type="search" placeholder="Ara: örn. demir, diyabet, lif…" value="' + esc(q) + '" data-live="refSearch" class="mb"><div id="refList">' + listHtml() + '</div>' +
      '<p class="muted tiny center">Genel bilgilendirme amaçlıdır; kılavuzlar güncellenir. Hasta kararı için güncel kılavuza ve kurum protokollerine bakın.</p>'
  });
})();
