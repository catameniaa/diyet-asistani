/* Danışan takibi (veriler yalnızca bu cihazda saklanır) */
(function () {
  'use strict';
  const { esc, fmt, num, uid } = DA;
  const clients = () => DA.state().clients;
  const sortedMeas = (c) => (c.meas || []).slice().sort((a, b) => a.d.localeCompare(b.d));
  const age = (c) => (c.birth ? new Date().getFullYear() - c.birth : null);

  function chartSvg(points, unit) {
    if (points.length < 2) return '<div class="muted small center" style="padding:14px 0">Grafik için en az 2 ölçüm gerekli.</div>';
    const W = 320, H = 150, pl = 34, pr = 10, pt = 10, pb = 22;
    const ys = points.map((p) => p.y), lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys), pad = Math.max((hi - lo) * 0.2, 0.5);
    const y0 = lo - pad, y1 = hi + pad, t0 = points[0].t, t1 = points[points.length - 1].t || t0 + 1;
    const X = (t) => pl + (t1 === t0 ? 0 : (t - t0) / (t1 - t0)) * (W - pl - pr), Y = (v) => pt + (1 - (v - y0) / (y1 - y0)) * (H - pt - pb);
    let g = '';
    for (let i = 0; i <= 3; i++) { const v = y0 + (y1 - y0) * i / 3, y = Y(v); g += '<line class="grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '"/><text x="' + (pl - 4) + '" y="' + (y + 3) + '" text-anchor="end">' + fmt(v, 1) + '</text>'; }
    const path = points.map((p, i) => (i ? 'L' : 'M') + X(p.t).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join(' ');
    const dots = points.map((p) => '<circle class="dot" cx="' + X(p.t).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="3.5"/>').join('');
    const fd = (t) => new Date(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Ölçüm grafiği (' + unit + ')">' + g + '<path class="ln" d="' + path + '"/>' + dots +
      '<text x="' + pl + '" y="' + (H - 6) + '">' + fd(t0) + '</text><text x="' + (W - pr) + '" y="' + (H - 6) + '" text-anchor="end">' + fd(t1) + '</text></svg>';
  }

  DA.views.danisan = (parts) => {
    const id = parts[0];
    if (!id) {
      const q = DA.trLower(DA.state().ui.clientQ || '');
      const list = clients().filter((c) => !q || DA.trLower(c.name).includes(q)).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      return {
        title: 'Danışanlar', tab: 'danisan',
        html: '<div class="note">Veriler yalnızca bu cihazda saklanır. Sağlık verisi hassas kişisel veridir (KVKK); gerçek danışanlar için ad yerine kod/baş harf kullanmanı öneririm.</div>' +
          (clients().length > 4 ? '<input type="search" placeholder="Danışan ara…" value="' + esc(DA.state().ui.clientQ || '') + '" data-live="clientSearch" class="mb">' : '') +
          (list.length ? '<div class="list">' + list.map((c) => {
            const m = sortedMeas(c), last = m[m.length - 1], first = m[0];
            const d = last && first && m.length > 1 && last.w && first.w ? last.w - first.w : null;
            return '<a class="li chev" href="#/danisan/' + c.id + '"><span class="ic">' + esc((c.name[0] || '?').toUpperCase()) + '</span><span class="grow"><div class="t">' + esc(c.name) + '</div><div class="s">' + (last && last.w ? fmt(last.w, 1) + ' kg' : 'Ölçüm yok') + (d != null ? ' · ' + (d > 0 ? '+' : '') + fmt(d, 1) + ' kg' : '') + '</div></span></a>';
          }).join('') + '</div>' : DA.emptyState('users', 'Henüz danışan yok.<br><span class="small">+ ile ekle.</span>')) +
          '<button class="fab" data-act="clientNew" aria-label="Danışan ekle">' + DA.icon('plus') + '</button>'
      };
    }
    const c = clients().find((x) => x.id === id);
    if (!c) return { title: 'Danışan', back: 'danisan', html: '<div class="card">Danışan bulunamadı.</div>' };
    const m = sortedMeas(c), last = m[m.length - 1], first = m[0];
    const bmi = last && last.w && c.h ? last.w / Math.pow(c.h / 100, 2) : null;
    const wPts = m.filter((x) => x.w).map((x) => ({ t: new Date(x.d + 'T00:00').getTime(), y: x.w }));
    const a = age(c);
    return {
      title: c.name, tab: 'danisan', back: 'danisan',
      html: '<div class="card"><div class="row between"><div><b style="font-size:18px">' + esc(c.name) + '</b><div class="muted small">' + (c.sex === 'K' ? 'Kadın' : 'Erkek') + (a ? ' · ' + a + ' yaş' : '') + (c.h ? ' · ' + fmt(c.h, 0) + ' cm' : '') + '</div></div><button class="btn ghost sm" data-act="clientEdit" data-id="' + c.id + '">Düzenle</button></div>' +
        (last ? '<div class="macros mt"><div><b>' + (last.w ? fmt(last.w, 1) : '—') + '</b><small>kilo (kg)</small></div><div><b>' + (bmi ? fmt(bmi, 1) : '—') + '</b><small>BKİ</small></div><div><b>' + (first && last && first !== last && first.w && last.w ? (last.w - first.w > 0 ? '+' : '') + fmt(last.w - first.w, 1) : '—') + '</b><small>değişim (kg)</small></div><div><b>' + (last.fat ? fmt(last.fat, 1) : '—') + '</b><small>yağ %</small></div></div>' : '') + '</div>' +
        '<div class="grid2 mb"><a class="btn sec block" href="#/hesapla/enerji?c=' + c.id + '">Enerji hesapla</a><button class="btn block" data-act="measNew" data-id="' + c.id + '">' + DA.icon('plus') + ' Ölçüm ekle</button></div>' +
        '<div class="card"><h2>Kilo grafiği</h2>' + chartSvg(wPts, 'kg') + '</div>' +
        '<div class="sect">Ölçümler</div>' +
        (m.length ? '<div class="list">' + m.slice().reverse().map((x) => '<button class="li" data-act="measEdit" data-id="' + c.id + '" data-mid="' + x.id + '"><span class="grow"><div class="t">' + esc(DA.fdate(x.d)) + '</div><div class="s">' + [x.w ? fmt(x.w, 1) + ' kg' : '', x.waist ? 'bel ' + fmt(x.waist, 0) : '', x.hip ? 'kalça ' + fmt(x.hip, 0) : '', x.fat ? 'yağ %' + fmt(x.fat, 1) : ''].filter(Boolean).join(' · ') + (x.note ? ' — ' + esc(x.note) : '') + '</div></span></button>').join('') + '</div>' : '<div class="muted small center mb">Henüz ölçüm yok.</div>') +
        '<div class="card"><h2>Notlar</h2><textarea data-live="clientNote" data-id="' + c.id + '" placeholder="Anamnez, hedefler, alerjiler, planlanan kontroller…">' + esc(c.note || '') + '</textarea></div>'
    };
  };
  DA.live.clientSearch = (el) => { DA.state().ui.clientQ = el.value; DA.save(); DA.render(true); const i = DA.$('input[data-live=clientSearch]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } };
  DA.live.clientNote = (el) => { const c = clients().find((x) => x.id === el.dataset.id); c.note = el.value; DA.save(); };

  function clientForm(c) {
    c = c || {};
    return '<form data-form="client" data-id="' + (c.id || '') + '"><label class="fld"><span>Ad / kod</span><input type="text" name="name" required value="' + esc(c.name || '') + '"></label>' +
      '<div class="fld"><span>Cinsiyet</span><div class="seg"><label><input type="radio" name="sex" value="K"' + (c.sex === 'K' ? ' checked' : '') + '><span>Kadın</span></label><label><input type="radio" name="sex" value="E"' + (c.sex !== 'K' ? ' checked' : '') + '><span>Erkek</span></label></div></div>' +
      '<div class="grid2"><label class="fld"><span>Doğum yılı</span><input type="text" inputmode="numeric" name="birth" value="' + esc(c.birth || '') + '" placeholder="1998"></label><label class="fld"><span>Boy (cm)</span><input type="text" inputmode="decimal" name="h" value="' + esc(c.h || '') + '"></label></div>' +
      '<button class="btn block">Kaydet</button>' + (c.id ? '<button type="button" class="btn danger block mt-s" data-act="clientDelete" data-id="' + c.id + '">Danışanı sil</button>' : '') + '</form>';
  }
  DA.actions.clientNew = () => DA.sheet('Yeni danışan', clientForm());
  DA.actions.clientEdit = (el) => DA.sheet('Danışanı düzenle', clientForm(clients().find((c) => c.id === el.dataset.id)));
  DA.forms.client = (f) => {
    const d = DA.formData(f); if (!d.name.trim()) return;
    const S = DA.state();
    if (f.dataset.id) {
      const c = S.clients.find((x) => x.id === f.dataset.id); Object.assign(c, { name: d.name.trim(), sex: d.sex, birth: num(d.birth) || null, h: num(d.h) || null }); DA.save(); DA.closeSheet(); DA.render(true);
    } else {
      const c = { id: uid(), name: d.name.trim(), sex: d.sex, birth: num(d.birth) || null, h: num(d.h) || null, note: '', meas: [] };
      S.clients.push(c); DA.save(); DA.closeSheet(); DA.go('danisan/' + c.id);
    }
  };
  DA.actions.clientDelete = (el) => {
    if (!confirm('Danışan ve tüm ölçümleri silinsin mi?')) return;
    const S = DA.state(); S.clients = S.clients.filter((c) => c.id !== el.dataset.id); DA.save(); DA.closeSheet(); DA.go('danisan');
  };

  function measForm(cid, x) {
    x = x || {};
    return '<form data-form="meas" data-id="' + cid + '" data-mid="' + (x.id || '') + '"><label class="fld"><span>Tarih</span><input type="date" name="d" value="' + (x.d || DA.today()) + '" required></label>' +
      '<div class="grid2"><label class="fld"><span>Kilo (kg)</span><input type="text" inputmode="decimal" name="w" value="' + esc(x.w || '') + '"></label><label class="fld"><span>Yağ %</span><input type="text" inputmode="decimal" name="fat" value="' + esc(x.fat || '') + '"></label>' +
      '<label class="fld"><span>Bel (cm)</span><input type="text" inputmode="decimal" name="waist" value="' + esc(x.waist || '') + '"></label><label class="fld"><span>Kalça (cm)</span><input type="text" inputmode="decimal" name="hip" value="' + esc(x.hip || '') + '"></label></div>' +
      '<label class="fld"><span>Not</span><input type="text" name="note" value="' + esc(x.note || '') + '"></label><button class="btn block">Kaydet</button>' +
      (x.id ? '<button type="button" class="btn danger block mt-s" data-act="measDelete" data-id="' + cid + '" data-mid="' + x.id + '">Ölçümü sil</button>' : '') + '</form>';
  }
  DA.actions.measNew = (el) => DA.sheet('Ölçüm ekle', measForm(el.dataset.id));
  DA.actions.measEdit = (el) => { const c = clients().find((x) => x.id === el.dataset.id); DA.sheet('Ölçümü düzenle', measForm(c.id, c.meas.find((m) => m.id === el.dataset.mid))); };
  DA.forms.meas = (f) => {
    const d = DA.formData(f), c = clients().find((x) => x.id === f.dataset.id);
    const rec = { d: d.d, w: num(d.w) || null, fat: num(d.fat) || null, waist: num(d.waist) || null, hip: num(d.hip) || null, note: d.note.trim() };
    if (!rec.w && !rec.fat && !rec.waist && !rec.hip) return DA.toast('En az bir ölçüm değeri gir');
    if (f.dataset.mid) Object.assign(c.meas.find((m) => m.id === f.dataset.mid), rec); else c.meas.push(Object.assign({ id: uid() }, rec));
    DA.save(); DA.closeSheet(); DA.render(true);
  };
  DA.actions.measDelete = (el) => {
    if (!confirm('Ölçüm silinsin mi?')) return;
    const c = clients().find((x) => x.id === el.dataset.id); c.meas = c.meas.filter((m) => m.id !== el.dataset.mid); DA.save(); DA.closeSheet(); DA.render(true);
  };
})();
