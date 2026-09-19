# TürKomp çekici

`turkomp_scraper.py`, TürKomp (Ulusal Gıda Kompozisyon Veri Tabanı, T.C. Tarım ve Orman
Bakanlığı) sayfalarındaki gıda kompozisyon verisini toplar ve dört biçimde yazar.

## Kurulum

    pip install requests beautifulsoup4 lxml

## Kullanım

    # 1) Önce bir sayfanın yapısını incele (seçicileri doğrulamak için)
    python3 turkomp_scraper.py --inspect https://turkomp.tarimorman.gov.tr/food-tuz-sofra-iyotsuz-667

    # 2) Linkleri topla, 10 gıdayla deneme çekimi yap
    python3 turkomp_scraper.py --limit 10 --contact "ad@ornek.com"

    # 3) Sonuç doğruysa tam çekim
    python3 turkomp_scraper.py --contact "ad@ornek.com"

    # Ayrıştırmayı değiştirdikten sonra siteye hiç gitmeden yeniden üret
    python3 turkomp_scraper.py --export-only

    # Hata verenleri tekrar dene
    python3 turkomp_scraper.py --retry-failed

## Çıktılar (`turkomp_out/`)

| Dosya | İçerik |
|---|---|
| `foods.json` | Ham veri: tüm bileşenler, birimleri, notları (`iz`, `veri yok`, `<`) ve kaynak URL |
| `foods.csv` | Gözle kontrol için tablo (Excel TR uyumlu: BOM + `;` ayracı + ondalık virgül) |
| `turkomp.sqlite` | `foods` ve `components` tabloları, indeksli |
| `data-foods-turkomp.js` | Uygulamaya girecek JS modülü |
| `food_links.json` | Toplanan detay sayfası linkleri |
| `failed.json` | Alınamayan sayfalar ve sebepleri |
| `cache/` | İndirilen ham HTML — silmeyin, yeniden çekimi önler |
| `scrape.log` | Tüm koşumun kaydı |

## Sunucuya saygı

- İstekler tek iş parçacığında, aralarında 2–4 sn rastgele bekleme ile atılır (`--delay`).
- İndirilen her sayfa `cache/` altına yazılır; ayrıştırmayı kaç kez tekrarlarsanız
  tekrarlayın siteye bir daha gidilmez. **Çekim ve ayrıştırma bilerek ayrı adımlardır.**
- `robots.txt` okunur ve uygulanır (`--no-robots` ile kapatılabilir; kapatmadan önce
  sitenin kullanım koşullarını okuyun).
- HTTP 429/503 gelirse `Retry-After` başlığına uyulur.
- Ağ hatasında 3 deneme, aralar 4 ve 8 sn (üstel geri çekilme).
- `--contact` ile User-Agent'a e-postanızı ekleyin; site yöneticisi sorun olursa size ulaşabilir.

## Kaynak gösterimi

Veri T.C. Tarım ve Orman Bakanlığı'na aittir. Uygulamada kullanırken kaynağı ve çekim
tarihini belirtin; üretilen JS dosyasının başlığında bu bilgi zaten yer alır.
Yayımlamadan ya da ticari kullanımdan önce sitenin kullanım koşullarını kontrol edin.

## Site yapısı değişirse

Dosyanın tepesindeki **Ayarlar** bölümü tek değişiklik noktasıdır:
`SEED_PATHS`, `FOOD_URL_RE`, `LIST_URL_RE`, `NAME_SELECTORS`, `COL_HINTS`, `CORE_MATCH`.
`--inspect` çıktısı bu değerleri doğrulamak için yazıldı.
