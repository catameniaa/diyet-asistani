/* Besin veri bankaları — arama, besin ögesine göre sıralama, ayrıntı

   Neden: uygulamanın kendi besin listesi 124 kayıt ve yalnız enerji, makro
   ve lif taşıyor; mikro besin analizi yapılamıyordu. BLS 4.0 (Alman ulusal
   besin veri tabanı, Aralık 2025'ten beri ücretsiz) 7.140 besin ve buradaki
   seçimle 68 öge getiriyor. TürKomp (js/turkomp.js) aynı motoru kullanır;
   ekranın üstünden iki veri bankası arasında geçilir. Menü ve geriçağırma
   analizine bağlanması sonraki adım.

   Motor kaynaktan bağımsız (DA.vb): her veri bankası bir tanım verir (veri,
   arama, ana ögelerin anahtarları, ayrıntıdaki ek satırlar). İlk sürüm
   yalnız BLS'yi biliyordu; TürKomp gelince ikinci bir kopya yazmak yerine
   ortak kısım ayrıldı.

   BLS verisi ~2,2 MB: açılışta değil, bu ekran ilk açıldığında yüklenir.
   Genel arama (needAll) bu dosyayı yüklemez; aranan kelime buraya taşınır.

   Eksik değer SIFIR DEĞİLDİR (BLS belgesi 4.3; TürKomp'ta da ölçülmemiş
   demektir). Ekranda "veri yok" yazılır; sıralamada eksik değerli besin
   listeye girmez. Eser (TR) ve ölçüm sınırı altı (<LOD/<LOQ) sıralamada 0
   sayılır, ekranda ayrıca belirtilir. */
