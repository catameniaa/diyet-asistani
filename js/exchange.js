/* Besin değişim listesi — sayaçlı giriş, otomatik dağıtım, porsiyon örnekleri */
(function () {
  'use strict';
  const { esc, fmt, num, icon } = DA;

  /* Bir değişim başına: c = karbonhidrat (g), p = protein (g), f = yağ (g), ex = porsiyon örnekleri.
     Grup değerleri derste kullanılan listeye göredir ve diyabet değişim listesiyle aynıdır.
     lo/hi = otomatik dağıtımda aranan makul aralık. */
  const GROUPS = [
    { k: 'sut', l: 'Süt (tam yağlı)', c: 9, p: 6, f: 6, lo: 1, hi: 3, ex: '1 su bardağı süt (200 ml) veya yoğurt (200 g); 2 su bardağı ayran' },
    { k: 'sutyy', l: 'Süt (yarım yağlı)', c: 9, p: 6, f: 3, lo: 0, hi: 0, ex: 'Aynı porsiyonların yarım yağlısı' },
    { k: 'et', l: 'Et', c: 0, p: 6, f: 5, lo: 2, hi: 8, ex: '1 köfte kadar kırmızı et / tavuk / balık (30 g); 1 dilim beyaz peynir (30 g); 1 adet yumurta' },
    { k: 'eyg', l: 'Ekmek ve yerine geçenler', c: 15, p: 2, f: 0, lo: 3, hi: 14, ex: '1 ince dilim ekmek (25 g); 3 yemek kaşığı pilav / makarna / bulgur; 1 küçük boy haşlanmış patates' },
    { k: 'sebze', l: 'Sebze', c: 6, p: 2, f: 0, lo: 3, hi: 5, ex: '4 yemek kaşığı pişmiş sebze yemeği; 1 kase çiğ salata' },
    { k: 'meyve', l: 'Meyve', c: 15, p: 0, f: 0, lo: 2, hi: 4, ex: '1 küçük boy elma; 1 küçük boy muz; 1 orta boy portakal; 12–15 adet üzüm' },
    { k: 'yag', l: 'Yağ', c: 0, p: 0, f: 5, lo: 2, hi: 7, ex: '1 tatlı kaşığı zeytinyağı; 5 adet zeytin' },
    { k: 'tohum', l: 'Yağlı tohum', c: 0, p: 2, f: 5, lo: 0, hi: 2, ex: '2 tam ceviz; 5–6 adet badem' }
  ];
  const kcalOf = (g) => g.c * 4 + g.p * 4 + g.f * 9;
  const byKey = (k) => GROUPS.find((g) => g.k === k);
  const numText = (n) => (n % 1 === 0 ? String(n) : fmt(n, 1)); // 2 / 2,5


  /* ---- durum ---- */
  const S = () => DA.state().ui;
  const counts = () => (S().ex = S().ex || {});
  const locks = () => (S().exLock = S().exLock || {});
  function target() {
    if (!S().exT) {
      const t = DA.state().targets;
      const kcal = (t && t.kcal) || 1800;
      S().exT = { kcal, c: t && t.kcal ? Math.round(t.c * 4 / t.kcal * 100) : 50, p: t && t.kcal ? Math.round(t.p * 4 / t.kcal * 100) : 20 };
    }
    return S().exT;
  }
  const cnt = (k) => { const n = counts()[k]; return isFinite(n) ? n : 0; };

  function totals(v) {
    const t = { c: 0, p: 0, f: 0, kcal: 0, n: 0 };
    GROUPS.forEach((g) => {
      const n = isFinite(v[g.k]) ? v[g.k] : 0;
      if (!n) return;
      t.c += n * g.c; t.p += n * g.p; t.f += n * g.f; t.kcal += n * kcalOf(g); t.n += n;
    });
    return t;
  }

  /* ---- otomatik dağıtım ----
     Kilitli gruplar sabit tutulur; kalanlar makul aralıklarda taranıp hedef enerjiye ve
     makro yüzdelerine en yakın TAM SAYI kombinasyon seçilir. */
  function distribute() {
    const T = target(), L = locks(), cur = counts();
    const fixed = {}, search = [];
    GROUPS.forEach((g) => {
      if (L[g.k]) { fixed[g.k] = Math.round(cnt(g.k)); return; }
      if (g.lo === 0 && g.hi === 0) { fixed[g.k] = 0; return; }
      search.push(g);
    });
    const base = totals(fixed);
    const want = { c: T.kcal * T.c / 100 / 4, p: T.kcal * T.p / 100 / 4 };
    let best = null;

    const pick = new Array(search.length).fill(0);
    (function rec(i, acc) {
      if (i === search.length) {
        const kcalErr = Math.abs(acc.kcal - T.kcal);
        if (kcalErr > 120) return;
        const e = acc.kcal || 1;
        const dC = Math.abs(acc.c * 4 / e * 100 - T.c);
        const dP = Math.abs(acc.p * 4 / e * 100 - T.p);
        const dF = Math.abs(acc.f * 9 / e * 100 - (100 - T.c - T.p));
        const score = kcalErr + (dC + dP + dF) * 6;
        if (!best || score < best.score) best = { score, kcalErr, v: pick.slice() };
        return;
      }
      const g = search[i];
      for (let n = g.lo; n <= g.hi; n++) {
        pick[i] = n;
        rec(i + 1, { c: acc.c + n * g.c, p: acc.p + n * g.p, f: acc.f + n * g.f, kcal: acc.kcal + n * kcalOf(g) });
      }
    })(0, base);

    if (!best) return null;
    const out = Object.assign({}, fixed);
    search.forEach((g, i) => { out[g.k] = best.v[i]; });
    S().ex = out;
    DA.save();
    return { kcalErr: best.kcalErr, kcal: totals(out).kcal, want };
  }

  /* ---- öğünlere dağıtım ----
     Varsayılan enerji payları; her grubun toplamı en büyük kalan yöntemiyle tam sayı olarak bölünür. */
  const MEALS = [['kahvalti', 'Kahvaltı', 25], ['ara1', 'Ara öğün', 10], ['ogle', 'Öğle', 30], ['ara2', 'Ara öğün', 10], ['aksam', 'Akşam', 25]];
  const meals = () => (S().exMeal = S().exMeal || {});

  /* Her değişim birimini, enerji hedefine göre en çok geride kalan öğüne verir.
     Grup toplamları birebir korunur; öğün payları enerji bazında dengelenir.
     (Grupları tek tek bölmek, eşitliklerde hep ilk öğünü kayırıp akşamı aç bırakıyordu.) */
  function autoMeals() {
    const tot = totals(counts()).kcal || 1;
    const out = {}, acik = {};
    MEALS.forEach((m) => { out[m[0]] = {}; acik[m[0]] = tot * m[2] / 100; });

    /* Büyük kalorili birimler önce yerleşsin ki küçükler açığı kapatabilsin */
    const units = [];
    GROUPS.forEach((g) => {
      const n = Math.round(cnt(g.k));
      for (let i = 0; i < n; i++) units.push(g);
    });
    units.sort((a, b) => kcalOf(b) - kcalOf(a));

    units.forEach((g) => {
      let best = MEALS[0][0];
      MEALS.forEach((m) => { if (acik[m[0]] > acik[best]) best = m[0]; });
      out[best][g.k] = (out[best][g.k] || 0) + 1;
      acik[best] -= kcalOf(g);
    });
    S().exMeal = out; DA.save();
  }
  const mealTot = (mk) => totals(meals()[mk] || {});
  /* Bir grubun öğünlere dağıtılmış toplamı */
  function assigned(gk) {
    return MEALS.reduce((t, m) => t + ((meals()[m[0]] || {})[gk] || 0), 0);
  }

  function mealsHtml() {
    const any = MEALS.some((m) => mealTot(m[0]).n > 0);
    if (!any) return '<div class="card"><div class="empty">' + icon('menu') +
      '<div>Değişimleri öğünlere bölmek için <b>Öğünlere dağıt</b>’a dokun.</div></div></div>';
    const eksik = GROUPS.map((g) => {
      const d = Math.round(cnt(g.k)) - assigned(g.k);
      return d ? esc(g.l) + ': ' + (d > 0 ? d + ' dağıtılmadı' : (-d) + ' fazla') : '';
    }).filter(Boolean);
    return '<div class="list">' + MEALS.map((m) => {
      const t = mealTot(m[0]), v = meals()[m[0]] || {};
      const det = GROUPS.filter((g) => v[g.k]).map((g) => esc(g.l.replace(/ \(.*\)/, '')) + ' ' + v[g.k]).join(' · ');
      return '<button class="li" data-act="exMealEdit" data-m="' + m[0] + '">' +
        '<span class="grow"><div class="t">' + esc(m[1]) + '</div><div class="s">' + (det || 'boş') + '</div></span>' +
        '<span class="end">' + fmt(t.kcal, 0) + ' kcal<br><span class="tiny">%' + fmt(t.kcal / (totals(counts()).kcal || 1) * 100, 0) + '</span></span></button>';
    }).join('') + '</div>' +
    (eksik.length ? '<div class="note warn"><b>Öğün toplamları planla uyuşmuyor:</b><br>' + eksik.join('<br>') + '</div>' : '');
  }

  /* ---- parçalar ---- */
  function rowsHtml() {
    const L = locks();
    return GROUPS.map((g) => {
      const n = cnt(g.k), on = n > 0;
      const macro = [g.c ? g.c + ' KH' : '', g.p ? g.p + ' P' : '', g.f ? g.f + ' Y' : ''].filter(Boolean).join(' · ');
      return '<div class="xrow' + (on ? ' on' : '') + '">' +
        '<button class="lock' + (L[g.k] ? ' on' : '') + '" data-act="exLock" data-k="' + g.k + '" aria-pressed="' + (L[g.k] ? 'true' : 'false') + '" title="Otomatik dağıtımda sabit tut">' + icon('lock') + '</button>' +
        '<span class="grow"><div class="t">' + esc(g.l) + '</div><div class="s">' + macro + ' · ' + kcalOf(g) + ' kcal</div></span>' +
        '<span class="stepper">' +
          '<button data-act="exDec" data-k="' + g.k + '" aria-label="' + esc(g.l) + ' azalt"' + (n <= 0 ? ' disabled' : '') + '>−</button>' +
          '<button class="n' + (on ? '' : ' z') + '" data-act="exSet" data-k="' + g.k + '" aria-label="' + esc(g.l) + ': ' + esc(numText(n)) + ' değişim, değer gir">' + esc(numText(n)) + '</button>' +
          '<button data-act="exInc" data-k="' + g.k + '" aria-label="' + esc(g.l) + ' artır">+</button>' +
        '</span></div>';
    }).join('');
  }

  function barLine(l, cur, hedef, u) {
    const d = cur - hedef, pct = hedef ? Math.min(100, cur / hedef * 100) : 0;
    return '<div class="res"><span class="l">' + esc(l) + '</span><span class="v">' + fmt(cur, 0) + ' / ' + fmt(hedef, 0) + ' ' + u +
      '<span class="sub">' + (Math.abs(d) < 0.5 ? 'hedefte' : (d > 0 ? '+' : '−') + fmt(Math.abs(d), 0) + ' ' + u) + '</span></span></div>' +
      '<div class="bar' + (cur > hedef * 1.05 ? ' over' : '') + '"><i style="width:' + (isFinite(pct) ? Math.round(pct) : 0) + '%"></i></div>';
  }

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

  function portions() {
    return '<details class="acc"><summary>Porsiyon örnekleri (1 değişim)</summary><div class="body">' +
      '<table class="t"><tbody>' + GROUPS.map((g) =>
        '<tr><td style="width:38%"><b>' + esc(g.l) + '</b></td><td>' + esc(g.ex) + '</td></tr>').join('') +
      '</tbody></table><p class="muted tiny" style="margin-bottom:0">Porsiyonlar yaklaşıktır; besinin cinsine ve pişirme yöntemine göre değişir.</p></div></details>';
  }

  function planText() {
    const v = counts(), t = totals(v);
    return DA.APP + ' — Değişim listesi planı\n' +
      GROUPS.filter((g) => cnt(g.k)).map((g) => '• ' + g.l + ': ' + fmt(cnt(g.k), 1) + ' değişim').join('\n') +
      '\n\nToplam: ' + fmt(t.kcal, 0) + ' kcal · KH ' + fmt(t.c, 0) + ' g · Protein ' + fmt(t.p, 0) + ' g · Yağ ' + fmt(t.f, 0) + ' g' +
      (MEALS.some((m) => mealTot(m[0]).n) ? '\n\nÖĞÜNLER\n' + MEALS.map((m) => {
        const mv = meals()[m[0]] || {}, det = GROUPS.filter((g) => mv[g.k]).map((g) => g.l.replace(/ \(.*\)/, '') + ' ' + mv[g.k]).join(', ');
        return det ? m[1] + ' (' + fmt(mealTot(m[0]).kcal, 0) + ' kcal): ' + det : '';
      }).filter(Boolean).join('\n') : '') +
      '\n\n' + DA.dyt();
  }

  function outHtml() {
    const v = counts(), t = totals(v), T = target();
    if (!t.n) return '<div class="card"><div class="empty">' + icon('table') +
      '<div>Gruplara değişim ekle ya da <b>Otomatik dağıt</b>’a dokun.</div></div></div>';
    const e = t.kcal || 1;
    const fatPct = 100 - T.c - T.p;
    return '<div class="card">' +
      '<div class="res hl"><span class="l">Toplam enerji</span><span class="v">' + fmt(t.kcal, 0) + ' kcal<span class="sub">' + fmt(t.n, 1) + ' değişim</span></span></div>' +
      '<div class="macros mt"><div><b>' + fmt(t.c, 0) + '</b><small>KH g · %' + fmt(t.c * 4 / e * 100, 0) + '</small></div>' +
      '<div><b>' + fmt(t.p, 0) + '</b><small>Protein g · %' + fmt(t.p * 4 / e * 100, 0) + '</small></div>' +
      '<div><b>' + fmt(t.f, 0) + '</b><small>Yağ g · %' + fmt(t.f * 9 / e * 100, 0) + '</small></div>' +
      '<div><b>' + fmt(t.c / 15, 1) + '</b><small>KH değişimi</small></div></div>' +
      '<div class="sect">Hedefe göre</div>' +
      barLine('Enerji', t.kcal, T.kcal, 'kcal') +
      barLine('Karbonhidrat', t.c, T.kcal * T.c / 100 / 4, 'g') +
      barLine('Protein', t.p, T.kcal * T.p / 100 / 4, 'g') +
      barLine('Yağ', t.f, T.kcal * fatPct / 100 / 9, 'g') +
      '</div>' +
      breakdown(v, t) +
      '<button class="btn sec block" data-act="exShare">' + icon('share') + ' Planı paylaş / kopyala</button>' +
      '<button class="btn ghost block mt-s" data-act="exMenu">' + icon('menu') + ' Bu plandan menü iskeleti oluştur</button>';
  }

  /* ---- görünüm ---- */
  DA.calcs.push({
    id: 'degisim', title: 'Değişim listesi', desc: 'Sayaçlı giriş, otomatik dağıtım, porsiyon örnekleri', ico: 'table',
    view() {
      const T = target();
      return {
        title: 'Değişim listesi', tab: 'hesapla', back: 'hesapla', ico: 'table',
        fav: { h: '#/hesapla/degisim', t: 'Değişim listesi', ico: 'table' },
        html:
          '<div class="card"><div class="sect" style="margin-top:0">Hedef</div>' +
          '<div class="grid2"><label class="fld"><span>Enerji (kcal)</span><input type="text" inputmode="numeric" name="kcal" value="' + esc(T.kcal) + '" data-live="exT"></label>' +
          '<label class="fld"><span>Karbonhidrat %</span><input type="text" inputmode="numeric" name="c" value="' + esc(T.c) + '" data-live="exT"></label></div>' +
          '<div class="grid2"><label class="fld"><span>Protein %</span><input type="text" inputmode="numeric" name="p" value="' + esc(T.p) + '" data-live="exT"></label>' +
          '<label class="fld"><span>Yağ % (otomatik)</span><input type="text" value="' + esc(100 - T.c - T.p) + '" disabled></label></div>' +
          '<button class="btn block" data-act="exAuto">' + icon('calc') + ' Otomatik dağıt</button>' +
          '<p class="muted tiny" style="margin-bottom:0">Kilitli gruplar sabit kalır, gerisi hedefe en yakın tam sayılarla doldurulur.</p></div>' +

          '<div class="sect">Gruplar</div>' +
          '<div class="list" id="exRows">' + rowsHtml() + '</div>' +
          '<div class="row between mb"><button class="btn ghost sm" data-act="exReset">Sıfırla</button>' +
          '<span class="muted tiny">Sayıya dokunarak tam değer gir</span></div>' +

          '<div id="exOut">' + outHtml() + '</div>' +
          '<div class="sect">Öğünler</div>' +
          '<button class="btn sec block mb" data-act="exMealAuto">' + icon('menu') + ' Öğünlere dağıt (%25 · %10 · %30 · %10 · %25)</button>' +
          '<div id="exMeals">' + mealsHtml() + '</div>' +
          portions() +
          '<div class="note">Değerler derste kullanılan değişim listesine göredir ve diyabet değişim listesiyle aynıdır. Vitamin ve mineral içermez.</div>'
      };
    }
  });

  /* ---- etkileşim ---- */
  const redraw = () => {
    const r = DA.$('#exRows'), o = DA.$('#exOut'), m = DA.$('#exMeals');
    if (r) r.innerHTML = rowsHtml();
    if (o) o.innerHTML = outHtml();
    if (m) m.innerHTML = mealsHtml();
  };
  const setCount = (k, n) => { counts()[k] = Math.max(0, Math.round(n * 2) / 2); DA.save(); redraw(); };

  DA.actions.exInc = (el) => setCount(el.dataset.k, cnt(el.dataset.k) + 1);
  DA.actions.exDec = (el) => setCount(el.dataset.k, cnt(el.dataset.k) - 1);
  DA.actions.exLock = (el) => { const L = locks(), k = el.dataset.k; L[k] = !L[k]; DA.save(); redraw(); };
  DA.actions.exReset = () => { S().ex = {}; S().exLock = {}; S().exMeal = {}; DA.save(); redraw(); DA.toast('Sıfırlandı'); };

  DA.actions.exSet = (el) => {
    const k = el.dataset.k, g = byKey(k);
    DA.sheet(g.l, '<form data-form="exSet" data-k="' + k + '"><label class="fld"><span>Değişim sayısı (yarım için 0,5)</span>' +
      '<input type="text" inputmode="decimal" name="n" value="' + esc(fmt(cnt(k), 1)) + '"></label>' +
      '<button class="btn block" type="submit">Tamam</button></form>');
  };
  DA.forms.exSet = (f) => {
    const n = num(DA.formData(f).n);
    setCount(f.dataset.k, isFinite(n) ? n : 0);
    DA.closeSheet();
  };

  DA.live.exT = (el) => {
    const T = target(), n = num(el.value);
    if (isFinite(n)) T[el.name] = Math.max(0, n);
    DA.save();
    const o = DA.$('#exOut'); if (o) o.innerHTML = outHtml();
  };

  DA.actions.exAuto = () => {
    const T = target();
    if (!(T.kcal > 0)) return DA.toast('Önce hedef enerjiyi gir');
    if (T.c + T.p > 95) return DA.toast('Karbonhidrat + protein yüzdesi çok yüksek');
    const r = distribute();
    if (!r) return DA.toast('Bu hedefe uyan dağıtım bulunamadı');
    redraw();
    DA.toast(r.kcalErr <= 30 ? 'Dağıtıldı: ' + Math.round(r.kcal) + ' kcal (hedefe ' + Math.round(r.kcalErr) + ' kcal)' :
      'En yakın dağıtım: ' + Math.round(r.kcal) + ' kcal (fark ' + Math.round(r.kcalErr) + ' kcal)');
  };

  DA.actions.exMealAuto = () => {
    if (!totals(counts()).n) return DA.toast('Önce değişim planı oluştur');
    autoMeals(); redraw(); DA.toast('Öğünlere dağıtıldı');
  };
  DA.actions.exMealEdit = (el) => {
    const mk = el.dataset.m, m = MEALS.find((x) => x[0] === mk);
    const v = meals()[mk] || {};
    DA.sheet(m[1], '<div id="exMealBody">' + mealEditHtml(mk, v) + '</div>');
  };
  function mealEditHtml(mk, v) {
    return GROUPS.filter((g) => Math.round(cnt(g.k)) > 0).map((g) => {
      const n = v[g.k] || 0, kalan = Math.round(cnt(g.k)) - assigned(g.k);
      return '<div class="xrow"><span class="grow"><div class="t">' + esc(g.l) + '</div>' +
        '<div class="s">planda ' + Math.round(cnt(g.k)) + ' · dağıtılmamış ' + kalan + '</div></span>' +
        '<span class="stepper"><button data-act="exMealDec" data-m="' + mk + '" data-k="' + g.k + '"' + (n <= 0 ? ' disabled' : '') + '>−</button>' +
        '<button class="n' + (n ? '' : ' z') + '" disabled>' + n + '</button>' +
        '<button data-act="exMealInc" data-m="' + mk + '" data-k="' + g.k + '"' + (kalan <= 0 ? ' disabled' : '') + '>+</button></span></div>';
    }).join('') + '<p class="muted tiny">Bu öğünün toplamı: <b>' + fmt(mealTot(mk).kcal, 0) + ' kcal</b></p>';
  }
  function setMeal(mk, gk, n) {
    const M = meals();
    M[mk] = M[mk] || {};
    if (n <= 0) delete M[mk][gk]; else M[mk][gk] = n;
    DA.save();
    const b = DA.$('#exMealBody');
    if (b) b.innerHTML = mealEditHtml(mk, M[mk]);
    redraw();
  }
  DA.actions.exMealInc = (el) => setMeal(el.dataset.m, el.dataset.k, ((meals()[el.dataset.m] || {})[el.dataset.k] || 0) + 1);
  DA.actions.exMealDec = (el) => setMeal(el.dataset.m, el.dataset.k, ((meals()[el.dataset.m] || {})[el.dataset.k] || 0) - 1);

  DA.actions.exShare = () => DA.shareText('Değişim listesi planı', planText());
  DA.actions.exMenu = () => {
    if (DA.menuFromExchange) DA.menuFromExchange(counts(), GROUPS, totals(counts()));
    else DA.toast('Menü planlayıcı bulunamadı');
  };

  /* menü planlayıcının kullanması için */
  DA.exchange = { groups: GROUPS, kcalOf: kcalOf, totals: totals };
})();
