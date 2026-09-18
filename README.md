# Diyet Asistanı

Diyetetik öğrencileri ve diyetisyenler için ücretsiz, reklamsız, çevrimdışı çalışan mobil web uygulaması (PWA).

- Hesaplayıcılar: BKİ, enerji (BMH/TEH, makrolar), ideal kilo, bel/kalça ve vücut yağı, kilo kaybı %, sıvı, enteral, GIR
- Çocuk persentil (WHO): ağırlık/yaş, boy/yaş, BKİ/yaş için z-skoru, persentil ve büyüme eğrisi
- Değişim listesi: grup değişimlerinden karbonhidrat/protein/yağ ve enerji, porsiyon örnekleri, menü hedefi ile karşılaştırma
- Karbonhidrat sayımı: İ:KH oranı (500 kuralı), düzeltme faktörü (1800 kuralı), öğün ve düzeltme bolusu
- Besin veritabanı (124 besin) ve öğün öğün menü planlayıcı, PDF/paylaş
- Danışan takibi (ölçümler, grafik, notlar)
- Klinik hızlı referans (TEMD diyabet tanı/hedefleri, TÜBER önerileri), çalışma kartları (aralıklı tekrar), staj günlüğü
- iPhone Numbers için `sablonlar/Diyet-Asistani-Sablonlar.xlsx`

Veriler yalnızca kullanıcının cihazında (localStorage) saklanır. Ayarlar → Yedek ile JSON yedeği alınabilir.

## Yayınlama (GitHub Pages)

Repo → Settings → Pages → Source: `Deploy from a branch`, Branch: `main` / `(root)`.
Adres: https://catameniaa.github.io/diyet-asistani/

iPhone'da Safari ile aç → Paylaş → Ana Ekrana Ekle.

Derleme adımı yoktur; saf HTML/CSS/JS.
Besin değerleri yaklaşık ortalamalardır; klinik çalışmada TürKomp ile doğrulayın.

Çocuk persentilleri WHO LMS katsayıları ile hesaplanır: 0–60 ay WHO Child Growth Standards (2006),
61–228 ay WHO Growth Reference (2007). Ağırlık/yaş 0–120 ay, boy/yaş ve BKİ/yaş 0–228 aydır.
Değişim listesi değerleri derste kullanılan listeye göredir ve diyabet değişim listesiyle aynıdır;
vitamin ve mineral içermez. İnsülin hesapları yalnızca eğitim amaçlıdır: İ:KH oranı ve düzeltme
faktörü hastaya özeldir ve hekim tarafından belirlenir.
