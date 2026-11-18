/* İlerleme kartı — danışana WhatsApp'tan gönderilecek tek görsel.
   Kilo grafiği, başlangıç → son kilo, değişim ve hedefe kalan. Neden görsel:
   danışan PDF raporu açmıyor; telefonda tek bakışta görülen bir resim
   paylaşılıyor. Görsel tuvalde (canvas) çizilir, Web Share API ile
   paylaşılır (iPhone'da paylaşım sayfasında WhatsApp çıkar); paylaşım yoksa
   PNG indirilir. Ağa hiçbir şey gitmez.
   Ad varsayılan olarak yazılmaz: görsel cihazdan çıkıp başka uygulamaya
   gidiyor (KVKK); istenirse yalnız ilk ad eklenir. 1080 × 1350 (4:5):
   sohbet önizlemesinde kırpılmadan görünen dikey oran. Renkler uygulamanın
   koyu temasından (CLAUDE.md paleti); metin beyaz/açık gri, kontrast AA. */
(function () {
  'use strict';
  const { esc, fmt } = DA;
  const W = 1080, H = 1350;
  const RENK = { zemin1: '#0A0807', zemin2: '#17110E', kart: '#211914', vurgu: '#FF6B25', vurgu2: '#FF8A36', metin: '#FFFFFF', soluk: '#A8A09B', izgara: '#3A2E27' };
  const bul = (id) => (DA.state().clients || []).find((c) => c.id === id) || null;
  const U = () => { const ui = DA.state().ui; return (ui.ilerleme = ui.ilerleme && typeof ui.ilerleme === 'object' ? ui.ilerleme : {}); };
  const kisaTarih = (d) => new Date(d + 'T00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

  /* Kartın sayıları: çizimden ayrı, test edilebilsin */
  function ozet(c) {
    const m = DA.tarihSirali(c.meas).filter((x) => x.w > 0);
    if (m.length < 2) return null;
    const ilk = m[0], son = m[m.length - 1], fark = son.w - ilk.w, h = c.hedef > 0 ? c.hedef : null;
    let ilerleme = null;
    if (h != null && h !== ilk.w) {
      /* Hedefe doğru alınan yolun oranı; ters yöne gidildiyse 0, aşıldıysa 1 */
      ilerleme = Math.max(0, Math.min(1, (son.w - ilk.w) / (h - ilk.w)));
    }
    return { m, ilk, son, fark, hedef: h, kalan: h != null ? Math.abs(son.w - h) : null, ilerleme };
  }

  /* Tuvale çizer; çizilen metinleri de döndürür (testte ad gizliliği ve sayılar) */
  function ciz(c, ayar) {
    const o = ozet(c); if (!o) return null;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d'), metinler = [];
    const yaz = (t, px, py, boyut, renk, hiza, kalin) => {
      x.font = (kalin ? '700 ' : '500 ') + boyut + 'px -apple-system, "SF Pro Rounded", system-ui, "Segoe UI", Roboto, sans-serif';
      x.fillStyle = renk; x.textAlign = hiza || 'left'; x.textBaseline = 'alphabetic'; x.fillText(t, px, py); metinler.push(t);
    };
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, RENK.zemin2); g.addColorStop(1, RENK.zemin1);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const kutu = (kx, ky, kw, kh, r) => { x.beginPath(); x.moveTo(kx + r, ky); x.arcTo(kx + kw, ky, kx + kw, ky + kh, r); x.arcTo(kx + kw, ky + kh, kx, ky + kh, r);
      x.arcTo(kx, ky + kh, kx, ky, r); x.arcTo(kx, ky, kx + kw, ky, r); x.closePath(); };

    yaz('İLERLEME', 80, 130, 34, RENK.vurgu, 'left', true);
    const ad = ayar.ad ? String(c.name || '').trim().split(/\s+/)[0] : '';
    yaz(ad || 'Kilo takibi', 80, 215, 72, RENK.metin, 'left', true);
    yaz(kisaTarih(o.ilk.d) + ' – ' + kisaTarih(o.son.d), 80, 270, 32, RENK.soluk);

    /* Büyük değişim sayısı */
    const isaret = o.fark > 0 ? '+' : o.fark < 0 ? '−' : '';
    yaz(isaret + fmt(Math.abs(o.fark), 1) + ' kg', 80, 430, 128, RENK.vurgu2, 'left', true);
    yaz(fmt(o.ilk.w, 1) + ' kg → ' + fmt(o.son.w, 1) + ' kg', 80, 490, 36, RENK.metin);
    if (o.hedef != null) {
      yaz('Hedef ' + fmt(o.hedef, 1) + ' kg', W - 80, 380, 36, RENK.metin, 'right', true);
      yaz(o.kalan < 0.05 ? 'hedefe ulaşıldı' : 'kalan ' + fmt(o.kalan, 1) + ' kg', W - 80, 430, 32, RENK.soluk, 'right');
      /* ilerleme çubuğu */
      kutu(80, 530, W - 160, 22, 11); x.fillStyle = RENK.kart; x.fill();
      if (o.ilerleme > 0) { kutu(80, 530, Math.max(22, (W - 160) * o.ilerleme), 22, 11); x.fillStyle = RENK.vurgu; x.fill(); }
      yaz('%' + fmt(o.ilerleme * 100, 0) + ' yol alındı', 80, 600, 30, RENK.soluk);
    }

    /* Grafik */
    const gx0 = 150, gx1 = W - 80, gy0 = 680, gy1 = 1150;
    kutu(60, 640, W - 120, 560, 32); x.fillStyle = RENK.kart; x.fill();
    const ys = o.m.map((p) => p.w).concat(o.hedef != null ? [o.hedef] : []);
    const lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys), pad = Math.max((hi - lo) * 0.15, 0.5);
    const y0 = lo - pad, y1 = hi + pad, t0 = new Date(o.ilk.d + 'T00:00').getTime(), t1 = new Date(o.son.d + 'T00:00').getTime();
    const X = (t) => gx0 + (t1 === t0 ? 0 : (t - t0) / (t1 - t0)) * (gx1 - gx0), Y = (v) => gy0 + (1 - (v - y0) / (y1 - y0)) * (gy1 - gy0);
    x.strokeStyle = RENK.izgara; x.lineWidth = 2;
    for (let i = 0; i <= 3; i++) {
      const v = y0 + (y1 - y0) * i / 3, yy = Y(v);
      x.beginPath(); x.moveTo(gx0, yy); x.lineTo(gx1, yy); x.stroke();
      yaz(fmt(v, 1), gx0 - 16, yy + 10, 26, RENK.soluk, 'right');
    }
    if (o.hedef != null) {
      x.setLineDash([16, 12]); x.strokeStyle = RENK.soluk; x.lineWidth = 3;
      x.beginPath(); x.moveTo(gx0, Y(o.hedef)); x.lineTo(gx1, Y(o.hedef)); x.stroke(); x.setLineDash([]);
    }
    x.strokeStyle = RENK.vurgu; x.lineWidth = 8; x.lineJoin = 'round'; x.lineCap = 'round';
    x.beginPath();
    o.m.forEach((p, i) => { const px = X(new Date(p.d + 'T00:00').getTime()), py = Y(p.w); if (i) x.lineTo(px, py); else x.moveTo(px, py); });
    x.stroke();
    x.fillStyle = RENK.vurgu2;
    o.m.forEach((p) => { x.beginPath(); x.arc(X(new Date(p.d + 'T00:00').getTime()), Y(p.w), 11, 0, Math.PI * 2); x.fill(); });
    const kisa = (d) => new Date(d + 'T00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    yaz(kisa(o.ilk.d), gx0, gy1 + 40, 26, RENK.soluk, 'left');
    yaz(kisa(o.son.d), gx1, gy1 + 40, 26, RENK.soluk, 'right');

    yaz(DA.dyt(), 80, H - 70, 32, RENK.metin, 'left', true);
    yaz(o.m.length + ' ölçüm', W - 80, H - 70, 28, RENK.soluk, 'right');
    return { cv, metinler, o, grafik: { X, Y, ilk: o.ilk, son: o.son } };
  }

  DA.views.ilerleme = (parts) => {
    const c = bul(parts[0]);
    if (!c) return { title: 'İlerleme kartı', back: 'danisan', tab: 'danisan', html: '<div class="card">Danışan bulunamadı.</div>' };
    const u = U(), r = ciz(c, u);
    if (!r) {
      return { title: 'İlerleme kartı', back: 'danisan/' + c.id, tab: 'danisan', noRecent: true,
        html: DA.emptyState('trend', { baslik: 'En az iki kilo ölçümü gerekli',
          aciklama: 'Kartta başlangıç ve son kilo, değişim ve grafik yer alır; ikinci ölçümden sonra hazırlanır.',
          eylem: { act: 'measNew', veri: 'data-id="' + esc(c.id) + '"', etiket: 'Ölçüm ekle', ico: 'plus' } }) };
    }
    const etiket = 'İlerleme kartı: ' + (r.o.fark > 0 ? '+' : r.o.fark < 0 ? '−' : '') + fmt(Math.abs(r.o.fark), 1) + ' kg, ' +
      fmt(r.o.ilk.w, 1) + ' kg’dan ' + fmt(r.o.son.w, 1) + ' kg’a' + (r.o.hedef != null ? ', hedef ' + fmt(r.o.hedef, 1) + ' kg' : '');
    return {
      title: 'İlerleme kartı', back: 'danisan/' + c.id, tab: 'danisan', noRecent: true,
      html: '<div class="card"><img id="ilerlemeGorsel" class="ilerleme-gorsel" src="' + r.cv.toDataURL('image/png') + '" alt="' + esc(etiket) + '" width="' + W + '" height="' + H + '">' +
        '<div class="chips mt"><button class="chip' + (u.ad ? ' on' : '') + '" data-act="ilerlemeAd" aria-pressed="' + !!u.ad + '">İlk adı yaz</button></div>' +
        '<p class="small muted">Görsel bu cihazda hazırlanır. Ad varsayılan olarak yazılmaz; sağlık verisi başka uygulamaya gidiyor.</p>' +
        '<div class="grid2"><button class="btn block" data-act="ilerlemePaylas" data-id="' + esc(c.id) + '">' + DA.icon('share') + ' Paylaş</button>' +
        '<button class="btn ghost block" data-act="ilerlemeIndir" data-id="' + esc(c.id) + '">PNG indir</button></div></div>'
    };
  };
  DA.actions.ilerlemeAd = () => { const u = U(); u.ad = !u.ad; DA.save(); DA.render(true); };

  const dosyaAdi = () => 'ilerleme-' + DA.today() + '.png';
  function blob(c) {
    const r = ciz(c, U());
    return new Promise((ok) => (r ? r.cv.toBlob((b) => ok(b), 'image/png') : ok(null)));
  }
  function indir(b) {
    const a = document.createElement('a'), url = URL.createObjectURL(b);
    a.href = url; a.download = dosyaAdi(); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  /* Dosya paylaşımı destekliyse paylaşım sayfası (WhatsApp orada), yoksa
     indirme. Kullanıcı paylaşımı iptal ederse (AbortError) bir şey yapılmaz. */
  DA.actions.ilerlemePaylas = (el) => {
    const c = bul(el.dataset.id); if (!c) return Promise.resolve();
    return blob(c).then((b) => {
      if (!b) return null;
      const f = new File([b], dosyaAdi(), { type: 'image/png' });
      if (navigator.canShare && navigator.share && navigator.canShare({ files: [f] })) {
        return navigator.share({ files: [f], title: 'İlerleme kartı' }).catch((e) => { if (e && e.name !== 'AbortError') DA.toast('Paylaşılamadı; PNG indir’i dene'); });
      }
      indir(b); DA.toast('Paylaşım desteklenmiyor; görsel indirildi');
      return null;
    });
  };
  DA.actions.ilerlemeIndir = (el) => { const c = bul(el.dataset.id); return c ? blob(c).then((b) => { if (b) indir(b); }) : Promise.resolve(); };

  DA.ilerleme = { ozet, ciz };
})();
