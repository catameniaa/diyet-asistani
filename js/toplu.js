/* Toplu beslenme menü taslağı — hafta içi aylık menü (sabah 3, öğle 4,
   akşam 4 kap). Diyetetik derslerindeki "30 günlük menü taslağı" ödevinin
   biçimi: Gün | Sabah | Öğle | Akşam, gün numarasının yanında gün adı,
   hafta sonu yok.

   Kurallar Ulusal Menü Planlama ve Uygulama Rehberi'nden (2020; ayrıntı ve
   sayfa numaraları js/data-toplu.js başında):
     · 4 kaplı menüde ilk üç kap üç ayrı gruptan (1. ana yemek, 2. çorba/
       pilav/börek/zeytinyağlı, 3. salata/yoğurt/meyve/tatlı); dördüncü kap
       2. ya da 3. gruptan, ötekilerle uyumlu.
     · Sebze yemeğinin yanına zeytinyağlı sebze ve salata, zeytinyağlı
       sebzenin yanına salata, etli dolmanın yanına pilav, çorbanın yanına
       komposto-hoşaf-ayran-cacık, pilavın yanına tatlı ya da börek verilmez;
       etli kuru baklagilin yanına pilav verilir; benzer içerikli yemekler
       aynı menüde verilmez.
     · Kahvaltıda yumurta ve/veya peynir mutlaka.
   Dyt. Can Bayramoğlu'nun kuralı: çorba bir kap sayılır (2. grup yemeği
   olarak) ve öğünün başına yazılır; her gün verilmez.

   Dağıtım: 1. ve 2. kap Tablo 4.5'in asgari sayılarıyla (21 güne göre
   ölçeklenir, eksik gün sıradaki alt gruba azamiyi geçmeden eklenir).
   Tablonun asgari toplamları günde bir 1., bir 2., bir 3. grup yemeğine
   denk geliyor; 3. kap da asgariyle, 4. kap azamiye oranla yayılır.
   Seçimler tohumla döner ("Yeniden dağıt"); elle değiştirilen kap
   saklanır ve denetim her değişiklikte yeniden yapılır. */
