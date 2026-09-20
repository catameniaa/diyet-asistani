/* TÜBER 2022 — Ek 4.8: Fiziksel aktivite düzeyi (PAL)
   Ek 4.8.1/4.8.2 Türkiye ortalamaları · Ek 4.8.3 yaşam biçimi sınıflaması · Ek 4.8.4 öneriler
   Kaynak: EFSA 2013 ve FAO/WHO/UNU (2004) temel alınarak hazırlanmıştır. */
(function () {
  'use strict';

  DA.data.pal = {
    src: 'TÜBER 2022, Ek 4.8.1–4.8.4 (s. 378–380)',
    esik: 1.7,
    esikN: 'WHO/FAO/UNU uzmanlar komitesi (2004): PAL 1,7 olan yaşam biçimi şişmanlık, kardiyovasküler hastalık, ' +
           'diyabet ve bazı kanserlerin görülme riskini azaltır.',

    /* Ek 4.8.3 — yaşam biçimi sınıflaması */
    sinif: [
      { l: 'Yatağa veya sandalyeye bağımlı', r: [1.2, 1.39], v: 1.3,
        a: ['Kırılgan yaşlılar, bağımlı bireyler'] },
      { l: 'Az aktif (sedanter)', r: [1.4, 1.59], v: 1.5, d: [
          { t: 'PAL ≈ 1,4', s: 'Günün yaklaşık yarısını oturarak yapılan aktivitelerle (okuma, sohbet, TV, bilgisayar) evde geçiren, uzun mesafe yürümeyen, kısa süreli (≈½ saat) alışveriş yapan, ulaşımda taşıt kullanan bireyler. Düzenli egzersiz ve spor yok.',
            e: ['Çalışmayan, yardımcısı olan ev kadınları veya erkekler', 'Evde (home) ofis ve masa başı çalışanlar', 'Günün çoğunu evde geçiren, yardımcısı olan bağımsız yaşlılar', 'Taksi şoförleri'] },
          { t: 'PAL ≈ 1,5', s: 'Ofiste 6 saat kadar oturarak, 2 saat kadar ayakta rutin çalışanlar.', e: ['Ofiste masa başı çalışanlar'] },
          { t: 'PAL ≈ 1,5', s: 'Evde yemek pişiren, çocuk bakan, elektronik cihazlarla ev işi yapan bireyler. Düzenli egzersiz ve spor yok.', e: ['Yardımcısız ev kadınları'] }
        ] },
      { l: 'Orta aktif', r: [1.6, 1.79], v: 1.7, d: [
          { t: '', s: 'Ev işlerine ek olarak alışverişe yürüyerek daha uzun süre ayıran, taşıt yerine her gün en az bir saat tempolu yürüyerek ulaşım sağlayanlar. Düzenli egzersiz ve spor yok.',
            e: ['Yukarıdaki özelliklere sahip yardımcısız ev kadınları', 'Öğrenciler'] },
          { t: '', s: 'Genellikle oturarak ve yakın çevresinde dolaşarak, rutin olmayan, bilgi ağırlıklı ve mental aktiviteye dayalı iş yapan bireyler; yorucu aktivitesi çok az ya da hiç yok.',
            e: ['Yöneticiler'] }
        ] },
      { l: 'Aktif', r: [1.8, 1.99], v: 1.9, d: [
          { t: '', s: 'Genellikle gününü ayakta çalışarak ve beden gücü harcayarak geçiren bireyler.',
            e: ['Ev temizlik işçileri, mağaza çalışanları, garsonlar', 'Mekanize tarım ve inşaat işçileri'] },
          { t: '', s: 'İşinin bir bölümünde en az bir saat sürekli veya aralıklı olarak orta-yüksek şiddetli fiziksel aktivite (koşma, uzun mesafe yürüme, bisiklet, aerobik dans) yapan bireyler.',
            e: ['Spor-egzersiz eğitmenleri', 'Her gün su, yakacak eşya vb. yük taşımak zorunda olan bireyler'] }
        ] },
      { l: 'Çok aktif', r: [2.0, 2.4], v: 2.1, d: [
          { t: '', s: 'Günün en az iki saatini şiddetli egzersiz-antrenmanla geçirenler; çapa yapma, balta kullanma gibi mekanize olmamış tarım faaliyetleriyle uzun süre uğraşanlar; engebeli arazide yük taşıyarak uzun süre yürümek zorunda olanlar.',
            e: ['Sporcular', 'Mekanize olmamış faaliyetler yapan tarım işçileri'] }
        ] }
    ],

    /* Ek 4.8.1 / 4.8.2 — Türkiye ortalamaları (TÜBER 2017 verisi) */
    ort: {
      yas: ['18-29', '30-39', '40-49', '50-59', '60-69', '70-79'],
      E: [1.78, 1.88, 1.84, 1.79, 1.71, 1.64],
      K: [1.73, 1.83, 1.82, 1.78, 1.71, 1.62],
      n: 'TÜBER 2017 verilerine göre 70-79 yaş grubu dışında her iki cinsiyette de PAL 1,70 ve üzerindedir. ' +
         'İlerleyen yaşla birlikte fiziksel aktivite düzeyi her iki cinsiyette de azalmaktadır.'
    },

    /* Ek 4.8.4 — PAL'ı artırmak için her gün yapılabilecek aktiviteler */
    egzersiz: [
      '1 saat orta tempolu yürüyüş (6–6,5 km/saat)',
      '1 saat hafif-orta tempoda sabit hızda bisiklet',
      '1 saat hafif tempoda aerobik dans',
      '45 dakika yüksek şiddetli aerobik dans',
      '1 saat bahçe işleri (çim biçme, kazma)',
      '25–30 dakika squash',
      '30 dakika koşu (9,5 km/saat)',
      '45 dakika jogging',
      '35–40 dakika koşu (8 km/saat)',
      '1 saat eşli tenis (double)',
      '1 saat yavaş-orta tempoda yüzme',
      '40 dakika hafif-orta tempoda yüzme',
      '40 dakika orta-yüksek tempoda pedal çevirme',
      '1,5 saat ev işleri (süpürme, paspas, cam silme, araba yıkama)',
      '1,5 saat işyerinde mola saatlerinde yürüme',
      '45 dakika futbol (maç yapılmadan)',
      '30 dakika futbol maçı',
      '1 saat çocukla oyun oynama',
      '1 saat hayvanla oyun oynama ya da yürüme'
    ],
    egzersizN: 'Şiddeti belirlemenin basit yolu konuşma testidir: kişinin konuşabildiği ama şarkı söyleyemediği tempo orta şiddetlidir; ' +
               'soluğu kesilmeden yalnızca birkaç kelime konuşabildiği aktiviteler yüksek şiddetlidir. ' +
               'Merdiven çıkma, kucakta çocuk taşıma, küvet ovma gibi işler de sık tekrarlandığında PAL’a katkı sağlar. ' +
               'Bazı kişilerin egzersiz alışkanlığını değiştirmeden önce tıbbi değerlendirmeye ihtiyacı olabilir.',

    cocuk: 'Çocuk ve ergenlerin her gün en az 1 saat orta ve şiddetli düzeyde fiziksel aktivite yapmaları, günde 2 saatten ' +
           'fazla ekrana maruz kalmamaları önerilir. TBSA 2010’da 12-18 yaş grubunun ekran süresi hafta içi 3,9 saat, hafta sonu 4,1 saattir.'
  };
})();
