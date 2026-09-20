/* TÜBER 2022 Tablo 3.7–3.8 — Tip 2 diyabet risk anketi (FINDRISC) */
(function () {
  'use strict';
  const { esc, fmt, icon } = DA;

  /* Soru: { k, q, o: [[puan, etiket], …] } · auto: profil/ölçümden hesaplanabilir */
  const Q = [
    { k: 'yas', q: 'Yaş', auto: 'age', o: [[0, '45 yaşın altında'], [2, '45–54 yaş'], [3, '55–64 yaş'], [4, '64 yaşın üzerinde']] },
    { k: 'bki', q: 'Beden kütle indeksi (BKİ)', auto: 'bmi', o: [[0, '25 kg/m² altında'], [1, '25–30 kg/m²'], [3, '30 kg/m² üzerinde']] },
    { k: 'bel', q: 'Bel çevresi', auto: 'wc', o: [] }, // cinsiyete göre doldurulur
    { k: 'egz', q: 'İşte veya boş zamanlarınızda çoğunlukla günde en az 30 dakika egzersiz yapıyor musunuz?', o: [[0, 'Evet'], [2, 'Hayır']] },
    { k: 'sm', q: 'Hangi sıklıkta sebze-meyve tüketiyorsunuz?', o: [[0, 'Her gün'], [1, 'Her gün değil']] },
    { k: 'tan', q: 'Kan basıncı yüksekliği için hiç ilaç kullandınız mı veya sizde yüksek tansiyon bulundu mu?', o: [[0, 'Hayır'], [2, 'Evet']] },
    { k: 'gli', q: 'Daha önce (check-up, hastalık veya gebelik sırasında) kan şekerinizin yüksek veya sınırda olduğu söylendi mi?', o: [[0, 'Hayır'], [5, 'Evet']] },
    { k: 'aile', q: 'Aile bireylerinizden herhangi birine diyabet tanısı konulmuş muydu?',
      o: [[0, 'Hayır'], [3, 'Evet — amca, hala, dayı, teyze, kuzen ya da yeğen (ikinci derece)'], [5, 'Evet — anne, baba, kardeş ya da çocuk (birinci derece)']] }
  ];
  const BEL = {
    E: [[0, '94 cm altında'], [3, '94–102 cm'], [4, '102 cm üzerinde']],
    K: [[0, '80 cm altında'], [3, '80–88 cm'], [4, '88 cm üzerinde']]
  };
  /* Tablo 3.8 — risk skoru */
  const SKOR = [
    { max: 6, l: 'Düşük', p: 1, tone: 'ok' },
    { max: 11, l: 'Hafif', p: 4, tone: 'ok' },
    { max: 14, l: 'Orta', p: 16, tone: 'warn' },
    { max: 20, l: 'Yüksek', p: 33, tone: 'bad' },
    { max: 999, l: 'Çok yüksek', p: 50, tone: 'bad' }
  ];

  const S = () => (DA.state().ui.dr = DA.state().ui.dr || {});
  const sex = () => (DA.state().profile || {}).sex === 'K' ? 'K' : 'E';
  const opts = (q) => (q.k === 'bel' ? BEL[sex()] : q.o);

  function total() {
    let t = 0, n = 0;
    Q.forEach((q) => { const v = S()[q.k]; if (v != null) { t += v; n++; } });
    return { t, n, tam: n === Q.length };
  }
  const band = (t) => SKOR.find((s) => t <= s.max);

  /* Profil ve son ölçümden otomatik doldurulabilen cevaplar */
  function suggest() {
    const p = DA.state().profile || {}, out = {};
    if (p.age > 0) out.yas = p.age < 45 ? 0 : p.age <= 54 ? 2 : p.age <= 64 ? 3 : 4;
    if (p.h > 0 && p.w > 0) { const b = p.w / Math.pow(p.h / 100, 2); out.bki = b < 25 ? 0 : b <= 30 ? 1 : 3; }
    if (p.waist > 0) {
      const b = p.waist;
      out.bel = sex() === 'E' ? (b < 94 ? 0 : b <= 102 ? 3 : 4) : (b < 80 ? 0 : b <= 88 ? 3 : 4);
    }
    return out;
  }

  function outHtml() {
    const { t, n, tam } = total();
    if (!n) return '<div class="card"><div class="empty">' + icon('table') +
      '<div>Soruları yanıtladıkça skor burada görünür.</div></div></div>';
    const b = band(t);
    return '<div class="card">' +
      '<div class="res hl"><span class="l">Toplam skor</span><span class="v">' + t +
      '<span class="sub">' + n + '/' + Q.length + ' soru yanıtlandı</span></span></div>' +
      '<div class="row mt"><span class="badge ' + b.tone + '">' + esc(b.l) + ' risk</span>' +
      '<span class="muted small">10 yıllık tip 2 diyabet riski <b>%' + b.p + '</b></span></div>' +
      (tam ? '' : '<p class="muted tiny mt-s" style="margin-bottom:0">Tüm sorular yanıtlanmadan skor eksiktir.</p>') +
      '</div>' +
      '<div class="scrollx"><table class="t"><thead><tr><th>Toplam skor</th><th>Risk derecesi</th><th class="n">10 yıllık risk</th></tr></thead><tbody>' +
      SKOR.map((s, i) => {
        const lo = i ? SKOR[i - 1].max + 1 : 0;
        return '<tr' + (s === b ? ' class="on"' : '') + '><td>' + (i === 0 ? '7’den az' : i === SKOR.length - 1 ? '20’den fazla' : lo + '–' + s.max) +
          '</td><td>' + esc(s.l) + '</td><td class="n">%' + s.p + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function qHtml() {
    const st = S();
    return Q.map((q, i) => {
      const o = opts(q);
      return '<div class="card"><div class="sect" style="margin-top:0"><span>' + (i + 1) + '. ' + esc(q.q) +
        (q.k === 'bel' ? ' <span class="muted tiny">' + (sex() === 'E' ? 'erkek' : 'kadın') + '</span>' : '') + '</span></div>' +
        '<div class="list">' + o.map((x) =>
          '<button class="li opt' + (st[q.k] === x[0] ? ' on' : '') + '" data-act="drSet" data-k="' + q.k + '" data-v="' + x[0] + '">' +
          '<span class="grow"><div class="t">' + esc(x[1]) + '</div></span><span class="end">' + x[0] + ' puan</span></button>').join('') +
        '</div></div>';
    }).join('');
  }

  DA.calcs.push({
    id: 'diyabetrisk', title: 'Tip 2 diyabet risk anketi', desc: 'FINDRISC — 8 soruda 10 yıllık risk tahmini', ico: 'drop',
    view() {
      const sg = suggest(), st = S();
      const eksik = Object.keys(sg).filter((k) => st[k] == null).length;
      return {
        title: 'Diyabet risk anketi', tab: 'hesapla', back: 'hesapla', ico: 'drop',
        fav: { h: '#/hesapla/diyabetrisk', t: 'Diyabet risk anketi', ico: 'drop' },
        html:
          (eksik ? '<button class="btn sec block mb" data-act="drAuto">' + icon('calc') +
            ' Profilden doldur (' + eksik + ' soru)</button>' : '') +
          '<div id="drOut">' + outHtml() + '</div>' +
          qHtml() +
          '<div class="row between mb"><button class="btn ghost sm" data-act="drReset">Sıfırla</button>' +
          '<button class="btn ghost sm" data-act="drShare">' + icon('share') + ' Sonucu paylaş</button></div>' +
          '<div class="note">Kaynak: TÜBER 2022, Tablo 3.7–3.8 (s. 53). Bu anket bir tarama aracıdır, tanı koymaz. ' +
          'Orta ve üzeri riskte açlık plazma glukozu ve HbA1c ile değerlendirme önerilir.</div>'
      };
    }
  });

  const redraw = () => { const o = DA.$('#drOut'); if (o) o.innerHTML = outHtml(); };

  DA.actions.drSet = (el) => {
    S()[el.dataset.k] = +el.dataset.v; DA.save();
    DA.$$('[data-act=drSet][data-k="' + el.dataset.k + '"]').forEach((b) => b.classList.remove('on'));
    el.classList.add('on');
    redraw();
  };
  DA.actions.drAuto = () => {
    const sg = suggest();
    if (!Object.keys(sg).length) return DA.toast('Önce profile yaş, boy, kilo gir');
    Object.assign(S(), sg); DA.save(); DA.render();
    DA.toast('Yaş, BKİ ve bel çevresi dolduruldu');
  };
  DA.actions.drReset = () => { DA.state().ui.dr = {}; DA.save(); DA.render(); DA.toast('Sıfırlandı'); };
  DA.actions.drShare = () => {
    const { t, tam } = total(), b = band(t);
    DA.shareText('Tip 2 diyabet risk skoru',
      'Tip 2 diyabet risk anketi (TÜBER 2022, Tablo 3.7)\n\n' +
      Q.map((q, i) => { const v = S()[q.k]; const o = opts(q).find((x) => x[0] === v);
        return (i + 1) + '. ' + q.q + '\n   → ' + (o ? o[1] + ' (' + v + ' puan)' : 'yanıtlanmadı'); }).join('\n') +
      '\n\nToplam skor: ' + t + (tam ? '' : ' (eksik)') + '\nRisk derecesi: ' + b.l + ' · 10 yıllık risk %' + b.p +
      '\n\n' + DA.dyt());
  };
})();
