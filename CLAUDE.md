# Diyet Asistanı — çalışma kuralları

Diyetisyenler ve diyetetik öğrencileri için çevrimdışı çalışan mobil web
uygulaması (PWA). Sahibi ve tek kullanıcısı: Dyt. Can Bayramoğlu.

**Dil:** Kod, yorum, commit mesajı, arayüz metni ve bana verdiğin/verdiğim
yanıtlar Türkçe. Değişken ve fonksiyon adları da Türkçe olabilir
(`takipGereken`, `sayiVurgu`, `dipnot`); eski İngilizce adlar
(`menuTotals`, `chartSvg`) olduğu gibi bırakılır, toplu yeniden adlandırma
yapılmaz.

---

## Mimari — değişmeyen kararlar

Bunlar tartışılmış kararlardır; değiştirmeden önce sor.

- **Derleme adımı yok.** Bundler, transpiler, npm bağımlılığı yok. Dosyalar
  tarayıcıya olduğu gibi gider. `index.html` script etiketlerini sırayla
  yükler.
- **Çerçeve yok.** Düz JavaScript. Global `DA` ad alanı altında:
  `DA.views` (ekranlar), `DA.actions` (düğme eylemleri), `DA.live`
  (canlı girdi olayları), `DA.forms`, `DA.calcs` (hesaplayıcı tanımları),
  `DA.data` (tembel yüklenen veri), `DA.IA` (bilgi mimarisi / menü sırası).
- **Yönlendirme:** hash tabanlı (`#/danisan/abc`). `DA.render(true|false)`
  yeniden çizer.
- **Depolama:** `localStorage`, tek anahtar `dyt.v1`. Ek olarak `js/depo.js`
  her kayıtta IndexedDB'ye anlık kopya alır (son 12).
- **Sunucu yok, hesap yok, izleme yok.** Veri kullanıcının cihazından
  çıkmaz. Analitik, reklam, uzak uç nokta ekleme.
- **Çevrimdışı:** `sw.js` tüm dosyaları önbelleğe alır (önce ağ, 3 sn,
  olmazsa önbellek).

### Tembel yükleme

Büyük veri dosyaları açılışta değil, ilgili ekran ilk açıldığında yüklenir.

- `DA.LAZY` — veri anahtarı → dosya listesi (`js/core.js`)
- `DA.need(['tuber'])` — yükler, söz döner
- `DA.hazir(['tuber'])` — yüklü mü
- `DA.needAll()` — hepsi (genel arama kullanıyor)

Bir hesaplayıcı `data: ['tuber']` bildirirse yönlendirici yüklemeyi kendisi
yapar ve bu arada iskelet çizer. Yazdırma rotaları yönlendiriciden geçmez,
ihtiyaçlarını kendileri yükler (`js/foods.js` içinde `YAZ_VERI`).

---

## Yeni bir şey eklerken — kontrol listesi

Yeni dosya eklediysen **dördünü birden** yap, yoksa çevrimdışı kırılır:

1. `index.html` içine `<script src="js/yeni.js"></script>` — **sıra önemli**,
   `core.js` başta, `boot.js` en sonda.
2. `sw.js` içindeki `ASSETS` listesine dosya adını ekle.
3. `sw.js` içindeki `CACHE` sürümünü artır (`diyet-asistani-v34` → `v35`).
   **Herhangi bir dosya değiştiyse bu gerekir**; yoksa kullanıcıda eski
   sürüm takılı kalır.
4. Veri dosyasıysa `DA.LAZY`'ye anahtarı ekle.

Hesaplayıcı eklediysen ayrıca `DA.IA` içinde bir bölüme yaz — yoksa listede
"Diğer" grubuna düşer.

---

## Test — pazarlık konusu değil

```
node tools/test/run.js          # tam koşu (açık + koyu tema)
node tools/test/run.js --tek    # yalnızca açık tema, hızlı
```

Ayrıntı: `tools/test/README.md`.

**Kurallar:**

1. **Push etmeden önce tam koşu yeşil olacak.** Bir kez testi görmeden push
   edildi ve kırık çıktı; tekrarlanmayacak.
2. **Beklenen değeri uygulamadan hesaplatma.** Kaynaktaki formülden elle
   hesapla. Uygulamadan türetilen beklenti, hatayı da birlikte dondurur.
3. **Her yeni testi kodu kasten bozarak doğrula (mutasyon testi).** Test
   bozulmuş kodda geçiyorsa hiçbir şey ölçmüyordur. Bu oturumda yazılan
   testlerin üçü ilk hâlinde mutasyonu yakalamadı — bu normaldir, güçlendir.
   Örnek zayıflıklar: öğenin *varlığını* sayıp *boyutunu* ölçmemek, sınır
   değerini fixture'a koymamak, fixture'ın kod yolundan hiç geçmemesi.
4. Testte sabit bekleme (`waitForTimeout`) kullanma; `waitForSelector` ile
   beklenen öğeyi bekle. Sabit bekleme yarış koşulu üretti, bir kez kırdı.
5. **Çıkış kodunu maskeleme.** `node tools/test/run.js | tail -3` yazarsan
   boru hattının çıkış kodu `tail`'in kodudur; test çökse bile 0 döner ve
   `&& git push` çalışır. Bu bir kez oldu. Ya çıplak koş, ya `set -o
   pipefail` kullan, ya da `echo "çıkış: $?"` ile kodu gör.

---

## Kod ve yorum üslubu

