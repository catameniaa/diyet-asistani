/* TÜBER 2022 Ek 4.8 — fiziksel aktivite düzeyi (PAL) rehberi.
   Enerji hesaplayıcısının altında yardım paneli, ayrıca kendi başına bir referans ekranı. */
(function () {
  'use strict';
  const { esc, fmt, icon } = DA;
  const P = () => DA.data.pal;
  const dec = (n) => n.toFixed(2).replace(/0$/, '').replace('.', ','); // 1,2 · 1,39 · 2,0

  /* Bir PAL değeri hangi yaşam biçimi sınıfına düşer? */
  function sinifOf(pal) {
    const S = P().sinif;
    for (let i = 0; i < S.length; i++) if (pal >= S[i].r[0] && pal <= S[i].r[1]) return S[i];
    return pal < S[0].r[0] ? S[0] : S[S.length - 1];
  }
  DA.palSinif = sinifOf;

  function sinifHtml() {
    return P().sinif.map((s) =>
      '<details class="acc"><summary>' + esc(s.l) +
      ' <span class="muted tiny">PAL ' + dec(s.r[0]) + (s.r[1] >= 2.4 ? ' ve üzeri' : '–' + dec(s.r[1])) + '</span></summary>' +
      '<div class="body">' + (s.a
        ? '<ul>' + s.a.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>'
        : s.d.map((d) =>
            (d.t ? '<div class="sect" style="margin-top:6px">' + esc(d.t) + '</div>' : '') +
            '<p>' + esc(d.s) + '</p>' +
            '<ul>' + d.e.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>').join('')) +
      '</div></details>').join('');
  }

  /* Ek 4.8.1/4.8.2 — Türkiye ortalamaları, 1,70 eşik çizgisiyle */
  function ortHtml() {
    const o = P().ort, esik = P().esik;
    const lo = 1.5, hi = 1.95, W = 320, H = 150, L = 34, B = 24;
    const bw = (W - L) / o.yas.length;
    const y = (v) => H - B - (v - lo) / (hi - lo) * (H - B - 12);
    const co = (n) => String(Math.round(n * 10) / 10);
    const bars = (arr, cls) => arr.map((v, i) => {
      const x = L + i * bw + bw * (cls === 'E' ? 0.14 : 0.52), w = bw * 0.34;
      return '<rect class="pb ' + cls + '" x="' + co(x) + '" y="' + co(y(v)) + '" width="' + co(w) +
        '" height="' + co(H - B - y(v)) + '" rx="2"><title>' + (cls === 'E' ? 'Erkek' : 'Kadın') + ' ' + o.yas[i] + ': ' + fmt(v, 2) + '</title></rect>';
    }).join('');

    return '<div class="scrollx"><svg class="palchart" viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Türkiye ortalama PAL değerleri">' +
      [1.5, 1.6, 1.7, 1.8, 1.9].map((g) =>
        '<line class="gl" x1="' + L + '" y1="' + co(y(g)) + '" x2="' + W + '" y2="' + co(y(g)) + '"/>' +
        '<text class="ax" x="' + (L - 4) + '" y="' + co(y(g) + 3) + '" text-anchor="end">' + fmt(g, 1) + '</text>').join('') +
      '<line class="esik" x1="' + L + '" y1="' + co(y(esik)) + '" x2="' + W + '" y2="' + co(y(esik)) + '"/>' +
      bars(o.E, 'E') + bars(o.K, 'K') +
      o.yas.map((t, i) => '<text class="ax" x="' + co(L + i * bw + bw / 2) + '" y="' + (H - B + 12) + '" text-anchor="middle">' + esc(t) + '</text>').join('') +
      '</svg></div>' +
      '<div class="row gap tiny muted mb"><span><i class="sw E"></i> Erkek</span><span><i class="sw K"></i> Kadın</span>' +
      '<span><i class="sw L"></i> Sağlığı koruyan düzey (1,70)</span></div>' +
      '<p class="muted tiny">' + esc(o.n) + '</p>';
  }

  function egzersizHtml() {
    const p = P();
    return '<p class="muted small">PAL düzeyini artırmak için <b>her gün</b> yapılabilecek aktivitelerden biri:</p>' +
      '<table class="t"><tbody>' + p.egzersiz.map((x) => '<tr><td>' + esc(x) + '</td></tr>').join('') + '</tbody></table>' +
      '<p class="muted tiny">' + esc(p.egzersizN) + '</p>';
  }

  DA.pal = {
    sinifOf,
    /* Enerji hesaplayıcısının altındaki yardım paneli */
    helpHtml() {
      if (!DA.data.pal) return '';
      return '<details class="acc"><summary>Hangi PAL’ı seçmeliyim? <span class="muted tiny">TÜBER Ek 4.8.3</span></summary>' +
        '<div class="body">' + sinifHtml() +
        '<p class="muted tiny">' + esc(P().esikN) + '</p>' +
        '<a class="btn ghost block" href="#/hesapla/pal">' + icon('heart') + ' PAL rehberinin tamamı</a></div></details>';
    }
  };

  DA.calcs.push({
    id: 'pal', data: ['pal'], title: 'Fiziksel aktivite düzeyi (PAL)', desc: 'Yaşam biçimi sınıflaması, Türkiye ortalamaları, egzersiz önerileri', ico: 'heart',
    view() {
      const p = P();
      return {
        title: 'Fiziksel aktivite düzeyi', tab: 'hesapla', back: 'hesapla', ico: 'heart',
        fav: { h: '#/hesapla/pal', t: 'PAL rehberi', ico: 'heart' },
        html:
          '<div class="note ok">' + esc(p.esikN) + '</div>' +
          '<div class="sect"><span>Yaşam biçimi sınıflaması <span class="muted tiny">Ek 4.8.3</span></span></div>' +
          sinifHtml() +
          '<div class="sect"><span>Türkiye ortalamaları <span class="muted tiny">Ek 4.8.1–4.8.2</span></span></div>' +
          '<div class="card">' + ortHtml() + '</div>' +
          '<div class="sect"><span>PAL’ı artırmak için <span class="muted tiny">Ek 4.8.4</span></span></div>' +
          '<div class="card">' + egzersizHtml() + '</div>' +
          '<div class="card"><div class="sect" style="margin-top:0"><span>Çocuk ve ergenler</span></div>' +
          '<p class="muted small" style="margin-bottom:0">' + esc(p.cocuk) + '</p></div>' +
          '<div class="note">Kaynak: ' + esc(p.src) + '. PAL, toplam enerji harcamasının dinlenme enerji harcamasına oranıdır; ' +
          'yetişkinde büyüme sonlandığı için toplam enerji gereksinimini belirleyen esas faktördür.</div>'
      };
    }
  });
})();
