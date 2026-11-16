/* Diyet listesi yazıcı — değişim planından danışana verilecek liste.

   Neden: değişim listesi grup SAYISIYLA, menü planlayıcı GRAMLA çalışıyordu
   ve ikisi bağlı değildi. Danışana giden asıl belge — öğün öğün, ev ölçüsüyle
   yazılmış liste — elle Word'de hazırlanıyordu. Burada plan öğün hedeflerine
   bölünmüş olarak gelir, her satır "1 su bardağı yarım yağlı süt" gibi
   yazılır, öğünde kaç değişim kaldığı canlı görünür ve yazım kuralları
   (js/menukural.js) aynı anda denetlenir.

   Liste planın o anki KOPYASINI tutar (ex, meal): plan sonradan değişirse
   yazılmış liste kendiliğinden bozulmaz; danışana verilmiş belge budur.

   Hazır seçeneklerin kaynağı (HAZIR):
     · Uygulamadaki değişim listesinin porsiyon örnekleri (js/exchange.js,
       derste kullanılan liste)
     · Dyt. Can Bayramoğlu'nun belirttiği karşılıklar: çorba 1 ekmek + 1 yağ,
       zeytinyağlı sebze yemeği ve salata 1 sebze + 1 yağ, yağsız salata
       1 sebze, pilav yalnız ekmek, hastane roll ekmek 2 ekmek, 4 yk kuru
       baklagil 1 değişim.
   Bunların dışında değer eklenmedi. Kaynak gelene kadar (ders listesi,
   TürKomp, ölçü kataloğu) diyetisyen kendi satırını yazar ve isterse
   "seçeneklerim"e kaydeder (S.esdegerler). */
