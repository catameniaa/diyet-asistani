/* Genel arama — hesaplayıcı, besin, referans, danışan ve menülerde tek kutudan arama */
(function () {
  'use strict';
  const { esc, icon, fmt, trLower } = DA;

  let q = '';

  /* Aranacak her şeyi tek bir listeye indirger */
  function sources() {
    const S = DA.state(), out = [];
    DA.calcs.forEach((c) => out.push({
      g: 'Hesaplayıcı', ico: c.ico || 'calc', t: c.title, s: c.desc, h: '#/hesapla/' + c.id,
      k: c.title + ' ' + c.desc
    }));
    DA.data.foods.forEach((f) => out.push({
      g: 'Besin', ico: 'apple', t: f.n, s: fmt(f.kcal, 0) + ' kcal/100 g · KH ' + fmt(f.c, 1) + ' · P ' + fmt(f.p, 1) + ' · Y ' + fmt(f.f, 1),
      h: '#/besin?f=' + encodeURIComponent(f.id), k: f.n + ' ' + (f.cat || '')
    }));
    ((DA.data.porsiyon && DA.data.porsiyon.olcu) || []).forEach((g) => g.f.forEach((f) => out.push({
      g: 'Porsiyon ölçüsü', ico: 'table', t: f[0], s: '1 porsiyon: ' + f[1],
      h: '#/hesapla/porsiyon?t=olcu&ara=' + encodeURIComponent(f[0].split(/[ ,(]/)[0]),
      k: f[0] + ' ' + f[1] + ' ' + g.g + ' porsiyon ölçü'
    })));
    ((DA.data.porsiyonBesin && DA.data.porsiyonBesin.g) || []).forEach((g) => g.f.forEach((f) => out.push({
      g: 'Porsiyon besin değeri', ico: 'apple', t: f[0],
      s: fmt(f[1], 0) + ' g porsiyon · ' + fmt(f[2], 0) + ' kcal · KH ' + fmt(f[4], 1) + ' · P ' + fmt(f[3], 1) + ' · Y ' + fmt(f[6], 1),
      h: '#/hesapla/porsiyonbesin', k: f[0] + ' ' + g.g + ' porsiyon besin değeri'
    })));
    ((DA.data.istege && DA.data.istege.g) || []).forEach((g) => g.f.forEach((f) => f.m.forEach((m) => out.push({
      g: 'İsteğe bağlı besin', ico: 'apple', t: f.n,
      s: m[0] + ' · ' + (Array.isArray(m[1]) ? m[1][0] + '–' + m[1][1] : m[1]) + ' kat (75 kkal)',
      h: '#/hesapla/istege', k: f.n + ' ' + m[0] + ' ' + g.t + ' isteğe bağlı'
    }))));
    ((DA.data.ornekMenu && DA.data.ornekMenu.m) || []).forEach((m) => m.o.forEach((o) => o[1].forEach((x) => out.push({
      g: 'Örnek menü', ico: 'menu', t: x, s: m.t + ' · ' + o[0],
      h: '#/hesapla/ornekmenu?m=' + encodeURIComponent(m.id), k: x + ' ' + m.t + ' ' + o[0]
    }))));
    DA.data.ref.forEach((r) => out.push({
      g: 'Referans', ico: 'book', t: r.t, s: 'Klinik referans',
      h: '#/referans?r=' + encodeURIComponent(r.id), k: r.t + ' ' + r.tags + ' ' + r.h.replace(/<[^>]+>/g, ' ')
    }));
    (S.clients || []).forEach((c) => out.push({
      g: 'Danışan', ico: 'users', t: c.name, s: (c.meas || []).length + ' ölçüm', h: '#/danisan/' + c.id, k: c.name
    }));
    (S.menus || []).forEach((m) => out.push({
      g: 'Menü', ico: 'menu', t: m.title, s: DA.fdate(m.date) + (m.client ? ' · ' + m.client : ''), h: '#/menu/' + m.id, k: m.title + ' ' + (m.client || '')
    }));
    return out;
  }

  /* Baştan eşleşme önce, sonra içinde geçenler */
  function hits() {
    const s = trLower(q).trim();
    if (s.length < 2) return [];
    const res = [];
    sources().forEach((x) => {
      const t = trLower(x.t), k = trLower(x.k);
      let rank = -1;
      if (t.startsWith(s)) rank = 0;
      else if (t.includes(s)) rank = 1;
      else if (k.includes(s)) rank = 2;
      if (rank >= 0) res.push({ x, rank });
    });
    res.sort((a, b) => a.rank - b.rank || a.x.t.localeCompare(b.x.t, 'tr'));
    return res.slice(0, 40).map((r) => r.x);
  }

  function listHtml() {
    const s = trLower(q).trim();
    if (s.length < 2) {
      const f = DA.favs(), r = DA.recents();
      let h = '<div class="empty">' + icon('search') + '<div>Besin, hesaplayıcı, referans konusu, danışan ya da menü ara.</div></div>';
      if (f.length) h += '<div class="sect">Favoriler</div><div class="chips">' + f.map((x) => '<a class="chip" href="' + esc(x.h) + '">' + esc(x.t) + '</a>').join('') + '</div>';
      if (r.length) h += '<div class="sect">Son açılanlar</div><div class="chips">' + r.map((x) => '<a class="chip" href="' + esc(x.h) + '">' + esc(x.t) + '</a>').join('') + '</div>';
      return h;
    }
    const items = hits();
    if (!items.length) return '<div class="empty">' + icon('search') + '<div>“' + esc(q) + '” için sonuç yok.</div></div>';
    let html = '', last = '';
    items.forEach((x) => {
      if (x.g !== last) { html += (last ? '</div>' : '') + '<div class="sect">' + esc(x.g) + '</div><div class="list">'; last = x.g; }
      html += '<a class="li chev" href="' + esc(x.h) + '"><span class="ic">' + icon(x.ico) + '</span>' +
        '<span class="grow"><div class="t">' + esc(x.t) + '</div><div class="s">' + esc(x.s) + '</div></span></a>';
    });
    return html + '</div>';
  }

  DA.live.gSearch = (el) => { q = el.value; DA.$('#gOut').innerHTML = listHtml(); };

  DA.views.ara = () => ({
    title: 'Ara', tab: 'ana', back: 'ana', noRecent: true,
    html: '<input type="search" placeholder="Ara: yulaf, BKİ, demir, danışan adı…" value="' + esc(q) + '" data-live="gSearch" class="mb" autocomplete="off">' +
      '<div id="gOut" aria-live="polite" aria-label="Arama sonuçları">' + listHtml() + '</div>',
    mount(app) {
      const i = DA.$('input[data-live=gSearch]', app);
      if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
      /* Aramanın tüm kaynakları kapsaması için tembel verileri bir kez yükle */
      if (!DA.needAll._ok) DA.needAll().then(() => { DA.needAll._ok = 1; const o = DA.$('#gOut'); if (o) o.innerHTML = listHtml(); }).catch(() => {});
    }
  });
})();
