/* Staj günlüğü / vaka notları */
(function () {
  'use strict';
  const { esc, fmt, num, uid } = DA;
  const TYPES = ['Günlük', 'Vaka', 'Öğrenme', 'Sunum/Ödev'];
  const TEMPLATE = 'Hasta (kod/yaş/cinsiyet): \nTanı: \nAntropometri: \nBiyokimya: \nBeslenme öyküsü: \nDeğerlendirme: \nHedef / Plan: \nİzlem: ';
  let filter = 'Tümü', q = '';
  const entries = () => DA.state().journal.slice().sort((a, b) => (b.d + b.id).localeCompare(a.d + a.id));

  function listHtml() {
    const s = DA.trLower(q);
    const list = entries().filter((e) => (filter === 'Tümü' || e.type === filter) && (!s || DA.trLower([e.title, e.place, e.text].join(' ')).includes(s)));
    if (!list.length) return DA.emptyState('note', { baslik: 'Staj günlüğü boş',
        aciklama: 'Vaka notları ve saatler burada birikir; dönem sonunda tek dosya olarak dışa aktarabilirsin.',
        eylem: { act: 'jNew', etiket: 'İlk notu ekle', ico: 'plus' } });
    return '<div class="list">' + list.map((e) => '<button class="li" data-act="jEdit" data-id="' + e.id + '"><span class="grow"><div class="t">' + esc(e.title || e.type) + '</div><div class="s">' + esc(DA.fdate(e.d)) + ' · ' + esc(e.type) + (e.place ? ' · ' + esc(e.place) : '') + '</div></span>' + (e.hours ? '<span class="end">' + fmt(e.hours, 1) + ' sa</span>' : '') + '</button>').join('') + '</div>';
  }
  DA.live.jSearch = (el) => { q = el.value; DA.$('#jList').innerHTML = listHtml(); };
  DA.actions.jFilter = (el) => { filter = el.dataset.f; DA.render(true); };

  DA.views.staj = () => {
    const all = DA.state().journal, total = all.reduce((t, e) => t + (e.hours || 0), 0);
    return {
      title: 'Staj günlüğü', back: 'daha',
      html: '<div class="card row between"><div><b style="font-size:22px">' + fmt(total, 1) + ' saat</b><div class="muted small">' + all.length + ' kayıt</div></div><div class="grid2" style="gap:6px"><a class="btn sec sm" href="#/yazdir/staj">PDF / Paylaş</a></div></div>' +
        '<input type="search" placeholder="Ara…" value="' + esc(q) + '" data-live="jSearch">' +
        '<div class="chips mt-s">' + ['Tümü'].concat(TYPES).map((t) => '<button class="chip' + (t === filter ? ' on' : '') + '" data-act="jFilter" data-f="' + t + '">' + t + '</button>').join('') + '</div>' +
        '<div id="jList">' + listHtml() + '</div><button class="fab" data-act="jNew" aria-label="Yeni kayıt">' + DA.icon('plus') + '</button>'
    };
  };

  function form(e) {
    e = e || {};
    return '<form data-form="journal" data-id="' + (e.id || '') + '"><div class="grid2"><label class="fld"><span>Tarih</span><input type="date" name="d" value="' + (e.d || DA.today()) + '" required></label>' +
      '<label class="fld"><span>Tür</span><select name="type">' + TYPES.map((t) => '<option' + (e.type === t ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></label>' +
      '<label class="fld"><span>Yer / birim</span><input type="text" name="place" value="' + esc(e.place || '') + '" placeholder="Hastane, poliklinik, mutfak…"></label>' +
      '<label class="fld"><span>Süre (saat)</span><input type="text" inputmode="decimal" name="hours" value="' + esc(e.hours || '') + '"></label></div>' +
      '<label class="fld"><span>Başlık</span><input type="text" name="title" value="' + esc(e.title || '') + '"></label>' +
      '<label class="fld"><span>Not</span><textarea name="text" rows="8" placeholder="Ne gördün, ne öğrendin, neyi araştıracaksın?">' + esc(e.text || '') + '</textarea></label>' +
      '<button type="button" class="btn ghost sm mb" data-act="jTemplate">Vaka şablonunu ekle</button>' +
      '<div class="note warn">Hasta adı, TC no gibi kimliği belirleyen bilgi yazma.</div>' +
      '<button class="btn block">Kaydet</button>' + (e.id ? '<button type="button" class="btn danger block mt-s" data-act="jDelete" data-id="' + e.id + '">Kaydı sil</button>' : '') + '</form>';
  }
  DA.actions.jNew = () => DA.sheet('Yeni kayıt', form(), (b) => { const t = DA.$('textarea', b); t.dataset.nofocus = 1; });
  DA.actions.jEdit = (el) => DA.sheet('Kaydı düzenle', form(DA.state().journal.find((e) => e.id === el.dataset.id)));
  DA.actions.jTemplate = () => { const t = DA.$('#sheetBody textarea[name=text]'); if (!t.value.trim()) t.value = TEMPLATE; else t.value += '\n\n' + TEMPLATE; DA.$('#sheetBody select[name=type]').value = 'Vaka'; };
  DA.forms.journal = (f) => {
    const d = DA.formData(f), S = DA.state();
    const rec = { d: d.d, type: d.type, place: d.place.trim(), hours: num(d.hours) || 0, title: d.title.trim(), text: d.text };
    if (f.dataset.id) Object.assign(S.journal.find((e) => e.id === f.dataset.id), rec); else S.journal.push(Object.assign({ id: uid() }, rec));
    DA.save(); DA.closeSheet(); DA.render(true);
  };
  DA.actions.jDelete = (el) => {
    const S = DA.state(), i = S.journal.findIndex((e) => e.id === el.dataset.id);
    if (i < 0) return;
    const silinen = S.journal[i];
    S.journal.splice(i, 1); DA.save(); DA.closeSheet(); DA.render(true);
    DA.silGeriAl('Staj kaydı silindi', () => { DA.state().journal.splice(i, 0, silinen); });
  };

  function journalText() {
    return entries().slice().reverse().map((e) => '— ' + DA.fdate(e.d) + ' · ' + e.type + (e.place ? ' · ' + e.place : '') + (e.hours ? ' · ' + fmt(e.hours, 1) + ' sa' : '') + '\n' + (e.title ? e.title + '\n' : '') + (e.text || '')).join('\n\n');
  }
  DA.views._printJournal = () => {
    const list = entries().slice().reverse(), total = list.reduce((t, e) => t + (e.hours || 0), 0);
    return {
      title: 'Staj günlüğü — PDF', back: 'staj',
      html: '<div class="noprint grid2 mb"><button class="btn block" data-act="doPrint">PDF olarak kaydet / yazdır</button><button class="btn ghost block" data-act="jShare">Metin olarak paylaş</button></div>' +
        '<div class="printdoc">' + DA.antet() + '<h2>Staj günlüğü</h2><div class="alt">Toplam ' + fmt(total, 1) + ' saat · ' + list.length + ' kayıt</div>' +
        list.map((e) => '<div class="blok kayit"><h3>' + esc(DA.fdate(e.d)) + ' · ' + esc(e.type) +
          (e.place ? ' · ' + esc(e.place) : '') + (e.hours ? ' <span class="ince">' + fmt(e.hours, 1) + ' saat</span>' : '') + '</h3>' +
          (e.title ? '<div class="sat"><b>' + esc(e.title) + '</b></div>' : '') +
          '<div>' + esc(e.text || '').replace(/\n/g, '<br>') + '</div></div>').join('') +
        DA.dipnot('staj kayıtları öğrencinin kendi beyanıdır.') + '</div>'
    };
  };
  DA.actions.jShare = () => DA.shareText('Staj günlüğü', journalText());
})();