(function () {
  'use strict';
  const { esc, fmt } = DA;
  const SAYFA = 60;
  /* Karışık yemekler (X, Y) aramada geride: "domates" yazan önce domatesi
     görmeli, domatesli 40 yemeği değil. Tatlı, unlu mamul, sos ve içkiler
     daha az geride: "yoğurt" yazınca yoğurtlu dondurma yoğurdun önüne
     geçiyordu (ad kısa olduğu için). */
  const GERIDE = { X: 50, Y: 50, D: 20, S: 20, R: 20, P: 20, W: 20 };
  /* 100 kcal başına sıralamada 100 g'da 10 kcal'den az veren besinler (su,
     çay, tuz) dışarıda kalır: sıfıra yakın enerjiye bölmek anlamsız büyük
     yoğunluklar üretir ve listenin başını onlar kaplar. */
  const KCAL_ALT = 10;
  const KOKEN = {
    A: 'analiz', R: 'tarif hesabı', M: 'örüntü hesabı', L: 'literatür', G: 'birleştirme',
    E: 'etiket', V: 'başka veri tabanı', B: 'benzer besinden', S: 'ölçekleme',
    0: 'mantıksal sıfır', N: 'varsayım', T: 'eser', F: 'formül'
  };

  const KAYNAK = {};                 /* id → tanım */
  const DURUM = {};                  /* id → { sorgu, limit, sonParam } */
  let aktif = 'bls', gram = 100;
  const tanim = () => KAYNAK[aktif];
  const durum = (id) => (DURUM[id] = DURUM[id] || { sorgu: '', limit: SAYFA, sonParam: null });

  /* Ayar ui'de saklanır ve yedekle dışarıdan gelebilir: her okumada denetlenir,
     tanınmayan değer sessizce varsayılana döner (bozuk ayar ekranı kilitlemesin). */
  function ayar(T) {
    T = T || tanim();
    const u = DA.state().ui;
    if (!u[T.id] || typeof u[T.id] !== 'object' || Array.isArray(u[T.id])) u[T.id] = {};
    const A = u[T.id], B = T.veri();
    if (B) {
      if (A.g && !(B.grup && B.grup[A.g])) A.g = '';
      if (A.s && !B.oge.some((o) => o[0] === A.s)) A.s = '';
    }
    if (A.yon !== 'az') A.yon = 'cok';
    if (A.baz !== 'kcal') A.baz = 'g';
    return A;
  }

  /* ---- dizin ----
     Veri nesnesine bağlı tutulur: TürKomp yeniden içe aktarılınca yeni nesne
     gelir, eski dizin kendiliğinden geçersiz olur. */
  const _ix = new WeakMap();
  function indeks(T) {
    T = T || tanim();
    const B = T.veri();
    if (_ix.has(B)) return _ix.get(B);
    const K = {}, kod = {}, oge = {};
    B.oge.forEach((o, i) => { K[o[0]] = i + 2; oge[o[0]] = o; });
    const ara = B.b.map((r, i) => { kod[r[0]] = i; return T.samanlik(r); });
    const ix = { K, kod, ara, oge };
    _ix.set(B, ix);
    return ix;
  }
  const deger = (r, anahtar, T) => r[indeks(T).K[anahtar]];
  /* hesap için: eser ve ölçüm sınırı altı 0, eksik null */
  const sayi = (v) => (typeof v === 'number' ? v : (v === 'iz' || v === '<') ? 0 : null);

  /* ---- Türkçe karakter katlama: "ıspanak" = "ispanak", "soğan" = "sogan" ---- */
  const KATLA = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' };
  const katla = (s) => DA.trLower(s).replace(/[çğıöşüâîû]/g, (c) => KATLA[c]);
  const kacir = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const kelimeler = (q) => katla(q).replace(/[^a-z0-9%.,\s-]/g, ' ').split(/\s+/).filter(Boolean);

  /* ---- BLS araması: Türkçe sözlükle İngilizce adlarda ---- */
  let _soz = null;
  function sozluk() {
    if (_soz) return _soz;
    const S = DA.data.blsSozluk, s = {}, grup = {};
    Object.keys(S.s).forEach((k) => { s[katla(k)] = S.s[k].split('|'); });
    Object.keys(S.grup || {}).forEach((g) => S.grup[g].forEach((k) => { const a = katla(k); grup[a] = (grup[a] || '') + g; }));
    _soz = { s, grup, anahtar: Object.keys(s), yakin: S.yakin.map(katla) };
    return _soz;
  }
  /* Sorgu → her kelime grubu için { re: süzgeç, asil: sözlükteki ilk (asıl)
     anlam, grup: anahtarın doğal BLS grubu }. Bütün gruplar eşleşmeli.
     Çok kelimeli anahtarlar önce denenir ("beyaz peynir" tek kavram).
     Sözlükte olmayan kelime olduğu gibi aranır: İngilizce yazmak ve BLS
     koduyla aramak da çalışır. */
  function cozumle(q) {
    const { s, grup, anahtar } = sozluk();
    const k = kelimeler(q);
    const gruplar = [];
    for (let i = 0; i < k.length;) {
      let bul = null, n = 3;
      for (; n >= 1; n--) {
        const aday = k.slice(i, i + n).join(' ');
        if (i + n <= k.length && s[aday]) { bul = aday; break; }
      }
      if (bul) {
        gruplar.push({ alt: s[bul].map((a) => '\\b(?:' + a + ')'), asil: '\\b(?:' + s[bul][0] + ')', grup: grup[bul] || '' });
        i += n; continue;
      }
      const t = k[i], alt = [(/^[a-z0-9]/.test(t) ? '\\b' : '') + kacir(t)];
      /* Yazılırken son kelime yarımdır ("doma"): onunla başlayan anahtarların
         karşılıkları da aranır, sonuç harf harf gelsin. */
      if (i === k.length - 1 && t.length >= 3) {
        anahtar.forEach((a) => { if (a.startsWith(t)) s[a].forEach((x) => alt.push('\\b(?:' + x + ')')); });
      }
      gruplar.push({ alt, asil: null, grup: '' });
      i++;
    }
    return gruplar.map((g) => ({ re: new RegExp(g.alt.join('|'), 'i'), asil: g.asil ? new RegExp(g.asil, 'i') : null, grup: g.grup }));
  }
  function yakinUyari(q) {
    const k = ' ' + katla(q) + ' ', y = sozluk().yakin;
    const bul = DA.data.blsSozluk.yakin.filter((x, i) => k.indexOf(' ' + y[i] + ' ') >= 0 || k.trim() === y[i]);
    return bul.length ? bul[0] : '';
  }

  /* Satır numaralarını sıralı döner.
     Puan (küçük önde): ad uzunluğu, ardından ilk kelime grubuna göre
       −120 besin aranan kavramın doğal grubunda (yoksa tatlı, sos, içki,
            şarküteri +20; karışık yemek +50)
       −50 ad o kelimeyle başlıyor    −30 kelime tam ("Milk", "Milkshake" değil)
       −40 sözlükteki asıl anlam       −10 çiğ hâli
     Yalnız uzunluk + baş eşleşmesiyle "süt" sütlü çikolatayı, "yumurta"
     yumurtalı makarnayı, "tavuk" tavuk yağını en üste koyuyordu. Baş
     eşleşmesi grup tercihinden ağır olunca da "böbrek" barbunyayı (Kidney
     bean), "çay" çay bisküvisini, "şarap" şaraplı lahana turşusunu
     getiriyordu; ağırlıklar bu yüzden −100/−60'tan −50/−120'ye çevrildi. */
  function araBls(T, q, grup) {
    const B = T.veri(), ix = indeks(T), re = cozumle(q || '');
    const out = [];
    for (let i = 0; i < B.b.length; i++) {
      if (grup && B.b[i][0][0] !== grup) continue;
      if (re.every((x) => x.re.test(ix.ara[i]))) out.push(i);
    }
    if (!re.length) return out;
    const tercih = re.map((x) => x.grup).join(''), ilk = re[0], puan = {};
    out.forEach((i) => {
      const r = B.b[i], h = ix.ara[i], m = ilk.re.exec(h);
      let p = r[1].length + (tercih.indexOf(r[0][0]) >= 0 ? -120 : (GERIDE[r[0][0]] || 0));
      if (m && m.index === 0) p -= 50;
      if (m && !/[a-z]/.test(h.charAt(m.index + m[0].length))) p -= 30;
      if (ilk.asil && ilk.asil.test(h)) p -= 40;
      if (/\braw\b/.test(h)) p -= 10;
      puan[i] = p;
    });
    return out.sort((a, b) => puan[a] - puan[b] || B.b[a][1].localeCompare(B.b[b][1]));
  }

  /* Adlar Türkçe olan veri bankası için (TürKomp): her kelime adın bir
     kelimesinin başında geçmeli. Sözlük gerekmez. Puan (küçük önde): ad
     uzunluğu, −50 ad o kelimeyle başlıyor, −30 kelime tam, −20 kelimeden
     sonra virgül ya da ad bitiyor (TürKomp adları "Ana ad, nitelik"
     düzeninde: "Domates, kuru" ana ad, "Domates suyu" başka ürün), −10 taze
     hâli (çiğ, sofralık, taze). Yalnız uzunlukla "domates" önce domates
     suyunu, "elma" elma suyunu getiriyordu. */
  function araDuz(T, q) {
    const B = T.veri(), ix = indeks(T), k = kelimeler(q || '');
    const re = k.map((t) => new RegExp((/^[a-z0-9]/.test(t) ? '\\b' : '') + kacir(t)));
    const out = [];
    for (let i = 0; i < B.b.length; i++) if (re.every((x) => x.test(ix.ara[i]))) out.push(i);
    if (!re.length) return out;
    const puan = {};
    out.forEach((i) => {
      const h = ix.ara[i], m = re[0].exec(h), son = m ? m.index + m[0].length : -1;
      let p = B.b[i][1].length;
      if (m && m.index === 0) p -= 50;
      if (m && !/[a-z]/.test(h.charAt(son))) p -= 30;
      if (m && (h.charAt(son) === ',' || son === B.b[i][1].length)) p -= 20;
      if (/\b(cig|sofralik|taze)\b/.test(h)) p -= 10;
      puan[i] = p;
    });
    return out.sort((a, b) => puan[a] - puan[b] || B.b[a][1].localeCompare(B.b[b][1], 'tr'));
  }

  /* Besin ögesine göre: [[satır, değer]] — eksik değerliler dışarıda */
  function sirala(liste, anahtar, yon, baz, T) {
    T = T || tanim();
    const B = T.veri(), ix = indeks(T), j = ix.K[anahtar], jk = ix.K[T.ana.kcal];
    const kcalBaz = baz === 'kcal' && anahtar !== T.ana.kcal;
    const d = [];
    liste.forEach((i) => {
      const r = B.b[i];
      let x = sayi(r[j]);
      if (x == null) return;
      if (kcalBaz) {
        const e = sayi(r[jk]);
        if (!(e >= KCAL_ALT)) return;
        x = x / e * 100;
      }
      d.push([i, x]);
    });
    d.sort((a, b) => (yon === 'az' ? a[1] - b[1] : b[1] - a[1]) || B.b[a[0]][1].localeCompare(B.b[b[0]][1]));
    return d;
  }

  /* Ondalık basamak büyüklüğe göre: 1234 kcal, 12,3 g, 1,23 mg, 0,0042 µg */
  function basamak(x) {
    const a = Math.abs(x);
    if (a >= 100 || a === 0) return 0;
    if (a >= 10) return 1;
    if (a >= 1) return 2;
    return Math.min(6, 2 - Math.floor(Math.log10(a)));
  }
  const yaz = (x) => fmt(x, basamak(x));

  /* ---- liste ---- */
  function listeHtml() {
    const T = tanim(), A = ayar(T), B = T.veri(), ix = indeks(T), D = durum(T.id);
    const satir = T.ara(T, D.sorgu, A.g);
    const degerli = A.s ? sirala(satir, A.s, A.yon, A.baz, T) : null;
    const toplam = degerli ? degerli.length : satir.length;
    const uyari = T.uyari ? T.uyari(D.sorgu, toplam) : '';
    if (!toplam) {
      return uyari + DA.emptyState('search', D.sorgu ? {
        baslik: '“' + D.sorgu + '” için sonuç yok', aciklama: T.bosAciklama
      } : { baslik: 'Bu grupta besin yok', aciklama: 'Başka bir grup seç.' });
    }
    const o = A.s ? ix.oge[A.s] : null;
    const kcalBaz = A.s && A.baz === 'kcal' && A.s !== T.ana.kcal;
    const goster = (degerli || satir.map((i) => [i, null])).slice(0, D.limit);
    const jk = ix.K[T.ana.kcal];
    return uyari + '<p class="muted small" id="blsSay">' + fmt(toplam, 0) + ' besin' +
      (o ? ' · ' + esc(o[2]) + (A.yon === 'az' ? ' azdan çoğa' : ' çoktan aza') + (kcalBaz ? ', 100 kcal başına' : ', 100 g’da') : '') +
      '</p><div class="list" id="blsListe">' + goster.map((x) => {
        const r = B.b[x[0]];
        const son = o
          ? '<b style="color:var(--ink)">' + yaz(x[1]) + '</b> ' + esc(o[3])
          : (typeof r[jk] === 'number' ? '<b style="color:var(--ink)">' + fmt(r[jk], 0) + '</b> kcal' : '');
        return '<a class="li chev" href="#/' + T.rota + '/' + esc(r[0]) + '"><span class="grow"><div class="t">' + esc(r[1]) + '</div>' +
          '<div class="s">' + T.satirAlt(r, B) + '</div></span><span class="end">' + son + '</span></a>';
      }).join('') + '</div>' +
      (toplam > D.limit ? '<button class="btn ghost block" data-act="blsDaha">' + fmt(Math.min(SAYFA, toplam - D.limit), 0) +
        ' besin daha göster</button>' : '') +
      (kcalBaz ? '<p class="muted tiny">100 g’da ' + KCAL_ALT + ' kcal’den az enerji veren besinler (su, çay, tuz) ' +
        '100 kcal başına sıralamaya alınmaz: sıfıra yakın enerjiye bölmek yanıltıcı büyük değerler üretir.</p>' : '');
  }
  function yenile() {
    const o = DA.$('#blsOut'); if (o) o.innerHTML = listeHtml(); else DA.render(true);
  }

  function seciciler() {
    const T = tanim(), A = ayar(T), B = T.veri();
    /* Grup bilgisi olmayan veri bankasında (TürKomp dosyası grup taşımıyor) seçici yok */
    const grupSec = B.grup ? '<label class="fld"><span>Grup</span><select data-change="blsGrup" aria-label="Besin grubu">' +
      '<option value="">Tüm gruplar</option>' + Object.keys(B.grup).sort((a, b) => B.grup[a].localeCompare(B.grup[b], 'tr'))
        .map((g) => '<option value="' + g + '"' + (A.g === g ? ' selected' : '') + '>' + esc(B.grup[g]) + '</option>').join('') + '</select></label>' : '';
    const ogeSec = '<label class="fld"><span>Sırala</span><select data-change="blsSirala" aria-label="Besin ögesine göre sırala">' +
      '<option value="">Ada göre</option>' + B.ogeGrup.map((g) => {
        const ic = B.oge.filter((o) => o[4] === g[0]);
        return ic.length ? '<optgroup label="' + esc(g[1]) + '">' + ic.map((o) => '<option value="' + esc(o[0]) + '"' +
          (A.s === o[0] ? ' selected' : '') + '>' + esc(o[2]) + '</option>').join('') + '</optgroup>' : '';
      }).join('') + '</select></label>';
    const yonSec = A.s ? '<div class="grid2"><label class="fld"><span>Yön</span><select data-change="blsYon">' +
      '<option value="cok"' + (A.yon === 'cok' ? ' selected' : '') + '>Çoktan aza</option>' +
      '<option value="az"' + (A.yon === 'az' ? ' selected' : '') + '>Azdan çoğa</option></select></label>' +
      '<label class="fld"><span>Ölçü</span><select data-change="blsBaz"' + (A.s === T.ana.kcal ? ' disabled' : '') + '>' +
      '<option value="g"' + (A.baz === 'g' ? ' selected' : '') + '>100 g’da</option>' +
      '<option value="kcal"' + (A.baz === 'kcal' ? ' selected' : '') + '>100 kcal başına</option></select></label></div>' : '';
    return (grupSec ? '<div class="grid2">' + grupSec + ogeSec + '</div>' : ogeSec) + yonSec;
  }

  DA.live.blsAra = (el) => { const D = durum(aktif); D.sorgu = el.value; D.limit = SAYFA; yenile(); };
  DA.live.blsGrup = (el) => { ayar().g = el.value; durum(aktif).limit = SAYFA; DA.save(); DA.render(true); };
  DA.live.blsSirala = (el) => { ayar().s = el.value; durum(aktif).limit = SAYFA; DA.save(); DA.render(true); };
  DA.live.blsYon = (el) => { ayar().yon = el.value; durum(aktif).limit = SAYFA; DA.save(); yenile(); };
  DA.live.blsBaz = (el) => { ayar().baz = el.value; durum(aktif).limit = SAYFA; DA.save(); yenile(); };
  DA.actions.blsDaha = () => { durum(aktif).limit += SAYFA; yenile(); };

  /* ---- ayrıntı ---- */
  function hucre(v, birim, k) {
    if (v === undefined) return '<span class="muted">veri yok</span>';
    if (v === 'iz') return '<span class="muted">eser</span>';
    if (v === '<') return '<span class="muted">ölçüm sınırı altı</span>';
    return '<b>' + yaz(v * k) + '</b>' + DA.birim(birim);
  }
  function degerHtml(r) {
    const T = tanim(), B = T.veri(), k = gram / 100;
    const kok = T.koken ? T.koken(r) : null;
    const ek = (j) => {
      if (kok) { const c = kok[j]; return '<td class="koken' + (c === 'B' ? ' benzer' : '') + '">' + esc(KOKEN[c] || '') + '</td>'; }
      if (T.aralik) {
        const a = T.aralik(r, B.oge[j][0]);
        return '<td class="koken">' + (a ? yaz(a[0] * k) + '–' + yaz(a[1] * k) : '') + '</td>';
      }
      return '';
    };
    return B.ogeGrup.map((g, gi) => {
      let satirlar = '', olcum = 0, oge = 0;
      B.oge.forEach((o, j) => {
        if (o[4] !== g[0]) return;
        const v = r[j + 2];
        oge++; if (v !== undefined) olcum++;
        satirlar += '<tr><td>' + esc(o[2]) + '</td><td class="n">' + hucre(v, o[3], k) + '</td>' + ek(j) + '</tr>';
        if (T.ekSatir) satirlar += T.ekSatir(o, v, k, !!(kok || T.aralik));
      });
      if (!oge) return '';
      /* TürKomp'ta çoğu besinde bütün bir grup ölçülmemiş (ör. 18 amino asit):
         satır satır "veri yok" yazmak ekranı boşa uzatıyordu, tek satırda söylenir. */
      if (!olcum) {
        return '<details class="acc"><summary>' + esc(g[1]) + ' <span class="muted tiny">veri yok</span></summary>' +
          '<div class="body"><p class="muted small" style="margin:0">Bu besinde bu gruptan hiçbir öge ölçülmemiş (' + oge +
          ' öge). Sıfır anlamına gelmez.</p></div></details>';
      }
      return '<details class="acc"' + (gi < 2 ? ' open' : '') + '><summary>' + esc(g[1]) + '</summary><div class="body">' +
        '<table class="t bls-t"><tbody>' + satirlar + '</tbody></table></div></details>';
    }).join('');
  }
  function ozetHtml(r) {
    const T = tanim(), k = gram / 100, v = (a) => sayi(deger(r, T.ana[a], T));
    const e = v('kcal'), p = v('prot'), y = v('yag'), c = v('kh');
    const kutu = (etiket, x, u) => '<div class="stat"><div class="v">' + (x == null ? '—' : yaz(x * k) + DA.birim(u)) +
      '</div><div class="l">' + etiket + '</div></div>';
    /* Enerji dağılımı genel Atwater katsayılarıyla (4/9/4); posa, alkol ve
       organik asit enerjisi ayrı olduğu için toplam %100 etmeyebilir. */
    const dag = (e > 0 && p != null && y != null && c != null)
      ? '<p class="muted small" style="margin:var(--s-2) 0 0">Enerji dağılımı: protein %' + fmt(p * 4 / e * 100, 0) +
        ' · yağ %' + fmt(y * 9 / e * 100, 0) + ' · karbonhidrat %' + fmt(c * 4 / e * 100, 0) + '</p>' : '';
    return '<div class="bls-ozet">' + kutu('enerji', e, 'kcal') + kutu('protein', p, 'g') + kutu('yağ', y, 'g') +
      kutu('KH', c, 'g') + '</div>' + dag;
  }
  function notHtml(r) {
    const T = tanim(), kok = T.koken ? T.koken(r) : null;
    let yok = 0, benzer = 0;
    T.veri().oge.forEach((o, j) => { if (r[j + 2] === undefined) yok++; if (kok && kok[j] === 'B') benzer++; });
    const parca = [];
    if (yok) parca.push(yok + ' ögede veri yok (sıfır değil; toplamlarda eksik sayılır)');
    if (benzer) parca.push(benzer + ' öge benzer bir besinden alınmış');
    return (parca.length ? '<div class="note">' + parca.join(' · ') + '.</div>' : '') + (T.notlar ? T.notlar(r, gram / 100) : '');
  }
  function detay(T, kod) {
    const B = T.veri(), i = indeks(T).kod[kod];
    if (i == null) {
      return { title: T.detayBaslik, tab: 'besin', back: T.rota, html: DA.emptyState('search', {
        baslik: 'Besin bulunamadı', aciklama: '“' + kod + '” kodlu bir besin ' + T.ad + '’da yok.',
        eylem: { href: '#/' + T.rota, etiket: 'Aramaya dön', ico: 'search' } }) };
    }
    const r = B.b[i];
    return {
      title: T.detayBaslik, tab: 'besin', back: T.rota, ico: 'apple',
      fav: { h: '#/' + T.rota + '/' + kod, t: r[1], ico: 'apple' },
      html: '<div class="card"><h2 style="margin-top:0">' + esc(r[1]) + '</h2>' +
        '<p class="muted small" style="margin:0">' + T.detayAlt(r, B) + '</p>' +
        '<label class="fld mt"><span>Miktar (g, yenilebilir kısım)</span><input type="text" inputmode="decimal" ' +
        'data-live="blsGram" value="' + esc(fmt(gram, 1)) + '" aria-label="Miktar, gram"></label>' +
        '<div id="blsOzet">' + ozetHtml(r) + '</div></div>' +
        '<div id="blsKokenOzet">' + notHtml(r) + '</div>' +
        '<div id="blsDeger" data-kod="' + esc(kod) + '">' + degerHtml(r) + '</div>' +
        '<details class="acc"><summary>Değer türleri ve kaynak</summary><div class="body small">' + T.bilgi(B) + '</div></details>',
      mount() { if (T.detayMount) T.detayMount(r, kod, () => { const d = DA.$('#blsDeger'); return d && d.dataset.kod === kod; }); }
    };
  }
  function detayYenile(r) {
    DA.$('#blsOzet').innerHTML = ozetHtml(r);
    DA.$('#blsKokenOzet').innerHTML = notHtml(r);
    DA.$('#blsDeger').innerHTML = degerHtml(r);
  }
  DA.live.blsGram = (el) => {
    const g = DA.num(el.value);
    if (!(g >= 0) || g > 100000) return;
    gram = g;
    const d = DA.$('#blsDeger'), i = d && indeks().kod[d.dataset.kod];
    if (i == null) return;
    detayYenile(tanim().veri().b[i]);
  };

  /* Veri bankası değiştirme: hangi bankada aranacağı ekranın üstünden seçilir */
  function kaynakSecici() {
    return '<div class="chips mb" role="tablist" aria-label="Veri bankası">' + Object.keys(KAYNAK).map((id) =>
      '<a class="chip' + (id === aktif ? ' on' : '') + '" role="tab" aria-selected="' + (id === aktif) + '" href="#/' +
      KAYNAK[id].rota + '">' + esc(KAYNAK[id].ad) + '</a>').join('') + '</div>';
  }

  /* Liste ya da ayrıntı ekranı; veri hazır değilse kaynağın kendi ekranı döner */
  function gorunum(id, parts, q) {
    const T = KAYNAK[id];
    aktif = id;
    if (parts[0]) return detay(T, parts[0]);
    /* Genel aramadan gelen kelime bir kez uygulanır; sonra kullanıcı değiştirebilir */
    const D = durum(id), p = q && q.get('q');
    if (p != null && p !== D.sonParam) { D.sorgu = p; D.limit = SAYFA; }
    D.sonParam = p;
    const B = T.veri();
    return {
      title: T.listeBaslik, tab: 'besin', back: 'besin', ico: 'apple',
      html: kaynakSecici() + '<p class="muted small" style="margin-top:0">' + T.aciklama(B) + '</p>' +
        '<input type="search" placeholder="' + esc(T.yerTutucu) + '" value="' + esc(D.sorgu) + '" ' +
        'data-live="blsAra" aria-label="' + esc(T.ad) + '’da besin ara" autocomplete="off">' +
        '<div class="mt-s">' + seciciler() + '</div>' +
        '<div id="blsOut" aria-live="polite">' + listeHtml() + '</div>' + T.altBilgi(B)
    };
  }

  /* ---- BLS tanımı ---- */
  KAYNAK.bls = {
    id: 'bls', ad: 'BLS 4.0', rota: 'bls', listeBaslik: 'BLS veri bankası', detayBaslik: 'BLS besini',
    veri: () => DA.data.bls,
    ana: { kcal: 'kcal', prot: 'prot', yag: 'yag', kh: 'kh' },
    samanlik: (r) => (r[1] + ' ' + r[0]).toLowerCase(),
    ara: araBls,
    yerTutucu: 'Besin ara: domates, tavuk göğüs, yoğurt…',
    bosAciklama: 'Türkçe ya da İngilizce yazabilirsin (domates, tomato). Grup ya da sıralama seçiliyse onları kaldırmayı dene.',
    aciklama: (B) => fmt(B.b.length, 0) + ' besin · ' + B.oge.length +
      ' besin ögesi · 100 g yenilebilir kısım. Türkçe ya da İngilizce ara; adlar şimdilik İngilizce.',
    altBilgi: (B) => '<p class="muted tiny center">Kaynak: ' + esc(B.kaynak) + '</p>',
    uyari(q, toplam) {
      const yakin = q ? yakinUyari(q) : '';
      return yakin ? '<div class="note warn">“' + esc(yakin) + '” BLS’de birebir yok. ' +
        (toplam ? 'Gösterilenler en yakın ürünler; değerleri aynı sayılmamalı. ' : '') +
        'Türk ürünleri için TürKomp’a bak.</div>' : '';
    },
    satirAlt: (r, B) => esc(B.grup[r[0][0]]) + ' · ' + esc(r[0]),
    detayAlt: (r, B) => esc(B.grup[r[0][0]]) + ' · BLS kodu ' + esc(r[0]),
    koken: (r) => (DA.data.blsKoken ? DA.data.blsKoken[r[0]] : null),
    /* Tuz BLS'de ayrı ölçülmez: NACL = NA × 2,5 (BLS belgesi 5.8). */
    ekSatir(o, v, k, sutun) {
      if (o[0] !== 'na') return '';
      return '<tr><td class="sub2">Tuz eşdeğeri (Na × 2,5)</td><td class="n">' +
        (typeof v === 'number' ? '<b>' + yaz(v * 2.5 / 1000 * k) + '</b>' + DA.birim('g') : hucre(v, 'g', k)) +
        '</td>' + (sutun ? '<td class="koken">formül</td>' : '') + '</tr>';
    },
    /* Kaynak notu "blsOlsac": BLS enerji formülü kullanılabilir oligosakkariti
       CHO içinde 4 kcal/g saydıktan sonra 2 kcal/g daha ekliyor. Değer
       değiştirilmedi (klinik değer; karar diyetisyenin); fark burada gösterilir. */
    notlar(r, k) {
      const o = deger(r, 'oligo', KAYNAK.bls), e = deger(r, 'kcal', KAYNAK.bls);
      if (!(typeof o === 'number' && o > 0 && typeof e === 'number')) return '';
      return '<div class="note warn" id="blsOligo">Bu besinde ' + yaz(o * k) + ' g kullanılabilir oligosakkarit var. ' +
        'BLS enerjisi (' + yaz(e * k) + ' kcal) bunu iki kez sayıyor görünüyor; yalnız karbonhidrat içinde sayılınca ' +
        '<b>' + yaz((e - 2 * o) * k) + ' kcal</b>. Değer değiştirilmedi.' +
        (DA.kaynakRozet ? DA.kaynakRozet('bls') : '') + '</div>';
    },
    bilgi: (B) => '<p>Değerler 100 g yenilebilir kısım içindir; kabuk ve çekirdek çıkarılmıştır. <b>Veri yok</b> sıfır anlamına gelmez. ' +
      '<b>Eser</b>: var ama miktarı bilinmiyor. <b>Ölçüm sınırı altı</b>: analizde saptanamayacak kadar az.</p>' +
      '<p>Sağdaki etiket değerin nereden geldiğini söyler: analiz, literatür, başka veri tabanı, tarif hesabı (yemeğin ' +
      'malzemelerinden), <b>benzer besinden</b> (bu besin için ölçüm yok, benzerinin değeri alınmış) ya da formül.</p>' +
      '<p>Selenyum BLS 4.0’da bulunmuyor. B6, bakır, manganez ve florür BLS’de µg verilir; TÜBER tablolarıyla ' +
      'aynı olsun diye mg’a çevrildi. Amino asitler mg.</p>' +
      '<p class="muted" style="margin-bottom:0">Kaynak: ' + esc(B.kaynak) + '</p>',
    detayMount(r, kod, halaBurada) {
      if (DA.data.blsKoken) return;
      DA.need(['blsKoken']).then(() => { if (halaBurada()) detayYenile(r); }).catch(() => {});
    }
  };

  DA.views.bls = (parts, q) => {
    const GEREK = ['bls', 'blsSozluk'];
    if (!DA.hazir(GEREK)) {
      aktif = 'bls';
      return {
        title: 'BLS veri bankası', tab: 'besin', back: 'besin', noRecent: true,
        html: DA.iskelet('liste', 'BLS veri bankası hazırlanıyor', 8),
        mount() { DA.need(GEREK).then(() => DA.render(true)).catch(() => DA.toast('BLS verisi yüklenemedi')); }
      };
    }
    return gorunum('bls', parts, q);
  };

  /* Öteki veri bankaları kendini buradan kaydeder (js/turkomp.js) */
  DA.vb = {
    kaynakEkle: (T) => { KAYNAK[T.id] = T; },
    gorunum, kaynakSecici, araDuz, sirala, indeks, deger, sayi, katla, yaz,
    aktif: (id) => { aktif = id; }
  };
  /* Sonraki adım (menü analizi) ve testler için */
  DA.bls = {
    ara: (q, g) => araBls(KAYNAK.bls, q, g),
    sirala: (l, a, y, b) => sirala(l, a, y, b, KAYNAK.bls),
    deger: (r, a) => deger(r, a, KAYNAK.bls),
    indeks: () => indeks(KAYNAK.bls),
    cozumle, sayi, katla
  };
})();