(function () {
  'use strict';
  const { esc, icon } = DA;
  const D = () => DA.data.toplu;
  const GUN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const OGUN = [['sabah', 'Sabah'], ['ogle', 'Öğle'], ['aksam', 'Akşam']];

  const K1 = ['bparca', 'kparca', 'kofte', 'balik', 'tavuk', 'sebzeDolma', 'etlibaklagil'];
  const K1_SIRA = ['sebzeDolma', 'tavuk', 'kofte', 'kparca', 'bparca', 'etlibaklagil', 'balik'];
  const K2 = ['corba', 'pilav', 'borek', 'zysebze', 'zybaklagil'];
  const K2_SIRA = ['corba', 'zybaklagil', 'pilav', 'borek', 'zysebze'];
  const K3 = ['salata', 'meyve', 'yogurt', 'ayran', 'komposto', 'sutlu', 'tatli'];
  const K3_SIRA = ['meyve', 'salata', 'ayran', 'sutlu', 'yogurt', 'komposto', 'tatli'];
  /* Kahvaltı düzeni Pazartesi–Cuma: yumurta haftada üç gün, öteki günler
     peynir; zeytin, tatlı kahvaltılık, çiğ sebze ve meyve dönüşümlü. */
  const KAHVALTI = [['yumurta', 'peynir', 'zeytin'], ['peynir', 'kahvaltilik', 'cigsebze'], ['yumurta', 'zeytin', 'cigsebze'],
    ['peynir', 'zeytin', 'kmeyve'], ['yumurta', 'peynir', 'cigsebze']];

  const U = () => { const ui = DA.state().ui = DA.state().ui || {}; return (ui.toplu = ui.toplu && typeof ui.toplu === 'object' ? ui.toplu : {}); };
  const yemek = (id) => D().YEMEK.find((y) => y.id === id) || null;
  const altOf = (id) => { const y = yemek(id); return y ? y.a : ''; };
  const grupOf = (id) => { const a = D().ALT[altOf(id)]; return a ? a.g || 0 : 0; };
  const tabloOf = (id) => { const a = D().ALT[altOf(id)]; return a ? a.t || '' : ''; };

  /* ---- takvim ---- */
  function sonrakiAy() {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }
  const ayGecerli = (a) => typeof a === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(a);
  /* Ayın hafta içi günleri; gün adı tarihten hesaplanır */
  function gunler(ay) {
    const y = +ay.slice(0, 4), m = +ay.slice(5, 7), son = new Date(y, m, 0).getDate(), out = [];
    for (let no = 1; no <= son; no++) {
      const g = new Date(y, m - 1, no).getDay();
      if (g >= 1 && g <= 5) out.push({ d: ay + '-' + String(no).padStart(2, '0'), no, g });
    }
    return out;
  }
  /* Rehberin okunan kısmında kış/yaz sınırı yok: Nisan–Eylül yaz varsayıldı,
     ekrandan değiştirilir. */
  const mevsimOf = (ay, secim) => (secim === 'kis' || secim === 'yaz' ? secim : (+ay.slice(5, 7) >= 4 && +ay.slice(5, 7) <= 9 ? 'yaz' : 'kis'));

  /* ---- kota ----
     Tablo 4.5 asgarisi gün sayısına ölçeklenir (aşağı yuvarlanır); eksik
     kalan gün sıradaki alt gruplara birer birer, önce azamiyi geçmeden,
     yetmezse geçerek eklenir. 21 günde asgari değerlerin kendisi çıkar. */
  function kota(anahtar, mev, N, sira) {
    const T = D().TABLO45, yaz = mev === 'yaz', r = N / 21, q = {}, ust = {};
    anahtar.forEach((k) => { q[k] = Math.floor(T[k][yaz ? 4 : 3] * r + 1e-9); ust[k] = Math.floor(T[k][yaz ? 2 : 1] * r + 1e-9); });
    let top = anahtar.reduce((a, k) => a + q[k], 0);
    for (let i = 0; top > N; i++) { const k = sira[sira.length - 1 - (i % sira.length)]; if (q[k] > 0) { q[k]--; top--; } }
    let dur = false;
    while (top < N && !dur) { dur = true; sira.forEach((k) => { if (top < N && q[k] < ust[k]) { q[k]++; top++; dur = false; } }); }
    for (let i = 0; top < N; i++) { q[sira[i % sira.length]]++; top++; }
    return q;
  }

  /* ---- uyum kuralları ---- */
  const etiket = (id) => { const y = yemek(id); return y ? y.e : ''; };
  /* İki yemek birlikte verilebilir mi? Verilemezse kural kimliği. */
  function uyumsuz(a, b) {
    const x = altOf(a), y = altOf(b);
    const iki = (p, q) => (x === p && y === q) || (x === q && y === p);
    if (iki('etlisebze', 'zysebze')) return 'sebzeZy';
    if (iki('etlisebze', 'salata')) return 'sebzeSalata';
    if (iki('zysebze', 'salata')) return 'zySalata';
    if (iki('dolma', 'pilav')) return 'dolmaPilav';
    if (iki('corba', 'ayran') || iki('corba', 'komposto')) return 'corbaYan';
    if (iki('pilav', 'sutlu') || iki('pilav', 'tatli') || iki('pilav', 'borek')) return 'pilavTatli';
    const eb = etiket(b).split(' ');
    if (etiket(a).split(' ').some((t) => t && eb.indexOf(t) >= 0)) return 'benzer';
    if (x && x === y) return 'ayniAlt';
    return '';
  }
  const KURAL = {
    birinci: 'Öğünde tek bir 1. grup ana yemek olmalı',
    sebzeZy: 'Sebze yemeğinin yanına zeytinyağlı sebze verilmez',
    sebzeSalata: 'Sebze yemeğinin yanına salata verilmez',
    zySalata: 'Zeytinyağlı sebzenin yanına salata verilmez',
    dolmaPilav: 'Etli dolma ve sarmanın yanına pilav verilmez',
    baklagilPilav: 'Etli kuru baklagilin yanına pilav verilir',
    corbaYan: 'Çorbanın yanına komposto, hoşaf, ayran ya da cacık verilmez',
    pilavTatli: 'Pilav ya da makarnanın yanına tatlı ya da börek verilmez',
    benzer: 'Benzer içerikli iki yemek aynı öğünde',
    ayniAlt: 'Aynı alt gruptan iki yemek',
    kahvaltiProtein: 'Kahvaltıda yumurta ya da peynir yok',
    tekrar: 'Aynı yemek art arda iki gün',
    ayniGun: 'Öğle ve akşamın ana yemeği aynı alt gruptan',
    ayniYemek: 'Aynı yemek öğle ve akşamda'
  };
  /* Alt grubunda tek seçenek olan genel kalem ("Mevsim meyvesi", "Yoğurt")
     tekrar sayılmaz: her gün aynı adla yazılır. */
  const tekil = (id) => { const a = altOf(id); return D().YEMEK.filter((y) => y.a === a).length < 2; };
  /* Öğün içi denetim → [{k, d}] */
  function denetle(kaplar, ogun) {
    const out = [], ekle = (k, d) => { if (!out.some((x) => x.k === k && x.d === d)) out.push({ k, d: d || '' }); };
    if (ogun === 'sabah') {
      if (!kaplar.some((id) => ['yumurta', 'peynir'].indexOf(altOf(id)) >= 0)) ekle('kahvaltiProtein');
      return out;
    }
    const g1 = kaplar.filter((id) => grupOf(id) === 1);
    if (g1.length !== 1) ekle('birinci', g1.length ? g1.length + ' ana yemek' : 'ana yemek yok');
    for (let i = 0; i < kaplar.length; i++) {
      for (let j = i + 1; j < kaplar.length; j++) {
        const k = uyumsuz(kaplar[i], kaplar[j]);
        if (k) ekle(k, yemek(kaplar[i]).ad + ' + ' + yemek(kaplar[j]).ad);
      }
    }
    if (kaplar.some((id) => altOf(id) === 'etlibaklagil') && !kaplar.some((id) => altOf(id) === 'pilav')) ekle('baklagilPilav');
    return out;
  }

  /* Onarım: açgözlü seçim ayın sonunda tek alt grup bırakabiliyor (ör. son
     gün öğle ve akşam ikisi de köfte). Çakışan gün, çakışmayı çözen başka
     bir günle yer değiştirir; sayılar değişmez. Çözmeyen değiş tokuş geri
     alınır: körlemesine değiş tokuş çakışmayı başka güne taşıyabilirdi. */
  function onar(dizi1, N) {
    const cakisir = (o, i) => {
      const k = dizi1[o][i], ob = o === 'ogle' ? 'aksam' : 'ogle';
      return dizi1[ob][i] === k || (i > 0 && dizi1[o][i - 1] === k) || (i < N - 1 && dizi1[o][i + 1] === k);
    };
    ['aksam', 'ogle'].forEach((o) => {
      for (let i = N - 1; i >= 0; i--) {
        if (!cakisir(o, i)) continue;
        for (let j = 0; j < N; j++) {
          if (j === i || dizi1[o][j] === dizi1[o][i]) continue;
          const t = dizi1[o][i]; dizi1[o][i] = dizi1[o][j]; dizi1[o][j] = t;
          if (!cakisir(o, i) && !cakisir(o, j)) break;
          dizi1[o][j] = dizi1[o][i]; dizi1[o][i] = t;
        }
      }
    });
    return dizi1;
  }

  /* ---- üretim ----
     Tohum (s) seçim sırasını ve her alt grubun yemek sırasını döndürür. */
  function uret(ay, mev, s) {
    const G = gunler(ay), N = G.length, Y = D().YEMEK;
    const liste = {}; Y.forEach((y) => { (liste[y.a] = liste[y.a] || []).push(y.id); });
    const ptr = {};
    const dondur = (dizi, n) => dizi.slice(n % dizi.length).concat(dizi.slice(0, n % dizi.length));
    /* Alt gruptan, seçilenlerle uyumlu sıradaki yemek; haric: dünkü aynı öğün
       ve (akşamda) bugünkü öğle — aynı yemek art arda ya da aynı gün iki kez
       gelmesin. */
    function sec(alt, secilen, haric) {
      const L = liste[alt] || [];
      if (ptr[alt] == null) ptr[alt] = (s * 3) % (L.length || 1);
      for (let i = 0; i < L.length; i++) {
        const j = (ptr[alt] + i) % L.length, id = L[j];
        if (haric && haric.indexOf(id) >= 0 && L.length > 1) continue;
        if (secilen.some((x) => uyumsuz(x, id))) continue;
        ptr[alt] = j + 1;
        return id;
      }
      return null;
    }
    const menu = G.map((g) => ({ d: g.d, no: g.no, g: g.g, sabah: [], ogle: [], aksam: [] }));

    /* Kahvaltı */
    menu.forEach((m) => {
      const kalip = KAHVALTI[(m.g - 1 + s) % 5];
      kalip.forEach((a) => { const id = sec(a, m.sabah); if (id) m.sabah.push(id); });
    });

    /* 1. kap: öğle ve akşam birlikte; art arda gün ve aynı gün aynı alt grup
       verilmez, geçen haftanın aynı günü de olmamaya çalışılır. */
    const q1 = kota(K1, mev, N, K1_SIRA), kal1 = { ogle: Object.assign({}, q1), aksam: Object.assign({}, q1) };
    const sira1 = dondur(K1_SIRA, s), dizi1 = { ogle: [], aksam: [] };
    menu.forEach((m, i) => {
      ['ogle', 'aksam'].forEach((o) => {
        const onceki = i ? dizi1[o][i - 1] : null, ayniGun = o === 'aksam' ? dizi1.ogle[i] : null;
        const hafta = menu.findIndex((x) => x.no === m.no - 7), gecen = hafta >= 0 ? dizi1[o][hafta] : null;
        let en = null, puan = -Infinity;
        sira1.forEach((k) => {
          if (!(kal1[o][k] > 0)) return;
          const p = kal1[o][k] * 10 - (k === onceki ? 100 : 0) - (k === ayniGun ? 100 : 0) - (k === gecen ? 5 : 0);
          if (p > puan) { puan = p; en = k; }
        });
        en = en || sira1[i % sira1.length];
        kal1[o][en]--; dizi1[o].push(en);
      });
    });
    onar(dizi1, N);
    let sdSay = 0;
    menu.forEach((m, i) => {
      ['ogle', 'aksam'].forEach((o) => {
        const en = dizi1[o][i];
        const alt = en === 'sebzeDolma' ? (sdSay++ % 3 === 2 ? 'dolma' : 'etlisebze') : en;
        /* Öğle ile akşamın ana yemeği zaten ayrı alt gruptan (onarım): yalnız
           dünkü yemek dışarıda tutulur. */
        const haric = i ? menu[i - 1][o] : [];
        const id = sec(alt, [], haric) || sec(en === 'sebzeDolma' ? 'etlisebze' : alt, [], null);
        m[o] = [id];
      });
    });

    /* 2., 3. ve 4. kap: her öğün kendi kotasıyla */
    ['ogle', 'aksam'].forEach((o) => {
      const kal2 = kota(K2, mev, N, K2_SIRA), kal3 = kota(K3, mev, N, K3_SIRA);
      const ust = {}, say = {};
      K3.forEach((k) => { ust[k] = D().TABLO45[k][mev === 'yaz' ? 2 : 1]; say[k] = 0; });
      const sira2 = dondur(K2_SIRA, s), sira3 = dondur(K3_SIRA, s);
      let once2 = null, once3 = null;
      menu.forEach((m, i) => {
        const k1 = m[o][0], a1 = altOf(k1), dun = (i ? menu[i - 1][o] : []).concat(o === 'aksam' ? m.ogle : []);
        /* Akşam, öğlenin 2. grup türünü (ör. ikinci çorba) sona bırakır */
        const ogle2 = o === 'aksam' ? altOf(m.ogle.find((id) => grupOf(id) === 2)) : null;
        /* Etli kuru baklagilin yanına pilav: kalan baklagil günleri için pilav ayrılır */
        const ayrilan = menu.slice(i + 1).filter((x) => altOf(x[o][0]) === 'etlibaklagil').length;
        let k2 = null, a2 = null;
        const dene2 = (adaylar) => {
          for (const a of adaylar) { const id = sec(a, [k1], dun); if (id) { k2 = id; a2 = a; return true; } }
          return false;
        };
        if (a1 === 'etlibaklagil') dene2(['pilav']);
        else {
          const uygun = sira2.filter((a) => (a !== 'pilav' || kal2.pilav - ayrilan > 0) && kal2[a] > 0)
            .sort((x, y) => (y !== once2) - (x !== once2) || (y !== ogle2) - (x !== ogle2) || kal2[y] - kal2[x] || sira2.indexOf(x) - sira2.indexOf(y));
          if (!dene2(uygun)) dene2(sira2.filter((a) => a !== once2).concat([once2]).filter(Boolean));
        }
        if (a2 && kal2[a2] > 0) kal2[a2]--;
        once2 = a2;
        const secilen = [k1].concat(k2 ? [k2] : []);
        /* 3. kap kotadan, 4. kap azamiye oranla en az kullanılandan */
        let k3 = null, a3 = null;
        const uygun3 = sira3.filter((a) => kal3[a] > 0).sort((x, y) => (y !== once3) - (x !== once3) || kal3[y] - kal3[x] || sira3.indexOf(x) - sira3.indexOf(y));
        for (const a of uygun3.concat(sira3)) { const id = sec(a, secilen, dun); if (id) { k3 = id; a3 = a; break; } }
        if (a3) { if (kal3[a3] > 0) kal3[a3]--; say[a3]++; }
        once3 = a3;
        if (k3) secilen.push(k3);
        let k4 = null;
        const sira4 = sira3.slice().sort((x, y) => (say[x] + 1) / ust[x] - (say[y] + 1) / ust[y] || sira3.indexOf(x) - sira3.indexOf(y));
        for (const a of sira4) { if (a === a3) continue; const id = sec(a, secilen, dun); if (id) { k4 = id; say[a]++; break; } }
        /* Yazım sırası: çorba başta, sonra ana yemek */
        m[o] = (a2 === 'corba' ? [k2, k1] : [k1, k2]).concat([k3, k4]).filter(Boolean);
      });
    });
    return menu;
  }

  /* Elle değiştirilen kaplar üretilen menünün üstüne */
  function menuSon(u) {
    const ay = ayGecerli(u.ay) ? u.ay : sonrakiAy(), mev = mevsimOf(ay, u.mevsim);
    const s = Number.isInteger(u.tohum) && u.tohum >= 0 ? u.tohum : 0;
    const M = uret(ay, mev, s), dg = u.degis && typeof u.degis === 'object' ? u.degis : {};
    M.forEach((m) => OGUN.forEach((o) => {
      m[o[0]] = m[o[0]].map((id, i) => { const v = dg[m.d + '|' + o[0] + '|' + i]; return v && yemek(v) ? v : id; });
      m[o[0] + 'Elle'] = m[o[0]].map((id, i) => !!dg[m.d + '|' + o[0] + '|' + i]);
    }));
    return { ay, mev, s, M };
  }
  /* Bütün denetim: öğün içi + günler arası */
  function notlar(M) {
    const out = [];
    M.forEach((m, i) => {
      OGUN.forEach((o) => denetle(m[o[0]], o[0]).forEach((x) => out.push({ d: m.d, o: o[0], k: x.k, x: x.d })));
      const ao = altOf(m.ogle[ogleAna(m.ogle)]), aa = altOf(m.aksam[ogleAna(m.aksam)]);
      if (ao && ao === aa && grupOf(m.ogle[ogleAna(m.ogle)]) === 1) out.push({ d: m.d, o: 'aksam', k: 'ayniGun', x: D().ALT[aa].ad });
      if (i) ['ogle', 'aksam'].forEach((o) => m[o].forEach((id) => {
        if (!tekil(id) && M[i - 1][o].indexOf(id) >= 0) out.push({ d: m.d, o, k: 'tekrar', x: yemek(id).ad });
      }));
      m.aksam.forEach((id) => { if (!tekil(id) && m.ogle.indexOf(id) >= 0) out.push({ d: m.d, o: 'aksam', k: 'ayniYemek', x: yemek(id).ad }); });
    });
    return out;
  }
  const ogleAna = (kaplar) => Math.max(0, kaplar.findIndex((id) => grupOf(id) === 1));
  /* Tablo 4.5 satırına göre sayım: { anahtar: {ogle, aksam} } */
  function sayim(M) {
    const c = {}; Object.keys(D().TABLO45).forEach((k) => { c[k] = { ogle: 0, aksam: 0 }; });
    M.forEach((m) => ['ogle', 'aksam'].forEach((o) => m[o].forEach((id) => { const t = tabloOf(id); if (c[t]) c[t][o]++; })));
    return c;
  }

  /* ---- ekran ---- */
  const gunAdi = (m) => m.no + ' ' + GUN[m.g];
  const ayAdi = (ay) => AY[+ay.slice(5, 7) - 1] + ' ' + ay.slice(0, 4);
  function sayimHtml(M, mev, N) {
    const T = D().TABLO45, c = sayim(M), yaz = mev === 'yaz', r = N / 21;
    const sat = (k) => {
      const t = T[k], alt = Math.floor(t[yaz ? 4 : 3] * r + 1e-9), ust = Math.ceil(t[yaz ? 2 : 1] * r - 1e-9);
      const durum = (n) => (K1.indexOf(k) >= 0 || K2.indexOf(k) >= 0 ? (n < alt ? ' <span class="badge warn">az</span>' : n > ust ? ' <span class="badge warn">fazla</span>' : ' <span class="badge ok">✓</span>') : '');
      return '<tr><td>' + esc(t[0]) + '</td><td class="n">' + t[yaz ? 4 : 3] + '–' + t[yaz ? 2 : 1] + '</td><td class="n">' + c[k].ogle + durum(c[k].ogle) +
        '</td><td class="n">' + c[k].aksam + durum(c[k].aksam) + '</td></tr>';
    };
    return '<table class="t"><thead><tr><th>Yemek grubu</th><th class="n">21 gün</th><th class="n">Öğle</th><th class="n">Akşam</th></tr></thead><tbody>' +
      '<tr class="mh"><td colspan="4">1. kap — ana yemek</td></tr>' + K1.map(sat).join('') +
      '<tr class="mh"><td colspan="4">2. grup</td></tr>' + K2.map(sat).join('') +
      '<tr class="mh"><td colspan="4">3. grup</td></tr>' + K3.map(sat).join('') + '</tbody></table>';
  }

  DA.calcs.push({
    id: 'toplumenu', data: ['toplu'], title: 'Toplu beslenme menü taslağı',
    desc: 'Hafta içi aylık menü · sabah 3, öğle ve akşam 4 kap · Ulusal Menü Rehberi', ico: 'clipboard',
    view() {
      const u = U(), { ay, mev, s, M } = menuSon(u), N = M.length, NT = notlar(M);
      const elle = Object.keys(u.degis || {}).length;
      const notGun = (d, o) => NT.filter((x) => x.d === d && (!o || x.o === o));
      const satir = (m, o) => {
        const n = notGun(m.d, o[0]);
        return '<button class="li" data-act="topluOgun" data-d="' + m.d + '" data-o="' + o[0] + '"><span class="grow"><div class="s">' + esc(o[1]) +
          (n.length ? ' · <span class="uyari-metin">' + n.length + ' not</span>' : '') + '</div><div class="t">' +
          m[o[0]].map((id, i) => (m[o[0] + 'Elle'][i] ? '<u>' + esc(yemek(id).ad) + '</u>' : esc(yemek(id).ad))).join(' · ') + '</div></span></button>';
      };
      return {
        title: 'Menü taslağı', tab: 'hesapla', back: 'hesapla', ico: 'clipboard',
        fav: { h: '#/hesapla/toplumenu', t: 'Toplu beslenme menü taslağı', ico: 'clipboard' },
        html:
          '<div class="card"><div class="grid2"><label class="fld"><span>Ay</span><input type="month" value="' + ay + '" data-change="topluAy"></label>' +
          '<div class="fld"><span>Mevsim (Tablo 4.5)</span><div class="chips">' +
            [['kis', 'Kış'], ['yaz', 'Yaz']].map((x) => '<button class="chip' + (mev === x[0] ? ' on' : '') + '" data-act="topluMevsim" data-m="' + x[0] +
              '" aria-pressed="' + (mev === x[0]) + '">' + x[1] + '</button>').join('') + '</div></div></div>' +
          '<div class="small muted">' + esc(ayAdi(ay)) + ' · ' + N + ' hafta içi gün · sabah 3, öğle 4, akşam 4 kap' +
            (elle ? ' · ' + elle + ' kap elle değişti (altı çizili)' : '') + '</div>' +
          '<div class="grid2 mt"><button class="btn sec block" data-act="topluKaristir">Yeniden dağıt</button>' +
          '<a class="btn block" href="#/yazdir/toplu">' + icon('share') + ' PDF / Yazdır</a></div></div>' +
          '<div class="card" id="topluDenetim"><h2>Denetim</h2>' +
            (NT.length ? '<ul class="small">' + NT.map((x) => '<li data-kural="' + x.k + '">' + esc(M.find((m) => m.d === x.d).no + ' ' + GUN[M.find((m) => m.d === x.d).g] +
              ' ' + OGUN.find((o) => o[0] === x.o)[1].toLocaleLowerCase('tr-TR') + ': ' + KURAL[x.k] + (x.x ? ' (' + x.x + ')' : '')) + '</li>').join('') + '</ul>'
              : '<p class="small muted">Kurala uymayan öğün yok.</p>') +
            '<details class="acc mt-s"><summary>Aylık sıklık (Tablo 4.5)</summary><div class="body">' + sayimHtml(M, mev, N) +
            '<p class="tiny muted">Tablo işyeri öğle menüsü içindir (21 gün); burada öğle ve akşam ayrı sayılır, aralık ' + N + ' güne ölçeklenerek ' +
            'değerlendirilir. Asgari değerler günde bir 1., bir 2., bir 3. grup yemeğine denk gelir; dördüncü kap bu sayıların üstüne eklenir, ' +
            '3. grupta aralık bu yüzden işaretlenmez.</p></div></details>' +
            (DA.kaynakRozet ? DA.kaynakRozet('toplumenu') : '') + '</div>' +
          M.map((m) => '<div class="card toplu-gun" data-gun="' + m.d + '"><h2>' + esc(gunAdi(m)) + '</h2><div class="list">' +
            OGUN.map((o) => satir(m, o)).join('') + '</div></div>').join('') +
          '<div class="note">Kurallar: Toplu Beslenme Sistemleri (Toplu Tüketim Yerleri) İçin Ulusal Menü Planlama ve Uygulama Rehberi ' +
          '(T.C. Sağlık Bakanlığı, 2020) — EK-1 yemek grupları, menü planlama ilkeleri, Tablo 4.5. Çorba bir kap sayılır ve öğünün başına yazılır.</div>'
      };
    }
  });

  /* ---- eylemler ---- */
  const sifirla = (mesaj) => {
    const u = U(), eski = Object.assign({}, u.degis || {});
    if (!Object.keys(eski).length) return () => {};
    u.degis = {};
    return () => DA.silGeriAl(mesaj + '; ' + Object.keys(eski).length + ' elle değişiklik kaldırıldı', () => { U().degis = eski; });
  };
  DA.live.topluAy = (el) => {
    if (!ayGecerli(el.value)) return;
    const u = U(); if (u.ay === el.value) return;
    const bildir = sifirla('Ay değişti');
    u.ay = el.value; DA.save(); DA.render(true); bildir();
  };
  DA.actions.topluMevsim = (el) => {
    const u = U(); if (mevsimOf(ayGecerli(u.ay) ? u.ay : sonrakiAy(), u.mevsim) === el.dataset.m) return;
    const bildir = sifirla('Mevsim değişti');
    u.mevsim = el.dataset.m; DA.save(); DA.render(true); bildir();
  };
  DA.actions.topluKaristir = () => {
    const u = U(), bildir = sifirla('Yeniden dağıtıldı');
    u.tohum = ((Number.isInteger(u.tohum) ? u.tohum : 0) + 1) % 1000; DA.save(); DA.render(true); bildir();
  };
  /* Öğün düzenleme sayfası: her kap için grup grup seçim */
  function ogunSayfasi(d, o) {
    const { M } = menuSon(U()), m = M.find((x) => x.d === d); if (!m) return '';
    const Y = D().YEMEK, A = D().ALT;
    const gruplar = o === 'sabah'
      ? [['Kahvaltı', Y.filter((y) => A[y.a].k)]]
      : [['1. grup — ana yemek', 1], ['2. grup — çorba, pilav, börek, zeytinyağlı', 2], ['3. grup — salata, yoğurt, meyve, tatlı', 3]]
        .map((g) => [g[0], Y.filter((y) => A[y.a].g === g[1])]);
    const n = denetle(m[o], o);
    return '<div id="topluSayfa">' + (n.length ? '<div class="note warn small">' + n.map((x) => esc(KURAL[x.k] + (x.d ? ' (' + x.d + ')' : ''))).join('<br>') + '</div>' : '') +
      m[o].map((id, i) => '<label class="fld"><span>' + (i + 1) + '. kap' + (m[o + 'Elle'][i] ? ' · elle' : '') + '</span><select data-change="topluKap" data-d="' + d +
        '" data-o="' + o + '" data-i="' + i + '">' + gruplar.map((g) => '<optgroup label="' + esc(g[0]) + '">' + g[1].map((y) =>
          '<option value="' + y.id + '"' + (y.id === id ? ' selected' : '') + '>' + esc(y.ad) + ' — ' + esc(A[y.a].ad) + '</option>').join('') + '</optgroup>').join('') +
        '</select></label>').join('') +
      (m[o + 'Elle'].some(Boolean) ? '<button class="btn ghost block" data-act="topluOtomatik" data-d="' + d + '" data-o="' + o + '">Bu öğünü otomatiğe döndür</button>' : '') + '</div>';
  }
  const ogunBaslik = (d, o) => { const { M } = menuSon(U()), m = M.find((x) => x.d === d); return (m ? gunAdi(m) + ' · ' : '') + OGUN.find((x) => x[0] === o)[1]; };
  DA.actions.topluOgun = (el) => { DA.sheet(ogunBaslik(el.dataset.d, el.dataset.o), ogunSayfasi(el.dataset.d, el.dataset.o)); };
  DA.live.topluKap = (el) => {
    const u = U(); u.degis = u.degis && typeof u.degis === 'object' ? u.degis : {};
    const { M } = menuSon(Object.assign({}, u, { degis: {} })), m = M.find((x) => x.d === el.dataset.d);
    const key = el.dataset.d + '|' + el.dataset.o + '|' + el.dataset.i;
    /* Otomatiğin seçtiğine dönülürse değişiklik kaydı silinir */
    if (m && m[el.dataset.o][+el.dataset.i] === el.value) delete u.degis[key];
    else if (yemek(el.value)) u.degis[key] = el.value;
    DA.save(); DA.render(true);
    const b = DA.$('#topluSayfa'); if (b) b.outerHTML = ogunSayfasi(el.dataset.d, el.dataset.o);
  };
  DA.actions.topluOtomatik = (el) => {
    const u = U(), on = el.dataset.d + '|' + el.dataset.o + '|';
    Object.keys(u.degis || {}).forEach((k) => { if (k.indexOf(on) === 0) delete u.degis[k]; });
    DA.save(); DA.render(true);
    const b = DA.$('#topluSayfa'); if (b) b.outerHTML = ogunSayfasi(el.dataset.d, el.dataset.o);
  };

  /* ---- çıktı ----
     Ödev kâğıdının biçimi: Gün | Sabah | Öğle | Akşam; kaplar alt alta. */
  DA.views._printToplu = () => {
    const { ay, mev, M } = menuSon(U()), NT = notlar(M);
    return {
      title: 'Menü taslağı çıktısı', tab: 'hesapla', back: 'hesapla/toplumenu', noRecent: true,
      html: (NT.length ? '<div class="note warn noprint">Taslakta ' + NT.length + ' kural notu var. <a href="#/hesapla/toplumenu">Taslağa dön</a>.</div>' : '') +
        '<div class="noprint mb"><button class="btn block" data-act="doPrint">PDF olarak kaydet / yazdır</button></div>' +
        '<div class="printdoc toplu-doc">' + DA.antet() + '<h2>Menü taslağı — ' + esc(ayAdi(ay)) + '</h2>' +
        '<div class="alt">Hafta içi ' + M.length + ' gün · sabah 3, öğle 4, akşam 4 kap · ' + (mev === 'yaz' ? 'yaz' : 'kış') + ' menüsü</div>' +
        '<table class="toplu-tablo"><thead><tr><th>Gün</th><th>Sabah</th><th>Öğle</th><th>Akşam</th></tr></thead><tbody>' +
        M.map((m) => '<tr><td class="gun">' + esc(gunAdi(m)) + '</td>' + OGUN.map((o) => '<td>' + m[o[0]].map((id) => esc(yemek(id).ad)).join('<br>') + '</td>').join('') + '</tr>').join('') +
        '</tbody></table>' +
        '<div class="sat">Kahvaltıda içecek: çay, bitki çayı ya da süt.</div>' +
        DA.dipnot('kurallar Toplu Beslenme Sistemleri İçin Ulusal Menü Planlama ve Uygulama Rehberi’nden (T.C. Sağlık Bakanlığı, 2020).') + '</div>'
    };
  };

  DA.toplu = { gunler, kota, uret, denetle, notlar, sayim, menuSon, uyumsuz, mevsimOf, onar };
})();
