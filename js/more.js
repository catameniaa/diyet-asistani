/* Ana sayfa (özet panosu), Ayarlar, yedek, şablonlar */
(function () {
  'use strict';
  const { esc, icon, fmt } = DA;

  const standalone = () => window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function tile(href, ico, t, d, acc) {
    return '<a class="tile' + (acc ? ' acc-t' : '') + '" href="' + href + '"><span class="ic">' + icon(ico) + '</span><b>' + esc(t) + '</b><span class="d">' + esc(d) + '</span></a>';
  }
  const stat = (href, n, l) => '<a class="stat" href="' + href + '"><b>' + esc(String(n)) + '</b><span>' + esc(l) + '</span></a>';

  function greeting() {
    const h = new Date().getHours();
    if (h < 6) return 'İyi geceler';
    if (h < 12) return 'Günaydın';
    if (h < 18) return 'İyi günler';
    return 'İyi akşamlar';
  }

  /* Favoriler ve son açılanlar */
  function quickRow() {
    const f = DA.favs(), r = DA.recents().filter((x) => !DA.isFav(x.h));
    let h = '';
    if (f.length) h += '<div class="sect">Favoriler</div><div class="chips">' +
      f.map((x) => '<a class="chip" href="' + esc(x.h) + '">' + esc(x.t) + '</a>').join('') + '</div>';
    if (r.length) h += '<div class="sect">Son açılanlar</div><div class="chips">' +
      r.slice(0, 6).map((x) => '<a class="chip" href="' + esc(x.h) + '">' + esc(x.t) + '</a>').join('') + '</div>';
    return h;
  }

  /* Son düzenlenen danışanlar — en çok yapılan iş buradan başlar */
  function sonDanisanlar() {
    const cl = (DA.state().clients || []).slice();
    if (!cl.length) return '';
    const sonOlcum = (c) => (c.meas || []).reduce((a, m) => (m.d > a ? m.d : a), c.upd || '');
    cl.sort((a, b) => sonOlcum(b).localeCompare(sonOlcum(a)));
    return '<div class="sect">Son danışanlar</div><div class="list mb">' +
      cl.slice(0, 4).map((c) => {
        const m = (c.meas || []).slice().sort((a, b) => a.d.localeCompare(b.d)).pop();
        return '<a class="li chev" href="#/danisan/' + esc(c.id) + '"><span class="ic">' + icon('users') + '</span>' +
          '<span class="grow"><div class="t">' + esc(c.name) + '</div><div class="s">' +
          (m ? DA.fdate(m.d) + (m.w ? ' · ' + DA.fmt(m.w, 1) + ' kg' : '') : 'ölçüm yok') + '</div></span></a>';
      }).join('') + '</div>' +
      (cl.length > 4 ? '<a class="btn ghost block mb" href="#/danisan">Tüm danışanlar (' + cl.length + ')</a>' : '');
  }

  /* Hızlı hesap: boy-kilo girince anında BKİ ve tahmini enerji */
  const HQ = () => (DA.state().ui.hq = DA.state().ui.hq || {});
  function hizliHtml() {
    const q = HQ(), p = DA.state().profile || {};
    const boy = DA.num(q.h) || p.h, kilo = DA.num(q.w) || p.w;
    let out = '<p class="muted tiny" style="margin-bottom:0">Boy ve kiloyu gir, BKİ ve kabaca enerji ihtiyacın çıksın.</p>';
    if (boy > 50 && kilo > 2) {
      const bki = kilo / Math.pow(boy / 100, 2);
      const sinif = bki < 18.5 ? ['Zayıf', 'warn'] : bki < 25 ? ['Normal', 'ok'] : bki < 30 ? ['Fazla kilolu', 'warn'] : ['Obez', 'bad'];
      const yas = p.age || 30, erkek = p.sex !== 'K';
      const bmh = 10 * kilo + 6.25 * boy - 5 * yas + (erkek ? 5 : -161);
      out = '<div class="res hl"><span class="l">BKİ</span><span class="v">' + DA.fmt(bki, 1) +
        '<span class="sub">kg/m²</span></span></div>' +
        '<div class="row gap mt-s"><span class="badge ' + sinif[1] + '">' + sinif[0] + '</span>' +
        '<span class="muted small">Az aktif (PAL 1,375) ≈ <b>' + DA.fmt(bmh * 1.375, 0) + ' kcal/gün</b></span></div>' +
        '<p class="muted tiny">Mifflin–St Jeor, ' + yas + ' yaş ' + (erkek ? 'erkek' : 'kadın') +
        ' varsayımıyla. Ayrıntı için enerji hesaplayıcısını aç.</p>';
    }
    return out;
  }
  function quickCalc() {
    const q = HQ(), p = DA.state().profile || {};
    return '<div class="card"><div class="sect" style="margin-top:0">Hızlı hesap</div>' +
      '<div class="grid2"><label class="fld"><span>Boy (cm)</span><input type="text" inputmode="decimal" name="h" value="' +
      esc(q.h != null ? q.h : (p.h || '')) + '" data-live="hq"></label>' +
      '<label class="fld"><span>Kilo (kg)</span><input type="text" inputmode="decimal" name="w" value="' +
      esc(q.w != null ? q.w : (p.w || '')) + '" data-live="hq"></label></div>' +
      '<div id="hqOut">' + hizliHtml() + '</div>' +
      '<a class="btn ghost block mt-s" href="#/hesapla/enerji">' + icon('heart') + ' Enerji ve makro hesabı</a></div>';
  }
  DA.live.hq = (el) => {
    HQ()[el.name] = el.value; DA.save();
    const o = DA.$('#hqOut'); if (o) o.innerHTML = hizliHtml();
  };

  DA.views.ana = () => {
    const due = DA.dueCount ? DA.dueCount() : 0, S = DA.state();
    const hint = (!standalone() && !S.ui.hideInstall) ?
      '<div class="note ok"><b>Uygulama gibi kullan:</b> ' + (isIOS() ? 'Safari’de <b>Paylaş</b> simgesine dokun → <b>Ana Ekrana Ekle</b>.' : 'Tarayıcı menüsünden “Ana ekrana ekle / Uygulamayı yükle” seç.') +
      '<button class="btn sm ghost block" style="margin-top:10px" data-act="hideInstall">Tamam, gizle</button></div>' : '';

    const gun = DA.daysSinceBackup(), veri = S.clients.length + S.menus.length + S.journal.length;
    const yedek = (veri && (gun === null || gun >= 14)) ?
      '<div class="note warn"><b>' + (gun === null ? 'Hiç yedek almadın.' : gun + ' gündür yedek almadın.') + '</b> ' +
      'Veriler yalnızca bu cihazda; tarayıcı verilerini temizlersen ya da telefon değişirse kaybolur.' +
      '<button class="btn sm block" style="margin-top:10px" data-act="backup">' + icon('save') + ' Şimdi yedek al</button></div>' : '';

    const hero = '<div class="hero"><div class="hi">' + esc(greeting()) + '</div><h2>' + esc(DA.APP) + '</h2>' +
      '<div class="by">' + esc(DA.dyt()) + '</div>' +
      '<div class="stats">' +
        stat('#/danisan', S.clients.length, S.clients.length === 1 ? 'danışan' : 'danışan') +
        stat('#/menu', S.menus.length, 'menü') +
        stat('#/kart', due, due ? 'kart bekliyor' : 'kart günü') +
      '</div></div>';

    return {
      title: DA.APP, tab: 'ana',
      html: hero + yedek + hint + quickRow() + sonDanisanlar() + quickCalc() +
        '<div class="grid2 mb"><button class="btn sec block" data-act="quickMeas">' + icon('plus') + ' Ölçüm ekle</button>' +
        '<a class="btn sec block" href="#/staj">' + icon('note') + ' Staj notu</a></div>' +
        '<div class="sect">Araçlar</div>' +
        '<div class="tiles">' +
        tile('#/hesapla', 'calc', 'Hesaplayıcılar', DA.calcs.length + ' hesaplayıcı') +
        tile('#/hesapla/degisim', 'table', 'Değişim listesi', 'Otomatik dağıtım, porsiyonlar', true) +
        tile('#/besin', 'apple', 'Besinler', DA.data.foods.length + ' besin ve porsiyonlar') +
        tile('#/menu', 'menu', 'Menü planlayıcı', 'Öğün öğün planla, PDF yap') +
        tile('#/danisan', 'users', 'Danışanlar', 'Ölçüm, persentil, grafik', true) +
        tile('#/referans', 'book', 'Klinik referans', 'TEMD, TÜBER, lab değerleri') +
        tile('#/kart', 'cards', 'Çalışma kartları', due ? due + ' kart bugün seni bekliyor' : 'Sınav ve staj için tekrar') +
        tile('#/staj', 'note', 'Staj günlüğü', 'Vaka notları ve saatler') +
        '</div>' +
        '<div class="brandline"><span class="r"></span><b>' + esc(DA.dyt()) + '</b>Diyetetik öğrencileri ve diyetisyenler için</div>' +
        '<p class="muted tiny center">Verilerin yalnızca bu cihazda saklanır. Ayarlar → Yedek ile yedek al.</p>'
    };
  };
  DA.actions.hideInstall = () => { DA.state().ui.hideInstall = true; DA.save(); DA.render(true); };

  /* Favori aç/kapa — hesaplayıcı ve diğer sayfalardan çağrılır */
  DA.actions.favToggle = (el) => {
    const on = DA.toggleFav(el.dataset.h, el.dataset.t, el.dataset.ico);
    DA.toast(on ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı');
    DA.render(true);
  };

  DA.views.daha = (parts) => {
    if (parts[0] === 'sablon') return {
      title: 'Numbers şablonları', back: 'daha',
      html: '<div class="card"><h2>Diyetisyen şablonları (.xlsx)</h2><p class="small muted" style="margin-top:0">Beş sayfalık tek dosya: danışan takip çizelgesi, haftalık menü, 3 günlük besin tüketim kaydı, staj saat çizelgesi, enerji hesaplama. Formüller hazır.</p>' +
        '<a class="btn block" href="sablonlar/Diyet-Asistani-Sablonlar.xlsx" download>' + icon('save') + ' Şablonları indir</a>' +
        '<div class="note mt"><b>iPhone’da:</b> indirilen dosyaya dokun → <b>Paylaş</b> → <b>Numbers</b>’ı seç. Numbers .xlsx dosyalarını açar; iCloud’a kaydedersen tüm cihazlarında görünür.</div></div>'
    };

    const th = DA.theme();
    const themeSeg = '<div class="seg">' + DA.THEMES.map((t) =>
      '<label><input type="radio" name="theme" value="' + t[0] + '" data-change="theme"' + (th === t[0] ? ' checked' : '') + '><span>' + t[1] + '</span></label>').join('') + '</div>';

    return {
      title: 'Ayarlar', tab: 'ana', back: 'ana',
      html: '<div class="sect">Görünüm</div><div class="card"><label class="fld"><span>Tema</span>' + themeSeg + '</label>' +
        '<p class="muted tiny" style="margin:0">Otomatik seçilirse telefonunun görünüm ayarını izler.</p></div>' +

        '<div class="sect">Diyetisyen</div><div class="card">' +
        '<form data-form="dyt"><label class="fld"><span>Ad ve unvan</span><input type="text" name="dyt" value="' + esc(DA.dyt()) + '" placeholder="Dyt. Ad Soyad" autocomplete="name"></label>' +
        '<button class="btn block" type="submit">Kaydet</button></form>' +
        '<p class="muted tiny" style="margin-bottom:0">Ana sayfada, menü PDF’lerinde ve paylaşılan planlarda görünür.</p></div>' +

        '<div class="list"><a class="li chev" href="#/staj"><span class="ic">' + icon('note') + '</span><span class="grow"><div class="t">Staj günlüğü</div></span></a>' +
        '<a class="li chev" href="#/kart"><span class="ic">' + icon('cards') + '</span><span class="grow"><div class="t">Çalışma kartları</div></span></a>' +
        '<a class="li chev" href="#/daha/sablon"><span class="ic">' + icon('table') + '</span><span class="grow"><div class="t">Numbers şablonları</div></span></a></div>' +

        '<div class="sect">Yedek</div><div class="card"><p class="small muted" style="margin-top:0">Tüm verilerin (danışanlar, menüler, notlar, kartlar) yalnızca bu cihazda tutulur. Telefon değiştirirsen ya da tarayıcı verilerini temizlersen kaybolur — düzenli yedek al.</p>' +
        '<div class="res"><span class="l">Son yedek</span><span class="v" style="font-size:15px">' +
        (DA.state().ui.lastBackup ? esc(DA.fdate(DA.state().ui.lastBackup)) + '<span class="sub">' + DA.daysSinceBackup() + ' gün önce</span>' : 'Hiç alınmadı') + '</span></div>' +
        '<button class="btn block" data-act="backup">' + icon('save') + ' Yedeği indir / paylaş</button>' +
        '<label class="btn ghost block mt-s" style="cursor:pointer">Yedeği yükle<input type="file" accept="application/json,.json" data-change="restore" hidden></label>' +
        '<button class="btn danger block mt-s" data-act="wipe">Tüm verileri sil</button></div>' +

        '<div class="sect">Hakkında</div><div class="card small muted">' +
        '<p style="margin-top:0"><b style="color:var(--ink)">' + esc(DA.APP) + '</b> — ücretsiz, reklamsız, çevrimdışı çalışır.</p>' +
        '<p>Hazırlayan: <b style="color:var(--ink)">' + esc(DA.dyt()) + '</b></p>' +
        '<p style="margin-bottom:0">Hesaplayıcılar yaygın kullanılan formüllere dayanır; besin değerleri yaklaşık ortalamalardır. Eğitim ve yardımcı araç amaçlıdır, bireysel tıbbi tavsiye yerine geçmez; klinik kararlar için güncel kılavuzlara ve kurum protokollerine bakın.</p></div>' +
        '<div class="brandline"><span class="r"></span><b>' + esc(DA.dyt()) + '</b></div>'
    };
  };

  DA.live.theme = (el) => { DA.setTheme(el.value); DA.toast('Tema: ' + (DA.THEMES.find((t) => t[0] === el.value) || [, ''])[1]); };
  DA.forms.dyt = (f) => {
    DA.state().profile.dyt = DA.formData(f).dyt.trim();
    DA.save(); DA.toast('Kaydedildi'); DA.render(true);
  };

  /* Son yedekten bu yana geçen gün */
  DA.daysSinceBackup = () => {
    const d = DA.state().ui.lastBackup;
    if (!d) return null;
    const t = new Date(d + 'T00:00');
    if (isNaN(t)) return null;
    return Math.floor((Date.now() - t.getTime()) / 86400000);
  };
  function markBackup() {
    const S = DA.state();
    S.ui.lastBackup = DA.today(); DA.save();
    DA.toast('Yedeklendi: ' + S.clients.length + ' danışan, ' + S.menus.length + ' menü, ' + S.journal.length + ' staj kaydı');
  }

  DA.actions.backup = async () => {
    const json = JSON.stringify(DA.state(), null, 1), name = 'diyet-asistani-yedek-' + DA.today() + '.json';
    try {
      const file = new File([json], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); markBackup(); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    markBackup();
  };
  DA.live.restore = (el) => {
    const f = el.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const o = JSON.parse(r.result);
        if (!o || typeof o !== 'object' || !Array.isArray(o.clients)) throw new Error('bad');
        if (!confirm('Mevcut veriler bu yedekle DEĞİŞTİRİLECEK. Devam edilsin mi?')) return;
        DA.replaceState(o); DA.toast('Yedek yüklendi'); DA.render(false);
      } catch (e) { DA.toast('Geçersiz yedek dosyası'); }
    };
    r.readAsText(f); el.value = '';
  };
  DA.actions.wipe = () => {
    if (!confirm('Tüm veriler kalıcı olarak silinecek. Emin misin?')) return;
    DA.replaceState({}); DA.toast('Tüm veriler silindi'); DA.render(false);
  };
})();
