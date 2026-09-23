/* Klinik hızlı referans */
(function () {
  'use strict';
  const { esc } = DA;
  let q = '';
  function listHtml(openId) {
    const s = DA.trLower(q);
    const items = DA.data.ref.filter((r) => !s || DA.trLower(r.t + ' ' + r.tags + ' ' + r.h.replace(/<[^>]+>/g, ' ')).includes(s));
    if (!items.length) return DA.emptyState('search', { baslik: 'Sonuç yok',
      aciklama: 'Farklı bir terim dene: besin ögesi adı (demir, lif), hastalık (diyabet) ya da kısaltma (PRI, UL) arayabilirsin.' });
    return items.map((r) => '<details class="acc"' + (s || r.id === openId ? ' open' : '') + '><summary>' + esc(r.t) + '</summary><div class="body">' + r.h + '</div></details>').join('');
  }
  DA.live.refSearch = (el) => { q = el.value; DA.$('#refList').innerHTML = listHtml(); };
  DA.views.referans = (parts, par) => ({
    title: 'Referans', tab: 'referans',
    html: (DA.calcListHtml ? DA.calcListHtml('referans') : '') +
      '<div class="sect">Klinik hızlı referans</div>' +
      '<input type="search" placeholder="Ara: örn. demir, diyabet, lif…" value="' + esc(q) + '" data-live="refSearch" class="mb"><div id="refList" aria-live="polite" aria-label="Referans sonuçları">' + listHtml(par && par.get('r')) + '</div>' +
      '<p class="muted tiny center">Genel bilgilendirme amaçlıdır; kılavuzlar güncellenir. Hasta kararı için güncel kılavuza ve kurum protokollerine bakın.</p>'
  });
})();
