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
  try { const raw = localStorage.getItem(KEY); state = Object.assign(defaults(), raw ? JSON.parse(raw) : {}); }
  catch (e) { state = defaults(); }

  DA.state = () => state;
  DA.save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { DA.toast('Kaydedilemedi: tarayıcı depolaması kapalı ya da dolu'); }
  };
  DA.replaceState = (o) => { state = Object.assign(defaults(), o); DA.save(); };

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
    heart: '<path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>'
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
    app.innerHTML = out.html;
    DA.$('#title').textContent = out.title || 'Diyet Asistanı';
    const back = DA.$('#backBtn');
    back.hidden = !out.back;
    back.dataset.to = out.back || '';
    DA.$$('#tabs a').forEach((a) => a.classList.toggle('on', a.dataset.tab === (out.tab || root)));
    DA.$('#gearBtn').hidden = root === 'daha';
    if (out.mount) out.mount(app);
    window.scrollTo(0, keepScroll ? y : 0);
    DA.$('#top').style.display = out.noHeader ? 'none' : '';
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

  DA.emptyState = (icon, text) => '<div class="empty">' + DA.icon(icon) + '<div>' + text + '</div></div>';
})();
