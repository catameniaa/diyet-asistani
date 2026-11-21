/* Besin listesi, menü planlayıcı, yazdır/paylaş */
(function () {
  'use strict';
  const { esc, fmt, num, uid } = DA;
  const MEALS = ['Kahvaltı', 'Kuşluk', 'Öğle', 'İkindi', 'Akşam', 'Gece ara öğünü'];

  /* ---- TÜBER porsiyon verisini (Ek 2.3.1) temel listeyle birleştir ----
     Aynı besin iki kez görünmesin: ad eşleşirse mevcut kayda standart porsiyon
     ölçüsü ve mikro besin paneli eklenir, eşleşmezse yeni kayıt olarak gelir. */
  const MIKRO = [['Kolesterol', 'mg'], ['Kalsiyum', 'mg'], ['Demir', 'mg'], ['Çinko', 'mg'], ['Potasyum', 'mg'],
    ['A vitamini', 'µg'], ['C vitamini', 'mg'], ['B1 vitamini', 'mg'], ['B2 vitamini', 'mg'],
    ['Niasin eşd.', 'mg'], ['B6 vitamini', 'mg'], ['B12 vitamini', 'µg'], ['Folik asit', 'µg']];
  const sade = (n) => DA.trLower(n).replace(/[(),.]/g, ' ').replace(/\s+/g, ' ').trim();
  let _birlesikKey = null, _birlesik = null;

  function tuberFoods() {
    const P = DA.data.porsiyonBesin;
    if (!P) return [];
    const out = [];
    P.g.forEach((g) => g.f.forEach((f) => {
      const por = f[1];
      if (!(por > 0)) return;
      const k = 100 / por;
      out.push({
        id: 'tb-' + sade(f[0]).replace(/[^a-z0-9]+/g, '-'), n: f[0], cat: g.g, tuber: true,
        kcal: f[2] * k, p: f[3] * k, c: f[4] * k, fib: f[5] * k, f: f[6] * k,
        u: [['1 standart porsiyon', por]],
        mik: MIKRO.map((m, i) => [m[0], f[7 + i] == null ? null : f[7 + i], m[1]]),
        por: por
      });
    }));
    return out;
  }

  function allFoods() {
    const P = DA.data.porsiyonBesin;
    const key = (P ? 'T' : '-') + DA.state().customFoods.length;
    if (_birlesik && _birlesikKey === key) return _birlesik;
    const temel = DA.data.foods.map((f) => Object.assign({}, f));
    if (P) {
      const idx = {};
      temel.forEach((f) => { idx[sade(f.n)] = f; });
      tuberFoods().forEach((t) => {
        const v = idx[sade(t.n)];
        if (v) {
          /* mevcut kayda standart porsiyon ölçüsü ve mikro paneli ekle */
          v.u = (v.u || []).concat([['1 standart porsiyon (TÜBER)', t.por]]);
          v.mik = t.mik; v.por = t.por; v.tuberAd = t.n;
        } else temel.push(t);
      });
    }
    _birlesik = temel.concat(DA.state().customFoods.map((f) => Object.assign({ custom: true }, f)));
    _birlesikKey = key;
    return _birlesik;
  }
  DA.foodsInvalidate = () => { _birlesik = null; };
  const getFood = (id) => allFoods().find((f) => f.id === id);
  const nut = (f, g) => ({ kcal: f.kcal * g / 100, p: f.p * g / 100, c: f.c * g / 100, f: f.f * g / 100, fib: (f.fib || 0) * g / 100 });
  const add = (a, b) => ({ kcal: a.kcal + b.kcal, p: a.p + b.p, c: a.c + b.c, f: a.f + b.f, fib: a.fib + b.fib });
  const zero = () => ({ kcal: 0, p: 0, c: 0, f: 0, fib: 0 });
  DA.foods = { all: allFoods, get: getFood, nut, ogunler: MEALS };

  function itemNut(it) {
    const f = getFood(it.id);
    return f ? nut(f, it.g) : zero();
  }
  function menuTotals(m) {
    let t = zero();
    MEALS.forEach((k) => (m.meals[k] || []).forEach((it) => { t = add(t, itemNut(it)); }));
    return t;
  }
  function mealTotals(list) { return list.reduce((t, it) => add(t, itemNut(it)), zero()); }

  /* ---- Menünün mikro besin toplamı ----
     Yalnızca TÜBER panelini taşıyan besinler sayılır; kapsam oranı da bildirilir. */
  function menuMikro(m) {
    const top = {}, say = { var: 0, yok: 0 };
    MEALS.forEach((k) => (m.meals[k] || []).forEach((it) => {
      const f = getFood(it.id);
      if (!f || !f.mik) { say.yok++; return; }
      say.var++;
      f.mik.forEach((x) => {
        if (x[1] == null) return;
        top[x[0]] = top[x[0]] || { v: 0, u: x[2] };
        top[x[0]].v += x[1] * it.g / f.por;   /* panel 1 porsiyon içindir */
      });
    }));
    return { top, say };
  }

  /* Menü toplamını TÜBER hedefleriyle yan yana koy */
  function mikroKartHtml(m) {
    const H = DA.data.hedef;
    const { top, say } = menuMikro(m);
    const adlar = Object.keys(top);
    if (!adlar.length) return '';
    const p = DA.state().profile || {};
    let hedefSut = null, basligi = '';
    if (H && p.age > 0) {
      const sex = p.sex === 'K' ? 'K' : 'E', T = H[sex];
      const i = DA.hedefBand ? DA.hedefBand(sex, p.age) : null;
      if (i != null && i >= 0) { hedefSut = T; basligi = (sex === 'K' ? 'Kadın' : 'Erkek') + ' ' + T.c[i].y + ' yaş'; hedefSut._i = i; }
    }
    const hedefOf = (ad) => {
      if (!hedefSut) return null;
      const r = hedefSut.r.find((x) => x.n === ad);
      if (!r) return null;
      let v = r.v[hedefSut._i];
      if (v == null) return null;
      v = Array.isArray(v) ? v[0] : v;
      return (r.u === 'g/gün' && ad === 'Potasyum') ? v * 1000 : v;
    };
    return '<details class="acc"><summary>Mikro besin toplamı' +
      (say.yok ? ' <span class="muted tiny">' + say.var + '/' + (say.var + say.yok) + ' besin</span>' : '') +
      '</summary><div class="body">' +
      (say.yok ? '<div class="note warn">Menüdeki ' + say.yok + ' besinin mikro besin verisi yok; toplam eksik. ' +
        'TÜBER standart porsiyon listesindeki besinleri seçersen tam hesaplanır.</div>' : '') +
      '<div class="scrollx"><table class="t"><thead><tr><th>Besin ögesi</th><th class="n">Menü</th>' +
      (hedefSut ? '<th class="n">Hedef</th><th class="n">%</th>' : '') + '</tr></thead><tbody>' +
      adlar.map((ad) => {
        const h = hedefOf(ad);
        const o = top[ad];
        return '<tr><td>' + esc(ad) + ' <span class="muted tiny">' + esc(o.u) + '</span></td>' +
          '<td class="n"><b>' + fmt(o.v, 2) + '</b></td>' +
          (hedefSut ? '<td class="n muted">' + (h ? fmt(h, 2) : '—') + '</td>' +
            '<td class="n">' + (h ? '<span class="badge ' + (o.v / h >= 0.95 ? 'ok' : o.v / h >= 0.7 ? 'warn' : 'bad') + '">%' +
              fmt(o.v / h * 100, 0) + '</span>' : '—') + '</td>' : '') + '</tr>';
      }).join('') + '</tbody></table></div>' +
      (hedefSut ? '<p class="muted tiny">Hedefler profildeki yaş ve cinsiyete göre: <b>' + esc(basligi) +
        '</b> (TÜBER Ek 3.4.1/3.4.2).</p>'
        : '<p class="muted tiny">Hedeflerle karşılaştırmak için profile yaş gir.</p>') +
      '<p class="muted tiny" style="margin-bottom:0">Değerler TÜBER 2022 Ek 2.3.1 standart porsiyon verisinden ölçeklenir.</p>' +
      '</div></details>';
  }

  /* ---------- Besin listesi ---------- */
  let cat = 'Tümü', query = '';
  function foodListHtml() {
    const q = DA.trLower(query);
    const fv = favs();
    let items = allFoods().filter((f) => (cat === 'Tümü' || f.cat === cat || (cat === 'Eklediklerim' && f.custom) ||
      (cat === 'Favoriler' && fv.indexOf(f.id) >= 0)) && (!q || DA.trLower(f.n).includes(q)));
    if (cat === 'Favoriler') items = items.filter((f) => fv.indexOf(f.id) >= 0);
    /* Favoriler listenin başında; kendi aralarında ad sırası korunur. */
    else if (fv.length) items = items.slice().sort((a, b) => (fv.indexOf(b.id) >= 0) - (fv.indexOf(a.id) >= 0));
    if (!items.length) {
      if (cat === 'Favoriler') return DA.emptyState('star', { baslik: 'Henüz favori yok',
        aciklama: 'Sık kullandığın besinleri yıldızla; listenin başında dursunlar, her seferinde aramak zorunda kalma.' });
      if (q) return DA.emptyState('search', { baslik: '“' + q + '” için sonuç yok',
        aciklama: 'Yazımı kontrol et ya da kendi besinini ekle. Eklediğin besinler aramaya dahil olur.',
        eylem: { act: 'foodNew', etiket: 'Kendi besinini ekle', ico: 'plus' } });
      return DA.emptyState('apple', { baslik: 'Bu kategoride besin yok',
        aciklama: 'Başka bir kategori seç ya da kendi besinini ekle.',
        eylem: { act: 'foodNew', etiket: 'Besin ekle', ico: 'plus' } });
    }
    return '<div class="list">' + items.map((f) => {
      const on = fv.indexOf(f.id) >= 0;
      return '<div class="li' + (on ? ' fav' : '') + '">' + DA.besinIkon(f.cat) +
        '<button class="grow favli" data-act="foodDetail" data-id="' + esc(f.id) + '">' +
        '<div class="t">' + esc(f.n) + '</div><div class="s">P ' + fmt(f.p, 1) + ' · K ' + fmt(f.c, 1) + ' · Y ' + fmt(f.f, 1) + ' g' +
        (f.por ? ' · porsiyon ' + fmt(f.por, 0) + ' g' : '') + '</div></button>' +
        '<span class="end"><b style="color:var(--ink)">' + fmt(f.kcal, 0) + '</b> kcal</span>' +
        '<button class="favbtn' + (on ? ' on' : '') + '" data-act="foodFav" data-id="' + esc(f.id) + '" ' +
        'aria-pressed="' + (on ? 'true' : 'false') + '" aria-label="' + esc(f.n) + (on ? ' favorilerden çıkar' : ' favorilere ekle') + '">' +
        DA.icon('star') + '</button></div>';
    }).join('') + '</div>';
  }
  /* Favoriler: sık kullanılan besinler her seferinde aranmasın diye
     listenin başına alınır. Kimlikler ayarlarda değil ui altında tutulur. */
  const favs = () => (DA.state().ui.favFood = DA.state().ui.favFood || []);
  DA.foodFav = (id) => favs().indexOf(id) >= 0;
  DA.actions.foodFav = (el, e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const id = el.dataset.id, f = favs(), i = f.indexOf(id);
    if (i >= 0) f.splice(i, 1); else f.push(id);
    DA.save();
    const o = DA.$('#foodList'); if (o) o.innerHTML = foodListHtml(); else DA.render(true);
  };

  DA.live.foodSearch = (el) => { query = el.value; DA.$('#foodList').innerHTML = foodListHtml(); };
  DA.actions.foodCat = (el) => { cat = el.dataset.c; DA.render(true); };

  DA.views.besin = (parts, q) => {
    /* Kategoriler listedeki gerçek gruplardan türetilir (TÜBER grupları da dahil) */
    const gorulen = [];
    allFoods().forEach((f) => { if (!f.custom && gorulen.indexOf(f.cat) < 0) gorulen.push(f.cat); });
    const sira = DA.data.foodCats.filter((c) => gorulen.indexOf(c) >= 0);
    const cats = ['Tümü'].concat(sira, gorulen.filter((c) => sira.indexOf(c) < 0));
    if (DA.state().customFoods.length) cats.push('Eklediklerim');
    if (favs().length) cats.splice(1, 0, 'Favoriler');   /* Tümü'nün hemen yanında */
    return {
      title: 'Besinler', tab: 'besin',
      html: '<div class="grid2 mb"><a class="btn block" href="#/menu">' + DA.icon('menu') + ' Menü planlayıcı</a>' +
        '<a class="btn sec block" href="#/liste">' + DA.icon('note') + ' Diyet listeleri</a></div>' +
        /* Geniş veri bankası ayrı ekranda: 7.140 besin ve mikro besinler (js/bls.js) */
        '<div class="list"><a class="li chev" href="#/bls"><span class="ic">' + DA.icon('book') + '</span>' +
        '<span class="grow"><div class="t">BLS 4.0 veri bankası</div><div class="s">7.140 besin · vitamin, mineral, ' +
        'yağ asidi ve amino asit · besin ögesine göre arama</div></span></a>' +
        /* TürKomp uygulamayla gelmez, cihaza içe aktarılır (js/turkomp.js) */
        '<a class="li chev" href="#/turkomp"><span class="ic">' + DA.icon('book') + '</span>' +
        '<span class="grow"><div class="t">TürKomp</div><div class="s">Türk besinleri, 645 besin · ' +
        'dosyandan bu cihaza yüklenir</div></span></a></div>' +
        '<input type="search" placeholder="Besin ara…" value="' + esc(query) + '" data-live="foodSearch" aria-label="Besin ara">' +
        '<div class="chips mt-s">' + cats.map((c) => '<button class="chip' + (c === cat ? ' on' : '') + '" data-act="foodCat" data-c="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div>' +
        '<div id="foodList">' + foodListHtml() + '</div>' +
        '<p class="muted tiny center">Değerler 100 g içindir. Standart porsiyonu ve mikro besin paneli olan kayıtlar ' +
        'TÜBER 2022 Ek 2.3.1’den gelir; diğerleri USDA ve yaygın Türk mutfağı ortalamalarıdır (yaklaşık). ' +
        'Klinik çalışmada TürKomp ile doğrulayın.</p>' +
        '<button class="fab" data-act="foodNew" aria-label="Besin ekle">' + DA.icon('plus') + '</button>',
      mount() {
        if (!DA.data.porsiyonBesin) DA.need(['porsiyonBesin']).then(() => { DA.foodsInvalidate(); DA.render(true); }).catch(() => {});
        const id = q && q.get('f');
        if (id && getFood(id)) DA.actions.foodDetail({ dataset: { id } });
      }
    };
  };

  /* Seçenek değeri gramdır; ölçünün adı data-ad'da taşınır ki menüye "1 dilim"
     olarak yazılabilsin. Eskiden yalnız gram saklanıyordu: diyetisyen "2 dilim
     ekmek" seçse de çıktıya "50 g" basılıyordu, danışan gram okumaz. */
  function unitOptions(f) {
    return '<option value="1">gram</option>' + f.u.map((u) => '<option value="' + u[1] + '" data-ad="' + esc(u[0]) + '">' + esc(u[0]) + ' (' + fmt(u[1], 1) + ' g)</option>').join('');
  }
  /* Ev ölçüsü sayısı: 0,5 → ½, 1,5 → 1½; kesir değilse ondalık */
  const KESIR = { 25: '¼', 50: '½', 75: '¾' };
  function miktarYazi(n) {
    if (!(n > 0)) return '0';
    const w = Math.floor(n + 1e-9), r = Math.round((n - w) * 100);
    if (KESIR[r]) return (w ? String(w) : '') + KESIR[r];
    return fmt(n, 2);
  }
  /* "1 dilim" ölçüsünden 3 adet → "3 dilim". TÜBER etiketi kâğıtta gereksiz. */
  function olcuYazi(it) {
    if (!it || !it.o || !(it.a > 0)) return '';
    const birim = String(it.o).replace(/^1\s+/, '').replace(/\s*\(TÜBER\)\s*$/, '');
    return miktarYazi(it.a) + ' ' + birim;
  }
  const miktarHucre = (it) => { const o = olcuYazi(it); return o ? o + ' (' + fmt(it.g, 0) + ' g)' : fmt(it.g, 0) + ' g'; };
  DA.foods.miktarYazi = miktarYazi;
  DA.foods.toplam = (m) => menuTotals(m);

  /* ---- Öğün şablonları ----
     "Standart kahvaltım" gibi sık yazılan bir öğün bir kez kaydedilir, başka
     menülere tek dokunuşla eklenir. Eskiden her menüde besinler tek tek
     yeniden aranıyordu. Şablon öğünün o anki KOPYASIDIR: menüde sonradan
     yapılan değişiklik şablonu, şablondaki değişiklik eski menüleri bozmaz.
     Eklenen besinler öğündekilerin sonuna gelir, var olanın yerine geçmez. */
  const sablonlar = () => (DA.state().ogunSablon = DA.state().ogunSablon || []);
  const kopyaOge = (it) => JSON.parse(JSON.stringify(it));
  const menuBul = (id) => DA.state().menus.find((x) => x.id === id);
  DA.actions.menuSablon = (el) => {
    const m = menuBul(el.dataset.m); if (!m) return;
    const k = el.dataset.k, list = m.meals[k] || [], S_ = sablonlar();
    DA.sheet(k + ' · şablonlar',
      (S_.length ? '<div class="list" id="sablonList">' + S_.map((s) => '<div class="li"><button class="grow favli" data-act="menuSablonEkle" data-s="' + esc(s.id) +
          '" data-m="' + esc(m.id) + '" data-k="' + esc(k) + '"><div class="t">' + esc(s.ad) + '</div><div class="s">' +
          esc(s.items.map((it) => { const f = getFood(it.id); return f ? f.n : it.n; }).filter(Boolean).join(', ')) + ' · ' +
          fmt(mealTotals(s.items).kcal, 0) + ' kcal</div></button><button class="favbtn" data-act="menuSablonSil" data-s="' + esc(s.id) +
          '" aria-label="' + esc(s.ad) + ' şablonunu sil">' + DA.icon('trash') + '</button></div>').join('') + '</div>'
        : '<p class="muted small">Henüz şablon yok. Sık yazdığın bir öğünü bir kez kaydet, sonraki menülere tek dokunuşla ekle.</p>') +
      (list.length ? '<form data-form="menuSablonKaydet" data-m="' + esc(m.id) + '" data-k="' + esc(k) + '" class="mt">' +
          '<label class="fld"><span>Bu öğünü şablon olarak kaydet (' + list.length + ' besin)</span><input type="text" name="ad" placeholder="ör. Standart kahvaltım" required></label>' +
          '<button class="btn sec block" type="submit">' + DA.icon('save') + ' Şablonu kaydet</button></form>'
        : '<p class="muted tiny mt">Öğüne besin ekledikten sonra onu da şablon olarak kaydedebilirsin.</p>'));
  };
  DA.forms.menuSablonKaydet = (f) => {
    const m = menuBul(f.dataset.m); if (!m) return;
    const ad = String(DA.formData(f).ad || '').trim(), list = m.meals[f.dataset.k] || [];
    if (!ad) return DA.toast('Şablona bir ad ver');
    if (!list.length) return DA.toast('Öğün boş');
    sablonlar().push({ id: uid(), ad, items: list.map(kopyaOge) });
    DA.save(); DA.closeSheet(); DA.toast('Şablon kaydedildi: ' + ad);
  };
  DA.actions.menuSablonEkle = (el) => {
    const m = menuBul(el.dataset.m), s = sablonlar().find((x) => x.id === el.dataset.s);
    if (!m || !s) return;
    const k = el.dataset.k, hedef = m.meals[k] || (m.meals[k] = []);
    s.items.forEach((it) => hedef.push(kopyaOge(it)));
    DA.save(); DA.closeSheet(); DA.render(true); DA.toast(s.ad + ' eklendi');
  };
  DA.actions.menuSablonSil = (el) => {
    const S_ = sablonlar(), i = S_.findIndex((x) => x.id === el.dataset.s);
    if (i < 0) return;
    const silinen = S_.splice(i, 1)[0];
    DA.save(); DA.closeSheet();
    DA.silGeriAl('Şablon silindi', () => { S_.splice(i, 0, silinen); });
  };
  DA.foods.danisanAdi = danisanAdi;
  /* Miktar formundan menü öğesi: gram her zaman, ölçü seçildiyse adı ve adedi de */
  function formdanOge(form) {
    const g = parseFloat(form.dataset.g), amt = num(form.amt.value);
    const sec = form.unit.selectedOptions && form.unit.selectedOptions[0];
    const f = getFood(form.dataset.id);
    const it = { id: form.dataset.id, n: f ? f.n : '', g: Math.round(g * 10) / 10 };
    if (sec && sec.dataset.ad && isFinite(amt) && amt > 0) { it.o = sec.dataset.ad; it.a = Math.round(amt * 100) / 100; }
    return it;
  }
  function nutTable(n) {
    return '<div class="macros mt"><div><b>' + fmt(n.kcal, 0) + '<i class="vu">kcal</i></b><small>enerji</small></div><div><b>' + fmt(n.p, 1) + DA.birim('g') + '</b><small>protein</small></div><div><b>' + fmt(n.c, 1) + DA.birim('g') + '</b><small>karbonhidrat</small></div><div><b>' + fmt(n.f, 1) + DA.birim('g') + '</b><small>yağ</small></div></div>' +
      '<div class="small muted center mt-s">Lif ' + fmt(n.fib, 1) + ' g</div>';
  }
  function updatePreview() {
    const form = DA.$('#amtForm'); if (!form) return;
    const f = getFood(form.dataset.id), amt = num(form.amt.value), g = (isFinite(amt) ? amt : 0) * parseFloat(form.unit.value);
    DA.$('#amtPrev').innerHTML = '<div class="small muted center">' + fmt(g, 1) + ' g için</div>' + nutTable(nut(f, g));
    form.dataset.g = g;
  }
  DA.live.amt = updatePreview;

  DA.actions.foodDetail = (el) => {
    const f = getFood(el.dataset.id); if (!f) return;
    const menus = DA.state().menus;
    const mikroHtml = f.mik ? '<details class="acc mt"><summary>Standart porsiyonda besin ögeleri' +
      ' <span class="muted tiny">TÜBER Ek 2.3.1 · ' + fmt(f.por, 0) + ' g</span></summary><div class="body">' +
      '<table class="t"><tbody>' + f.mik.map((m) => '<tr><td>' + esc(m[0]) + '</td><td class="n"><b>' +
      (m[1] == null ? '—' : fmt(m[1], 2)) + '</b> ' + esc(m[2]) + '</td></tr>').join('') +
      '</tbody></table></div></details>' : '';
    DA.sheet(f.n, '<div class="muted small">' + esc(f.cat) + ' · 100 g’da ' + fmt(f.kcal, 0) + ' kcal' +
      (f.por ? ' · 1 porsiyon ' + fmt(f.por, 0) + ' g' : '') + (f.tuber ? ' · TÜBER' : '') + '</div>' + mikroHtml +
      '<form id="amtForm" data-id="' + esc(f.id) + '" onsubmit="return false"><div class="grid2 mt"><label class="fld"><span>Miktar</span><input type="text" inputmode="decimal" name="amt" value="1" data-live="amt"></label>' +
      '<label class="fld"><span>Birim</span><select name="unit" data-live="amt">' + unitOptions(f) + '</select></label></div>' +
      '<div id="amtPrev"></div>' +
      '<div class="grid2 mt"><label class="fld"><span>Menü</span><select name="menu">' + menus.map((m) => '<option value="' + m.id + '">' + esc(m.title) + '</option>').join('') + '<option value="new">+ Yeni menü</option></select></label>' +
      '<label class="fld"><span>Öğün</span><select name="meal">' + MEALS.map((m) => '<option>' + m + '</option>').join('') + '</select></label></div>' +
      '<button class="btn block" data-act="foodToMenu">Menüye ekle</button>' +
      (f.custom ? '<button class="btn danger block mt-s" data-act="foodDelete" data-id="' + esc(f.id) + '">Bu besini sil</button>' : '') + '</form>',
      () => { const form = DA.$('#amtForm'); form.unit.value = f.u.length ? String(f.u[0][1]) : '1'; updatePreview(); });
  };
  DA.actions.foodToMenu = () => {
    const form = DA.$('#amtForm'), g = parseFloat(form.dataset.g);
    if (!(g > 0)) return DA.toast('Miktarı gir');
    const S = DA.state(); let m = S.menus.find((x) => x.id === form.menu.value);
    if (!m) { m = newMenu(); S.menus.unshift(m); }
    m.meals[form.meal.value].push(formdanOge(form));
    DA.save(); DA.closeSheet(); DA.toast('“' + m.title + '” menüsüne eklendi');
  };
  DA.actions.foodDelete = (el) => {
    const S = DA.state(), i = S.customFoods.findIndex((f) => f.id === el.dataset.id);
    if (i < 0) return;
    const silinen = S.customFoods[i];
    S.customFoods.splice(i, 1); DA.foodsInvalidate(); DA.save(); DA.closeSheet(); DA.render(true);
    DA.silGeriAl(DA.esc(silinen.n) + ' silindi', () => {
      DA.state().customFoods.splice(i, 0, silinen); DA.foodsInvalidate();
    });
  };
  DA.actions.foodNew = () => {
    DA.sheet('Yeni besin (100 g için)', '<form data-form="foodNew"><label class="fld"><span>Ad</span><input type="text" name="n" required></label>' +
      '<div class="grid2"><label class="fld"><span>Enerji (kcal)</span><input type="text" inputmode="decimal" name="kcal" required></label><label class="fld"><span>Protein (g)</span><input type="text" inputmode="decimal" name="p"></label>' +
      '<label class="fld"><span>Karbonhidrat (g)</span><input type="text" inputmode="decimal" name="c"></label><label class="fld"><span>Yağ (g)</span><input type="text" inputmode="decimal" name="f"></label>' +
      '<label class="fld"><span>Lif (g)</span><input type="text" inputmode="decimal" name="fib"></label><label class="fld"><span>1 porsiyon (g)</span><input type="text" inputmode="decimal" name="por"></label></div>' +
      '<button class="btn block">Kaydet</button></form>');
  };
  DA.forms.foodNew = (f) => {
    const d = DA.formData(f), kcal = num(d.kcal);
    if (!d.n.trim() || !isFinite(kcal)) return DA.toast('Ad ve enerji gerekli');
    const por = num(d.por);
    DA.state().customFoods.push({ id: 'c_' + uid(), n: d.n.trim(), cat: 'Eklediklerim', kcal, p: num(d.p) || 0, c: num(d.c) || 0, f: num(d.f) || 0, fib: num(d.fib) || 0, u: por > 0 ? [['1 porsiyon', por]] : [] });
    DA.foodsInvalidate();
    DA.save(); DA.closeSheet(); cat = 'Eklediklerim'; DA.render(true); DA.toast('Besin eklendi');
  };

  /* ---------- Menü planlayıcı ---------- */
  function newMenu() {
    const meals = {}; MEALS.forEach((m) => { meals[m] = []; });
    return { id: uid(), title: 'Yeni menü', date: DA.today(), client: '', note: '', target: null, meals };
  }
  function targetOf(m) { return m.target || DA.state().targets; }

  DA.views.menu = (parts) => {
    const id = parts[0];
    if (!id) {
      const list = DA.state().menus;
      return {
        title: 'Menüler', tab: 'besin', back: 'besin',
        html: (list.length ? '<div class="list">' + list.map((m) => {
          const t = menuTotals(m);
          return '<a class="li chev" href="#/menu/' + m.id + '"><span class="ic">' + DA.icon('menu') + '</span><span class="grow"><div class="t">' + esc(m.title) + '</div><div class="s">' + esc(DA.fdate(m.date)) + (danisanAdi(m) ? ' · ' + esc(danisanAdi(m)) : '') + '</div></span><span class="end">' + fmt(t.kcal, 0) + ' kcal</span></a>';
        }).join('') + '</div>' : DA.emptyState('menu', { baslik: 'Henüz menü yok',
            aciklama: 'Öğün öğün besin ekle; enerji, makro ve mikro besin toplamları hedefinle karşılaştırılsın.',
            eylem: { act: 'menuNew', etiket: 'İlk menüyü oluştur', ico: 'plus' } })) +
          '<button class="fab" data-act="menuNew" aria-label="Yeni menü">' + DA.icon('plus') + '</button>'
      };
    }
    const m = DA.state().menus.find((x) => x.id === id);
    if (!m) return { title: 'Menü', back: 'menu', html: '<div class="card">Menü bulunamadı.</div>' };
    if (!DA.data.porsiyonBesin || !DA.data.hedef) {
      DA.need(['porsiyonBesin', 'hedef']).then(() => { DA.foodsInvalidate(); DA.render(true); }).catch(() => {});
    }
    const t = menuTotals(m), tg = targetOf(m);
    const pct = (a, b) => (b > 0 ? Math.min(100, a / b * 100) : 0);
    /* Toplam kartı (referanstaki "Your Macros Today"): solda planlanan ve
       hedef enerji, sağda halka (kalan ya da fazla kcal), altta üç makro
       çubuğu. Eskiden düz bir enerji çubuğu ve dört kutuydu; aynı bilgi,
       hedefe kalan miktar artık doğrudan okunuyor. Hedefi %5'ten çok aşan
       değer kırmızı (eski çubuktaki eşik). */
    const kalanY = (a, b, u) => (a > b ? fmt(a - b, 0) + ' ' + u + ' fazla' : fmt(b - a, 0) + ' ' + u + ' kaldı');
    const makro = (sinif, l, a, b) => '<div class="mk"><div class="mk-u"><span>' + l + '</span><b>' + fmt(a, 0) + DA.birim('g') + '</b></div>' +
      (b > 0 ? '<div class="bar ince ' + sinif + (a > b * 1.05 ? ' over' : '') + '"><i style="width:' + pct(a, b) + '%"></i></div><small>' + kalanY(a, b, 'g') + '</small>'
        : '<div class="bar ince"></div><small>hedef yok</small>') + '</div>';
    const enAsim = tg.kcal > 0 && t.kcal > tg.kcal * 1.05;
    const html =
      '<div class="sticky-tot makro-kart"><div class="mk-ust"><div class="mk-sayi">' +
        '<div><b>' + fmt(t.kcal, 0) + '</b>' + DA.birim('kcal') + '<small>' + (m.tur === 'geri' ? 'alınan' : 'planlanan') + '</small></div>' +
        '<div><b>' + fmt(tg.kcal, 0) + '</b>' + DA.birim('kcal') + '<small>hedef</small></div></div>' +
        DA.halka(tg.kcal > 0 ? t.kcal / tg.kcal : 0, tg.kcal > 0 ? '<b>' + fmt(Math.abs(tg.kcal - t.kcal), 0) + '</b><small>' + (t.kcal > tg.kcal ? 'kcal fazla' : 'kcal kaldı') + '</small>' : '<b>—</b>',
          { boyut: 76, kalin: 8, asim: enAsim, etiket: 'Enerji ' + fmt(t.kcal, 0) + ' / ' + fmt(tg.kcal, 0) + ' kcal' }) + '</div>' +
      '<div class="mk-satir">' + makro('mk-p', 'Protein', t.p, tg.p) + makro('mk-c', 'Karbonhidrat', t.c, tg.c) + makro('mk-f', 'Yağ', t.f, tg.f) + '</div>' +
      '<div class="tiny muted center mt-s">Lif ' + fmt(t.fib, 0) + ' g' + (t.kcal > 0 ? ' · Dağılım: KH %' + fmt(t.c * 4 / t.kcal * 100, 0) + ' · P %' + fmt(t.p * 4 / t.kcal * 100, 0) + ' · Y %' + fmt(t.f * 9 / t.kcal * 100, 0) : '') + '</div></div>' +
      (m.tur === 'geri' ? '<div class="note">24 saatlik geriçağırma: danışanın bir gününde yediklerini besin besin gir. ' +
        'Toplamlar hedefle karşılaştırılır; menü yazım kuralları burada uygulanmaz.</div>' : '') +
      exchangeCard(t) +
      (DA.menuKural && m.tur !== 'geri' ? DA.menuKural.kartHtml(m) : '') +
      mikroKartHtml(m) +
      MEALS.map((k) => {
        const list = m.meals[k] || [], mt = mealTotals(list);
        return '<div class="card"><div class="row between"><h2 class="ogun-bas">' + DA.ogunIkon(k) + k + '</h2><span class="small muted">' + (list.length ? fmt(mt.kcal, 0) + ' kcal' : '') + '</span></div>' +
          list.map((it, i) => {
            const f = getFood(it.id), n = itemNut(it);
            const olcu = olcuYazi(it);
            return '<div class="res"><button class="l duzen" data-act="menuItemEdit" data-m="' + m.id + '" data-k="' + esc(k) + '" data-i="' + i + '" aria-label="' + esc((f ? f.n : it.n) + ' — miktarı düzenle') + '">' + esc(f ? f.n : it.n) + '<span class="sub">' + (olcu ? esc(olcu) + ' · ' : '') + fmt(it.g, 0) + ' g' + (f ? '' : ' · besin veritabanında yok') + '</span></button><span class="v" style="font-size:15px">' + fmt(n.kcal, 0) + ' kcal <button class="iconbtn" style="width:36px;height:36px" data-act="menuDelItem" data-m="' + m.id + '" data-k="' + esc(k) + '" data-i="' + i + '" aria-label="Sil">' + DA.icon('trash') + '</button></span></div>';
          }).join('') +
          '<div class="grid2 mt-s"><button class="btn sec sm block" data-act="menuAdd" data-m="' + m.id + '" data-k="' + esc(k) + '">' + DA.icon('plus') + ' Besin ekle</button>' +
          '<button class="btn ghost sm block" data-act="menuSablon" data-m="' + m.id + '" data-k="' + esc(k) + '">' + DA.icon('cards') + ' Şablon</button></div></div>';
      }).join('') +
      '<div class="card"><label class="fld"><span>Menü başlığı</span><input type="text" value="' + esc(m.title) + '" data-live="menuMeta" data-f="title" data-m="' + m.id + '"></label>' +
      '<div class="grid2"><label class="fld"><span>Tarih</span><input type="date" value="' + esc(m.date) + '" data-live="menuMeta" data-f="date" data-m="' + m.id + '"></label>' +
      danisanSecimi(m) + '</div>' +
      '<label class="fld"><span>Notlar / öneriler</span><textarea data-live="menuMeta" data-f="note" data-m="' + m.id + '" placeholder="Su tüketimi, pişirme yöntemi, öneriler…">' + esc(m.note) + '</textarea></label>' +
      '<button class="btn sec block" data-act="menuTarget" data-m="' + m.id + '">Günlük hedefi düzenle (' + fmt(tg.kcal, 0) + ' kcal)</button></div>' +
      '<div class="grid2"><a class="btn block" href="#/yazdir/menu/' + m.id + '">' + DA.icon('share') + ' PDF / Paylaş</a><button class="btn ghost block" data-act="menuCopy" data-m="' + m.id + '">Kopyala</button></div>' +
      '<button class="btn danger block mt" data-act="menuDelete" data-m="' + m.id + '">Menüyü sil</button>';
    return { title: m.title, tab: 'besin', back: 'menu', html };
  };
  /* Bağlı menüde danışanın GÜNCEL adı; ad sonradan değişirse menüde eskisi kalmasın */
  function danisanAdi(m) {
    const c = m.c && (DA.state().clients || []).find((x) => x.id === m.c);
    return c ? c.name : (m.client || '');
  }
  /* Menü danışana kimliğiyle bağlanır. Eskiden serbest metindi ("Ad/kod"):
     danışan dosyasında görünmüyor, ad değişince kopuyordu. Eski metin
     kaybolmasın diye bağlanmamış menüde altında gösterilir. */
  function danisanSecimi(m) {
    const cl = (DA.state().clients || []).slice().sort((a, b) => String(a.name).localeCompare(String(b.name), 'tr'));
    return '<label class="fld"><span>Danışan</span><select data-change="menuDanisan" data-m="' + esc(m.id) + '">' +
      '<option value="">Bağlı değil</option>' + cl.map((c) => '<option value="' + esc(c.id) + '"' + (m.c === c.id ? ' selected' : '') + '>' +
        esc(c.name) + '</option>').join('') + '</select>' +
      (!m.c && m.client ? '<span class="muted tiny" style="display:block;margin-top:4px">Eski kayıttaki ad: ' + esc(m.client) + '</span>' : '') + '</label>';
  }
  DA.live.menuDanisan = (el) => {
    const m = DA.state().menus.find((x) => x.id === el.dataset.m); if (!m) return;
    const c = (DA.state().clients || []).find((x) => x.id === el.value);
    m.c = c ? c.id : ''; if (c) m.client = c.name;
    DA.save(); DA.render(true);
  };
  /* Menünün makrolarının yaklaşık değişim karşılığı */
  function exchangeCard(t) {
    if (!DA.exchange || !(t.kcal > 0)) return '';
    return '<details class="acc"><summary>Değişim listesi karşılığı (yaklaşık)</summary><div class="body">' +
      '<div class="macros"><div><b>' + fmt(t.c / 15, 1) + '</b><small>KH değişimi</small></div>' +
      '<div><b>' + fmt(t.p / 6, 1) + '</b><small>et eşdeğeri</small></div>' +
      '<div><b>' + fmt(t.f / 5, 1) + '</b><small>yağ eşdeğeri</small></div></div>' +
      '<p class="muted tiny" style="margin-bottom:0">Kaba karşılıktır: karbonhidrat 15 g, protein 6 g, yağ 5 g başına 1 değişim sayılır. Gruplar birbirine protein ve yağ da taşıdığı için gerçek dağılım farklı olur — planı <a href="#/hesapla/degisim">Değişim listesi</a> ile kurun.</p></div></details>';
  }

  /* Değişim planından menü iskeleti — hedefi plandan alır, dağılımı nota yazar */
  DA.menuFromExchange = (counts, groups, tot) => {
    if (!tot || !tot.n) return DA.toast('Önce değişim planı oluştur');
    const lines = groups.filter((g) => counts[g.k]).map((g) => '• ' + g.l + ': ' + fmt(counts[g.k], 1) + ' değişim');
    const m = {
      id: DA.uid(), title: 'Değişim planı menüsü', date: DA.today(), client: '',
      note: 'Değişim dağılımı:\n' + lines.join('\n') +
        '\n\nHedef: ' + fmt(tot.kcal, 0) + ' kcal · KH ' + fmt(tot.c, 0) + ' g · Protein ' + fmt(tot.p, 0) + ' g · Yağ ' + fmt(tot.f, 0) + ' g',
      target: { kcal: Math.round(tot.kcal), p: Math.round(tot.p), c: Math.round(tot.c), f: Math.round(tot.f) },
      meals: {}
    };
    MEALS.forEach((k) => { m.meals[k] = []; });
    DA.state().menus.unshift(m); DA.save();
    DA.toast('Menü oluşturuldu — öğünlere besin ekle');
    DA.go('menu/' + m.id);
  };

  DA.live.menuMeta = (el) => {
    const m = DA.state().menus.find((x) => x.id === el.dataset.m); if (!m) return;
    m[el.dataset.f] = el.value; DA.save();
    if (el.dataset.f === 'title') DA.$('#title').textContent = el.value || 'Menü';
  };
  DA.actions.menuNew = () => { const m = newMenu(); DA.state().menus.unshift(m); DA.save(); DA.go('menu/' + m.id); };
  DA.actions.menuDelete = (el) => {
    const S = DA.state(), i = S.menus.findIndex((m) => m.id === el.dataset.m);
    if (i < 0) return;
    const silinen = S.menus[i];
    S.menus.splice(i, 1); DA.save(); DA.go('menu');
    DA.silGeriAl((silinen.title || 'Menü') + ' silindi', () => { DA.state().menus.splice(i, 0, silinen); });
  };
  DA.actions.menuDelItem = (el) => {
    const m = DA.state().menus.find((x) => x.id === el.dataset.m);
    const k = el.dataset.k, i = parseInt(el.dataset.i, 10);
    const silinen = m.meals[k][i];
    m.meals[k].splice(i, 1); DA.save(); DA.render(true);
    DA.silGeriAl('Besin çıkarıldı', () => { m.meals[k].splice(i, 0, silinen); });
  };
  DA.actions.menuCopy = (el) => {
    const S = DA.state(), m = S.menus.find((x) => x.id === el.dataset.m);
    if (!m) return;
    const c = JSON.parse(JSON.stringify(m));   /* derin kopya: öğünler paylaşılmasın */
    c.id = uid(); c.title = m.title + ' (kopya)';
    c.date = DA.today();                       /* kopya yeni bir gün için alınır */
    S.menus.unshift(c); DA.save(); DA.go('menu/' + c.id);
    DA.toast('Menü kopyalandı');
  };
  DA.actions.menuTarget = (el) => {
    const m = DA.state().menus.find((x) => x.id === el.dataset.m), t = targetOf(m);
    DA.sheet('Günlük hedef', '<form data-form="menuTarget" data-m="' + m.id + '"><div class="grid2"><label class="fld"><span>Enerji (kcal)</span><input type="text" inputmode="decimal" name="kcal" value="' + t.kcal + '"></label>' +
      '<label class="fld"><span>Protein (g)</span><input type="text" inputmode="decimal" name="p" value="' + t.p + '"></label><label class="fld"><span>Karbonhidrat (g)</span><input type="text" inputmode="decimal" name="c" value="' + t.c + '"></label>' +
      '<label class="fld"><span>Yağ (g)</span><input type="text" inputmode="decimal" name="f" value="' + t.f + '"></label></div><button class="btn block">Kaydet</button>' +
      '<p class="muted small">Hedefi hesaplayıcıdan da (Hesapla → Enerji ihtiyacı) kaydedebilirsin.</p></form>');
  };
  DA.forms.menuTarget = (f) => {
    const m = DA.state().menus.find((x) => x.id === f.dataset.m), d = DA.formData(f), t = { kcal: num(d.kcal), p: num(d.p), c: num(d.c), f: num(d.f) };
    if (!isFinite(t.kcal)) return DA.toast('Enerji hedefi gerekli');
    ['p', 'c', 'f'].forEach((k) => { if (!isFinite(t[k])) t[k] = 0; });
    m.target = t; DA.save(); DA.closeSheet(); DA.render(true);
  };

  /* besin seçici (menüye ekleme) */
  let pickQ = '';
  DA.actions.menuAdd = (el) => {
    pickQ = '';
    DA.sheet(el.dataset.k + ' — besin ekle', '<input type="search" placeholder="Besin ara…" data-live="pickSearch" data-m="' + el.dataset.m + '" data-k="' + esc(el.dataset.k) + '"><div id="pickList" class="list mt-s"></div>',
      () => { fillPick(el.dataset.m, el.dataset.k); });
  };
  function fillPick(mid, k) {
    const q = DA.trLower(pickQ), items = allFoods().filter((f) => !q || DA.trLower(f.n).includes(q)).slice(0, 60);
    DA.$('#pickList').innerHTML = items.length ? items.map((f) => '<button class="li" data-act="pickFood" data-id="' + esc(f.id) + '" data-m="' + mid + '" data-k="' + esc(k) + '">' + DA.besinIkon(f.cat) + '<span class="grow"><div class="t">' + esc(f.n) + '</div><div class="s">' + esc(f.cat) + '</div></span><span class="end">' + fmt(f.kcal, 0) + ' kcal</span></button>').join('') : '<div class="empty">Bulunamadı</div>';
  }
  DA.live.pickSearch = (el) => { pickQ = el.value; fillPick(el.dataset.m, el.dataset.k); };
  DA.actions.pickFood = (el) => {
    const f = getFood(el.dataset.id), mid = el.dataset.m, k = el.dataset.k;
    DA.sheet(f.n, '<form id="amtForm" data-id="' + esc(f.id) + '" data-m="' + mid + '" data-k="' + esc(k) + '" onsubmit="return false"><div class="grid2"><label class="fld"><span>Miktar</span><input type="text" inputmode="decimal" name="amt" value="1" data-live="amt"></label>' +
      '<label class="fld"><span>Birim</span><select name="unit" data-live="amt">' + unitOptions(f) + '</select></label></div><div id="amtPrev"></div>' +
      '<button class="btn block mt" data-act="pickConfirm">' + esc(k) + ' öğününe ekle</button></form>',
      () => { const form = DA.$('#amtForm'); form.unit.value = f.u.length ? String(f.u[0][1]) : '1'; updatePreview(); });
  };
  DA.actions.pickConfirm = () => {
    const form = DA.$('#amtForm'), g = parseFloat(form.dataset.g);
    if (!(g > 0)) return DA.toast('Miktarı gir');
    const m = DA.state().menus.find((x) => x.id === form.dataset.m);
    m.meals[form.dataset.k].push(formdanOge(form));
    DA.save(); DA.closeSheet(); DA.render(true);
  };

  /* Menüdeki besini düzenle: miktar, ölçü ve sıra. Eskiden yalnız silme
     vardı; miktarı değiştirmek için besini silip yeniden aramak gerekiyordu. */
  const ogeBul = (d) => {
    const m = DA.state().menus.find((x) => x.id === d.m), l = m && m.meals[d.k];
    const i = parseInt(d.i, 10);
    return l && l[i] ? { m, l, i, it: l[i] } : null;
  };
  DA.actions.menuItemEdit = (el) => {
    const o = ogeBul(el.dataset); if (!o) return;
    const f = getFood(o.it.id);
    if (!f) return DA.toast('Bu besin veritabanında yok; silip yeniden ekleyebilirsin');
    const veri = 'data-m="' + esc(o.m.id) + '" data-k="' + esc(el.dataset.k) + '" data-i="' + o.i + '"';
    DA.sheet(f.n, '<form id="amtForm" data-id="' + esc(f.id) + '" ' + veri + ' onsubmit="return false"><div class="grid2">' +
      '<label class="fld"><span>Miktar</span><input type="text" inputmode="decimal" name="amt" value="' + esc(fmt(o.it.o ? o.it.a : o.it.g, 2)) + '" data-live="amt"></label>' +
      '<label class="fld"><span>Birim</span><select name="unit" data-live="amt">' + unitOptions(f) + '</select></label></div><div id="amtPrev"></div>' +
      '<button class="btn block mt" data-act="menuItemSave" ' + veri + '>Kaydet</button>' +
      '<div class="grid2 mt-s"><button class="btn ghost block" data-act="menuItemMove" data-yon="-1" ' + veri + (o.i === 0 ? ' disabled' : '') + '>Yukarı taşı</button>' +
      '<button class="btn ghost block" data-act="menuItemMove" data-yon="1" ' + veri + (o.i === o.l.length - 1 ? ' disabled' : '') + '>Aşağı taşı</button></div></form>',
      () => {
        const form = DA.$('#amtForm');
        const sec = o.it.o ? Array.from(form.unit.options).find((x) => x.dataset.ad === o.it.o) : null;
        if (sec) sec.selected = true; else form.unit.value = '1';
        updatePreview();
      });
  };
  DA.actions.menuItemSave = (el) => {
    const o = ogeBul(el.dataset), form = DA.$('#amtForm');
    if (!o || !form) return;
    if (!(parseFloat(form.dataset.g) > 0)) return DA.toast('Miktarı gir');
    const yeni = formdanOge(form);
    o.l[o.i] = yeni;
    DA.save(); DA.closeSheet(); DA.render(true);
  };
  DA.actions.menuItemMove = (el) => {
    const o = ogeBul(el.dataset); if (!o) return;
    const j = o.i + parseInt(el.dataset.yon, 10);
    if (j < 0 || j >= o.l.length) return;
    const t = o.l[j]; o.l[j] = o.l[o.i]; o.l[o.i] = t;
    DA.save(); DA.closeSheet(); DA.render(true);
  };

  /* ---------- Yazdır / paylaş ---------- */
  /* Çıktıda açılıp kapatılan bölümler (DA.cikti 'menu'). Kalori ve makro
     bazı danışanlara verilmek istenmiyor; metin paylaşımı da aynı seçime uyar. */
  const mg = (k) => DA.cikti.acik('menu', k);
  function gunlukToplam(t, ayrac) {
    const p = [];
    if (mg('enerji')) p.push(fmt(t.kcal, 0) + ' kcal');
    if (mg('makro')) p.push('Protein ' + fmt(t.p, 0) + ' g', 'Karbonhidrat ' + fmt(t.c, 0) + ' g', 'Yağ ' + fmt(t.f, 0) + ' g', 'Lif ' + fmt(t.fib, 0) + ' g');
    return p.join(ayrac);
  }
  function menuText(m) {
    const t = menuTotals(m); let s = m.title + '\n' + DA.fdate(m.date) + (danisanAdi(m) ? ' — ' + danisanAdi(m) : '') + '\n' + DA.dyt() + '\n';
    MEALS.forEach((k) => {
      const l = m.meals[k] || []; if (!l.length) return;
      s += '\n' + k + (mg('enerji') ? ' (' + fmt(mealTotals(l).kcal, 0) + ' kcal)' : '') + '\n';
      l.forEach((it) => { const f = getFood(it.id); s += '• ' + (f ? f.n : it.n) + ' — ' + miktarHucre(it) + '\n'; });
    });
    const gt = gunlukToplam(t, ' · ');
    if (gt) s += '\nGünlük toplam: ' + gt;
    if (m.note && mg('not')) s += '\n\nNot: ' + m.note;
    return s;
  }
  /* Çıktı ekrandaki menünün aynısıdır; yazım kuralına uymayan yer varsa
     kâğıda basılmadan önce (basılmayan) bir notla söylenir. Çıktıda sessizce
     yeniden sıralamak ekran ile kâğıdı ayırırdı. */
  function kuralUyarisi(m) {
    if (!DA.menuKural) return '';
    const n = DA.menuKural.denetle(m).length;
    return n ? '<div class="note warn noprint">Bu menüde ' + n + ' yazım kuralı notu var. ' +
      '<a href="#/menu/' + esc(m.id) + '">Menüye dön</a> ve “Menü yazım kuralları” kartına bak.</div>' : '';
  }
  /* Yazdırma rotaları hesaplayıcı yönlendiricisinden geçmediği için
     ihtiyaç duydukları veriyi kendileri yükler. */
  const YAZ_VERI = { degisim: ['tuber', 'hedef'], ornekmenu: ['ornekMenu'], menu: ['porsiyonBesin', 'hedef'], toplu: ['toplu'], sporkh: ['sporperf'] };
  DA.views.yazdir = (parts) => {
    const ihtiyac = YAZ_VERI[parts[0]];
    if (ihtiyac && !DA.hazir(ihtiyac)) {
      DA.need(ihtiyac).then(() => { DA.foodsInvalidate(); DA.render(true); }).catch(() => {});
      return { title: 'Yazdır', back: 'ana', noRecent: true,
        html: DA.iskelet('belge', 'Çıktı hazırlanıyor') };
    }
    if (parts[0] === 'menu') {
      const m = DA.state().menus.find((x) => x.id === parts[1]);
      if (!m) return { title: 'Yazdır', back: 'menu', html: '<div class="card">Menü bulunamadı.</div>' };
      const t = menuTotals(m);
      let rows = '';
      MEALS.forEach((k) => {
        const l = m.meals[k] || []; if (!l.length) return;
        const en = mg('enerji');
        rows += '<tr class="mh"><td colspan="2">' + k + '</td>' + (en ? '<td class="n">' + fmt(mealTotals(l).kcal, 0) + ' kcal</td>' : '') + '</tr>';
        l.forEach((it) => { const f = getFood(it.id); rows += '<tr><td>' + esc(f ? f.n : it.n) + '</td><td class="n">' + esc(miktarHucre(it)) + '</td>' + (en ? '<td class="n">' + fmt(itemNut(it).kcal, 0) + '</td>' : '') + '</tr>'; });
      });
      return {
        title: 'PDF / Paylaş', tab: 'besin', back: 'menu/' + m.id,
        html: '<div class="noprint grid2 mb"><button class="btn block" data-act="doPrint">PDF olarak kaydet / yazdır</button><button class="btn ghost block" data-act="menuShare" data-m="' + m.id + '">Metin olarak paylaş</button></div>' +
          '<p class="noprint muted small">iPhone: “PDF olarak kaydet / yazdır” → önizlemeyi iki parmakla büyüt → paylaş simgesi → PDF’i Dosyalar’a kaydet ya da WhatsApp ile gönder.</p>' +
          kuralUyarisi(m) +
          DA.cikti.panel('menu', [['enerji', 'Kalori'], ['makro', 'Makrolar']].concat(m.note ? [['not', 'Notlar']] : [])) +
          '<div class="printdoc">' + DA.antet() + '<h2>' + esc(m.title) + '</h2><div class="alt">' + esc(DA.fdate(m.date)) + (danisanAdi(m) ? ' · ' + esc(danisanAdi(m)) : '') + '</div>' +
          '<table><thead><tr><th>Besin</th><th class="n">Miktar</th>' + (mg('enerji') ? '<th class="n">kcal</th>' : '') + '</tr></thead><tbody>' + rows + '</tbody></table>' +
          (gunlukToplam(t, ' · ') ? '<div class="gunluk-toplam"><b>Günlük toplam:</b> ' + gunlukToplam(t, ' · ') + '</div>' : '') +
          (m.note && mg('not') ? '<div class="blok"><h3>Notlar</h3>' + esc(m.note).replace(/\n/g, '<br>') + '</div>' : '') +
          DA.dipnot('besin değerleri yaklaşık ortalamalardır; bu liste bireysel tıbbi tavsiye yerine geçmez.') + '</div>'
      };
    }
    if (parts[0] === 'staj') return DA.views._printJournal(parts.slice(1));
    if (parts[0] === 'danisan') return DA.views._printClient(parts.slice(1));
    if (parts[0] === 'degisim' && DA.views._printExchange) return DA.views._printExchange(parts.slice(1));
    if (parts[0] === 'liste' && DA.views._printListe) return DA.views._printListe(parts.slice(1));
    if (parts[0] === 'hafta' && DA.views._printHafta) return DA.views._printHafta(parts.slice(1));
    if (parts[0] === 'toplu' && DA.views._printToplu) return DA.views._printToplu(parts.slice(1));
    if (parts[0] === 'sporkh' && DA.views._printSporKh) return DA.views._printSporKh(parts.slice(1));
    if (parts[0] === 'ornekmenu' && DA.views._printOrnek) return DA.views._printOrnek(parts.slice(1));
    return { title: 'Yazdır', html: '<div class="card">Bulunamadı.</div>' };
  };
  DA.actions.doPrint = () => window.print();
  DA.actions.menuShare = (el) => { const m = DA.state().menus.find((x) => x.id === el.dataset.m); DA.shareText(m.title, menuText(m)); };
})();
