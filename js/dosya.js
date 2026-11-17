/* Danışan dosyası — Beslenme Bakım Süreci (ADIME) düzeni.

   Neden: dosya ölçümler ve tek bir serbest "Notlar" kutusundan ibaretti;
   biyokimya, ilaç, beslenme öyküsü, beslenme tanısı ve görüşme notları aynı
   kutuda karışıyor, tarihleri kayboluyordu.

     Değerlendirme  tarihli biyokimya · tıbbi tanı ve öykü · ilaç/takviye ·
                    beslenme öyküsü · 24 saatlik geriçağırma (menü olarak)
     Tanı           PES ifadeleri (Problem · Etiyoloji · Belirti/bulgu)
     Müdahale       değişim planı, diyet listeleri, menüler · hedef ve öneriler
     İzlem          tarihli görüşme notları · izlenecek göstergeler · genel not

   Bilerek YOK: laboratuvar referans aralıkları (laboratuvara ve yönteme göre
   değişir; kaynaksız değer yazılmaz) ve hazır PES terim listesi (eNCPT
   terminolojisi lisanslı). Test adı ve birim için yalnız yazım önerileri var.

   Veri (danışan kaydında):
     lab: [{id, d, ad, deger, birim}]   deger metin: "negatif" de yazılabilir
     pes: [{id, d, p, e, s, cozuldu}]
     gorusme: [{id, d, t}]
     dosya: {tani, ilac, beslenme, oneri, gosterge}
   Menüler danışana m.c (kimlik) ile bağlanır; geriçağırma menüsü m.tur='geri'. */
