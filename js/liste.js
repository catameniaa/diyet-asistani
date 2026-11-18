/* Diyet listesi yazıcı — değişim planından danışana verilecek liste.

   Neden: değişim listesi grup SAYISIYLA, menü planlayıcı GRAMLA çalışıyordu
   ve ikisi bağlı değildi. Danışana giden asıl belge — öğün öğün, ev ölçüsüyle
   yazılmış liste — elle Word'de hazırlanıyordu. Burada plan öğün hedeflerine
   bölünmüş olarak gelir, her satır "1 su bardağı yarım yağlı süt" gibi
   yazılır, öğünde kaç değişim kaldığı canlı görünür ve yazım kuralları
   (js/menukural.js) aynı anda denetlenir.

   Liste planın o anki KOPYASINI tutar (ex, meal): plan sonradan değişirse
   yazılmış liste kendiliğinden bozulmaz; danışana verilmiş belge budur.

   Seçeneklerin kaynağı:
     · Besin değişim listesi (js/data-degisim.js, ~240 satır; kullanıcının
       izinli sağladığı listeler ve onun kararları). Liste ekranı açılınca
       tembel yüklenir.
     · HAZIR: Dyt. Can Bayramoğlu'nun belirttiği karşılıklar (çorba 1 ekmek
       + 1 yağ, zeytinyağlı sebze yemeği ve salata 1 sebze + 1 yağ, yağsız
       salata 1 sebze, pilav yalnız ekmek, hastane roll ekmek 2 ekmek) ve
       sık kullanılan satırlar. Veri yüklenemezse de seçici boş kalmasın
       diye burada. Ölçüleri değişim listesiyle aynı (Kasım 2026'da
       güncellendi: nohut 3 yk, mercimek 2 yk, pirinç pilavı 2 yk, yoğurt
       150 g, ayran 1,5 su bardağı, et 20 g pişmiş, zeytin 10, badem 10,
       elma orta boy, üzüm 25 adet).
   Diyetisyen ayrıca kendi satırını yazar ve isterse "seçeneklerim"e
   kaydeder (S.esdegerler). */
