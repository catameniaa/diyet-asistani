/* Ana sayfa (özet panosu), Ayarlar, yedek, şablonlar */
(function () {
  'use strict';
  const { esc, icon, fmt } = DA;

  const standalone = () => window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function tile(href, ico, t, d, acc) {
    return '<a class="tile' + (acc ? ' acc-t' : '') + '" href="' + href + '"><span class="ic">' + icon(ico) + '</span><b>' + esc(t) + '</b><span class="d">' + esc(d) + '</span></a>';
  }
  /* Hero kutusu: değer büyük, etiket küçük; tamamı dokunulabilir bağlantı.
     ton = '' | 'uyari' | 'iyi' — sıfır olmayan iş yükü göze çarpsın diye. */
  const stat = (href, n, l, ton) => '<a class="stat' + (ton ? ' ' + ton : '') + '" href="' + href + '">' +
    '<b>' + esc(String(n)) + '</b><span>' + esc(l) + '</span></a>';

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
  /* Takip listesi: takip aralığını aşmış danışanlar.
     Ana sayfanın en üstünde durur çünkü "kim geri dönmeli" günlük sorulan sorudur. */
  function takipHtml() {
    if (!DA.takipGereken) return '';
    const t = DA.takipGereken();
    if (!t.length) return '';
    const gorunen = t.slice(0, 5);
    return '<div class="sect"><span>Takip bekleyen <span class="badge warn">' + t.length + '</span></span></div>' +
      '<div class="list mb">' + gorunen.map((x) => {
        const g = x.gun;
        return '<a class="li chev" href="#/danisan/' + esc(x.c.id) + '"><span class="ic warn">' + icon('users') + '</span>' +
          '<span class="grow"><div class="t">' + esc(x.c.name) + '</div>' +
          '<div class="s">' + (g == null ? 'Hiç ölçüm girilmemiş'
            : g + ' gündür ölçüm yok · ' + (x.c.aralik || 21) + ' günlük takip') + '</div></span></a>';
      }).join('') + '</div>' +
      (t.length > gorunen.length
        ? '<a class="btn ghost block mb" href="#/danisan">Kalan ' + (t.length - gorunen.length) + ' danışan</a>' : '');
  }

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

    const takip = DA.takipGereken ? DA.takipGereken().length : 0;
    const hafta = DA.sonGunOlcum ? DA.sonGunOlcum(7) : 0;
    const hero = '<div class="hero"><div class="hi">' + esc(greeting()) + '</div><h2>' + esc(DA.APP) + '</h2>' +
      '<div class="by">' + esc(DA.dyt()) + '</div>' +
      '<div class="stats">' +
        /* Envanter sayıları ("23 danışan") her gün aynıydı; hiçbir şey
           söylemiyordu. Kutular artık bugün yapılacak işi gösteriyor.
           Toplam sayılar aşağıdaki araç kutularına taşındı. */
        stat('#/danisan', takip, 'takip bekliyor', takip ? 'uyari' : '') +
        stat('#/danisan', hafta, 'bu hafta ölçüm', hafta ? 'iyi' : '') +
        stat('#/kart', due, due ? 'kart bekliyor' : 'kart günü', due ? 'uyari' : '') +
      '</div></div>';

    return {
      title: DA.APP, tab: 'ana',
      html: hero + yedek + takipHtml() + hint + quickRow() + sonDanisanlar() + quickCalc() +
        '<div class="grid2 mb"><button class="btn sec block" data-act="quickMeas">' + icon('plus') + ' Ölçüm ekle</button>' +
        '<a class="btn sec block" href="#/staj">' + icon('note') + ' Staj notu</a></div>' +
        '<div class="sect">Araçlar</div>' +
        '<div class="tiles">' +
        tile('#/hesapla', 'calc', 'Hesaplayıcılar', DA.calcs.length + ' hesaplayıcı') +
        tile('#/hesapla/degisim', 'table', 'Değişim listesi', 'Otomatik dağıtım, porsiyonlar', true) +
        tile('#/besin', 'apple', 'Besinler', DA.data.foods.length + ' besin ve porsiyonlar') +
        tile('#/menu', 'menu', 'Menü planlayıcı', S.menus.length ? S.menus.length + ' menü · öğün öğün planla' : 'Öğün öğün planla, PDF yap') +
        tile('#/danisan', 'users', 'Danışanlar', S.clients.length ? S.clients.length + ' danışan · ölçüm, persentil' : 'Ölçüm, persentil, grafik', true) +
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

  DA.views.daha = (parts, q) => {
    if (parts[0] === 'kaynaknot' && DA.views._kaynakNot) return DA.views._kaynakNot(q);
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
        '<label class="fld"><span>İletişim satırı (yazdırma başlığında görünür)</span><input type="text" name="iletisim" value="' +
        esc((DA.state().profile || {}).iletisim || '') + '" placeholder="Klinik adı · telefon · e-posta"></label>' +
        '<button class="btn block" type="submit">Kaydet</button></form>' +
        '<p class="muted tiny" style="margin-bottom:0">Ana sayfada, menü PDF’lerinde ve paylaşılan planlarda görünür.</p></div>' +

        '<div class="list"><a class="li chev" href="#/staj"><span class="ic">' + icon('note') + '</span><span class="grow"><div class="t">Staj günlüğü</div></span></a>' +
        '<a class="li chev" href="#/kart"><span class="ic">' + icon('cards') + '</span><span class="grow"><div class="t">Çalışma kartları</div></span></a>' +
        '<a class="li chev" href="#/daha/sablon"><span class="ic">' + icon('table') + '</span><span class="grow"><div class="t">Numbers şablonları</div></span></a>' +
        '<a class="li chev" href="#/daha/kaynaknot"><span class="ic">' + icon('book') + '</span><span class="grow"><div class="t">Kaynak notları</div><div class="s">TÜBER 2022’de bulunan dizgi ve birim hataları</div></span></a></div>' +

        '<div class="sect">Yedek</div><div class="card"><p class="small muted" style="margin-top:0">Tüm verilerin (danışanlar, menüler, notlar, kartlar) yalnızca bu cihazda tutulur. Telefon değiştirirsen ya da tarayıcı verilerini temizlersen kaybolur — düzenli yedek al.</p>' +
        '<div class="res"><span class="l">Son yedek</span><span class="v" style="font-size:15px">' +
        (DA.state().ui.lastBackup ? esc(DA.fdate(DA.state().ui.lastBackup)) + '<span class="sub">' + DA.daysSinceBackup() + ' gün önce</span>' : 'Hiç alınmadı') + '</span></div>' +
        '<button class="btn block" data-act="backup">' + icon('save') + ' Yedeği indir / paylaş</button>' +
        '<button class="btn ghost block mt-s" data-act="backupSifreli">' + icon('save') + ' Şifreli yedek al</button>' +
        '<p class="muted tiny">Yedeği buluta (iCloud, Drive) ya da e-postaya koyacaksan şifreli al: ' +
        'danışan bilgileri parola olmadan okunamaz.</p>' +
        '<label class="btn ghost block mt-s" style="cursor:pointer">Yedeği yükle<input type="file" accept="application/json,.json" data-change="restore" hidden></label>' +
        '<button class="btn danger block mt-s" data-act="wipe">Tüm verileri sil</button></div>' +

        '<div class="sect">Depolama durumu</div>' +
        '<div class="card" id="depoDurum"><div class="empty">' + icon('save') + '<div>Okunuyor…</div></div></div>' +

        '<div class="sect">Hakkında</div><div class="card small muted">' +
        '<p style="margin-top:0"><b style="color:var(--ink)">' + esc(DA.APP) + '</b> — ücretsiz, reklamsız, çevrimdışı çalışır.</p>' +
        '<p>Hazırlayan: <b style="color:var(--ink)">' + esc(DA.dyt()) + '</b></p>' +
        '<p style="margin-bottom:0">Hesaplayıcılar yaygın kullanılan formüllere dayanır; besin değerleri yaklaşık ortalamalardır. Eğitim ve yardımcı araç amaçlıdır, bireysel tıbbi tavsiye yerine geçmez; klinik kararlar için güncel kılavuzlara ve kurum protokollerine bakın.</p></div>' +
        '<div class="brandline"><span class="r"></span><b>' + esc(DA.dyt()) + '</b></div>',
      mount() { depoCiz(); }
    };
  };

  /* ---- Depolama durumu paneli ---- */
  const mb = (n) => (n == null ? '—'
    : n < 1024 ? n + ' bayt'
    : n < 1048576 ? (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB'
    : (n / 1048576).toFixed(1) + ' MB');
  const saat = (ts) => { const d = new Date(ts); return isNaN(d) ? '—' :
    d.toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); };

  async function depoCiz() {
    const el = DA.$('#depoDurum');
    if (!el || !DA.depoDurum) return;
    const d = await DA.depoDurum();
    const S = DA.state();
    const kaliciRozet = d.kalici === true ? '<span class="badge ok">Kalıcı</span>'
      : d.kalici === false ? '<span class="badge warn">Kalıcı değil</span>'
      : '<span class="badge info">Bilinmiyor</span>';
    el.innerHTML =
      '<div class="res"><span class="l">Kalıcı depolama</span><span class="v" style="font-size:15px">' + kaliciRozet + '</span></div>' +
      (d.kalici === false
        ? '<p class="muted tiny">Tarayıcı, yer darlığında bu verileri silebilir. İzni yeniden istemeyi dene; ' +
          'uygulamayı ana ekrana eklemek izin alma ihtimalini artırır.</p>' +
          '<button class="btn ghost sm block" data-act="depoIste">Kalıcı depolama izni iste</button>' : '') +
      '<div class="res"><span class="l">Bu cihazdaki veri</span><span class="v" style="font-size:15px">' +
        S.clients.length + ' danışan<span class="sub">' + S.menus.length + ' menü · ' + S.journal.length +
        ' staj kaydı · ' + mb(d.ls) + '</span></span></div>' +
      (d.kullanim != null ? '<div class="res"><span class="l">Tarayıcı kullanımı</span><span class="v" style="font-size:15px">' +
        mb(d.kullanim) + '<span class="sub">ayrılan: ' + mb(d.kota) + '</span></span></div>' : '') +
      '<div class="sect">Anlık kopyalar</div>' +
      '<p class="muted tiny" style="margin-top:0">Uygulama, kaydettikçe cihazda ayrı bir depoda (IndexedDB) ' +
      'son ' + (d.anlik || 0) + ' anlık kopyayı tutar. Yanlış geri yükleme ya da bozulma durumunda buradan dönebilirsin. ' +
      '<b>Cihazı kaybedersen ya da site verilerini temizlersen bunlar da gider</b> — dosya yedeğinin yerini tutmaz.</p>' +
      (d.anlik
        ? '<div class="res"><span class="l">En yeni kopya</span><span class="v" style="font-size:15px">' +
          saat(d.sonAnlik.ts) + '<span class="sub">' + d.sonAnlik.ozet.danisan + ' danışan · ' +
          mb(d.sonAnlik.boyut) + '</span></span></div>' +
          '<button class="btn ghost block mt-s" data-act="depoAc">Kopyaları göster</button>'
        : '<p class="muted tiny">Henüz kopya alınmadı.</p>') +
      '<button class="btn ghost sm block mt-s" data-act="depoSimdi">Şimdi kopya al</button>';
  }

  DA.actions.depoIste = async () => {
    const ok = await DA.depoKaliciIste();
    DA.toast(ok === true ? 'Kalıcı depolama izni verildi' : ok === false ? 'Tarayıcı izin vermedi' : 'Bu tarayıcıda desteklenmiyor');
    depoCiz();
  };
  DA.actions.depoSimdi = async () => {
    const ok = await DA.depoAnlik(true);
    DA.toast(ok ? 'Anlık kopya alındı' : 'Kopya alınamadı');
    depoCiz();
  };
  DA.actions.depoAc = async () => {
    const liste = await DA.depoListe();
    if (!liste.length) return DA.toast('Kopya yok');
    DA.sheet('Anlık kopyalar',
      '<p class="muted small">Bir kopyaya dokunursan o andaki veriye dönersin. Şu anki veri önce ' +
      'yeni bir kopyaya alınır, yani bu işlem geri alınabilir.</p><div class="list">' +
      liste.map((x) =>
        '<button class="li" data-act="depoGeri" data-ts="' + x.ts + '"><span class="grow">' +
        '<div class="t">' + esc(saat(x.ts)) + '</div>' +
        '<div class="s">' + x.ozet.danisan + ' danışan · ' + x.ozet.menu + ' menü · ' +
        x.ozet.staj + ' staj · ' + mb(x.boyut) + '</div></span></button>').join('') +
      '</div><button class="btn ghost block mt-s" data-act="depoTemizle">Tüm kopyaları sil</button>');
  };
  DA.actions.depoGeri = async (el) => {
    const ts = +el.dataset.ts;
    const liste = await DA.depoListe();
    const k = liste.find((x) => x.ts === ts);
    if (!k) return DA.toast('Kopya bulunamadı');
    if (!confirm(saat(ts) + ' tarihli kopyaya dönülecek. Şu anki veri önce kopyaya alınır. Devam?')) return;
    await DA.depoAnlik(true);
    try { DA.replaceState(JSON.parse(k.json)); } catch (e) { return DA.toast('Kopya okunamadı'); }
    DA.closeSheet(); DA.render(); DA.toast('Geri yüklendi: ' + k.ozet.danisan + ' danışan');
  };
  DA.actions.depoTemizle = async () => {
    if (!confirm('Tüm anlık kopyalar silinecek. Dosya yedeğin varsa sorun yok. Devam?')) return;
    await DA.depoTemizle(); DA.closeSheet(); DA.render(true); DA.toast('Kopyalar silindi');
  };

  DA.live.theme = (el) => { DA.setTheme(el.value); DA.toast('Tema: ' + (DA.THEMES.find((t) => t[0] === el.value) || [, ''])[1]); };
  DA.forms.dyt = (f) => {
    const d = DA.formData(f);
    DA.state().profile.dyt = d.dyt.trim();
    DA.state().profile.iletisim = (d.iletisim || '').trim();
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

  /* Dosyayı paylaş ya da indir. iOS'ta paylaşım sayfasından "Dosyalara Kaydet"
     ile iCloud Drive'a atılabilir; cihaz dışı kopya böyle çıkar. */
  async function dosyaVer(metin, name, tip) {
    try {
      const file = new File([metin], name, { type: tip });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
        return true;
      }
    } catch (e) { if (e && e.name === 'AbortError') return false; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([metin], { type: tip }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    return true;
  }

  DA.actions.backupSifreli = () => {
    if (!DA.kriptoVar || !DA.kriptoVar()) return DA.toast('Bu tarayıcıda şifreleme desteklenmiyor');
    DA.sheet('Şifreli yedek',
      '<p class="small">Yedek dosyası parolayla şifrelenir. Dosya iCloud, Drive ya da e-postaya ' +
      'çıksa bile danışan bilgileri parola olmadan okunamaz.</p>' +
      '<form data-form="sifreliYedek" onsubmit="return false">' +
      '<label class="fld"><span>Parola</span><input type="password" name="p1" autocomplete="new-password" required></label>' +
      '<label class="fld"><span>Parola (tekrar)</span><input type="password" name="p2" autocomplete="new-password" required></label>' +
      '<button class="btn block" type="submit">' + icon('save') + ' Şifrele ve kaydet</button></form>' +
      '<div class="note bad" style="margin-bottom:0"><b>Parolayı kaybedersen yedek açılamaz.</b> ' +
      'Kurtarma yolu yoktur — parolayı güvenli bir yerde sakla.</div>');
  };

  DA.forms.sifreliYedek = async (f) => {
    const d = DA.formData(f);
    if (!d.p1) return DA.toast('Parola gerekli');
    if (d.p1 !== d.p2) return DA.toast('Parolalar aynı değil');
    if (d.p1.length < 8) return DA.toast('Parola en az 8 karakter olmalı');
    DA.toast('Şifreleniyor…');
    try {
      const zarf = await DA.sifrele(JSON.stringify(DA.state()), d.p1);
      const ad = 'diyet-asistani-yedek-' + DA.today() + '.sifreli.json';
      if (await dosyaVer(zarf, ad, 'application/json')) { DA.closeSheet(); markBackup(); }
    } catch (e) { DA.toast(e.message || 'Şifrelenemedi'); }
  };

  DA.actions.backup = async () => {
    const json = JSON.stringify(DA.state(), null, 1), name = 'diyet-asistani-yedek-' + DA.today() + '.json';
    try {
      const file = new File([json], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); markBackup(); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    markBackup();
  };
  /* ---- Yedek yükleme: önce içeriği göster, sonra üzerine yaz ya da birleştir ---- */
  let _yedek = null;
  const sayi = (o) => ({ danisan: (o.clients || []).length, menu: (o.menus || []).length,
    staj: (o.journal || []).length, besin: (o.customFoods || []).length });

  /* Şifreli dosya geldiğinde metin burada bekletilir, parola alınınca çözülür. */
  let _sifreliMetin = '', _sifreliAd = '';

  DA.forms.yedekCoz = async (f) => {
    const d = DA.formData(f);
    if (!d.p) return DA.toast('Parola gerekli');
    DA.toast('Çözülüyor…');
    try {
      const duz = await DA.coz(_sifreliMetin, d.p);
      DA.closeSheet();
      yedekGoster(duz, _sifreliAd.replace(/\.sifreli\.json$/, '') + ' (şifreli)');
      _sifreliMetin = '';
    } catch (e) { DA.toast(e.message || 'Çözülemedi'); }
  };

  DA.live.restore = (el) => {
    const f = el.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      if (DA.sifreliMi && DA.sifreliMi(r.result)) {
        _sifreliMetin = r.result; _sifreliAd = f.name;
        DA.sheet('Şifreli yedek',
          '<p class="muted small">' + esc(f.name) + '</p>' +
          '<p class="small">Bu dosya şifreli. Açmak için yedeği alırken kullandığın parolayı gir.</p>' +
          '<form data-form="yedekCoz" onsubmit="return false">' +
          '<label class="fld"><span>Parola</span><input type="password" name="p" autocomplete="current-password" required></label>' +
          '<button class="btn block" type="submit">Çöz ve göster</button></form>');
        return;
      }
      yedekGoster(r.result, f.name);
    };
    r.readAsText(f); el.value = '';
  };

  /* Düz metin yedeği özetleyip birleştir/üzerine yaz seçeneklerini sunar. */
  function yedekGoster(metin, ad) {
    {
      try {
        const o = JSON.parse(metin);
        if (!o || typeof o !== 'object' || !Array.isArray(o.clients)) throw new Error('bad');
        _yedek = o;
        const y = sayi(o), m = sayi(DA.state());
        const sat = (l, a, b) => '<tr><td>' + l + '</td><td class="n">' + a + '</td><td class="n muted">' + b + '</td></tr>';
        DA.sheet('Yedek dosyası', '<p class="muted small">' + esc(ad) + '</p>' +
          '<table class="t"><thead><tr><th></th><th class="n">Dosyada</th><th class="n">Şu an</th></tr></thead><tbody>' +
          sat('Danışan', y.danisan, m.danisan) + sat('Menü', y.menu, m.menu) +
          sat('Staj kaydı', y.staj, m.staj) + sat('Eklenen besin', y.besin, m.besin) +
          '</tbody></table>' +
          (o.lastBackup ? '<p class="muted tiny">Yedek tarihi: ' + esc(DA.fdate(String(o.lastBackup).slice(0, 10))) + '</p>' : '') +
          '<button class="btn block" data-act="restoreMerge">' + icon('plus') + ' Birleştir (mevcut kayıtlar korunur)</button>' +
          '<button class="btn danger block mt-s" data-act="restoreReplace">Üzerine yaz (mevcut veriler silinir)</button>' +
          '<p class="muted tiny" style="margin-bottom:0">Birleştirmede aynı kimlikli kayıtlar atlanır; iki cihaz kullanıyorsan bunu seç.</p>');
      } catch (e) { DA.toast('Geçersiz yedek dosyası'); }
    }
  }

  DA.actions.restoreReplace = () => {
    if (!_yedek) return;
    if (!confirm('Mevcut veriler bu yedekle DEĞİŞTİRİLECEK. Devam edilsin mi?')) return;
    DA.replaceState(_yedek); _yedek = null; DA.closeSheet(); DA.toast('Yedek yüklendi'); DA.render(false);
  };

  DA.actions.restoreMerge = () => {
    if (!_yedek) return;
    const S = DA.state(), o = _yedek, ekle = { danisan: 0, menu: 0, staj: 0, besin: 0 };
    const birlestir = (alan, ad) => {
      const mevcut = S[alan] || (S[alan] = []);
      const idx = {}; mevcut.forEach((x) => { idx[x.id] = 1; });
      (o[alan] || []).forEach((x) => { if (x && x.id && !idx[x.id]) { mevcut.push(x); ekle[ad]++; } });
    };
    birlestir('clients', 'danisan'); birlestir('menus', 'menu');
    birlestir('journal', 'staj'); birlestir('customFoods', 'besin');
    DA.save(); _yedek = null; DA.closeSheet();
    DA.toast('Eklendi: ' + ekle.danisan + ' danışan, ' + ekle.menu + ' menü, ' + ekle.staj + ' staj, ' + ekle.besin + ' besin');
    if (DA.foodsInvalidate) DA.foodsInvalidate();
    DA.render(false);
  };
  DA.actions.wipe = () => {
    if (!confirm('Tüm veriler kalıcı olarak silinecek. Emin misin?')) return;
    DA.replaceState({}); DA.toast('Tüm veriler silindi'); DA.render(false);
  };
})();
