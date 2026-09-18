# Diyet Asistanı

Diyetetik öğrencileri ve diyetisyenler için ücretsiz, reklamsız, çevrimdışı çalışan mobil web uygulaması (PWA).

- Hesaplayıcılar: BKİ, enerji (BMH/TEH, makrolar), ideal kilo, bel/kalça ve vücut yağı, kilo kaybı %, sıvı, enteral, GIR
- Besin veritabanı (124 besin) ve öğün öğün menü planlayıcı, PDF/paylaş
- Danışan takibi (ölçümler, grafik, notlar)
- Klinik hızlı referans, çalışma kartları (aralıklı tekrar), staj günlüğü
- iPhone Numbers için `sablonlar/Diyet-Asistani-Sablonlar.xlsx`

Veriler yalnızca kullanıcının cihazında (localStorage) saklanır. Ayarlar → Yedek ile JSON yedeği alınabilir.

## Yayınlama (GitHub Pages)

Repo → Settings → Pages → Source: `Deploy from a branch`, Branch: `main` / `(root)`.
Adres: https://catameniaa.github.io/diyet-asistani/

iPhone'da Safari ile aç → Paylaş → Ana Ekrana Ekle.

Derleme adımı yoktur; saf HTML/CSS/JS.
Besin değerleri yaklaşık ortalamalardır; klinik çalışmada TürKomp ile doğrulayın.