(function () {
  'use strict';
  const { esc, fmt, num, icon } = DA;

  /* id, satır (1 birim için), değişim karşılığı, seçicide görünen not */
  const HAZIR = [
    ['sut', '1 su bardağı süt', { sut: 1 }, '200 ml'],
    ['yogurt', '3/4 su bardağı (4 tepeleme yemek kaşığı) yoğurt (150 g)', { sut: 1 }],
    ['ev-yogurdu', '1 su bardağı ev yoğurdu (200 g)', { sut: 1 }],
    ['ayran', '1,5 su bardağı (1 büyük su bardağı) ayran', { sut: 1 }, '300 g'],
    ['kefir', '1 su bardağı kefir', { sut: 1 }, '200 g'],
    ['sut-yy', '1 su bardağı yarım yağlı süt', { sutyy: 1 }, '200 ml'],
    ['yogurt-yy', '3/4 su bardağı (4 tepeleme yemek kaşığı) yarım yağlı yoğurt (150 g)', { sutyy: 1 }],
    ['et-kirmizi', '3 orta boy kuşbaşı et', { et: 1 }, '30 g çiğ / 20 g pişmiş'],
    ['kofte', '1 küçük yumurta boyutunda köfte', { et: 1 }, '40 g çiğ / 30 g pişmiş'],
    ['et-tavuk', '1/4 küçük boy tavuk göğsü', { et: 1 }, '30 g çiğ / 20 g pişmiş'],
    ['peynir', '2 parmak boyutunda beyaz peynir', { et: 1 }, '40 g'],
    ['yumurta', '1 küçük boy yumurta', { et: 1 }],
    ['nohut', '3 yemek kaşığı nohut', { baklagil: 1 }, 'pişmiş, tepeleme'],
    ['kurufasulye', '3 yemek kaşığı kuru fasulye', { baklagil: 1 }, 'pişmiş, tepeleme'],
    ['mercimek', '2 yemek kaşığı mercimek', { baklagil: 1 }, 'pişmiş, tepeleme'],
    ['corba', '1 kase çorba', { eyg: 1, yag: 1 }],
    ['ekmek', '1 ince dilim ekmek', { eyg: 1 }, '25 g'],
    ['roll', '1 adet tam buğday roll ekmek', { eyg: 2 }, 'hastane'],
    ['roll-cavdar', '1 adet çavdar roll ekmek', { eyg: 2 }, 'hastane'],
    ['pilav', '2 yemek kaşığı pirinç pilavı', { eyg: 1 }, 'tepeleme; yağ ayrıca sayılmaz'],
    ['bulgur', '3 yemek kaşığı bulgur pilavı', { eyg: 1 }, 'tepeleme; yağ ayrıca sayılmaz'],
    ['makarna', '3 yemek kaşığı makarna', { eyg: 1 }, 'tepeleme'],
    ['patates', '1 küçük boy haşlanmış patates', { eyg: 1 }],
    ['salata', '1 kase yağsız salata', { sebze: 1 }],
    ['salata-zy', '1 kase zeytinyağlı salata', { sebze: 1, yag: 1 }],
    ['sebze-zy', '1 kase zeytinyağlı sebze yemeği', { sebze: 1, yag: 1 }, '5–6 yemek kaşığı'],
    ['elma', '1 orta boy elma', { meyve: 1 }],
    ['muz', '1 küçük boy muz', { meyve: 1 }],
    ['portakal', '1 orta boy portakal', { meyve: 1 }],
    ['uzum', '25 adet üzüm', { meyve: 1 }],
    ['zeytinyagi', '1 tatlı kaşığı zeytinyağı', { yag: 1 }],
    ['zeytin', '10 orta boy zeytin', { yag: 1 }],
    ['ceviz', '2 bütün ceviz', { tohum: 1 }],
    ['badem', '10 orta boy badem', { tohum: 1 }]
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
  /* ---- haftalık liste ----
     Her gün ayrı bir listedir (taslak, kural denetimi, günlük çıktı aynen
     çalışsın); günler ortak "hafta" kimliği ve 0–6 "gun" sırasıyla bağlı.
     Başlık, öneriler ve çıktı seçimi haftanın ortak bilgisidir: birinde
     değişince hepsine yazılır. */
  const GUN_ADI = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const GUN_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const tarihNesne = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  function gunSonra(iso, n) {
    const d = tarihNesne(iso) || new Date(); d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  const haftaGunleri = (hid) => (hid ? listeler().filter((x) => x.hafta === hid).sort((a, b) => a.gun - b.gun) : []);
  const haftaninBiri = (l) => (l.hafta ? haftaGunleri(l.hafta) : [l]);
  /* İndekste hafta tek satır: ilk günü temsil eder */
  const gorunurListeler = (L) => L.filter((l) => !l.hafta || haftaGunleri(l.hafta)[0] === l);
  function gunEtiketi(l, uzun) {
    const d = tarihNesne(l.d), g = d ? d.getDay() : null;
    return (l.gun + 1) + '. gün' + (g == null ? '' : ' · ' + (uzun ? GUN_ADI[g] + ', ' + DA.fdate(l.d) : GUN_KISA[g]));
  }
  const listeler = () => (S().listeler = S().listeler || []);
  const esdegerler = () => (S().esdegerler = S().esdegerler || []);
  const bul = (id) => listeler().find((l) => l.id === id) || null;
  const danisan = (id) => (id ? (S().clients || []).find((c) => c.id === id) : null) || null;
  /* HAZIR önce: kullanıcının kuralları ve sık satırlar başta dursun. Aynı
     metinli satır bir kez görünür (ör. "1 ince dilim ekmek" iki kaynakta). */
  const secenekler = () => {
    const D = DA.data.degisim, gor = {};
    return HAZIR.concat(D ? D.secenekler : [], esdegerler().map((e) => Object.assign({ kendi: true, not: '' }, e)))
      .filter((e) => { const k = DA.trLower(e.t); if (gor[k]) return false; gor[k] = 1; return true; });
  };
  const secenek = (id) => secenekler().find((e) => e.id === id) || null;
  const miktar = (n) => (DA.foods && DA.foods.miktarYazi ? DA.foods.miktarYazi(n) : fmt(n, 2));

  /* Satırın n katı: "1 ince dilim ekmek" ×2 → "2 ince dilim ekmek",
     "12–15 adet üzüm" ×2 → "24–30 adet üzüm", "1 su bardağı süt" ×½ →
     "½ su bardağı süt". Sayı tam çıkmazsa (5 zeytinin yarısı) uydurmamak
     için "½ × 5 adet zeytin" yazılır. */
  /* Kesirli ve ondalıklı ölçü de çarpılır: "1/4 küçük boy tavuk göğsü" ×3 →
     "¾ küçük boy…", "1,5 büyük boy galeta" ×2 → "3 büyük boy galeta". Eskiden
     yalnız tam sayı çarpılıyordu; taslak galetayı, yoğurdu katlarıyla yazınca
     "2 × 1,5 büyük boy galeta" çıkıyordu.
     Parantezdeki ölçü de birlikte çarpılır: "(4 tepeleme yemek kaşığı) yoğurt
     (150 g)" ×2 → "(8 tepeleme yemek kaşığı) … (300 g)". Önceden "1 su
     bardağı ev yoğurdu (200 g)" ×2 "2 su bardağı … (200 g)" oluyordu, gram
     yanlıştı. Parantezde ölçü olmayan sayı ("1/2 ekmek") ya da "çeyrek,
     yarım" varsa ya da sonuç çeyreğe denk gelmiyorsa (1/5 ×2) metne
     dokunulmaz: "2 × 1/5 orta boy bazlama". Yanlış sayı yazmaktansa çarpan
     görünür kalır. */
  const sayiOku = (x) => (x.indexOf('/') > 0 ? +x.split('/')[0] / +x.split('/')[1] : +x.replace(',', '.'));
  const tam = (x) => Math.abs(x - Math.round(x)) < 1e-9;
  const OLCU = /^(g|ml|(tepeleme )?yemek kaşığı|(büyük )?su bardağı)$/;
  function parantezCarp(r, n) {
    let olmaz = false;
    const sonuc = r.replace(/\(([^)]*)\)/g, (tum, ic) => {
      if (/çeyrek|yarım/.test(ic)) { olmaz = true; return tum; }
      if (!/\d/.test(ic)) return tum;
      const m = /^(\d+(?:,\d+)?|\d+\/\d+)\s+(.+)$/.exec(ic);
      const v = m ? sayiOku(m[1]) * n : 0;
      if (!m || !OLCU.test(m[2]) || !tam(v * 4)) { olmaz = true; return tum; }
      return '(' + (tam(v) ? Math.round(v) : miktar(v)) + ' ' + m[2] + ')';
    });
    return olmaz ? null : sonuc;
  }
  function carp(t, n) {
    t = String(t || '');
    if (!(n > 0) || n === 1) return t;
    const geri = miktar(n) + ' × ' + t;
    const m = /^(\d+(?:,\d+)?|\d+\/\d+)(?:–(\d+))?(\s.*)$/.exec(t);
    if (!m) return geri;
    const kalan = parantezCarp(m[3], n);
    if (kalan == null) return geri;
    if (m[1] === '1' && !m[2]) return miktar(n) + kalan;
    const a = sayiOku(m[1]) * n, b = m[2] ? +m[2] * n : null;
    if (tam(a) && (b == null || tam(b))) return Math.round(a) + (b != null ? '–' + Math.round(b) : '') + kalan;
    if (/[,/]/.test(m[1]) && b == null && tam(a * 4)) return miktar(a) + kalan;
    return geri;
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
    /* Taslak düğmesi galeta, kefir gibi seçenekleri değişim listesinden alır;
       veri yüklenmeden kuru çalıştırma onları bulamaz ve düğme gizli
       kalabilirdi. Arka planda yüklenir, gelince ekran yenilenir. */
    if (DA.hazir && !DA.hazir(['degisim'])) {
      DA.need(['degisim']).then(() => { if (location.hash === '#/liste/' + id) DA.render(true); }, () => {});
    }
    return listeEkrani(l);
  };

  function listeIndeks() {
    const L = listeler();
    return {
      title: 'Diyet listeleri', tab: 'besin', back: 'besin',
      html: L.length ? '<div class="list">' + gorunurListeler(L).map((l) => {
        const c = danisan(l.c);
        return '<a class="li chev" href="#/liste/' + esc(l.id) + '"><span class="ic">' + icon('note') + '</span>' +
          '<span class="grow"><div class="t">' + esc(l.ad || 'Beslenme listesi') + '</div><div class="s">' + esc(DA.fdate(l.d)) +
          (l.hafta ? ' · ' + haftaGunleri(l.hafta).length + ' günlük' : '') + (c ? ' · ' + esc(c.name) : '') + '</div></span></a>';
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
    const ayar = (k, etiket) => ayarChip(l, k, etiket);
    const kural = DA.menuKural ? DA.menuKural.kartHtmlSonuc(kuralSonucu(l),
      '<button class="btn sec sm block" data-act="listeDiz" data-l="' + lid + '">Yazım sırasına diz</button>') : '';
    const bos = !gorunen.some((o) => (l.ogun[o[0]] || []).length);
    const gunler = l.hafta ? haftaGunleri(l.hafta) : [];
    const sekmeler = gunler.length ? '<div class="card gun-sekme"><div class="small muted mb">' + gunler.length + ' günlük liste · ' +
      esc(gunEtiketi(l, true)) + '</div><div class="chips" role="list">' +
      gunler.map((g) => '<a role="listitem" class="chip' + (g === l ? ' on" aria-current="page' : '') + '" href="#/liste/' + esc(g.id) + '">' +
        esc(gunEtiketi(g)) + '</a>').join('') + '</div></div>' : '';
    return {
      title: (l.ad || 'Diyet listesi') + (l.hafta ? ' · ' + (l.gun + 1) + '. gün' : ''), tab: 'besin', back: c ? 'danisan/' + c.id : 'liste',
      html: sekmeler +
        '<div class="card"><label class="fld"><span>Liste başlığı</span><input type="text" value="' + esc(l.ad) + '" data-live="listeMeta" data-f="ad" data-l="' + lid + '"></label>' +
        '<div class="grid2"><label class="fld"><span>Tarih</span><input type="date" value="' + esc(l.d) + '" data-live="listeMeta" data-f="d" data-l="' + lid + '"></label>' +
        '<div class="fld"><span>Danışan</span><div class="small" style="padding-top:12px">' +
          (c ? '<a href="#/danisan/' + esc(c.id) + '">' + esc(c.name) + '</a>' : '<span class="muted">genel</span>') + '</div></div></div>' +
        '<div class="halka-satir mt-s">' + DA.halka(l.hedef && l.hedef.kcal > 0 ? t.kcal / l.hedef.kcal : 0,
          '<b>' + fmt(t.kcal, 0) + '</b><small>kcal yazıldı</small>',
          { boyut: 96, etiket: 'Yazılan ' + fmt(t.kcal, 0) + ' kcal' + (l.hedef && l.hedef.kcal ? ', plan ' + fmt(l.hedef.kcal, 0) + ' kcal' : '') }) +
        '<div class="grow small muted" id="listeGun">' + gunOzetHtml(l, y, t) + '</div></div>' +
        (taslakYapar(l)
          ? '<button class="btn sec block mt" data-act="listeTaslak" data-l="' + lid + '">' + icon('plus') + ' Eksikleri taslakla doldur</button>' : '') + '</div>' +
        (bos ? '' : kural) +
        gorunen.map((o) => ogunKarti(l, o)).join('') +
        (kalan.length ? '<div class="card"><div class="small muted mb">Başka öğüne satır ekle</div><div class="chips">' +
          kalan.map((o) => '<button class="chip" data-act="listeEkle" data-l="' + lid + '" data-o="' + o[0] + '">' + icon('plus') + ' ' + esc(o[1]) + '</button>').join('') +
          '</div></div>' : '') +
        '<div class="card"><label class="fld"><span>Öneriler (listenin altına basılır)</span><textarea data-live="listeMeta" data-f="not" data-l="' + lid + '" placeholder="Su tüketimi, pişirme yöntemi, öğün saatleri…">' + esc(l.not) + '</textarea></label>' +
        '<div class="small muted mb">Çıktıda göster</div><div class="chips">' + ayar('enerji', 'Enerji ve makrolar') + ayar('degisim', 'Değişim tablosu') + '</div></div>' +
        (l.hafta
          ? '<div class="grid2"><a class="btn block" href="#/yazdir/hafta/' + esc(l.hafta) + '">' + icon('share') + ' Haftalık PDF</a>' +
            '<a class="btn ghost block" href="#/yazdir/liste/' + lid + '">Yalnız bu gün</a></div>' +
            '<button class="btn ghost block mt-s" data-act="listeHaftaShare" data-l="' + lid + '">Haftayı metin olarak paylaş</button>'
          : '<div class="grid2"><a class="btn block" href="#/yazdir/liste/' + lid + '">' + icon('share') + ' PDF / Yazdır</a>' +
            '<button class="btn ghost block" data-act="listeShare" data-l="' + lid + '">Metin olarak paylaş</button></div>' +
            (planVar(l) ? '<button class="btn sec block mt-s" data-act="listeHafta" data-l="' + lid + '">' + icon('plus') + ' 7 günlük liste yap</button>' : '')) +
        '<div class="grid2 mt-s"><button class="btn ghost block" data-act="listeKopya" data-l="' + lid + '">' + (l.hafta ? 'Bu günü kopyala' : 'Kopyala') + '</button>' +
        '<button class="btn danger block" data-act="listeSil" data-l="' + lid + '">' + (l.hafta ? 'Haftayı sil' : 'Listeyi sil') + '</button></div>'
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
    return '<div class="card" data-ogun="' + o[0] + '"><h2 class="ogun-bas">' + DA.ogunIkon(o[0]) + esc(o[1]) + '</h2>' + durumCipleri(l, o[0]) +
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
    /* Değişim listesi henüz gelmediyse gelince seçici yenilenir */
    if (!DA.hazir(['degisim'])) DA.need(['degisim']).then(() => { const b = DA.$('#listeSec'); if (b) b.innerHTML = secimHtml(l, el.dataset.o); }).catch(() => {});
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
    const f = el.dataset.f;
    /* Tarih güne özel; başlık ve öneriler haftanın ortak bilgisi */
    (f === 'd' ? [l] : haftaninBiri(l)).forEach((x) => { x[f] = el.value; });
    DA.save();
    if (f === 'ad') DA.$('#title').textContent = (el.value || 'Diyet listesi') + (l.hafta ? ' · ' + (l.gun + 1) + '. gün' : '');
  };
  DA.actions.listeAyar = (el) => {
    const l = bul(el.dataset.l); if (!l) return;
    const v = !l.ayar[el.dataset.k];
    haftaninBiri(l).forEach((x) => { x.ayar[el.dataset.k] = v; });
    DA.save(); DA.render(true);
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
  /* ---- Otomatik taslak ----
     Neden: değişim planı hazır olunca listeyi satır satır seçmek her
     danışanda aynı işti. Taslak yalnız EKSİK değişimleri doldurur (yazılmış
     satır silinmez, değiştirilmez; aynı satır varsa çarpanı artar), geri
     alınabilir ve Dyt. Can Bayramoğlu'nun yazım kurallarına uyar:
       · ara öğünde ekmek yerine galeta
       · gecede süt, kefir ya da yoğurt; peynir (et) gece yazılmaz, eksik kalır
       · ana öğünde çorba başta (1 ekmek + 1 yağ); karbonhidrat tek kaynaktan:
         bulgur ya da pilav varsa yanına ekmek yazılmaz
       · sebze: önce zeytinyağlı sebze yemeği, sonra tek kase salata ("2 kase
         salata" yazılmaz); artan sebze yemeğe eklenir
       · kahvaltıda peynir bir kez, kalan et yumurtayla
     Seçimler gün ve öğüne göre döner (tohum: s); haftalık listede her gün
     başka yemek gelir. Seçenekler HAZIR ve değişim listesinden; olmayan
     seçenek atlanır, eksik kalan değişim kartta "eksik" görünür. */
  const TASLAK_ANA = ['ogle', 'aksam'], TASLAK_ARA = ['ara1', 'ara2'];
  function taslakSecenek(x) {
    if (!x) return null;
    if (x.charAt(0) === '=') {
      const D = DA.data.degisim, r = D && D.satirlar.find((y) => y.ad === x.slice(1));
      return r ? { t: r.t, d: r.d } : null;
    }
    const e = secenek(x);
    return e ? { t: e.t, d: e.d } : null;
  }
  /* Dönen listeden sıradaki bulunabilen seçenek; haric'tekiler atlanır */
  function dondur(liste, s, haric) {
    for (let i = 0; i < liste.length; i++) {
      const x = liste[(s + i) % liste.length];
      if (haric && haric.indexOf(x) >= 0) continue;
      const e = taslakSecenek(x); if (e) return e;
    }
    return null;
  }
  /* Dönüş: { yeni, artan } — eklenen satır ve çarpanı artan satır sayısı */
  function taslakDoldur(l, ogun, s) {
    const say = { yeni: 0, artan: 0 };
    ogunler().forEach((o, oi) => {
      const k = o[0], h = (l.meal || {})[k] || {}, y = topla(ogun[k]), kal = {};
      Object.keys(h).forEach((g) => { const v = Math.round(((h[g] || 0) - (y[g] || 0)) * 4) / 4; if (v >= 0.25) kal[g] = v; });
      if (!Object.keys(kal).length) return;
      const tur = TASLAK_ANA.indexOf(k) >= 0 ? 'ana' : TASLAK_ARA.indexOf(k) >= 0 ? 'ara' : k === 'gece' ? 'gece' : 'kahvalti';
      const t = s + oi;
      const ekle = (e, n) => {
        if (!e || !(n >= 0.25)) return;
        ogun[k] = ogun[k] || [];
        /* Aynı satır öğünde zaten varsa çarpanı artar; iki ayrı "bulgur
           pilavı" satırı yazılmaz. */
        const ayni = ogun[k].find((x) => x.t === e.t && JSON.stringify(x.d) === JSON.stringify(e.d));
        if (ayni) { ayni.n = Math.round(((ayni.n || 1) + n) * 4) / 4; say.artan++; }
        else { yerlestir(ogun[k], { id: DA.uid(), t: e.t, n, d: Object.assign({}, e.d) }); say.yeni++; }
        Object.keys(e.d).forEach((g) => { if (kal[g]) kal[g] = Math.round((kal[g] - e.d[g] * n) * 4) / 4; if (kal[g] < 0.25) delete kal[g]; });
        return e;
      };
      const var_ = (g, n) => (kal[g] || 0) >= (n || 1);
      const sutSec = (yer) => {
        ['sut', 'sutyy'].forEach((g) => {
          if (!kal[g]) return;
          const yy = g === 'sutyy';
          const L = {
            kahvalti: yy ? ['h-sut-yy'] : ['h-sut'],
            ara: yy ? ['h-yogurt-yy', '=Ayran (light)', 'h-sut-yy'] : ['=Kefir', 'h-yogurt', 'h-ayran'],
            ana: yy ? ['h-yogurt-yy'] : ['h-yogurt', 'h-ev-yogurdu'],
            gece: yy ? ['h-sut-yy', 'h-yogurt-yy'] : ['h-sut', '=Kefir']
          }[yer];
          ekle(dondur(L, t), kal[g]);
        });
      };
      const meyve = () => ekle(dondur(['h-elma', 'h-portakal', '=Mandalina', 'h-muz', '=Armut', 'h-uzum'], t), kal.meyve);
      const tohum = () => ekle(dondur(['h-ceviz', 'h-badem', '=Fındık'], t), kal.tohum);
      const galeta = () => ekle(dondur(['=Galeta'], 0), kal.eyg);
      if (tur === 'kahvalti') {
        sutSec('kahvalti');
        if (kal.et) { const p = Math.min(1, kal.et); ekle(taslakSecenek('h-peynir'), p); ekle(taslakSecenek('h-yumurta'), kal.et); }
        if (kal.yag) { ekle(taslakSecenek('h-zeytin'), Math.min(1, kal.yag)); ekle(taslakSecenek('h-zeytinyagi'), kal.yag); }
        if (kal.sebze) ekle(dondur(['=Domates', '=Salatalık, acur'], t), Math.min(1, kal.sebze));
        if (kal.sebze) ekle(taslakSecenek('h-salata'), Math.min(1, kal.sebze));
        tohum(); meyve();
        ekle(taslakSecenek('h-nohut'), kal.baklagil);
        ekle(dondur(['h-ekmek', '=Çavdar, yulaf, tam buğday ya da kepekli ekmek'], t), kal.eyg);
      } else if (tur === 'ara') {
        sutSec('ara'); galeta(); meyve(); tohum();
        ekle(taslakSecenek('h-peynir'), kal.et);
        ekle(taslakSecenek('h-nohut'), kal.baklagil);
        ekle(taslakSecenek('h-salata'), Math.min(1, kal.sebze || 0));
      } else if (tur === 'gece') {
        sutSec('gece'); meyve(); galeta(); tohum();
      } else {
        /* Üç çorba: öğle ve akşamın sırası 2 farkla döner, aynı gün aynı
           çorba iki kez gelmez. Veri yüklenmemişse genel "1 kase çorba". */
        const corba = var_('eyg') && var_('yag')
          ? ekle(dondur(['=Şehriye, pirinç, tarhana ya da un çorbası', '=Mercimek çorbası', '=Yayla çorbası'], t) || taslakSecenek('h-corba'), 1) : null;
        /* Mercimek çorbasının yanına mercimek yemeği yazılmaz */
        ekle(dondur(['h-nohut', 'h-mercimek', 'h-kurufasulye'], t, corba && /mercimek/.test(corba.t) ? ['h-mercimek'] : null), kal.baklagil);
        /* Yedi seçenek: haftanın her günü başka; balık haftada iki kez
           (TÜBER'in haftada en az iki kez balık önerisi) ve aynı gün öğle ile
           akşama düşmez. Kesirli ölçüsü çeyreğe denk gelen balık seçildi
           (çipura 1/4); levrek 1/5 ile "2 × 1/5…" yazılırdı. */
        ekle(dondur(['h-kofte', 'h-et-tavuk', 'h-et-kirmizi', '=Çipura', '=Hindi eti (kemiksiz, derisiz)', '=Tavuk baget (kemiksiz)', '=Somon'], t), kal.et);
        /* Sebze: 2 ve üstündeyse biri tek kase salata, gerisi yağ yettiğince
           zeytinyağlı yemek, yağ da bitince pişmiş sebze. 1 ise yağ varsa
           yemek, yoksa yağsız salata. */
        const s0 = kal.sebze || 0;
        if (s0 >= 2) {
          ekle(taslakSecenek('h-sebze-zy'), Math.min(s0 - 1, kal.yag || 0));
          ekle(taslakSecenek(var_('yag') ? 'h-salata-zy' : 'h-salata'), 1);
          ekle(taslakPisSebze(t), kal.sebze);
        } else if (s0 > 0) {
          ekle(taslakSecenek((kal.yag || 0) >= s0 ? 'h-sebze-zy' : 'h-salata'), s0);
        }
        /* Karbonhidrat tek kaynaktan: öğlen ekmek, akşam pilav ağırlıklı, gün
           gün döner. Öğüne elle ekmek ya da bulgur yazılmışsa ona eklenir:
           yoksa taslak bulgurun yanına ekmek koyabilirdi. */
        const yazili = (ogun[k] || []).map(satirTur);
        const khL = yazili.some((x) => x.bulgur) ? ['h-bulgur'] : yazili.some((x) => x.ekmek && !x.galeta) ? ['h-ekmek']
          : k === 'ogle' ? ['h-ekmek', 'h-bulgur', 'h-ekmek', 'h-makarna'] : ['h-bulgur', 'h-ekmek', 'h-pilav', 'h-ekmek'];
        ekle(dondur(khL, s), kal.eyg);
        sutSec('ana'); meyve(); tohum();
        ekle(taslakSecenek('h-zeytinyagi'), kal.yag);
      }
    });
    return say;
  }
  /* Düğme yalnız taslak bir şey yazabilecekse görünür: gecedeki et gibi
     kuralın doldurmadığı eksik için düğme boşa basılmasın. Kuru çalıştırma
     kopyada yapılır. */
  function taslakYapar(l) {
    if (!planVar(l)) return false;
    const r = taslakDoldur(l, JSON.parse(JSON.stringify(l.ogun || {})), 0);
    return r.yeni + r.artan > 0;
  }
  /* Artan sebze: yağ kalmadıysa pişmiş sebze (yağı ayrıca sayılmaz) */
  function taslakPisSebze(s) {
    const D = DA.data.degisim, ad = DA.trLower(['Ispanak', 'Taze fasulye', 'Taze kabak', 'Brokoli'][s % 4]);
    const e = D && D.secenekler.find((x) => x.id.slice(-2) === '-p' && x.t.indexOf(' ' + ad + ' (pişmiş)') >= 0);
    return e ? { t: e.t, d: e.d } : { t: '1 kase yağsız salata', d: { sebze: 1 } };
  }
  DA.actions.listeTaslak = (el) => {
    const l = bul(el.dataset.l); if (!l) return Promise.resolve();
    const calis = () => {
      const eski = JSON.parse(JSON.stringify(l.ogun));
      const r = taslakDoldur(l, l.ogun, 0);
      if (!(r.yeni + r.artan)) { DA.toast('Taslağın dolduracağı eksik yok'); return; }
      DA.save(); DA.render(true);
      /* Kuralın doldurmadığı eksik (ör. gecede et) mesajda söylenir: plan
         ya da satır elle düzeltilir. */
      const kalan = uyumsuzluk(l).filter((x) => / eksik/.test(x));
      DA.silGeriAl('Taslak: ' + r.yeni + ' satır eklendi' + (r.artan ? ', ' + r.artan + ' satır artırıldı' : '') +
        (kalan.length ? '. Elle tamamla: ' + kalan.join(' · ') : ''), () => { l.ogun = eski; }, kalan.length ? 9000 : 0);
    };
    return DA.need(['degisim']).then(calis, calis);
  };

  DA.actions.listeKopya = (el) => {
    const l = bul(el.dataset.l); if (!l) return;
    const c = JSON.parse(JSON.stringify(l));
    c.id = DA.uid(); c.ad = (l.ad || 'Beslenme listesi') + (l.hafta ? ' (' + (l.gun + 1) + '. gün kopyası)' : ' (kopya)'); c.d = DA.today();
    /* Haftanın bir günü kopyalanınca tek günlük bağımsız liste olur */
    delete c.hafta; delete c.gun;
    listeler().unshift(c); DA.save(); DA.go('liste/' + c.id);
    DA.toast('Liste kopyalandı');
  };
  /* Haftalık liste indekste tek satır olduğu için "sil" bütün haftayı siler;
     geri alınca günler eski yerlerine döner. */
  DA.actions.listeSil = (el) => {
    const L = listeler(), l = bul(el.dataset.l);
    if (!l) return;
    const yer = haftaninBiri(l).map((x) => [L.indexOf(x), x]).sort((a, b) => a[0] - b[0]);
    for (let j = yer.length - 1; j >= 0; j--) L.splice(yer[j][0], 1);
    const c = danisan(l.c);
    DA.save(); DA.go(c ? 'danisan/' + c.id : 'liste');
    DA.silGeriAl((l.ad || 'Liste') + (l.hafta ? ' (' + yer.length + ' gün)' : '') + ' silindi',
      () => { yer.forEach((y) => { listeler().splice(y[0], 0, y[1]); }); });
  };

  /* 7 günlük yap: 2–7. günler ya taslakla (her gün farklı seçim, tohum =
     gün sırası) ya da 1. günün kopyası olarak açılır. Geri alınabilir. */
  DA.actions.listeHafta = (el) => {
    const l = bul(el.dataset.l); if (!l) return;
    const lid = esc(l.id);
    DA.sheet('7 günlük liste',
      '<p class="small muted">Bu liste 1. gün olur; ' + esc(DA.fdate(l.d)) + ' tarihinden başlayarak 6 gün daha eklenir. ' +
      'Plan ve öğün hedefleri aynı kalır; başlık, öneriler ve çıktı seçimi haftaya ortaktır.</p>' +
      '<button class="btn block mt" data-act="listeHaftaYap" data-l="' + lid + '" data-y="taslak">Diğer günleri taslakla doldur</button>' +
      '<p class="small muted mt-s">Her gün başka çorba, et, meyve ve tahıl gelir; yazım kurallarına uyar, sonra düzeltirsin.</p>' +
      '<button class="btn ghost block mt" data-act="listeHaftaYap" data-l="' + lid + '" data-y="kopya">1. günü 7 güne kopyala</button>');
  };
  DA.actions.listeHaftaYap = (el) => {
    const l = bul(el.dataset.l); if (!l || l.hafta) return Promise.resolve();
    const calis = () => {
      const L = listeler(), hid = DA.uid(), yeni = [];
      l.hafta = hid; l.gun = 0;
      for (let i = 1; i < 7; i++) {
        const g = JSON.parse(JSON.stringify(l));
        g.id = DA.uid(); g.gun = i; g.d = gunSonra(l.d, i);
        if (el.dataset.y === 'taslak') { g.ogun = {}; taslakDoldur(g, g.ogun, i); }
        else Object.keys(g.ogun).forEach((k) => g.ogun[k].forEach((x) => { x.id = DA.uid(); }));
        yeni.push(g);
      }
      /* Günler sırayla, 1. günün ardına */
      L.splice.apply(L, [L.indexOf(l) + 1, 0].concat(yeni));
      DA.save(); DA.closeSheet(); DA.render(true);
      DA.silGeriAl('7 günlük liste hazır', () => {
        delete l.hafta; delete l.gun;
        DA.state().listeler = listeler().filter((x) => yeni.indexOf(x) < 0);
      });
    };
    return el.dataset.y === 'taslak' ? DA.need(['degisim']).then(calis, calis) : Promise.resolve(calis());
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
  function metinHafta(l) {
    const G = haftaGunleri(l.hafta), c = danisan(l.c);
    let s = (l.ad || 'Beslenme listesi') + ' — ' + G.length + ' günlük\n' + (c ? c.name + '\n' : '') + DA.dyt() + '\n';
    G.forEach((g) => {
      s += '\n=== ' + gunEtiketi(g, true).toLocaleUpperCase('tr-TR') + ' ===\n';
      ogunler().forEach((o) => {
        const d = g.ogun[o[0]] || []; if (!d.length) return;
        s += o[1] + ': ' + d.map((x) => carp(x.t, x.n)).join(', ') + '\n';
      });
    });
    if (l.not) s += '\nÖneriler\n' + l.not + '\n';
    return s;
  }
  DA.actions.listeHaftaShare = (el) => { const l = bul(el.dataset.l); if (l && l.hafta) DA.shareText(l.ad || 'Beslenme listesi', metinHafta(l)); };

  /* Listenin çıktı seçimi listeye özeldir (l.ayar, varsayılan kapalı):
     aynı danışanın listesi bir hafta enerjiyle, bir hafta enerjisiz
     verilebiliyor. Hem liste ekranında hem çıktı ekranında aynı düğmeler. */
  function ayarChip(l, k, etiket) {
    return '<button class="chip' + (l.ayar[k] ? ' on' : '') + '" data-act="listeAyar" data-l="' + esc(l.id) + '" data-k="' + k +
      '" aria-pressed="' + (l.ayar[k] ? 'true' : 'false') + '">' + etiket + '</button>';
  }
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
        DA.cikti.kutu(ayarChip(l, 'enerji', 'Enerji ve makrolar') + ayarChip(l, 'degisim', 'Değişim tablosu')) +
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

  /* Haftalık çıktı: yedi gün tek belgede. Gün içinde öğünler iki sütun:
     tek sütunda bir gün ~35 satır tutuyor, hafta 7 sayfaya yayılıyordu; iki
     sütunla iki gün bir A4'e sığar. Gün bloğu sayfa sonunda bölünmez.
     Değişim tablosu planın günlük toplamıdır (günler aynı plana bağlı);
     enerji seçiliyse her günün yazılan enerjisi kendi başlığında. */
  DA.views._printHafta = (parts) => {
    const G = haftaGunleri(parts[0]);
    if (!G.length) return { title: 'Yazdır', back: 'liste', html: '<div class="card">Haftalık liste bulunamadı.</div>' };
    const l = G[0], c = danisan(l.c);
    const uyumsuz = [], kuralli = [];
    G.forEach((g) => {
      uyumsuzluk(g).forEach((u) => uyumsuz.push((g.gun + 1) + '. gün ' + u));
      if (DA.menuKural && kuralSonucu(g).length) kuralli.push(g);
    });
    const uyari = (uyumsuz.length ? '<div class="note warn noprint"><b>Plana uymayan günler:</b> ' + esc(uyumsuz.join(' · ')) + '</div>' : '') +
      (kuralli.length ? '<div class="note warn noprint">Yazım kuralı notu olan günler: ' + kuralli.map((g) =>
        '<a href="#/liste/' + esc(g.id) + '">' + (g.gun + 1) + '. gün</a>').join(', ') + '.</div>' : '');
    const gunHtml = G.map((g) => {
      const t = DA.exchange.totals(gununToplami(g));
      const og = ogunler().map((o) => {
        const d = g.ogun[o[0]] || []; if (!d.length) return '';
        return '<div class="ogun"><h4>' + esc(o[1]) + '</h4><ul>' + d.map((x) => '<li>' + esc(carp(x.t, x.n)) + '</li>').join('') + '</ul></div>';
      }).join('');
      return '<div class="blok gun-blok"><h3>' + esc(gunEtiketi(g, true)) +
        (l.ayar.enerji ? ' <span class="ince">· yaklaşık ' + fmt(t.kcal, 0) + ' kcal</span>' : '') + '</h3>' +
        (og ? '<div class="ogun-izgara">' + og + '</div>' : '<p>Bu güne satır yazılmadı.</p>') + '</div>';
    }).join('');
    const p = {};
    Object.keys(l.meal || {}).forEach((k) => Object.keys(l.meal[k] || {}).forEach((g) => { p[g] = (p[g] || 0) + (l.meal[k][g] || 0); }));
    const dolu = gruplar().filter((g) => p[g.k] > 0), yarim = Math.ceil(dolu.length / 2);
    const hucre = (g) => (g ? '<td>' + esc(g.l) + '</td><td class="n">' + esc(miktar(p[g.k])) + '</td>' : '<td></td><td></td>');
    const tablo = l.ayar.degisim && dolu.length ? '<div class="blok"><h3>Günlük değişim sayıları (her gün)</h3><table class="degisim-cift"><tbody>' +
      dolu.slice(0, yarim).map((g, i) => '<tr>' + hucre(g) + hucre(dolu[yarim + i]) + '</tr>').join('') + '</tbody></table></div>' : '';
    return {
      title: 'Haftalık liste çıktısı', tab: 'besin', back: 'liste/' + l.id, noRecent: true,
      html: uyari + '<div class="noprint grid2 mb"><button class="btn block" data-act="doPrint">PDF olarak kaydet / yazdır</button>' +
        '<button class="btn ghost block" data-act="listeHaftaShare" data-l="' + esc(l.id) + '">Metin olarak paylaş</button></div>' +
        DA.cikti.kutu(ayarChip(l, 'enerji', 'Enerji') + ayarChip(l, 'degisim', 'Değişim tablosu')) +
        '<div class="printdoc hafta-doc">' + DA.antet() + '<h2>' + esc(l.ad || 'Beslenme listesi') + '</h2>' +
        '<div class="alt">' + (c ? esc(c.name) + ' · ' : '') + G.length + ' günlük · ' + esc(DA.fdate(G[0].d)) +
        (G.length > 1 ? ' – ' + esc(DA.fdate(G[G.length - 1].d)) : '') + '</div>' +
        gunHtml +
        (l.not ? '<div class="blok"><h3>Öneriler</h3>' + esc(l.not).replace(/\n/g, '<br>') + '</div>' : '') +
        tablo +
        DA.dipnot('bu liste bireysel tıbbi tavsiye yerine geçmez.') + '</div>'
    };
  };

  /* Danışan dosyası için: bu danışanın listeleri */
  function danisanKarti(c) {
    const L = listeler().filter((l) => l.c === c.id);
    return '<div class="card"><h2>Diyet listeleri</h2>' +
      (L.length ? '<div class="list">' + gorunurListeler(L).map((l) => '<a class="li chev" href="#/liste/' + esc(l.id) + '"><span class="grow"><div class="t">' +
        esc(l.ad || 'Beslenme listesi') + '</div><div class="s">' + esc(DA.fdate(l.d)) +
        (l.hafta ? ' · ' + haftaGunleri(l.hafta).length + ' günlük' : '') + '</div></span></a>').join('') + '</div>'
        : '<p class="muted small">Henüz liste yok. Değişim planından liste yazılır.</p>') +
      '<a class="btn sec sm block mt-s" href="#/hesapla/degisim?c=' + esc(c.id) + '">' + icon('note') + ' Değişim planından liste yaz</a></div>';
  }

  DA.liste = { olustur, carp, topla, karsilik, danisanKarti, metin, metinHafta, satirTur, hazir: HAZIR, taslakDoldur, kuralSonucu, gunSonra };
})();
