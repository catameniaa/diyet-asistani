/* Diyet Asistanı — çekirdek: veri deposu, yardımcılar, yönlendirici */
(function () {
  'use strict';
  const DA = (window.DA = { views: {}, actions: {}, forms: {}, live: {}, data: {}, calcs: [] });
  const KEY = 'dyt.v1';

  const defaults = () => ({
    v: 1, clients: [], menus: [], journal: [], customFoods: [], customCards: [],
    cardProgress: {}, targets: { kcal: 2000, p: 100, c: 250, f: 67 }, profile: {}, ui: {}
  });
  let state;
  /* Kayıt okunamazsa (bozuk ya da yarım yazılmış JSON) ham metnin üzerine YAZMAYIZ.
     Boş durumla açılıp ilk kayıtta veriyi silmek, kurtarılabilir bir kaydı yok eder.
     Bunun yerine kaydetme kilitlenir; kullanıcı ham metni indirip karar verene kadar
     diskteki veri olduğu gibi durur. */
  let _kilit = '', _ham = '';
  try {
    const raw = localStorage.getItem(KEY);
    state = Object.assign(defaults(), raw ? JSON.parse(raw) : {});
  } catch (e) {
    state = defaults();
    try { _ham = localStorage.getItem(KEY) || ''; } catch (e2) { _ham = ''; }
    _kilit = _ham
      ? 'Kayıtlı veri okunamadı; bozuk olabilir. Üzerine yazmamak için kaydetme durduruldu.'
      : 'Tarayıcı depolaması okunamıyor.';
  }

  DA.state = () => state;
  /* Kilit durumu: '' ise sorun yok. Ham metin kurtarma için saklanır. */
  DA.depoKilit = () => _kilit;
  DA.depoHam = () => _ham;
  /* Kullanıcı bilerek sıfırdan başlamayı seçerse kilit kalkar. */
  DA.depoKilitAc = () => { _kilit = ''; _ham = ''; DA.save(); };
  DA.save = () => {
    if (_kilit) return false;          /* bozuk kaydın üzerine yazma */
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      if (DA.depoAnlik) DA.depoAnlik();   /* arka planda anlık kopya (js/depo.js) */
      return true;
    } catch (e) {
      _kilit = 'Kaydedilemedi: tarayıcı depolaması dolu ya da kapalı. Değişiklikler saklanmıyor.';
      if (DA.toast) DA.toast(_kilit);
      if (DA.render) setTimeout(() => DA.render(true), 0);
      return false;
    }
  };
  DA.replaceState = (o) => { state = Object.assign(defaults(), o); DA.save(); DA.applyTheme(); };

  /* ---- marka ---- */
  DA.APP = 'Diyet Asistanı';
  DA.dyt = () => (state.profile.dyt || '').trim() || 'Dyt. Can Bayramoğlu';

  /* ---- tema: otomatik (sistem) / açık / koyu ---- */
  /* Yazdırma çıktılarının başındaki antet: ad-unvan ve iletişim satırı */
  DA.antet = () => {
    const p = state.profile || {};
    return '<div class="antet"><div class="ad">' + DA.esc(DA.dyt()) + '</div>' +
      (p.iletisim ? '<div class="il">' + DA.esc(p.iletisim) + '</div>' : '') + '</div>';
  };
  DA.THEMES = [['auto', 'Otomatik'], ['light', 'Açık'], ['dark', 'Koyu']];
  DA.theme = () => state.ui.theme || 'auto';
  DA.applyTheme = () => {
    const t = DA.theme(), root = document.documentElement;
    if (t === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', t);
    const dark = t === 'dark' || (t === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme:dark)').matches);
    const m = document.querySelector('meta[name=theme-color]');
    if (m) m.setAttribute('content', dark ? '#15211b' : '#0e7a50');
  };
  DA.setTheme = (t) => { state.ui.theme = t; DA.save(); DA.applyTheme(); };
  DA.applyTheme();
  if (window.matchMedia) matchMedia('(prefers-color-scheme:dark)').addEventListener('change', () => { if (DA.theme() === 'auto') DA.applyTheme(); });

  /* ---- favoriler ve son kullanılanlar ---- */
  DA.favs = () => (state.ui.fav = state.ui.fav || []);
  DA.isFav = (h) => DA.favs().some((x) => x.h === h);
  DA.toggleFav = (h, t, ico) => {
    const f = DA.favs(), i = f.findIndex((x) => x.h === h);
    if (i >= 0) f.splice(i, 1); else f.unshift({ h, t, ico: ico || 'calc' });
    if (f.length > 12) f.length = 12;
    DA.save();
    return i < 0;
  };
  DA.recents = () => (state.ui.recent = state.ui.recent || []);

  /* ---- yardımcılar ---- */
  DA.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  DA.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  DA.num = (v) => { const n = parseFloat(String(v == null ? '' : v).trim().replace(',', '.')); return isFinite(n) ? n : NaN; };
  DA.fmt = (n, d) => (typeof n === 'number' && isFinite(n)) ? n.toLocaleString('tr-TR', { maximumFractionDigits: d == null ? 1 : d, useGrouping: false }) : '—';
  DA.today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  DA.fdate = (iso) => { if (!iso) return ''; const d = new Date(iso + 'T00:00'); return isNaN(d) ? iso : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }); };
  DA.$ = (s, r) => (r || document).querySelector(s);
  DA.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  DA.trLower = (s) => String(s || '').toLocaleLowerCase('tr-TR');
  DA.formData = (f) => { const o = {}; new FormData(f).forEach((v, k) => { o[k] = v; }); return o; };

  const ICONS = {
    home: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h8"/>',
    apple: '<path d="M12 7c-2-2-6-1.5-7 2-1 3.5 1 9 4 11 1.2.8 2 .3 3 0s1.8.8 3 0c3-2 5-7.5 4-11-1-3.5-5-4-7-2z"/><path d="M12 7c0-2 1-4 3-5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7"/><path d="M17 4.5a3.5 3.5 0 0 1 0 7M22 21c0-3-1.5-5.5-4-6.5"/>',
    book: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    share: '<path d="M12 3v12M8 7l4-4 4 4M5 12v8h14v-8"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    note: '<path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    cards: '<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/>',
    save: '<path d="M12 3v12M8 11l4 4 4-4M5 19h14"/>',
    menu: '<path d="M5 4h14v16H5z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
    heart: '<path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
    baby: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/><path d="M10 8h.01M14 8h.01"/>',
    drop: '<path d="M12 3s6 6.4 6 10.5A6 6 0 0 1 6 13.5C6 9.4 12 3 12 3z"/>',
    flask: '<path d="M10 3h4M11 3v6L5.5 18A2 2 0 0 0 7.2 21h9.6a2 2 0 0 0 1.7-3L13 9V3"/><path d="M8.5 14h7"/>'
  };
  DA.icon = (n) => '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || '') + '</svg>';

  /* ---- arayüz: toast / sheet ---- */
  let toastT;
  DA.toast = (msg) => {
    const t = DA.$('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600);
  };
  DA.sheet = (title, html, mount) => {
    DA.$('#sheetTitle').textContent = title;
    const b = DA.$('#sheetBody'); b.innerHTML = html; b.scrollTop = 0;
    DA.$('#sheet').hidden = false;
    if (mount) mount(b);
    const f = DA.$('input:not([type=radio]):not([type=hidden]),textarea', b);
    if (f && !f.dataset.nofocus) setTimeout(() => { try { f.focus(); } catch (e) { /* yok say */ } }, 60);
  };
  DA.closeSheet = () => { DA.$('#sheet').hidden = true; DA.$('#sheetBody').innerHTML = ''; };

  /* ---- ihtiyaç anında veri yükleme ----
     Büyük veri dosyaları açılışta değil, ilgili ekran ilk açıldığında yüklenir.
     Service worker hepsini önbelleğe aldığı için çevrimdışı çalışma bozulmaz. */
  DA.LAZY = {
    growth: ['js/data-growth.js'],
    tuber: ['js/data-tuber.js', 'js/data-oruntu.js'],
    hedef: ['js/data-hedef.js', 'js/data-icerik.js', 'js/data-karsilama.js', 'js/data-eslestirme.js'],
    porsiyon: ['js/data-porsiyon.js'],
    porsiyonBesin: ['js/data-porsiyonbesin.js'],
    istege: ['js/data-istege.js'],
    ornekMenu: ['js/data-menu.js'],
    bebek: ['js/data-bebek.js'],
    gebe: ['js/data-gebe.js'],
    pal: ['js/data-pal.js'],
    gi: ['js/data-gi.js'],
    enerjiRef: ['js/data-enerji.js'],
    yontem: ['js/data-yontem.js'],
    sporcu: ['js/data-sporcu.js'],
    vejetaryen: ['js/data-vejetaryen.js']
  };
  const _yuklu = {};
  function script(src) {
    if (_yuklu[src]) return _yuklu[src];
    _yuklu[src] = new Promise((ok, hata) => {
      const el = document.createElement('script');
      el.src = src; el.async = false;
      el.onload = ok; el.onerror = () => hata(new Error(src));
      document.head.appendChild(el);
    });
    return _yuklu[src];
  }
  DA.hazir = (keys) => (keys || []).every((k) => DA.data[k]);
  /* Sırayla yükler: data-oruntu.js, data-tuber.js'in üstüne yazar */
  DA.need = (keys) => {
    const src = [];
    (keys || []).forEach((k) => { if (!DA.data[k]) (DA.LAZY[k] || []).forEach((f) => { if (src.indexOf(f) < 0) src.push(f); }); });
    return src.reduce((z, f) => z.then(() => script(f)), Promise.resolve());
  };
  DA.needAll = () => DA.need(Object.keys(DA.LAZY));

  /* ---- yönlendirici ---- */
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, '');
    const i = h.indexOf('?');
    const path = i >= 0 ? h.slice(0, i) : h;
    return { parts: path.split('/').filter(Boolean).map(decodeURIComponent), q: new URLSearchParams(i >= 0 ? h.slice(i + 1) : '') };
  }
  DA.go = (p) => { location.hash = '#/' + p; };
  DA.render = (keepScroll) => {
    const { parts, q } = parseHash();
    const root = parts[0] || 'ana';
    const view = DA.views[root] || DA.views.ana;
    let out;
    try { out = view(parts.slice(1), q); }
    catch (e) { console.error(e); out = { title: 'Hata', html: '<div class="card"><b>Bir şeyler ters gitti.</b><p class="muted small">' + DA.esc(e.message) + '</p><a class="btn" href="#/ana">Ana sayfa</a></div>' }; }
    const app = DA.$('#app');
    const y = window.scrollY;
    /* Depolama kilitliyse her ekranın başında uyar: sessizce çalışmaya devam etmek,
       kullanıcının kaydedildiğini sanıp veri kaybetmesine yol açar. */
    app.innerHTML = (_kilit ? kilitHtml() : '') + out.html;
    DA.$('#title').textContent = out.title || 'Diyet Asistanı';
    const back = DA.$('#backBtn');
    back.hidden = !out.back;
    back.dataset.to = out.back || '';
    DA.$$('#tabs a').forEach((a) => a.classList.toggle('on', a.dataset.tab === (out.tab || root)));
    DA.$('#gearBtn').hidden = root === 'daha';
    DA.$('#searchBtn').hidden = root === 'ara';
    const fb = DA.$('#favBtn');
    fb.hidden = !out.fav;
    if (out.fav) {
      const on = DA.isFav(out.fav.h);
      fb.classList.toggle('on', on);
      fb.setAttribute('aria-pressed', on ? 'true' : 'false');
      fb.setAttribute('aria-label', on ? 'Favorilerden çıkar' : 'Favorilere ekle');
      fb.dataset.h = out.fav.h; fb.dataset.t = out.fav.t; fb.dataset.ico = out.fav.ico || 'calc';
    }
    if (out.mount) out.mount(app);
    if (parts.length > 1 && out.title && !out.noRecent) {
      const h = '#/' + parts.map(encodeURIComponent).join('/'), r = DA.recents();
      const i = r.findIndex((x) => x.h === h);
      if (i >= 0) r.splice(i, 1);
      r.unshift({ h, t: out.title, ico: out.ico || 'calc' });
      if (r.length > 8) r.length = 8;
      DA.save();
    }
    window.scrollTo(0, keepScroll ? y : 0);
    DA.$('#top').style.display = out.noHeader ? 'none' : '';
  };
  function kilitHtml() {
    return '<div class="note bad"><b>Veriler kaydedilmiyor.</b> ' + DA.esc(_kilit) +
      (_ham ? ' Diskteki ham kayıt (' + _ham.length + ' karakter) olduğu gibi duruyor; ' +
        'önce indir, sonra karar ver.' : '') +
      '<div class="row gap" style="margin-top:10px">' +
      (_ham ? '<button class="btn sm" data-act="hamIndir">Ham kaydı indir</button>' : '') +
      '<button class="btn ghost sm" data-act="kilitAc">Sıfırdan başla</button></div></div>';
  }
  DA.actions = DA.actions || {};
  DA.actions.hamIndir = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([_ham], { type: 'text/plain' }));
    a.download = 'diyet-asistani-ham-kayit-' + DA.today() + '.txt';
    document.body.appendChild(a); a.click(); a.remove();
  };
  DA.actions.kilitAc = () => {
    if (!confirm('Okunamayan kayıt silinecek ve boş bir durumla başlanacak. ' +
      'Ham kaydı indirdiysen sorun yok. Devam edilsin mi?')) return;
    DA.depoKilitAc(); DA.render();
  };

  DA.refresh = () => DA.render(true);
  window.addEventListener('hashchange', () => { DA.closeSheet(); DA.render(false); });

  /* ---- olay temsilcisi ---- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const fn = DA.actions[el.dataset.act];
    if (fn) { if (el.tagName !== 'INPUT') e.preventDefault(); fn(el, e); }
  });
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-form]');
    if (f && DA.forms[f.dataset.form]) { e.preventDefault(); DA.forms[f.dataset.form](f, e); }
  });
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-live]');
    if (el && DA.live[el.dataset.live]) DA.live[el.dataset.live](el, e);
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (el && DA.live[el.dataset.change]) DA.live[el.dataset.change](el, e);
  });

  DA.actions.back = (el) => { if (el.dataset.to) DA.go(el.dataset.to); else history.back(); };
  DA.actions.closeSheet = () => DA.closeSheet();

  /* ortak: paylaş / kopyala */
  DA.shareText = async (title, text) => {
    try {
      if (navigator.share) { await navigator.share({ title, text }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(text); DA.toast('Metin panoya kopyalandı'); }
    catch (e) { DA.sheet('Metni kopyala', '<textarea readonly rows="12" style="width:100%">' + DA.esc(text) + '</textarea>'); }
  };

  /* Yeni sürüm çubuğu — service worker yenisini indirdiğinde gösterilir */
  DA.showUpdate = () => {
    if (document.getElementById('updBar')) return;
    const d = document.createElement('div');
    d.id = 'updBar'; d.className = 'updbar';
    d.innerHTML = '<span>Yeni sürüm hazır</span><button class="btn sm" data-act="doUpdate">Yenile</button>' +
      '<button class="iconbtn" data-act="hideUpdate" aria-label="Kapat">\u2715</button>';
    document.body.appendChild(d);
  };
  DA.actions.doUpdate = () => {
    const reg = DA._sw;
    if (reg && reg.waiting) reg.waiting.postMessage('skipWaiting');
    else location.reload();
  };
  DA.actions.hideUpdate = () => { const b = document.getElementById('updBar'); if (b) b.remove(); };

  DA.emptyState = (icon, text) => '<div class="empty">' + DA.icon(icon) + '<div>' + text + '</div></div>';
})();
