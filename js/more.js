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

  DA.views.ana = () => {
    const due = DA.dueCount ? DA.dueCount() : 0, S = DA.state();
    const hint = (!standalone() && !S.ui.hideInstall) ?
      '<div class="note ok"><b>Uygulama gibi kullan:</b> ' + (isIOS() ? 'Safari’de <b>Paylaş</b> simgesine dokun → <b>Ana Ekrana Ekle</b>.' : 'Tarayıcı menüsünden “Ana ekrana ekle / Uygulamayı yükle” seç.') +
      '<button class="btn sm ghost block" style="margin-top:10px" data-act="hideInstall">Tamam, gizle</button></div>' : '';

    const hero = '<div class="hero"><div class="hi">' + esc(greeting()) + '</div><h2>' + esc(DA.APP) + '</h2>' +
      '<div class="by">' + esc(DA.dyt()) + '</div>' +
      '<div class="stats">' +
        stat('#/danisan', S.clients.length, S.clients.length === 1 ? 'danışan' : 'danışan') +
        stat('#/menu', S.menus.length, 'menü') +
        stat('#/kart', due, due ? 'kart bekliyor' : 'kart günü') +
      '</div></div>';

    return {
      title: DA.APP, tab: 'ana',
      html: hero + hint + quickRow() +
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

  DA.actions.backup = async () => {
    const json = JSON.stringify(DA.state(), null, 1), name = 'diyet-asistani-yedek-' + DA.today() + '.json';
    try {
      const file = new File([json], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    DA.toast('Yedek indirildi');
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
