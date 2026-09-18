/* Besin değişim listesi — derste kullanılan grup değerleri ile öğün planlama */
(function () {
  'use strict';
  const { esc, fmt } = DA;

  /* Bir değişim başına: c = karbonhidrat (g), p = protein (g), f = yağ (g), ex = porsiyon örnekleri.
     Grup değerleri derste kullanılan listeye göredir ve diyabet değişim listesiyle aynıdır. */
  const GROUPS = [
    { k: 'sut', l: 'Süt (tam yağlı)', c: 9, p: 6, f: 6, ex: '1 su bardağı süt (200 ml) veya yoğurt (200 g); 2 su bardağı ayran' },
    { k: 'sutyy', l: 'Süt (yarım yağlı)', c: 9, p: 6, f: 3, ex: 'Aynı porsiyonların yarım yağlısı' },
    { k: 'et', l: 'Et', c: 0, p: 6, f: 5, ex: '1 köfte kadar kırmızı et / tavuk / balık (30 g); 1 dilim beyaz peynir (30 g); 1 adet yumurta' },
    { k: 'eyg', l: 'Ekmek ve yerine geçenler', c: 15, p: 2, f: 0, ex: '1 ince dilim ekmek (25 g); 3 yemek kaşığı pilav / makarna / bulgur; 1 küçük boy haşlanmış patates' },
    { k: 'sebze', l: 'Sebze', c: 6, p: 2, f: 0, ex: '4 yemek kaşığı pişmiş sebze yemeği; 1 kase çiğ salata' },
    { k: 'meyve', l: 'Meyve', c: 15, p: 0, f: 0, ex: '1 küçük boy elma; 1 küçük boy muz; 1 orta boy portakal; 12–15 adet üzüm' },
    { k: 'yag', l: 'Yağ', c: 0, p: 0, f: 5, ex: '1 tatlı kaşığı zeytinyağı; 5 adet zeytin' },
    { k: 'tohum', l: 'Yağlı tohum', c: 0, p: 2, f: 5, ex: '2 tam ceviz; 5–6 adet badem' }
  ];
  const kcalOf = (g) => g.c * 4 + g.p * 4 + g.f * 9;

  function totals(v) {
    const t = { c: 0, p: 0, f: 0, kcal: 0, n: 0 };
    GROUPS.forEach((g) => {
      const n = isFinite(v[g.k]) ? v[g.k] : 0;
      if (!n) return;
      t.c += n * g.c; t.p += n * g.p; t.f += n * g.f; t.kcal += n * kcalOf(g); t.n += n;
    });
    return t;
  }

  /* Grup grup katkı tablosu */
  function breakdown(v, t) {
    const rows = GROUPS.map((g) => {
      const n = isFinite(v[g.k]) ? v[g.k] : 0;
      if (!n) return '';
      return '<tr><td>' + esc(g.l) + '</td><td class="n">' + fmt(n, 1) + '</td><td class="n">' + fmt(n * g.c, 0) + '</td>' +
        '<td class="n">' + fmt(n * g.p, 0) + '</td><td class="n">' + fmt(n * g.f, 0) + '</td><td class="n">' + fmt(n * kcalOf(g), 0) + '</td></tr>';
    }).join('');
    if (!rows) return '';
    return '<div class="scrollx"><table class="t xt"><thead><tr><th>Grup</th><th class="n">Değişim</th><th class="n">KH</th><th class="n">P</th><th class="n">Y</th><th class="n">kcal</th></tr></thead>' +
      '<tbody>' + rows + '</tbody><tfoot><tr><th>Toplam</th><th class="n">' + fmt(t.n, 1) + '</th><th class="n">' + fmt(t.c, 0) + '</th>' +
      '<th class="n">' + fmt(t.p, 0) + '</th><th class="n">' + fmt(t.f, 0) + '</th><th class="n">' + fmt(t.kcal, 0) + '</th></tr></tfoot></table></div>';
  }

  /* Kayıtlı menü hedefi ile karşılaştırma */
  function vsTarget(t) {
    const g = DA.state().targets;
    if (!g || !g.kcal) return '';
    const line = (l, cur, hedef, u) => {
      const d = cur - hedef, pct = hedef ? Math.min(100, cur / hedef * 100) : 0;
      return '<div class="res"><span class="l">' + esc(l) + '</span><span class="v">' + fmt(cur, 0) + ' / ' + fmt(hedef, 0) + ' ' + u +
        '<span class="sub">' + (Math.abs(d) < 0.5 ? 'hedefte' : (d > 0 ? '+' : '−') + fmt(Math.abs(d), 0) + ' ' + u) + '</span></span></div>' +
        '<div class="bar' + (cur > hedef * 1.05 ? ' over' : '') + '"><i style="width:' + (isFinite(pct) ? Math.round(pct) : 0) + '%"></i></div>';
    };
    return '<div class="sect mt">Menü hedefi ile karşılaştırma</div>' +
      line('Enerji', t.kcal, g.kcal, 'kcal') + line('Karbonhidrat', t.c, g.c, 'g') +
      line('Protein', t.p, g.p, 'g') + line('Yağ', t.f, g.f, 'g') +
      '<p class="muted tiny">Hedef, enerji hesaplayıcısındaki “Menü hedefi olarak kaydet” ile güncellenir.</p>';
  }

  /* Porsiyon örnekleri — her grupta 1 değişimin karşılığı */
  function portions() {
    return '<details class="acc mt"><summary>Porsiyon örnekleri (1 değişim)</summary><div class="body">' +
      '<table class="t"><tbody>' + GROUPS.map((g) =>
        '<tr><td><b>' + esc(g.l) + '</b></td><td>' + esc(g.ex) + '</td></tr>').join('') +
      '</tbody></table><p class="muted tiny">Porsiyonlar yaklaşıktır; besinin cinsine ve pişirme yöntemine göre değişir.</p></div></details>';
  }

  let lastText = '';
  DA.actions.shareExchange = () => {
    if (!lastText) return DA.toast('Önce değişim sayılarını gir');
    DA.shareText('Değişim listesi planı', lastText);
  };

  DA.calcs.push({
    id: 'degisim', title: 'Değişim listesi', desc: 'Grup değişimlerinden karbonhidrat, protein, yağ ve enerji', ico: 'table',
    fields: GROUPS.map((g) => ({ k: g.k, l: g.l + ' (' + [g.c ? g.c + ' KH' : '', g.p ? g.p + ' P' : '', g.f ? g.f + ' Y' : ''].filter(Boolean).join(', ') + ' · ' + kcalOf(g) + ' kcal)', t: 'num', ph: '0', opt: true })),
    req: [],
    run(v) {
      const t = totals(v);
      if (!t.n) {
        return { rows: [{ l: 'Toplam', v: '0 kcal', s: 'Gruplara değişim sayısı gir' }],
          html: '<p class="muted small">Her satıra o gruptan kaç değişim verileceğini yaz. Yarım değişim için 0,5 yazabilirsin.</p>' + portions(),
          note: 'Değerler derste kullanılan değişim listesine göredir. Vitamin ve mineral içermez.', tone: 'info' };
      }
      const e = t.kcal || 1;
      const rows = [
        { l: 'Enerji', v: fmt(t.kcal, 0) + ' kcal', s: fmt(t.n, 1) + ' değişim', hl: true },
        { l: 'Karbonhidrat', v: fmt(t.c, 0) + ' g', s: '%' + fmt(t.c * 4 / e * 100, 0) + ' enerji' },
        { l: 'Protein', v: fmt(t.p, 0) + ' g', s: '%' + fmt(t.p * 4 / e * 100, 0) + ' enerji' },
        { l: 'Yağ', v: fmt(t.f, 0) + ' g', s: '%' + fmt(t.f * 9 / e * 100, 0) + ' enerji' },
        { l: 'Karbonhidrat değişimi', v: fmt(t.c / 15, 1), s: '15 g = 1 KH değişimi (karbonhidrat sayımı)' }
      ];
      lastText = 'DEĞİŞİM LİSTESİ PLANI\n' +
        GROUPS.filter((g) => isFinite(v[g.k]) && v[g.k]).map((g) => '• ' + g.l + ': ' + fmt(v[g.k], 1) + ' değişim').join('\n') +
        '\n\nToplam: ' + fmt(t.kcal, 0) + ' kcal · KH ' + fmt(t.c, 0) + ' g · Protein ' + fmt(t.p, 0) + ' g · Yağ ' + fmt(t.f, 0) + ' g';

      return { rows, html: breakdown(v, t) + vsTarget(t) + portions(),
        note: 'Değerler derste kullanılan değişim listesine göredir; kaynaklar arasında küçük farklar olabilir. Vitamin ve mineral içermez.', tone: 'info',
        actions: [{ label: 'Planı paylaş / kopyala', act: 'shareExchange' }] };
    }
  });
})();
