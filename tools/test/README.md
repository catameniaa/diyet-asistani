# Otomatik testler

```
node tools/test/run.js          # tam koşu (açık + koyu tema)
node tools/test/run.js --tek    # yalnızca açık tema, hızlı geçiş
```

Gereksinim: `playwright-core` ya da `playwright` ve bir Chromium.
Tarayıcı yolu `CHROME_PATH` ile değiştirilebilir. Sunucuyu test kendisi
başlatır, boş bir port seçer ve bitince kapatır. Hata varsa çıkış kodu 1'dir.

## Ne kontrol ediliyor?

**1. Hesaplayıcı testleri** (`testler.js` → `hesapTestleri`)
Bilinen girdi → bilinen çıktı. Beklenen değerler kaynaktaki formülden elle
hesaplanmıştır, uygulamadan türetilmemiştir; böylece formül bozulursa test
kırılır. Örnek: BKİ 70 kg / 170 cm = 24,2 · Devine erkek 180 cm = 75 kg ·
Mifflin–St Jeor 30 y / 180 cm / 80 kg = 1780 kcal · 500 kuralı 500 ÷ 40 =
1 Ü / 12,5 g · Holliday–Segar 25 kg = 1600 ml · GIR %10 dekstroz 6 ml/sa
3 kg = 3,33 mg/kg/dk.

Sınır davranışları da test edilir: BKİ 18,5 ve 25,0 tam sınırları, bel çevresi
94 cm eşiği, Blackburn kilo kaybı eşikleri, hipoglisemi uyarısı, eksik girdide
hata mesajı, 18 yaş altında TÜBER büyüme payı (×1,01).

**2. Veri bütünlük testleri** (`testler.js` → `veriTestleri`)
TÜBER tablolarının satır-sütun sayıları ve tablolar arası tutarlılık. Bu
testler, veri aktarılırken elle yapılan doğrulamaları kalıcılaştırır:

- Ek 1.5.x / protein / makro tablolarında her satırın uzunluğu = sütun sayısı + 2
- Ek 3.1.1, Ek 3.1.2, Ek 3.2.1, Ek 3.3.1'de 12 enerji düzeyi
- Ek 3.2.1 enerji satırı sütun başlığından ±10 kkal içinde
- Ek 3.2.1 satırlarının Ek 3.4.1/3.4.2'deki karşılıkları gerçekten var
- Ek 3.4.3'ün 28 besin ögesi satırı, her sütunda 28 değer, enerji karşılaması %100 ± 3
- Ek 3.4.3 sütunlarının (cinsiyet, yaş, enerji) Ek 3.4.1/3.4.2'de karşılığı var
- Ek 2.3.1'de 97 besin, her satırda 19 değer, enerji = 4P + 4KH + 9Y
- WHO büyüme eğrilerinde medyanda z = 0
- Gebelikte BKİ bandı eşleştirmesi (düzeltilmiş hatanın testi)
- Hesaplayıcı kimliklerinin benzersizliği, `DA.IA` ile `DA.calcs` örtüşmesi,
  `data:` ile bildirilen anahtarların `DA.LAZY`'de tanımlı olması

**3. Arayüz davranış testleri** (`run.js`)
Ekranları gerçekten gezip DOM'dan sonuç okur: NRS-2002 / MUST / MNA-SF puanı
ve bandı, FINDRISC toplamı, öğün başına karbonhidrat dağılımı (paylar %100
değilken bile toplamın hedefe eşitlenmesi), çocuk persentil eğrisinin
çizilmesi, aramanın tembel yüklenen kaynakları kapsaması.

**4. Rota taraması** (`run.js`)
51 rota iki temada açılır; çökme, boş ekran, eksik başlık, yatay taşma ve
konsol hatası aranır.

## Yeni test eklemek

Hesaplayıcı ya da veri testi için `testler.js` içine gir — tarayıcıda çalışan
düz bir dosyadır, uygulamaya dahil edilmez. `ekle(grup, ad, beklenen, bulunan)`
ile değer karşılaştır, `kosul(grup, ad, koşul, ayrıntı)` ile mantıksal kontrol
yap. Ekran gezmesi gereken testler `run.js` içindeki arayüz bölümüne girer.

Beklenen değeri uygulamanın kendisinden hesaplatma — kaynaktan elle hesapla,
yoksa test hatayı da birlikte dondurur.
