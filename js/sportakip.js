/* Sporcu takibi — danışan dosyasında üç izlem:
     1) Vücut kompozisyonu: yağsız kütle, yağ % ve Σ deri kıvrımı zamanla.
        Kaynağı ölçümler: yağ % ve Σ kıvrım ölçüm formundan ya da deri
        kıvrımı aracından ("Danışanın bugünkü ölçümüne işle"). Yağsız kütle =
        kilo × (1 − yağ/100); kilo ve yağ % aynı ölçümde olmalı.
     2) Haftalık karbonhidrat planı: "Antrenman gününe göre karbonhidrat"
        aracından kaydedilir (müsabaka takvimi dahil); dosyada tablo, çıktıda
        A4. Plan her açılışta kayıtlı girdilerden yeniden hesaplanır: kaynak
        veride düzeltme olursa eski sayı dosyada donup kalmaz.
     3) RED-S izlemi: tarih tarih gözlenen belirtiler. Liste IOC 2023 REDs
        uzlaşı bildirisinin sağlık ve performans sonuçlarından (Mountjoy ve
        ark., Br J Sports Med 2023). Puan vermez, tanı koymaz: REDs klinik
        tanıdır, IOC REDs CAT2 ile değerlendirilir. Kayıtlar arasında yeni
        çıkan ve kaybolan belirti yazılır.
   Kart, "Sporcu" etiketli ya da bu verilerden birine sahip danışanda çıkar. */
