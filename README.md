# Diyet Asistanı

Dyt. Can Bayramoğlu

Diyetetik öğrencileri ve diyetisyenler için ücretsiz, reklamsız, çevrimdışı çalışan mobil web uygulaması (PWA).

- 15 hesaplayıcı: BKİ, enerji (BMH/TEH, makrolar), ideal kilo, bel/kalça ve vücut yağı, kilo kaybı %,
  sıvı, enteral, GIR, gebelik/laktasyon, stres faktörü, çocuk enerji-protein, glisemik indeks ve yük
- Çocuk persentil (WHO): ağırlık/yaş, boy/yaş, BKİ/yaş için z-skoru, persentil ve büyüme eğrisi
- Değişim listesi: sayaçlı giriş, hedef enerjiye göre otomatik tam sayı dağıtım (grup kilitlenebilir),
  öğünlere enerji payına göre bölme, porsiyon örnekleri, menü hedefi ile karşılaştırma
- Karbonhidrat sayımı: İ:KH oranı (500 kuralı), düzeltme faktörü (1800 kuralı), öğün ve düzeltme bolusu
- Genel arama: besin, hesaplayıcı, referans, danışan ve menülerde tek kutudan
- Favoriler, son açılanlar ve açık/koyu/otomatik tema
- Yedek hatırlatması (son yedekten 14 gün geçince uyarır) ve yeni sürüm bildirimi
- 74 çalışma kartı (aralıklı tekrar): TEMD, TÜBER, değişim listesi, WHO persentil eşikleri
- Besin veritabanı (124 besin) ve öğün öğün menü planlayıcı, PDF/paylaş
- Danışan takibi (ölçümler, grafik, notlar), 0–19 yaş için otomatik WHO büyüme persentili izlemi,
  hesapları dosyaya işleme ve tek sayfalık danışan raporu (PDF / paylaş)
- Klinik hızlı referans (TEMD diyabet tanı/hedefleri, TÜBER önerileri), çalışma kartları (aralıklı tekrar), staj günlüğü
- TÜBER 2022 referans değerleri: yaşa ve cinsiyete göre makro aralıkları, protein (g/kg ve g/gün),
  posa, su, vitamin-mineral önerisi (PRI/AI), ortalama gereksinim (EAR) ve üst sınır (UL)
- Enerji hesabında Henry 2005 eşitlikleri (TÜBER'in kullandığı yöntem) seçeneği
- TÜBER enerji referans değerleri (Ek 1.1.1–1.1.4): yaş, boy persentili ve PAL'e göre
  Türkiye gereksinimi; hesaplayıcının çıktısıyla yan yana
- Yöntem ve tanımlar: PRI/AI/EAR/RI/UL ne demek, faktöriyel yöntem, amino asit puanlama örüntüsü
- Spor beslenmesi (TÜBER Bölüm 8.2): günlük KH/protein/yağ planı, terleme oranı ve rehidrasyon,
  kullanılabilir enerji (RED-S) taraması
- Vejetaryen beslenmesi (TÜBER Bölüm 8.3): 7 diyet türü, porsiyon miktarları, türe göre riskli besin ögeleri
- iPhone Numbers için `sablonlar/Diyet-Asistani-Sablonlar.xlsx`

Veriler yalnızca kullanıcının cihazında (localStorage) saklanır. Ayarlar → Yedek ile JSON yedeği alınabilir.

Veri dayanıklılığı: kayıt okunamazsa uygulama üzerine yazmaz — kaydetme kilitlenir ve ham
metin indirilebilir kalır. Her kayıtta IndexedDB'de ayrı bir depoya anlık kopya alınır
(son 12); yanlış geri yükleme ya da bozulma durumunda Ayarlar → Depolama durumu'ndan
dönülebilir. Anlık kopyalar cihazda durur; cihaz kaybı ve site verilerini temizleme için
dosya yedeği şarttır.

Şifreli yedek: yedek dosyası parolayla şifrelenebilir (WebCrypto AES-GCM 256,
PBKDF2-SHA256 310 000 tur, her dosyada yeni tuz ve IV). Dosya iCloud, Drive ya da
e-postaya çıksa bile danışan bilgileri parola olmadan okunamaz. Parola kaybolursa
yedek açılamaz; kurtarma yolu yoktur.

## Yayınlama (GitHub Pages)

Repo → Settings → Pages → Source: `Deploy from a branch`, Branch: `main` / `(root)`.
Adres: https://catameniaa.github.io/diyet-asistani/

iPhone'da Safari ile aç → Paylaş → Ana Ekrana Ekle.

Derleme adımı yoktur; saf HTML/CSS/JS.

## Testler

```
node tools/test/run.js
```

Hesaplayıcılarda bilinen girdi-çıktı doğrulaması, TÜBER tablolarında satır-sütun
ve çapraz tutarlılık kontrolü, tarama araçlarında puan-band testi ve 51 rotanın
iki temada taranması. Ayrıntı: `tools/test/README.md`.
Besin değerleri yaklaşık ortalamalardır; klinik çalışmada TürKomp ile doğrulayın.

Çocuk persentilleri WHO LMS katsayıları ile hesaplanır: 0–60 ay WHO Child Growth Standards (2006),
61–228 ay WHO Growth Reference (2007). Ağırlık/yaş 0–120 ay, boy/yaş ve BKİ/yaş 0–228 aydır.
Değişim listesi değerleri derste kullanılan listeye göredir ve diyabet değişim listesiyle aynıdır;
vitamin ve mineral içermez. İnsülin hesapları yalnızca eğitim amaçlıdır: İ:KH oranı ve düzeltme
faktörü hastaya özeldir ve hekim tarafından belirlenir.
