/* Klinik hızlı referans içeriği. Değerler yetişkinler için GENEL/YAKLAŞIK aralıklardır.
   Laboratuvarlar farklı referans aralıkları kullanabilir; hasta kararı için raporun kendi aralığına ve güncel kılavuza bakın. */
(function () {
  'use strict';
  const ul = (a) => '<ul>' + a.map((x) => '<li>' + x + '</li>').join('') + '</ul>';
  const tbl = (head, rows) => '<table class="t"><thead><tr>' + head.map((h) => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>' +
    rows.map((r) => '<tr>' + r.map((c) => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table>';

  DA.data.ref = [
    { id: 'lab', t: 'Laboratuvar referans değerleri', tags: 'lab kan biyokimya hemogram glukoz kolesterol', h:
      '<p class="muted small">Yaklaşık yetişkin aralıkları. Kendi laboratuvarınızın aralığı geçerlidir.</p>' +
      tbl(['Test', 'Değer'], [
        ['Açlık glukoz', '70–99 mg/dL (100–125 prediyabet; ≥126 diyabet)'],
        ['HbA1c', '<%5,7 normal; %5,7–6,4 prediyabet; ≥%6,5 diyabet'],
        ['Total kolesterol', '<200 mg/dL'],
        ['LDL', '<100 mg/dL optimal; 100–129 normale yakın; 130–159 sınırda yüksek'],
        ['HDL', 'Erkek >40, kadın >50 mg/dL'],
        ['Trigliserit', '<150 mg/dL'],
        ['Hemoglobin (anemi sınırı, WHO)', 'Erkek <13, kadın <12, gebe <11 g/dL'],
        ['Albümin', '3,5–5,0 g/dL'],
        ['Prealbümin', 'Yaklaşık 15–36 mg/dL'],
        ['Kreatinin', 'Erkek ~0,7–1,3; kadın ~0,6–1,1 mg/dL'],
        ['Sodyum / Potasyum', '135–145 / 3,5–5,1 mmol/L'],
        ['Kalsiyum', 'Yaklaşık 8,6–10,2 mg/dL'],
        ['Magnezyum / Fosfor', '~1,7–2,2 / 2,5–4,5 mg/dL'],
        ['Vitamin B12', 'Yaklaşık >200–300 pg/mL yeterli (laboratuvara göre)'],
        ['25-OH Vitamin D', '<20 ng/mL eksiklik; 20–29 yetersizlik; ≥30 yeterli (Endocrine Society)'],
        ['TSH', 'Yaklaşık 0,4–4,0 mIU/L'],
        ['Ürik asit', 'Erkek ~3,4–7,0; kadın ~2,4–6,0 mg/dL'],
        ['AST / ALT', 'Genellikle <40 U/L'],
        ['CRP', 'Genellikle <5 mg/L']
      ]) },
    { id: 'makro', t: 'Enerji ve makro besin önerileri', tags: 'enerji karbonhidrat protein yağ lif tuz şeker', h:
      ul([
        'Enerji katsayıları: karbonhidrat 4, protein 4, yağ 9, alkol 7, lif ~2 kcal/g.',
        'AMDR: karbonhidrat %45–65, protein %10–35, yağ %20–35.',
        'Protein RDA: 0,8 g/kg/gün (sağlıklı yetişkin). Sporcu ve yaşlıda genellikle daha yüksek (1,2–2,0 g/kg) önerilir.',
        'Doymuş yağ: enerjinin <%10’u (WHO). Trans yağ: <%1.',
        'Eklenmiş şeker: enerjinin <%10’u (WHO), <%5 daha iyi.',
        'Lif: ≥25 g/gün (≈14 g/1000 kcal).',
        'Tuz: <5 g/gün (≈2 g sodyum) (WHO).',
        'Sıvı: yetişkinde genelde 30–35 ml/kg/gün (ya da ~1 ml/kcal).'
      ]) },
    { id: 'vitmin', t: 'Vitamin ve mineral RDA/AI (yetişkin 19–50 yaş)', tags: 'vitamin mineral rda dri demir kalsiyum çinko', h:
      '<div class="note"><b>Türkiye değerleri için:</b> <a href="#/hesapla/tuber">TÜBER referans değerleri</a> hesaplayıcısı — yaş ve cinsiyete göre PRI/AI, EAR ve üst sınır (UL). Aşağıdaki tablo ABD/Kanada DRI değerleridir, karşılaştırma için bırakılmıştır.</div>' +
      '<p class="muted small">ABD/Kanada DRI değerleri (E = erkek, K = kadın).</p>' +
      tbl(['Besin ögesi', 'E', 'K'], [
        ['A vitamini (µg RAE)', '900', '700'], ['C vitamini (mg)', '90', '75'], ['D vitamini (µg)', '15', '15'], ['E vitamini (mg)', '15', '15'],
        ['K vitamini (µg, AI)', '120', '90'], ['B1 tiamin (mg)', '1,2', '1,1'], ['B2 riboflavin (mg)', '1,3', '1,1'], ['B3 niasin (mg NE)', '16', '14'],
        ['B6 (mg)', '1,3', '1,3'], ['Folat (µg DFE)', '400', '400'], ['B12 (µg)', '2,4', '2,4'],
        ['Kalsiyum (mg)', '1000', '1000'], ['Demir (mg)', '8', '18'], ['Çinko (mg)', '11', '8'], ['Magnezyum (mg)', '400–420', '310–320'],
        ['Potasyum (mg, AI)', '3400', '2600'], ['İyot (µg)', '150', '150'], ['Selenyum (µg)', '55', '55']
      ]) },
    { id: 'dm', t: 'Diyabet: tanı ve glisemik hedefler (TEMD)', tags: 'diyabet şeker tanı hba1c ogtt hedef temd hipoglisemi', h:
      '<p class="muted small">TEMD kılavuzu doğrultusunda. Hedefler bireyselleştirilir; hasta kararı için güncel kılavuza bakın.</p>' +
      '<div class="sect">Tanı eşikleri</div>' +
      tbl(['Ölçüm', 'Diyabet tanısı'], [
        ['Açlık kan şekeri (AKŞ)', '≥126 mg/dL (en az 8 saat açlık)'],
        ['OGTT 2. saat (75 g glukoz)', '≥200 mg/dL'],
        ['HbA1c', '≥%6,5'],
        ['Rastlantısal kan şekeri', '≥200 mg/dL + diyabet semptomları (poliüri, polidipsi, kilo kaybı)']
      ]) +
      '<div class="sect">Glisemik hedefler (yetişkin, gebe olmayan)</div>' +
      tbl(['Ölçüm', 'Hedef'], [
        ['Açlık / öğün öncesi', '80–130 mg/dL'],
        ['Tokluk (öğün sonrası 2. saat)', '<180 mg/dL'],
        ['HbA1c', '<%7,0']
      ]) +
      ul([
        'HbA1c bireyselleştirmesi: genç ve yeni tanılılarda <%6,5; yaşlı ya da komplikasyonlu bireylerde <%8,0.',
        'Hipoglisemi (<70 mg/dL): 15 g hızlı karbonhidrat, 15 dk sonra tekrar ölç (15-15 kuralı).',
        'Prediyabet: AKŞ 100–125 mg/dL (bozulmuş açlık glukozu), OGTT 2. saat 140–199 mg/dL, HbA1c %5,7–6,4.'
      ]) },
    { id: 'dmtbt', t: 'Diyabet: tıbbi beslenme tedavisi ve karbonhidrat sayımı', tags: 'diyabet karbonhidrat sayımı insülin 500 1800 değişim tbt beslenme', h:
      ul([
        'Tek bir “diyabet diyeti” yoktur; bireyselleştirilmiş, karbonhidrat miktarı ve kalitesi tutarlı, lif yüksek, eklenmiş şeker düşük plan uygulanır.',
        'Kilo verme (fazla kiloluda) %5–10 hedefi glisemik kontrolü belirgin iyileştirir.',
        '1 karbonhidrat değişimi = 15 g karbonhidrat. Bazı merkezlerde 10 g kullanılabilir; standart 15 g’dır.',
        'Öğünlere karbonhidrat dağıtımı ve değişim sayıları için <a href="#/hesapla/degisim">Değişim listesi</a> hesaplayıcısını kullanın.'
      ]) +
      '<div class="sect">İnsülin hesapları</div>' +
      tbl(['Kural', 'Formül', 'Anlamı'], [
        ['500 kuralı (İ:KH oranı)', '500 ÷ günlük toplam insülin dozu', '1 ünite hızlı etkili insülinin karşıladığı karbonhidrat (g)'],
        ['1800 kuralı (düzeltme faktörü)', '1800 ÷ günlük toplam insülin dozu', '1 ünite insülinin kan şekerini düşürdüğü miktar (mg/dL)']
      ]) +
      '<p class="muted small">Örnek: günde toplam 40 ünite insülin kullanan bir hastada İ:KH = 500/40 = 12,5 (≈12 g karbonhidrat için 1 ünite); düzeltme faktörü = 1800/40 = 45 mg/dL.</p>' +
      '<div class="note warn">İ:KH oranı ve düzeltme faktörü hastaya özeldir, hekim tarafından belirlenir. Hesaplayıcı yalnızca eğitim amaçlıdır. <a href="#/hesapla/khsayim">Karbonhidrat sayımı hesaplayıcısı</a></div>' },
    { id: 'ht', t: 'Hipertansiyon ve dislipidemi', tags: 'tansiyon dash kolesterol trigliserit', h:
      ul([
        'DASH: sebze, meyve, tam tahıl, az yağlı süt ürünleri, kuruyemiş; doymuş yağ ve sodyum düşük.',
        'Sodyum: <2300 mg/gün (≈5,8 g tuz); ideal hedef ~1500 mg/gün. Potasyumdan zengin besinler (böbrek yetmezliği yoksa) yardımcıdır.',
        'Hipertrigliseridemi: eklenmiş şeker, rafine karbonhidrat ve alkolü azalt; omega-3’lü balık haftada 2 kez.',
        'LDL yüksekliği: doymuş/trans yağı azalt, çözünür lif (yulaf, baklagil) artır, kilo kontrolü.'
      ]) },
    { id: 'kbh', t: 'Kronik böbrek hastalığı (KBH)', tags: 'böbrek diyaliz potasyum fosfor protein', h:
      ul([
        'Diyaliz öncesi protein: yaklaşık 0,55–0,8 g/kg/gün (evre, kılavuz ve hekim kararına göre).',
        'Hemodiyaliz: protein yaklaşık 1,0–1,2 g/kg/gün; enerji ~25–35 kcal/kg.',
        'Sodyum kısıtlaması (tansiyon ve ödem için); potasyum ve fosfor ise laboratuvar değerlerine göre sınırlanır.',
        'Sıvı kısıtı genellikle diyalizli hastada idrar çıkışı + ~500–1000 ml.',
        'Hekim/nefroloji ekibi ile birlikte bireyselleştirin; hasta başı planlama gerekir.'
      ]) },
    { id: 'celiac', t: 'Çölyak, IBS, reflü', tags: 'çölyak gluten ibs fodmap reflü gerd', h:
      ul([
        'Çölyak: ömür boyu glütensiz diyet. Buğday, arpa, çavdar yasak; yulafta çapraz bulaşma; etiket okuma ve mutfak bulaşması önemli.',
        'IBS: düzenli öğün, lif türü ayarı; düşük FODMAP diyeti 2–6 hafta eliminasyon + yeniden tanıtma + kişiselleştirme aşamalarıdır.',
        'GÖRH: öğün hacmini küçült, akşam geç yemekten kaçın, tetikleyicileri (yağlı yemek, çikolata, kahve, alkol, baharat) bireysel belirle; kilo fazlaysa kilo ver.'
      ]) },
    { id: 'gebelik', t: 'Gebelik ve laktasyon', tags: 'gebelik hamilelik emzirme folat enerji', h:
      ul([
        'Ek enerji (DRI): 1. trimester ek yok; 2. trimester +340; 3. trimester +452 kcal/gün; laktasyon (ilk 6 ay) yaklaşık +330 kcal/gün.',
        'Folik asit: gebelik öncesinden ilk trimesterin sonuna dek 400 µg/gün.',
        'Protein RDA: gebelikte 1,1 g/kg/gün (2. ve 3. trimestere doğru artar).',
        'Kaçınılacaklar: çiğ/az pişmiş et-yumurta-deniz ürünleri, pastörize olmayan süt ürünleri (listeria); yüksek cıvalı balık (köpek balığı, kılıç balığı); alkol.',
        'Kafein: genellikle <200 mg/gün (≈2 fincan filtre kahve).'
      ]) },
    { id: 'malnut', t: 'Malnütrisyon tarama ve değerlendirme', tags: 'malnütrisyon must nrs mna glim tarama', h:
      ul([
        'Tarama araçları: MUST (yetişkin/toplum), NRS-2002 (hastane), MNA (yaşlı), STAMP/STRONGkids/PYMS (çocuk).',
        'GLIM tanı: ≥1 fenotipik (istem dışı kilo kaybı, düşük BKİ, azalmış kas kütlesi) + ≥1 etiyolojik (azalmış alım/emilim, hastalık yükü/inflamasyon).',
        'Anlamlı kilo kaybı: 1 haftada %1–2, 1 ayda %5, 3 ayda %7,5, 6 ayda %10 (ciddi: sırasıyla >%2, >%5, >%7,5, >%10).',
        'Refeeding riski: uzun açlık/düşük BKİ/düşük K-P-Mg. Enerjiyi yavaş artır, elektrolit izle, tiamin ver.',
        'Kritik hastalık için yaklaşık başlangıç: enerji 20–25 kcal/kg (akut faz), protein yaklaşık 1,3 g/kg (ESPEN 2019; güncel kılavuzu kontrol edin).'
      ]) },
    { id: 'pku', t: 'PKU (fenilketonüri)', tags: 'pku fenilalanin metabolik', h:
      ul([
        'Fenilalanin (Phe) kısıtlı diyet; Phe içermeyen (Phe-free) amino asit karışımı ile protein ve tirozin ihtiyacı karşılanır.',
        'Kan Phe hedefi merkezden merkeze değişir; Avrupa kılavuzunda genellikle 120–360 µmol/L (≤12 yaş ve gebelik), >12 yaşta 120–600 µmol/L.',
        'Doğal protein (süt, et, yumurta, baklagil) miktarı bireysel Phe toleransına göre belirlenir; düşük proteinli özel ürünler kullanılır.',
        'Aspartam Phe içerdiği için etiketlerde “fenilalanin kaynağı içerir” uyarısına dikkat edilir.'
      ]) },
    { id: 'tuber', t: 'TÜBER: makro dağılım, lif, tuz ve su', tags: 'tüber türkiye beslenme rehberi makro lif posa tuz su enerji', h:
      '<p class="muted small">Türkiye Beslenme Rehberi (TÜBER) doğrultusunda, sağlıklı yetişkin için.</p>' +
      '<div class="sect">Makro besin ögeleri (enerjinin yüzdesi)</div>' +
      tbl(['Besin ögesi', 'Öneri'], [
        ['Karbonhidrat', '%45–60 — kompleks karbonhidrat ve tam tahıl tercih edilir; rafine şeker <%10'],
        ['Protein', '%10–20 — böbrek fonksiyonları normalse ortalama 0,8–1,0 g/kg/gün'],
        ['Yağ', '%20–35'],
        ['— Doymuş yağ', '<%10'],
        ['— Çoklu doymamış yağ', '%6–10'],
        ['— Tekli doymamış yağ', '%10–15']
      ]) +
      '<div class="note">Yaşa ve cinsiyete göre tam tablo için <a href="#/hesapla/tuber">TÜBER referans değerleri</a> hesaplayıcısı — makro aralıkları, protein g/kg, posa, su, vitamin ve mineraller.</div>' +
      '<div class="sect">Lif, tuz ve su</div>' +
      tbl(['Besin ögesi', 'Öneri'], [
        ['Lif (posa)', 'Yetişkinde <b>25 g/gün</b> (AI, Ek 1.4.1). 25–30 g ve 14 g/1000 kcal yaygın kullanılan diğer ifadelerdir.'],
        ['Tuz', '<5 g/gün (≈1 silme tatlı kaşığı; sodyum <2000 mg). Diyabetli hipertansiflerde daha da kısıtlanabilir.'],
        ['Su', 'Kadın 2,0 L/gün, erkek 2,5 L/gün (AI, Ek 1.4.1); çocukta yaşa göre 1,3–2,5 L. 30–35 ml/kg/gün pratik bir yaklaşımdır.']
      ]) },
    { id: 'tuberenerji2', t: 'TÜBER: Henry 2005 eşitlikleri ve faktöriyel yöntem', tags: 'tüber henry deh bmh dinlenme enerji faktöriyel pal bazal metabolizma', h:
      '<p class="muted small">TÜBER 2022, Türkiye referans enerji değerlerini bu yöntemle hesaplar (Tablo 10.2–10.3, s. 225–226). Bazal (BEH) yerine <b>dinlenme enerji harcaması (DEH)</b> terimi kullanılır.</p>' +
      '<div class="sect">Faktöriyel yöntem</div>' +
      ul([
        '<b>Yetişkin:</b> Toplam enerji harcaması = DEH × PAL',
        '<b>Çocuk ve adolesan:</b> Toplam enerji harcaması = DEH × PAL × büyüme çarpanı (%1)'
      ]) +
      '<div class="sect">Henry 2005 — DEH (kkal/gün)</div>' +
      '<p class="muted small">Ağırlık kg, boy <b>metre</b> cinsindendir.</p>' +
      tbl(['Yaş', 'Erkek', 'Kadın / Kız'], [
        ['0–3', '28,2 × kg + 859 × m − 371', '30,4 × kg + 703 × m − 287'],
        ['3–10', '15,1 × kg + 74,2 × m + 306', '15,9 × kg + 210 × m + 349'],
        ['10–18', '15,6 × kg + 266 × m + 299', '9,40 × kg + 249 × m + 462'],
        ['18–30', '14,4 × kg + 313 × m + 113', '10,4 × kg + 615 × m − 282'],
        ['30–60', '11,4 × kg + 541 × m − 137', '8,18 × kg + 502 × m − 11,6'],
        ['>60', '11,4 × kg + 541 × m − 256', '8,52 × kg + 421 × m + 10,7']
      ]) +
      ul([
        'Yaş sınırları çakışmasın diye kaynakta şöyle tanımlanmıştır: 0–<3, 3–<10, 10–<18, 18–<30, 30–59, ≥60.',
        'Yaşlıda PAL: 60–69 yaş erkek ve kadın 1,71; 70–79 yaş erkek 1,64, kadın 1,62 (orta aktif).',
        'TÜBER’in yetişkin referans değerleri, ölçülmüş boy ve <b>BKİ 22 kg/m²’ye göre düzeltilmiş ağırlık</b> ile hesaplanmıştır; bireysel hesapta kişinin kendi ağırlığı kullanılır.'
      ]) +
      '<div class="note"><b>Kaynaktaki dizgi hatası:</b> Tablo 10.2’de büyüme çarpanı “× 0,01” yazılmıştır; bu toplam enerjiyi yüze bölerdi. EFSA ve FAO/WHO/UNU’da çocuklarda büyüme payı enerjinin %1’idir, yani <b>× 1,01</b>. Hesaplayıcı 1,01 kullanır.</div>' +
      '<div class="note"><a href="#/hesapla/enerji">Enerji hesaplayıcısında</a> formül olarak “Henry 2005 (TÜBER 2022)” seçilebilir.</div>' },
    { id: 'tuberenerji', t: 'TÜBER: yaşa ve cinsiyete göre enerji ve sıvı', tags: 'tüber enerji ihtiyacı sıvı yaş cinsiyet sedanter', h:
      '<p class="muted small">Sedanter / hafif aktif yetişkin için yaklaşık değerler. Bireysel hesap için enerji hesaplayıcısını kullanın.</p>' +
      tbl(['Yaş', 'Cinsiyet', 'Enerji (kcal/gün)', 'Sıvı (L/gün)'], [
        ['19–30', 'Erkek', '~2400–2600', '2,5'], ['19–30', 'Kadın', '~1800–2000', '2,0'],
        ['31–50', 'Erkek', '~2300–2500', '2,5'], ['31–50', 'Kadın', '~1800–2000', '2,0'],
        ['51–70', 'Erkek', '~2100–2300', '2,5'], ['51–70', 'Kadın', '~1700–1900', '2,0'],
        ['70+', 'Erkek', '~1900–2100', '2,5'], ['70+', 'Kadın', '~1500–1700', '2,0']
      ]) +
      '<p class="muted small">Değerler ortalamadır; boy, kilo, vücut kompozisyonu ve fiziksel aktivite düzeyine göre değişir.</p>' },
    { id: 'form', t: 'Sık kullanılan formüller', tags: 'formül bki bmh harris mifflin ideal kilo', h:
      ul([
        'BKİ = kg / (boy m)².',
        'Mifflin–St Jeor: E: 10×kg + 6,25×cm − 5×yaş + 5; K: … − 161.',
        'Harris–Benedict (revize): E: 88,362 + 13,397×kg + 4,799×cm − 5,677×yaş; K: 447,593 + 9,247×kg + 3,098×cm − 4,330×yaş.',
        'Katch–McArdle: 370 + 21,6 × yağsız kütle (kg).',
        'TEH = BMH × PAL (1,2 / 1,375 / 1,55 / 1,725 / 1,9).',
        'Devine: E 50 + 2,3×(boy inç − 60); K 45,5 + 2,3×(boy inç − 60).',
        'Düzeltilmiş kilo = İdeal + 0,25 × (gerçek − ideal).',
        'Holliday–Segar (çocuk sıvı): ilk 10 kg 100 ml/kg; sonraki 10 kg 50 ml/kg; sonrası 20 ml/kg.',
        'GIR (mg/kg/dk) = dekstroz % × 10 × hız (ml/sa) / 60 / kg.'
      ]) }
  ];
})();
