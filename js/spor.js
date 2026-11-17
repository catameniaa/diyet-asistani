/* Spor beslenmesi — ikinci grup hesaplayıcılar (Kasım 2026).
   TÜBER 2022 Bölüm 8.2'ye dayalı temel plan js/sporcu.js'de. Buradakiler
   onun vermediği ayrıntılar: antrenman gününe göre değişen karbonhidrat,
   müsabaka günü ve toparlanma, deri kıvrımından vücut yağı, takviye dozları.
   Değerler js/data-sporperf.js'de, kaynaklarıyla. */
(function () {
  'use strict';
  const { esc, fmt } = DA;
  const P = () => DA.data.sporperf;
  const R = (l, v, s, hl) => ({ l, v, s, hl });
  const ara = (a, b, d) => fmt(a, d == null ? 0 : d) + '–' + fmt(b, d == null ? 0 : d);
  const num_ = (k, l, ph, opt, rng) => ({ k, l, t: 'num', ph: ph || '', opt: !!opt, rng });
  const GUNLER = [['pzt', 'Pazartesi'], ['sal', 'Salı'], ['car', 'Çarşamba'], ['per', 'Perşembe'], ['cum', 'Cuma'], ['cmt', 'Cumartesi'], ['paz', 'Pazar']];

  /* ---------------- Antrenman gününe göre karbonhidrat ---------------- */
  /* Neden ayrı: TÜBER planı tek bir antrenman yükü için günlük hedef veriyor.
     Sporcu haftada ağır, hafif ve dinlenme günlerini karıştırıyor; aynı KH'yi
     her gün yazmak dinlenme gününde fazla, çift antrenmanda az kalıyor. */
  DA.calcs.push({
    id: 'sporkh', data: ['sporperf'], title: 'Antrenman gününe göre karbonhidrat',
    desc: 'Haftalık plan · her gün antrenman yüküne göre g/kg (ACSM 2016)', ico: 'run',
    fields: [num_('w', 'Vücut ağırlığı (kg)')].concat(GUNLER.map((g, i) => ({
      k: g[0], l: g[1], t: 'sel', def: i === 6 ? 'hafif' : 'orta',
      o: () => (P() ? P().khGun.map((b) => [b.k, b.l + ' · ' + b.g[0] + '–' + b.g[1] + ' g/kg']) : [])
    }))),
    req: ['w'],
    run(v) {
      const D = P(), w = v.w;
      let alt = 0, ust = 0;
      const rows = GUNLER.map((g) => {
        const b = D.khGun.find((x) => x.k === v[g[0]]) || D.khGun[1];
        alt += b.g[0] * w; ust += b.g[1] * w;
        return R(g[1] + ' · ' + b.l, ara(b.g[0] * w, b.g[1] * w) + ' g', b.g[0] + '–' + b.g[1] + ' g/kg · ' + b.d);
      });
      rows.push(R('Haftalık karbonhidrat', ara(alt, ust) + ' g', 'Günlük ortalama ' + ara(alt / 7, ust / 7) + ' g', true));
      rows.push(R('Protein (her gün)', ara(D.protein.gun[0] * w, D.protein.gun[1] * w) + ' g',
        ara(D.protein.gun[0], D.protein.gun[1], 1) + ' g/kg · antrenman yükünden bağımsız', true));
      rows.push(R('Protein dozu', fmt(D.protein.doz * w, 0) + ' g',
        fmt(D.protein.doz, 1) + ' g/kg · anahtar antrenmandan sonra ve gün boyunca ' + D.protein.araSaat[0] + '–' + D.protein.araSaat[1] + ' saatte bir'));
      return { rows,
        note: 'Kaynak: Thomas, Erdman, Burke 2016 (ACSM/AND/DC), Tablo 1. TÜBER 2022 aynı yükler için 5–10 g/kg verir; '
          + 'tek günlük plan için "Sporcu beslenme planı"na bak. Bantlar başlangıç noktasıdır; sporcunun hedefi, '
          + 'antrenmanın amacı ve enerji dengesiyle birlikte değerlendirilir.',
        tone: 'info' };
    }
  });

  /* ---------------- Müsabaka günü ve toparlanma ---------------- */
  DA.calcs.push({
    id: 'sporyaris', data: ['sporperf'], title: 'Müsabaka günü ve toparlanma',
    desc: 'Yükleme, müsabaka öncesi, sırası ve hızlı toparlanma karbonhidratı (ACSM 2016)', ico: 'flame',
    fields: [
      num_('w', 'Vücut ağırlığı (kg)'),
      num_('dk', 'Müsabaka süresi (dakika)', 'örn. 120', false, [1, 1440, 'dk']),
      num_('ara', 'Sonraki yorucu seansa kadar (saat)', 'iki seans varsa', true, [0, 72, 'saat'])
    ],
    req: ['w', 'dk'],
    run(v) {
      const Y = P().yakit, P_ = P().protein, w = v.w;
      const rows = [];
      if (v.dk > Y.yukleme.esikDk) {
        rows.push(R('Karbonhidrat yüklemesi', ara(Y.yukleme.g[0] * w, Y.yukleme.g[1] * w) + ' g/gün',
          Y.yukleme.g[0] + '–' + Y.yukleme.g[1] + ' g/kg · müsabakadan önceki ' + Y.yukleme.saat[0] + '–' + Y.yukleme.saat[1] + ' saat', true));
      } else {
        rows.push(R('Müsabaka öncesi gün', ara(Y.genel.g[0] * w, Y.genel.g[1] * w) + ' g/gün',
          Y.genel.g[0] + '–' + Y.genel.g[1] + ' g/kg · ' + Y.yukleme.esikDk + ' dakikadan kısa müsabaka; yükleme gerekmez', true));
      }
      rows.push(R('Müsabakadan ' + Y.once.saat[0] + '–' + Y.once.saat[1] + ' saat önce', ara(Y.once.g[0] * w, Y.once.g[1] * w) + ' g',
        Y.once.g[0] + '–' + Y.once.g[1] + ' g/kg · ' + Y.once.n));
      const s = Y.sirasinda.find((x) => v.dk <= x.maxDk);
      rows.push(R('Müsabaka sırasında', s.l, s.gSaat
        ? fmt(v.dk, 0) + ' dakika için toplam ' + (s.gSaat[0] ? ara(s.gSaat[0] * v.dk / 60, s.gSaat[1] * v.dk / 60) : fmt(s.gSaat[1] * v.dk / 60, 0) + ' g’a kadar') + (s.gSaat[0] ? ' g' : '')
        : fmt(v.dk, 0) + ' dakikalık müsabaka'));
      if (isFinite(v.ara)) {
        if (v.ara < Y.hizli.aralikEsik) {
          rows.push(R('Hızlı toparlanma', ara(Y.hizli.gSaat[0] * w, Y.hizli.gSaat[1] * w) + ' g/saat',
            fmt(Y.hizli.gSaat[0], 1) + '–' + fmt(Y.hizli.gSaat[1], 1) + ' g/kg/saat · ilk ' + Y.hizli.ilkSaat + ' saat, toplam ' +
            ara(Y.hizli.gSaat[0] * w * Y.hizli.ilkSaat, Y.hizli.gSaat[1] * w * Y.hizli.ilkSaat) + ' g', true));
        } else {
          rows.push(R('Toparlanma', 'Günlük gereksinim', 'Seanslar arası ' + fmt(v.ara, 0) + ' saat: özel bir hızlı yükleme gerekmez, günlük karbonhidrat hedefi öğünlere yayılır'));
        }
      }
      rows.push(R('Toparlanma proteini', fmt(P_.doz * w, 0) + ' g', fmt(P_.doz, 1) + ' g/kg · müsabakadan sonra, sonra ' + P_.araSaat[0] + '–' + P_.araSaat[1] + ' saatte bir'));
      return { rows,
        note: 'Kaynak: Thomas, Erdman, Burke 2016 (ACSM/AND/DC), Tablo 2. TÜBER 2022 toparlanmada ilk 30 dakika–2 saat içinde '
          + '1–1,5 g/kg ve 20–25 g protein önerir. Müsabakada denenmemiş hiçbir besin ya da içecek kullanılmamalı.',
        tone: 'info' };
    }
  });

  /* ---------------- Deri kıvrımı ile vücut yağı ---------------- */
  /* Neden: vücut yağ % alanı elle giriliyordu; deri kıvrımı ölçen diyetisyen
     hesabı başka yerde yapıp kopyalıyordu. Yöntem seçtirilmez: hangi
     yöntemin bütün bölgeleri girildiyse o hesaplanır, birden fazlası yan yana. */
  const KIVRIM = [['gogus', 'Göğüs'], ['aksiller', 'Aksiller (orta koltuk altı)'], ['triseps', 'Triseps'], ['biseps', 'Biseps'],
    ['subskapular', 'Subskapular'], ['abdominal', 'Abdominal'], ['suprailiak', 'Suprailiak'], ['uyluk', 'Uyluk']];
  const ADI = Object.fromEntries(KIVRIM);
  DA.calcs.push({
    id: 'derikivrim', data: ['sporperf'], title: 'Deri kıvrımı ile vücut yağı',
    desc: 'Durnin–Womersley ve Jackson–Pollock (3 ve 7 bölge), Siri ile % yağ', ico: 'tape',
    fields: [{ k: 'sex', t: 'sex' }, num_('age', 'Yaş (yıl)'), num_('w', 'Vücut ağırlığı (kg, yağsız kütle için)', '', true)]
      .concat(KIVRIM.map((x) => num_(x[0], x[1] + ' (mm)', '', true, [2, 80, 'mm']))),
    req: ['age'],
    run(v) {
      const D = P(), E = v.sex !== 'K', sonuc = [], uyari = [];
      const siri = (d) => D.siri[0] / d - D.siri[1];
      const tamam = (b) => b.every((k) => isFinite(v[k]) && v[k] > 0);
      const topla = (b) => b.reduce((t, k) => t + v[k], 0);
      /* Durnin–Womersley: yaş aralığı tablonun dışındaysa katsayı yok */
      const dwB = ['biseps', 'triseps', 'subskapular', 'suprailiak'];
      if (tamam(dwB)) {
        const sat = D.dw[E ? 'E' : 'K'].find((x) => v.age >= x.min && v.age <= x.max);
        if (sat) {
          const s = topla(dwB), d = sat.c - sat.m * Math.log10(s);
          sonuc.push({ l: 'Durnin–Womersley (4 bölge)', s, d, y: siri(d) });
        } else uyari.push('Durnin–Womersley denklemi ' + (E ? '17–72' : '16–68') + ' yaş için geliştirildi; bu yaşta hesaplanmadı.');
      }
      [['3', 'Jackson–Pollock (3 bölge)'], ['7', 'Jackson–Pollock (7 bölge)']].forEach((j) => {
        const q = D.jp[(E ? 'E' : 'K') + j[0]];
        if (!tamam(q.bolge)) return;
        const s = topla(q.bolge), d = q.a - q.b * s + q.c * s * s - q.d * v.age;
        sonuc.push({ l: j[1], s, d, y: siri(d) });
        if (v.age < q.yas[0] || v.age > q.yas[1]) uyari.push(j[1] + ' ' + q.yas[0] + '–' + q.yas[1] + ' yaş örnekleminden türetildi; bu yaşta sonuç güvenilir değil.');
      });
      if (!sonuc.length) {
        const j3 = D.jp[(E ? 'E' : 'K') + '3'].bolge.map((k) => ADI[k].split(' (')[0]).join(', ');
        return { err: 'Bir yöntemin bütün bölgelerini gir. Durnin–Womersley: biseps, triseps, subskapular, suprailiak · '
          + 'Jackson–Pollock 3 bölge (' + (E ? 'erkek' : 'kadın') + '): ' + j3 + ' · Jackson–Pollock 7 bölge: biseps hariç yedisi.' };
      }
      const rows = sonuc.map((x, i) => R(x.l, '%' + fmt(x.y, 1),
        'Toplam ' + fmt(x.s, 1) + ' mm · yoğunluk ' + fmt(x.d, 4) + ' g/mL', i === 0));
      if (isFinite(v.w) && v.w > 0) {
        const y = sonuc[0].y;
        rows.push(R('Yağ kütlesi', fmt(v.w * y / 100, 1) + ' kg', sonuc[0].l + ' sonucuyla'));
        rows.push(R('Yağsız kütle', fmt(v.w * (1 - y / 100), 1) + ' kg', 'Kullanılabilir enerji hesabında payda'));
      }
      return { rows,
        html: '<a class="btn ghost sm mt" href="#/hesapla/sporke">' + DA.icon('battery') + ' Kullanılabilir enerji (RED-S)</a>',
        note: (uyari.length ? uyari.join(' ') + ' ' : '') + 'Yoğunluktan yağ %: Siri (495 / yoğunluk − 450). Ölçüm sağ taraftan, '
          + 'kıvrım tutulduktan ~2 saniye sonra okunur; her bölge 2–3 kez ölçülüp ortalaması alınır. Aynı danışanı izlerken '
          + 'hep aynı yöntem ve kaliper kullanılmalı: yöntemler arası fark, zaman içindeki değişimden büyük olabilir.',
        tone: uyari.length ? 'warn' : 'info' };
    }
  });

  /* ---------------- Takviye rehberi (IOC 2018) ---------------- */
  DA.calcs.push({
    id: 'takviye', data: ['sporperf'], title: 'Takviye rehberi',
    desc: 'Kanıtı yeterli performans takviyeleri ve kiloya göre doz (IOC 2018)', ico: 'flask',
    fields: [
      num_('w', 'Vücut ağırlığı (kg)'),
      { k: 'tk', l: 'Takviye', t: 'sel', def: 'tumu',
        o: () => [['tumu', 'Hepsi']].concat(P() ? P().takviye.map((t) => [t.k, t.l]) : []) }
    ],
    req: ['w'],
    run(v) {
      const D = P(), w = v.w;
      const secili = D.takviye.filter((t) => v.tk === 'tumu' || t.k === v.tk);
      const doz = (t) => {
        if (!t.kg) return t.sabit;
        const a = t.kg[0] * w, b = t.kg[1] * w, gr = t.birim === 'mg' && b >= 1000;
        const yaz = (x) => (gr ? fmt(x / 1000, 2) + ' g' : fmt(x, t.birim === 'g' ? 1 : 0) + ' ' + t.birim);
        return (a === b ? yaz(a) : (gr ? fmt(a / 1000, 2) + '–' + fmt(b / 1000, 2) + ' g' : ara(a, b, t.birim === 'g' ? 1 : 0) + ' ' + t.birim)) +
          (t.gunluk ? '/gün' : '') + ' (' + (t.kg[0] === t.kg[1] ? fmt(t.kg[0], 1) : fmt(t.kg[0], 1) + '–' + fmt(t.kg[1], 1)) + ' ' + t.birim + '/kg)';
      };
      const rows = secili.map((t) => R(t.l, t.kg ? doz(t).split(' (')[0] : 'Sabit doz', t.kg ? doz(t).split(' (')[1].replace(')', '') + ' · ' + t.kanit : t.kanit, secili.length === 1));
      return { rows,
        html: secili.map((t) => '<details class="acc"' + (secili.length === 1 ? ' open' : '') + '><summary>' + esc(t.l) +
          ' <span class="badge ' + (t.kanit === 'İyi kanıt' ? 'ok' : 'warn') + '">' + esc(t.kanit) + '</span></summary><div class="body">' +
          '<p><b>Doz:</b> ' + esc(doz(t)) + '</p><p><b>Kullanım:</b> ' + esc(t.p) + '</p>' + (t.alt ? '<p><b>Alternatif:</b> ' + esc(t.alt) + '</p>' : '') +
          '<p><b>Yan etki:</b> ' + esc(t.y) + '</p></div></details>').join(''),
        note: D.takviyeN + ' Kaynak: Maughan ve ark. 2018, IOC uzlaşı bildirgesi, Tablo 3.',
        tone: 'warn' };
    }
  });
})();
