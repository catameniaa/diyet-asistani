/* Çocuk büyüme persentilleri (WHO) — z-skoru, persentil ve büyüme eğrisi */
(function () {
  'use strict';
  const { fmt } = DA;

  const IND = {
    wfa: { t: 'Ağırlık / yaş', unit: 'kg', src: 'w', wt: true },
    hfa: { t: 'Boy / yaş', unit: 'cm', src: 'h', wt: false },
    bmi: { t: 'BKİ / yaş', unit: 'kg/m²', src: 'bmi', wt: true }
  };

  const tbl = (ind, sex) => (DA.data.growth || {})[ind + '_' + (sex === 'K' ? 'f' : 'm')];
  function lms(ind, sex, mo) {
    const t = tbl(ind, sex);
    const i = mo - t.a0;
    return (i >= 0 && i < t.v.length) ? t.v[i] : null;
  }
  const maxMonth = (ind, sex) => { const t = tbl(ind, sex); return t.a0 + t.v.length - 1; };

  /* LMS'ten ölçüm değeri: X = M(1 + LSz)^(1/L), L=0 ise X = M·e^(Sz) */
  function valueAt(p, z) {
    const L = p[0], M = p[1], S = p[2];
    return L === 0 ? M * Math.exp(S * z) : M * Math.pow(1 + L * S * z, 1 / L);
  }
  /* Ölçümden z: WHO yöntemi. Ağırlığa dayalı göstergelerde |z|>3 için uç değer düzeltmesi. */
  function zOf(x, p, weightBased) {
    const L = p[0], M = p[1], S = p[2];
    let z = L === 0 ? Math.log(x / M) / S : (Math.pow(x / M, L) - 1) / (L * S);
    if (weightBased && z > 3) {
      const s3 = valueAt(p, 3);
      z = 3 + (x - s3) / (s3 - valueAt(p, 2));
    } else if (weightBased && z < -3) {
      const s3 = valueAt(p, -3);
      z = -3 + (x - s3) / (valueAt(p, -2) - s3);
    }
    return z;
  }
  /* Standart normal dağılım fonksiyonu (Abramowitz–Stegun 7.1.26) */
  function phi(z) {
    const s = z < 0 ? -1 : 1, a = Math.abs(z) / Math.SQRT2;
    const t = 1 / (1 + 0.3275911 * a);
    const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
    return 0.5 * (1 + s * y);
  }
  const pctText = (z) => {
    const p = phi(z) * 100;
    if (p < 0.1) return '<%0,1';
    if (p > 99.9) return '>%99,9';
    return '%' + fmt(p, p < 1 || p > 99 ? 2 : 1);
  };

  /* WHO yorum eşikleri */
  function cat(ind, z, mo) {
    if (ind === 'hfa') {
      if (z < -3) return ['Ağır bodurluk', 'bad'];
      if (z < -2) return ['Bodurluk (stunting)', 'warn'];
      if (z > 3) return ['Boy beklenenin çok üstünde', 'info'];
      return ['Normal', 'ok'];
    }
    if (ind === 'wfa') {
      if (z < -3) return ['Ağır düşük ağırlık', 'bad'];
      if (z < -2) return ['Düşük ağırlık (underweight)', 'warn'];
      if (z > 2) return ['Yüksek — BKİ/yaş ile değerlendir', 'info'];
      return ['Normal', 'ok'];
    }
    /* BKİ/yaş: 0–60 ayda ve 5–19 yaşta eşikler farklıdır */
    if (mo <= 60) {
      if (z > 3) return ['Obez', 'bad'];
      if (z > 2) return ['Kilolu', 'warn'];
      if (z > 1) return ['Kilo fazlalığı riski', 'warn'];
      if (z < -3) return ['Ağır zayıflık', 'bad'];
      if (z < -2) return ['Zayıflık (wasting)', 'warn'];
      return ['Normal', 'ok'];
    }
    if (z > 2) return ['Obez', 'bad'];
    if (z > 1) return ['Fazla kilolu', 'warn'];
    if (z < -3) return ['Ağır zayıflık', 'bad'];
    if (z < -2) return ['Zayıflık', 'warn'];
    return ['Normal', 'ok'];
  }

  /* Büyüme eğrisi: seçili göstergenin −3/−2/0/+2/+3 SD çizgileri, çocuğun noktası
     ve (verilirse) önceki ölçümlerden oluşan seyri. trail = [{mo, v}, ...] */
  function chart(ind, sex, mo, x, trail) {
    const t = tbl(ind, sex), hi = maxMonth(ind, sex);
    const a = mo <= 60 ? 0 : 61, b = mo <= 60 ? Math.min(60, hi) : hi;
    if (mo < a || mo > b) return '';
    const W = 320, H = 200, L = 34, R = 8, T = 10, B = 26;
    const zs = [-3, -2, 0, 2, 3];
    let lo = Infinity, up = -Infinity;
    const pts = {};
    zs.forEach((z) => {
      pts[z] = [];
      for (let m = a; m <= b; m++) {
        const p = t.v[m - t.a0];
        if (!p) continue;
        const v = valueAt(p, z);
        lo = Math.min(lo, v); up = Math.max(up, v);
        pts[z].push([m, v]);
      }
    });
    const tr = (trail || []).filter((t) => t.mo >= a && t.mo <= b && isFinite(t.v));
    lo = Math.min(lo, x); up = Math.max(up, x);
    tr.forEach((t) => { lo = Math.min(lo, t.v); up = Math.max(up, t.v); });
    const pad = (up - lo) * 0.06; lo -= pad; up += pad;
    const px = (m) => L + (m - a) / (b - a) * (W - L - R);
    const py = (v) => T + (up - v) / (up - lo) * (H - T - B);
    /* SVG koordinatı her zaman nokta ondalıklı olmalı; DA.fmt yerel biçimde virgül üretir */
    const co = (n) => String(Math.round(n * 10) / 10);
    const path = (z) => pts[z].map((p, i) => (i ? 'L' : 'M') + co(px(p[0])) + ' ' + co(py(p[1]))).join('');
    const yrs = [];
    for (let m = a; m <= b; m += (b - a) > 72 ? 24 : 12) yrs.push(m);
    const label = (m) => (m % 12 === 0 ? (m / 12) + 'y' : m + 'a');
    const ticks = 4, ylab = [];
    for (let i = 0; i <= ticks; i++) ylab.push(lo + (up - lo) * i / ticks);
    return '<svg class="chart gchart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Büyüme eğrisi">' +
      ylab.map((v) => '<line class="grid" x1="' + L + '" y1="' + co(py(v)) + '" x2="' + (W - R) + '" y2="' + co(py(v)) + '"/>' +
        '<text x="' + (L - 5) + '" y="' + co(py(v) + 3) + '" text-anchor="end">' + fmt(v, up - lo > 30 ? 0 : 1) + '</text>').join('') +
      yrs.map((m) => '<text x="' + co(px(m)) + '" y="' + (H - 4) + '" text-anchor="middle">' + label(m) + '</text>').join('') +
      zs.map((z) => '<path class="sd' + (z === 0 ? ' med' : (Math.abs(z) === 3 ? ' s3' : '')) + '" d="' + path(z) + '"/>').join('') +
      (tr.length > 1 ? '<path class="trail" d="' + tr.map((t, i) => (i ? 'L' : 'M') + co(px(t.mo)) + ' ' + co(py(t.v))).join('') + '"/>' : '') +
      tr.map((t) => '<circle class="tdot" cx="' + co(px(t.mo)) + '" cy="' + co(py(t.v)) + '" r="3"/>').join('') +
      '<circle class="dot" cx="' + co(px(mo)) + '" cy="' + co(py(x)) + '" r="4.5"/>' +
      '</svg>' +
      '<p class="muted tiny center">Çizgiler yukarıdan aşağıya +3, +2, medyan (0), −2, −3 SD. Nokta = çocuğun ölçümü.</p>';
  }

  DA.calcs.push({
    id: 'cocuk', data: ['growth'], title: 'Çocuk persentil (WHO)', desc: 'Ağırlık/yaş, boy/yaş, BKİ/yaş — z-skoru ve persentil', ico: 'users',
    fields: [
      { k: 'sex', l: 'Cinsiyet', t: 'sex' },
      { k: 'age', l: 'Yaş', t: 'num', ph: 'örn. 30', rng: false },
      { k: 'unit', l: 'Yaş birimi', t: 'sel', o: [['ay', 'Ay'], ['yil', 'Yıl']], def: 'ay' },
      { k: 'w', l: 'Ağırlık (kg)', t: 'num', ph: '', opt: true },
      { k: 'h', l: 'Boy (cm)', t: 'num', ph: '', opt: true },
      { k: 'show', l: 'Eğride gösterilecek', t: 'sel', o: [['bmi', 'BKİ / yaş'], ['wfa', 'Ağırlık / yaş'], ['hfa', 'Boy / yaş']], def: 'bmi' }
    ],
    req: ['age'],
    run(v) {
      const mo = Math.floor(v.unit === 'yil' ? v.age * 12 : v.age);
      if (!(mo >= 0)) return { err: 'Yaş 0 veya daha büyük olmalı.' };
      if (mo > 228) return { err: 'WHO büyüme referansı 19 yaşa (228 ay) kadardır. Bu yaş için yetişkin BKİ hesaplayıcısını kullan.' };
      const haveW = isFinite(v.w) && v.w > 0, haveH = isFinite(v.h) && v.h > 0;
      if (!haveW && !haveH) return { err: 'En az ağırlık ya da boy gir.' };

      const bmi = (haveW && haveH) ? v.w / Math.pow(v.h / 100, 2) : NaN;
      const vals = { w: haveW ? v.w : NaN, h: haveH ? v.h : NaN, bmi };
      const rows = [], skipped = [];
      let badge = null, shownZ = {};

      Object.keys(IND).forEach((k) => {
        const d = IND[k], x = vals[d.src];
        if (!isFinite(x)) return;
        const p = lms(k, v.sex, mo);
        if (!p) { skipped.push(d.t + ' (' + Math.floor(maxMonth(k, v.sex) / 12) + ' yaşa kadar)'); return; }
        const z = zOf(x, p, d.wt);
        const c = cat(k, z, mo);
        shownZ[k] = z;
        rows.push({ l: d.t, v: 'z = ' + fmt(z, 2), s: pctText(z) + ' persentil · ' + c[0] + ' · medyan ' + fmt(p[1], 1) + ' ' + d.unit, hl: k === v.show });
        if (k === 'bmi') badge = c;
      });
      if (!rows.length) return { err: 'Bu yaş için uygun WHO referansı yok.' };
      if (!badge && shownZ.wfa != null) badge = cat('wfa', shownZ.wfa, mo);

      if (isFinite(bmi)) rows.unshift({ l: 'BKİ', v: fmt(bmi, 1) + ' kg/m²', s: fmt(mo / 12, 1) + ' yaş (' + mo + ' ay)' });

      const show = IND[v.show] && isFinite(vals[IND[v.show].src]) && lms(v.show, v.sex, mo) ? v.show : Object.keys(shownZ)[0];
      const html = show ? chart(show, v.sex, mo, vals[IND[show].src]) : '';

      let note = 'z-skoru tamamlanmış ay üzerinden, WHO tablolarındaki LMS katsayıları ile hesaplanır. Kaynak: 0–60 ay WHO Child Growth Standards (2006), 61 ay ve üzeri WHO Growth Reference (2007).';
      if (mo < 24) note += ' 24 aydan küçük çocukta boy yatarak (uzunluk) ölçülür.';
      if (skipped.length) note += ' Bu yaşta hesaplanamayan gösterge: ' + skipped.join(', ') + '.';
      return { rows, badge, html, note, tone: 'info' };
    }
  });

  /* Diğer modüllerin (danışan takibi) kullanması için */
  DA.growth = {
    IND: IND,
    z: (ind, sex, mo, x) => { const p = lms(ind, sex, mo); return p ? zOf(x, p, IND[ind].wt) : NaN; },
    cat: cat, pct: pctText, chart: chart, maxMonth: maxMonth, lms: lms,
    /* iki tarih arasındaki tamamlanmış ay sayısı */
    months: (birthISO, onISO) => {
      if (!birthISO) return NaN;
      const b = new Date(birthISO + 'T00:00'), o = new Date((onISO || DA.today()) + 'T00:00');
      if (isNaN(b) || isNaN(o) || o < b) return NaN;
      let m = (o.getFullYear() - b.getFullYear()) * 12 + (o.getMonth() - b.getMonth());
      if (o.getDate() < b.getDate()) m -= 1;
      return m;
    }
  };
})();
