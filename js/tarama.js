/* Malnütrisyon tarama araçları — NRS-2002, MUST ve MNA-SF.
   Üçü de aynı kalıpta: sorular → puan → risk bandı. Profil/danışan bilgisinden
   BKİ ve yaş otomatik hesaplanır; kullanıcı istediği zaman üzerine yazabilir. */
(function () {
  'use strict';
  const { esc, fmt, icon } = DA;

  const S = (id) => { const u = DA.state().ui; u.tara = u.tara || {}; return (u.tara[id] = u.tara[id] || {}); };

  /* Profil ya da açık danışandan BKİ */
  function bkiOf() {
    const p = DA.state().profile || {};
    if (!(p.h > 0 && p.w > 0)) return null;
    return p.w / Math.pow(p.h / 100, 2);
  }
  const yasOf = () => (DA.state().profile || {}).age || null;

  /* ---- ortak çizim ---- */
  function sorularHtml(T, st) {
    return T.q.map((q, i) => {
      const o = typeof q.o === 'function' ? q.o() : q.o;
      return '<div class="card"><div class="sect" style="margin-top:0"><span>' + (i + 1) + '. ' + esc(q.q) +
        (q.n ? ' <span class="muted tiny">' + esc(q.n) + '</span>' : '') + '</span></div>' +
        '<div class="list">' + o.map((x) =>
          '<button class="li opt' + (st[q.k] === x[0] ? ' on' : '') + '" data-act="taraSet" data-t="' + T.id +
          '" data-k="' + q.k + '" data-v="' + x[0] + '">' +
          '<span class="grow"><div class="t">' + esc(x[1]) + '</div>' +
          (x[2] ? '<div class="s">' + esc(x[2]) + '</div>' : '') + '</span>' +
          '<span class="end">' + x[0] + ' puan</span></button>').join('') + '</div></div>';
    }).join('');
  }

  function toplam(T, st) {
    let t = 0, n = 0;
    T.q.forEach((q) => { if (st[q.k] != null) { t += st[q.k]; n++; } });
    (T.ek || []).forEach((e) => { const x = e(st); if (x) t += x.p; });
    return { t, n, tam: n === T.q.length };
  }

  function sonucHtml(T) {
    const st = S(T.id), { t, n, tam } = toplam(T, st);
    if (!n) return '<div class="card"><div class="empty">' + icon('table') +
      '<div>Soruları yanıtladıkça puan burada görünür.</div></div></div>';
    const b = T.band.find((x) => t <= x.max) || T.band[T.band.length - 1];
    const eklar = (T.ek || []).map((e) => e(st)).filter(Boolean);
    return '<div class="card">' +
      '<div class="res hl"><span class="l">Toplam puan</span><span class="v">' + t +
      '<span class="sub">' + n + '/' + T.q.length + ' soru yanıtlandı</span></span></div>' +
      (eklar.length ? '<p class="muted tiny mt-s">' + eklar.map((e) => esc(e.n)).join(' · ') + '</p>' : '') +
      '<div class="row mt"><span class="badge ' + b.tone + '">' + esc(b.l) + '</span></div>' +
      '<p class="small" style="margin:8px 0 0">' + esc(b.ne) + '</p>' +
      (tam ? '' : '<p class="muted tiny" style="margin-bottom:0">Tüm sorular yanıtlanmadan puan eksiktir.</p>') +
      '</div>' +
      '<div class="scrollx"><table class="t"><thead><tr><th>Puan</th><th>Değerlendirme</th></tr></thead><tbody>' +
      T.band.map((x, i) => {
        const lo = i ? T.band[i - 1].max + 1 : 0;
        return '<tr' + (x === b ? ' class="on"' : '') + '><td>' + (i === T.band.length - 1 ? lo + ' ve üzeri' : lo + '–' + x.max) +
          '</td><td>' + esc(x.l) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function kur(T) {
    DA.calcs.push({
      id: T.id, title: T.t, desc: T.d, ico: T.ico,
      view() {
        const st = S(T.id);
        return {
          title: T.kisa, tab: 'hesapla', back: 'hesapla', ico: T.ico,
          fav: { h: '#/hesapla/' + T.id, t: T.kisa, ico: T.ico },
          html:
            (T.ust ? T.ust() : '') +
            '<div id="taraOut" role="region" aria-live="polite" aria-label="Tarama sonucu">' + sonucHtml(T) + '</div>' +
            sorularHtml(T, st) +
            '<div class="row between mb"><button class="btn ghost sm" data-act="taraReset" data-t="' + T.id + '">Sıfırla</button>' +
            '<button class="btn ghost sm" data-act="taraShare" data-t="' + T.id + '">' + icon('share') + ' Sonucu paylaş</button></div>' +
            '<div class="note">' + T.not + '</div>'
        };
      }
    });
    TOOLS[T.id] = T;
  }
  const TOOLS = {};

  /* ---------------- NRS-2002 ---------------- */
  const NRS = {
    id: 'nrs', kisa: 'NRS-2002', t: 'NRS-2002 malnütrisyon taraması',
    d: 'Yatan hastada beslenme riski; beslenme durumu + hastalık şiddeti + yaş', ico: 'flask',
    ust: () => {
      const b = bkiOf();
      return '<div class="note">Önce ön tarama: BKİ &lt;20,5 · son 3 ayda kilo kaybı · son 1 haftada alımda azalma · ağır hastalık. ' +
        'Bunlardan <b>biri bile</b> varsa aşağıdaki ana tarama uygulanır.' +
        (b ? '<br><span class="small">Profildeki BKİ: <b>' + fmt(b, 1) + ' kg/m²</b></span>' : '') + '</div>';
    },
    q: [
      { k: 'bes', q: 'Beslenme durumunun bozulması', o: [
        [0, 'Yok — normal beslenme durumu'],
        [1, 'Hafif', '3 ayda >%5 kilo kaybı VEYA son haftada gereksinimin %50-75’i kadar alım'],
        [2, 'Orta', '2 ayda >%5 kilo kaybı VEYA BKİ 18,5-20,5 + genel durum bozukluğu VEYA gereksinimin %25-60’ı'],
        [3, 'Ağır', '1 ayda >%5 kilo kaybı (3 ayda >%15) VEYA BKİ <18,5 + genel durum bozukluğu VEYA gereksinimin %0-25’i']] },
      { k: 'hst', q: 'Hastalık şiddeti (stres metabolizması)', o: [
        [0, 'Yok — normal besin gereksinimi'],
        [1, 'Hafif', 'Kalça kırığı; akut komplikasyonlu kronik hastalıklar: siroz, KOAH, kronik hemodiyaliz, diyabet, onkoloji'],
        [2, 'Orta', 'Majör abdominal cerrahi, inme, ağır pnömoni, hematolojik malignite'],
        [3, 'Ağır', 'Kafa travması, kemik iliği nakli, yoğun bakım hastası (APACHE >10)']] }
    ],
    ek: [(st) => { const y = yasOf(); return (y && y >= 70) ? { p: 1, n: 'Yaş ≥70 için +1 puan eklendi (' + y + ' yaş)' } : null; }],
    band: [
      { max: 2, l: 'Risk yok', tone: 'ok', ne: 'Beslenme riski düşük. Hastanın durumu değişirse haftalık olarak yeniden taranır.' },
      { max: 99, l: 'Beslenme riski var', tone: 'bad', ne: 'Toplam ≥3: beslenme desteği planlanır ve beslenme tedavisi başlatılır.' }
    ],
    not: 'Kaynak: Kondrup J ve ark., ESPEN Guidelines for Nutrition Screening 2002. Yaş ≥70 ise toplam puana 1 eklenir. ' +
      'Tarama aracıdır; tanı ve tedavi kararı klinik değerlendirmeyle birlikte verilir.'
  };

  /* ---------------- MUST ---------------- */
  const MUST = {
    id: 'must', kisa: 'MUST', t: 'MUST malnütrisyon taraması',
    d: 'BKİ + istemsiz kilo kaybı + akut hastalık etkisi', ico: 'flask',
    ust: () => {
      const b = bkiOf();
      return b ? '<div class="note ok">Profildeki BKİ <b>' + fmt(b, 1) + ' kg/m²</b> → 1. adım için ' +
        '<b>' + (b > 20 ? 0 : b >= 18.5 ? 1 : 2) + ' puan</b>.</div>' : '';
    },
    q: [
      { k: 'bki', q: 'Beden kitle indeksi', n: '1. adım', o: [
        [0, 'BKİ > 20 kg/m²'], [1, 'BKİ 18,5 – 20 kg/m²'], [2, 'BKİ < 18,5 kg/m²']] },
      { k: 'kilo', q: 'Son 3–6 ayda istemsiz kilo kaybı', n: '2. adım', o: [
        [0, '%5’ten az'], [1, '%5 – 10'], [2, '%10’dan fazla']] },
      { k: 'akut', q: 'Akut hastalık etkisi', n: '3. adım', o: [
        [0, 'Yok'], [2, 'Akut hastalık var ve >5 gün besin alımı yok / olmayacak']] }
    ],
    band: [
      { max: 0, l: 'Düşük risk', tone: 'ok', ne: 'Rutin klinik bakım. Hastanede haftalık, bakımevinde aylık, toplumda yılda bir yeniden tarama.' },
      { max: 1, l: 'Orta risk', tone: 'warn', ne: 'Gözlem: 3 gün besin ve sıvı alımı kaydedilir. Alım yeterliyse izleme sürer, yetersizse beslenme planı yapılır.' },
      { max: 99, l: 'Yüksek risk', tone: 'bad', ne: 'Tedavi: diyetisyene yönlendirilir, beslenme desteği başlatılır, alım izlenir ve plan gözden geçirilir.' }
    ],
    not: 'Kaynak: BAPEN Malnutrition Universal Screening Tool (MUST). Boy ölçülemiyorsa diz yüksekliği veya ulna uzunluğundan tahmin edilir.'
  };

  /* ---------------- MNA-SF ---------------- */
  const MNA = {
    id: 'mnasf', kisa: 'MNA-SF', t: 'MNA-SF (yaşlıda beslenme taraması)',
    d: '65 yaş üstü için kısa beslenme değerlendirmesi, 14 puan', ico: 'flask',
    ust: () => {
      const b = bkiOf(), y = yasOf();
      return '<div class="note">65 yaş ve üzeri için geliştirilmiştir.' +
        (y ? ' Profildeki yaş: <b>' + y + '</b>.' : '') +
        (b ? ' BKİ <b>' + fmt(b, 1) + '</b> → F sorusunda ' +
          '<b>' + (b < 19 ? 0 : b < 21 ? 1 : b < 23 ? 2 : 3) + ' puan</b>.' : '') +
        ' BKİ ölçülemiyorsa F yerine baldır çevresi kullanılır (<31 cm = 0, ≥31 cm = 3).</div>';
    },
    q: [
      { k: 'a', q: 'Son 3 ayda iştah azalması, sindirim sorunu, çiğneme veya yutma güçlüğü nedeniyle besin alımında azalma', n: 'A', o: [
        [0, 'Şiddetli azalma'], [1, 'Orta derecede azalma'], [2, 'Azalma yok']] },
      { k: 'b', q: 'Son 3 ayda kilo kaybı', n: 'B', o: [
        [0, '3 kg’dan fazla'], [1, 'Bilmiyor'], [2, '1 – 3 kg arası'], [3, 'Kilo kaybı yok']] },
      { k: 'c', q: 'Hareket durumu', n: 'C', o: [
        [0, 'Yatağa veya sandalyeye bağımlı'], [1, 'Yataktan çıkabiliyor ama dışarı çıkamıyor'], [2, 'Dışarı çıkabiliyor']] },
      { k: 'd', q: 'Son 3 ayda psikolojik stres veya akut hastalık geçirdi mi?', n: 'D', o: [
        [0, 'Evet'], [2, 'Hayır']] },
      { k: 'e', q: 'Nöropsikolojik sorun', n: 'E', o: [
        [0, 'Ağır demans veya depresyon'], [1, 'Hafif demans'], [2, 'Sorun yok']] },
      { k: 'f', q: 'Beden kitle indeksi (yoksa baldır çevresi)', n: 'F', o: [
        [0, 'BKİ < 19 · veya baldır çevresi < 31 cm'], [1, 'BKİ 19 – 21'], [2, 'BKİ 21 – 23'],
        [3, 'BKİ ≥ 23 · veya baldır çevresi ≥ 31 cm']] }
    ],
    band: [
      { max: 7, l: 'Malnütrisyonlu', tone: 'bad', ne: 'Beslenme tedavisi gerekir. Ayrıntılı değerlendirme (tam MNA) ve beslenme planı yapılır.' },
      { max: 11, l: 'Malnütrisyon riski altında', tone: 'warn', ne: 'Beslenme müdahalesi düşünülür; alım izlenir ve 3 ayda bir yeniden taranır.' },
      { max: 99, l: 'Normal beslenme durumu', tone: 'ok', ne: 'Malnütrisyon yok. Yılda bir ya da durum değiştiğinde yeniden taranır.' }
    ],
    not: 'Kaynak: Nestlé Nutrition Institute, Mini Nutritional Assessment — Short Form (MNA-SF). Toplam 14 puan üzerinden değerlendirilir.'
  };

  [NRS, MUST, MNA].forEach(kur);

  /* ---- etkileşim ---- */
  const ciz = (id) => { const o = DA.$('#taraOut'); if (o) o.innerHTML = sonucHtml(TOOLS[id]); };
  DA.actions.taraSet = (el) => {
    const id = el.dataset.t;
    S(id)[el.dataset.k] = +el.dataset.v; DA.save();
    DA.$$('[data-act=taraSet][data-t="' + id + '"][data-k="' + el.dataset.k + '"]').forEach((x) => x.classList.remove('on'));
    el.classList.add('on');
    ciz(id);
  };
  DA.actions.taraReset = (el) => { DA.state().ui.tara[el.dataset.t] = {}; DA.save(); DA.render(); DA.toast('Sıfırlandı'); };
  DA.actions.taraShare = (el) => {
    const T = TOOLS[el.dataset.t], st = S(T.id), { t, tam } = toplam(T, st);
    const b = T.band.find((x) => t <= x.max) || T.band[T.band.length - 1];
    DA.shareText(T.kisa + ' sonucu',
      T.t + '\n\n' + T.q.map((q, i) => {
        const o = (typeof q.o === 'function' ? q.o() : q.o).find((x) => x[0] === st[q.k]);
        return (i + 1) + '. ' + q.q + '\n   → ' + (o ? o[1] + ' (' + o[0] + ' puan)' : 'yanıtlanmadı');
      }).join('\n') +
      (T.ek || []).map((e) => { const x = e(st); return x ? '\n' + x.n : ''; }).join('') +
      '\n\nToplam puan: ' + t + (tam ? '' : ' (eksik)') + '\nDeğerlendirme: ' + b.l + '\n' + b.ne +
      '\n\n' + DA.dyt());
  };
})();
