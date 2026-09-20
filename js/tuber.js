/* TÜBER 2022 mikro besin ögeleri referans değerleri — yaş ve cinsiyete göre */
(function () {
  'use strict';
  const { esc, fmt } = DA;

  /* Yaş satırı eşleştirme: '7' tam yıl, '19-50' aralık, '≥70' ve üzeri.
     2–4 yaş kaynakta cinsiyet ayrımı olmadan 'cocuk' satırında verilmiştir. */
  function matchRow(tbl, sex, age) {
    const want = age < 5 ? 'cocuk' : sex;
    let best = null;
    tbl.r.forEach((row) => {
      if (row[0] !== want) return;
      const a = row[1];
      let hit = false;
      if (/^≥/.test(a)) hit = age >= parseFloat(a.replace('≥', ''));
      else if (a.indexOf('-') > 0) { const p = a.split('-'); hit = age >= +p[0] && age <= +p[1]; }
      else hit = Math.floor(age) === +a;
      if (hit) best = row;
    });
    return best;
  }

  const valText = (v) => (v == null ? '—' : Array.isArray(v) ? fmt(v[0], 2) + '–' + fmt(v[1], 2) : fmt(v, 2));

  /* Bir besin ögesinin adını tablolar arasında eşleştirmek için sadeleştir */
  const key = (n) => DA.trLower(n).replace(/\s*\(.*\)$/, '').trim();
  const EAR_ALIAS = { 'b1 vitamini': 'tiamin', 'b2 vitamini': 'riboflavin' };
  const norm = (n) => { const k = key(n); return EAR_ALIAS[k] || k; };

  /* PRI/AI + EAR + UL'yi tek tabloda birleştir */
  function merged(sex, age, vitOrMin) {
    const T = DA.data.tuber;
    const main = vitOrMin === 'vit' ? T.ek151 : T.ek152;
    const ul = vitOrMin === 'vit' ? T.ek154 : T.ek155;
    const ear = T.ek153;
    const rMain = matchRow(main, sex, age), rUl = matchRow(ul, sex, age), rEar = matchRow(ear, sex, age);
    if (!rMain) return null;

    const earIdx = {}, ulIdx = {};
    ear.c.forEach((c, i) => { earIdx[norm(c[0])] = i; });
    ul.c.forEach((c, i) => { ulIdx[norm(c[0])] = i; });

    return main.c.map((c, i) => {
      const k = norm(c[0]);
      const ei = earIdx[k], ui = ulIdx[k];
      return {
        n: c[0], u: c[1], ref: (main.ref && main.ref[i]) || '',
        val: rMain[2 + i],
        ear: (rEar && ei != null) ? rEar[2 + ei] : undefined,
        ul: (rUl && ui != null) ? rUl[2 + ui] : undefined
      };
    });
  }

  function tableHtml(rows, baslik) {
    if (!rows) return '';
    const anyEar = rows.some((r) => r.ear != null), anyUl = rows.some((r) => r.ul != null);
    return '<div class="sect">' + esc(baslik) + '</div><div class="scrollx"><table class="t"><thead><tr>' +
      '<th>Besin ögesi</th><th class="n">Öneri</th>' +
      (anyEar ? '<th class="n">EAR</th>' : '') + (anyUl ? '<th class="n">UL</th>' : '') +
      '<th>Birim</th></tr></thead><tbody>' +
      rows.map((r) => '<tr><td>' + esc(r.n) + (r.ref ? ' <span class="muted tiny">' + esc(r.ref) + '</span>' : '') + '</td>' +
        '<td class="n"><b>' + valText(r.val) + '</b></td>' +
        (anyEar ? '<td class="n">' + valText(r.ear) + '</td>' : '') +
        (anyUl ? '<td class="n">' + valText(r.ul) + '</td>' : '') +
        '<td>' + esc(r.u) + '</td></tr>').join('') +
      '</tbody></table></div>';
  }

  DA.calcs.push({
    id: 'tuber', title: 'TÜBER referans değerleri', desc: 'Yaşa ve cinsiyete göre vitamin-mineral önerisi, EAR ve üst sınır', ico: 'book',
    fields: [
      { k: 'sex', l: 'Cinsiyet', t: 'sex' },
      { k: 'age', l: 'Yaş (yıl)', t: 'num', ph: 'örn. 31', rng: [2, 120, 'yaş'] }
    ],
    req: ['age'],
    run(v) {
      const age = v.age;
      if (!(age >= 2)) return { err: 'TÜBER Ek 1.5 tabloları 2 yaş ve üzeri içindir. 0–2 yaş için Tablo 7.6–7.7 gerekir.' };
      if (age > 120) return { err: 'Geçerli bir yaş gir.' };

      const vit = merged(v.sex, age, 'vit'), min = merged(v.sex, age, 'min');
      if (!vit) return { err: 'Bu yaş için tabloda satır bulunamadı.' };

      const grup = age < 5 ? '2–4 yaş (cinsiyet ayrımı yok)' :
        (v.sex === 'K' ? 'Kadın' : 'Erkek') + ' · ' + (matchRow(DA.data.tuber.ek151, v.sex, age) || [, ''])[1] + ' yaş';

      const rows = [{ l: 'Referans grubu', v: grup, s: 'TÜBER 2022, Ek 1.5.1–1.5.5', hl: true }];
      return {
        rows,
        html: tableHtml(vit, 'Vitaminler') + tableHtml(min, 'Mineraller') +
          '<details class="acc mt"><summary>Kısaltmalar ve okuma notu</summary><div class="body"><ul>' +
          '<li><b>Öneri</b> — sütun başındaki etikete göre <b>PRI</b> (nüfusun büyük kısmının gereksinimini karşılayan alım) ya da <b>AI</b> (yeterli alım; PRI hesaplanamadığında kullanılır).</li>' +
          '<li><b>EAR</b> — ortalama tahmini gereksinim; nüfusun yarısının gereksinimini karşılar. Bireysel yeterlilik değerlendirmesinde kullanılır, hedef olarak değil.</li>' +
          '<li><b>UL</b> — tolere edilebilir en yüksek günlük alım. Hedef değildir; takviye kullanımında aşılmamalıdır. “—” bu öge için UL belirlenmemiş demektir.</li>' +
          '<li>Aralıklı değerler kaynakta da aralıktır: kadında <b>demir 11–16 mg</b> (postmenopozal–premenopozal), <b>çinko</b> aralıkları diyetin fitat düzeyine göre değişir.</li>' +
          '<li>Niasin ve tiamin <b>1000 kkal başına</b> verilmiştir; günlük miktar için enerji alımıyla çarpın.</li>' +
          '</ul></div></details>',
        note: 'Kaynak: T.C. Sağlık Bakanlığı, Türkiye Beslenme Rehberi (TÜBER) 2022, Ek 1.5.1–1.5.5 (s. 254–258). Gebelik ve emzirme dönemi için ayrı tablo (Tablo 7.9) geçerlidir.',
        tone: 'info'
      };
    }
  });
})();