(function () {
  'use strict';
  const { esc, fmt, num, uid, icon } = DA;
  const danisan = (id) => (DA.state().clients || []).find((c) => c.id === id) || null;
  const dizi = (c, k) => (Array.isArray(c[k]) ? c[k] : (c[k] = []));
  const dosya = (c) => (c.dosya && typeof c.dosya === 'object' ? c.dosya : (c.dosya = {}));
  const yeniSira = (a) => DA.tarihSirali(a).slice().reverse();      /* en yeni önce */

  const TEST_ONERI = ['Açlık kan şekeri', 'HbA1c', 'Tokluk kan şekeri', 'İnsülin', 'Total kolesterol', 'LDL kolesterol',
    'HDL kolesterol', 'Trigliserit', 'Kreatinin', 'Üre', 'eGFR', 'Ürik asit', 'ALT', 'AST', 'Albümin', 'Total protein',
    'Hemoglobin', 'Ferritin', 'Demir', 'B12 vitamini', 'Folat', 'D vitamini', 'TSH', 'Sodyum', 'Potasyum', 'Kalsiyum',
    'Fosfor', 'Magnezyum', 'CRP'];
  const BIRIM_ONERI = ['mg/dL', '%', 'g/dL', 'mmol/L', 'mEq/L', 'ng/mL', 'pg/mL', 'µg/dL', 'µIU/mL', 'U/L', 'mL/dk/1,73 m²'];
  const sayiMi = (x) => isFinite(num(x));

  /* ---- biyokimya ---- */
  /* Her testin son değeri ve bir öncekiyle yönü. Yön yorum değildir:
     yüksek/düşük demez, yalnız değişimi gösterir. */
  function labOzet(c) {
    const grup = {};
    DA.tarihSirali(dizi(c, 'lab')).forEach((x) => {
      const k = DA.trLower(String(x.ad || '').trim());
      if (!k) return;
      (grup[k] = grup[k] || []).push(x);
    });
    return Object.keys(grup).map((k) => {
      const a = grup[k], son = a[a.length - 1], once = a.length > 1 ? a[a.length - 2] : null;
      let yon = '';
      if (once && sayiMi(son.deger) && sayiMi(once.deger)) {
        const f = num(son.deger) - num(once.deger);
        yon = Math.abs(f) < 1e-9 ? '=' : f > 0 ? '↑' : '↓';
      }
      return { ad: son.ad, son, once, yon, n: a.length };
    }).sort((x, y) => String(y.son.d).localeCompare(String(x.son.d)) || x.ad.localeCompare(y.ad, 'tr'));
  }
  /* Sayı Türkçe ondalıkla yazılır: 6.8 değil 6,8 */
  const degerYazi = (x) => esc(typeof x.deger === 'number' ? fmt(x.deger, 3) : String(x.deger == null ? '' : x.deger)) + (x.birim ? ' ' + esc(x.birim) : '');
  function labKarti(c) {
    const oz = labOzet(c), cid = esc(c.id);
    return '<div class="card" id="dosyaLab"><div class="row between"><h2>Biyokimya</h2>' +
      '<button class="btn sec sm" data-act="labYeni" data-id="' + cid + '">' + icon('plus') + ' Değer ekle</button></div>' +
      (oz.length ? '<div class="list mt-s">' + oz.map((o) =>
        '<button class="li" data-act="labTest" data-id="' + cid + '" data-ad="' + esc(o.ad) + '"><span class="grow">' +
        '<div class="t">' + esc(o.ad) + '</div><div class="s">' + degerYazi(o.son) + ' · ' + esc(DA.fdate(o.son.d)) +
        (o.once ? ' · önceki ' + degerYazi(o.once) : '') + '</div></span>' +
        (o.yon ? '<span class="end" aria-label="' + (o.yon === '↑' ? 'arttı' : o.yon === '↓' ? 'azaldı' : 'değişmedi') + '">' + o.yon + '</span>' : '') +
        '</button>').join('') + '</div>'
        : '<p class="muted small">Henüz değer yok. Tarihli girilen değerler test test izlenir.</p>') + '</div>';
  }
  function labForm(c, x) {
    x = x || {};
    return '<form data-form="lab" data-id="' + esc(c.id) + '" data-lid="' + esc(x.id || '') + '">' +
      '<label class="fld"><span>Tarih</span><input type="date" name="d" value="' + esc(x.d || DA.today()) + '" required></label>' +
      '<label class="fld"><span>Test</span><input type="text" name="ad" list="labTestler" value="' + esc(x.ad || '') + '" required></label>' +
      '<div class="grid2"><label class="fld"><span>Değer</span><input type="text" inputmode="decimal" name="deger" value="' + esc(x.deger == null ? '' : typeof x.deger === 'number' ? fmt(x.deger, 3) : x.deger) + '" required></label>' +
      '<label class="fld"><span>Birim</span><input type="text" name="birim" list="labBirimler" value="' + esc(x.birim || '') + '"></label></div>' +
      '<datalist id="labTestler">' + TEST_ONERI.map((t) => '<option value="' + esc(t) + '">').join('') + '</datalist>' +
      '<datalist id="labBirimler">' + BIRIM_ONERI.map((t) => '<option value="' + esc(t) + '">').join('') + '</datalist>' +
      '<p class="muted tiny">Referans aralığı laboratuvara göre değişir; sonuç kâğıdındaki aralığa bak.</p>' +
      '<button class="btn block" type="submit">Kaydet</button>' +
      (x.id ? '<button type="button" class="btn danger block mt-s" data-act="labSil" data-id="' + esc(c.id) + '" data-lid="' + esc(x.id) + '">Değeri sil</button>' : '') + '</form>';
  }
  DA.actions.labYeni = (el) => { const c = danisan(el.dataset.id); if (c) DA.sheet('Biyokimya değeri', labForm(c, el.dataset.ad ? { ad: el.dataset.ad } : null)); };
  /* Bir testin bütün değerleri, tarih sırasıyla */
  DA.actions.labTest = (el) => {
    const c = danisan(el.dataset.id); if (!c) return;
    const ad = DA.trLower(el.dataset.ad);
    const a = yeniSira(dizi(c, 'lab').filter((x) => DA.trLower(String(x.ad || '').trim()) === ad));
    DA.sheet(el.dataset.ad, '<div class="list">' + a.map((x) => '<button class="li" data-act="labDuzen" data-id="' + esc(c.id) + '" data-lid="' + esc(x.id) + '">' +
      '<span class="grow"><div class="t">' + degerYazi(x) + '</div><div class="s">' + esc(DA.fdate(x.d)) + '</div></span></button>').join('') + '</div>' +
      '<button class="btn sec block mt" data-act="labYeni" data-id="' + esc(c.id) + '" data-ad="' + esc(el.dataset.ad) + '">' + icon('plus') + ' Bu teste değer ekle</button>');
  };
  DA.actions.labDuzen = (el) => {
    const c = danisan(el.dataset.id), x = c && dizi(c, 'lab').find((y) => y.id === el.dataset.lid);
    if (x) DA.sheet('Biyokimya değeri', labForm(c, x));
  };
  DA.forms.lab = (f) => {
    const c = danisan(f.dataset.id); if (!c) return;
    const d = DA.formData(f), ad = String(d.ad || '').trim(), deger = String(d.deger || '').trim();
    if (!ad || !deger) return DA.toast('Test adı ve değer gerekli');
    /* Sayı ise ondalık virgül noktaya çevrilir ki karşılaştırma yapılabilsin */
    const rec = { d: d.d || DA.today(), ad, deger: sayiMi(deger) ? num(deger) : deger, birim: String(d.birim || '').trim() };
    const L = dizi(c, 'lab');
    if (f.dataset.lid) Object.assign(L.find((x) => x.id === f.dataset.lid) || {}, rec);
    else L.push(Object.assign({ id: uid() }, rec));
    DA.save(); DA.closeSheet(); DA.render(true);
  };
  DA.actions.labSil = (el) => {
    const c = danisan(el.dataset.id); if (!c) return;
    const L = dizi(c, 'lab'), i = L.findIndex((x) => x.id === el.dataset.lid);
    if (i < 0) return;
    const silinen = L.splice(i, 1)[0];
    DA.save(); DA.closeSheet(); DA.render(true);
    DA.silGeriAl('Değer silindi', () => { L.splice(i, 0, silinen); });
  };

  /* ---- metin alanları (anında kaydedilir) ---- */
  const METIN = {
    tani: ['Tıbbi tanılar ve öykü', 'Kronik hastalıklar, ameliyatlar, aile öyküsü…'],
    ilac: ['İlaçlar ve takviyeler', 'Ad, doz, kullanım zamanı…'],
    beslenme: ['Beslenme öyküsü', 'Öğün düzeni, iştah, besin tüketim sıklığı, sıvı alımı…'],
    oneri: ['Hedefler ve öneriler', 'Danışanla belirlenen hedefler, verilen öneriler…'],
    gosterge: ['İzlenecek göstergeler', 'Kilo, bel çevresi, HbA1c, öğün atlama sayısı…']
  };
  const metinAlani = (c, k) => '<label class="fld"><span>' + METIN[k][0] + '</span><textarea data-live="dosyaMetin" data-id="' +
    esc(c.id) + '" data-f="' + k + '" placeholder="' + esc(METIN[k][1]) + '">' + esc(dosya(c)[k] || '') + '</textarea></label>';
  DA.live.dosyaMetin = (el) => {
    const c = danisan(el.dataset.id); if (!c || !METIN[el.dataset.f]) return;
    dosya(c)[el.dataset.f] = el.value; DA.save();
  };

  /* ---- menüler: geriçağırma ve plan menüleri ---- */
  const menuler = (c, geri) => (DA.state().menus || []).filter((m) => m.c === c.id && ((m.tur === 'geri') === !!geri));
  const kcal = (m) => (DA.foods && DA.foods.toplam ? DA.foods.toplam(m).kcal : null);
  function menuListesi(c, geri) {
    const a = menuler(c, geri);
    return a.length ? '<div class="list mt-s">' + a.map((m) => '<a class="li chev" href="#/menu/' + esc(m.id) + '"><span class="grow"><div class="t">' +
      esc(m.title || 'Menü') + '</div><div class="s">' + esc(DA.fdate(m.date)) + (kcal(m) != null ? ' · ' + fmt(kcal(m), 0) + ' kcal' : '') +
      '</div></span></a>').join('') + '</div>' : '';
  }
  function geriKarti(c) {
    return '<div class="card"><div class="row between"><h2>24 saatlik geriçağırma</h2>' +
      '<button class="btn sec sm" data-act="dosyaMenu" data-id="' + esc(c.id) + '" data-tur="geri">' + icon('plus') + ' Ekle</button></div>' +
      (menuListesi(c, true) || '<p class="muted small">Danışanın bir gününü besin besin gir; enerji, makro ve mikro besin toplamı hedefle karşılaştırılır.</p>') + '</div>';
  }
  function menuKarti(c) {
    return '<div class="card"><div class="row between"><h2>Menüler</h2>' +
      '<button class="btn sec sm" data-act="dosyaMenu" data-id="' + esc(c.id) + '">' + icon('plus') + ' Yeni menü</button></div>' +
      (menuListesi(c, false) || '<p class="muted small">Bu danışana bağlı menü yok. Menü planlayıcıda danışan seçerek de bağlanır.</p>') + '</div>';
  }
  DA.actions.dosyaMenu = (el) => {
    const c = danisan(el.dataset.id); if (!c) return;
    const geri = el.dataset.tur === 'geri', meals = {};
    (DA.foods ? DA.foods.ogunler : ['Kahvaltı', 'Kuşluk', 'Öğle', 'İkindi', 'Akşam', 'Gece ara öğünü']).forEach((k) => { meals[k] = []; });
    const m = { id: uid(), title: geri ? '24 saatlik geriçağırma' : 'Menü — ' + c.name, date: geri ? dun() : DA.today(),
      client: c.name, c: c.id, tur: geri ? 'geri' : '', note: '', target: null, meals };
    DA.state().menus.unshift(m); DA.save(); DA.go('menu/' + m.id);
  };
  /* Geriçağırma dünü anlatır: tarih varsayılan olarak dün */
  function dun() { const d = new Date(); d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  /* ---- beslenme tanısı (PES) ---- */
  const pesCumle = (x) => '<b>' + esc(x.p) + '</b>' + (x.e ? '; ' + esc(x.e) + ' ile ilişkili' : '') + (x.s ? ', ' + esc(x.s) + ' ile kanıtlanan' : '') + '.';
  function pesKarti(c) {
    const a = yeniSira(dizi(c, 'pes')), acik = a.filter((x) => !x.cozuldu), coz = a.filter((x) => x.cozuldu);
    const satir = (x) => '<button class="li" data-act="pesDuzen" data-id="' + esc(c.id) + '" data-pid="' + esc(x.id) + '"><span class="grow">' +
      '<div class="small pes">' + pesCumle(x) + '</div><div class="s">' + esc(DA.fdate(x.d)) + (x.cozuldu ? ' · çözüldü' : '') + '</div></span></button>';
    return '<div class="card" id="dosyaPes"><div class="row between"><h2>Beslenme tanısı</h2>' +
      '<button class="btn sec sm" data-act="pesYeni" data-id="' + esc(c.id) + '">' + icon('plus') + ' Tanı ekle</button></div>' +
      (acik.length ? '<div class="list mt-s">' + acik.map(satir).join('') + '</div>'
        : '<p class="muted small">Aktif tanı yok. PES: problem, etiyoloji (ile ilişkili), belirti ve bulgular (ile kanıtlanan).</p>') +
      (coz.length ? '<details class="acc mt-s"><summary>Çözülen tanılar <span class="muted tiny">' + coz.length + '</span></summary>' +
        '<div class="list" style="margin:0;border:0;box-shadow:none">' + coz.map(satir).join('') + '</div></details>' : '') + '</div>';
  }
  function pesForm(c, x) {
    x = x || {};
    return '<form data-form="pes" data-id="' + esc(c.id) + '" data-pid="' + esc(x.id || '') + '">' +
      '<label class="fld"><span>Tarih</span><input type="date" name="d" value="' + esc(x.d || DA.today()) + '" required></label>' +
      '<label class="fld"><span>Problem (P)</span><input type="text" name="p" value="' + esc(x.p || '') + '" placeholder="ör. yetersiz enerji alımı" required></label>' +
      '<label class="fld"><span>Etiyoloji (E) — … ile ilişkili</span><input type="text" name="e" value="' + esc(x.e || '') + '" placeholder="ör. iştahsızlık"></label>' +
      '<label class="fld"><span>Belirti ve bulgular (S) — … ile kanıtlanan</span><textarea name="s" placeholder="ör. son bir ayda %6 ağırlık kaybı">' + esc(x.s || '') + '</textarea></label>' +
      '<button class="btn block" type="submit">Kaydet</button>' +
      (x.id ? '<div class="grid2 mt-s"><button type="button" class="btn sec block" data-act="pesDurum" data-id="' + esc(c.id) + '" data-pid="' + esc(x.id) + '">' +
        (x.cozuldu ? 'Yeniden aç' : 'Çözüldü') + '</button><button type="button" class="btn danger block" data-act="pesSil" data-id="' + esc(c.id) +
        '" data-pid="' + esc(x.id) + '">Sil</button></div>' : '') + '</form>';
  }
  DA.actions.pesYeni = (el) => { const c = danisan(el.dataset.id); if (c) DA.sheet('Beslenme tanısı (PES)', pesForm(c)); };
  DA.actions.pesDuzen = (el) => {
    const c = danisan(el.dataset.id), x = c && dizi(c, 'pes').find((y) => y.id === el.dataset.pid);
    if (x) DA.sheet('Beslenme tanısı (PES)', pesForm(c, x));
  };
  DA.forms.pes = (f) => {
    const c = danisan(f.dataset.id); if (!c) return;
    const d = DA.formData(f), rec = { d: d.d || DA.today(), p: String(d.p || '').trim(), e: String(d.e || '').trim(), s: String(d.s || '').trim() };
    if (!rec.p) return DA.toast('Problem gerekli');
    const P = dizi(c, 'pes');
    if (f.dataset.pid) Object.assign(P.find((x) => x.id === f.dataset.pid) || {}, rec);
    else P.push(Object.assign({ id: uid(), cozuldu: false }, rec));
    DA.save(); DA.closeSheet(); DA.render(true);
  };
  DA.actions.pesDurum = (el) => {
    const c = danisan(el.dataset.id), x = c && dizi(c, 'pes').find((y) => y.id === el.dataset.pid);
    if (!x) return;
    x.cozuldu = !x.cozuldu; DA.save(); DA.closeSheet(); DA.render(true);
  };
  DA.actions.pesSil = (el) => {
    const c = danisan(el.dataset.id); if (!c) return;
    const P = dizi(c, 'pes'), i = P.findIndex((x) => x.id === el.dataset.pid);
    if (i < 0) return;
    const silinen = P.splice(i, 1)[0];
    DA.save(); DA.closeSheet(); DA.render(true);
    DA.silGeriAl('Tanı silindi', () => { P.splice(i, 0, silinen); });
  };

  /* ---- görüşme notları ---- */
  function gorusmeKarti(c) {
    const a = yeniSira(dizi(c, 'gorusme'));
    return '<div class="card" id="dosyaGorusme"><div class="row between"><h2>Görüşme notları</h2>' +
      '<button class="btn sec sm" data-act="gorusmeYeni" data-id="' + esc(c.id) + '">' + icon('plus') + ' Not ekle</button></div>' +
      (a.length ? '<div class="list mt-s">' + a.map((x) => '<button class="li" data-act="gorusmeDuzen" data-id="' + esc(c.id) + '" data-gid="' + esc(x.id) + '">' +
        '<span class="grow"><div class="t">' + esc(DA.fdate(x.d)) + '</div><div class="s">' + esc(String(x.t || '').split('\n')[0].slice(0, 140)) + '</div></span></button>').join('') + '</div>'
        : '<p class="muted small">Her görüşmenin notu tarihiyle ayrı tutulur.</p>') + '</div>';
  }
  function gorusmeForm(c, x) {
    x = x || {};
    return '<form data-form="gorusme" data-id="' + esc(c.id) + '" data-gid="' + esc(x.id || '') + '">' +
      '<label class="fld"><span>Tarih</span><input type="date" name="d" value="' + esc(x.d || DA.today()) + '" required></label>' +
      '<label class="fld"><span>Not</span><textarea name="t" required>' + esc(x.t || '') + '</textarea></label>' +
      '<button class="btn block" type="submit">Kaydet</button>' +
      (x.id ? '<button type="button" class="btn danger block mt-s" data-act="gorusmeSil" data-id="' + esc(c.id) + '" data-gid="' + esc(x.id) + '">Notu sil</button>' : '') + '</form>';
  }
  DA.actions.gorusmeYeni = (el) => { const c = danisan(el.dataset.id); if (c) DA.sheet('Görüşme notu', gorusmeForm(c)); };
  DA.actions.gorusmeDuzen = (el) => {
    const c = danisan(el.dataset.id), x = c && dizi(c, 'gorusme').find((y) => y.id === el.dataset.gid);
    if (x) DA.sheet('Görüşme notu', gorusmeForm(c, x));
  };
  DA.forms.gorusme = (f) => {
    const c = danisan(f.dataset.id); if (!c) return;
    const d = DA.formData(f), rec = { d: d.d || DA.today(), t: String(d.t || '').trim() };
    if (!rec.t) return DA.toast('Notu yaz');
    const G = dizi(c, 'gorusme');
    if (f.dataset.gid) Object.assign(G.find((x) => x.id === f.dataset.gid) || {}, rec);
    else G.push(Object.assign({ id: uid() }, rec));
    DA.save(); DA.closeSheet(); DA.render(true);
  };
  DA.actions.gorusmeSil = (el) => {
    const c = danisan(el.dataset.id); if (!c) return;
    const G = dizi(c, 'gorusme'), i = G.findIndex((x) => x.id === el.dataset.gid);
    if (i < 0) return;
    const silinen = G.splice(i, 1)[0];
    DA.save(); DA.closeSheet(); DA.render(true);
    DA.silGeriAl('Not silindi', () => { G.splice(i, 0, silinen); });
  };

  /* ---- ekran parçaları ---- */
  DA.dosya = {
    degerlendirme: (c) => '<div class="sect">Değerlendirme</div>' + labKarti(c) +
      '<div class="card"><h2>Klinik ve öykü</h2>' + metinAlani(c, 'tani') + metinAlani(c, 'ilac') + metinAlani(c, 'beslenme') + '</div>' +
      geriKarti(c),
    /* Bölüm başlığı "Tanı": altındaki kart zaten "Beslenme tanısı" diyor */
    tani: (c) => '<div class="sect">Tanı</div>' + pesKarti(c),
    mudahale: (c) => menuKarti(c) + '<div class="card">' + metinAlani(c, 'oneri') + '</div>',
    izlem: (c) => '<div class="sect">İzlem</div>' + gorusmeKarti(c) + '<div class="card">' + metinAlani(c, 'gosterge') +
      '<label class="fld" style="margin-bottom:0"><span>Genel not</span><textarea data-live="clientNote" data-id="' + esc(c.id) +
      '" placeholder="Başka bir yere sığmayan notlar…">' + esc(c.note || '') + '</textarea></label></div>',

    /* Raporda içeriği olan dosya bölümleri, çıktı ayar kartı için.
       Sıra rapordaki sırayla aynı. */
    bolumler(c) {
      const D = dosya(c), var_ = (k) => !!String(D[k] || '').trim();
      return [['lab', 'Biyokimya', labOzet(c).length], ['tani', 'Tıbbi tanılar', var_('tani')], ['ilac', 'İlaçlar', var_('ilac')],
        ['beslenme', 'Beslenme öyküsü', var_('beslenme')], ['pes', 'Beslenme tanısı', dizi(c, 'pes').some((x) => !x.cozuldu)],
        ['oneri', 'Hedef ve öneriler', var_('oneri')], ['gosterge', 'Göstergeler', var_('gosterge')],
        ['gorusme', 'Görüşme notları', dizi(c, 'gorusme').length]].filter((b) => b[2]).map((b) => [b[0], b[1]]);
    },
    /* Danışan raporu için bloklar; goster(k) false dönen bölüm basılmaz */
    rapor(c, goster) {
      const g = goster || (() => true);
      const D = dosya(c), oz = g('lab') ? labOzet(c) : [], acik = g('pes') ? yeniSira(dizi(c, 'pes')).filter((x) => !x.cozuldu) : [];
      const metin = (k) => (D[k] && g(k) ? '<div class="blok"><h3>' + METIN[k][0] + '</h3>' + esc(D[k]).replace(/\n/g, '<br>') + '</div>' : '');
      const gor = g('gorusme') ? yeniSira(dizi(c, 'gorusme')).slice(0, 5) : [];
      return (oz.length ? '<div class="blok"><h3>Biyokimya (son değerler)</h3><table><thead><tr><th>Test</th><th class="n">Son</th><th>Tarih</th><th class="n">Önceki</th></tr></thead><tbody>' +
          oz.map((o) => '<tr><td>' + esc(o.ad) + '</td><td class="n">' + degerYazi(o.son) + '</td><td>' + esc(DA.fdate(o.son.d)) + '</td><td class="n">' +
            (o.once ? degerYazi(o.once) + (o.yon ? ' ' + o.yon : '') : '—') + '</td></tr>').join('') + '</tbody></table></div>' : '') +
        metin('tani') + metin('ilac') + metin('beslenme') +
        (acik.length ? '<div class="blok"><h3>Beslenme tanısı (aktif)</h3><ul>' + acik.map((x) => '<li>' + pesCumle(x) + '</li>').join('') + '</ul></div>' : '') +
        metin('oneri') + metin('gosterge') +
        (gor.length ? '<div class="blok"><h3>Son görüşme notları</h3><ul>' + gor.map((x) => '<li><b>' + esc(DA.fdate(x.d)) + ':</b> ' +
          esc(x.t).replace(/\n/g, '<br>') + '</li>').join('') + '</ul></div>' : '');
    },
    labOzet
  };
})();
