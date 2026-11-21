/* Kaynak notları — TÜBER 2022'de bulunup düzeltilen ya da not düşülen yerler.
   Her not ilgili ekrandan rozetle buraya bağlanır. */
(function () {
  'use strict';
  const { esc, icon } = DA;

  /* kaynak: TÜBER dışındaki kaynaklar için; boşsa TÜBER 2022 */
  const NOT = [
    { id: 'potasyum', ek: 'Ek 3.4.1 / 3.4.2', t: 'Potasyum satırının birimi',
      tip: 'Birim hatası', ekran: ['hedef'],
      n: 'Kaynakta potasyum satırının birimi <b>mg/gün</b> yazılmıştır; verilen değerler (3–4,7) <b>g/gün</b> büyüklüğündedir. ' +
         'Yetişkin yeterli alımı 4700 mg olduğundan tabloda <b>g/gün</b> olarak gösterildi. Aynı tabloda sodyum gerçekten mg’dır (1500–2300).' },
    { id: 'kvit', ek: 'Tablo 7.6', t: 'K vitamini birimi (7–24 ay)',
      tip: 'Birim hatası', ekran: ['bebek'],
      n: 'Kaynakta K vitamini birimi <b>mg</b> yazılmıştır; verilen büyüklükler (10–12) <b>µg</b>’dır. Tabloda µg olarak gösterildi.' },
    { id: 'riboflavin', ek: 'Tablo 7.9', t: 'Emzirmede riboflavin değeri',
      tip: 'Şüpheli değer', ekran: ['gebe'],
      n: 'Emziren kadın için riboflavin <b>1,2 mg/gün</b> yazılmıştır; bu, yetişkin kadın (1,6) ve gebe (1,9) değerlerinin <b>altındadır</b>. ' +
         'Emzirmede gereksinimin düşmesi beklenmez. Kaynaktaki değer aynen aktarıldı, değiştirilmedi.' },
    { id: 'e2', ek: 'Ek 3.4.3', t: '“E;2” sütunu yanlış enerji bloğunda',
      tip: 'Düzeltildi', ekran: ['hedef'],
      n: 'Erkek 2 yaş sütunu <b>1200 kkal</b> başlığının altına basılmış. Verileri 1000 kkal örüntüsüne ait: ' +
         'CHO karşılaması %93 = 122/130; 1200 kkal örüntüsü %109 verir. Ek 3.3.1 ve Ek 3.4.1 de erkek 2 yaş az aktifi 1000 kkal’de gösterir. ' +
         'Uygulamada <b>1000 kkal</b> olarak yerleştirildi.' },
    { id: 'e3200', ek: 'Ek 3.4.3', t: '3200 kkal bloğunda sütun etiketleri ters',
      tip: 'Düzeltildi', ekran: ['hedef'],
      n: 'Blok “E;18 | E;17” diye etiketli ama değerler ters: kalsiyum 124 = 1429/1150 (17 yaş hedefi), 143 = 1429/1000 (18 yaş hedefi). ' +
         'Kalsiyum, magnezyum, fosfor, çinko, bakır, riboflavin, B6, lif ve protein olmak üzere <b>dokuz besin ögesinde</b> birden ters çıkıyor. ' +
         'Komşu bloklar (3000 ve 2600 kkal) doğru hesaplandığı için hata bu iki sütuna özeldir. Etiketler değiştirildi.' },
    { id: 'kesir', ek: 'Ek 3.1.1', t: 'Basılmamış kesirler',
      tip: 'Okunamadı', ekran: ['oruntu'],
      n: '“Balık (porsiyon/hafta)” satırının 1000 ve 1400 kkal hücreleri kesir yerine <b>yüzde işaretiyle</b> basılmış; ' +
         '“Yeşil yapraklı sebzeler” satırının 1600 kkal hücresi paydası olmayan “1/” şeklinde. ' +
         'Üç hücre tahmin edilmedi, tabloda <b>?</b> olarak bırakıldı.' },
    { id: 'buyume', ek: 'Tablo 10.2', t: 'Çocukta büyüme çarpanı',
      tip: 'Çözüldü', ekran: ['enerji', 'enerjiref'],
      n: 'Kaynakta çocuk satırı “DEH × PAL 0,01 (büyüme çarpanı)” diye basılmış, PAL ile büyüme çarpanı ' +
         'arasındaki işlem <b>eksik</b>. Önce EFSA uygulamasına bakarak × 1,01 varsaymıştık. ' +
         'Ek 1.1.1–1.1.2 içeri alınınca doğrusu sayısal olarak belirlendi: 68 çocuk satırının tamamında ' +
         '<b>TEH = DEH × (PAL + 0,01)</b> tutuyor, × 1,01 tutmuyor. Örnek: erkek 10 yaş medyan, DEH 1150 → ' +
         'orta aktif 1851 = 1150 × 1,61 (× 1,01 olsaydı 1859 çıkardı). Hesaplayıcı buna göre düzeltildi.' },
    { id: 'ek232', ek: 'Ek 2.3.2', t: 'İsteğe bağlı besinlerin mikro besin sütunları',
      tip: 'Alınmadı', ekran: ['istege'],
      n: 'Tablonun mikro besin sütunları kaynakta büyük ölçüde boştur (dipnot: “(-) Analiz edilmemiştir”) ve ' +
         'sütun hizalaması güvenilir değildir. Bu tablo uygulamaya alınmadı; aynı besinler için ' +
         '<b>Ek 2.1.11</b> (75 kkal katları) kullanılıyor.' },
    { id: 'ek343', ek: 'Ek 3.4.3', t: 'Riboflavin ve B6 oranları yeniden üretilemiyor',
      tip: 'Not', ekran: ['hedef'],
      n: 'Tablodaki karşılama yüzdeleri Ek 3.2.1 içeriği ÷ Ek 3.4.1 hedefi ile karşılaştırıldığında ' +
         '2000–3200 kkal aralığında 337 kontrolün 336’sı tutuyor. Ancak <b>riboflavin ve B6</b> 64 sütunun tamamında sapıyor; ' +
         'kaynağın bu iki öge için farklı bir hedef değeri kullandığı anlaşılıyor. Tablodaki resmî değerler olduğu gibi aktarıldı.' },
    { id: 'toplu45', kaynak: 'Ulusal Menü Planlama ve Uygulama Rehberi (2020)', ek: 'Tablo 4.5, EK-1',
      t: 'Aylık sıklık tablosu ve dört kaplı menü', tip: 'Not', ekran: ['toplumenu'],
      n: 'Tablo 4.5 değerleri rehberin çevrim içi kopyasından okundu; <b>basılı rehberle doğrulanmalı</b>. ' +
         'Tablonun asgari toplamları 21 günde 1. grup için 20 (kış) / 19 (yaz), 2. grup için 21, 3. grup için 20 (+ garnitür yoğurt) ediyor: ' +
         'günde <b>bir 1., bir 2., bir 3. grup</b> yemeğine denk. Her gün dördüncü kap verilince 2. ya da 3. grubun azamileri aşılır. ' +
         'Taslak 1. ve 2. kapı asgari sayılarla dağıtır, 3. kapı asgariyle, 4. kapı azamiye oranla yayar; aralık yalnız 1. ve 2. grupta işaretlenir. ' +
         'Yazın etli kuru baklagil asgarisi tabloda “–”: 0 alındı. Kış/yaz sınırı okunan kısımda yok; Nisan–Eylül yaz varsayıldı.' },
    { id: 'blsOlsac', kaynak: 'BLS 4.0 (Max Rubner-Institut, 2025)', ek: 'Components dosyası ENERCC formülü; Dokumentation 5.2',
      t: 'Oligosakkarit enerjisi iki kez sayılıyor görünüyor', tip: 'Şüpheli değer', ekran: ['bls'],
      n: 'Bileşen dosyasındaki enerji formülü kullanılabilir karbonhidratı (CHO) 4 kcal/g sayıyor ve <b>ayrıca 2 × OLSAC</b> ekliyor; ' +
         'oysa CHO tanımı (CHO = şeker + nişasta + OLSAC + polyol) kullanılabilir oligosakkaritleri zaten içeriyor. ' +
         'Böylece oligosakkarit 6 kcal/g sayılmış oluyor. Belgenin PDF’indeki formülde (5.2) OLSAC terimi hiç yok; ' +
         'veri bileşen dosyasının formülüne uyuyor (OLSAC’ı 0,5 g’ı aşan 114 besinin tamamında). ' +
         'En açık örnek glukoz şurubu (S151000): su 20,5 g, CHO 79,5 g, enerji <b>413 kcal</b>; saf şekerin 400 kcal’sinden fazla. ' +
         'Yalnız CHO içinde sayılınca 318 kcal çıkıyor. 411 besinde OLSAC var, 64’ünde fark 5 kcal’yi aşıyor (çoğu şurup, şekerleme, malt özütü, bal). ' +
         'Değerler <b>olduğu gibi aktarıldı, değiştirilmedi</b>; ayrıntı ekranı etkilenen besinde farkı ayrıca gösterir.' },
    { id: 'turkompToplam', kaynak: 'TürKomp (cihaza içe aktarılan dosya)', ek: 'Ana bileşen toplamı',
      t: 'Ana bileşenleri 100 g’ı tutmayan besinler', tip: 'Şüpheli değer', ekran: ['turkomp'],
      n: 'Su, kül, protein, yağ, karbonhidrat, posa ve alkolün toplamı 100 g yenilebilir kısımda 100 g’a yakın olmalı. ' +
         'Kasım 2026 dosyasında 645 besinin 23’ünde 2 g’dan fazla sapıyor. Bir kısmı açıklanabilir: tatlandırıcı ve diyabetik ' +
         'ürünlerde şeker alkolleri ya da tatlandırıcı toplama girmiyor (ör. tablet tatlandırıcı 53,4 g). Bir kısmı ise hatalı değer ' +
         'gösteriyor: koyun bağırsağı <b>125,9 g</b>, Erzurum kavurması <b>122,1 g</b>. TürKomp ayrıntı ekranı sapma 5 g’ı ' +
         'aşınca uyarır. Değerler <b>olduğu gibi gösterilir, değiştirilmez</b>; kaynak sitesinden doğrulanmalı.' }
  ];
  DA.kaynakNot = NOT;

  /* İlgili ekranın altına konulacak rozet */
  DA.kaynakRozet = (ekranId) => {
    const list = NOT.filter((x) => x.ekran.indexOf(ekranId) >= 0);
    if (!list.length) return '';
    return '<a class="btn ghost block" href="#/daha/kaynaknot?e=' + encodeURIComponent(ekranId) + '">' +
      icon('book') + ' Bu tabloda ' + list.length + ' kaynak notu var</a>';
  };

  const TIP_TONE = { 'Düzeltildi': 'ok', 'Birim hatası': 'warn', 'Şüpheli değer': 'warn',
    'Okunamadı': 'bad', 'Alınmadı': '', 'Yorum': 'info', 'Not': 'info' };

  DA.views._kaynakNot = (q) => {
    const vurgu = q && q.get('e');
    return {
      title: 'Kaynak notları', tab: 'ana', back: 'daha', noRecent: true,
      html:
        '<div class="note">TÜBER 2022 ve öteki rehberlerin verilerini uygulamaya aktarırken bulunan dizgi hataları, birim tutarsızlıkları ve ' +
        'okunamayan yerler burada toplanır. Her not, kaynaktaki değerin ne olduğunu ve uygulamada ne yapıldığını söyler.</div>' +
        NOT.map((x) => {
          const on = vurgu && x.ekran.indexOf(vurgu) >= 0;
          return '<details class="acc"' + (on ? ' open' : '') + '><summary>' + esc(x.t) +
            ' <span class="badge ' + (TIP_TONE[x.tip] || '') + '" style="margin-left:6px">' + esc(x.tip) + '</span></summary>' +
            '<div class="body"><p class="muted tiny">' + esc((x.kaynak ? x.kaynak + ' · ' : '') + x.ek) + '</p><p style="margin-bottom:0">' + x.n + '</p></div></details>';
        }).join('') +
        '<p class="muted tiny center">Kaynak: T.C. Sağlık Bakanlığı, Türkiye Beslenme Rehberi (TÜBER) 2022; aksi yazılan notlarda o kaynak.</p>'
    };
  };
})();