- 2 boşluk girinti, tek tırnak, noktalı virgül.
- **Yorum *neden*i anlatır, *ne*yi değil.** Kodun kendisi ne yaptığını zaten
  söylüyor. İyi yorum, bir sonraki okurun "bu neden böyle?" sorusunu
  cevaplar — çoğu zaman bir hata hikâyesi:

  ```js
  /* Sabit bekleme yarışa açıktı: ekran ağır açıldığında $eval öğeyi
     bulamıyordu. Artık beklenen öğe görünene kadar beklenir. */
  ```

  ```js
  /* Girdi alanları 16px'in ALTINA inemez: iOS Safari daha küçük puntolu
     bir alana odaklanınca sayfayı yakınlaştırıyor ve düzen bozuluyor. */
  ```

- Bir şeyi *değiştirirken* eskisinin neden yetersiz olduğunu yaz.
- Kullanıcıya görünen her metin Türkçe ve diyetisyen diliyle; "danışan",
  "ölçüm", "takip", "değişim listesi" — jargonu doğru kullan.

---

## Tasarım sistemi

`css/app.css` başındaki tokenler tek kaynaktır. Ad-hoc punto, renk ya da
boşluk yazma.

- **Tipografi:** `--t-xs:11px` · `--t-sm:13px` · `--t-md:15px` ·
  `--t-lg:18px` · `--t-xl:22px` · `--t-xxl:26px`. Her kademenin kendi
  `--lh-*` ve `--ls-*` değeri var.
- **Girdi alanları `--t-input:16px`** — bunun altına inme (iOS yakınlaştırma).
- **Boşluk:** `--s-1:4px` … `--s-6:32px`.
- **Dokunma hedefi en az 44px** (iOS kılavuzu, WCAG 2.2). Test bunu tarıyor.
- **İki tema** — açık ve koyu. Her ikisi de test ediliyor; yeni renk
  eklersen koyu tema karşılığını da tanımla.
- **`prefers-reduced-motion`** açıkken tüm animasyon ve geçiş kapanır.
  Bu bir tercih değil, erişilebilirlik gereği.
- **Boş durum** = `DA.emptyState(ikon, {baslik, aciklama, eylem})`. Boş ekran
  bırakma: ne olduğunu, neden boş olduğunu ve oradan çıkaracak düğmeyi ver.
- **Yükleme** = `DA.iskelet('form'|'liste'|'grafik'|'belge', mesaj)`.
  "Yükleniyor…" yazma; gelecek içeriğin kaba biçimini aynı yükseklikte çiz.
- **Sayı vurgusu** = `DA.sayiVurgu('1850 kcal')` ya da
  `deger + DA.birim('g')`. Değer büyük, birim küçük ve soluk. Birimi etiketin
  içine gömme ("protein g" değil → `52 g` / `protein`).
- **Yazdırma** (`.printdoc`): puntolar **pt** cinsinden, token dışıdır —
  token ölçeği ekran için px'tir. Gri tonlu yazıcıda okunabilirlik şart:
  renk tek başına bilgi taşımasın.

---

## Klinik veri — en hassas kısım

Bu uygulamayı gerçek danışanlar için kullanıyor. Yanlış bir besin değeri ya
da formül, gerçek bir insanın planına giriyor.

- **Değer uydurma.** Kaynağı yoksa ekleme. Emin değilsen sor.
- Kaynaklar: **TÜBER 2022** (Türkiye Beslenme Rehberi), **TEMD**, **WHO**
  büyüme eğrileri, USDA. Her tablonun hangi Ek/Tablo numarasından geldiği
  veri dosyasının başında yazılı olmalı.
- **Kaynakta hata bulursan düzeltme — belgele.** `js/kaynaknot.js` bunun
  için var: birim hataları, şüpheli değerler, düzeltilenler. Her not ilgili
  ekrandan rozetle bağlanır. Oraya yazmadan düzeltme yapma.
- Formül değişikliğini **kanıtla**. Örnek: çocuk büyüme payı `bmh * pal *
  1.01` yazılmıştı; TÜBER Tablo 10.2 `bmh * (pal + 0.01)` gerektiriyor —
  68 çocuk satırında doğrulanıp düzeltildi ve `kaynaknot.js`'e işlendi.
- Eksik veriyle içe aktarma yapma (ör. protein/yağ değeri verilmeyen bir
  besin, besin veritabanına girmez).

---

## Git

- **Doğrudan `main`'e push.** Dal açma, PR açma — aksi söylenmedikçe.
- Commit mesajı Türkçe ve **neden**i anlatır. Gövde, neyin bozuk olduğunu ve
  neden böyle çözüldüğünü yazar. Başlık kısa ve konuyu söyler:
  `Veri dayanıklılığı: bozuk kaydı koru, anlık kopya al, depolama durumunu göster`
- Test sonucunu commit gövdesine yaz (`Test: 478 geçti, 0 kaldı`).
- Kendi hatanı commit mesajında gizleme. Yanlış bir şey iddia ettiysen
  düzelt ve düzeltmeyi yaz.

---

## Araçlar

- `tools/tuber_pdf_extract*.py` — TÜBER PDF'lerinden tablo çıkarma
- `tools/turkomp_scraper.py` — TürKomp besin veritabanı çekici
  (`--selftest` ile fixture üzerinde çalışır; **çekme işlemi kullanıcının
  kendi makinesinde koşmalı**, bu ortamın çıkış vekili o alan adlarını
  engelliyor)
- `sablonlar/` — iPhone Numbers şablonları

---

## Bana sorman gerekenler

- Klinik bir değeri/formülü değiştirmeden önce
- Mimari kararlardan (derleme adımı, çerçeve, depolama) birini değiştirmeden
  önce
- Bir veri kaynağının telif durumu belirsizse
- İki farklı okuma da makulse ve seçim işin sonucunu değiştiriyorsa

Bunların dışında rutin kararı kendin ver, varsayımını yaz ve devam et.
