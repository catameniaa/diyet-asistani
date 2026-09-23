/* TÜBER 2022 Ek 1.1.1–1.1.4 — enerji referans değerleri.
   Hesaplayıcı enerji ihtiyacını Henry eşitliğiyle hesaplar; bu ekran kaynağın
   kendi yayımlanmış Türkiye tablosunu gösterir ve ikisini yan yana koyar. */
(function () {
  'use strict';
  const { esc, fmt, icon } = DA;
  const R = () => DA.data.enerjiRef;
  /* PAL hep bir ondalıkla: 1,4 · 2,0 · çocukta 1,41 */
  const dec = (n) => { const t = fmt(n, 2); return t.indexOf(',') < 0 ? t + ',0' : t; };

  const S = () => {
    const u = DA.state().ui;
    if (!u.eref) {
      const p = DA.state().profile || {};
      u.eref = { sex: p.sex === 'K' ? 'K' : 'E', grp: (p.age && p.age < 18) ? 'cocuk' : 'yetiskin' };
    }
    return u.eref;
  };

  /* Profilden ya da açık danışandan en yakın satırı bul */
  function onerilen() {
    const p = DA.state().profile || {}, s = S();
    if (!(p.age > 0)) return null;
    if (s.grp === 'cocuk') {
      if (p.age > 18) return null;
      const yas = Math.round(p.age);
      return R().cocuk[s.sex].find((r) => r.y === yas && r.p === 'M') || null;
    }
    const g = R().yetiskin[s.sex].filter((r) => {
      const [lo, hi] = r.y.split('-').map(Number);
      return p.age >= lo && p.age <= hi;
    });
    if (!g.length) return null;
    /* Boy verilmişse en yakın persentil, yoksa medyan */
    if (p.h > 0) return g.reduce((a, b) => Math.abs(b.b - p.h) < Math.abs(a.b - p.h) ? b : a);
    return g.find((r) => r.p === 50) || g[0];
  }

  /* PAL 1,4 sütunu 10–17 yaşta önerilmiyor (kaynakta soluk basılı) */
  const soluk = (grp, yas, i) => {
    const u = R().azAktifUyari;
    return grp === 'cocuk' && i === 0 && yas >= u[0] && yas <= u[1];
  };

  function ozetHtml() {
    const r = onerilen(), s = S();
    if (!r) {
      return '<div class="card"><div class="empty">' + icon('heart') +
        '<div>Profiline yaş ve boy girersen sana uyan satır burada vurgulanır.</div>' +
        '<a class="btn ghost" href="#/daha">Profili düzenle</a></div></div>';
    }
    const pal = R().pal, buyume = s.grp === 'cocuk' ? R().buyume : 0;
    const etiket = s.grp === 'cocuk' ? r.y + ' yaş · ' + (r.p === 'M' ? 'medyan' : '85. persentil')
      : r.y + ' yaş · ' + r.p + '. persentil boy';
    return '<div class="card">' +
      '<div class="res hl"><span class="l">Sana en yakın satır</span><span class="v">' + esc(etiket) +
      '<span class="sub">' + r.b + ' cm · ' + fmt(r.w, 1) + ' kg · DEH ' + r.deh + ' kkal</span></span></div>' +
      '<div class="scrollx"><table class="t xt"><thead><tr><th>Aktivite</th><th class="n">PAL</th><th class="n">Enerji</th></tr></thead><tbody>' +
      r.teh.map((v, i) =>
        '<tr' + (soluk(s.grp, r.y, i) ? ' class="dim"' : '') + '><td>' + esc(pal[i][1]) + '</td>' +
        '<td class="n">' + dec(pal[i][0] + buyume) + '</td>' +
        '<td class="n"><b>' + v + '</b> kkal</td></tr>').join('') +
      '</tbody></table></div>' +
      (s.grp === 'cocuk' && r.y >= R().azAktifUyari[0] && r.y <= R().azAktifUyari[1]
        ? '<p class="muted tiny">10–17 yaşta toplam enerji harcamasının en az PAL 1,6 düzeyinde olması önerilir; ' +
          'az aktif satırı bu nedenle soluk gösterilir.</p>' : '') +
      '<a class="btn ghost block mt-s" href="#/hesapla/enerji">' + icon('calc') + ' Hesaplayıcıyla karşılaştır</a>' +
      '</div>';
  }

  function tabloHtml() {
    const s = S(), pal = R().pal, buyume = s.grp === 'cocuk' ? R().buyume : 0;
    const rows = R()[s.grp][s.sex], sec = onerilen();
    const bas = s.grp === 'cocuk' ? 'Yaş' : 'Yaş grubu';
    return '<div class="scrollx"><table class="t xt"><thead>' +
      '<tr><th>' + bas + '</th><th>Persentil</th><th class="n">Boy</th><th class="n">Ağırlık</th><th class="n">DEH</th>' +
      pal.map((p) => '<th class="n">' + esc(p[1]) + '<br><span class="muted tiny">' + dec(p[0] + buyume) + '</span></th>').join('') +
      '</tr></thead><tbody>' +
      rows.map((r) => {
        const ilk = s.grp === 'cocuk' ? (r.p === 'M') : (r.p === 5);
        return '<tr' + (r === sec ? ' class="on"' : '') + (ilk ? ' class="grpbas"' : '') + '>' +
          '<td>' + (ilk ? (s.grp === 'cocuk' ? r.y : esc(r.y)) : '') + '</td>' +
          '<td class="muted tiny">' + (s.grp === 'cocuk' ? (r.p === 'M' ? 'Medyan' : '85.') : r.p + '.') + '</td>' +
          '<td class="n">' + r.b + '</td><td class="n">' + fmt(r.w, 1) + '</td><td class="n">' + r.deh + '</td>' +
          pal.map((p, i) => '<td class="n' + (soluk(s.grp, r.y, i) ? ' dim' : '') + '">' +
            (r.teh[i] == null ? '<span class="muted">—</span>' : r.teh[i]) + '</td>').join('') +
          '</tr>';
      }).join('') +
      '</tbody></table></div>';
  }

  function ekHtml() {
    const e = R().ek;
    return '<div class="card"><div class="sect" style="margin-top:0"><span>' + esc(e.t) +
      ' <span class="muted tiny">' + esc(e.ek) + '</span></span></div>' +
      '<table class="t"><tbody>' + e.r.map((x) =>
        '<tr><td>' + esc(x.l) + '</td><td class="n"><b>+' + x.v + '</b> kkal/gün</td></tr>').join('') +
      '</tbody></table><p class="muted tiny" style="margin-bottom:0">' + esc(e.n) + '</p></div>';
  }

  DA.actions.erefSet = (el) => {
    const s = S();
    if (el.dataset.sex) s.sex = el.dataset.sex;
    if (el.dataset.grp) s.grp = el.dataset.grp;
    DA.save(); DA.render(true);
  };

  DA.calcs.push({
    id: 'enerjiref', data: ['enerjiRef'], title: 'Enerji referans değerleri (TÜBER)',
    desc: 'Yaş, boy persentili ve PAL’e göre Türkiye enerji gereksinimi', ico: 'bars',
    view() {
      const s = S(), r = R();
      const seg = (k, opts) => '<div class="seg">' + opts.map((o) =>
        '<button class="' + (s[k] === o[0] ? 'on' : '') + '" data-act="erefSet" data-' + k + '="' + o[0] + '">' +
        esc(o[1]) + '</button>').join('') + '</div>';
      return {
        title: 'Enerji referans değerleri', tab: 'referans', back: 'referans', ico: 'bars',
        fav: { h: '#/hesapla/enerjiref', t: 'Enerji referansı', ico: 'bars' },
        html:
          '<div class="card">' + seg('grp', [['cocuk', 'Çocuk ve adolesan'], ['yetiskin', 'Yetişkin']]) +
          '<div class="mt-s">' + seg('sex', [['E', 'Erkek'], ['K', 'Kadın']]) + '</div></div>' +
          ozetHtml() +
          '<div class="sect"><span>' + esc(r[s.grp].t) + ' <span class="muted tiny">' + esc(r[s.grp].ek) + '</span></span></div>' +
          '<div class="card">' + tabloHtml() +
          '<p class="muted tiny" style="margin-bottom:0">' + esc(r[s.grp].n) + '</p></div>' +
          (s.grp === 'yetiskin' && s.sex === 'K' ? ekHtml() : '') +
          '<div class="card"><div class="sect" style="margin-top:0"><span>Nasıl hesaplanmış?</span></div>' +
          '<p class="small">Toplam enerji harcaması faktöriyel yöntemle bulunur (Tablo 10.2):</p>' +
          '<table class="t"><tbody>' +
          '<tr><td>Çocuk ve adolesan</td><td class="n">DEH × (PAL + 0,01)</td></tr>' +
          '<tr><td>Yetişkin</td><td class="n">DEH × PAL</td></tr>' +
          '</tbody></table>' +
          '<p class="muted tiny">DEH, Henry 2005 eşitlikleriyle (Tablo 10.3) hesaplanır. Çocukta 0,01 büyüme ' +
          'çarpanı PAL’e <b>eklenir</b>, PAL ile çarpılmaz.</p>' +
          '<a class="btn ghost block" href="#/hesapla/yontem">' + icon('table') + ' Yöntem ve tanımlar</a></div>' +
          '<div class="note">Kaynak: ' + esc(r.src) + '. Bu değerler <b>ortalama gereksinimdir (AR)</b>: ' +
          'bir gruba plan yaparken başlangıç noktasıdır, bireyin gerçek gereksinimi ölçüm ve izlemle belirlenir.</div>'
      };
    }
  });
})();
