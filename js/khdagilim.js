/* Günlük karbonhidrat hedefini öğünlere dağıtma.
   Yüzdeler ayarlanabilir; her öğün gram, KH değişimi (15 g) ve insülin bolusu olarak gösterilir. */
(function () {
  'use strict';
  const { esc, fmt, icon } = DA;

  const OGUN = [['kahvalti', 'Kahvaltı', 25], ['ara1', 'Ara öğün (kuşluk)', 10], ['ogle', 'Öğle', 30],
    ['ara2', 'Ara öğün (ikindi)', 10], ['aksam', 'Akşam', 20], ['ara3', 'Ara öğün (gece)', 5]];

  const S = () => {
    const u = DA.state().ui;
    if (!u.khd) {
      const t = DA.state().targets;
      u.khd = { kh: (t && t.c) ? Math.round(t.c) : 200, ikh: 0, pay: {} };
      OGUN.forEach((o) => { u.khd.pay[o[0]] = o[2]; });
    }
    return u.khd;
  };
  const toplamPay = () => OGUN.reduce((a, o) => a + (DA.num(S().pay[o[0]]) || 0), 0);

  function tabloHtml() {
    const st = S(), kh = DA.num(st.kh) || 0, tp = toplamPay(), ikh = DA.num(st.ikh) || 0;
    const rows = OGUN.map((o) => {
      const p = DA.num(st.pay[o[0]]) || 0;
      const g = tp ? kh * p / tp : 0;   /* paylar oran kabul edilir; toplam her zaman hedefe eşitlenir */
      return '<tr><td>' + esc(o[1]) + '</td>' +
        '<td class="n">%' + fmt(p, 0) + '</td>' +
        '<td class="n"><b>' + fmt(g, 0) + '</b> g</td>' +
        '<td class="n">' + fmt(g / 15, 1) + '</td>' +
        (ikh > 0 ? '<td class="n">' + fmt(g / ikh, 1) + ' Ü</td>' : '') + '</tr>';
    }).join('');
    return '<div class="scrollx"><table class="t xt"><thead><tr><th>Öğün</th><th class="n">Pay</th>' +
      '<th class="n">KH</th><th class="n">Değişim</th>' + (ikh > 0 ? '<th class="n">Bolus</th>' : '') +
      '</tr></thead><tbody>' + rows + '</tbody>' +
      '<tfoot><tr><th>Toplam</th><th class="n">%' + fmt(tp, 0) + '</th>' +
      '<th class="n">' + fmt(tp ? kh : 0, 0) + ' g</th><th class="n">' + fmt(kh / 15, 1) + '</th>' +
      (ikh > 0 ? '<th class="n">' + fmt(kh / ikh, 1) + ' Ü</th>' : '') + '</tr></tfoot></table></div>' +
      (Math.abs(tp - 100) > 0.5 ? '<div class="note warn">Payların toplamı %' + fmt(tp, 0) +
        '. Gramlar yine de günlük hedefe eşitleniyor: paylar birbirine oran olarak uygulanır. ' +
        'Yüzde olarak okumak istersen %100’e tamamla.' +
        '<button class="btn sm block" style="margin-top:10px" data-act="khdEsitle">Varsayılan dağılıma dön</button></div>' : '');
  }

  function payHtml() {
    const st = S();
    return '<div class="card"><div class="sect" style="margin-top:0">Öğün payları (%)</div>' +
      OGUN.map((o) => '<div class="xrow"><span class="grow">' + esc(o[1]) + '</span>' +
        '<input type="text" inputmode="numeric" style="width:72px;text-align:right" name="' + o[0] +
        '" value="' + esc(st.pay[o[0]]) + '" data-live="khdPay"></div>').join('') +
      '<button class="btn ghost block mt-s" data-act="khdEsitle">Varsayılana dön (25·10·30·10·20·5)</button></div>';
  }

  DA.calcs.push({
    id: 'khdagilim', title: 'Öğün başına karbonhidrat', desc: 'Günlük KH hedefini öğünlere böl, değişim ve bolus karşılığı', ico: 'drop',
    view() {
      const st = S();
      return {
        title: 'Öğün başına karbonhidrat', tab: 'hesapla', back: 'hesapla', ico: 'drop',
        fav: { h: '#/hesapla/khdagilim', t: 'Öğün başına KH', ico: 'drop' },
        html:
          '<div class="card"><div class="grid2">' +
          '<label class="fld"><span>Günlük KH hedefi (g)</span><input type="text" inputmode="numeric" name="kh" value="' +
          esc(st.kh) + '" data-live="khd"></label>' +
          '<label class="fld"><span>İ:KH oranı (varsa)</span><input type="text" inputmode="decimal" name="ikh" value="' +
          esc(st.ikh || '') + '" placeholder="1 Ü / … g" data-live="khd"></label></div>' +
          '<p class="muted tiny" style="margin-bottom:0">İ:KH oranını girersen her öğünün bolus karşılığı da çıkar. ' +
          'Oranı bilmiyorsan karbonhidrat sayımı ekranından hesaplayabilirsin.</p></div>' +
          '<div id="khdOut" aria-live="polite" aria-label="Öğün dağılımı">' + tabloHtml() + '</div>' +
          payHtml() +
          '<div class="row between mb"><a class="btn ghost sm" href="#/hesapla/khsayim">' + icon('calc') + ' Karbonhidrat sayımı</a>' +
          '<button class="btn ghost sm" data-act="khdShare">' + icon('share') + ' Planı paylaş</button></div>' +
          '<div class="note">1 karbonhidrat değişimi = 15 g. Öğün payları hastanın alışkanlığına, insülin rejimine ve ' +
          'hekim planına göre değiştirilir; buradaki varsayılanlar yalnızca başlangıç noktasıdır.</div>'
      };
    }
  });

  const ciz = () => { const o = DA.$('#khdOut'); if (o) o.innerHTML = tabloHtml(); };
  DA.live.khd = (el) => { S()[el.name] = el.value; DA.save(); ciz(); };
  DA.live.khdPay = (el) => { S().pay[el.name] = el.value; DA.save(); ciz(); };
  DA.actions.khdEsitle = () => { const st = S(); OGUN.forEach((o) => { st.pay[o[0]] = o[2]; }); DA.save(); DA.render(); };
  DA.actions.khdShare = () => {
    const st = S(), kh = DA.num(st.kh) || 0, tp = toplamPay(), ikh = DA.num(st.ikh) || 0;
    DA.shareText('Öğün başına karbonhidrat planı',
      'Günlük karbonhidrat hedefi: ' + fmt(kh, 0) + ' g (' + fmt(kh / 15, 1) + ' değişim)\n\n' +
      OGUN.map((o) => {
        const p = DA.num(st.pay[o[0]]) || 0, g = tp ? kh * p / tp : 0;
        return '• ' + o[1] + ': ' + fmt(g, 0) + ' g · ' + fmt(g / 15, 1) + ' değişim' +
          (ikh > 0 ? ' · ' + fmt(g / ikh, 1) + ' Ü bolus' : '') + ' (%' + fmt(p, 0) + ')';
      }).join('\n') + '\n\n1 karbonhidrat değişimi = 15 g.\n\n' + DA.dyt());
  };
})();
