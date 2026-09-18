/* Ana sayfa, Daha (ayarlar, yedek, şablonlar) */
(function () {
  'use strict';
  const { esc, icon } = DA;

  const standalone = () => window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function tile(href, ico, t, d) { return '<a class="tile" href="' + href + '"><span class="ic">' + icon(ico) + '</span><b>' + t + '</b><span class="d">' + d + '</span></a>'; }

  DA.views.ana = () => {
    const due = DA.dueCount ? DA.dueCount() : 0, S = DA.state();
    const hint = (!standalone() && !S.ui.hideInstall) ?
      '<div class="note ok"><b>Uygulama gibi kullan:</b> ' + (isIOS() ? 'Safari’de <b>Paylaş</b> simgesine dokun → <b>Ana Ekrana Ekle</b>. Sonra ana ekrandaki simgeden tek dokunuşla açılır.' : 'Tarayıcı menüsünden “Ana ekrana ekle / Uygulamayı yükle” seç.') +
      '<button class="btn sm ghost block" style="margin-top:10px" data-act="hideInstall">Tamam, gizle</button></div>' : '';
    return {
      title: 'Diyet Asistanı', tab: 'ana',
      html: hint +
        '<div class="tiles">' +
        tile('#/hesapla', 'calc', 'Hesaplayıcılar', 'BKİ, enerji, ideal kilo, sıvı…') +
        tile('#/besin', 'apple', 'Besinler', DA.data.foods.length + ' besin, porsiyon ve değerler') +
        tile('#/menu', 'menu', 'Menü planlayıcı', 'Öğün öğün planla, PDF yap') +
        tile('#/danisan', 'users', 'Danışanlar', 'Ölçümler, grafik, notlar') +
        tile('#/referans', 'book', 'Klinik referans', 'Lab değerleri, hastalık notları') +
        tile('#/kart', 'cards', 'Çalışma kartları', due ? due + ' kart bugün seni bekliyor' : 'Sınav ve staj için tekrar') +
        tile('#/staj', 'note', 'Staj günlüğü', 'Vaka notları ve saatler') +
        tile('#/daha/sablon', 'table', 'Numbers şablonları', 'iPhone Numbers için tablolar') +
        '</div><p class="muted tiny center mt">Verilerin yalnızca bu cihazda saklanır. Yedek almayı unutma: Ayarlar → Yedek.</p>'
    };
  };
  DA.actions.hideInstall = () => { DA.state().ui.hideInstall = true; DA.save(); DA.render(true); };

  DA.views.daha = (parts) => {
    if (parts[0] === 'sablon') return {
      title: 'Numbers şablonları', back: 'daha',
      html: '<div class="card"><h2>Diyetisyen şablonları (.xlsx)</h2><p class="small muted">Beş sayfalık tek dosya: danışan takip çizelgesi, haftalık menü, 3 günlük besin tüketim kaydı, staj saat çizelgesi, enerji hesaplama. Formüller hazır.</p>' +
        '<a class="btn block" href="sablonlar/Diyet-Asistani-Sablonlar.xlsx" download>' + icon('save') + ' Şablonları indir</a>' +
        '<div class="note mt"><b>iPhone’da:</b> indirilen dosyaya dokun → <b>Paylaş</b> → <b>Numbers</b>’ı seç. Numbers .xlsx dosyalarını açar; iCloud’a kaydedersen tüm cihazlarında görünür.</div></div>'
    };
    return {
      title: 'Ayarlar', tab: 'ana', back: 'ana',
      html: '<div class="list"><a class="li chev" href="#/staj"><span class="ic">' + icon('note') + '</span><span class="grow"><div class="t">Staj günlüğü</div></span></a>' +
        '<a class="li chev" href="#/kart"><span class="ic">' + icon('cards') + '</span><span class="grow"><div class="t">Çalışma kartları</div></span></a>' +
        '<a class="li chev" href="#/daha/sablon"><span class="ic">' + icon('table') + '</span><span class="grow"><div class="t">Numbers şablonları</div></span></a></div>' +
        '<div class="sect">Yedek</div><div class="card"><p class="small muted" style="margin-top:0">Tüm verilerin (danışanlar, menüler, notlar, kartlar) yalnızca bu cihazda tutulur. Telefon değiştirirsen ya da tarayıcı verilerini temizlersen kaybolur — düzenli yedek al.</p>' +
        '<button class="btn block" data-act="backup">' + icon('save') + ' Yedeği indir / paylaş</button>' +
        '<label class="btn ghost block mt-s" style="cursor:pointer">Yedeği yükle<input type="file" accept="application/json,.json" data-change="restore" hidden></label>' +
        '<button class="btn danger block mt-s" data-act="wipe">Tüm verileri sil</button></div>' +
        '<div class="sect">Hakkında</div><div class="card small muted">Diyet Asistanı — ücretsiz ve reklamsız. Hesaplayıcılar yaygın kullanılan formüllere dayanır; besin değerleri yaklaşık ortalamalardır. Eğitim ve yardımcı araç amaçlıdır, bireysel tıbbi tavsiye yerine geçmez; klinik kararlar için güncel kılavuzlara ve kurum protokollerine bakın.</div>'
    };
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
