/* Şifreli yedek — WebCrypto (AES-GCM 256 + PBKDF2-SHA256).

   Amaç: yedek dosyası iCloud, Drive, e-posta gibi cihaz dışı bir yere çıksa
   bile danışan verisi parola olmadan okunamasın. Böylece dosya nerede
   dururursa dursun kişisel sağlık verisi açıkta kalmaz.

   Dosya kendini tanıtan bir zarf: hangi algoritma, kaç tur, hangi tuz.
   İleride tur sayısı değişse bile eski yedekler açılabilsin diye bu bilgiler
   dosyanın içinde taşınır, koda gömülmez.

   Parola kaybolursa yedek açılamaz. Kurtarma yolu yoktur; bu bilerek böyledir. */
(function () {
  'use strict';

  const ETIKET = 'diyet-asistani-sifreli';
  const SURUM = 1;
  const TUR = 310000;          /* PBKDF2 tur sayısı (OWASP önerisi) */
  const TUZ_B = 16, IV_B = 12;

  const kripto = () => (self.crypto && self.crypto.subtle) ? self.crypto.subtle : null;
  DA.kriptoVar = () => !!kripto();

  const b64 = (buf) => {
    const b = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const deB64 = (s) => {
    const bin = atob(s), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  };

  async function anahtar(parola, tuz, tur) {
    const ham = await kripto().importKey('raw', new TextEncoder().encode(parola), 'PBKDF2', false, ['deriveKey']);
    return kripto().deriveKey(
      { name: 'PBKDF2', salt: tuz, iterations: tur, hash: 'SHA-256' },
      ham, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  /* Düz metni şifreli zarfa çevirir. Dönen değer dosyaya yazılacak JSON metnidir. */
  DA.sifrele = async (metin, parola) => {
    if (!kripto()) throw new Error('Bu tarayıcıda şifreleme desteklenmiyor');
    if (!parola) throw new Error('Parola gerekli');
    const tuz = crypto.getRandomValues(new Uint8Array(TUZ_B));
    const iv = crypto.getRandomValues(new Uint8Array(IV_B));
    const k = await anahtar(parola, tuz, TUR);
    const sifreli = await kripto().encrypt({ name: 'AES-GCM', iv },
      k, new TextEncoder().encode(metin));
    return JSON.stringify({
      format: ETIKET, v: SURUM,
      kdf: 'PBKDF2-SHA256', iter: TUR,
      salt: b64(tuz), iv: b64(iv), data: b64(sifreli),
      uyari: 'Bu dosya paroladan türetilen bir anahtarla şifrelenmiştir. Parola olmadan açılamaz.'
    }, null, 1);
  };

  /* Bir metin şifreli zarf mı? Geri yüklemede dosyayı tanımak için. */
  DA.sifreliMi = (metin) => {
    try {
      const o = JSON.parse(metin);
      return !!(o && o.format === ETIKET && o.data && o.salt && o.iv);
    } catch (e) { return false; }
  };

  /* Zarfı çözer. Yanlış parolada ya da dosya kurcalanmışsa AES-GCM doğrulaması
     başarısız olur ve anlaşılır bir hata döner. */
  DA.coz = async (metin, parola) => {
    if (!kripto()) throw new Error('Bu tarayıcıda şifre çözme desteklenmiyor');
    let o;
    try { o = JSON.parse(metin); } catch (e) { throw new Error('Dosya okunamadı'); }
    if (!o || o.format !== ETIKET) throw new Error('Bu bir şifreli yedek dosyası değil');
    if (o.v > SURUM) throw new Error('Yedek daha yeni bir sürümle oluşturulmuş; uygulamayı güncelle');
    const k = await anahtar(parola, deB64(o.salt), o.iter || TUR);
    let duz;
    try {
      duz = await kripto().decrypt({ name: 'AES-GCM', iv: deB64(o.iv) }, k, deB64(o.data));
    } catch (e) {
      throw new Error('Parola yanlış ya da dosya bozulmuş');
    }
    return new TextDecoder().decode(duz);
  };
})();