(function () {
  'use strict';
  const { esc, fmt, num, icon } = DA;

  /* id, satır (1 birim için), değişim karşılığı, seçicide görünen not */
  const HAZIR = [
    ['sut', '1 su bardağı süt', { sut: 1 }, '200 ml'],
    ['yogurt', '200 g yoğurt', { sut: 1 }],
    ['ayran', '2 su bardağı ayran', { sut: 1 }],
    ['sut-yy', '1 su bardağı yarım yağlı süt', { sutyy: 1 }, '200 ml'],
    ['yogurt-yy', '200 g yarım yağlı yoğurt', { sutyy: 1 }],
    ['et-kirmizi', '1 köfte kadar kırmızı et', { et: 1 }, '30 g'],
    ['et-tavuk', '1 köfte kadar tavuk', { et: 1 }, '30 g'],
    ['et-balik', '1 köfte kadar balık', { et: 1 }, '30 g'],
    ['peynir', '1 dilim beyaz peynir', { et: 1 }, '30 g'],
    ['yumurta', '1 adet yumurta', { et: 1 }],
    ['nohut', '4 yemek kaşığı nohut', { baklagil: 1 }, 'pişmiş'],
    ['kurufasulye', '4 yemek kaşığı kuru fasulye', { baklagil: 1 }, 'pişmiş'],
    ['mercimek', '4 yemek kaşığı mercimek', { baklagil: 1 }, 'pişmiş'],
    ['corba', '1 kase çorba', { eyg: 1, yag: 1 }],
    ['ekmek', '1 ince dilim ekmek', { eyg: 1 }, '25 g'],
    ['roll', '1 adet tam buğday roll ekmek', { eyg: 2 }, 'hastane'],
    ['roll-cavdar', '1 adet çavdar roll ekmek', { eyg: 2 }, 'hastane'],
    ['pilav', '3 yemek kaşığı pilav', { eyg: 1 }, 'yağ ayrıca sayılmaz'],
    ['bulgur', '3 yemek kaşığı bulgur pilavı', { eyg: 1 }, 'yağ ayrıca sayılmaz'],
    ['makarna', '3 yemek kaşığı makarna', { eyg: 1 }],
    ['patates', '1 küçük boy haşlanmış patates', { eyg: 1 }],
    ['salata', '1 kase yağsız salata', { sebze: 1 }],
    ['salata-zy', '1 kase zeytinyağlı salata', { sebze: 1, yag: 1 }],
    ['sebze-zy', '1 kase zeytinyağlı sebze yemeği', { sebze: 1, yag: 1 }, '5–6 yemek kaşığı'],
    ['elma', '1 küçük boy elma', { meyve: 1 }],
    ['muz', '1 küçük boy muz', { meyve: 1 }],
    ['portakal', '1 orta boy portakal', { meyve: 1 }],
    ['uzum', '12–15 adet üzüm', { meyve: 1 }],
    ['zeytinyagi', '1 tatlı kaşığı zeytinyağı', { yag: 1 }],
    ['zeytin', '5 adet zeytin', { yag: 1 }],
    ['ceviz', '2 tam ceviz', { tohum: 1 }],
    ['badem', '5–6 adet badem', { tohum: 1 }]
  ].map((x) => ({ id: 'h-' + x[0], t: x[1], d: x[2], not: x[3] || '' }));

  /* Değişim listesindeki öğün anahtarları; kural denetimi menü planlayıcının
     öğün adlarıyla çalışır (gece kuralı "Gece ara öğünü"ne bağlı). */
  const KURAL_ADI = { kahvalti: 'Kahvaltı', ara1: 'Kuşluk', ogle: 'Öğle', ara2: 'İkindi', aksam: 'Akşam', gece: 'Gece ara öğünü' };
  const ogunler = () => (DA.exchange && DA.exchange.ogunler) ||
    [['kahvalti', 'Kahvaltı'], ['ara1', 'Kuşluk'], ['ogle', 'Öğle'], ['ara2', 'İkindi'], ['aksam', 'Akşam'], ['gece', 'Gece']];
  const ogunAdi = (k) => { const o = ogunler().find((x) => x[0] === k); return o ? o[1] : k; };
  const gruplar = () => DA.exchange.groups;
  const kisa = (k) => (DA.exchange.kisa || {})[k] || k;

  const S = () => DA.state();
  const listeler = () => (S().listeler = S().listeler || []);
  const esdegerler = () => (S().esdegerler = S().esdegerler || []);
  const bul = (id) => listeler().find((l) => l.id === id) || null;
  const danisan = (id) => (id ? (S().clients || []).find((c) => c.id === id) : null) || null;
  const secenekler = () => HAZIR.concat(esdegerler().map((e) => Object.assign({ kendi: true, not: '' }, e)));
  const secenek = (id) => secenekler().find((e) => e.id === id) || null;
  const miktar = (n) => (DA.foods && DA.foods.miktarYazi ? DA.foods.miktarYazi(n) : fmt(n, 2));

  /* Satırın n katı: "1 ince dilim ekmek" ×2 → "2 ince dilim ekmek",
     "12–15 adet üzüm" ×2 → "24–30 adet üzüm", "1 su bardağı süt" ×½ →
     "½ su bardağı süt". Sayı tam çıkmazsa (5 zeytinin yarısı) uydurmamak
     için "½ × 5 adet zeytin" yazılır. */
  function carp(t, n) {
    t = String(t || '');
    if (!(n > 0) || n === 1) return t;
    const m = /^(\d+)(?:–(\d+))?(\s.*)$/.exec(t);
    if (m) {
      if (m[1] === '1' && !m[2]) return miktar(n) + m[3];
      const a = +m[1] * n, b = m[2] ? +m[2] * n : null;
      if (Number.isInteger(a) && (b == null || Number.isInteger(b))) return a + (b != null ? '–' + b : '') + m[3];
    }
    return miktar(n) + ' × ' + t;
  }
  /* Satırın değişim toplamı (d × n) */
  function satirDegisim(x) {
    const o = {}, d = (x && x.d) || {}, n = x && x.n > 0 ? x.n : 1;
    Object.keys(d).forEach((k) => { if (d[k] > 0) o[k] = d[k] * n; });
    return o;
  }
  function topla(liste) {
    const o = {};
    (liste || []).forEach((x) => { const d = satirDegisim(x); Object.keys(d).forEach((k) => { o[k] = (o[k] || 0) + d[k]; }); });
    return o;
  }
  /* "1 ekmek + 1 yağ" */
  const karsilik = (d) => gruplar().filter((g) => d[g.k] > 0).map((g) => miktar(d[g.k]) + ' ' + DA.trLower(kisa(g.k))).join(' + ');

  /* Kural türü: adından (çorba, ekmek, peynir…) ve değişim grubundan. Ad
     "1 kase çorba" gibi genel olabilir; karbonhidrat ve protein eşi grup
     karşılığından kesin bilinir. */
  function satirTur(x) {
    const t = DA.menuKural.tur({ n: carp(x.t, x.n) }), d = x.d || {};
    const var_ = (...k) => k.some((g) => d[g] > 0);
    t.meyve = t.meyve || var_('meyve');
    t.kh = t.kh || var_('eyg', 'meyve', 'baklagil');
    t.esli = t.esli || var_('sut', 'sutyy', 'et', 'tohum', 'baklagil');
    return t;
  }
  function kuralSonucu(l) {
    const T = {};
    Object.keys(KURAL_ADI).forEach((k) => { T[KURAL_ADI[k]] = (l.ogun[k] || []).map(satirTur); });
    return DA.menuKural.denetleTur(T);
  }
  /* Yeni satır yazım sırasındaki yerine girer: çorba ve sıvılar başa, ekmek
     sona. Aynı türden satırlar girildikleri sırada kalır. */
  function yerlestir(dizi, x) {
    const r = DA.menuKural.sira(satirTur(x));
    let i = dizi.length;
    while (i > 0 && DA.menuKural.sira(satirTur(dizi[i - 1])) > r) i--;
    dizi.splice(i, 0, x);
  }

  /* Listede öğün hedefi hiç yoksa (planı olmadan kopyalanmış ya da eski
     liste) plana göre karşılaştırma yapılmaz: her satır "fazla" görünürdü. */
  const planVar = (l) => Object.keys(l.meal || {}).some((k) => Object.keys(l.meal[k] || {}).length);
  /* Öğünün hedefe göre durumu: grup → [yazılan, hedef] */
  function durum(l, k) {
    if (!planVar(l)) return [];
    const h = l.meal[k] || {}, y = topla(l.ogun[k]), o = [];
    gruplar().forEach((g) => {
      const a = y[g.k] || 0, b = h[g.k] || 0;
      if (a > 0 || b > 0) o.push({ k: g.k, y: a, h: b });
    });
    return o;
  }
  const esit = (a, b) => Math.abs(a - b) < 0.01;
  function durumCipleri(l, k) {
    const d = durum(l, k);
    if (!d.length) return '';
    return '<div class="durum mt-s">' + d.map((x) => {
      const ok = esit(x.y, x.h), az = x.y < x.h;
      return '<span class="badge ' + (ok ? 'ok' : az ? 'warn' : 'bad') + '" data-grup="' + x.k + '">' +
        esc(kisa(x.k)) + ' ' + miktar(x.y) + '/' + miktar(x.h) + (ok ? ' ✓' : az ? ' eksik' : ' fazla') + '</span>';
    }).join(' ') + '</div>';
  }
  /* Plana uymayan öğünler: "Öğle: 1 ekmek eksik, 1 yağ fazla" */
  function uyumsuzluk(l) {
    return ogunler().map((o) => {
      const d = durum(l, o[0]).filter((x) => !esit(x.y, x.h));
      if (!d.length) return '';
      return o[1] + ': ' + d.map((x) => miktar(Math.abs(x.y - x.h)) + ' ' + DA.trLower(kisa(x.k)) + (x.y < x.h ? ' eksik' : ' fazla')).join(', ');
    }).filter(Boolean);
  }
  const gununToplami = (l) => {
    const y = {};
    ogunler().forEach((o) => { const t = topla(l.ogun[o[0]]); Object.keys(t).forEach((k) => { y[k] = (y[k] || 0) + t[k]; }); });
    return y;
  };

  /* ---- oluşturma: değişim listesinden çağrılır ---- */
  function olustur(o) {
    const l = { id: DA.uid(), ad: 'Beslenme listesi', d: DA.today(), c: o.c || '',
      ex: JSON.parse(JSON.stringify(o.ex || {})), meal: JSON.parse(JSON.stringify(o.meal || {})),
      hedef: o.hedef ? { kcal: o.hedef.kcal } : {}, ogun: {}, not: '', ayar: {} };
    listeler().unshift(l);
    DA.save();
    return l;
  }

  /* ---- görünümler ---- */
  DA.views.liste = (parts) => {
    const id = parts[0];
    if (!id) return listeIndeks();
    const l = bul(id);
    if (!l) return { title: 'Diyet listesi', back: 'liste', html: '<div class="card">Liste bulunamadı.</div>' };
    return listeEkrani(l);
  };

  function listeIndeks() {
    const L = listeler();
    return {
      title: 'Diyet listeleri', tab: 'besin', back: 'besin',
      html: L.length ? '<div class="list">' + L.map((l) => {
        const c = danisan(l.c);
        return '<a class="li chev" href="#/liste/' + esc(l.id) + '"><span class="ic">' + icon('note') + '</span>' +
          '<span class="grow"><div class="t">' + esc(l.ad || 'Beslenme listesi') + '</div><div class="s">' + esc(DA.fdate(l.d)) +
          (c ? ' · ' + esc(c.name) : '') + '</div></span></a>';
      }).join('') + '</div>'
        : DA.emptyState('note', { baslik: 'Henüz diyet listesi yok',
          aciklama: 'Değişim listesinde planı kur, öğünlere dağıt ve “Diyet listesi yaz”a dokun; öğün hedefleri hazır gelsin.',
          eylem: { href: '#/hesapla/degisim', etiket: 'Değişim listesine git', ico: 'swap' } })
    };
  }

  function listeEkrani(l) {
    const c = danisan(l.c), lid = esc(l.id);
    const gorunen = ogunler().filter((o) => Object.keys(l.meal[o[0]] || {}).length || (l.ogun[o[0]] || []).length);
    const kalan = ogunler().filter((o) => gorunen.indexOf(o) < 0);
    const y = gununToplami(l), t = DA.exchange.totals(y);
    const ayar = (k, etiket) => '<button class="chip' + (l.ayar[k] ? ' on' : '') + '" data-act="listeAyar" data-l="' + lid + '" data-k="' + k +
      '" aria-pressed="' + (l.ayar[k] ? 'true' : 'false') + '">' + etiket + '</button>';
    const kural = DA.menuKural ? DA.menuKural.kartHtmlSonuc(kuralSonucu(l),
      '<button class="btn sec sm block" data-act="listeDiz" data-l="' + lid + '">Yazım sırasına diz</button>') : '';
    const bos = !gorunen.some((o) => (l.ogun[o[0]] || []).length);
    return {
      title: l.ad || 'Diyet listesi', tab: 'besin', back: c ? 'danisan/' + c.id : 'liste',
      html:
        '<div class="card"><label class="fld"><span>Liste başlığı</span><input type="text" value="' + esc(l.ad) + '" data-live="listeMeta" data-f="ad" data-l="' + lid + '"></label>' +
        '<div class="grid2"><label class="fld"><span>Tarih</span><input type="date" value="' + esc(l.d) + '" data-live="listeMeta" data-f="d" data-l="' + lid + '"></label>' +
        '<div class="fld"><span>Danışan</span><div class="small" style="padding-top:12px">' +
          (c ? '<a href="#/danisan/' + esc(c.id) + '">' + esc(c.name) + '</a>' : '<span class="muted">genel</span>') + '</div></div></div>' +
        '<div class="small muted" id="listeGun">' + gunOzetHtml(l, y, t) + '</div></div>' +
        (bos ? '' : kural) +
        gorunen.map((o) => ogunKarti(l, o)).join('') +
        (kalan.length ? '<div class="card"><div class="small muted mb">Başka öğüne satır ekle</div><div class="chips">' +
          kalan.map((o) => '<button class="chip" data-act="listeEkle" data-l="' + lid + '" data-o="' + o[0] + '">' + icon('plus') + ' ' + esc(o[1]) + '</button>').join('') +
          '</div></div>' : '') +
        '<div class="card"><label class="fld"><span>Öneriler (listenin altına basılır)</span><textarea data-live="listeMeta" data-f="not" data-l="' + lid + '" placeholder="Su tüketimi, pişirme yöntemi, öğün saatleri…">' + esc(l.not) + '</textarea></label>' +
        '<div class="small muted mb">Çıktıda göster</div><div class="chips">' + ayar('enerji', 'Enerji ve makrolar') + ayar('degisim', 'Değişim tablosu') + '</div></div>' +
        '<div class="grid2"><a class="btn block" href="#/yazdir/liste/' + lid + '">' + icon('share') + ' PDF / Yazdır</a>' +
        '<button class="btn ghost block" data-act="listeShare" data-l="' + lid + '">Metin olarak paylaş</button></div>' +
        '<div class="grid2 mt-s"><button class="btn ghost block" data-act="listeKopya" data-l="' + lid + '">Kopyala</button>' +
        '<button class="btn danger block" data-act="listeSil" data-l="' + lid + '">Listeyi sil</button></div>'
    };
  }
  function gunOzetHtml(l, y, t) {
    const u = uyumsuzluk(l);
    return 'Yazılan: ' + fmt(t.kcal, 0) + ' kcal' + (l.hedef && l.hedef.kcal ? ' · plan ' + fmt(l.hedef.kcal, 0) + ' kcal' : '') +
      ' · KH ' + fmt(t.c, 0) + ' g · P ' + fmt(t.p, 0) + ' g · Y ' + fmt(t.f, 0) + ' g' +
      (u.length ? '<div class="uyari-metin mt-s">Plana göre: ' + esc(u.join(' · ')) + '</div>' : '');
  }
  function ogunKarti(l, o) {
    const lid = esc(l.id), satirlar = l.ogun[o[0]] || [];
    return '<div class="card" data-ogun="' + o[0] + '"><h2>' + esc(o[1]) + '</h2>' + durumCipleri(l, o[0]) +
      (satirlar.length ? '<div class="list mt-s">' + satirlar.map((x, i) =>
        '<button class="li" data-act="listeSatir" data-l="' + lid + '" data-o="' + o[0] + '" data-i="' + i + '">' +
        '<span class="grow"><div class="t">' + esc(carp(x.t, x.n)) + '</div><div class="s">' + esc(karsilik(satirDegisim(x))) + '</div></span></button>').join('') + '</div>'
        : '<p class="muted small">Henüz satır yok.</p>') +
      '<button class="btn sec sm block mt-s" data-act="listeEkle" data-l="' + lid + '" data-o="' + o[0] + '">' + icon('plus') + ' Satır ekle</button></div>';
  }

  /* ---- satır ekleme sayfası ---- */
  let araQ = '';
  DA.actions.listeEkle = (el) => {
    const l = bul(el.dataset.l); if (!l) return;
    araQ = '';
    DA.sheet(ogunAdi(el.dataset.o) + ' — satır ekle', '<div id="listeSec">' + secimHtml(l, el.dataset.o) + '</div>');
  };
  function secimHtml(l, k) {
    const lid = esc(l.id), d = durum(l, k);
    const eksik = {};
    d.forEach((x) => { if (x.h - x.y > 0.01) eksik[x.k] = x.h - x.y; });
    const q = DA.trLower(araQ).trim();
    const uygun = secenekler().filter((e) => !q || DA.trLower(e.t).indexOf(q) >= 0);
    /* Bu öğünde eksik kalan grupların seçenekleri başta */
    const anaGrup = (e) => { const k2 = Object.keys(e.d).filter((g) => e.d[g] > 0); return k2.length ? k2[0] : ''; };
    const sira = (e) => (Object.keys(e.d).some((g) => eksik[g]) ? 0 : 1);
    const gk = gruplar().map((g) => g.k);
    uygun.sort((a, b) => sira(a) - sira(b) || gk.indexOf(anaGrup(a)) - gk.indexOf(anaGrup(b)));
    const ozet = Object.keys(eksik).length
      ? 'Kalan: ' + esc(gruplar().filter((g) => eksik[g.k]).map((g) => miktar(eksik[g.k]) + ' ' + DA.trLower(kisa(g.k))).join(' · '))
      : (d.length ? 'Bu öğünün hedefi tamam.' : 'Bu öğün için planda hedef yok.');
    return '<p class="small" id="listeKalan" aria-live="polite">' + ozet + '</p>' +
      '<input type="search" placeholder="Seçenek ara…" value="' + esc(araQ) + '" data-live="listeAra" data-l="' + lid + '" data-o="' + k + '" aria-label="Seçenek ara">' +
      '<div class="list mt-s" id="listeSecenek">' + (uygun.length ? uygun.map((e) =>
        '<button class="li" data-act="listeSec" data-l="' + lid + '" data-o="' + k + '" data-e="' + esc(e.id) + '">' +
        '<span class="grow"><div class="t">' + esc(e.t) + '</div><div class="s">' + esc(karsilik(e.d)) +
        (e.not ? ' · ' + esc(e.not) : '') + (e.kendi ? ' · seçeneğim' : '') + '</div></span>' +
        (sira(e) === 0 ? '<span class="end"><span class="badge warn">eksik</span></span>' : '') + '</button>').join('')
        : '<div class="empty">Bulunamadı</div>') + '</div>' +
      '<button class="btn ghost block mt" data-act="listeKendi" data-l="' + lid + '" data-o="' + k + '">Kendi satırını yaz</button>';
  }
  /* Arama sırasında yalnız liste yenilenir; arama kutusu odağını kaybetmesin. */
  DA.live.listeAra = (el) => {
    araQ = el.value;
    const l = bul(el.dataset.l); if (!l) return;
    const yeni = document.createElement('div'); yeni.innerHTML = secimHtml(l, el.dataset.o);
    const hedef = DA.$('#listeSecenek'), kaynak = yeni.querySelector('#listeSecenek');
    if (hedef && kaynak) hedef.innerHTML = kaynak.innerHTML;
  };
  function satirEkle(l, k, x) {
    l.ogun[k] = l.ogun[k] || [];
    yerlestir(l.ogun[k], x);
    DA.save();
  }
  /* Seçince sayfa açık kalır: bir öğüne art arda birkaç satır yazılır. */
  DA.actions.listeSec = (el) => {
    const l = bul(el.dataset.l), e = secenek(el.dataset.e);
    if (!l || !e) return;
    satirEkle(l, el.dataset.o, { id: DA.uid(), t: e.t, n: 1, d: Object.assign({}, e.d) });
    DA.render(true);
    const b = DA.$('#listeSec'); if (b) b.innerHTML = secimHtml(l, el.dataset.o);
    DA.toast('Eklendi: ' + e.t);
  };

  /* Kendi satırı: metin ve gruplara düşülecek değişim sayısı */
  DA.actions.listeKendi = (el) => {
    const l = bul(el.dataset.l); if (!l) return;
    DA.sheet(ogunAdi(el.dataset.o) + ' — kendi satırın',
      '<form data-form="listeKendi" data-l="' + esc(l.id) + '" data-o="' + esc(el.dataset.o) + '">' +
      '<label class="fld"><span>Listede yazacak metin (1 birim için)</span><input type="text" name="t" placeholder="ör. 2 adet galeta" required></label>' +
      '<div class="small muted mb">Hangi gruptan kaç değişim düşülsün?</div>' +
      '<div class="grid3">' + gruplar().map((g) => '<label class="fld"><span>' + esc(kisa(g.k)) + '</span>' +
        '<input type="text" inputmode="decimal" name="g_' + g.k + '" placeholder="0"></label>').join('') + '</div>' +
      '<label class="row gap small mb"><input type="checkbox" name="kaydet"> Seçeneklerime kaydet</label>' +
      '<button class="btn block" type="submit">Ekle</button></form>');
  };
  DA.forms.listeKendi = (f) => {
    const l = bul(f.dataset.l); if (!l) return;
    const v = DA.formData(f), t = String(v.t || '').trim(), d = {};
    gruplar().forEach((g) => { const n = num(v['g_' + g.k]); if (isFinite(n) && n > 0) d[g.k] = Math.round(n * 2) / 2; });
    if (!t) return DA.toast('Metni yaz');
    if (!Object.keys(d).length) return DA.toast('En az bir gruba değişim gir');
    satirEkle(l, f.dataset.o, { id: DA.uid(), t, n: 1, d });
    if (f.kaydet && f.kaydet.checked) esdegerler().push({ id: 'k-' + DA.uid(), t, d: Object.assign({}, d) });
    DA.save(); DA.closeSheet(); DA.render(true);
    DA.toast('Eklendi: ' + t);
  };

  /* ---- satır düzenleme ---- */
  const satirBul = (d) => {
    const l = bul(d.l), dizi = l && l.ogun[d.o], i = parseInt(d.i, 10);
    return dizi && dizi[i] ? { l, dizi, i, x: dizi[i] } : null;
  };
  DA.actions.listeSatir = (el) => {
    const s = satirBul(el.dataset); if (!s) return;
    const veri = 'data-l="' + esc(s.l.id) + '" data-o="' + esc(el.dataset.o) + '" data-i="' + s.i + '"';
    DA.sheet(ogunAdi(el.dataset.o) + ' — satır',
      '<form data-form="listeSatir" ' + veri + '>' +
      '<label class="fld"><span>Metin (1 birim için)</span><input type="text" name="t" value="' + esc(s.x.t) + '" data-live="listeOn" required></label>' +
      '<label class="fld"><span>Kaç birim (yarım için 0,5)</span><input type="text" inputmode="decimal" name="n" value="' + esc(fmt(s.x.n, 2)) + '" data-live="listeOn"></label>' +
      '<p class="small" id="listeOn" aria-live="polite">' + onizleme(s.x.t, s.x.n, s.x.d) + '</p>' +
      '<button class="btn block" type="submit">Kaydet</button>' +
      '<div class="grid2 mt-s"><button class="btn ghost block" type="button" data-act="listeTasi" data-yon="-1" ' + veri + (s.i === 0 ? ' disabled' : '') + '>Yukarı taşı</button>' +
      '<button class="btn ghost block" type="button" data-act="listeTasi" data-yon="1" ' + veri + (s.i === s.dizi.length - 1 ? ' disabled' : '') + '>Aşağı taşı</button></div>' +
      '<button class="btn danger block mt-s" type="button" data-act="listeSatirSil" ' + veri + '>Satırı sil</button></form>');
  };
  const onizleme = (t, n, d) => 'Listede: <b>' + esc(carp(t, n)) + '</b><br><span class="muted">' + esc(karsilik(satirDegisim({ d, n }))) + '</span>';
  DA.live.listeOn = (el) => {
    const f = el.form, s = f && satirBul(f.dataset); if (!s) return;
    const n = num(f.n.value);
    DA.$('#listeOn').innerHTML = onizleme(f.t.value, isFinite(n) && n > 0 ? n : 1, s.x.d);
  };
  DA.forms.listeSatir = (f) => {
    const s = satirBul(f.dataset); if (!s) return;
    const t = String(f.t.value || '').trim(), n = num(f.n.value);
    if (!t) return DA.toast('Metni yaz');
    if (!(isFinite(n) && n > 0)) return DA.toast('Birim sayısı 0’dan büyük olmalı');
    s.x.t = t; s.x.n = Math.round(n * 4) / 4;
    DA.save(); DA.closeSheet(); DA.render(true);
  };
  DA.actions.listeTasi = (el) => {
    const s = satirBul(el.dataset); if (!s) return;
    const j = s.i + parseInt(el.dataset.yon, 10);
    if (j < 0 || j >= s.dizi.length) return;
    const t = s.dizi[j]; s.dizi[j] = s.dizi[s.i]; s.dizi[s.i] = t;
    DA.save(); DA.closeSheet(); DA.render(true);
  };
  DA.actions.listeSatirSil = (el) => {
    const s = satirBul(el.dataset); if (!s) return;
    const silinen = s.dizi.splice(s.i, 1)[0];
    DA.save(); DA.closeSheet(); DA.render(true);
    DA.silGeriAl('Satır silindi', () => { s.dizi.splice(s.i, 0, silinen); });
  };

  /* ---- liste eylemleri ---- */
  DA.live.listeMeta = (el) => {
    const l = bul(el.dataset.l); if (!l) return;
    l[el.dataset.f] = el.value; DA.save();
    if (el.dataset.f === 'ad') DA.$('#title').textContent = el.value || 'Diyet listesi';
  };
  DA.actions.listeAyar = (el) => {
    const l = bul(el.dataset.l); if (!l) return;
    l.ayar[el.dataset.k] = !l.ayar[el.dataset.k]; DA.save(); DA.render(true);
  };
  DA.actions.listeDiz = (el) => {
    const l = bul(el.dataset.l); if (!l) return;
    const eski = JSON.parse(JSON.stringify(l.ogun));
    let degisti = false;
    Object.keys(l.ogun).forEach((k) => {
      const d = l.ogun[k];
      const s = d.map((x, i) => ({ x, i, r: DA.menuKural.sira(satirTur(x)) })).sort((a, b) => a.r - b.r || a.i - b.i);
      if (s.some((y, i) => y.i !== i)) { degisti = true; l.ogun[k] = s.map((y) => y.x); }
    });
    if (!degisti) return DA.toast('Liste zaten yazım sırasında');
    DA.save(); DA.render(true);
    DA.silGeriAl('Liste yazım sırasına dizildi', () => { l.ogun = eski; });
  };
  DA.actions.listeKopya = (el) => {
    const l = bul(el.dataset.l); if (!l) return;
    const c = JSON.parse(JSON.stringify(l));
    c.id = DA.uid(); c.ad = (l.ad || 'Beslenme listesi') + ' (kopya)'; c.d = DA.today();
    listeler().unshift(c); DA.save(); DA.go('liste/' + c.id);
    DA.toast('Liste kopyalandı');
  };
  DA.actions.listeSil = (el) => {
    const L = listeler(), i = L.findIndex((x) => x.id === el.dataset.l);
    if (i < 0) return;
    const silinen = L.splice(i, 1)[0], c = danisan(silinen.c);
    DA.save(); DA.go(c ? 'danisan/' + c.id : 'liste');
    DA.silGeriAl((silinen.ad || 'Liste') + ' silindi', () => { listeler().splice(i, 0, silinen); });
  };

  /* ---- paylaşım ve çıktı ---- */
  function metin(l) {
    const c = danisan(l.c);
    let s = (l.ad || 'Beslenme listesi') + '\n' + DA.fdate(l.d) + (c ? ' — ' + c.name : '') + '\n' + DA.dyt() + '\n';
    ogunler().forEach((o) => {
      const d = l.ogun[o[0]] || []; if (!d.length) return;
      s += '\n' + o[1].toLocaleUpperCase('tr-TR') + '\n' + d.map((x) => '• ' + carp(x.t, x.n)).join('\n') + '\n';
    });
    if (l.not) s += '\nÖneriler\n' + l.not + '\n';
    return s;
  }
  DA.actions.listeShare = (el) => { const l = bul(el.dataset.l); if (l) DA.shareText(l.ad || 'Beslenme listesi', metin(l)); };

  DA.views._printListe = (parts) => {
    const l = bul(parts[0]);
    if (!l) return { title: 'Yazdır', back: 'liste', html: '<div class="card">Liste bulunamadı.</div>' };
    const c = danisan(l.c), y = gununToplami(l), t = DA.exchange.totals(y);
    const u = uyumsuzluk(l), kn = DA.menuKural ? kuralSonucu(l).length : 0;
    const uyari = (u.length ? '<div class="note warn noprint"><b>Liste plana uymuyor.</b> ' + esc(u.join(' · ')) + '</div>' : '') +
      (kn ? '<div class="note warn noprint">Bu listede ' + kn + ' yazım kuralı notu var. <a href="#/liste/' + esc(l.id) + '">Listeye dön</a>.</div>' : '');
    const ogun = ogunler().map((o) => {
      const d = l.ogun[o[0]] || []; if (!d.length) return '';
      return '<div class="blok ogun"><h3>' + esc(o[1]) + '</h3><ul>' + d.map((x) => '<li>' + esc(carp(x.t, x.n)) + '</li>').join('') + '</ul></div>';
    }).join('');
    /* İki sütunlu sıkı tablo: tek sütunda sekiz grup satırı listeyi A4'ün
       ikinci sayfasına taşıyordu. */
    const dolu = gruplar().filter((g) => y[g.k] > 0), yarim = Math.ceil(dolu.length / 2);
    const hucre = (g) => (g ? '<td>' + esc(g.l) + '</td><td class="n">' + esc(miktar(y[g.k])) + '</td>' : '<td></td><td></td>');
    const tablo = l.ayar.degisim && dolu.length ? '<div class="blok"><h3>Günlük değişim sayıları</h3><table class="degisim-cift"><tbody>' +
      dolu.slice(0, yarim).map((g, i) => '<tr>' + hucre(g) + hucre(dolu[yarim + i]) + '</tr>').join('') +
      '</tbody></table></div>' : '';
    return {
      title: 'Liste çıktısı', tab: 'besin', back: 'liste/' + l.id, noRecent: true,
      html: uyari + '<div class="noprint grid2 mb"><button class="btn block" data-act="doPrint">PDF olarak kaydet / yazdır</button>' +
        '<button class="btn ghost block" data-act="listeShare" data-l="' + esc(l.id) + '">Metin olarak paylaş</button></div>' +
        '<div class="printdoc">' + DA.antet() + '<h2>' + esc(l.ad || 'Beslenme listesi') + '</h2>' +
        '<div class="alt">' + (c ? esc(c.name) + ' · ' : '') + esc(DA.fdate(l.d)) + '</div>' +
        (ogun || '<p>Listede satır yok.</p>') +
        (l.not ? '<div class="blok"><h3>Öneriler</h3>' + esc(l.not).replace(/\n/g, '<br>') + '</div>' : '') +
        (l.ayar.enerji ? '<div class="sat liste-enerji"><b>Günlük:</b> yaklaşık ' + fmt(t.kcal, 0) + ' kcal · karbonhidrat ' + fmt(t.c, 0) +
          ' g · protein ' + fmt(t.p, 0) + ' g · yağ ' + fmt(t.f, 0) + ' g</div>' : '') +
        tablo +
        DA.dipnot('bu liste bireysel tıbbi tavsiye yerine geçmez.') + '</div>'
    };
  };

  /* Danışan dosyası için: bu danışanın listeleri */
  function danisanKarti(c) {
    const L = listeler().filter((l) => l.c === c.id);
    return '<div class="card"><h2>Diyet listeleri</h2>' +
      (L.length ? '<div class="list">' + L.map((l) => '<a class="li chev" href="#/liste/' + esc(l.id) + '"><span class="grow"><div class="t">' +
        esc(l.ad || 'Beslenme listesi') + '</div><div class="s">' + esc(DA.fdate(l.d)) + '</div></span></a>').join('') + '</div>'
        : '<p class="muted small">Henüz liste yok. Değişim planından liste yazılır.</p>') +
      '<a class="btn sec sm block mt-s" href="#/hesapla/degisim?c=' + esc(c.id) + '">' + icon('note') + ' Değişim planından liste yaz</a></div>';
  }

  DA.liste = { olustur, carp, topla, karsilik, danisanKarti, metin, satirTur, hazir: HAZIR };
})();
