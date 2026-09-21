/* Çalışma kartları — aralıklı tekrar (Leitner kutuları: 1, 2, 4, 8, 16 gün) */
(function () {
  'use strict';
  const { esc } = DA;
  const DAY = 86400000, GAP = [0, 1, 2, 4, 8, 16];
  let deck = 'Tümü', session = null;

  const allCards = () => DA.data.cards.concat(DA.state().customCards.map((c) => Object.assign({ custom: true }, c)));
  const prog = (id) => DA.state().cardProgress[id];
  const isDue = (c) => { const p = prog(c.id); return !p || p.due <= Date.now(); };
  const decks = () => ['Tümü'].concat(Array.from(new Set(allCards().map((c) => c.cat))));
  const inDeck = (c) => deck === 'Tümü' || c.cat === deck;

  DA.dueCount = () => allCards().filter(isDue).length;

  DA.views.kart = (parts) => {
    if (parts[0] === 'calis') return studyView();
    const cs = allCards().filter(inDeck), due = cs.filter(isDue).length;
    const learned = cs.filter((c) => prog(c.id) && prog(c.id).box >= 4).length;
    return {
      title: 'Çalışma kartları', back: 'daha',
      html: '<div class="chips">' + decks().map((d) => '<button class="chip' + (d === deck ? ' on' : '') + '" data-act="deckSel" data-d="' + esc(d) + '">' + esc(d) + '</button>').join('') + '</div>' +
        '<div class="card center"><div class="macros"><div><b>' + cs.length + '</b><small>kart</small></div><div><b>' + due + '</b><small>bugün</small></div><div><b>' + learned + '</b><small>öğrenildi</small></div></div>' +
        '<button class="btn block mt" data-act="studyStart"' + (due ? '' : ' disabled style="opacity:.5"') + '>' + (due ? 'Çalışmaya başla (' + Math.min(due, 20) + ' kart)' : 'Bugünlük tamam 🎉') + '</button></div>' +
        '<div class="grid2"><button class="btn sec block" data-act="cardNew">' + DA.icon('plus') + ' Kart ekle</button><button class="btn ghost block" data-act="cardImport">Toplu ekle</button></div>' +
        '<p class="muted small center mt">Bildiğin kartlar giderek daha seyrek gelir (1, 2, 4, 8, 16 gün). Bilemediğin kart aynı oturumda tekrar karşına çıkar.</p>' +
        (DA.state().customCards.length ? '<div class="sect">Eklediğin kartlar</div><div class="list">' + DA.state().customCards.map((c) => '<button class="li" data-act="cardEdit" data-id="' + c.id + '"><span class="grow"><div class="t">' + esc(c.q) + '</div><div class="s">' + esc(c.cat) + '</div></span></button>').join('') + '</div>' : '')
    };
  };
  DA.actions.deckSel = (el) => { deck = el.dataset.d; DA.render(true); };
  DA.actions.studyStart = () => {
    const q = allCards().filter(inDeck).filter(isDue);
    for (let i = q.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = q[i]; q[i] = q[j]; q[j] = t; }
    session = { q: q.slice(0, 20).map((c) => c.id), i: 0, shown: false, ok: 0, total: 0 };
    DA.go('kart/calis');
  };
  function studyView() {
    if (!session) return { title: 'Çalışma', back: 'kart', html: '<div class="card">Oturum yok.</div>', mount() { DA.go('kart'); } };
    if (session.i >= session.q.length) {
      const s = session; session = null;
      return { title: 'Bitti', back: 'kart', html: '<div class="card center"><h2 style="font-size:22px">Tamamlandı 🎉</h2><p>' + s.total + ' karttan <b>' + s.ok + '</b> tanesini bildin.</p><a class="btn block" href="#/kart">Kartlara dön</a></div>' };
    }
    const c = allCards().find((x) => x.id === session.q[session.i]);
    if (!c) { session.i++; return studyView(); }
    return {
      title: 'Kart ' + (session.i + 1) + ' / ' + session.q.length, back: 'kart',
      html: '<div class="bar mb"><i style="width:' + (session.i / session.q.length * 100) + '%"></i></div><div class="card fc" data-act="cardFlip"><div class="tiny muted">' + esc(c.cat) + '</div><div class="q">' + esc(c.q) + '</div>' +
        (session.shown ? '<div class="a">' + esc(c.a) + '</div>' : '<div class="hint">Cevabı görmek için dokun</div>') + '</div>' +
        (session.shown ? '<div class="grid2"><button class="btn danger block" data-act="cardAns" data-ok="0">Bilemedim</button><button class="btn block" data-act="cardAns" data-ok="1">Bildim</button></div>' : '')
    };
  }
  DA.actions.cardFlip = () => { if (session) { session.shown = true; DA.render(true); } };
  DA.actions.cardAns = (el) => {
    const id = session.q[session.i], ok = el.dataset.ok === '1', p = prog(id) || { box: 0 };
    p.box = ok ? Math.min(5, p.box + 1) : 1; p.due = Date.now() + (ok ? GAP[p.box] : 1) * DAY;
    if (!ok) p.due = Date.now() + 10 * 60000; // bilemediğin kart oturum sonuna yakın tekrar
    DA.state().cardProgress[id] = p; DA.save();
    session.total++; if (ok) session.ok++;
    if (!ok) { session.q.push(id); }
    session.i++; session.shown = false; DA.render(false);
  };

  function cardForm(c) {
    c = c || {};
    return '<form data-form="card" data-id="' + (c.id || '') + '"><label class="fld"><span>Kategori</span><input type="text" name="cat" value="' + esc(c.cat || 'Benim kartlarım') + '"></label>' +
      '<label class="fld"><span>Soru</span><textarea name="q" rows="3" required>' + esc(c.q || '') + '</textarea></label><label class="fld"><span>Cevap</span><textarea name="a" rows="4" required>' + esc(c.a || '') + '</textarea></label>' +
      '<button class="btn block">Kaydet</button>' + (c.id ? '<button type="button" class="btn danger block mt-s" data-act="cardDelete" data-id="' + c.id + '">Kartı sil</button>' : '') + '</form>';
  }
  DA.actions.cardNew = () => DA.sheet('Yeni kart', cardForm());
  DA.actions.cardEdit = (el) => DA.sheet('Kartı düzenle', cardForm(DA.state().customCards.find((c) => c.id === el.dataset.id)));
  DA.forms.card = (f) => {
    const d = DA.formData(f), S = DA.state(), rec = { cat: d.cat.trim() || 'Benim kartlarım', q: d.q.trim(), a: d.a.trim() };
    if (!rec.q || !rec.a) return;
    if (f.dataset.id) Object.assign(S.customCards.find((c) => c.id === f.dataset.id), rec); else S.customCards.push(Object.assign({ id: 'u' + DA.uid() }, rec));
    DA.save(); DA.closeSheet(); DA.render(true);
  };
  DA.actions.cardDelete = (el) => {
    const S = DA.state(), id = el.dataset.id;
    const i = S.customCards.findIndex((c) => c.id === id);
    if (i < 0) return;
    const silinen = S.customCards[i], ilerleme = S.cardProgress[id];
    S.customCards.splice(i, 1); delete S.cardProgress[id];
    DA.save(); DA.closeSheet(); DA.render(true);
    DA.silGeriAl('Kart silindi', () => {
      const T = DA.state();
      T.customCards.splice(i, 0, silinen);
      if (ilerleme !== undefined) T.cardProgress[id] = ilerleme;
    });
  };
  DA.actions.cardImport = () => {
    DA.sheet('Toplu kart ekle', '<form data-form="cardImport"><p class="muted small">Her satıra bir kart yaz: <b>soru ; cevap</b><br>Notlarından kopyala-yapıştır yapabilirsin.</p>' +
      '<label class="fld"><span>Kategori</span><input type="text" name="cat" value="Benim kartlarım"></label><textarea name="txt" rows="9" placeholder="Folat eksikliği hangi anemi? ; Megaloblastik anemi"></textarea><button class="btn block mt">Ekle</button></form>');
  };
  DA.forms.cardImport = (f) => {
    const d = DA.formData(f), S = DA.state(); let n = 0;
    d.txt.split('\n').forEach((line) => {
      const i = line.indexOf(';'); if (i < 1) return;
      const q = line.slice(0, i).trim(), a = line.slice(i + 1).trim(); if (!q || !a) return;
      S.customCards.push({ id: 'u' + DA.uid() + n, cat: d.cat.trim() || 'Benim kartlarım', q, a }); n++;
    });
    DA.save(); DA.closeSheet(); DA.render(true); DA.toast(n + ' kart eklendi');
  };
})();