(function () {
  'use strict';
  const { esc, fmt, uid } = DA;
  const clients = () => DA.state().clients || [];
  const bul = (id) => clients().find((c) => c.id === id) || null;

  const REDS = [
    ['ureme', 'Üreme işlevi', 'Adet düzensizliği ya da adet görmeme; erkekte libido azalması'],
    ['kemik', 'Kemik sağlığı', 'Stres kırığı ya da düşük kemik mineral yoğunluğu'],
    ['sindirim', 'Sindirim', 'Sindirim sistemi yakınmaları'],
    ['bagisiklik', 'Bağışıklık', 'Sık hastalanma, enfeksiyon'],
    ['uyku', 'Uyku', 'Uyku bozukluğu'],
    ['bilis', 'Bilişsel', 'Bellek, karar verme, dikkat sorunları'],
    ['ruh', 'Ruh hâli', 'Depresif duygudurum, kaygı, sinirlilik'],
    ['yeme', 'Yeme ve egzersiz', 'Düzensiz yeme davranışı ya da egzersiz bağımlılığı'],
    ['kalp', 'Kalp ve dolaşım', 'Kalp ritmi ya da dolaşım sorunu (ör. düşük nabız, baş dönmesi)'],
    ['buyume', 'Büyüme', 'Genç sporcuda büyüme ve gelişmede gerileme'],
    ['idrar', 'İdrar kaçırma', 'İdrar kaçırma'],
    ['yanit', 'Antrenmana yanıt', 'Antrenmana yanıtta azalma'],
    ['toparlanma', 'Toparlanma', 'Antrenman ve müsabakadan toparlanmanın uzaması'],
    ['kas', 'Kas işlevi', 'Kas gücü ve dayanıklılıkta azalma'],
    ['koordinasyon', 'Koordinasyon', 'Koordinasyon azalması, tepki süresinin uzaması'],
    ['kayip', 'Antrenman kaybı', 'Sakatlık ya da hastalık nedeniyle antrenman ve müsabaka kaybı']
  ];
  const ad = (k) => { const x = REDS.find((r) => r[0] === k); return x ? x[1] : k; };

  /* ---- 1) vücut kompozisyonu ---- */
  const zaman = (d) => new Date(d + 'T00:00').getTime();
  function kompozisyon(c) {
    const m = DA.tarihSirali(c.meas);
    const lbm = m.filter((x) => x.w > 0 && x.fat > 0).map((x) => ({ t: zaman(x.d), y: x.w * (1 - x.fat / 100) }));
    const yag = m.filter((x) => x.fat > 0).map((x) => ({ t: zaman(x.d), y: x.fat }));
    const kiv = m.filter((x) => x.kiv > 0);
    const yontem = kiv.map((x) => x.kivY || '').filter((x, i, a) => a.indexOf(x) === i);
    if (!lbm.length && !yag.length && !kiv.length) {
      return '<div class="card"><h2>Vücut kompozisyonu</h2>' + DA.emptyState('tape', { baslik: 'Kompozisyon ölçümü yok',
        aciklama: 'Deri kıvrımı aracını bu danışandan açıp sonucu ölçüme işle ya da ölçüme yağ % ve Σ deri kıvrımı gir.',
        eylem: { href: '#/hesapla/derikivrim?c=' + encodeURIComponent(c.id), etiket: 'Deri kıvrımı ölç', ico: 'tape' } }) + '</div>';
    }
    const son = m.slice().reverse();
    const sonLbm = son.find((x) => x.w > 0 && x.fat > 0), sonKiv = son.find((x) => x.kiv > 0);
    const ozet = [sonLbm ? 'yağsız kütle ' + fmt(sonLbm.w * (1 - sonLbm.fat / 100), 1) + ' kg' : '', sonLbm ? 'yağ %' + fmt(sonLbm.fat, 1) : '',
      sonKiv ? 'Σ kıvrım ' + fmt(sonKiv.kiv, 1) + ' mm' + (sonKiv.kivY ? ' (' + sonKiv.kivY + ')' : '') : ''].filter(Boolean).join(' · ');
    const grafik = (baslik, pts, birim) => '<div class="sect">' + esc(baslik) + '</div>' + DA.chartSvg(pts, birim);
    return '<div class="card" id="sporKomp"><h2>Vücut kompozisyonu</h2>' +
      (ozet ? '<p class="small muted">Son: ' + esc(ozet) + '</p>' : '') +
      grafik('Yağsız kütle (kg)', lbm, 'kg') + grafik('Yağ (%)', yag, '%') +
      grafik('Σ deri kıvrımı (mm)', kiv.map((x) => ({ t: zaman(x.d), y: x.kiv })), 'mm') +
      /* Farklı yöntemin bölge toplamları aynı ölçek değildir: JP3 üç, DW dört
         bölgeyi toplar; grafik bunu karıştırırsa yanıltır. */
      (yontem.length > 1 ? '<div class="note warn small">Σ kıvrım farklı yöntemlerle ölçülmüş (' + esc(yontem.filter(Boolean).join(', ') || 'yöntem yazılmamış') +
        '): bölge sayısı farklı toplamlar karşılaştırılmaz.</div>' : '') +
      '<a class="btn ghost block mt-s" href="#/hesapla/derikivrim?c=' + encodeURIComponent(c.id) + '">' + DA.icon('tape') + ' Yeni deri kıvrımı ölçümü</a></div>';
  }
  /* Deri kıvrımı aracından: bugünkü ölçüm varsa ona, yoksa yeni ölçüme */
  DA.actions.kivIsle = () => {
    const c = bul(DA.hesapDanisan && DA.hesapDanisan()), k = DA.calcs.find((x) => x.id === 'derikivrim'), s = k && k._son;
    if (!c || !s) return DA.toast('Önce bir yöntemin bütün bölgelerini gir');
    c.meas = c.meas || [];
    const bugun = DA.today(), yuv = (x) => Math.round(x * 10) / 10;
    let m = c.meas.find((x) => x.d === bugun);
    if (!m) { m = { id: uid(), d: bugun, w: null, fat: null, waist: null, hip: null, h: null, note: '' }; c.meas.push(m); }
    m.fat = yuv(s.y); m.kiv = yuv(s.s); m.kivY = s.l;
    if (s.w && !m.w) m.w = s.w;
    DA.save();
    DA.toast(c.name + ': bugünkü ölçüme yağ %' + fmt(m.fat, 1) + ' ve Σ ' + fmt(m.kiv, 1) + ' mm işlendi');
  };

  /* ---- 2) haftalık karbonhidrat planı ---- */
  const khHesap = () => DA.calcs.find((x) => x.id === 'sporkh');
  function planSatirlari(c) {
    const k = khHesap(); if (!k || !c.sporKh || !DA.hazir(['sporperf'])) return null;
    const r = k.run.call({}, Object.assign({}, c.sporKh.v));
    return r && !r.err ? r.rows : null;
  }
  function khKart(c) {
    const link = '#/hesapla/sporkh?c=' + encodeURIComponent(c.id);
    if (!c.sporKh) {
      return '<div class="card"><h2>Haftalık karbonhidrat planı</h2>' + DA.emptyState('run', { baslik: 'Kayıtlı plan yok',
        aciklama: 'Antrenman gününe göre karbonhidrat aracını bu danışandan aç; günleri ve müsabakayı seçip "Danışana haftalık plan olarak kaydet".',
        eylem: { href: link, etiket: 'Plan yap', ico: 'run' } }) + '</div>';
    }
    if (!DA.hazir(['sporperf'])) {
      DA.need(['sporperf']).then(() => DA.render(true), () => {});
      return '<div class="card"><h2>Haftalık karbonhidrat planı</h2>' + DA.iskelet('liste', 'Plan hazırlanıyor') + '</div>';
    }
    const rows = planSatirlari(c) || [];
    return '<div class="card" id="sporKh"><h2>Haftalık karbonhidrat planı</h2><p class="small muted">' + esc(DA.fdate(c.sporKh.d)) +
      ' · ' + fmt(c.sporKh.v.w, 1) + ' kg</p><div class="list">' +
      rows.map((x) => '<div class="li"><span class="grow"><div class="t">' + esc(x.l) + '</div><div class="s">' + esc(x.s || '') + '</div></span>' +
        '<span class="end">' + esc(x.v) + '</span></div>').join('') + '</div>' +
      '<div class="grid2 mt-s"><a class="btn block" href="#/yazdir/sporkh/' + esc(c.id) + '">' + DA.icon('share') + ' PDF / Yazdır</a>' +
      '<a class="btn ghost block" href="' + link + '">Yeni plan</a></div></div>';
  }
  DA.actions.sporKhKaydet = () => {
    const c = bul(DA.hesapDanisan && DA.hesapDanisan()), k = khHesap(), v = k && k._son;
    if (!c || !v || !(v.w > 0)) return DA.toast('Önce kiloyu ve günleri gir');
    const eski = c.sporKh;
    c.sporKh = { d: DA.today(), v: Object.assign({}, v) };
    DA.save();
    DA.silGeriAl(c.name + ' dosyasına haftalık plan kaydedildi', () => { if (eski) c.sporKh = eski; else delete c.sporKh; });
  };
  DA.views._printSporKh = (parts) => {
    const c = bul(parts[0]);
    if (!c || !c.sporKh) return { title: 'Yazdır', back: 'danisan', html: '<div class="card">Kayıtlı plan bulunamadı.</div>' };
    const rows = planSatirlari(c) || [];
    const gun = rows.filter((x) => / · /.test(x.l) && !/^Haftalık|^Protein/.test(x.l));
    const diger = rows.filter((x) => gun.indexOf(x) < 0);
    return {
      title: 'Haftalık plan çıktısı', tab: 'danisan', back: 'danisan/' + c.id, noRecent: true,
      html: '<div class="noprint mb"><button class="btn block" data-act="doPrint">PDF olarak kaydet / yazdır</button></div>' +
        '<div class="printdoc">' + DA.antet() + '<h2>Haftalık karbonhidrat planı</h2>' +
        '<div class="alt">' + esc(c.name) + ' · ' + esc(DA.fdate(c.sporKh.d)) + ' · ' + fmt(c.sporKh.v.w, 1) + ' kg</div>' +
        '<table class="sporkh-tablo"><thead><tr><th>Gün</th><th>Yük</th><th class="n">Karbonhidrat</th><th>Not</th></tr></thead><tbody>' +
        gun.map((x) => { const p = x.l.split(' · '); return '<tr><td>' + esc(p[0]) + '</td><td>' + esc(p.slice(1).join(' · ')) + '</td><td class="n">' +
          esc(x.v) + '</td><td>' + esc(x.s || '') + '</td></tr>'; }).join('') + '</tbody></table>' +
        diger.map((x) => '<div class="sat"><b>' + esc(x.l) + ':</b> ' + esc(x.v) + (x.s ? ' — ' + esc(x.s) : '') + '</div>').join('') +
        DA.dipnot('Thomas, Erdman, Burke 2016 (ACSM/AND/DC) Tablo 1–2; bantlar başlangıç noktasıdır.') + '</div>'
    };
  };

  /* ---- 3) RED-S izlemi ---- */
  function redsKart(c) {
    const L = DA.tarihSirali(c.reds);
    const satir = (x, i) => {
      const once = L[i - 1], b = x.b || [];
      const yeni = once ? b.filter((k) => (once.b || []).indexOf(k) < 0) : [];
      const gecti = once ? (once.b || []).filter((k) => b.indexOf(k) < 0) : [];
      return '<button class="li" data-act="redsAc" data-id="' + esc(c.id) + '" data-rid="' + esc(x.id) + '"><span class="grow"><div class="t">' +
        esc(DA.fdate(x.d)) + ' · ' + (b.length ? b.length + ' belirti' : 'belirti yok') + '</div><div class="s">' + esc(b.map(ad).join(', ')) +
        (yeni.length || gecti.length ? '<br>' + (yeni.length ? 'yeni: ' + esc(yeni.map(ad).join(', ')) : '') +
          (yeni.length && gecti.length ? ' · ' : '') + (gecti.length ? 'geçti: ' + esc(gecti.map(ad).join(', ')) : '') : '') +
        (x.not ? '<br>' + esc(x.not) : '') + '</div></span></button>';
    };
    return '<div class="card" id="sporReds"><h2>RED-S izlemi</h2>' +
      (L.length ? '<div class="list">' + L.map(satir).reverse().join('') + '</div>'
        : '<p class="small muted">Henüz kayıt yok. Her görüşmede gözlenen belirtileri işaretle; kayıtlar arasında yeni çıkan ve geçen belirti görünür.</p>') +
      '<button class="btn sec block mt-s" data-act="redsAc" data-id="' + esc(c.id) + '">' + DA.icon('plus') + ' Belirti kaydı ekle</button>' +
      '<p class="tiny muted mt-s" style="margin-bottom:0">Belirtiler IOC 2023 REDs uzlaşı bildirisinin sağlık ve performans sonuçlarından. ' +
      'Liste puan vermez, tanı koymaz: REDs klinik tanıdır (IOC REDs CAT2).</p></div>';
  }
  function redsForm(c, x) {
    x = x || {};
    return '<form data-form="reds" data-id="' + esc(c.id) + '" data-rid="' + esc(x.id || '') + '">' +
      '<label class="fld"><span>Tarih</span><input type="date" name="d" value="' + esc(x.d || DA.today()) + '" required></label>' +
      '<div class="fld"><span>Gözlenen belirtiler</span><div class="chips wrap">' + REDS.map((r) =>
        '<label class="chip tag" title="' + esc(r[2]) + '"><input type="checkbox" name="b_' + r[0] + '"' + ((x.b || []).indexOf(r[0]) >= 0 ? ' checked' : '') + '>' +
        esc(r[1]) + '</label>').join('') + '</div></div>' +
      '<details class="acc"><summary>Belirtilerin açıklaması</summary><div class="body small">' + REDS.map((r) => '<b>' + esc(r[1]) + ':</b> ' + esc(r[2])).join('<br>') + '</div></details>' +
      '<label class="fld"><span>Not</span><input type="text" name="not" value="' + esc(x.not || '') + '" placeholder="ör. son adet tarihi, kan tahlili"></label>' +
      '<button class="btn block">Kaydet</button>' +
      (x.id ? '<button type="button" class="btn danger block mt-s" data-act="redsSil" data-id="' + esc(c.id) + '" data-rid="' + esc(x.id) + '">Kaydı sil</button>' : '') + '</form>';
  }
  DA.actions.redsAc = (el) => {
    const c = bul(el.dataset.id); if (!c) return;
    const x = el.dataset.rid ? (c.reds || []).find((r) => r.id === el.dataset.rid) : null;
    DA.sheet(x ? 'RED-S kaydı' : 'RED-S belirti kaydı', redsForm(c, x));
  };
  DA.forms.reds = (f) => {
    const c = bul(f.dataset.id); if (!c) return;
    const b = REDS.filter((r) => f['b_' + r[0]] && f['b_' + r[0]].checked).map((r) => r[0]);
    const not = (f.not.value || '').trim();
    if (!b.length && !not) return DA.toast('Bir belirti işaretle ya da not yaz');
    c.reds = c.reds || [];
    const rec = { d: f.d.value || DA.today(), b, not };
    const x = f.dataset.rid ? c.reds.find((r) => r.id === f.dataset.rid) : null;
    if (x) Object.assign(x, rec); else c.reds.push(Object.assign({ id: uid() }, rec));
    DA.save(); DA.closeSheet(); DA.render(true);
  };
  DA.actions.redsSil = (el) => {
    const c = bul(el.dataset.id); if (!c) return;
    const i = (c.reds || []).findIndex((r) => r.id === el.dataset.rid); if (i < 0) return;
    const silinen = c.reds.splice(i, 1)[0];
    DA.save(); DA.closeSheet(); DA.render(true);
    DA.silGeriAl(DA.fdate(silinen.d) + ' RED-S kaydı silindi', () => { c.reds.splice(i, 0, silinen); });
  };

  /* Danışan dosyasına giren kart */
  function kart(c) {
    const var_ = (c.tags || []).indexOf('sporcu') >= 0 || c.sporKh || (c.reds || []).length || (c.meas || []).some((m) => m.kiv > 0);
    if (!var_) return '';
    return '<div class="sect">Sporcu takibi</div>' + kompozisyon(c) + khKart(c) + redsKart(c);
  }
  DA.sporTakip = { kart, REDS };
})();
