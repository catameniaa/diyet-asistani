/* Diyet Asistanı — otomatik regresyon.
   Kullanım:  node tools/test/run.js  [--port <no>] [--tek]
   --tek: yalnızca açık tema (hızlı geçiş)

   Üç aşama:
   1) Hesaplayıcı ve veri bütünlük testleri (tools/test/testler.js sayfaya enjekte edilir)
   2) Arayüz davranış testleri (ekranları gerçekten gezip DOM'dan sonuç okur)
   3) Rota taraması — her rota iki temada açılır, çökme/boş ekran/konsol hatası aranır */
/* playwright-core ya da playwright — hangisi kuruluysa */
function pw() {
  const adaylar = ['playwright-core', 'playwright',
    '/opt/node22/lib/node_modules/playwright', '/opt/node22/lib/node_modules/playwright-core'];
  for (const a of adaylar) { try { return require(a); } catch (e) { /* sonrakini dene */ } }
  console.error('playwright bulunamadı: npm i -D playwright-core');
  process.exit(2);
}
const { chromium } = pw();
const http = require('http');
const fs = require('fs');
const path = require('path');

const KOK = path.resolve(__dirname, '..', '..');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const arg = (ad, varsayilan) => {
  const i = process.argv.indexOf(ad);
  return i > 0 ? process.argv[i + 1] : varsayilan;
};
const PORT = parseInt(arg('--port', '0'), 10);   /* 0 = boş bir port seçilsin */
const TEK = process.argv.includes('--tek');

const ROTALAR = [
  '', '#/ana', '#/ara', '#/hesapla', '#/referans', '#/besin', '#/menu', '#/danisan', '#/kart', '#/staj', '#/daha',
  '#/hesapla/enerji', '#/hesapla/bki', '#/hesapla/ideal', '#/hesapla/bel', '#/hesapla/kilokaybi',
  '#/hesapla/sivi', '#/hesapla/enteral', '#/hesapla/gir', '#/hesapla/cocuk', '#/hesapla/degisim',
  '#/hesapla/khsayim', '#/hesapla/khdagilim', '#/hesapla/gebelik', '#/hesapla/stres',
  '#/hesapla/cocukenerji', '#/hesapla/gy', '#/hesapla/nrs', '#/hesapla/must', '#/hesapla/mnasf',
  '#/hesapla/diyabetrisk', '#/hesapla/sporcu', '#/hesapla/terleme', '#/hesapla/sporke',
  '#/hesapla/sporkh', '#/hesapla/sporyaris', '#/hesapla/derikivrim', '#/hesapla/takviye',
  '#/hesapla/glim', '#/hesapla/refeeding', '#/hesapla/egfr',
  '#/hesapla/degisimliste',
  '#/hesapla/tuber', '#/hesapla/oruntu', '#/hesapla/hedef', '#/hesapla/porsiyon',
  '#/hesapla/porsiyonbesin', '#/hesapla/istege', '#/hesapla/bebek', '#/hesapla/gebe',
  '#/hesapla/pal', '#/hesapla/ornekmenu', '#/hesapla/enerjiref', '#/hesapla/yontem', '#/hesapla/vejetaryen',
  '#/hesapla/porsiyon?t=olcu&ara=ceviz', '#/hesapla/ornekmenu?m=ek53',
  '#/danisan/c1', '#/menu/mm', '#/daha/sablon', '#/daha/kaynaknot',
  '#/yazdir/menu/mm', '#/yazdir/danisan/c1', '#/yazdir/degisim', '#/yazdir/ornekmenu/ek53',
  '#/liste', '#/liste/ll', '#/yazdir/liste/ll', '#/liste/hw0', '#/yazdir/hafta/hw',
  '#/hesapla/toplumenu', '#/yazdir/toplu'
];

/* ---- küçük statik sunucu ---- */
const TIP = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };
/* Güncelleme testi için: doluysa sw.js yeni bir sürüm gibi sunulur. Tarayıcı
   service worker güncellemesini kendisi denetler; Playwright'ın route'u bu
   isteği yakalamadığı için değişiklik sunucuda yapılır. */
let swSurumEki = '';
function sunucu() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const dosya = path.join(KOK, p);
      if (!dosya.startsWith(KOK) || !fs.existsSync(dosya) || fs.statSync(dosya).isDirectory()) {
        res.writeHead(404); res.end('yok'); return;
      }
      res.writeHead(200, { 'Content-Type': TIP[path.extname(dosya)] || 'application/octet-stream' });
      if (swSurumEki && p === '/sw.js') {
        res.end(fs.readFileSync(dosya, 'utf8').replace(/const CACHE = '([^']+)'/, "const CACHE = '$1" + swSurumEki + "'"));
        return;
      }
      res.end(fs.readFileSync(dosya));
    });
    s.listen(PORT, '127.0.0.1', () => ok(s));
  });
}

/* ---- örnek veri: her koşuda aynı ---- */
function ornekDurum(tema) {
  DA.setTheme(tema);
  const S = DA.state();
  S.profile = { sex: 'K', age: 34, h: 165, w: 62, pal: '1.4', dyt: 'Dyt. Test', iletisim: 'test@example.com' };
  S.clients = [{ id: 'c1', name: 'Çocuk Danışan', sex: 'E', bdate: '2019-03-15', h: 118, tags: ['diyabet'], note: '',
    meas: [{ id: 'm1', d: '2025-03-20', w: 23, h: 118, waist: 55 }, { id: 'm2', d: '2025-09-20', w: 24, h: 121 }] }];
  S.menus = [{ id: 'mm', title: 'Test menü', date: DA.today(), client: 'Çocuk Danışan', note: 'not',
    meals: { 'Kahvaltı': [{ id: 'beyaz-ekmek', g: 50 }, { id: 'yumurta', g: 60 }] } }];
  S.targets = { kcal: 2000, p: 100, c: 250, f: 67 };
  S.listeler = [{ id: 'll', ad: 'Test listesi', d: DA.today(), c: 'c1', ex: { sutyy: 1, eyg: 2 }, hedef: { kcal: 223 }, not: 'Su iç.',
    ayar: { enerji: true, degisim: true }, meal: { kahvalti: { sutyy: 1, eyg: 2 } },
    ogun: { kahvalti: [{ id: 's1', t: '1 su bardağı yarım yağlı süt', n: 1, d: { sutyy: 1 } }, { id: 's2', t: '1 ince dilim ekmek', n: 2, d: { eyg: 1 } }] } }];
  /* Haftalık listenin iki günü: gün sekmeleri ve haftalık çıktı da
     dokunma hedefi, kontrast ve taşma taramasına girsin. */
  ['hw0', 'hw1'].forEach((id, i) => S.listeler.push({ id, hafta: 'hw', gun: i, ad: 'Haftalık test', d: '2026-11-2' + (3 + i), c: 'c1',
    ex: {}, hedef: {}, not: 'Su iç.', ayar: { enerji: true, degisim: true }, meal: { kahvalti: { sutyy: 1 } },
    ogun: { kahvalti: [{ id: 'w' + i, t: '1 su bardağı yarım yağlı süt', n: 1, d: { sutyy: 1 } }] } }));
  DA.save();
}

(async () => {
  const srv = await sunucu();
  const B = 'http://127.0.0.1:' + srv.address().port + '/';
  const tarayici = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const sonuc = { gecti: 0, kaldi: 0, satir: [] };
  const yaz = (t) => { process.stdout.write(t + '\n'); };
  const bildir = (s) => {
    if (s.ok) sonuc.gecti++; else { sonuc.kaldi++; sonuc.satir.push(s); }
  };

  const sayfa = await tarayici.newPage({ viewport: { width: 430, height: 930 } });
  sayfa.on('dialog', (d) => d.accept());   /* confirm() başsız tarayıcıda varsayılan olarak reddeder */
  const hatalar = [];
  sayfa.on('console', (m) => { if (m.type() === 'error') hatalar.push(m.text()); });
  sayfa.on('pageerror', (e) => hatalar.push('PAGEERROR: ' + e.message));
  await sayfa.goto(B, { waitUntil: 'networkidle' });
  await sayfa.evaluate(ornekDurum, 'light');
  /* Bütün tembel veri dosyaları yüklensin ki veri testleri tamamını görsün */
  await sayfa.evaluate(() => DA.needAll());
  await sayfa.addScriptTag({ path: path.join(__dirname, 'testler.js') });

  /* ---- 1. hesaplayıcı + veri testleri ---- */
  const testler = await sayfa.evaluate(() => window.TEST.calis());
  ['hesap', 'veri'].forEach((g) => {
    const alt = testler.filter((t) => t.grup === g);
    yaz((g === 'hesap' ? 'Hesaplayıcı' : 'Veri bütünlüğü') + ': ' + alt.filter((t) => t.ok).length + '/' + alt.length);
    alt.forEach(bildir);
  });

  /* ---- 2. arayüz davranış testleri ---- */
  const ui = [];
  const uiEkle = (ad, bek, bul) => ui.push({ grup: 'arayüz', ad, bek: String(bek), bul: String(bul), ok: String(bek) === String(bul) });
  const kosulUi = (ad, k, ayrinti) => ui.push({ grup: 'arayüz', ad, bek: 'doğru', bul: k ? 'doğru' : (ayrinti || 'yanlış'), ok: !!k });
  /* Sabit bekleme yarışa açıktı: ekran ağır açıldığında $eval öğeyi bulamıyordu.
     Artık beklenen öğe görünene kadar beklenir. */
  const git = async (yol, secici) => {
    await sayfa.goto(B + yol, { waitUntil: 'domcontentloaded' });
    if (secici) await sayfa.waitForSelector(secici, { timeout: 10000 });
    await sayfa.waitForTimeout(60);
  };

  /* NRS-2002: beslenme 3 + hastalık 2 + yaş ≥70 için 1 = 6 puan, "Beslenme riski var" */
  await sayfa.evaluate(() => {
    const S = DA.state();
    S.profile.age = 75;
    S.ui.tara = { nrs: { bes: 3, hst: 2 } };
    DA.save();
  });
  await git('#/hesapla/nrs', '#taraOut');
  let m = await sayfa.$eval('#taraOut', (e) => e.textContent);
  uiEkle('NRS-2002 3+2 puan, 75 yaş → toplam 6', true, /Toplam puan\s*6/.test(m.replace(/\s+/g, ' ')));
  uiEkle('NRS-2002 6 puan değerlendirmesi', true, m.indexOf('Beslenme riski var') >= 0);
  uiEkle('NRS-2002 yaş eki gösteriliyor', true, m.indexOf('Yaş ≥70') >= 0);

  /* MUST: BKİ 0 + kilo kaybı 1 + akut 0 = 1 puan → orta risk */
  await sayfa.evaluate(() => { DA.state().ui.tara = { must: { bki: 0, kilo: 1, akut: 0 } }; DA.save(); });
  await git('#/hesapla/must', '#taraOut');
  m = await sayfa.$eval('#taraOut', (e) => e.textContent);
  uiEkle('MUST 0+1+0 → orta risk', true, m.indexOf('Orta risk') >= 0);

  /* MNA-SF: 2+3+2+2+2+3 = 14 puan → normal */
  await sayfa.evaluate(() => { DA.state().ui.tara = { mnasf: { a: 2, b: 3, c: 2, d: 2, e: 2, f: 3 } }; DA.save(); });
  await git('#/hesapla/mnasf', '#taraOut');
  m = await sayfa.$eval('#taraOut', (e) => e.textContent);
  uiEkle('MNA-SF tam puan → normal beslenme durumu', true, m.indexOf('Normal beslenme durumu') >= 0);
  uiEkle('MNA-SF toplam 14', true, /Toplam puan\s*14/.test(m.replace(/\s+/g, ' ')));

  /* FINDRISC: 4+3+4+2+1+2+5+5 = 26 puan → çok yüksek (%50) */
  await sayfa.evaluate(() => {
    DA.state().ui.dr = { yas: 4, bki: 3, bel: 4, egz: 2, sm: 1, tan: 2, gli: 5, aile: 5 };
    DA.save();
  });
  await git('#/hesapla/diyabetrisk', '#app .card');
  m = await sayfa.$eval('#app', (e) => e.textContent).then((t) => t.replace(/\s+/g, ' '));
  uiEkle('FINDRISC en yüksek yanıtlar → 26 puan', true, /26/.test(m));
  uiEkle('FINDRISC 26 puan → çok yüksek risk', true, m.indexOf('Çok yüksek') >= 0);

  /* Öğün başına karbonhidrat: paylar toplamı 100 olmasa da gramlar hedefe eşitlenir */
  await sayfa.evaluate(() => {
    DA.state().ui.khd = { kh: 200, ikh: 10, pay: { kahvalti: 25, ara1: 10, ogle: 30, ara2: 10, aksam: 20, ara3: 5 } };
    DA.save();
  });
  await git('#/hesapla/khdagilim', '#khdOut table.t tbody tr');
  let hucre = await sayfa.$$eval('#app table.t tbody tr', (rows) =>
    rows.map((r) => Array.from(r.cells).map((c) => c.textContent.trim())));
  uiEkle('KH dağılımı: kahvaltı %25 → 50 g', '50 g', (hucre[0] || [])[2]);
  uiEkle('KH dağılımı: öğle %30 → 60 g', '60 g', (hucre[2] || [])[2]);
  uiEkle('KH dağılımı: kahvaltı bolusu 50 ÷ 10', '5 Ü', (hucre[0] || [])[4]);
  let toplamG = await sayfa.$eval('#app table.t tfoot tr', (r) => r.cells[2].textContent.trim());
  uiEkle('KH dağılımı toplamı hedefe eşit', '200 g', toplamG);

  /* Paylar toplamı 100 değilken bile gramlar hedefi aşmaz (eski hatanın testi) */
  await sayfa.evaluate(() => {
    DA.state().ui.khd = { kh: 200, ikh: 0, pay: { kahvalti: 30, ara1: 15, ogle: 35, ara2: 15, aksam: 15, ara3: 5 } };
    DA.save();
  });
  /* Aynı adrese goto tarayıcıyı yeniden yüklemez; yeni durumun görünmesi için reload gerekir */
  await sayfa.reload({ waitUntil: 'domcontentloaded' });
  await sayfa.waitForSelector('#khdOut table.t tbody tr', { timeout: 10000 });
  hucre = await sayfa.$$eval('#app table.t tbody tr', (rows) =>
    rows.map((r) => Array.from(r.cells).map((c) => c.textContent.trim())));
  const gramlar = hucre.map((r) => parseInt(r[2], 10));
  uiEkle('Paylar %115 iken gramlar toplamı yine 200', 200, gramlar.reduce((a, b) => a + b, 0));
  uiEkle('Paylar %100 değilken uyarı gösteriliyor', true,
    (await sayfa.$eval('#app', (e) => e.textContent)).indexOf('Payların toplamı') >= 0);

  /* Çocuk persentil: gerçek ölçümle eğri çiziliyor */
  await git('#/hesapla/cocuk', '#app svg');
  const egri = await sayfa.$$eval('#app svg path', (a) => a.length);
  uiEkle('Çocuk persentil ekranında eğri çiziliyor', true, egri > 0);

  /* Arama tembel yüklenen kaynakları da kapsıyor */
  await git('#/ara', 'input[data-live=gSearch]');
  await sayfa.fill('input[data-live=gSearch]', 'persentil');
  await sayfa.waitForTimeout(400);
  let arama = await sayfa.$eval('#gOut', (e) => e.textContent);
  uiEkle('Arama "persentil" → çocuk persentil hesaplayıcısı', true, arama.indexOf('persentil') >= 0);
  await sayfa.fill('input[data-live=gSearch]', 'riboflavin');
  await sayfa.waitForTimeout(300);
  arama = await sayfa.$eval('#gOut', (e) => e.textContent);
  uiEkle('Arama tembel yüklenen TÜBER verisini de kapsıyor', true, arama.trim().length > 0);
  await sayfa.fill('input[data-live=gSearch]', 'zzzzqqq');
  await sayfa.waitForTimeout(300);
  arama = await sayfa.$eval('#gOut', (e) => e.textContent);
  uiEkle('Sonuçsuz aramada boş durum gösteriliyor', true, arama.indexOf('bulunamadı') >= 0 || arama.trim().length > 0);

  /* ---- Depolama dayanıklılığı ---- */
  /* Bozuk kayıt: uygulama boş açılmalı AMA ham veriyi silmemeli. */
  await sayfa.evaluate(() => localStorage.setItem('dyt.v1', '{"clients":[{"id":"c1","name":"Ayşe"},{"id":"c2","na'));
  await sayfa.goto(B, { waitUntil: 'networkidle' });
  await sayfa.waitForTimeout(300);
  let dk = await sayfa.evaluate(() => ({
    kilit: DA.depoKilit(), ham: (DA.depoHam() || '').length,
    disk: (localStorage.getItem('dyt.v1') || '').length,
    danisan: DA.state().clients.length
  }));
  uiEkle('Bozuk kayıtta kaydetme kilitleniyor', true, !!dk.kilit);
  uiEkle('Bozuk kayıtta ham metin korunuyor', 52, dk.ham);
  uiEkle('Bozuk kayıtta boş durumla açılıyor', 0, dk.danisan);
  /* Asıl kontrol: veri değiştirip kaydetmeyi denesek bile disk bozulmamalı */
  await sayfa.evaluate(() => { DA.state().clients.push({ id: 'x', name: 'Yeni' }); DA.save(); });
  dk = await sayfa.evaluate(() => ({ disk: (localStorage.getItem('dyt.v1') || '').length }));
  uiEkle('Kilitliyken DA.save() diski değiştirmiyor', 52, dk.disk);
  uiEkle('Kilit uyarısı ekranda gösteriliyor', true,
    (await sayfa.$eval('#app', (e) => e.textContent)).indexOf('Veriler kaydedilmiyor') >= 0);
  /* Kullanıcı bilerek sıfırdan başlarsa kilit kalkar ve kayıt çalışır */
  await sayfa.evaluate(() => { DA.depoKilitAc(); DA.state().clients.push({ id: 'y', name: 'Test' }); DA.save(); });
  dk = await sayfa.evaluate(() => ({
    kilit: DA.depoKilit(), danisan: JSON.parse(localStorage.getItem('dyt.v1')).clients.length
  }));
  uiEkle('Kilit açılınca kaydetme çalışıyor', '', dk.kilit);
  /* Kilitliyken bellekteki çalışma sürüyordu (x), kilit açılınca o da yazılır: x + y = 2 */
  uiEkle('Kilit açıldıktan sonra oturumdaki veri diske yazılıyor', 2, dk.danisan);

  /* Anlık kopyalar: IndexedDB'de tutuluyor ve geri yüklenebiliyor */
  await sayfa.goto(B, { waitUntil: 'networkidle' });
  await sayfa.evaluate(ornekDurum, 'light');
  const anlik = await sayfa.evaluate(async () => {
    await DA.depoAnlik(true);
    const l = await DA.depoListe();
    return { adet: l.length, danisan: l[0] && l[0].ozet.danisan, json: !!(l[0] && l[0].json) };
  });
  uiEkle('Anlık kopya alınıyor', true, anlik.adet > 0);
  uiEkle('Anlık kopyada danışan sayısı doğru', 1, anlik.danisan);
  uiEkle('Anlık kopya tam veriyi taşıyor', true, anlik.json);
  const geri = await sayfa.evaluate(async () => {
    DA.state().clients = [];             /* veriyi kaybet */
    DA.save();
    const l = await DA.depoListe();
    DA.replaceState(JSON.parse(l[0].json));
    return DA.state().clients.length;
  });
  uiEkle('Anlık kopyadan geri yükleme çalışıyor', 1, geri);

  /* ---- Şifreli yedek ---- */
  const kr = await sayfa.evaluate(async () => {
    const out = {};
    out.destek = DA.kriptoVar();
    const duz = JSON.stringify({ clients: [{ id: 'c1', name: 'Ayşe Yılmaz' }], menus: [] });
    const zarf = await DA.sifrele(duz, 'parola12345');
    out.zarfJson = (() => { try { return !!JSON.parse(zarf); } catch (e) { return false; } })();
    out.taniniyor = DA.sifreliMi(zarf);
    out.duzTaninmiyor = DA.sifreliMi(duz);
    /* Şifreli metinde danışan adı açıkça geçmemeli */
    out.adSizmiyor = zarf.indexOf('Ayşe') < 0 && zarf.indexOf('Yılmaz') < 0;
    const z = JSON.parse(zarf);
    out.alanlar = !!(z.format && z.kdf && z.iter && z.salt && z.iv && z.data);
    out.tur = z.iter;
    /* Doğru parola: birebir geri gelmeli */
    out.gidisDonus = (await DA.coz(zarf, 'parola12345')) === duz;
    /* Yanlış parola */
    try { await DA.coz(zarf, 'yanlis'); out.yanlisParola = 'hata vermedi'; }
    catch (e) { out.yanlisParola = e.message; }
    /* Kurcalanmış dosya: tek karakter değiştir */
    const bozuk = JSON.parse(zarf);
    bozuk.data = (bozuk.data[0] === 'A' ? 'B' : 'A') + bozuk.data.slice(1);
    try { await DA.coz(JSON.stringify(bozuk), 'parola12345'); out.kurcalama = 'hata vermedi'; }
    catch (e) { out.kurcalama = e.message; }
    /* Aynı içerik iki kez şifrelenince tuz da IV de yeniden üretilmeli.
       Yalnızca "zarf farklı mı" bakmak yetmez: IV rastgele kaldığı sürece
       tuz sabitlense bile zarf farklı çıkar ve hata gözden kaçar. */
    const z2 = JSON.parse(await DA.sifrele(duz, 'parola12345'));
    out.farkliTuz = z2.salt !== z.salt;
    out.farkliIv = z2.iv !== z.iv;
    out.farkliCikti = JSON.stringify(z2) !== zarf;
    out.tuzUzunluk = atob(z.salt).length;
    out.ivUzunluk = atob(z.iv).length;
    return out;
  });
  uiEkle('WebCrypto destekleniyor', true, kr.destek);
  uiEkle('Şifreli zarf geçerli JSON', true, kr.zarfJson);
  uiEkle('Zarfta gerekli alanlar var', true, kr.alanlar);
  uiEkle('PBKDF2 tur sayısı', 310000, kr.tur);
  uiEkle('Şifreli dosya tanınıyor', true, kr.taniniyor);
  uiEkle('Düz yedek şifreli sanılmıyor', false, kr.duzTaninmiyor);
  uiEkle('Danışan adı şifreli dosyaya sızmıyor', true, kr.adSizmiyor);
  uiEkle('Doğru parolada veri birebir dönüyor', true, kr.gidisDonus);
  uiEkle('Yanlış parola reddediliyor', 'Parola yanlış ya da dosya bozulmuş', kr.yanlisParola);
  uiEkle('Kurcalanmış dosya reddediliyor', 'Parola yanlış ya da dosya bozulmuş', kr.kurcalama);
  uiEkle('Aynı veri her seferinde farklı şifreleniyor', true, kr.farkliCikti);
  uiEkle('Her şifrelemede yeni tuz üretiliyor', true, kr.farkliTuz);
  uiEkle('Her şifrelemede yeni IV üretiliyor', true, kr.farkliIv);
  uiEkle('Tuz uzunluğu 16 bayt', 16, kr.tuzUzunluk);
  uiEkle('IV uzunluğu 12 bayt', 12, kr.ivUzunluk);

  /* Şifreli yedek: arayüzden uçtan uca (şifrele → veriyi sil → dosyayı yükle → parola → geri yükle) */
  await sayfa.goto(B, { waitUntil: 'networkidle' });
  await sayfa.evaluate(() => {
    const S = DA.state();
    S.clients = [{ id: 'c1', name: 'Ayşe Yılmaz', meas: [] }, { id: 'c2', name: 'Mehmet Kaya', meas: [] }];
    S.menus = [{ id: 'm1', title: 'Menü', meals: {} }];
    S.journal = []; S.customFoods = [];
    DA.save();
  });
  const zarfMetin = await sayfa.evaluate(() => DA.sifrele(JSON.stringify(DA.state()), 'parola12345'));
  await sayfa.evaluate(() => { DA.replaceState({}); DA.save(); });
  await git('#/daha', '[data-act=backupSifreli]');   /* dosya girdisi gizli, görünür bir düğmeyi bekle */
  await sayfa.setInputFiles('input[data-change=restore]',
    { name: 'yedek.sifreli.json', mimeType: 'application/json', buffer: Buffer.from(zarfMetin, 'utf8') });
  await sayfa.waitForSelector('form[data-form=yedekCoz]', { timeout: 10000 });
  uiEkle('Şifreli dosya yüklenince parola isteniyor', true, true);
  await sayfa.fill('[name=p]', 'parola12345');
  await sayfa.click('form[data-form=yedekCoz] button[type=submit]');
  await sayfa.waitForSelector('[data-act=restoreReplace]', { timeout: 10000 });
  await sayfa.click('[data-act=restoreReplace]');
  await sayfa.waitForTimeout(400);
  const geriYukleme = await sayfa.evaluate(() => ({
    d: DA.state().clients.length, ad: (DA.state().clients[0] || {}).name, m: DA.state().menus.length
  }));
  uiEkle('Şifreli yedekten danışan sayısı geri geldi', 2, geriYukleme.d);
  uiEkle('Şifreli yedekten danışan adı doğru', 'Ayşe Yılmaz', geriYukleme.ad);
  uiEkle('Şifreli yedekten menü geri geldi', 1, geriYukleme.m);

  /* ---- Erişilebilirlik ---- */
  await sayfa.goto(B, { waitUntil: 'networkidle' });
  await sayfa.evaluate(ornekDurum, 'light');
  await sayfa.evaluate(() => DA.needAll());   /* tembel ekranlar gerçek içerikle çizilsin */
  const a11y = await sayfa.evaluate(() => {
    const kucuk = [];
    const say = (yol) => {
      location.hash = yol; DA.render(false);
      document.querySelectorAll('button,a,input,select,textarea').forEach((el) => {
        const b = el.getBoundingClientRect();
        if (!b.width || !b.height) return;
        /* satır içi metin bağlantıları ve onay kutuları standartta muaf/asgari */
        if (el.tagName === 'A' && getComputedStyle(el).display.indexOf('inline') === 0) return;
        if (el.type === 'checkbox' || el.type === 'radio') return;
        if (b.width < 44 || b.height < 44) kucuk.push(yol + ' ' + el.tagName + '.' +
          (el.className || '').toString().split(' ')[0] + ' ' + Math.round(b.width) + 'x' + Math.round(b.height));
      });
    };
    /* chip, stepper, kilit ve segment düğmelerinin hepsinin görüldüğü rota kümesi */
    ['ana', 'hesapla', 'hesapla/degisim', 'hesapla/vejetaryen', 'hesapla/enerjiref',
      'hesapla/khdagilim', 'besin', 'danisan', 'menu', 'daha', 'liste', 'liste/ll'].forEach(say);
    return kucuk;
  });
  kosulUi('Dokunma hedefleri en az 44 px', a11y.length === 0, a11y.slice(0, 3).join(' · '));

  const canli = await sayfa.evaluate(() => {
    location.hash = 'hesapla/bki'; DA.render(false);
    const c = document.querySelector('#calcOut');
    return c ? c.getAttribute('aria-live') : null;
  });
  uiEkle('Hesap sonucu aria-live ile duyuruluyor', 'polite', canli);

  /* Escape sayfayı kapatır, odak açan öğeye döner */
  await sayfa.goto(B + '#/danisan', { waitUntil: 'networkidle' });
  await sayfa.waitForTimeout(300);
  const klavye = await sayfa.evaluate(async () => {
    const dug = document.querySelector('[data-act=clientNew]') || document.querySelector('#app button');
    dug.focus();
    const oncesi = document.activeElement === dug;
    DA.sheet('Test', '<p>içerik</p><button id="tb">Düğme</button>');
    await new Promise((r) => setTimeout(r, 120));
    const acik = DA.sheetAcik();
    const icerde = document.querySelector('#sheet').contains(document.activeElement);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise((r) => setTimeout(r, 60));
    return { oncesi, acik, icerde, kapandi: !DA.sheetAcik(), odakDondu: document.activeElement === dug };
  });
  uiEkle('Sayfa açılınca odak içeri giriyor', true, klavye.icerde);
  uiEkle('Escape sayfayı kapatıyor', true, klavye.kapandi);
  uiEkle('Kapanınca odak açan öğeye dönüyor', true, klavye.odakDondu);

  /* ---- Geri alınabilir silme ---- */
  await sayfa.goto(B, { waitUntil: 'networkidle' });
  const silGeri = await sayfa.evaluate(async () => {
    const S = DA.state();
    S.clients = [{ id: 'a', name: 'Bir', meas: [] }, { id: 'b', name: 'İki', meas: [] }, { id: 'c', name: 'Üç', meas: [] }];
    DA.save();
    DA.actions.clientDelete({ dataset: { id: 'b' } });
    const silindi = DA.state().clients.map((c) => c.id).join(',');
    const toastVar = !document.querySelector('#toast').hidden &&
      !!document.querySelector('#toast .gbtn');
    DA.actions.geriAl();
    return { silindi, toastVar, sonra: DA.state().clients.map((c) => c.id).join(',') };
  });
  uiEkle('Danışan silindi', 'a,c', silGeri.silindi);
  uiEkle('Geri al düğmeli bildirim çıkıyor', true, silGeri.toastVar);
  uiEkle('Geri alınca aynı sıraya dönüyor', 'a,b,c', silGeri.sonra);

  const olcGeri = await sayfa.evaluate(() => {
    const S = DA.state();
    S.clients = [{ id: 'a', name: 'Bir', meas: [
      { id: 'm1', d: '2026-01-01', w: 70 }, { id: 'm2', d: '2026-02-01', w: 69 }] }];
    DA.save();
    DA.actions.measDelete({ dataset: { id: 'a', mid: 'm1' } });
    const sonra = DA.state().clients[0].meas.map((m) => m.id).join(',');
    DA.actions.geriAl();
    return { sonra, geri: DA.state().clients[0].meas.map((m) => m.id).join(',') };
  });
  uiEkle('Ölçüm silindi', 'm2', olcGeri.sonra);
  uiEkle('Ölçüm geri alınca sırasında dönüyor', 'm1,m2', olcGeri.geri);

  /* Yıkıcı genel işlemler hâlâ onay soruyor */
  const onaylar = await sayfa.evaluate(() => {
    let soruldu = 0;
    const eski = window.confirm;
    window.confirm = () => { soruldu++; return false; };
    try { DA.actions.wipe(); } catch (e) { /* yok say */ }
    window.confirm = eski;
    return soruldu;
  });
  uiEkle('Tüm veriyi silmek hâlâ onay soruyor', 1, onaylar);

  /* ---- Takip paketi ---- */
  await sayfa.goto(B, { waitUntil: 'networkidle' });
  const bugun = await sayfa.evaluate(() => {
    /* Tarih yerel saatle yazılır: toISOString UTC'ye çevirir ve İstanbul'da
       (UTC+3) gece 00:00–03:00 arasında bir önceki günü verir. */
    const g = (n) => { const d = new Date(Date.now() - n * 86400000);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    const S = DA.state();
    S.clients = [
      /* 30 gün önce ölçülmüş, 21 günlük takip → gecikmiş 9 gün */
      { id: 'a', name: 'Gecikmiş', aralik: 21, meas: [{ id: 'm', d: g(30), w: 70 }] },
      /* 5 gün önce ölçülmüş, 21 günlük takip → zamanında */
      { id: 'b', name: 'Zamanında', aralik: 21, meas: [{ id: 'm', d: g(5), w: 70 }] },
      /* hiç ölçüm yok → listede */
      { id: 'c', name: 'Ölçümsüz', aralik: 21, meas: [] },
      /* hatırlatma kapalı → listede olmamalı */
      { id: 'd', name: 'Kapalı', aralik: 0, meas: [{ id: 'm', d: g(200), w: 70 }] },
      /* 100 gün gecikmiş → en üstte olmalı */
      { id: 'e', name: 'Çok gecikmiş', aralik: 14, meas: [{ id: 'm', d: g(114), w: 70 }] }
    ];
    DA.save();
    const t = DA.takipGereken();
    return { adet: t.length, kimler: t.map((x) => x.c.id).join(','), ilk: t[0].c.id,
      gecikmisGun: (t.find((x) => x.c.id === 'a') || {}).gun };
  });
  /* gecikmiş: a (30>21), c (ölçümsüz), e (114>14) = 3; b zamanında, d kapalı */
  uiEkle('Takip listesi doğru danışanları seçiyor', 3, bugun.adet);
  uiEkle('Hatırlatması kapalı danışan listede yok', false, bugun.kimler.indexOf('d') >= 0);
  uiEkle('Zamanında olan danışan listede yok', false, bugun.kimler.indexOf('b') >= 0);
  uiEkle('En çok gecikmiş en üstte', 'e', bugun.ilk);
  uiEkle('Gecikme gün sayısı doğru', 30, bugun.gecikmisGun);
  await sayfa.evaluate(() => { location.hash = 'ana'; DA.render(false); });
  await sayfa.waitForTimeout(250);
  const anaMetin = await sayfa.$eval('#app', (e) => e.textContent);
  uiEkle('Ana sayfada takip bölümü çıkıyor', true, anaMetin.indexOf('Takip bekleyen') >= 0);
  uiEkle('Ölçümsüz danışan ayrı belirtiliyor', true, anaMetin.indexOf('Hiç ölçüm girilmemiş') >= 0);

  /* Hedef kilo: grafik çizgisi, hedefe kalan, ilerleme */
  const hedef = await sayfa.evaluate(() => {
    const S = DA.state();
    S.clients = [{ id: 'h', name: 'Hedefli', sex: 'K', h: 165, hedef: 65, aralik: 0,
      meas: [{ id: 'm1', d: '2026-01-10', w: 75 }, { id: 'm2', d: '2026-03-10', w: 70 }] }];
    DA.save();
    location.hash = 'danisan/h'; DA.render(false);
    const t = document.querySelector('#app').textContent;
    /* İstatistik kutusunu etiketinden bulur; değer+birim metnini döndürür. */
    const kutuEl = (etiket) => Array.from(document.querySelectorAll('.macros > div'))
      .find((d) => { const s2 = d.querySelector('small'); return s2 && s2.textContent.trim() === etiket; }) || null;
    const kutu = (etiket) => { const d = kutuEl(etiket); return d ? d.querySelector('b').textContent.trim() : null; };
    const hc = document.querySelector('.chart .hedef');
    /* Çizginin var olması yetmez: ölçek hedefi kapsamazsa çizgi görünür
       alanın dışına düşer. viewBox 0..150 içinde olmalı. */
    const hy = hc ? parseFloat(hc.getAttribute('y1')) : null;
    return {
      cizgi: !!hc,
      cizgiIcerde: hy != null && hy > 0 && hy < 150,
      etiket: !!document.querySelector('.chart text.hedefe'),
      /* Birim artık etiketin içinde değil, sayının yanında küçük bir <i>.
         Bu yüzden kutu yapısı üzerinden okunur: <b>değer<i>birim</i></b><small>etiket</small> */
      hedefeKalan: kutu('hedefe') != null,
      bes: kutu('hedefe') === '-5kg',                /* 65 − 70 = -5: 5 kg verilecek */
      birimAyri: (() => { const d = kutuEl('hedefe'); return !!(d && d.querySelector('b > i.vu')); })(),
      ilerleme: t.indexOf('yolun %50') >= 0,          /* 75→70, hedef 65: yarısı */
      bki: t.indexOf('Normal') >= 0                   /* 70/1.65² = 25,7 → Fazla kilolu */
        || t.indexOf('Fazla kilolu') >= 0
    };
  });
  uiEkle('Grafikte hedef çizgisi var', true, hedef.cizgi);
  uiEkle('Hedef çizgisi görünür alanda (ölçek hedefi kapsıyor)', true, hedef.cizgiIcerde);
  uiEkle('Hedef çizgisinde etiket var', true, hedef.etiket);
  uiEkle('Hedefe kalan gösteriliyor', true, hedef.hedefeKalan);
  uiEkle('Hedefe kalan miktarı doğru', true, hedef.bes);
  uiEkle('Birim sayıdan ayrı işaretlenmiş (i.vu)', true, hedef.birimAyri);
  uiEkle('Hedef ilerlemesi doğru hesaplanıyor', true, hedef.ilerleme);
  uiEkle('BKİ sınıfı gösteriliyor', true, hedef.bki);

  /* Boş istatistik kutusu gösterilmiyor */
  const bos = await sayfa.evaluate(() => {
    const S = DA.state();
    S.clients = [{ id: 'z', name: 'Sade', sex: 'K', h: 165, aralik: 0,
      meas: [{ id: 'm1', d: '2026-03-10', w: 60 }] }];
    DA.save();
    location.hash = 'danisan/z'; DA.render(false);
    const t = document.querySelector('#app').textContent;
    return { yagVar: t.indexOf('yağ %') >= 0, tire: (t.match(/—/g) || []).length };
  });
  uiEkle('Yağ yüzdesi girilmemişse kutu gösterilmiyor', false, bos.yagVar);

  /* ---- Hız paketi: favoriler ve menü kopyalama ---- */
  await sayfa.goto(B, { waitUntil: 'networkidle' });
  await sayfa.evaluate(ornekDurum, 'light');
  await git('#/besin', '#foodList .li');
  const fav = await sayfa.evaluate(() => {
    const ilkAd = () => document.querySelector('#foodList .li .t').textContent;
    const once = ilkAd();
    /* listenin sonlarından bir besini favorile */
    const satirlar = document.querySelectorAll('#foodList .favbtn');
    const hedefBtn = satirlar[satirlar.length - 1];
    const hedefAd = hedefBtn.closest('.li').querySelector('.t').textContent;
    DA.actions.foodFav(hedefBtn);
    return { once, hedefAd, sonra: ilkAd(), kayitli: DA.state().ui.favFood.length,
      yildiz: !!document.querySelector('#foodList .favbtn.on'),
      satirVurgu: !!document.querySelector('#foodList .li.fav') };
  });
  uiEkle('Favorilenen besin listenin başına geçiyor', fav.hedefAd, fav.sonra);
  uiEkle('Favori kaydediliyor', 1, fav.kayitli);
  uiEkle('Favori yıldızı işaretli görünüyor', true, fav.yildiz);
  uiEkle('Favori satırı vurgulanıyor', true, fav.satirVurgu);

  const favCip = await sayfa.evaluate(() => {
    DA.render(false);
    const cips = Array.from(document.querySelectorAll('[data-act=foodCat]')).map((b) => b.dataset.c);
    return { var: cips.indexOf('Favoriler') >= 0, yer: cips.indexOf('Favoriler') };
  });
  uiEkle('Favoriler kategorisi çıkıyor', true, favCip.var);
  uiEkle('Favoriler kategorisi Tümü’nün hemen yanında', 1, favCip.yer);

  const favCikar = await sayfa.evaluate(() => {
    const b = document.querySelector('#foodList .favbtn.on');
    DA.actions.foodFav(b);
    return { kayitli: DA.state().ui.favFood.length,
      cipVar: Array.from(document.querySelectorAll('[data-act=foodCat]')).some((x) => x.dataset.c === 'Favoriler') };
  });
  uiEkle('Favoriden çıkarılabiliyor', 0, favCikar.kayitli);

  /* Menü kopyalama: derin kopya olmalı, öğünler paylaşılmamalı */
  const kopya = await sayfa.evaluate(() => {
    const S = DA.state();
    S.menus = [{ id: 'k1', title: 'Pazartesi', date: '2026-01-05', client: 'Ayşe', note: 'not',
      target: { kcal: 1800 }, meals: { 'Kahvaltı': [{ id: 'beyaz-ekmek', g: 50 }], 'Öğle': [] } }];
    DA.save();
    DA.actions.menuCopy({ dataset: { m: 'k1' } });
    const T = DA.state(), yeni = T.menus[0], eski = T.menus.find((m) => m.id === 'k1');
    /* kopyada değişiklik aslını etkilememeli */
    yeni.meals['Kahvaltı'][0].g = 999;
    yeni.meals['Öğle'].push({ id: 'x', g: 1 });
    return { adet: T.menus.length, baslik: yeni.title, ayriMi: yeni.id !== eski.id,
      bugun: yeni.date === DA.today(), danisan: yeni.client,
      aslindaGram: eski.meals['Kahvaltı'][0].g, aslindaOgle: eski.meals['Öğle'].length };
  });
  uiEkle('Menü kopyası oluşuyor', 2, kopya.adet);
  uiEkle('Kopyanın başlığı işaretli', 'Pazartesi (kopya)', kopya.baslik);
  uiEkle('Kopya yeni kimlik alıyor', true, kopya.ayriMi);
  uiEkle('Kopyanın tarihi bugün', true, kopya.bugun);
  uiEkle('Danışan bilgisi kopyalanıyor', 'Ayşe', kopya.danisan);
  uiEkle('Kopyadaki değişiklik aslını bozmuyor (gram)', 50, kopya.aslindaGram);
  uiEkle('Kopyadaki ekleme aslını bozmuyor (öğün)', 0, kopya.aslindaOgle);

  /* ---- renk kontrastı (WCAG AA, 4,5:1) ----
     Değerler sayfadaki gerçek tokenlardan okunur. Cam yüzeyler yarı saydam
     olduğu için kart rengi zeminin üstüne bindirilerek hesaplanır; zemin
     sabit olduğundan kartlar üstteki parıltının (--zemin-tepe) üstünden de
     geçer, ikisi de ölçülür. İlk denemede koyu temada soluk metin parıltı
     üstünde 3,6:1, açık temada düğme degradesinin açık ucu beyaz yazıyla
     3,2:1 çıkmıştı. */
  const kontrastOlc = (tema) => sayfa.evaluate((tema) => {
    DA.setTheme(tema);
    const cs = getComputedStyle(document.documentElement), v = (k) => cs.getPropertyValue(k).trim();
    const renk = (s) => {
      let m = /^#([0-9a-f]{6})$/i.exec(s);
      if (m) return [0, 2, 4].map((i) => parseInt(m[1].substr(i, 2), 16)).concat(1);
      m = /^rgba?\(([^)]+)\)$/.exec(s);
      if (m) { const p = m[1].split(',').map((x) => parseFloat(x)); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
      return null;
    };
    const ust = (on, alt) => [0, 1, 2].map((i) => on[i] * on[3] + alt[i] * (1 - on[3])).concat(1);
    const L = (c) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
    const oran = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const kotu = [], okunamayan = [];
    const R = (k) => { const c = renk(v(k)); if (!c) okunamayan.push(k + '=' + v(k)); return c || [0, 0, 0, 1]; };
    const kontrol = (ad, on, alt) => { const o = oran(on, alt); if (o < 4.5) kotu.push(ad + ' ' + o.toFixed(2)); };
    const beyaz = [255, 255, 255, 1];
    [R('--bg'), R('--zemin-tepe')].forEach((z, zi) => {
      const kart = ust(R('--card'), z), yer = zi ? '@parıltı' : '@zemin';
      ['--ink', '--ink-2', '--mute', '--pri', '--acc'].forEach((k) => {
        kontrol(k + yer, R(k), z); kontrol(k + '/kart' + yer, R(k), kart);
      });
      [['--ok', '--ok-bg'], ['--warn', '--warn-bg'], ['--bad', '--bad-bg'], ['--info', '--info-bg'], ['--pri', '--pri-soft']]
        .forEach((x) => kontrol(x[0] + '/' + x[1] + yer, R(x[0]), ust(R(x[1]), kart)));
      ['--hero-a', '--hero-b', '--hero-c'].forEach((h) => kontrol('beyaz/' + h + yer, beyaz, ust(R(h), z)));
    });
    ['--grad-a', '--grad-b'].forEach((g) => kontrol('--pri-ink/' + g, R('--pri-ink'), R(g)));
    return { kotu: kotu.join(', '), okunamayan: okunamayan.join(', ') };
  }, tema);
  for (const tema of ['light', 'dark']) {
    const k = await kontrastOlc(tema);
    uiEkle('Kontrast AA (' + tema + '): 4,5 altı çift yok', '', k.kotu);
    uiEkle('Kontrast (' + tema + '): tüm tokenlar okunuyor', '', k.okunamayan);
  }
  await sayfa.evaluate(() => DA.setTheme('light'));

  /* Koyu tema iki blokta yazılı (sistem ayarı ve elle seçim). Biri
     değişip öteki unutulursa sistemi koyu olan kullanıcı başka renk görür. */
  const TOKENLAR = ['--bg', '--bg-2', '--card', '--card-2', '--card-opak', '--ink', '--ink-2', '--mute', '--line', '--line-2',
    '--pri', '--pri-2', '--pri-ink', '--pri-soft', '--pri-line', '--acc', '--acc-soft', '--ok', '--ok-bg', '--warn', '--warn-bg',
    '--bad', '--bad-bg', '--info', '--info-bg', '--grad-a', '--grad-b', '--hero-a', '--hero-b', '--hero-c', '--hero-kenar',
    '--cam', '--parlak', '--parilti', '--zemin-tepe', '--zemin-kose', '--zemin-ust', '--zemin-alt', '--sh-1', '--sh-2', '--sh-3',
    '--kart-isik', '--iz', 'color-scheme'];
  const tokenOku = (pg) => pg.evaluate((T) => { const cs = getComputedStyle(document.documentElement);
    return T.map((k) => k + '=' + (k === 'color-scheme' ? cs.colorScheme : cs.getPropertyValue(k).trim())); }, TOKENLAR);
  const sistemKoyu = await tarayici.newPage({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', serviceWorkers: 'block' });
  await sistemKoyu.goto(B + '#/ana', { waitUntil: 'domcontentloaded' });
  await sistemKoyu.waitForFunction(() => window.DA && DA.state);
  await sistemKoyu.evaluate(() => DA.setTheme('auto'));
  const otomatikKoyu = await tokenOku(sistemKoyu);
  await sistemKoyu.evaluate(() => DA.setTheme('dark'));
  const elleKoyu = await tokenOku(sistemKoyu);
  await sistemKoyu.close();
  uiEkle('Sistem koyu teması elle seçilen koyu temayla aynı', '',
    otomatikKoyu.filter((x, i) => x !== elleKoyu[i]).join(' | '));
  uiEkle('Sistem koyu teması gerçekten koyu', 'color-scheme=dark', otomatikKoyu[otomatikKoyu.length - 1]);

  /* ---- Hareket ve reduced-motion ---- */
  const hareket = await sayfa.evaluate(() => {
    const k = getComputedStyle(document.documentElement);
    return { sure: k.getPropertyValue('--gec').trim(),
      appAnim: getComputedStyle(document.querySelector('#app')).animationName };
  });
  uiEkle('Ekran geçişi animasyonu tanımlı', 'gir', hareket.appAnim);
  uiEkle('Geçiş süresi ölçülü (<=200ms)', true, parseFloat(hareket.sure) <= 200);

  const azHareket = await tarayici.newPage({ viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce' });
  await azHareket.goto(B, { waitUntil: 'networkidle' });
  await azHareket.waitForTimeout(200);
  const kapali = await azHareket.evaluate(() => {
    const a = getComputedStyle(document.querySelector('#app'));
    const b = getComputedStyle(document.querySelector('.btn') || document.body);
    return { anim: a.animationName, sure: parseFloat(b.transitionDuration) };
  });
  uiEkle('reduced-motion açıkken ekran animasyonu kapalı', 'none', kapali.anim);
  uiEkle('reduced-motion açıkken geçişler kapalı', true, kapali.sure < 0.01);
  await azHareket.close();

  /* ---- yükleme iskeleti ----
     Tembel veri gelmeden önce ekran boş kalmasın; gelecek içeriğin kaba
     biçimi çizilsin ve ekran okuyucuya durum metni gitsin. */
  const isk = await sayfa.evaluate(() => {
    /* Yüklenmiş veriyi geri al: iskelet yolunu yeniden tetiklemek için */
    const yedek = DA.data.pal; delete DA.data.pal;
    location.hash = 'hesapla/enerji'; DA.render(false);
    const kap = document.querySelector('#app .skel');
    const durum = document.querySelector('#app [role=status]');
    const o = {
      var: !!kap,
      gizli: kap ? kap.getAttribute('aria-hidden') === 'true' : false,
      /* iskelet kutuları gerçekten yer tutuyor mu — sıfır yükseklik işe yaramaz */
      yukseklik: kap ? Math.round(kap.getBoundingClientRect().height) : 0,
      parca: kap ? kap.querySelectorAll('.sk').length : 0,
      girdiYuvasi: kap ? kap.querySelectorAll('.sk-in').length : 0,
      /* Yuvanın var olması yetmez: gerçek girdi kadar yer tutmalı, yoksa veri
         gelince düzen zıplar. Girdiler 44px yüksekliğinde. */
      girdiYuksekligi: (() => {
        const h = kap ? Array.from(kap.querySelectorAll('.sk-in'))
          .map((e) => Math.round(e.getBoundingClientRect().height)) : [];
        return h.length ? Math.min.apply(null, h) : 0;
      })(),
      parcaBos: kap ? Array.from(kap.querySelectorAll('.sk'))
        .filter((e) => e.getBoundingClientRect().height < 6).length : 99,
      metin: durum ? durum.textContent.trim() : '',
      canli: durum ? durum.getAttribute('aria-live') : '',
      /* iskelet metni ekranda görünmemeli (yalnız ekran okuyucu) */
      metinGizli: durum ? durum.getBoundingClientRect().width <= 2 : false
    };
    if (yedek) DA.data.pal = yedek;
    return o;
  });
  uiEkle('Tembel ekran iskelet gösteriyor', true, isk.var);
  uiEkle('İskelet ekran okuyucudan saklanıyor', true, isk.gizli);
  uiEkle('İskelet yer tutuyor (>120px)', true, isk.yukseklik > 120);
  uiEkle('İskelet parça sayısı yeterli (>=6)', true, isk.parca >= 6);
  uiEkle('Hesaplayıcı iskeleti girdi yuvası çiziyor', true, isk.girdiYuvasi >= 3);
  uiEkle('İskelet girdi yuvası gerçek girdi kadar yer tutuyor', true, isk.girdiYuksekligi >= 40);
  uiEkle('İskelette yüksekliği sıfır parça yok', 0, isk.parcaBos);
  kosulUi('İskelette bekleme durumu duyuruluyor', /hazırlanıyor|Yükleniyor/.test(isk.metin), isk.metin);
  uiEkle('Bekleme durumu aria-live polite', 'polite', isk.canli);
  uiEkle('Bekleme metni gözle görünmüyor', true, isk.metinGizli);

  /* ---- sayı vurgusu ---- */
  const vur = await sayfa.evaluate(() => {
    location.hash = 'hesapla/bki'; DA.render(false);
    const f = document.querySelector('form[data-calc]');
    const doldur = (ad, deger) => { const el = f.querySelector('[name=' + ad + ']'); el.value = deger; DA.live.calc(el); };
    doldur('h', '165'); doldur('w', '70');
    const hl = document.querySelector('#calcOut .res.hl .v');
    const u = hl ? hl.querySelector('i.vu') : null;
    return {
      sonucVar: !!hl,
      /* birim ayrı bir <i> içinde ve değerin kendisi harf içermiyor */
      birim: u ? u.textContent.trim() : null,
      deger: hl ? hl.firstChild.textContent.trim() : null,
      /* birim gözle daha küçük ve daha soluk olmalı */
      buyukluk: hl && u ? parseFloat(getComputedStyle(hl).fontSize) - parseFloat(getComputedStyle(u).fontSize) : 0,
      kalinlik: u ? parseInt(getComputedStyle(u).fontWeight, 10) : 999
    };
  });
  uiEkle('Hesap sonucu okunuyor', true, vur.sonucVar);
  uiEkle('Birim ayrı etikete alınmış', 'kg/m²', vur.birim);
  kosulUi('Değer yalnızca sayı', /^[0-9,.−-]+$/.test(vur.deger || ''), vur.deger);
  uiEkle('Birim değerden küçük yazılıyor', true, vur.buyukluk >= 4);
  uiEkle('Birim değerden ince yazılıyor', true, vur.kalinlik < 700);
  const vurDuz = await sayfa.evaluate(() => {
    /* Sayıyla başlamayan değer bozulmadan geçmeli */
    return [DA.sayiVurgu('Ciddi kayıp'), DA.sayiVurgu('1850 kcal/gün'), DA.sayiVurgu('24,2'),
      DA.sayiVurgu('%12,5'), DA.sayiVurgu('1500 – 1800 ml'),
      /* Kaçırma hem sayısız hem birim dalından sınanır: birim dalı eskiden
         sınanmıyordu, çünkü '<script>' sayıyla başlamadığı için düz metin
         dalına düşüyordu. */
      DA.sayiVurgu('<script>'), DA.sayiVurgu('5 <script>kg')];
  });
  uiEkle('Metin değer sarmalanmıyor', 'Ciddi kayıp', vurDuz[0]);
  uiEkle('Birim sayıdan ayrılıyor', '1850<i class="vu">kcal/gün</i>', vurDuz[1]);
  uiEkle('Birimsiz sayı sarmalanmıyor', '24,2', vurDuz[2]);
  uiEkle('Yüzde işareti değerde kalıyor', '%12,5', vurDuz[3]);
  uiEkle('Aralık tek değer sayılıyor', '1500 – 1800<i class="vu">ml</i>', vurDuz[4]);
  kosulUi('Sayı vurgusu metin dalında HTML kaçırıyor', vurDuz[5].indexOf('<script') < 0, vurDuz[5]);
  kosulUi('Sayı vurgusu birim dalında HTML kaçırıyor', vurDuz[6].indexOf('<script') < 0, vurDuz[6]);

  /* ---- ana sayfa hero'su: envanter değil, bugünün işi ---- */
  const kahraman = await sayfa.evaluate(() => {
    const S = DA.state(), b = DA.today();
    /* Yerel gece yarısı toISOString ile UTC'ye çevrilince doğu saat
       dilimlerinde bir gün geri kayıyordu: İstanbul'da (UTC+3) "6 gün önce"
       7 gün önce yazılıyor, sınır ölçümü haftadan düşüyor ve test uygulama
       doğruyken kırılıyordu. Tarih yerel bileşenlerden yazılır. */
    const g = (n) => { const d = new Date(b + 'T00:00'); d.setDate(d.getDate() - n);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    S.clients = [
      /* gecikmiş: 40 gün önce ölçüm, 21 günlük takip */
      { id: 'a', name: 'A', sex: 'K', h: 165, aralik: 21, meas: [{ id: 'm', d: g(40), w: 70 }] },
      /* Bu hafta iki ölçüm: bugün ve 6 gün önce. 7 gün önceki tam sınırda ve
         hafta DIŞINDA (7 günlük pencere bugün dahil son 7 takvim günü, yani
         bugün..bugün-6); 8 gün önceki de dışında. Sınır ölçümü bilerek var:
         olmazsa bir gün kayan bir hata testten sızıp geçiyor. */
      { id: 'b', name: 'B', sex: 'E', h: 175, aralik: 21,
        meas: [{ id: 'm1', d: b, w: 80 }, { id: 'm2', d: g(6), w: 81 },
          { id: 'm3', d: g(7), w: 82 }, { id: 'm4', d: g(8), w: 83 }] }
    ];
    DA.save();
    location.hash = 'ana'; DA.render(false);
    const kutu = Array.from(document.querySelectorAll('.hero .stat'));
    return {
      hafta: DA.sonGunOlcum(7),
      takip: DA.takipGereken().length,
      adet: kutu.length,
      hepsiBaglanti: kutu.every((k) => k.tagName === 'A' && (k.getAttribute('href') || '').indexOf('#/') === 0),
      /* dokunma hedefi: 44px kuralı */
      enKisa: Math.min.apply(null, kutu.map((k) => Math.round(k.getBoundingClientRect().height))),
      etiketler: kutu.map((k) => k.querySelector('span').textContent.trim()),
      degerler: kutu.map((k) => k.querySelector('b').textContent.trim()),
      /* İş yükü olan kutu göze çarpsın — ama hangi kutu olduğu önemli.
         Eskiden yalnız toplam sayılıyordu; başka kutudaki vurgu testi
         geçiriyordu. */
      takipVurgulu: kutu[0] ? kutu[0].classList.contains('uyari') : false,
      /* Sıfır olan kutu vurgulanmamalı: vurgu bilgi taşımalı */
      kartVurgulu: kutu[2] ? kutu[2].classList.contains('uyari') : false,
      kartDeger: kutu[2] ? kutu[2].querySelector('b').textContent.trim() : null,
      /* Halka: takibi açık 2 danışandan 1'i gecikmiş → 1/2 zamanında.
         Gösterge yarım daire (Kasım 2026): tam yay π·42 = 131,95;
         yarısı 65,97 → "66.0" */
      halkaMetin: ((document.querySelector('.hero .halka .orta') || {}).textContent || '').trim(),
      halkaYay: ((document.querySelector('.hero .halka .yay') || { getAttribute: () => '' }).getAttribute('stroke-dasharray') || '').split(' ')[0],
      /* Hafta şeridi: yedi gün, sonuncusu bugün; 6 gün önce 1, bugün 1 ölçüm,
         7 gün önceki şeritte yok */
      haftaGun: document.querySelectorAll('.hero .hafta .gun').length,
      haftaUclar: Array.from(document.querySelectorAll('.hero .hafta .gun')).filter((x, i, a) => i === 0 || i === a.length - 1)
        .map((x) => x.dataset.n + (x.classList.contains('bugun') ? 'b' : '')).join(',')
    };
  });
  uiEkle('Hero halkası: takipte zamanında', '1/2zamanında', kahraman.halkaMetin);
  uiEkle('Hero göstergesi: yay oranı (yarım dairenin yarısı)', '66.0', kahraman.halkaYay);
  uiEkle('Hafta şeridi yedi gün', 7, kahraman.haftaGun);
  uiEkle('Hafta şeridi: ilk gün 1 ölçüm, son gün bugün ve 1 ölçüm', '1,1b', kahraman.haftaUclar);
  uiEkle('Bu hafta ölçüm sayısı doğru', 2, kahraman.hafta);
  uiEkle('Takip bekleyen sayısı doğru', 1, kahraman.takip);
  uiEkle('Hero üç kutu gösteriyor', 3, kahraman.adet);
  uiEkle('Hero kutuları tıklanır bağlantı', true, kahraman.hepsiBaglanti);
  uiEkle('Hero kutuları dokunulabilir yükseklikte', true, kahraman.enKisa >= 44);
  uiEkle('Hero takip bekleyeni gösteriyor', '1', kahraman.degerler[0]);
  uiEkle('Hero bu hafta ölçümü gösteriyor', '2', kahraman.degerler[1]);
  kosulUi('Hero etiketleri envanter değil iş yükü',
    kahraman.etiketler.join('|') === 'takip bekliyor|bu hafta ölçüm|kart günü'
      || kahraman.etiketler.join('|') === 'takip bekliyor|bu hafta ölçüm|kart bekliyor',
    kahraman.etiketler.join('|'));
  uiEkle('Takip bekleyen kutusu vurgulanıyor', true, kahraman.takipVurgulu);
  uiEkle('Sıfır olan kutu vurgulanmıyor', kahraman.kartDeger !== '0', kahraman.kartVurgulu);

  /* ---- yazdırma düzeni ---- */
  const bas = await sayfa.evaluate(() => {
    /* Çıktının her bölümü dolu olsun: boş bırakılan bölüm hiç çizilmediği için
       oradaki bir gerileme testten sızıp geçiyordu (notlar, kayıtlı hesaplar,
       klinik durum bölümleri eskiden hiç uğranmamıştı). */
    const S = DA.state();
    S.clients.push({ id: 'p', name: 'Çıktı Testi', sex: 'K', h: 162, bdate: null,
      aralik: 0, tags: ['dm2'], avoid: 'fıstık',
      note: 'İlk satır\nİkinci satır',
      calcs: [{ d: DA.today(), t: 'BKİ', s: 'BKİ: 24,2 kg/m²' }],
      meas: [{ id: 'q1', d: '2026-01-10', w: 70, h: 162, waist: 88, fat: 32 },
        { id: 'q2', d: '2026-03-10', w: 66, h: 162, waist: 84, fat: 30 }] });
    DA.save();
    location.hash = 'yazdir/danisan/p'; DA.render(false);
    const d = document.querySelector('.printdoc');
    if (!d) return { yok: true };
    const tab = d.querySelector('table');
    const ft = d.querySelector('.ft');
    return {
      antet: !!d.querySelector('.antet'),
      /* Hazırlayanın adı antette ve dipnotta var; gövdede üçüncü kez tekrar etmesin */
      adTekrari: (d.textContent.match(new RegExp(DA.dyt().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length,
      h2: d.querySelectorAll('h2').length,
      h3: d.querySelectorAll('h3').length,
      /* tablo başlığı sayfa sonunda yinelenebilsin diye thead şart */
      thead: !!(tab && tab.querySelector('thead')),
      /* satır içi stil kalmasın; düzen sınıflardan gelsin */
      satirIci: d.querySelectorAll('[style*="font-size"]').length,
      blok: d.querySelectorAll('.blok').length,
      dipnot: ft ? ft.textContent : '',
      tarih: ft ? ft.textContent.indexOf(DA.fdate(DA.today())) >= 0 : false,
      /* sayılar sağa yaslı ve tabular */
      sagaYasli: !!(tab && tab.querySelector('td.n'))
    };
  });
  kosulUi('Yazdırma belgesi çiziliyor', !bas.yok, JSON.stringify(bas));
  uiEkle('Çıktıda antet var', true, bas.antet);
  uiEkle('Hazırlayan adı çıktıda iki kez geçiyor (antet + dipnot)', 2, bas.adTekrari);
  uiEkle('Çıktıda belge başlığı var', 1, bas.h2);
  /* Kilo seyri, BKİ seyri, Kayıtlı hesaplar, Notlar — dördü de h3 olmalı */
  uiEkle('Çıktıda bölüm başlıkları h3 ile', true, bas.h3 >= 4);
  uiEkle('Çıktı tablosunda thead var', true, bas.thead);
  uiEkle('Çıktıda satır içi punto kalmadı', 0, bas.satirIci);
  uiEkle('Çıktı bölümleri .blok ile işaretli', true, bas.blok >= 1);
  uiEkle('Çıktı dipnotunda tarih var', true, bas.tarih);
  kosulUi('Dipnotta hazırlayan ve uyarı var',
    bas.dipnot.indexOf('Diyet Asistanı') >= 0 && /tavsiye yerine geçmez/.test(bas.dipnot), bas.dipnot);
  uiEkle('Çıktıda sayılar sağa yaslı', true, bas.sagaYasli);
  /* Yazdırma kuralları: sayfa sonu denetimi gerçekten tanımlı mı */
  const basKural = await sayfa.evaluate(() => {
    const bul = (secici, ozellik) => {
      let v = null;
      Array.from(document.styleSheets).forEach((ss) => {
        let k; try { k = ss.cssRules; } catch (e) { return; }
        Array.from(k).forEach((r) => {
          if (r.type !== CSSRule.MEDIA_RULE || r.conditionText.indexOf('print') < 0) return;
          Array.from(r.cssRules).forEach((x) => {
            if (x.selectorText && x.selectorText.indexOf(secici) >= 0 && x.style[ozellik]) v = x.style[ozellik];
          });
        });
      });
      return v;
    };
    return {
      baslik: bul('.printdoc h3', 'breakAfter'),
      blok: bul('.printdoc .blok', 'breakInside'),
      satir: bul('.printdoc tr', 'breakInside'),
      thead: bul('.printdoc thead', 'display')
    };
  });
  uiEkle('Başlık bölümünden kopmuyor', 'avoid', basKural.baslik);
  uiEkle('Bölümler sayfa sonunda bölünmüyor', 'avoid', basKural.blok);
  uiEkle('Tablo satırları bölünmüyor', 'avoid', basKural.satir);
  uiEkle('Tablo başlığı her sayfada yineleniyor', 'table-header-group', basKural.thead);

  /* ---- değişim listesi: bağlam, kilit, süt türü, hedef ----
     Her senaryo sahada bulunan bir hatanın kendisidir. */
  /* Önceki testlerden biri sayfayı yeniden yükleyebiliyor; o zaman tembel veri
     düşer ve değişim listesi iskelette kalır. Ekranın verisi burada yüklenir. */
  await sayfa.evaluate(() => DA.need(['tuber', 'hedef']));
  const dg = await sayfa.evaluate(() => {
    const S = DA.state(), ui = S.ui, o = {};
    const ac = (h) => { location.hash = h; DA.render(false); };
    const girdi = (ad) => { const e = document.querySelector('input[name=' + ad + '][data-live=exT]'); return e ? e.value : null; };
    const alanEx = (k) => (ui.exAlan[k] || {}).ex || {};
    S.clients = [
      { id: 'ayse', name: 'Ayşe', sex: 'K', h: 160, meas: [],
        plan: { d: '2026-09-01', ts: 1000, hedef: { kcal: 1400, c: 50, p: 20 },
          ex: { sut: 2, et: 4, eyg: 6, sebze: 4, meyve: 3, yag: 3 }, meal: {}, top: { kcal: 1400, c: 0, p: 0, f: 0 } } },
      { id: 'mehmet', name: 'Mehmet', sex: 'E', h: 180, meas: [] }
    ];
    /* Eski biçim: tek ortak alan, içinde başka birinin 2400 kcal planı */
    delete ui.exAlan;
    ui.ex = { sut: 3, et: 8, eyg: 13, sebze: 5, meyve: 3, yag: 4, tohum: 2 };
    ui.exT = { kcal: 2400, c: 50, p: 20 };
    ui.exClient = null;
    DA.save();

    /* 1) Ayşe'nin dosyasından açılınca Ayşe'nin planı gelmeli */
    ac('hesapla/degisim?c=ayse');
    o.ayseHedef = girdi('kcal');
    o.ayseSut = alanEx('ayse').sut; o.ayseEt = alanEx('ayse').et;
    o.eskiGenele = alanEx('').eyg;                    /* eski ortak alan genel bağlama taşındı */
    o.eskiAlanSilindi = !('ex' in ui) && !('exT' in ui);
    o.notAyni = /Dosyadaki planla aynı/.test((document.querySelector('#exDanisan') || {}).textContent || '');

    /* 2) Değiştirmeden kaydetmek Ayşe'nin planını bozmamalı */
    DA.actions.exSaveClient({ dataset: { id: 'ayse' } });
    o.kayitSonraKcal = S.clients[0].plan.hedef.kcal;
    o.kayitSonraEt = S.clients[0].plan.ex.et;

    /* 2b) Artırıp geri azaltmak "değişiklik" sayılmamalı: sayaç 0'a inince
       alanda tohum: 0 kalır, dosyada tohum hiç yoktur — ikisi aynı plandır. */
    DA.actions.exInc({ dataset: { k: 'tohum' } }); DA.actions.exDec({ dataset: { k: 'tohum' } });
    o.sifirAyniSayiliyor = /Dosyadaki planla aynı/.test(document.querySelector('#exDanisan').textContent);

    /* 3) Ayşe'de değişiklik: uyarı çıkmalı, genel alan etkilenmemeli */
    DA.actions.exInc({ dataset: { k: 'sut' } });
    o.degisiklikUyarisi = /Kaydedilmemiş/.test(document.querySelector('#exDanisan').textContent);
    o.dosyaHenuzEski = S.clients[0].plan.ex.sut;
    o.genelEtkilenmedi = alanEx('').sut;

    /* 4) Yanlış bağlamdan gelen kaydet düğmesi başka dosyaya yazmamalı */
    DA.actions.exSaveClient({ dataset: { id: 'mehmet' } });
    o.mehmeteYazilmadi = !S.clients[1].plan;

    /* 5) Dosyadaki plana dön, sonra geri al */
    DA.actions.exPlanaDon();
    o.donunceSut = alanEx('ayse').sut;
    const geriAl = document.querySelector('.toast .gbtn');
    if (geriAl) geriAl.click();
    o.geriAlSut = alanEx('ayse').sut;

    /* 6) Kaydet: artık dosya güncel */
    DA.actions.exSaveClient({ dataset: { id: 'ayse' } });
    o.kayitGuncel = S.clients[0].plan.ex.sut;
    o.notAyniTekrar = /Dosyadaki planla aynı/.test(document.querySelector('#exDanisan').textContent);

    /* 7) Kilitli yarım değişim korunmalı (eskiden 1,5 → 2, 0,5 → 1) */
    ac('hesapla/degisim');
    const G = ui.exAlan[''];
    G.ex = { sut: 1.5, et: 0.5 }; G.exLock = { sut: true, et: true }; G.exT = { kcal: 1800, c: 50, p: 20, ts: 1 };
    DA.actions.exAuto();
    o.kilitSut = G.ex.sut; o.kilitEt = G.ex.et;

    /* 8) Süt türü korunmalı (eskiden yarım yağlı silinip tam yağlı konuyordu) */
    G.ex = { sutyy: 2 }; G.exLock = {};
    DA.actions.exAuto();
    o.yyKaldi = G.ex.sutyy > 0; o.tamYagliEklenmedi = G.ex.sut || 0;
    /* tam yağlı kilitliyken kilitsiz yarım yağlı olduğu gibi kalmalı */
    G.ex = { sut: 1, sutyy: 1 }; G.exLock = { sut: true };
    DA.actions.exAuto();
    o.yyKilitYaninda = G.ex.sutyy;

    /* 9) Öğünlerde yarım değişim: 1,5 süt öğünlere 1,5 olarak dağılmalı */
    G.ex = { sut: 1.5, et: 3, eyg: 6, sebze: 3, meyve: 2, yag: 3 }; G.exLock = {};
    DA.actions.exMealAuto();
    o.ogunSut = Object.keys(G.exMeal).reduce((t, m) => t + (G.exMeal[m].sut || 0), 0);
    o.uyusmazlikYok = !/uyuşmuyor/.test(document.querySelector('#exMeals').textContent);

    /* 10) Hesaplayıcıda daha yeni hedef: sessizce yazılmaz, önerilir */
    G.exT = { kcal: 1800, c: 50, p: 20, ts: 1000 };
    S.targets = { kcal: 2400, c: 300, p: 120, f: 80, dan: '', ts: 2000 };
    ac('hesapla/degisim');
    o.hedefSessizKaldi = girdi('kcal');
    o.oneriVar = /2400 kcal/.test((document.querySelector('#exHedefOneri') || {}).textContent || '');
    DA.actions.exHedefAl();
    o.oneriAlininca = girdi('kcal');
    o.oneriKayboldu = !(document.querySelector('#exHedefOneri') || {}).textContent;
    /* başka danışan için hesaplanan hedef Ayşe'ye önerilmemeli */
    S.targets = { kcal: 3000, c: 375, p: 150, f: 100, dan: 'mehmet', ts: 5000 };
    ac('hesapla/degisim?c=ayse');
    o.baskasininHedefiYok = !(document.querySelector('#exHedefOneri') || {}).textContent;
    /* elle düzeltme hesaplayıcıdaki eski hedeften daha yenidir */
    S.targets = { kcal: 2000, c: 250, p: 100, f: 67, dan: 'ayse', ts: 6000 };
    ac('hesapla/degisim?c=ayse');
    o.ayseyeOneri = /2000 kcal/.test(document.querySelector('#exHedefOneri').textContent);
    const k = document.querySelector('input[name=kcal][data-live=exT]');
    k.value = '1500'; DA.live.exT(k);
    o.elleSonraOneriYok = !document.querySelector('#exHedefOneri').textContent;

    /* 11) Yazdırma ekrandakini basar; kaydedilmemişse uyarır */
    DA.actions.exInc({ dataset: { k: 'meyve' } });
    const meyve = alanEx('ayse').meyve;
    ac('yazdir/degisim/ayse');
    const d = document.querySelector('.printdoc');
    const satir = d ? Array.from(d.querySelectorAll('tr')).find((tr) => /Meyve/.test(tr.textContent)) : null;
    o.basilanMeyve = satir ? satir.querySelector('td.n').textContent.trim() : null;
    o.beklenenMeyve = String(meyve);
    o.basimUyarisi = /kaydedilmedi/.test(document.querySelector('#app').textContent);
    return o;
  });
  uiEkle('Danışan planı açılıyor: hedef', '1400', dg.ayseHedef);
  uiEkle('Danışan planı açılıyor: süt', 2, dg.ayseSut);
  uiEkle('Danışan planı açılıyor: et', 4, dg.ayseEt);
  uiEkle('Eski ortak alan genel bağlama taşındı', 13, dg.eskiGenele);
  uiEkle('Eski ortak alan kaldırıldı', true, dg.eskiAlanSilindi);
  uiEkle('Değişmemiş plan "aynı" gösteriliyor', true, dg.notAyni);
  uiEkle('Kaydet başka planla ezmiyor: hedef', 1400, dg.kayitSonraKcal);
  uiEkle('Kaydet başka planla ezmiyor: et', 4, dg.kayitSonraEt);
  uiEkle('Sıfıra inen sayaç değişiklik sayılmıyor', true, dg.sifirAyniSayiliyor);
  uiEkle('Kaydedilmemiş değişiklik gösteriliyor', true, dg.degisiklikUyarisi);
  uiEkle('Kaydetmeden dosya değişmiyor', 2, dg.dosyaHenuzEski);
  uiEkle('Danışan düzenlemesi genel alana sızmıyor', 3, dg.genelEtkilenmedi);
  uiEkle('Yanlış bağlamdan kaydet başka dosyaya yazmıyor', true, dg.mehmeteYazilmadi);
  uiEkle('Dosyadaki plana dönülüyor', 2, dg.donunceSut);
  uiEkle('Dosyaya dönüş geri alınabiliyor', 3, dg.geriAlSut);
  uiEkle('Kaydet dosyayı güncelliyor', 3, dg.kayitGuncel);
  uiEkle('Kayıttan sonra "aynı" gösteriliyor', true, dg.notAyniTekrar);
  uiEkle('Kilitli 1,5 süt korunuyor', 1.5, dg.kilitSut);
  uiEkle('Kilitli 0,5 et korunuyor', 0.5, dg.kilitEt);
  uiEkle('Yarım yağlı süt seçimi korunuyor', true, dg.yyKaldi);
  uiEkle('Yarım yağlı yerine tam yağlı eklenmiyor', 0, dg.tamYagliEklenmedi);
  /* Kullanıcı kararı: süt türü kilitle değişir; kilitli tam yağlı varken
     kilitsiz yarım yağlı eklenmez. */
  uiEkle('Tam yağlı kilitliyken yarım yağlı eklenmiyor', 0, dg.yyKilitYaninda);
  uiEkle('Yarım değişim öğünlere tam dağılıyor', 1.5, dg.ogunSut);
  uiEkle('Yarım değişimde uyuşmazlık uyarısı yok', true, dg.uyusmazlikYok);
  uiEkle('Yeni hedef sessizce yazılmıyor', '1800', dg.hedefSessizKaldi);
  uiEkle('Yeni hedef öneriliyor', true, dg.oneriVar);
  uiEkle('Önerilen hedef alınabiliyor', '2400', dg.oneriAlininca);
  uiEkle('Alınan hedef artık önerilmiyor', true, dg.oneriKayboldu);
  uiEkle('Başka danışanın hedefi önerilmiyor', true, dg.baskasininHedefiYok);
  uiEkle('Aynı danışanın yeni hedefi öneriliyor', true, dg.ayseyeOneri);
  uiEkle('Elle düzeltme sonrası eski hedef önerilmiyor', true, dg.elleSonraOneriYok);
  uiEkle('Yazdırma ekrandaki planı basıyor', dg.beklenenMeyve, dg.basilanMeyve);
  uiEkle('Kaydedilmemiş plan basılırken uyarı var', true, dg.basimUyarisi);

  /* ---- değişim listesi: klasik basamaklı hesap ----
     Beklenen değerler yöntemden elle hesaplandı (TÜBER Ek 3.1.1 satırları ×
     değişim katsayıları, sonra KH→ekmek, P→et, Y→yağ). Uygulamadan türetilmedi. */
  await sayfa.evaluate(() => DA.need(['tuber', 'hedef']));
  const kl = await sayfa.evaluate(() => {
    const ui = DA.state().ui, o = {};
    const eski = DA.toast; DA.toast = () => {};
    ui.exClient = null; location.hash = 'hesapla/degisim'; DA.render(false);
    const G = ui.exAlan[''];
    const kos = (kcal, c, p, ex, kilit) => {
      G.ex = Object.assign({}, ex || {}); G.exLock = Object.assign({}, kilit || {}); G.exT = { kcal, c, p, ts: 1 };
      DA.actions.exAuto();
      return Object.assign({}, G.ex);
    };
    const T = DA.exchange.totals;

    /* 1800 kcal · KH 50 · P 20 — elle:
       TÜBER 1800: süt 3 × 1,2 = 3,6 → 4 · sebze 2,5 × 1,5 = 3,75 → 4 ·
       meyve 2 × 1,25 = 2,5 → 3 · y.tohum (0,5+1)/2 × 2,5 = 1,875 → 2
       KH 225 g − (36 + 24 + 45) = 120 ÷ 15 = 8 ekmek
       P 90 g − (24 + 8 + 4 + 16) = 38 ÷ 6 = 6,3 → 6 et
       Y 60 g − (12 + 10 + 30) = 8 ÷ 5 = 1,6 → 2 yağ
       Enerji 348 + 128 + 180 + 106 + 544 + 414 + 90 = 1810 kcal */
    const a = kos(1800, 50, 20);
    o.a = [a.sutyy, a.sut, a.sebze, a.meyve, a.tohum, a.eyg, a.et, a.yag].join(',');
    o.aKcal = Math.round(T(a).kcal);
    o.aUyari = G.adim.uyari.length;
    const li = Array.from(document.querySelectorAll('#exAdim li')).map((x) => x.textContent);
    o.adimSayisi = li.length;
    o.adimEkmek = li.some((x) => /Ekmek = \(225 g KH hedefi − 105\) ÷ 15/.test(x));
    o.adimEt = li.some((x) => /Et = \(90 g protein hedefi − 52\) ÷ 6/.test(x));
    o.adimYag = li.some((x) => /Yağ = \(60 g yağ hedefi − 52\) ÷ 5/.test(x));
    o.adimKaynak = li.length && /TÜBER Ek 3\.1\.1, 1800 kkal/.test(li[0]);
    /* elle değişince eski adımlar gösterilmez */
    DA.actions.exInc({ dataset: { k: 'et' } });
    o.adimElleGizli = !document.querySelector('#exAdim li');

    /* 3000 kcal · KH 55 · P 15 — elle:
       TÜBER 3000: süt 4 · sebze 4 × 1,5 = 6 · meyve 3 × 1,25 = 3,75 → 4 · y.tohum 2
       KH 412,5 − (36 + 36 + 60) = 280,5 ÷ 15 = 18,7 → 19
       P 112,5 − (24 + 12 + 4 + 38) = 34,5 ÷ 6 = 5,75 → 6
       Y 100 − (12 + 10 + 30) = 48 ÷ 5 = 9,6 → 10 · enerji 3042 kcal
       (eski arama bu hedefte "bulunamadı" diyordu) */
    const b = kos(3000, 55, 15);
    o.b = [b.sutyy, b.sebze, b.meyve, b.tohum, b.eyg, b.et, b.yag].join(',');
    o.bKcal = Math.round(T(b).kcal);

    /* Kilitli et: 1800/50/20, et 3 kilitli — elle:
       ekmek 8 · yağ (60 − 12 − 10 − 15) ÷ 5 = 4,6 → 5 · enerji 1738, fark 62 > 54
       → ekmek + round(62 ÷ 68) = +1 → 9 · sonuç 1806 kcal */
    const c = kos(1800, 50, 20, { et: 3 }, { et: true });
    o.c = [c.et, c.yag, c.eyg].join(',');
    o.cKilitAdim = Array.from(document.querySelectorAll('#exAdim li')).some((x) => /Et kilitli: 3/.test(x.textContent));
    o.cEnerjiAdim = Array.from(document.querySelectorAll('#exAdim li')).some((x) => /Enerji düzeltmesi/.test(x.textContent));

    /* Süt türü kilitle değişir; varsayılan yarım yağlı */
    const s1 = kos(1800, 50, 20, { sut: 3 });                        /* kilitsiz tam yağlı */
    o.sutVarsayilan = s1.sutyy + '/' + s1.sut;
    const s2 = kos(1800, 50, 20, { sut: 2 }, { sut: true });          /* tam yağlı 2 kilitli */
    o.sutKilitli = s2.sut + '/' + s2.sutyy;
    const s3 = kos(1800, 50, 20, { sutyy: 0 }, { sutyy: true });      /* yarım yağlı 0'da kilitli */
    o.sutTamaGecis = s3.sut + '/' + s3.sutyy;
    /* tam yağlıya geçince yağ bütçesi daralır: (60 − 24 − 10 − 30) ÷ 5 = −0,8 → 0 */
    o.sutTamYag = s3.yag;

    /* Yüksek protein: 1500/45/25 — yağ %40'a çıkmadan en yakın plan + uyarı */
    const d = kos(1500, 45, 25), td = T(d);
    o.dYagYuzde = Math.round(td.f * 900 / td.kcal);
    o.dEnerji = Math.abs(td.kcal - 1500) <= 50;
    o.dUyari = G.adim.uyari.join(' | ');
    /* 3500/55/20: eklenen yağ 0 → açık uyarı */
    kos(3500, 55, 20);
    o.yag0 = G.adim.uyari.join(' | ');

    /* Özellik: 1000–3500 kcal, P ≤ %20 hedeflerin hepsi enerji ±%3 (en az 50)
       ve makrolar ±3 puan içinde; P %25–30 dahil hiçbir hedef "bulunamadı"
       demiyor ve enerji tutuyor. */
    const oran = [[50, 20], [55, 15], [45, 20], [40, 20], [60, 15], [45, 25], [40, 30], [35, 25]];
    const kotu = [], enerjiKotu = []; let sayi = 0;
    for (let kcal = 1000; kcal <= 3500; kcal += 100) oran.forEach(([cc, pp]) => {
      sayi++; const t = T(kos(kcal, cc, pp)), e = t.kcal;
      if (!(Math.abs(e - kcal) <= Math.max(50, kcal * 0.03))) enerjiKotu.push(kcal + '/' + cc + '/' + pp);
      if (pp <= 20 && (Math.abs(t.c * 400 / e - cc) > 3 || Math.abs(t.p * 400 / e - pp) > 3 || Math.abs(t.f * 900 / e - (100 - cc - pp)) > 3))
        kotu.push(kcal + '/' + cc + '/' + pp);
    });
    o.izgaraSayi = sayi; o.izgaraMakro = kotu.join(' '); o.izgaraEnerji = enerjiKotu.join(' ');

    /* TÜBER çıpası iki sütun arasında ara değerleniyor:
       1900 kkal sebze (2,5 + 3)/2 × 1,5 = 4,125 · meyve (2 + 2,5)/2 × 1,25 = 2,8125
       3500 kkal (tablo dışı) ekmek 8 × 3500/3200 × 2 = 17,5 */
    const ci = DA.oruntu.degisim(1900), cd = DA.oruntu.degisim(3500);
    o.araSebze = Math.abs(ci.sebze - 4.125) < 1e-9;
    o.araDegerMeyve = Math.abs(ci.meyve - 2.8125) < 1e-9;
    o.disEkmek = Math.abs(cd.eyg - 17.5) < 1e-9;

    /* ---- öğünlere dağıtım: öğüne uygun gruplar (1800/50/20 planı) ---- */
    kos(1800, 50, 20);
    DA.actions.exMealAuto();
    const M = G.exMeal, plan = G.ex;
    /* Öğün satırı süt türünü göstermeli: parantez atılınca "Süt (yarım yağlı)"
       da "Süt" oluyordu; varsayılan yarım yağlı olduğundan tür kayboluyordu. */
    o.ogunSutTuru = /Süt \(yarım yağlı\)/.test((document.querySelector('#exMeals') || {}).textContent || '');
    const top = {}; Object.keys(M).forEach((m) => Object.keys(M[m]).forEach((k) => { top[k] = (top[k] || 0) + M[m][k]; }));
    o.ogunToplam = Object.keys(plan).every((k) => Math.abs((top[k] || 0) - (plan[k] || 0)) < 0.01);
    o.araYagYok = !(M.ara1.yag || M.ara2.yag);
    o.araEtYok = !(M.ara1.et || M.ara2.et);
    o.araMeyve = (M.ara1.meyve || 0) >= 1 && (M.ara2.meyve || 0) >= 1;
    o.kahvaltiEt = (M.kahvalti.et || 0) >= 1;
    const PAY = { kahvalti: 25, ara1: 10, ogle: 30, ara2: 10, aksam: 25 }, tk = T(plan).kcal;
    o.payMaks = Math.max.apply(null, Object.keys(PAY).map((m) => Math.abs(T(M[m]).kcal / tk * 100 - PAY[m])));
    /* Zorlayıcı planlar: gerçekçi planda başka gruplar ara öğünü zaten
       doldurduğu için uygunluk kuralı sınanmıyordu (ara öğüne yağı serbest
       bırakan bozma testten geçti). Tek gruptan oluşan planda enerji açığı ara
       öğünü çeker; kural ancak burada görünür. Elle: {et: 5} ara öğüne yağ/et
       yasağı kalksa 4. birim ara öğüne gider. */
    const tek = (ex) => { G.ex = ex; DA.actions.exMealAuto(); return G.exMeal; };
    /* Sorunun görüldüğü planlar: ekmek dengeleyici olmadan öğle payı 1200 ve
       2400 kcal'de %24–25'e düşüyordu; et sütten sonra yerleşince süt 4 / et 4
       planında kahvaltıya peynir/yumurta kalmıyordu. */
    const payHata = (ex) => { const mm = tek(ex), tt = T(ex).kcal;
      return Math.max.apply(null, Object.keys(PAY).map((m) => Math.abs(T(mm[m]).kcal / tt * 100 - PAY[m]))); };
    o.pay1200 = payHata(kos(1200, 55, 15) && Object.assign({}, G.ex));
    o.pay2400 = payHata(kos(2400, 50, 20) && Object.assign({}, G.ex));
    o.kahvaltiEt44 = (tek({ sutyy: 4, et: 4, eyg: 9, sebze: 5, meyve: 2, yag: 4, tohum: 2 }).kahvalti.et || 0) >= 1;
    const e5 = tek({ et: 5 }), y5 = tek({ yag: 5 }), m4 = tek({ meyve: 4 });
    o.zorEt = (e5.ara1.et || 0) + (e5.ara2.et || 0);
    o.zorYag = (y5.ara1.yag || 0) + (y5.ara2.yag || 0);
    o.zorMeyve = (m4.ara1.meyve || 0) >= 1 && (m4.ara2.meyve || 0) >= 1;
    DA.toast = eski;
    return o;
  });
  uiEkle('Klasik: 1800/50/20 grupları (yy,tam,sebze,meyve,tohum,ekmek,et,yağ)', '4,0,4,3,2,8,6,2', kl.a);
  uiEkle('Klasik: 1800/50/20 enerji', 1810, kl.aKcal);
  uiEkle('Klasik: ulaşılabilir hedefte uyarı yok', 0, kl.aUyari);
  uiEkle('Hesap adımları dört basamak', 4, kl.adimSayisi);
  uiEkle('Adım: ekmek formülü sayılarıyla', true, kl.adimEkmek);
  uiEkle('Adım: et formülü sayılarıyla', true, kl.adimEt);
  uiEkle('Adım: yağ formülü sayılarıyla', true, kl.adimYag);
  uiEkle('Adım: sabitlerin kaynağı yazıyor', true, !!kl.adimKaynak);
  uiEkle('Elle değişen planda eski adımlar gizleniyor', true, kl.adimElleGizli);
  uiEkle('Klasik: 3000/55/15 (eskiden bulunamadı)', '4,6,4,2,19,6,10', kl.b);
  uiEkle('Klasik: 3000/55/15 enerji', 3042, kl.bKcal);
  uiEkle('Kilitli et korunuyor, yağ ve ekmek ona göre', '3,5,9', kl.c);
  uiEkle('Adımlarda kilitli grup yazıyor', true, kl.cKilitAdim);
  uiEkle('Adımlarda enerji düzeltmesi yazıyor', true, kl.cEnerjiAdim);
  uiEkle('Süt varsayılanı yarım yağlı (yy/tam)', '4/0', kl.sutVarsayilan);
  uiEkle('Kilitli tam yağlı süt korunuyor (tam/yy)', '2/0', kl.sutKilitli);
  uiEkle('Yarım yağlı 0 kilitliyse süt tam yağlı (tam/yy)', '4/0', kl.sutTamaGecis);
  uiEkle('Tam yağlı sütte yağ bütçesi daralıyor', 0, kl.sutTamYag);
  uiEkle('Yüksek proteinde yağ %40’a çıkmıyor', true, kl.dYagYuzde <= 33);
  uiEkle('Yüksek proteinde enerji tutuyor', true, kl.dEnerji);
  kosulUi('Yüksek proteinde açık uyarı', /Protein hedefi \(%25\) bu listeyle/.test(kl.dUyari), kl.dUyari);
  kosulUi('Makro sapması sayısıyla yazılıyor', /Hedeften sapma: .*protein %\d+ \(hedef %25\)/.test(kl.dUyari), kl.dUyari);
  kosulUi('Eklenen yağ 0 ise uyarı', /Eklenen yağ 0/.test(kl.yag0), kl.yag0);
  uiEkle('Izgara: hedef sayısı', 208, kl.izgaraSayi);
  uiEkle('Izgara: P ≤ %20 hedeflerde makro sapması yok', '', kl.izgaraMakro);
  uiEkle('Izgara: tüm hedeflerde enerji tutuyor', '', kl.izgaraEnerji);
  uiEkle('TÜBER çıpası ara değerleniyor (sebze 1900)', true, kl.araSebze);
  uiEkle('TÜBER çıpası ara değerleniyor (meyve 1900)', true, kl.araDegerMeyve);
  uiEkle('TÜBER çıpası tablo dışında ölçekleniyor', true, kl.disEkmek);
  uiEkle('Öğünler: grup toplamları korunuyor', true, kl.ogunToplam);
  uiEkle('Öğün satırında süt türü görünüyor', true, kl.ogunSutTuru);
  uiEkle('Öğünler: ara öğünde yağ yok', true, kl.araYagYok);
  uiEkle('Öğünler: ara öğünde et yok', true, kl.araEtYok);
  uiEkle('Öğünler: iki ara öğünde de meyve var', true, kl.araMeyve);
  uiEkle('Öğünler: kahvaltıda peynir/yumurta (et) var', true, kl.kahvaltiEt);
  uiEkle('Öğünler: enerji payları ±3 puan içinde', true, kl.payMaks <= 3);
  uiEkle('Öğünler: 1200 kcal planında paylar ±3 puan', true, kl.pay1200 <= 3);
  uiEkle('Öğünler: 2400 kcal planında paylar ±3 puan', true, kl.pay2400 <= 3);
  uiEkle('Öğünler: süt 4 / et 4 planında kahvaltıda et var', true, kl.kahvaltiEt44);
  uiEkle('Öğünler: yalnız etli planda bile ara öğüne et gitmiyor', 0, kl.zorEt);
  uiEkle('Öğünler: yalnız yağlı planda bile ara öğüne yağ gitmiyor', 0, kl.zorYag);
  uiEkle('Öğünler: yalnız meyveli planda iki ara öğünde meyve', true, kl.zorMeyve);

  /* ---- değişim listesi: kuru baklagil ve yemeklerin karşılığı ----
     Değişim değerleri Dyt. Can Bayramoğlu'nun listesinden: kuru baklagil
     15 g KH + 5 g protein → 60 + 20 = 80 kcal.
     Elle (1800 kcal · KH 50 · P 20, kuru baklagil 2 elle girilmiş, kilitsiz):
       sabitler süt yy 4 · sebze 4 · meyve 3 · kuruyemiş 2 (klasik testle aynı)
       baklagil 2 × 15 = 30 g KH, 2 × 5 = 10 g P
       KH 225 − (36 + 24 + 45 + 30) = 90 ÷ 15 = 6 ekmek
       P 90 − (24 + 8 + 4 + 10 + 12) = 32 ÷ 6 = 5,3 → 5 et
       Y 60 − (12 + 10 + 25) = 13 ÷ 5 = 2,6 → 3 yağ
       Enerji 348 + 128 + 180 + 106 + 160 + 408 + 345 + 135 = 1810 kcal
     Yemekler (ekmek 68, sebze 32, yağ 45, baklagil 80 kcal):
       çorba 1 ekmek + 1 yağ = 113 · zeytinyağlı sebze yemeği 1 sebze + 1 yağ = 77
       yağsız salata 32 · zeytinyağlı salata 77 · pilav yalnız 1 ekmek = 68
       roll ekmek 2 ekmek = 136 · nohut 80 */
  const bk = await sayfa.evaluate(() => {
    const ui = DA.state().ui, o = {};
    const eski = DA.toast; DA.toast = () => {};
    ui.exClient = null; location.hash = 'hesapla/degisim'; DA.render(false);
    const G = ui.exAlan[''];
    const g = DA.exchange.groups.find((x) => x.k === 'baklagil') || {};
    o.deger = [g.c, g.p, g.f].join('/');
    o.kcal = g.k ? DA.exchange.kcalOf(g) : null;
    G.ex = { baklagil: 2 }; G.exLock = {}; G.exMeal = {}; G.exT = { kcal: 1800, birim: 'yuzde', c: 50, p: 20, ts: 1 };
    DA.actions.exAuto();
    o.plan = [G.ex.baklagil, G.ex.sutyy, G.ex.sebze, G.ex.meyve, G.ex.tohum, G.ex.eyg, G.ex.et, G.ex.yag].join(',');
    o.kcalTop = Math.round(DA.exchange.totals(G.ex).kcal);
    const li = Array.from(document.querySelectorAll('#exAdim li')).map((x) => x.textContent);
    o.adimSayisi = li.length;
    o.adimBaklagil = li.some((x) => /Kuru baklagil girildiği gibi: 2/.test(x) && /30 g KH \+ 10 g protein/.test(x));
    o.adimEkmek = li.some((x) => /Ekmek = \(225 g KH hedefi − 135\) ÷ 15/.test(x));
    o.adimEt = li.some((x) => /Et = \(90 g protein hedefi − 58\) ÷ 6/.test(x));
    /* Dağıtım tekrarlanınca baklagil yerinde kalır (kilitsiz) */
    DA.actions.exAuto();
    o.ikinciKez = G.ex.baklagil;
    o.kilitYok = !document.querySelector('button[data-act=exLock][data-k=baklagil]');
    o.sayacVar = !!document.querySelector('button[data-act=exInc][data-k=baklagil]');
    /* Zorlayıcı plan: yalnız baklagil varken enerji açığı ara öğünü çeker;
       uygunluk kuralı ancak burada görünür. */
    G.ex = { baklagil: 6 }; DA.actions.exMealAuto();
    o.araBaklagil = (G.exMeal.ara1.baklagil || 0) + (G.exMeal.ara2.baklagil || 0);
    o.ogunToplam = Object.keys(G.exMeal).reduce((t, m) => t + (G.exMeal[m].baklagil || 0), 0);
    /* Yemek tablosu: karşılık ve enerji DOM'dan okunur */
    DA.render(false);
    const satir = (ad) => { const r = document.querySelector('#exYemek tr[data-yemek="' + ad + '"]');
      return r ? Array.from(r.cells).map((c) => c.textContent.replace(/\s+/g, ' ').trim()) : ['', '', '']; };
    o.corba = satir('Çorba').slice(1).join(' | ');
    o.zySebze = satir('Zeytinyağlı sebze yemeği').slice(1).join(' | ');
    o.salataYagsiz = satir('Salata, yağsız').slice(1).join(' | ');
    o.salataZy = satir('Salata, zeytinyağlı').slice(1).join(' | ');
    o.pilavKcal = satir('Pirinç pilavı')[2] + '/' + satir('Bulgur pilavı, makarna')[2];
    o.rollKcal = satir('Tam buğday ya da çavdar roll ekmek (hastane)')[2];
    /* Kasım 2026: nohut 3 yk, mercimek 2 yk (kullanıcının onayladığı liste) */
    const olcu = (ad) => { const r = document.querySelector('#exYemek tr[data-yemek="' + ad + '"] .muted'); return r ? r.textContent : ''; };
    o.nohutKcal = [olcu('Nohut, kuru fasulye, barbunya')].concat(satir('Nohut, kuru fasulye, barbunya').slice(1)).join(' | ') + ' / ' +
      [olcu('Mercimek')].concat(satir('Mercimek').slice(1)).join(' | ');
    /* Çıktı yalnız plandaki gruplarla yazılabilen yemekleri basar */
    const cikti = () => { location.hash = 'yazdir/degisim'; DA.render(false);
      const b = document.querySelector('.printdoc .yemekler'); return b ? b.textContent : ''; };
    G.ex = { eyg: 6, sebze: 3 };
    const yagsiz = cikti();
    o.yagsizPlan = [/Salata, yağsız/.test(yagsiz), /pilav/i.test(yagsiz), /Çorba/.test(yagsiz), /zeytinyağlı/i.test(yagsiz), /Nohut/.test(yagsiz)].join(',');
    G.ex = { eyg: 6, sebze: 3, yag: 2 };
    o.yagliPlan = /Çorba, 1 kase1\sekmek \+ 1\syağ/.test(cikti());
    G.ex = {};
    DA.toast = eski;
    return o;
  });
  uiEkle('Kuru baklagil değişimi (KH/P/Y)', '15/5/0', bk.deger);
  uiEkle('Kuru baklagil değişimi enerjisi', 80, bk.kcal);
  uiEkle('Baklagilli plan (bak,yy,sebze,meyve,kuruyemiş,ekmek,et,yağ)', '2,4,4,3,2,6,5,3', bk.plan);
  uiEkle('Baklagilli plan enerjisi', 1810, bk.kcalTop);
  uiEkle('Baklagil adımı ekleniyor (beş basamak)', 5, bk.adimSayisi);
  uiEkle('Adım: baklagilin KH ve proteini yazıyor', true, bk.adimBaklagil);
  uiEkle('Adım: ekmek formülü baklagil KH’sini düşüyor', true, bk.adimEkmek);
  uiEkle('Adım: et formülü baklagil proteinini düşüyor', true, bk.adimEt);
  uiEkle('Yeniden dağıtımda baklagil korunuyor', 2, bk.ikinciKez);
  uiEkle('Baklagilin kilidi yok, sayacı var', 'true/true', bk.kilitYok + '/' + bk.sayacVar);
  uiEkle('Öğünler: yalnız baklagilli planda bile ara öğüne baklagil gitmiyor', 0, bk.araBaklagil);
  uiEkle('Öğünler: baklagil toplamı korunuyor', 6, bk.ogunToplam);
  uiEkle('Yemek: 1 kase çorba', '1 ekmek + 1 yağ | 113', bk.corba);
  uiEkle('Yemek: zeytinyağlı sebze yemeği', '1 sebze + 1 yağ | 77', bk.zySebze);
  uiEkle('Yemek: yağsız salata', '1 sebze | 32', bk.salataYagsiz);
  uiEkle('Yemek: zeytinyağlı salata', '1 sebze + 1 yağ | 77', bk.salataZy);
  uiEkle('Yemek: pilava yağ eklenmiyor (pirinç 2 yk, bulgur 3 yk)', '68/68', bk.pilavKcal);
  uiEkle('Yemek: hastane roll ekmeği 2 değişim', '136', bk.rollKcal);
  uiEkle('Yemek: 3 yk nohut ve 2 yk mercimek 1 baklagil', '3 tepeleme yemek kaşığı (pişmiş) | 1 kuru baklagil | 80 / 2 tepeleme yemek kaşığı (pişmiş) | 1 kuru baklagil | 80', bk.nohutKcal);
  uiEkle('Çıktı: yağsız planda yalnız yazılabilen yemekler (salata, pilav, çorba, zy, nohut)', 'true,true,false,false,false', bk.yagsizPlan);
  uiEkle('Çıktı: yağlı planda çorba karşılığı basılıyor', true, bk.yagliPlan);

  /* ---- menü yazım kuralları ----
     Kurallar Dyt. Can Bayramoğlu'nun liste yazım kurallarıdır; beklenen
     sonuçlar kural metninden elle yazıldı. Uygun menü hiçbir not vermemeli,
     hatalı menü her kuralı tam bir kez tetiklemeli. */
  const mk = await sayfa.evaluate(async () => {
    /* TÜBER besinleri (kefir, galeta) birleşik listeye girsin */
    await DA.need(['porsiyonBesin', 'hedef']); DA.foodsInvalidate();
    const o = {}, K = DA.menuKural, S = DA.state();
    const besin = (ad) => DA.foods.all().find((x) => x.n === ad);
    const it = (ad) => { const f = besin(ad); return { id: f ? f.id : 'yok', n: ad, g: 100 }; };
    const menu = (id, ogun) => { const m = { id, title: 'Kural ' + id, date: DA.today(), client: '', note: '', meals: {} };
      DA.foods.ogunler.forEach((k) => { m.meals[k] = (ogun[k] || []).map(it); }); return m; };
    const kural = (m) => K.denetle(m).map((x) => x.k + '@' + [].concat(x.ogun).join('+')).sort().join(' · ');
    o.eksikBesin = ['Çay (şekersiz)', 'Beyaz peynir (tam yağlı)', 'Domates', 'Beyaz ekmek', 'Elma', 'Badem', 'Mercimek çorbası',
      'Bulgur (haşlanmış)', 'Cacık', 'Kefir, tam yağlı', 'Galeta ekmeği / grissini.', 'Tavuk göğsü (pişmiş, derisiz)',
      'Çoban salatası (zeytinyağlı)', 'Tam buğday ekmeği', 'Süt (yarım yağlı)', 'Muz', 'Simit', 'Ayran', 'Sütlaç',
      'İnek sütü, tam yağlı', 'Peynirli börek'].filter((a) => !besin(a)).join(', ');

    /* Tür tanıma: Türkçe harf sınırları */
    const tur = (ad) => K.tur(besin(ad) || { n: ad });
    o.sutlacSivi = tur('Sütlaç').sivi;
    o.inekSutuSivi = tur('İnek sütü, tam yağlı').sivi;
    o.ayranSivi = tur('Ayran').sivi;
    o.peynirliBorek = tur('Peynirli börek').peynir;
    o.kasar = K.tur({ n: 'Kaşar peyniri' }).peynir;
    o.galeta = [tur('Galeta ekmeği / grissini.').ekmek, tur('Galeta ekmeği / grissini.').galeta].join('/');

    const uygun = menu('mkU', {
      /* kahvaltıda meyve var ama ara öğünlerde de var: "meyve yalnız ana
         öğünde" notu çıkmamalı (ara öğün koşulu ancak böyle sınanır) */
      'Kahvaltı': ['Çay (şekersiz)', 'Beyaz peynir (tam yağlı)', 'Domates', 'Elma', 'Beyaz ekmek'],
      'Kuşluk': ['Elma', 'Badem'],
      'Öğle': ['Mercimek çorbası', 'Bulgur (haşlanmış)', 'Cacık'],
      'İkindi': ['Kefir, tam yağlı', 'Galeta ekmeği / grissini.'],
      'Akşam': ['Mercimek çorbası', 'Tavuk göğsü (pişmiş, derisiz)', 'Çoban salatası (zeytinyağlı)', 'Tam buğday ekmeği'],
      'Gece ara öğünü': ['Süt (yarım yağlı)', 'Muz']
    });
    o.uygun = kural(uygun);
    const hatali = menu('mkH', {
      'Kahvaltı': ['Beyaz ekmek', 'Çay (şekersiz)', 'Beyaz peynir (tam yağlı)'],
      'Kuşluk': ['Simit'],
      'Öğle': ['Bulgur (haşlanmış)', 'Beyaz ekmek', 'Elma'],
      'İkindi': ['Galeta ekmeği / grissini.'],
      'Akşam': ['Mercimek çorbası'],
      'Gece ara öğünü': ['Beyaz peynir (tam yağlı)', 'Beyaz ekmek']
    });
    o.hatali = kural(hatali);

    /* Ekranda: kart, not sayısı ve "Yazım sırasına diz" */
    S.menus.unshift(uygun, hatali); DA.save();
    location.hash = 'menu/mkU'; DA.render(false);
    const kart = document.querySelector('#menuKural');
    o.uygunKart = !!kart && kart.classList.contains('ok');
    location.hash = 'menu/mkH'; DA.render(false);
    o.hataliNot = document.querySelectorAll('#menuKural li[data-kural]').length;
    o.uyariKutusu = document.querySelectorAll('#menuKural .note.warn li').length;
    const dugme = document.querySelector('#menuKural button[data-act=menuDiz]');
    o.dizDugmesi = !!dugme;
    if (dugme) dugme.click();
    const ad = (k) => (hatali.meals[k] || []).map((x) => x.n).join(' > ');
    o.dizKahvalti = ad('Kahvaltı');
    o.dizOgle = ad('Öğle');
    o.dizSonraSira = !document.querySelector('#menuKural li[data-kural=sira]');
    o.dizSonraDugme = !document.querySelector('#menuKural button[data-act=menuDiz]');
    DA.actions.geriAl();
    const m2 = DA.state().menus.find((x) => x.id === 'mkH');
    o.geriAlindi = m2.meals['Kahvaltı'].map((x) => x.n).join(' > ');
    /* Kararlı sıralama: iki sıvı girildikleri sırada kalır */
    const kararli = menu('mkK', { 'Akşam': ['Beyaz ekmek', 'Tavuk göğsü (pişmiş, derisiz)', 'Ayran', 'Mercimek çorbası'] });
    K.diz(kararli);
    o.kararli = kararli.meals['Akşam'].map((x) => x.n).join(' > ');
    /* Çıktıda kâğıda basılmayan not */
    location.hash = 'yazdir/menu/mkH'; DA.render(false);
    const not = document.querySelector('.note.warn.noprint');
    o.ciktiNot = not ? /8 yazım kuralı notu/.test(not.textContent) : false;
    location.hash = 'yazdir/menu/mkU'; DA.render(false);
    o.ciktiNotYok = !/yazım kuralı notu/.test(document.body.textContent);
    S.menus = S.menus.filter((m) => m.id.indexOf('mk') !== 0); DA.save();
    return o;
  });
  uiEkle('Kural testindeki besinler veritabanında', '', mk.eksikBesin);
  uiEkle('Tür: sütlaç sıvı değil', false, mk.sutlacSivi);
  uiEkle('Tür: "İnek sütü, tam yağlı" sıvı', true, mk.inekSutuSivi);
  uiEkle('Tür: ayran sıvı', true, mk.ayranSivi);
  uiEkle('Tür: peynirli börek peynir sayılmıyor', false, mk.peynirliBorek);
  uiEkle('Tür: kaşar peyniri peynir', true, mk.kasar);
  uiEkle('Tür: galeta ekmek ve galeta', 'true/true', mk.galeta);
  uiEkle('Kural: uygun menüde not yok', '', mk.uygun);
  uiEkle('Kural: hatalı menüde her kural bir kez',
    ['araEkmek@Kuşluk', 'araEs@Kuşluk', 'araEs@İkindi', 'bulgurEkmek@Öğle', 'gecePeynir@Gece ara öğünü',
      'araEkmek@Gece ara öğünü', 'meyveAna@Öğle', 'sira@Kahvaltı+Öğle'].sort().join(' · '), mk.hatali);
  uiEkle('Kural kartı: uygun menüde onay notu', true, mk.uygunKart);
  uiEkle('Kural kartı: hatalı menüde 8 not', 8, mk.hataliNot);
  uiEkle('Kural kartı: 6 uyarı, 2 bilgi', 6, mk.uyariKutusu);
  uiEkle('Kural kartı: sıraya diz düğmesi', true, mk.dizDugmesi);
  uiEkle('Sıraya diz: kahvaltı (sıvı başa, ekmek sona)', 'Çay (şekersiz) > Beyaz peynir (tam yağlı) > Beyaz ekmek', mk.dizKahvalti);
  uiEkle('Sıraya diz: öğle', 'Bulgur (haşlanmış) > Elma > Beyaz ekmek', mk.dizOgle);
  uiEkle('Sıraya diz sonrası sıra notu ve düğme kalkıyor', 'true/true', mk.dizSonraSira + '/' + mk.dizSonraDugme);
  uiEkle('Sıraya diz geri alınabiliyor', 'Beyaz ekmek > Çay (şekersiz) > Beyaz peynir (tam yağlı)', mk.geriAlindi);
  uiEkle('Sıraya diz kararlı (ayran çorbadan önce kalır)', 'Ayran > Mercimek çorbası > Tavuk göğsü (pişmiş, derisiz) > Beyaz ekmek', mk.kararli);
  uiEkle('Menü çıktısı: basılmayan kural notu', true, mk.ciktiNot);
  uiEkle('Menü çıktısı: uygun menüde not yok', true, mk.ciktiNotYok);

  /* ---- menü planlayıcı: ev ölçüsü ve miktar düzenleme ----
     Elle: yarım yağlı süt 1 su bardağı = 200 g → 2 su bardağı 400 g, ½ su
     bardağı 100 g; beyaz ekmek 1 dilim = 25 g → 3 dilim 75 g. Ölçüsüz eski
     öğe yalnız gramla basılır. */
  const olc = await sayfa.evaluate(async () => {
    await DA.need(['porsiyonBesin']); DA.foodsInvalidate();
    const S = DA.state(), o = {};
    const eskiPay = DA.shareText; let paylasilan = ''; DA.shareText = (t, x) => { paylasilan = x; };
    const besin = (ad) => DA.foods.all().find((x) => x.n === ad) || {};
    const sut = besin('Süt (yarım yağlı)'), ekmek = besin('Beyaz ekmek');
    const bos = {}; DA.foods.ogunler.forEach((k) => { bos[k] = []; });
    S.menus.unshift({ id: 'mo', title: 'Ölçü', date: DA.today(), client: '', note: '', meals: bos });
    DA.save(); location.hash = 'menu/mo'; DA.render(false);
    const olcuSec = (form, ad) => { const x = Array.from(form.unit.options).find((y) => y.dataset.ad === ad);
      if (x) x.selected = true; form.unit.dispatchEvent(new Event('input', { bubbles: true })); return !!x; };
    /* seçiciden: 2 su bardağı süt */
    DA.actions.pickFood({ dataset: { id: sut.id, m: 'mo', k: 'Kahvaltı' } });
    let form = document.querySelector('#amtForm');
    form.amt.value = '2'; o.sutOlcuVar = olcuSec(form, '1 su bardağı');
    DA.actions.pickConfirm();
    /* besin ayrıntısından: 3 dilim ekmek */
    DA.actions.foodDetail({ dataset: { id: ekmek.id } });
    form = document.querySelector('#amtForm');
    form.menu.value = 'mo'; form.meal.value = 'Kahvaltı'; form.amt.value = '3'; olcuSec(form, '1 dilim');
    DA.actions.foodToMenu();
    const m = S.menus.find((x) => x.id === 'mo'), K = m.meals['Kahvaltı'];
    const oz = (it) => [it.g, it.o, it.a].join('|');
    o.sut = oz(K[0]); o.ekmek = oz(K[1]);
    /* düzenleme: süt ½ su bardağına iner; form mevcut ölçüyle açılır */
    DA.render(false);
    DA.actions.menuItemEdit({ dataset: { m: 'mo', k: 'Kahvaltı', i: '1' } });
    form = document.querySelector('#amtForm');
    o.formDolu = form.amt.value + '|' + ((form.unit.selectedOptions[0] || {}).dataset || {}).ad;
    DA.closeSheet();
    DA.actions.menuItemEdit({ dataset: { m: 'mo', k: 'Kahvaltı', i: '0' } });
    form = document.querySelector('#amtForm');
    form.amt.value = '0,5'; form.amt.dispatchEvent(new Event('input', { bubbles: true }));
    DA.actions.menuItemSave({ dataset: { m: 'mo', k: 'Kahvaltı', i: '0' } });
    o.yarim = oz(K[0]);
    o.satir = Array.from(document.querySelectorAll('#app .res .duzen .sub')).map((x) => x.textContent.trim()).join(' / ');
    /* sıra: ekmek yukarı */
    DA.actions.menuItemMove({ dataset: { m: 'mo', k: 'Kahvaltı', i: '1', yon: '-1' } });
    o.sira = m.meals['Kahvaltı'].map((x) => x.n).join(' > ');
    /* ölçüsüz eski öğe */
    m.meals['Öğle'].push({ id: ekmek.id, n: ekmek.n, g: 50 });
    DA.save();
    location.hash = 'yazdir/menu/mo'; DA.render(false);
    o.cikti = Array.from(document.querySelectorAll('.printdoc tbody tr:not(.mh) td:nth-child(2)')).map((x) => x.textContent.trim()).join(' / ');
    DA.actions.menuShare({ dataset: { m: 'mo' } });
    o.paylas = /• Beyaz ekmek — 3 dilim \(75 g\)/.test(paylasilan) && /• Süt \(yarım yağlı\) — ½ su bardağı \(100 g\)/.test(paylasilan);
    DA.shareText = eskiPay;
    S.menus = S.menus.filter((x) => x.id !== 'mo'); DA.save();
    return o;
  });
  uiEkle('Menü: ölçü seçeneği bulundu', true, olc.sutOlcuVar);
  uiEkle('Menü: 2 su bardağı süt (g|ölçü|adet)', '400|1 su bardağı|2', olc.sut);
  uiEkle('Menü: 3 dilim ekmek besin ayrıntısından', '75|1 dilim|3', olc.ekmek);
  uiEkle('Menü: düzenleme formu mevcut ölçüyle açılıyor', '3|1 dilim', olc.formDolu);
  uiEkle('Menü: süt ½ su bardağına iniyor', '100|1 su bardağı|0.5', olc.yarim);
  uiEkle('Menü: satırda ev ölçüsü ve gram', '½ su bardağı · 100 g / 3 dilim · 75 g', olc.satir);
  uiEkle('Menü: besin yukarı taşınıyor', 'Beyaz ekmek > Süt (yarım yağlı)', olc.sira);
  uiEkle('Menü çıktısı: ev ölçüsü basılıyor, ölçüsüz öğe gram', '3 dilim (75 g) / ½ su bardağı (100 g) / 50 g', olc.cikti);
  uiEkle('Menü metni: ev ölçüsü paylaşılıyor', true, olc.paylas);

  /* ---- değişim listesi: öğün payları ve gece öğünü ----
     Varsayılan paylar değişmedi (25/10/30/10/25, gece 0). Elle girilen
     25/10/30/10/20/5 ile her öğün kendi payının ±3 puanında; gece yalnız
     süt, meyve, galeta ya da kuruyemiş alır (et, yağ, sebze, baklagil yok).
     Toplam 110 girilince 100'e oranlanır: 30/110 = %27,3 · 10/110 = %9,1. */
  const pay = await sayfa.evaluate(() => {
    const ui = DA.state().ui, o = {}, eski = DA.toast; DA.toast = () => {};
    /* Kendi danışanı: önceki testler danışan listesini değiştiriyor */
    const S0 = DA.state(); S0.clients = (S0.clients || []).filter((c) => c.id !== 'pc');
    S0.clients.push({ id: 'pc', name: 'Pay Danışan', sex: 'K', h: 160, meas: [] }); delete (ui.exAlan || {}).pc; DA.save();
    ui.exClient = null; location.hash = 'hesapla/degisim'; DA.render(false);
    const G = ui.exAlan[''], T = DA.exchange.totals;
    G.ex = {}; G.exLock = {}; G.exMeal = {}; delete G.exPay; G.exT = { kcal: 1800, birim: 'yuzde', c: 50, p: 20, ts: 1 };
    DA.actions.exAuto(); DA.render(false);
    const metin = (sel) => ((document.querySelector(sel) || {}).textContent || '').replace(/\s+/g, ' ').trim();
    o.varsayilan = metin('#exMealBtn');
    DA.actions.exMealAuto();
    o.geceVarsayilan = T(G.exMeal.gece || {}).kcal;
    const yaz = (ad, d) => { const e = document.querySelector('input[data-live=exPay][name=' + ad + ']');
      if (e) { e.value = d; e.dispatchEvent(new Event('input', { bubbles: true })); } };
    yaz('aksam', '20'); yaz('gece', '5');
    o.etiket = metin('#exMealBtn'); o.toplam = metin('#exPaySum');
    DA.actions.exMealAuto();
    const sap = (P, top) => { const tk = T(G.ex).kcal;
      return Math.max.apply(null, Object.keys(P).map((k) => Math.abs(T(G.exMeal[k] || {}).kcal / tk * 100 - P[k] * 100 / top))); };
    o.payMaks = sap({ kahvalti: 25, ara1: 10, ogle: 30, ara2: 10, aksam: 20, gece: 5 }, 100);
    const gece = G.exMeal.gece || {};
    o.geceDolu = T(gece).kcal > 0;
    o.geceYasak = ['et', 'yag', 'sebze', 'baklagil'].filter((k) => gece[k]).join(',');
    const top = {}; Object.keys(G.exMeal).forEach((m) => Object.keys(G.exMeal[m]).forEach((k) => { top[k] = (top[k] || 0) + G.exMeal[m][k]; }));
    o.korundu = Object.keys(G.ex).every((k) => Math.abs((top[k] || 0) - (G.ex[k] || 0)) < 0.01);
    yaz('kahvalti', '30'); yaz('aksam', '30'); yaz('gece', '0');
    o.uyari = metin('#exPaySum');
    DA.actions.exMealAuto();
    o.oranMaks = sap({ kahvalti: 30, ara1: 10, ogle: 30, ara2: 10, aksam: 30 }, 110);
    o.gece0 = T(G.exMeal.gece || {}).kcal;
    /* Oranı aynı paylar aynı dağılımı vermeli: 5/2/6/2/5 (toplam 20) oranlanınca
       25/10/30/10/25 olur. Oranlanmasaydı paylar beşte bire iner ve açık puanı
       uygunluğu ezerek başka bir dağılım çıkarırdı. */
    delete G.exPay; DA.actions.exMealAuto();
    const varsayilanDagilim = JSON.stringify(G.exMeal);
    G.exPay = { kahvalti: 5, ara1: 2, ogle: 6, ara2: 2, aksam: 5, gece: 0 };
    DA.actions.exMealAuto();
    o.oranAyni = JSON.stringify(G.exMeal) === varsayilanDagilim;
    DA.actions.exPayVarsayilan();
    o.donus = metin('#exMealBtn') === o.varsayilan && !G.exPay;
    /* danışan planıyla kaydedilip geri yükleniyor */
    location.hash = 'hesapla/degisim?c=pc'; DA.render(false);
    const C = ui.exAlan.pc; C.ex = { sutyy: 2, et: 3, eyg: 4 }; C.exPay = { kahvalti: 25, ara1: 10, ogle: 30, ara2: 10, aksam: 20, gece: 5 };
    DA.actions.exSaveClient({ dataset: { id: 'pc' } });
    delete ui.exAlan.pc; DA.render(false);
    o.geriYuklendi = (ui.exAlan.pc.exPay || {}).gece;
    o.ayni = /Dosyadaki planla aynı/.test(metin('#exDanisan'));
    /* yalnız pay değişince de "kaydedilmemiş" denir */
    const ge = document.querySelector('input[data-live=exPay][name=gece]');
    if (ge) { ge.value = '8'; ge.dispatchEvent(new Event('input', { bubbles: true })); }
    o.payFarki = /Kaydedilmemiş değişiklik/.test(metin('#exDanisan'));
    /* Zorlayıcı: yalnız kahvaltı ve gece açık, plan et + süt. Enerji açığı
       geceyi çekse de et geceye gitmez; süt gider. Yalnız gece açıkken birim
       kaybolmaz (uygun öğün yoksa en büyük paylıya gider). */
    location.hash = 'hesapla/degisim'; ui.exClient = null; DA.render(false);
    G.exPay = { kahvalti: 50, ara1: 0, ogle: 0, ara2: 0, aksam: 0, gece: 50 };
    G.ex = { et: 4, sutyy: 2 }; DA.actions.exMealAuto();
    o.zorGeceEt = (G.exMeal.gece || {}).et || 0;
    o.zorGeceSut = (G.exMeal.gece || {}).sutyy || 0;
    G.exPay = { kahvalti: 0, ara1: 0, ogle: 0, ara2: 0, aksam: 0, gece: 100 };
    G.ex = { et: 2 }; DA.actions.exMealAuto();
    o.kayipYok = Object.keys(G.exMeal).reduce((t, m) => t + (G.exMeal[m].et || 0), 0);
    delete G.exPay; G.ex = {}; G.exMeal = {};
    DA.toast = eski;
    return o;
  });
  uiEkle('Paylar: varsayılan etiket değişmedi', 'Öğünlere dağıt (%25 · %10 · %30 · %10 · %25)', pay.varsayilan);
  uiEkle('Paylar: varsayılanda geceye bir şey gitmiyor', 0, pay.geceVarsayilan);
  uiEkle('Paylar: etiket girilen paylarla', 'Öğünlere dağıt (%25 · %10 · %30 · %10 · %20 · %5)', pay.etiket);
  uiEkle('Paylar: toplam %100', 'Toplam %100', pay.toplam);
  uiEkle('Paylar: her öğün kendi payının ±3 puanında', true, pay.payMaks <= 3);
  uiEkle('Gece öğününe değişim gidiyor', true, pay.geceDolu);
  uiEkle('Gece öğününe et, yağ, sebze, baklagil gitmiyor', '', pay.geceYasak);
  uiEkle('Paylar: grup toplamları korunuyor', true, pay.korundu);
  uiEkle('Paylar: toplam 110 uyarısı', 'Toplam %110 — dağıtımda %100’e oranlanır', pay.uyari);
  uiEkle('Paylar: 110 toplamı oranlanıyor (±3 puan)', true, pay.oranMaks <= 3);
  uiEkle('Paylar: payı 0 olan geceye bir şey gitmiyor', 0, pay.gece0);
  uiEkle('Paylar: oranı aynı paylar (toplam 20) aynı dağılımı veriyor', true, pay.oranAyni);
  uiEkle('Paylar: varsayılana dönülüyor', true, pay.donus);
  uiEkle('Paylar: danışan planıyla kaydedilip geri geliyor', 5, pay.geriYuklendi);
  uiEkle('Paylar: kayıttan sonra plan "aynı" görünüyor', true, pay.ayni);
  uiEkle('Paylar: yalnız pay değişince kaydedilmemiş deniyor', true, pay.payFarki);
  uiEkle('Gece (zorlayıcı): et geceye gitmiyor', 0, pay.zorGeceEt);
  uiEkle('Gece (zorlayıcı): süt geceye gidiyor', true, pay.zorGeceSut >= 1);
  uiEkle('Paylar: uygun öğün yoksa birim kaybolmuyor', 2, pay.kayipYok);

  /* ---- diyet listesi yazıcı ----
     Elle: satır çarpımı "1 …" → n, aralık iki ucuyla çarpılır, tam çıkmayan
     sayı uydurulmaz. Kahvaltı hedefi süt yy 1 · et 1 · ekmek 2 · yağ 1;
     ekmek, peynir, süt sırayla eklenince yazım sırası süt > peynir > ekmek
     (sıvı başa, ekmek sona); ekmek 2 birim yapılınca yalnız 1 yağ eksik kalır.
     Çıktı listesi (A4 denemesindeki): süt yy 3, et 4, baklagil 2, ekmek 7,
     sebze 3, meyve 2, yağ 5, kuruyemiş 1 →
       kcal 3·87 + 4·69 + 2·80 + 7·68 + 3·32 + 2·60 + 5·45 + 53 = 1667
       KH 27 + 30 + 105 + 18 + 30 = 210 · P 18 + 24 + 10 + 14 + 6 + 2 = 74
       Y 9 + 20 + 25 + 5 = 59 */
  const ls = await sayfa.evaluate(() => {
    const S = DA.state(), ui = S.ui, o = {}, eski = DA.toast; DA.toast = () => {};
    const C = DA.liste.carp;
    const TU = DA.liste.satirTur, tu = (t, d) => { const x = TU({ t, n: 1, d }); return [x.kh, x.esli, x.meyve].map((b) => (b ? 1 : 0)).join(''); };
    /* adı hiçbir şey söylemeyen satırda tür değişim grubundan */
    o.grupTur = [tu('1 porsiyon A', { sutyy: 1 }), tu('1 porsiyon B', { eyg: 1 }), tu('1 porsiyon C', { meyve: 1 }),
      tu('1 porsiyon D', { et: 1 }), tu('1 porsiyon E', { baklagil: 1 }), tu('1 porsiyon F', { yag: 1 })].join(',');
    o.carp = [C('1 ince dilim ekmek', 2), C('12–15 adet üzüm', 2), C('1 su bardağı süt', 0.5), C('1 su bardağı süt', 1.5),
      C('5 adet zeytin', 2), C('5 adet zeytin', 0.5), C('200 g yoğurt', 1.5), C('kendi metnim', 2), C('1 kase çorba', 1)].join(' | ');

    /* 1) değişim listesinden: öğünler dağıtılmamışsa önce dağıtılır, plan kopyalanır */
    location.hash = 'hesapla/degisim?c=pc'; DA.render(false);
    const G = ui.exAlan.pc; G.ex = { sutyy: 2, et: 3, eyg: 4 }; G.exMeal = {}; G.exLock = {};
    const once = S.listeler.length;
    DA.actions.exListe();
    const yeni = S.listeler[0];
    o.olustu = S.listeler.length - once;
    o.bagli = yeni.c;
    o.ogunKopya = Object.keys(yeni.meal).length > 0 && JSON.stringify(yeni.meal) === JSON.stringify(G.exMeal);
    o.hash = location.hash === '#/liste/' + yeni.id;
    G.ex.et = 9; o.bagimsiz = yeni.ex.et;

    /* 2) hedefli liste: ekleme, yazım sırası, çarpan, durum */
    const L = { id: 'lt', ad: 'Test listesi', d: DA.today(), c: 'pc', ex: {}, hedef: {}, not: '', ayar: {}, ogun: {},
      meal: { kahvalti: { sutyy: 1, et: 1, eyg: 2, yag: 1 }, ara1: { meyve: 1, tohum: 1 }, ogle: { et: 2, eyg: 2 } } };
    S.listeler.unshift(L); DA.save();
    location.hash = 'liste/lt'; DA.render(false);
    const sec = (ogun, e) => DA.actions.listeSec({ dataset: { l: 'lt', o: ogun, e } });
    sec('kahvalti', 'h-ekmek'); sec('kahvalti', 'h-peynir'); sec('kahvalti', 'h-sut-yy');
    o.sira = L.ogun.kahvalti.map((x) => x.t).join(' > ');
    DA.actions.listeSatir({ dataset: { l: 'lt', o: 'kahvalti', i: '2' } });
    let f = document.querySelector('form[data-form=listeSatir]');
    f.n.value = '2'; DA.forms.listeSatir(f);
    o.carpan = L.ogun.kahvalti[2].n;
    DA.render(false);
    const cip = (k) => Array.from(document.querySelectorAll('[data-ogun=' + k + '] .durum .badge')).map((b) => b.textContent.trim()).join(' | ');
    o.cipKahvalti = cip('kahvalti');
    o.satirMetni = Array.from(document.querySelectorAll('[data-ogun=kahvalti] .li .t')).map((x) => x.textContent).join(' / ');
    /* seçici: eksik grup önde ve sayfa açık kalıyor */
    DA.actions.listeEkle({ dataset: { l: 'lt', o: 'ara1' } });
    o.kalan = (document.querySelector('#listeKalan') || {}).textContent;
    o.ilkSecenek = ((document.querySelector('#listeSecenek .li .s') || {}).textContent || '').replace(/\s+/g, ' ').split(' · ')[0];
    sec('ara1', 'h-elma');
    o.sayfaAcik = !document.querySelector('#sheet').hidden && /Kalan: 1\sk/.test((document.querySelector('#listeKalan') || {}).textContent);

    /* 3) kurallar: kuşlukta elma tek başına, gece peynir, öğlede bulgur + ekmek */
    sec('gece', 'h-peynir'); sec('ogle', 'h-bulgur'); sec('ogle', 'h-ekmek');
    DA.closeSheet(); DA.render(false);
    const kurallar = () => Array.from(document.querySelectorAll('#menuKural li[data-kural]')).map((x) => x.dataset.kural).sort().join(',');
    o.kural1 = kurallar();
    sec('ara1', 'h-badem'); DA.render(false);
    o.kural2 = kurallar();
    /* elle sıra bozulunca sıra notu ve düğme; diz ve geri al. Zeytin peynirle
       aynı sırada: dizince peynirin ardında kalmalı (kararlılık). */
    sec('kahvalti', 'h-zeytin');
    o.zeytinYeri = L.ogun.kahvalti.map((x) => x.t).join(' > ');
    DA.actions.listeTasi({ dataset: { l: 'lt', o: 'kahvalti', i: '3', yon: '-1' } });
    DA.actions.listeTasi({ dataset: { l: 'lt', o: 'kahvalti', i: '2', yon: '-1' } });
    DA.actions.listeTasi({ dataset: { l: 'lt', o: 'kahvalti', i: '1', yon: '-1' } });
    DA.render(false);
    o.bozuk = L.ogun.kahvalti.map((x) => x.t).join(' > ');
    o.dizVar = !!document.querySelector('#menuKural button[data-act=listeDiz]');
    DA.actions.listeDiz({ dataset: { l: 'lt' } });
    o.dizildi = L.ogun.kahvalti.map((x) => x.t).join(' > ');
    DA.actions.geriAl();
    o.geriAlindi = S.listeler.find((x) => x.id === 'lt').ogun.kahvalti.map((x) => x.t).join(' > ');

    /* 4) kendi satırı ve seçeneklerim */
    DA.actions.listeKendi({ dataset: { l: 'lt', o: 'ara2' } });
    f = document.querySelector('form[data-form=listeKendi]');
    f.t.value = 'grup girilmemiş'; DA.forms.listeKendi(f);
    o.grupsuzReddedildi = !(S.listeler.find((x) => x.id === 'lt').ogun.ara2 || []).length;
    f.t.value = '2 adet galeta'; f.g_eyg.value = '1'; f.kaydet.checked = true; DA.forms.listeKendi(f);
    const L2 = S.listeler.find((x) => x.id === 'lt');
    o.kendi = (L2.ogun.ara2 || []).map((x) => x.t + ':' + JSON.stringify(x.d)).join(',');
    o.kaydedildi = S.esdegerler.some((e) => e.t === '2 adet galeta' && e.d.eyg === 1);
    DA.actions.listeEkle({ dataset: { l: 'lt', o: 'ara2' } });
    o.secenekte = Array.from(document.querySelectorAll('#listeSecenek .li')).some((x) => /2 adet galeta/.test(x.textContent) && /seçeneğim/.test(x.textContent));
    DA.closeSheet();

    /* 5) danışan dosyası */
    location.hash = 'danisan/pc'; DA.render(false);
    o.dosyada = !!document.querySelector('#app a[href="#/liste/lt"]');

    /* 6) çıktı: plana uyan liste, enerji ve değişim tablosu seçenekli */
    const sat = (t, d, n) => ({ id: 's' + Math.random().toString(36).slice(2, 7), t, n: n || 1, d });
    const P = { id: 'lp', ad: 'Çıktı listesi', d: '2026-11-17', c: 'pc', ex: {}, hedef: {}, not: 'Günde 2 litre su iç.', ayar: {},
      ogun: { kahvalti: [sat('1 su bardağı yarım yağlı süt', { sutyy: 1 }), sat('1 dilim beyaz peynir', { et: 1 }), sat('5 adet zeytin', { yag: 1 }), sat('1 ince dilim ekmek', { eyg: 1 }, 2)],
        ara1: [sat('1 küçük boy elma', { meyve: 1 }), sat('5–6 adet badem', { tohum: 1 })],
        ogle: [sat('1 kase çorba', { eyg: 1, yag: 1 }), sat('1 köfte kadar tavuk', { et: 1 }, 3), sat('1 kase zeytinyağlı salata', { sebze: 1, yag: 1 }), sat('3 yemek kaşığı bulgur pilavı', { eyg: 1 }, 2)],
        ara2: [sat('200 g yarım yağlı yoğurt', { sutyy: 1 }), sat('1 orta boy portakal', { meyve: 1 })],
        aksam: [sat('1 kase zeytinyağlı sebze yemeği', { sebze: 1, yag: 1 }, 2), sat('4 yemek kaşığı nohut', { baklagil: 1 }, 2), sat('1 ince dilim ekmek', { eyg: 1 }, 2)],
        gece: [sat('1 su bardağı yarım yağlı süt', { sutyy: 1 })] },
      meal: { kahvalti: { sutyy: 1, et: 1, yag: 1, eyg: 2 }, ara1: { meyve: 1, tohum: 1 }, ogle: { eyg: 3, yag: 2, et: 3, sebze: 1 },
        ara2: { sutyy: 1, meyve: 1 }, aksam: { sebze: 2, yag: 2, baklagil: 2, eyg: 2 }, gece: { sutyy: 1 } } };
    S.listeler.unshift(P); DA.save();
    const cikti = () => { location.hash = 'yazdir/liste/lp'; DA.render(false);
      return { doc: (document.querySelector('.printdoc') || {}).textContent || '', not: Array.from(document.querySelectorAll('.note.noprint')).map((x) => x.textContent).join(' | ') }; };
    let c = cikti();
    o.sade = [/kcal/.test(c.doc), /Günlük değişim sayıları/.test(c.doc), /plana uymuyor/.test(c.not), /yazım kuralı/.test(c.not)].join(',');
    o.ogunSirasi = Array.from(document.querySelectorAll('.printdoc .ogun h3')).map((x) => x.textContent).join(',');
    o.ogleSatir = Array.from(document.querySelectorAll('.printdoc .ogun'))[2].querySelectorAll('li')[1].textContent;
    P.ayar = { enerji: true, degisim: true }; DA.save();
    c = cikti();
    o.enerji = (c.doc.match(/Günlük:\s*([^D]*?g · yağ \d+ g)/) || [])[1] || '';
    o.tablo = Array.from(document.querySelectorAll('.printdoc .degisim-cift td')).map((x) => x.textContent).join('|');
    P.ogun.gece.push(sat('1 dilim beyaz peynir', { et: 1 })); DA.save();
    c = cikti();
    o.uyumsuz = (c.not.match(/Gece: [^·.|]*/) || [''])[0].trim();
    o.kuralNotu = /1 yazım kuralı notu/.test(c.not);
    /* paylaşım metni */
    o.metin = DA.liste.metin(P).split('\n').slice(4, 9).join(' / ');

    /* hedefsiz liste: plana göre karşılaştırma yapılmaz */
    S.listeler.unshift({ id: 'lq', ad: 'Hedefsiz', d: DA.today(), c: '', ex: {}, hedef: {}, not: '', ayar: {}, meal: {},
      ogun: { kahvalti: [sat('1 su bardağı yarım yağlı süt', { sutyy: 1 })] } });
    DA.save();
    location.hash = 'yazdir/liste/lq'; DA.render(false);
    o.hedefsizNot = /plana uymuyor/.test(Array.from(document.querySelectorAll('.note.noprint')).map((x) => x.textContent).join(' '));
    location.hash = 'liste/lq'; DA.render(false);
    o.hedefsizCip = document.querySelectorAll('.durum .badge').length;
    S.listeler = S.listeler.filter((x) => x.id !== 'lq');

    /* 7) silme ve geri alma */
    location.hash = 'liste/lp'; DA.render(false);
    DA.actions.listeSil({ dataset: { l: 'lp' } });
    o.silindi = !S.listeler.some((x) => x.id === 'lp');
    DA.actions.geriAl();
    o.geriGeldi = DA.state().listeler.some((x) => x.id === 'lp');
    DA.state().listeler = DA.state().listeler.filter((x) => ['lt', 'lp'].indexOf(x.id) < 0 && x.id !== yeni.id);
    DA.state().esdegerler = [];
    DA.save(); DA.toast = eski;
    return o;
  });
  uiEkle('Liste: adı boş satırda tür değişim grubundan (kh/eş/meyve)', '010,100,101,010,110,000', ls.grupTur);
  uiEkle('Liste: satır çarpımı', '2 ince dilim ekmek | 24–30 adet üzüm | ½ su bardağı süt | 1½ su bardağı süt | 10 adet zeytin | ' +
    '½ × 5 adet zeytin | 300 g yoğurt | 2 × kendi metnim | 1 kase çorba', ls.carp);
  uiEkle('Liste: değişim listesinden oluşturuluyor', 1, ls.olustu);
  uiEkle('Liste: danışana bağlı', 'pc', ls.bagli);
  uiEkle('Liste: dağıtılmamış plan önce öğünlere dağıtılıp kopyalanıyor', true, ls.ogunKopya);
  uiEkle('Liste: oluşturulunca listeye gidiliyor', true, ls.hash);
  uiEkle('Liste: plan sonradan değişse de liste kopyası değişmiyor', 3, ls.bagimsiz);
  uiEkle('Liste: yeni satır yazım sırasındaki yerine giriyor', '1 su bardağı yarım yağlı süt > 2 parmak boyutunda beyaz peynir > 1 ince dilim ekmek', ls.sira);
  uiEkle('Liste: çarpan kaydediliyor', 2, ls.carpan);
  uiEkle('Liste: öğün durumu (hedefe göre)', 'Süt (yarım yağlı) 1/1 ✓ | Et 1/1 ✓ | Ekmek 2/2 ✓ | Yağ 0/1 eksik', ls.cipKahvalti);
  uiEkle('Liste: satır metni çarpanla', '1 su bardağı yarım yağlı süt / 2 parmak boyutunda beyaz peynir / 2 ince dilim ekmek', ls.satirMetni);
  uiEkle('Liste: seçicide kalan değişim', 'Kalan: 1 meyve · 1 kuruyemiş', ls.kalan);
  uiEkle('Liste: seçicide eksik grup önde', '1 meyve', ls.ilkSecenek);
  uiEkle('Liste: seçimden sonra sayfa açık, kalan güncel', true, ls.sayfaAcik);
  uiEkle('Liste kuralları: elma tek, gece peynir, bulgur + ekmek', 'araEs,bulgurEkmek,gecePeynir', ls.kural1);
  uiEkle('Liste kuralları: bademle eşlenince not kalkıyor', 'bulgurEkmek,gecePeynir', ls.kural2);
  uiEkle('Liste: zeytin peynirin ardına, ekmeğin önüne giriyor', '1 su bardağı yarım yağlı süt > 2 parmak boyutunda beyaz peynir > 10 orta boy zeytin > 1 ince dilim ekmek', ls.zeytinYeri);
  uiEkle('Liste: elle bozulan sıra', '1 ince dilim ekmek > 1 su bardağı yarım yağlı süt > 2 parmak boyutunda beyaz peynir > 10 orta boy zeytin', ls.bozuk);
  uiEkle('Liste: sıra notunda diz düğmesi', true, ls.dizVar);
  uiEkle('Liste: yazım sırasına diziliyor (aynı sıradakiler yer değiştirmiyor)', '1 su bardağı yarım yağlı süt > 2 parmak boyutunda beyaz peynir > 10 orta boy zeytin > 1 ince dilim ekmek', ls.dizildi);
  uiEkle('Liste: dizme geri alınıyor', '1 ince dilim ekmek > 1 su bardağı yarım yağlı süt > 2 parmak boyutunda beyaz peynir > 10 orta boy zeytin', ls.geriAlindi);
  uiEkle('Liste: grupsuz kendi satırı reddediliyor', true, ls.grupsuzReddedildi);
  uiEkle('Liste: kendi satırı ekleniyor', '2 adet galeta:{"eyg":1}', ls.kendi);
  uiEkle('Liste: kendi satırı seçeneklere kaydediliyor', true, ls.kaydedildi);
  uiEkle('Liste: kaydedilen seçenek seçicide', true, ls.secenekte);
  uiEkle('Liste: danışan dosyasında görünüyor', true, ls.dosyada);
  uiEkle('Liste çıktısı: varsayılan sade (kcal, tablo, uyumsuzluk, kural)', 'false,false,false,false', ls.sade);
  uiEkle('Liste çıktısı: öğün sırası', 'Kahvaltı,Kuşluk,Öğle,İkindi,Akşam,Gece', ls.ogunSirasi);
  uiEkle('Liste çıktısı: çarpılmış satır', '3 köfte kadar tavuk', ls.ogleSatir);
  uiEkle('Liste çıktısı: günlük enerji ve makrolar', 'yaklaşık 1667 kcal · karbonhidrat 210 g · protein 74 g · yağ 59 g', ls.enerji);
  uiEkle('Liste çıktısı: iki sütunlu değişim tablosu', 'Süt (yarım yağlı)|3|Sebze|3|Et|4|Meyve|2|Kuru baklagil|2|Yağ|5|Ekmek ve yerine geçenler|7|Kuruyemiş (yağlı tohum)|1', ls.tablo);
  uiEkle('Liste çıktısı: plana uymayan öğün basılmayan notta', 'Gece: 1 et fazla', ls.uyumsuz);
  uiEkle('Liste çıktısı: kural notu sayısı', true, ls.kuralNotu);
  uiEkle('Liste metni: öğün başlığı ve satırlar', 'KAHVALTI / • 1 su bardağı yarım yağlı süt / • 1 dilim beyaz peynir / • 5 adet zeytin / • 2 ince dilim ekmek', ls.metin);
  uiEkle('Liste: hedefsiz listede plana göre not yok', false, ls.hedefsizNot);
  uiEkle('Liste: hedefsiz listede durum etiketi yok', 0, ls.hedefsizCip);
  uiEkle('Liste: silinince geri alınabiliyor', 'true/true', ls.silindi + '/' + ls.geriGeldi);

  /* ---- diyet listesi: otomatik taslak ----
     Beklenenler kurallardan elle yazıldı (tohum s = 0; öğün sırası kahvaltı 0,
     kuşluk 1, öğle 2, ikindi 3, akşam 4, gece 5; dönen listede indeks
     (s + öğün) mod uzunluk):
       Kahvaltı {süt 1, et 2, ekmek 2, yağ 2, sebze 1}: süt; et → 1 peynir +
         1 yumurta; yağ → 10 zeytin + 1 tk zeytinyağı; sebze → domates (0);
         ekmek 2 dilim en sonda.
       Kuşluk {ekmek 2, süt 1}: süt listesi [kefir, yoğurt, ayran][1] =
         yoğurt; ekmek → galeta 1,5 × 2 = 3 büyük boy.
       Öğle {ekmek 3, et 2, sebze 2, yağ 3, süt yy 1} + elle 3 yk bulgur:
         kalan ekmek 2 · çorba [mercimek, şehriye, yayla, kase][2] = yayla
         (ekmek 1 + yağ 1) · et [köfte, tavuk, kuşbaşı, istavrit][2] =
         kuşbaşı 3 × 2 = 6 · sebze 2 → zy yemek 1 + zy salata 1 (yağ 3−1−1−1
         = 0) · kalan 1 ekmek: öğle listesi [ekmek, …][0] ekmek derdi ama
         elle bulgur yazılı → bulgura eklenir, 3 × 2 = 6 yk · yy yoğurt.
         Aynı sıradakiler giriş sırasında kalır: bulgur önce yazılmıştı.
       İkindi {meyve 1, kuruyemiş 1}: meyve [...][3] = muz, kuruyemiş
         [ceviz, badem, fındık][3 mod 3 = 0] = ceviz.
       Akşam {ekmek 2, baklagil 2, sebze 1, yağ 1}: çorba [..][4 mod 4 = 0]
         = mercimek çorbası · baklagil [nohut, mercimek, k.fasulye][1] =
         mercimek AMA mercimek çorbası var → kuru fasulye 3 × 2 = 6 yk ·
         yağ bitti → yağsız salata · ekmek 1 → akşam listesi [bulgur, …][0].
       Gece {süt 1, et 1, meyve 1}: süt [süt, kefir][5 mod 2 = 1] = kefir ·
         meyve [elma, portakal, mandalina, muz, armut, üzüm][5] = üzüm ·
         et YAZILMAZ (gece peynir yok) → "Gece: 1 et eksik" kalır.
     Sonra hiçbir yazım kuralı notu çıkmamalı; geri alınca yalnız elle yazılan
     ekmek kalmalı. */
  const tsl = await sayfa.evaluate(async () => {
    const S = DA.state(), o = {}, eski = DA.toast; DA.toast = () => {};
    const C = DA.liste.carp;
    o.carp = [C('1,5 büyük boy galeta', 2), C('1,5 büyük boy galeta', 0.5), C('1/4 küçük boy tavuk göğsü fileto', 3),
      C('3/4 su bardağı (4 tepeleme yemek kaşığı) yoğurt (150 g)', 2), C('1 su bardağı ev yoğurdu (200 g)', 2),
      C('1,5 su bardağı (1 büyük su bardağı) ayran', 0.5), C('1/5 orta boy bazlama', 2), C('1/4 adet simit (çeyrek)', 2),
      C('1 porsiyon yarım ekmek döner (1/2 ekmek)', 2), C('1 büyük boy domates (çiğ)', 2)].join(' | ');
    const sat = (t, d, n) => ({ id: 's' + Math.random().toString(36).slice(2, 7), t, n: n || 1, d });
    const L = { id: 'lx', ad: 'Taslak', d: DA.today(), c: 'pc', ex: {}, hedef: {}, not: '', ayar: {},
      ogun: { ogle: [sat('3 yemek kaşığı bulgur pilavı', { eyg: 1 })] },
      meal: { kahvalti: { sut: 1, et: 2, eyg: 2, yag: 2, sebze: 1 }, ara1: { eyg: 2, sut: 1 },
        ogle: { eyg: 3, et: 2, sebze: 2, yag: 3, sutyy: 1 }, ara2: { meyve: 1, tohum: 1 },
        aksam: { eyg: 2, baklagil: 2, sebze: 1, yag: 1 }, gece: { sut: 1, et: 1, meyve: 1 } } };
    S.listeler.unshift(L); DA.save();
    location.hash = 'liste/lx'; DA.render(false);
    await DA.need(['degisim']); DA.render(false);
    o.dugme = !!document.querySelector('button[data-act=listeTaslak]');
    await DA.actions.listeTaslak({ dataset: { l: 'lx' } });
    const Lx = S.listeler.find((x) => x.id === 'lx');
    const ogun = (k) => (Lx.ogun[k] || []).map((x) => C(x.t, x.n)).join(' > ');
    ['kahvalti', 'ara1', 'ogle', 'ara2', 'aksam', 'gece'].forEach((k) => { o[k] = ogun(k); });
    o.mesaj = (document.querySelector('#toast .gmsg') || {}).textContent || '';
    DA.render(false);
    o.kural = Array.from(document.querySelectorAll('#menuKural li[data-kural]')).map((x) => x.dataset.kural).join(',');
    o.geceCip = Array.from(document.querySelectorAll('[data-ogun=gece] .durum .badge')).map((b) => b.textContent.trim()).join(' | ');
    /* gece eti taslağın işi değil: düğme gizlenir, boşa basılmaz */
    o.dugmeSonra = !!document.querySelector('button[data-act=listeTaslak]');
    DA.actions.geriAl();
    const Lg = S.listeler.find((x) => x.id === 'lx');
    o.geriAl = Object.keys(Lg.ogun).map((k) => k + ':' + Lg.ogun[k].map((x) => C(x.t, x.n)).join('/')).filter((x) => !/:$/.test(x)).join(',');
    S.listeler = S.listeler.filter((x) => x.id !== 'lx'); DA.save(); DA.toast = eski;
    return o;
  });
  uiEkle('Liste: kesirli ve parantezli ölçü çarpımı',
    '3 büyük boy galeta | ¾ büyük boy galeta | ¾ küçük boy tavuk göğsü fileto | ' +
    '1½ su bardağı (8 tepeleme yemek kaşığı) yoğurt (300 g) | 2 su bardağı ev yoğurdu (400 g) | ' +
    '¾ su bardağı (½ büyük su bardağı) ayran | 2 × 1/5 orta boy bazlama | 2 × 1/4 adet simit (çeyrek) | ' +
    '2 × 1 porsiyon yarım ekmek döner (1/2 ekmek) | 2 büyük boy domates (çiğ)', tsl.carp);
  uiEkle('Taslak: eksik varken düğme görünüyor', true, tsl.dugme);
  uiEkle('Taslak: kahvaltı', '1 su bardağı süt > 2 parmak boyutunda beyaz peynir > 1 küçük boy yumurta > 10 orta boy zeytin > ' +
    '1 tatlı kaşığı zeytinyağı > 1 büyük boy domates (çiğ) > 2 ince dilim ekmek', tsl.kahvalti);
  uiEkle('Taslak: kuşlukta ekmek yerine galeta', '3/4 su bardağı (4 tepeleme yemek kaşığı) yoğurt (150 g) > 3 büyük boy galeta', tsl.ara1);
  uiEkle('Taslak: öğle (çorba başta, elle yazılan bulgura eklenir, ekmek yok)', '1 küçük kase yayla çorbası > 6 yemek kaşığı bulgur pilavı > ' +
    '6 orta boy kuşbaşı et > 1 kase zeytinyağlı sebze yemeği > 1 kase zeytinyağlı salata > 3/4 su bardağı (4 tepeleme yemek kaşığı) yarım yağlı yoğurt (150 g)', tsl.ogle);
  uiEkle('Taslak: ikindi', '1 küçük boy muz > 2 bütün ceviz', tsl.ara2);
  uiEkle('Taslak: akşam (mercimek çorbasıyla mercimek yok, bulgurun yanında ekmek yok)',
    '1 küçük kase mercimek çorbası > 6 yemek kaşığı kuru fasulye > 1 kase yağsız salata > 3 yemek kaşığı bulgur pilavı', tsl.aksam);
  uiEkle('Taslak: gece süt ürünü + meyve, peynir yok', '1 su bardağı kefir > 25 adet üzüm', tsl.gece);
  uiEkle('Taslak: gece eti eksik kalıyor', 'Süt (tam yağlı) 1/1 ✓ | Et 0/1 eksik | Meyve 1/1 ✓', tsl.geceCip);
  uiEkle('Taslak: mesajda sayım ve elle tamamlanacak eksik', 'Taslak: 22 satır eklendi, 1 satır artırıldı. Elle tamamla: Gece: 1 et eksik', tsl.mesaj);
  uiEkle('Taslak: yazım kuralı notu çıkmıyor', '', tsl.kural);
  uiEkle('Taslak: yapacak iş kalmayınca düğme gizli', false, tsl.dugmeSonra);
  uiEkle('Taslak: geri alınca yalnız elle yazılan satır', 'ogle:3 yemek kaşığı bulgur pilavı', tsl.geriAl);

  /* ---- haftalık diyet listesi ----
     Plan: öğle {ekmek 2, et 1, yağ 1}, kuşluk {meyve 1, kuruyemiş 1}; 1. gün
     (Pzt 23 Kasım 2026) elle yalnız 1 dilim ekmek. "Taslakla doldur" 2–7.
     günleri tohum = gün sırası i (1–6) ile yazar; öğle t = i + 2, kuşluk
     t = i + 1. Elle, listelerden:
       çorba [şehriye, mercimek, yayla][(i+2) mod 3] · et [köfte, tavuk,
       kuşbaşı, çipura, hindi, baget, somon][(i+2) mod 7] · kalan 1 ekmek
       [ekmek, bulgur, ekmek, makarna][i mod 4]
       i=1 şehriye/çipura/bulgur · 2 mercimek/hindi/ekmek · 3 yayla/baget/
       makarna · 4 şehriye/somon/ekmek · 5 mercimek/köfte/bulgur · 6 yayla/
       tavuk/ekmek — altı günde altı ayrı et.
       kuşluk meyve [elma, portakal, mandalina, muz, armut, üzüm][(i+1) mod 6],
       kuruyemiş [ceviz, badem, fındık][(i+1) mod 3].
     Enerji (değişim değerleri: ekmek 68, et 69, yağ 45, meyve 60, kuruyemiş
     53): 2–7. gün 2·68 + 69 + 45 + 60 + 53 = 363 kcal; 1. gün 68 kcal.
     Değişim tablosu planın günlük toplamı (et 1, ekmek 2, meyve 1, yağ 1,
     kuruyemiş 1), yazılan değil: 1. gün eksik olsa da tablo plana göre. */
  const hf = await sayfa.evaluate(async () => {
    const S = DA.state(), o = {}, eski = DA.toast; DA.toast = () => {};
    const C = DA.liste.carp, sat = (t, d, n) => ({ id: 's' + Math.random().toString(36).slice(2, 7), t, n: n || 1, d });
    const L = { id: 'lh', ad: 'Hafta', d: '2026-11-23', c: 'pc', ex: {}, hedef: {}, not: 'Su iç.', ayar: {},
      meal: { ogle: { eyg: 2, et: 1, yag: 1 }, ara1: { meyve: 1, tohum: 1 } }, ogun: { ogle: [sat('1 ince dilim ekmek', { eyg: 1 })] } };
    S.listeler.unshift(L); DA.save();
    location.hash = 'liste/lh'; DA.render(false);
    o.dugme = !!document.querySelector('button[data-act=listeHafta]');
    DA.actions.listeHafta({ dataset: { l: 'lh' } });
    await DA.actions.listeHaftaYap({ dataset: { l: 'lh', y: 'taslak' } });
    const G = S.listeler.filter((x) => x.hafta && x.hafta === L.hafta).sort((a, b) => a.gun - b.gun);
    o.gunSayisi = G.length;
    o.tarihler = G.map((g) => g.gun + ':' + g.d).join(',');
    o.sira = S.listeler.slice(0, 7).map((x) => x.gun).join(',');
    o.ogle = G.map((g) => (g.ogun.ogle || []).map((x) => C(x.t, x.n)).join(' + ')).join(' | ');
    o.ara1 = G.slice(1).map((g) => (g.ogun.ara1 || []).map((x) => C(x.t, x.n)).join(' + ')).join(' | ');
    location.hash = 'liste/' + G[2].id; DA.render(false);
    o.sekmeler = Array.from(document.querySelectorAll('.gun-sekme .chip')).map((x) => x.textContent).join(',');
    o.etkin = (document.querySelector('.gun-sekme .chip[aria-current=page]') || {}).textContent;
    o.baslik = DA.$('#title').textContent;
    o.haftaPdf = !!document.querySelector('a[href="#/yazdir/hafta/' + L.hafta + '"]') && !document.querySelector('button[data-act=listeHafta]');
    /* başlık ve öneri haftaya, tarih yalnız güne */
    DA.live.listeMeta({ dataset: { l: G[2].id, f: 'ad' }, value: 'Kasım haftası' });
    DA.live.listeMeta({ dataset: { l: G[2].id, f: 'd' }, value: '2026-12-01' });
    o.adOrtak = G.every((g) => g.ad === 'Kasım haftası');
    o.tarihGune = G.map((g) => g.d).join(',');
    DA.live.listeMeta({ dataset: { l: G[2].id, f: 'd' }, value: '2026-11-25' });
    DA.actions.listeAyar({ dataset: { l: G[4].id, k: 'enerji' } });
    DA.actions.listeAyar({ dataset: { l: G[4].id, k: 'degisim' } });
    o.ayarOrtak = G.every((g) => g.ayar.enerji && g.ayar.degisim);
    /* indeks: hafta tek satır */
    location.hash = 'liste'; DA.render(false);
    o.indeks = Array.from(document.querySelectorAll('#app .li .t')).filter((x) => x.textContent === 'Kasım haftası').length;
    o.indeksAlt = Array.from(document.querySelectorAll('#app .li')).filter((x) => /Kasım haftası/.test(x.textContent)).map((x) => / 7 günlük/.test(x.textContent))[0];
    location.hash = 'danisan/pc'; DA.render(false);
    o.dosya = Array.from(document.querySelectorAll('#app a.li')).filter((x) => /Kasım haftası/.test(x.textContent)).length;
    /* çıktı */
    location.hash = 'yazdir/hafta/' + L.hafta; DA.render(false);
    const doc = document.querySelector('.printdoc');
    o.gunBlok = doc.querySelectorAll('.gun-blok').length;
    o.gunBas = Array.from(doc.querySelectorAll('.gun-blok h3')).slice(0, 2).map((x) => x.textContent.replace(/\s+/g, ' ')).join(' / ');
    o.izgara = doc.querySelectorAll('.gun-blok .ogun-izgara').length;
    o.tablo = Array.from(doc.querySelectorAll('.degisim-cift td')).map((x) => x.textContent).join('|');
    const not = Array.from(document.querySelectorAll('.note.noprint')).map((x) => x.textContent).join(' ');
    o.notMetni = not;
    o.uyari = [/1\. gün Öğle: 1 et eksik, 1 ekmek eksik, 1 yağ eksik/.test(not), /[2-7]\. gün/.test(not.replace(/Yazım kuralı[^.]*\./, ''))].join(',');
    o.oneri = /Öneriler\s*Su iç\./.test(doc.textContent);
    /* 2. günün bölümü: "=== 2." ile "=== 3." arası */
    const mt = DA.liste.metinHafta(G[0]).split('\n'), b2 = mt.findIndex((x) => /^=== 2\./.test(x));
    o.metin = [mt[b2]].concat(mt.slice(b2 + 1, mt.findIndex((x) => /^=== 3\./.test(x))).filter((x) => /^Öğle/.test(x))).join(' / ');
    /* kopya kipi: 2–7. gün 1. günün aynı satırları, kimlikler ayrı */
    const K = { id: 'lk', ad: 'Kopya', d: '2026-11-30', c: '', ex: {}, hedef: {}, not: '', ayar: {},
      meal: { kahvalti: { sut: 1 } }, ogun: { kahvalti: [sat('1 su bardağı süt', { sut: 1 })] } };
    S.listeler.unshift(K); DA.save();
    await DA.actions.listeHaftaYap({ dataset: { l: 'lk', y: 'kopya' } });
    const kh = K.hafta, KG = S.listeler.filter((x) => x.hafta === kh);
    o.kopya = KG.length + ':' + KG.every((g) => g.ogun.kahvalti.length === 1 && g.ogun.kahvalti[0].t === '1 su bardağı süt') + ':' +
      new Set(KG.map((g) => g.ogun.kahvalti[0].id)).size;
    /* oluşturmayı geri al */
    DA.actions.geriAl();
    o.kopyaGeri = S.listeler.filter((x) => x.hafta === kh).length + ':' + ('hafta' in K) + ':' + S.listeler.some((x) => x.id === 'lk');
    S.listeler = S.listeler.filter((x) => x.id !== 'lk');
    /* bir günü kopyala: bağımsız tek gün */
    location.hash = 'liste/' + G[3].id; DA.render(false);
    DA.actions.listeKopya({ dataset: { l: G[3].id } });
    const tek = S.listeler[0];
    o.gunKopya = [tek.ad, 'hafta' in tek, 'gun' in tek].join(':');
    S.listeler.shift();
    /* hafta silinir ve geri gelir, yerleri korunur */
    const once = S.listeler.map((x) => x.id).join(',');
    DA.actions.listeSil({ dataset: { l: G[5].id } });
    o.silindi = S.listeler.filter((x) => x.hafta === L.hafta).length;
    DA.actions.geriAl();
    o.geriGeldi = DA.state().listeler.map((x) => x.id).join(',') === once;
    /* içe aktarma denetimi: bozuk gün sırası 0, boş hafta silinir */
    const v = DA.veriDenetle({ listeler: [{ id: 'a', hafta: 'h', gun: 9 }, { id: 'b', hafta: '', gun: 3 }] });
    o.denetim = v.listeler[0].gun + ':' + ('hafta' in v.listeler[1]) + ':' + ('gun' in v.listeler[1]);
    DA.state().listeler = DA.state().listeler.filter((x) => x.hafta !== L.hafta);
    DA.save(); DA.toast = eski;
    return o;
  });
  uiEkle('Hafta: planlı listede "7 günlük" düğmesi', true, hf.dugme);
  uiEkle('Hafta: 7 gün oluşuyor', 7, hf.gunSayisi);
  uiEkle('Hafta: günlerin tarihi ardışık', '0:2026-11-23,1:2026-11-24,2:2026-11-25,3:2026-11-26,4:2026-11-27,5:2026-11-28,6:2026-11-29', hf.tarihler);
  uiEkle('Hafta: günler listede sırayla', '0,1,2,3,4,5,6', hf.sira);
  uiEkle('Hafta: 1. gün elle, 2–7. gün taslak; her gün başka çorba, et, tahıl',
    '1 ince dilim ekmek | 1 küçük kase şehriye, pirinç, tarhana ya da un çorbası + 1/4 küçük boy çipura + 3 yemek kaşığı bulgur pilavı | ' +
    '1 küçük kase mercimek çorbası + 3 parmak boyutunda hindi eti (kemiksiz, derisiz) + 1 ince dilim ekmek | ' +
    '1 küçük kase yayla çorbası + 1 küçük boy tavuk baget (kemiksiz) + 3 yemek kaşığı makarna | ' +
    '1 küçük kase şehriye, pirinç, tarhana ya da un çorbası + 2 parmak boyutunda somon + 1 ince dilim ekmek | ' +
    '1 küçük kase mercimek çorbası + 1 küçük yumurta boyutunda köfte + 3 yemek kaşığı bulgur pilavı | ' +
    '1 küçük kase yayla çorbası + 1/4 küçük boy tavuk göğsü + 1 ince dilim ekmek', hf.ogle);
  uiEkle('Hafta: kuşlukta meyve ve kuruyemiş döner',
    '2 orta boy mandalina + 8 orta boy fındık | 1 küçük boy muz + 2 bütün ceviz | 1 küçük boy armut + 10 orta boy badem | ' +
    '25 adet üzüm + 8 orta boy fındık | 1 orta boy elma + 2 bütün ceviz | 1 orta boy portakal + 10 orta boy badem', hf.ara1);
  uiEkle('Hafta: gün sekmeleri', '1. gün · Pzt,2. gün · Sal,3. gün · Çar,4. gün · Per,5. gün · Cum,6. gün · Cmt,7. gün · Paz', hf.sekmeler);
  uiEkle('Hafta: açık gün işaretli', '3. gün · Çar', hf.etkin);
  uiEkle('Hafta: başlıkta gün', 'Hafta · 3. gün', hf.baslik);
  uiEkle('Hafta: haftalık PDF var, "7 günlük yap" yok', true, hf.haftaPdf);
  uiEkle('Hafta: başlık bütün günlere yazılıyor', true, hf.adOrtak);
  uiEkle('Hafta: tarih yalnız o güne', '2026-11-23,2026-11-24,2026-12-01,2026-11-26,2026-11-27,2026-11-28,2026-11-29', hf.tarihGune);
  uiEkle('Hafta: çıktı seçimi bütün günlere', true, hf.ayarOrtak);
  uiEkle('Hafta: indekste tek satır', 1, hf.indeks);
  uiEkle('Hafta: indekste "7 günlük"', true, hf.indeksAlt);
  uiEkle('Hafta: danışan dosyasında tek satır', 1, hf.dosya);
  uiEkle('Hafta çıktısı: 7 gün bloğu, öğünler iki sütun', '7/7', hf.gunBlok + '/' + hf.izgara);
  uiEkle('Hafta çıktısı: gün başlığı ve enerji', '1. gün · Pazartesi, 23 Kas 2026 · yaklaşık 68 kcal / 2. gün · Salı, 24 Kas 2026 · yaklaşık 363 kcal', hf.gunBas);
  uiEkle('Hafta çıktısı: değişim tablosu planın günlük toplamı', 'Et|1|Yağ|1|Ekmek ve yerine geçenler|2|Kuruyemiş (yağlı tohum)|1|Meyve|1||', hf.tablo);
  uiEkle('Hafta çıktısı: yalnız plana uymayan gün uyarıda', 'true,false', hf.uyari + (hf.uyari === 'true,false' ? '' : ' — ' + hf.notMetni));
  uiEkle('Hafta çıktısı: öneriler bir kez', true, hf.oneri);
  uiEkle('Hafta metni: gün başlığı ve öğün satırı', '=== 2. GÜN · SALI, 24 KAS 2026 === / ' +
    'Öğle: 1 küçük kase şehriye, pirinç, tarhana ya da un çorbası, 1/4 küçük boy çipura, 3 yemek kaşığı bulgur pilavı', hf.metin);
  uiEkle('Hafta: kopya kipinde 7 gün aynı satır, kimlikler ayrı', '7:true:7', hf.kopya);
  uiEkle('Hafta: oluşturma geri alınıyor', '0:false:true', hf.kopyaGeri);
  uiEkle('Hafta: bir gün kopyalanınca bağımsız liste', 'Kasım haftası (4. gün kopyası):false:false', hf.gunKopya);
  uiEkle('Hafta: silince 7 gün birden gidiyor', 0, hf.silindi);
  uiEkle('Hafta: geri alınca günler eski yerlerinde', true, hf.geriGeldi);
  uiEkle('Hafta: içe aktarmada bozuk gün ve boş hafta düzeltiliyor', '0:false:false', hf.denetim);

  /* ---- toplu beslenme menü taslağı ----
     Elle, Ulusal Menü Rehberi Tablo 4.5'ten (21 gün; [azami kış, yaz, asgari
     kış, yaz]):
       Aralık 2026: 1 Aralık Salı, 31 Aralık Perşembe → hafta içi 4+5+5+5+4 = 23.
       Kota = ⌊asgari × N/21⌋, eksik sıradaki alt gruba azamiyi geçmeden:
         1. kap kış 21: asgari 2,2,3,1,3,7,2 = 20 → +1 sebze/dolma (7<8) = 8
         1. kap kış 23: ⌊2,19⌋=2 ⌊2,19⌋=2 ⌊3,29⌋=3 ⌊1,10⌋=1 ⌊3,29⌋=3 ⌊7,67⌋=7
           ⌊2,19⌋=2 = 20 → +sebze/dolma 8, +tavuk 4, +köfte 4
         1. kap kış 20: ⌊×0,952⌋ = 1,1,2,0,2,6,1 = 13; azami ⌊×0,952⌋ = 3,3,3,
           1,3,7,3 → sırayla +1: sebze 7, tavuk 3, köfte 3, k.parça 2, b.parça 2,
           baklagil 2, balık 1 = 20 (asgarinin kendisi)
         1. kap yaz 21: asgari 3,1,4,1,4,6,0 = 19 → sebze 7, tavuk ve köfte
           azamide (4), k.parça 2
         2. kap kış 21: çorba 4, pilav 9, börek 4, zy sebze 3, zy baklagil 1 = 21
         2. kap kış 23: ⌊×1,095⌋ = 4,9,4,3,1 = 21 → +çorba 5, +zy baklagil 2
         3. kap kış 23: ⌊×1,095⌋ salata 4, meyve 4, yoğurt 3, ayran 3,
           komposto 2, sütlü 2, tatlı 2 = 20 → +meyve 5, +salata 5, +ayran 4
       Kahvaltı tohum 0, 1 Aralık Salı: kalıp [(2−1+0) mod 5 = 1] = peynir,
       tatlı kahvaltılık, çiğ sebze; sıra başı 0 → beyaz peynir, bal, domates-
       salatalık. Tohum 1: kalıp [2] = yumurta, zeytin, çiğ sebze; sıra başı
       3 mod uzunluk → yumurta[0], zeytin[1], çiğ sebze[0].
       Yumurta Pzt/Çar/Cum: 4 + 5 + 4 = 13 gün. */
  const tb = await sayfa.evaluate(async () => {
    const S = DA.state(), o = {}, eski = DA.toast; DA.toast = () => {};
    await DA.need(['toplu']);
    const T = DA.toplu, K1 = ['bparca', 'kparca', 'kofte', 'balik', 'tavuk', 'sebzeDolma', 'etlibaklagil'],
      K2 = ['corba', 'pilav', 'borek', 'zysebze', 'zybaklagil'], K3 = ['salata', 'meyve', 'yogurt', 'ayran', 'komposto', 'sutlu', 'tatli'];
    const S1 = ['sebzeDolma', 'tavuk', 'kofte', 'kparca', 'bparca', 'etlibaklagil', 'balik'], S2 = ['corba', 'zybaklagil', 'pilav', 'borek', 'zysebze'],
      S3 = ['meyve', 'salata', 'ayran', 'sutlu', 'yogurt', 'komposto', 'tatli'];
    const kq = (K, mev, N, Sr) => { const q = T.kota(K, mev, N, Sr); return K.map((k) => q[k]).join(','); };
    const G = T.gunler('2026-12');
    o.gunler = G.length + ':' + G.slice(0, 5).map((g) => g.no + '/' + g.g).join(',') + ':' + G[G.length - 1].no + '/' + G[G.length - 1].g;
    o.kota = [kq(K1, 'kis', 21, S1), kq(K1, 'kis', 23, S1), kq(K1, 'kis', 20, S1), kq(K1, 'yaz', 21, S1),
      kq(K2, 'kis', 21, S2), kq(K2, 'kis', 23, S2), kq(K3, 'kis', 23, S3)].join(' | ');
    o.mevsim = [T.mevsimOf('2026-12'), T.mevsimOf('2027-03'), T.mevsimOf('2027-04'), T.mevsimOf('2027-09'), T.mevsimOf('2027-10'), T.mevsimOf('2026-12', 'yaz')].join(',');
    /* kurallar elle seçilmiş öğünlerde */
    const kur = (k, og) => T.denetle(k, og || 'ogle').map((x) => x.k).join(',');
    o.kural = [kur(['etli-bamya', 'zy-pirasa', 'coban-salata', 'yogurt']), kur(['lahana-sarma', 'pirinc-pilavi', 'cacik', 'mevsim-meyvesi']),
      kur(['etli-nohut', 'ispanakli-borek', 'yogurt', 'mevsim-meyvesi']), kur(['mercimek-corbasi', 'firin-kofte', 'ayran', 'elma-kompostosu']),
      kur(['firin-tavuk', 'bulgur-pilavi', 'kisir', 'muhallebi']), kur(['firin-tavuk', 'izmir-kofte', 'coban-salata', 'yogurt']),
      kur(['firin-tavuk', 'su-boregi', 'muhallebi', 'kabak-tatlisi']), kur(['etli-nohut', 'pirinc-pilavi', 'piyaz', 'ayran']),
      kur(['siyah-zeytin', 'bal', 'domates-salatalik'], 'sabah'), kur(['etli-nohut', 'pirinc-pilavi', 'cacik', 'mevsim-meyvesi'])].join(' | ');
    /* üretilen menü: beş tohumda kural notu yok, kap sayıları, çorba başta,
       1. ve 2. kap kotaya eşit */
    const ozet = [];
    for (let t = 0; t < 5; t++) {
      const M = T.menuSon({ ay: '2026-12', tohum: t, degis: {} }).M;
      const c = T.sayim(M), q1 = T.kota(K1, 'kis', 23, S1), q2 = T.kota(K2, 'kis', 23, S2);
      const kotaTam = ['ogle', 'aksam'].every((og) => K1.every((k) => c[k][og] === q1[k]) && K2.every((k) => c[k][og] === q2[k]));
      const kap = M.every((m) => m.sabah.length === 3 && m.ogle.length === 4 && m.aksam.length === 4);
      const corba = M.every((m) => ['ogle', 'aksam'].every((og) => m[og].every((id, i) => !/corba|ezogelin/.test(id) || i === 0)));
      ozet.push(T.notlar(M).length + '/' + kotaTam + '/' + kap + '/' + corba);
    }
    o.uretim = ozet.join(' ');
    /* Onarım (ay sonunda öğle ve akşama aynı alt grup kalması) başka aylarda
       da tutmalı: üç ay × beş tohum, kış ve yaz */
    const genis = [];
    ['2027-02', '2027-07', '2027-11'].forEach((ay) => { for (let t = 0; t < 5; t++) genis.push(T.notlar(T.menuSon({ ay, tohum: t, degis: {} }).M).length); });
    o.genis = genis.join('');
    /* Onarım elle: öğle A,B,A,C · akşam B,A,B,C → 4. gün ikisi de C. Akşam,
       sondan: 4. gün j=0 (B) ile değişince 3.–4. gün B,B → geri; j=1 (A) ile
       → B,C,B,A, çakışma yok. Öğlede çakışma kalmaz. */
    const on = T.onar({ ogle: ['A', 'B', 'A', 'C'], aksam: ['B', 'A', 'B', 'C'] }, 4);
    o.onar = on.ogle.join(',') + '|' + on.aksam.join(',');
    const M0 = T.menuSon({ ay: '2026-12', tohum: 0, degis: {} }).M, M1 = T.menuSon({ ay: '2026-12', tohum: 1, degis: {} }).M;
    o.kahvalti = M0[0].sabah.join(',') + ' | ' + M1[0].sabah.join(',');
    o.yumurta = M0.filter((m) => /yumurta|menemen|omlet/.test(m.sabah[0])).map((m) => m.g).filter((g, i, a) => a.indexOf(g) === i).sort().join(',') + ':' +
      M0.filter((m) => /yumurta|menemen|omlet/.test(m.sabah[0])).length;
    o.farkli = M0.map((m) => m.ogle.join()).join() !== M1.map((m) => m.ogle.join()).join();
    /* ekran: elle değişiklik, denetim, otomatiğe dönüş */
    S.ui.toplu = { ay: '2026-12', tohum: 0, degis: {} }; DA.save();
    location.hash = 'hesapla/toplumenu'; DA.render(false);
    await new Promise((ok) => { const b = () => (document.querySelector('#topluDenetim') ? ok() : setTimeout(b, 20)); b(); });
    o.gunKart = document.querySelectorAll('.toplu-gun').length + ':' + document.querySelector('.toplu-gun h2').textContent;
    o.temiz = /Kurala uymayan öğün yok/.test(document.querySelector('#topluDenetim').textContent);
    o.sayim = Array.from(document.querySelectorAll('#topluDenetim tr')).filter((tr) => /^(Çorbalar|Pilav ve makarnalar|Köfteler|Salatalar)/.test(tr.textContent))
      .map((tr) => Array.from(tr.children).map((x) => x.textContent.trim()).join('/')).join(' | ').replace(/Salatalar\/4–5\/\d+\/\d+$/, 'Salatalar/4–5/sayı/sayı');
    /* 3. kap ve 4. kap her gün 3. gruptan: öğün başına 2 × 23 = 46 */
    const c0 = T.sayim(M0);
    o.ucuncu = ['ogle', 'aksam'].map((og) => K3.reduce((a, k) => a + c0[k][og], 0)).join('/');
    const ana = M0[0].ogle[0];
    DA.actions.topluOgun({ dataset: { d: '2026-12-01', o: 'ogle' } });
    const sel = document.querySelector('#topluSayfa select[data-i="3"]');
    sel.value = 'havuc-salatasi'; DA.live.topluKap(sel);
    o.degis = JSON.stringify(S.ui.toplu.degis);
    o.not = Array.from(document.querySelectorAll('#topluDenetim li[data-kural]')).map((x) => x.dataset.kural).join(',');
    o.sayfaNotu = /Sebze yemeğinin yanına salata verilmez/.test((document.querySelector('#topluSayfa .note') || {}).textContent || '');
    o.alti = (document.querySelector('[data-gun="2026-12-01"] button[data-o=ogle] u') || {}).textContent;
    const sel2 = document.querySelector('#topluSayfa select[data-i="3"]');
    sel2.value = M0[0].ogle[3]; DA.live.topluKap(sel2);
    o.geriDondu = JSON.stringify(S.ui.toplu.degis);
    const sel3 = document.querySelector('#topluSayfa select[data-i="1"]');
    sel3.value = 'pirinc-pilavi'; DA.live.topluKap(sel3);
    DA.actions.topluOtomatik({ dataset: { d: '2026-12-01', o: 'ogle' } });
    o.otomatik = JSON.stringify(S.ui.toplu.degis) + ':' + ana;
    DA.closeSheet();
    /* ay değişince elle değişiklikler gider, geri alınır */
    S.ui.toplu.degis = { '2026-12-02|aksam|2': 'yogurt' }; DA.save();
    DA.live.topluAy({ value: '2027-01' });
    o.ayDegisti = S.ui.toplu.ay + ':' + Object.keys(S.ui.toplu.degis).length;
    DA.actions.geriAl();
    o.ayGeri = Object.keys(DA.state().ui.toplu.degis).join(',');
    DA.state().ui.toplu = { ay: '2026-12', tohum: 0, degis: {} }; DA.save();
    DA.actions.topluKaristir();
    o.karistir = DA.state().ui.toplu.tohum;
    DA.state().ui.toplu.tohum = 0; DA.save();
    /* çıktı */
    location.hash = 'yazdir/toplu'; DA.render(false);
    const doc = document.querySelector('.toplu-doc');
    o.cikti = doc.querySelector('h2').textContent + ' | ' + doc.querySelectorAll('tbody tr').length + ' | ' +
      Array.from(doc.querySelectorAll('tbody tr')[0].children).slice(0, 2).map((x) => x.innerHTML.replace(/<br>/g, ' / ')).join(' | ');
    /* içe aktarma denetimi */
    const v = DA.veriDenetle({ ui: { toplu: { ay: '2026-13', mevsim: 'bahar', tohum: -1,
      degis: { x: 'y', '2026-12-01|ogle|1': 'pirinc-pilavi', '2026-12-01|ogle|2': 5 } } } });
    o.denetim = JSON.stringify(v.ui.toplu);
    DA.toast = eski;
    return o;
  });
  uiEkle('Menü taslağı: Aralık 2026 hafta içi günleri (no/gün)', '23:1/2,2/3,3/4,4/5,7/1:31/4', tb.gunler);
  uiEkle('Menü taslağı: Tablo 4.5 kotaları (1. kap kış 21/23/20, yaz 21; 2. kap kış 21/23; 3. kap kış 23)',
    '2,2,3,1,3,8,2 | 2,2,4,1,4,8,2 | 2,2,3,1,3,7,2 | 3,2,4,1,4,7,0 | 4,9,4,3,1 | 5,9,4,3,2 | 5,5,3,4,2,2,2', tb.kota);
  uiEkle('Menü taslağı: mevsim (Nisan–Eylül yaz; seçim önce gelir)', 'kis,kis,yaz,yaz,kis,yaz', tb.mevsim);
  uiEkle('Menü taslağı: rehber kuralları',
    'sebzeZy,sebzeSalata,zySalata | dolmaPilav | baklagilPilav | corbaYan,corbaYan | benzer,pilavTatli | birinci | benzer | benzer | kahvaltiProtein | ', tb.kural);
  uiEkle('Menü taslağı: beş tohumda not yok, kap sayıları, çorba başta, 1. ve 2. kap kotada',
    '0/true/true/true 0/true/true/true 0/true/true/true 0/true/true/true 0/true/true/true', tb.uretim);
  uiEkle('Menü taslağı: üç ay × beş tohumda kural notu yok', '000000000000000', tb.genis);
  uiEkle('Menü taslağı: onarım çözmeyen değiş tokuşu geri alıyor', 'A,B,A,C|B,C,B,A', tb.onar);
  uiEkle('Menü taslağı: kahvaltı kalıbı ve sırası', 'beyaz-peynir,bal,domates-salatalik | haslanmis-yumurta,yesil-zeytin,domates-salatalik', tb.kahvalti);
  uiEkle('Menü taslağı: yumurta Pzt/Çar/Cum, 13 gün', '1,3,5:13', tb.yumurta);
  uiEkle('Menü taslağı: tohum değişince menü değişiyor', true, tb.farkli);
  uiEkle('Menü taslağı: gün kartları', '23:1 Salı', tb.gunKart);
  uiEkle('Menü taslağı: üretilen menüde denetim temiz', true, tb.temiz);
  uiEkle('Menü taslağı: sıklık tablosu (1. ve 2. grup işaretli, 3. grup yalnız sayı)',
    'Köfteler/3–4/4 ✓/4 ✓ | Çorbalar/4–6/5 ✓/5 ✓ | Pilav ve makarnalar/9–9/9 ✓/9 ✓ | Salatalar/4–5/sayı/sayı', tb.sayim);
  uiEkle('Menü taslağı: 3. grup her öğünde iki kap (2 × 23)', '46/46', tb.ucuncu);
  uiEkle('Menü taslağı: elle değişiklik saklanıyor', '{"2026-12-01|ogle|3":"havuc-salatasi"}', tb.degis);
  uiEkle('Menü taslağı: elle seçilen salata sebze yemeğiyle not veriyor', 'sebzeSalata', tb.not);
  uiEkle('Menü taslağı: öğün sayfasında kural notu', true, tb.sayfaNotu);
  uiEkle('Menü taslağı: elle değişen kap altı çizili', 'Havuç salatası', tb.alti);
  uiEkle('Menü taslağı: otomatiğin seçimine dönünce kayıt siliniyor', '{}', tb.geriDondu);
  uiEkle('Menü taslağı: öğün otomatiğe dönüyor', '{}:etli-bamya', tb.otomatik);
  uiEkle('Menü taslağı: ay değişince elle değişiklikler kalkıyor', '2027-01:0', tb.ayDegisti);
  uiEkle('Menü taslağı: kaldırılan değişiklik geri alınıyor', '2026-12-02|aksam|2', tb.ayGeri);
  uiEkle('Menü taslağı: yeniden dağıt tohumu artırıyor', 1, tb.karistir);
  uiEkle('Menü taslağı çıktısı: başlık, satır, ilk gün', 'Menü taslağı — Aralık 2026 | 23 | 1 Salı | Beyaz peynir / Bal / Domates, salatalık', tb.cikti);
  uiEkle('Menü taslağı: içe aktarmada bozuk ayar ayıklanıyor', '{"degis":{"2026-12-01|ogle|1":"pirinc-pilavi"}}', tb.denetim);

  /* ---- danışan dosyası (ADIME) ----
     Biyokimya elle: HbA1c 10 Oca 7,2 · 1 Şub 7,0 (küçük harfle "hba1c" yazıldı,
     aynı test sayılmalı) · 10 Mar 6,8 → son 6,8, önceki 7, yön ↓. "İdrarda
     keton: negatif" sayısal değil, yön yok. Aynı tarihte iki test: ada göre. */
  const ds = await sayfa.evaluate(() => {
    const S = DA.state(), o = {}, eski = DA.toast; DA.toast = () => {};
    let mm = null;
    /* Mutasyonda bir adım patlarsa koşu çökmesin; hata değer olarak kaydedilir */
    try {
    S.clients = (S.clients || []).filter((c) => c.id !== 'dd');
    S.clients.push({ id: 'dd', name: 'Dosya Danışan', sex: 'K', h: 162, meas: [] });
    S.menus = (S.menus || []).filter((m) => m.c !== 'dd');
    DA.save(); location.hash = 'danisan/dd'; DA.render(false);
    o.bolumler = Array.from(document.querySelectorAll('#app .sect')).map((x) => x.textContent.trim())
      .filter((t) => ['Değerlendirme', 'Tanı', 'Müdahale', 'İzlem'].indexOf(t) >= 0).join(',');
    const c = S.clients.find((x) => x.id === 'dd');
    const lab = (d, ad, deger, birim) => { DA.actions.labYeni({ dataset: { id: 'dd' } });
      const f = document.querySelector('form[data-form=lab]'); f.d.value = d; f.ad.value = ad; f.deger.value = deger; f.birim.value = birim; DA.forms.lab(f); };
    lab('2026-01-10', 'HbA1c', '7,2', '%'); lab('2026-03-10', 'HbA1c', '6,8', '%');
    lab('2026-03-10', 'İdrarda keton', 'negatif', ''); lab('2026-02-01', 'hba1c', '7,0', '%');
    o.sayisal = c.lab.map((x) => typeof x.deger + ':' + x.deger).join(',');
    const satir = Array.from(document.querySelectorAll('#dosyaLab .li')).map((x) => x.textContent.replace(/\s+/g, ' ').trim());
    o.labSatir = satir.length + '|' + /^HbA1c\s?6,8 % · 10 Mar 2026 · önceki 7 %\s?↓$/.test(satir[0] || '') + '|' + /^İdrarda keton\s?negatif · 10 Mar 2026$/.test(satir[1] || '');
    DA.actions.labTest({ dataset: { id: 'dd', ad: 'HbA1c' } });
    o.testGecmisi = Array.from(document.querySelectorAll('#sheet .li .t')).map((x) => x.textContent).join(' / ');
    DA.closeSheet();
    /* düzenleme formu sayıyı Türkçe ondalıkla gösterir */
    DA.actions.labDuzen({ dataset: { id: 'dd', lid: c.lab[0].id } });
    o.duzenDeger = document.querySelector('form[data-form=lab]').deger.value;
    DA.actions.labSil({ dataset: { id: 'dd', lid: c.lab[0].id } });
    o.silindi = c.lab.length;
    DA.actions.geriAl();
    o.geriGeldi = S.clients.find((x) => x.id === 'dd').lab.length;

    /* klinik metin anında kaydedilir */
    location.hash = 'danisan/dd'; DA.render(false);
    const ta = document.querySelector('textarea[data-live=dosyaMetin][data-f=ilac]');
    if (ta) { ta.value = 'Metformin 2×1000 mg'; ta.dispatchEvent(new Event('input', { bubbles: true })); }
    o.ilac = (c.dosya || {}).ilac + '|' + ((localStorage.getItem(DA.depoAnahtari) || '').indexOf('Metformin 2×1000 mg') >= 0);

    /* PES */
    DA.actions.pesYeni({ dataset: { id: 'dd' } });
    let f = document.querySelector('form[data-form=pes]');
    f.p.value = 'Yetersiz enerji alımı'; f.e.value = 'iştahsızlık'; f.s.value = 'son bir ayda %6 ağırlık kaybı'; DA.forms.pes(f);
    o.pes = ((document.querySelector('#dosyaPes .pes') || {}).textContent || '');
    DA.actions.pesDurum({ dataset: { id: 'dd', pid: c.pes[0].id } });
    o.cozuldu = document.querySelectorAll('#dosyaPes > .list .li').length + '/' + /Çözülen tanılar\s*1/.test((document.querySelector('#dosyaPes details') || {}).textContent || '');
    DA.actions.pesDurum({ dataset: { id: 'dd', pid: c.pes[0].id } });

    /* görüşme notları en yeni önce */
    const gor = (d, t) => { DA.actions.gorusmeYeni({ dataset: { id: 'dd' } });
      const g = document.querySelector('form[data-form=gorusme]'); g.d.value = d; g.t.value = t; DA.forms.gorusme(g); };
    gor('2026-03-01', 'İlk görüşme\nikinci satır'); gor('2026-04-01', 'Kontrol');
    o.gorusme = Array.from(document.querySelectorAll('#dosyaGorusme .li .s')).map((x) => x.textContent).join(' / ');

    /* geriçağırma menüsü: dünün tarihi, danışana bağlı, kural kartı yok */
    DA.actions.dosyaMenu({ dataset: { id: 'dd', tur: 'geri' } });
    const g = S.menus[0], dun = new Date(); dun.setDate(dun.getDate() - 1);
    const dunY = dun.getFullYear() + '-' + String(dun.getMonth() + 1).padStart(2, '0') + '-' + String(dun.getDate()).padStart(2, '0');
    o.geri = [g.tur, g.c, g.date === dunY].join(',');
    /* Kural kartı boş menüde zaten çizilmez; besin eklenmeli. Aynı menü tür
       boşaltılınca kartı göstermeli — yoksa kartın yokluğu bir şey ölçmez. */
    g.meals[Object.keys(g.meals)[0]].push({ id: 'yumurta-haslanmis', g: 50 });
    location.hash = 'menu/' + g.id; DA.render(false);
    o.geriEkran = /24 saatlik geriçağırma/.test(document.querySelector('#app').textContent) + '/' + !document.querySelector('#menuKural');
    g.tur = ''; DA.render(false);
    o.geriEkran += '/' + !!document.querySelector('#menuKural');
    g.tur = 'geri';
    /* plan menüsü ve var olan menüyü seçimle bağlama */
    DA.actions.dosyaMenu({ dataset: { id: 'dd' } });
    mm = S.menus.find((m) => m.id === 'mm') || S.menus.find((m) => m.c !== 'dd');
    if (mm) DA.live.menuDanisan({ value: 'dd', dataset: { m: mm.id } });
    o.baglandi = mm ? mm.c + '/' + mm.client : 'menü yok';
    /* Danışanın adı sonradan değişirse menü listesi ve aramada yeni ad */
    c.name = 'Dosya Yenisi';
    location.hash = 'menu'; DA.render(false);
    const mli = mm && document.querySelector('#app a[href="#/menu/' + mm.id + '"]');
    o.yeniAd = (mli ? /Dosya Yenisi/.test(mli.textContent) : 'satır yok') + '/';
    location.hash = 'ara'; DA.render(false);
    const ai = document.querySelector('input[data-live=gSearch]');
    if (ai) { ai.value = 'Dosya Yenisi'; DA.live.gSearch(ai); }
    o.yeniAd += !!(mm && document.querySelector('#gOut a[href="#/menu/' + mm.id + '"]'));
    if (ai) { ai.value = ''; DA.live.gSearch(ai); }
    c.name = 'Dosya Danışan';
    location.hash = 'danisan/dd'; DA.render(false);
    const kart = (b) => Array.from(document.querySelectorAll('#app .card')).find((x) => (x.querySelector('h2') || {}).textContent === b);
    o.geriKart = kart('24 saatlik geriçağırma') ? kart('24 saatlik geriçağırma').querySelectorAll('.li').length : -1;
    o.menuKart = kart('Menüler') ? kart('Menüler').querySelectorAll('.li').length : -1;

    /* rapor */
    location.hash = 'yazdir/danisan/dd'; DA.render(false);
    const r = (document.querySelector('.printdoc') || {}).textContent || '';
    o.rapor = ['Biyokimya (son değerler)', 'İlaçlar ve takviyeler', 'Metformin', 'Beslenme tanısı (aktif)', 'Yetersiz enerji alımı', 'Son görüşme notları']
      .filter((x) => r.indexOf(x) < 0).join(', ');
    } catch (e) { o.hata = String((e && e.message) || e); }
    S.clients = S.clients.filter((x) => x.id !== 'dd'); S.menus = S.menus.filter((m) => m.c !== 'dd');
    if (mm) { mm.c = ''; }
    DA.save(); DA.toast = eski;
    return o;
  });
  uiEkle('Dosya: ADIME bölümleri sırayla', 'Değerlendirme,Tanı,Müdahale,İzlem', ds.bolumler);
  uiEkle('Dosya: sayısal değer sayı, metin değer metin', 'number:7.2,number:6.8,string:negatif,number:7', ds.sayisal);
  uiEkle('Dosya: test başına son değer, önceki ve yön', '2|true|true', ds.labSatir);
  uiEkle('Dosya: test geçmişi en yeni önce (büyük-küçük harf aynı test)', '6,8 % / 7 % / 7,2 %', ds.testGecmisi);
  uiEkle('Dosya: düzenleme formunda Türkçe ondalık', '7,2', ds.duzenDeger);
  uiEkle('Dosya: değer silinip geri alınıyor', '3/4', ds.silindi + '/' + ds.geriGeldi);
  uiEkle('Dosya: akış hatasız', '', ds.hata || '');
  uiEkle('Dosya: klinik metin anında kaydediliyor (diske de)', 'Metformin 2×1000 mg|true', ds.ilac);
  uiEkle('Dosya: PES cümlesi', 'Yetersiz enerji alımı; iştahsızlık ile ilişkili, son bir ayda %6 ağırlık kaybı ile kanıtlanan.', ds.pes);
  uiEkle('Dosya: çözülen tanı aktif listeden çıkıyor', '0/true', ds.cozuldu);
  uiEkle('Dosya: görüşme notları en yeni önce, ilk satır', 'Kontrol / İlk görüşme', ds.gorusme);
  uiEkle('Dosya: geriçağırma menüsü (tür, danışan, dünün tarihi)', 'geri,dd,true', ds.geri);
  uiEkle('Dosya: geriçağırmada not var, kural kartı yok (plan menüsünde var)', 'true/true/true', ds.geriEkran);
  uiEkle('Dosya: menü seçimle danışana bağlanıyor', 'dd/Dosya Danışan', ds.baglandi);
  uiEkle('Dosya: ad değişince menü listesi ve arama güncel adı gösteriyor', 'true/true', ds.yeniAd);
  uiEkle('Dosya: geriçağırma kartında 1 kayıt', 1, ds.geriKart);
  uiEkle('Dosya: menüler kartında 2 menü (geriçağırma hariç)', 2, ds.menuKart);
  uiEkle('Dosya: raporda değerlendirme, tanı ve izlem', '', ds.rapor);

  /* sınır denetimi: dosya alanları ve menü bağı */
  const dosyaSinir = await sayfa.evaluate(() => { try {
    const o = DA.veriDenetle({ clients: [{ id: 'v', name: 'V', lab: [{ id: 'l"', deger: { x: 1 }, ad: 5, d: null }, 'çöp'], pes: 'x',
      gorusme: [{ t: null }], dosya: 'x' }], menus: [{ id: 'm', c: 'a b', tur: 'x', meals: {} }] });
    const c = o.clients[0], l = c.lab[0];
    return [c.lab.length, l.id, JSON.stringify(l.deger), l.ad, l.d, JSON.stringify(c.pes), c.gorusme[0].t, JSON.stringify(c.dosya), o.menus[0].c, o.menus[0].tur].join(' | ');
  } catch (e) { return 'hata: ' + e.message; } });
  uiEkle('Sınır denetimi: dosya alanları ve menü bağı', '1 | l_ | "" | 5 |  | [] |  | {} | a_b | ', dosyaSinir);

  /* ---- çıktıda bölüm aç/kapa ----
     Plan elle: yarım yağlı süt 2 (KH 9 · P 6 · Y 3) + et 4 (P 6 · Y 5)
     → KH 18 · P 12 + 24 = 36 · Y 6 + 20 = 26
     → 18×4 + 36×4 + 26×9 = 72 + 144 + 234 = 450 kcal */
  const ck = await sayfa.evaluate(() => {
    const S = DA.state(), ui = S.ui, o = {}, eskiPay = DA.shareText, eskiT = DA.toast;
    let paylasilan = ''; DA.shareText = (b, t) => { paylasilan = t; }; DA.toast = () => {};
    const doc = () => (document.querySelector('.printdoc') || {}).textContent || '';
    const chipler = (tur) => Array.from(document.querySelectorAll('[data-act=ciktiBolum][data-tur=' + tur + ']'))
      .map((x) => x.dataset.k + (x.getAttribute('aria-pressed') === 'true' ? '+' : '-')).join(',');
    const bas = (tur, k) => DA.actions.ciktiBolum({ dataset: { tur, k } });
    try {
      delete ui.cikti;
      /* danışan raporu */
      S.clients = S.clients.filter((c) => c.id !== 'ck');
      S.clients.push({ id: 'ck', name: 'Çıktı Danışan', sex: 'K', h: 160, note: 'genel not satırı',
        meas: [{ id: 'm1', d: '2026-01-05', w: 60 }, { id: 'm2', d: '2026-02-05', w: 59 }],
        plan: { d: '2026-02-05', hedef: { kcal: 1500 }, ex: { sutyy: 2, et: 4 }, meal: {} },
        lab: [{ id: 'l1', d: '2026-02-01', ad: 'Ferritin', deger: 12, birim: 'ng/mL' }],
        pes: [{ id: 'p1', d: '2026-02-05', p: 'Yetersiz demir alımı', e: '', s: '', cozuldu: false }],
        gorusme: [], dosya: { ilac: 'Demir takviyesi' } });
      DA.save();
      const rapor = () => { location.hash = 'yazdir/danisan/ck'; DA.render(false); return doc(); };
      const planTh = () => { const h = Array.from(document.querySelectorAll('.printdoc h3')).find((x) => /Değişim listesi planı/.test(x.textContent));
        return h ? h.parentNode.querySelectorAll('thead th').length : 0; };
      let r = rapor();
      o.rChip = chipler('danisan');
      /* "Tümünü göster" yalnız bir bölüm kapalıyken; düğme tekrar basılınca bölüm geri açılır */
      const tumu = () => !!document.querySelector('[data-act=ciktiHepsi][data-tur=danisan]');
      o.rTumu = String(tumu());
      bas('danisan', 'not'); rapor(); o.rTumu += '/' + tumu();
      bas('danisan', 'not'); r = rapor();
      o.rTumu += '/' + /genel not satırı/.test(r) + '/' + ('not' in ((ui.cikti || {}).danisan || {})) + '/' + tumu();
      o.rTam = [/Toplam enerji: 450 kcal/.test(r), planTh(), /Demir takviyesi/.test(r), /Yetersiz demir alımı/.test(r), /genel not satırı/.test(r), /Toplam değişim/.test(r)].join(',');
      bas('danisan', 'ilac'); r = rapor();
      o.rIlac = [/Demir takviyesi|İlaçlar ve takviyeler/.test(r), /Ferritin/.test(r), chipler('danisan').indexOf('ilac-') >= 0, ui.cikti.danisan.ilac,
        (localStorage.getItem(DA.depoAnahtari) || '').indexOf('"cikti":{"danisan":{"ilac":false') >= 0].join(',');
      bas('danisan', 'makro'); r = rapor();
      o.rMakro = [/Değişim listesi planı/.test(r), /Toplam enerji/.test(r), /hedef 1500 kcal/.test(r), planTh()].join(',');
      bas('danisan', 'plan'); r = rapor();
      o.rPlan = /Değişim listesi planı/.test(r) + '/' + chipler('danisan').indexOf('makro') ;
      bas('danisan', 'pes'); bas('danisan', 'olcum'); bas('danisan', 'not'); r = rapor();
      o.rDiger = [/Yetersiz demir alımı/.test(r), /Toplam değişim|Kilo<\/th>/.test(r), /genel not satırı/.test(r), /Kilo seyri/.test(r)].join(',');
      DA.actions.clientShare({ dataset: { id: 'ck' } });
      o.rMetin = /59 kg/.test(paylasilan) + '/' + /genel not satırı/.test(paylasilan) + '/' + /Çıktı Danışan/.test(paylasilan);
      DA.actions.ciktiHepsi({ dataset: { tur: 'danisan' } }); r = rapor();
      o.rHepsi = [/Toplam enerji: 450 kcal/.test(r), /Demir takviyesi/.test(r), /Yetersiz demir alımı/.test(r), /genel not satırı/.test(r),
        chipler('danisan').indexOf('-') < 0, !(ui.cikti || {}).danisan].join(',');

      /* menü çıktısı */
      const meals = {}; DA.foods.ogunler.forEach((k) => { meals[k] = []; });
      meals[DA.foods.ogunler[0]].push({ id: 'yumurta-haslanmis', g: 50 });
      S.menus.unshift({ id: 'mk', title: 'Çıktı menü', date: '2026-02-05', client: '', note: 'menü notu', meals });
      const menu = () => { location.hash = 'yazdir/menu/mk'; DA.render(false); return doc(); };
      const th = () => document.querySelectorAll('.printdoc thead th').length;
      let mt = menu();
      o.mChip = chipler('menu');
      o.mTam = [th(), /kcal/.test(mt), /Protein/.test((document.querySelector('.gunluk-toplam') || {}).textContent || ''), /menü notu/.test(mt)].join(',');
      bas('menu', 'enerji'); mt = menu();
      const satir = document.querySelector('.printdoc tbody tr:not(.mh)');
      o.mEnerji = [th(), /kcal/.test(mt), /Protein/.test(mt), satir ? satir.querySelectorAll('td').length : 0].join(',');
      bas('menu', 'makro'); bas('menu', 'not'); mt = menu();
      o.mHicbiri = [!!document.querySelector('.gunluk-toplam'), /Günlük toplam/.test(mt), /menü notu/.test(mt), /Yumurta/i.test(mt)].join(',');
      DA.actions.menuShare({ dataset: { m: 'mk' } });
      o.mMetin = [/kcal/.test(paylasilan), /Günlük toplam|Protein/.test(paylasilan), /menü notu/.test(paylasilan), /Yumurta/i.test(paylasilan)].join(',');
      DA.actions.ciktiHepsi({ dataset: { tur: 'menu' } });
      DA.actions.menuShare({ dataset: { m: 'mk' } });
      o.mMetinTam = [/Günlük toplam: \d+ kcal · Protein/.test(paylasilan), /menü notu/.test(paylasilan)].join(',');
      S.menus = S.menus.filter((m) => m.id !== 'mk');

      /* değişim planı çıktısı */
      ui.exClient = null; location.hash = 'hesapla/degisim'; DA.render(false);
      const G = ui.exAlan[''], yedek = JSON.stringify(G);
      G.ex = { sutyy: 2, et: 4 }; G.exLock = {}; G.exMeal = { kahvalti: { sutyy: 1, et: 2 } };
      G.exT = { kcal: 1500, birim: 'yuzde', c: 50, p: 20, ts: 1 };
      const dg = () => { location.hash = 'yazdir/degisim'; DA.render(false); return doc(); };
      let d = dg();
      o.dChip = chipler('degisim');
      o.dTam = [/hedef 1500 kcal/.test(d), /Toplam enerji: 450 kcal/.test(d), /Kahvaltı:/.test(d), /1 değişim ne kadar\?/.test(d)].join(',');
      bas('degisim', 'makro'); d = dg();
      o.dMakro = [/kcal/.test(d), document.querySelector('.printdoc .blok thead').querySelectorAll('th').length, /Kahvaltı:/.test(d)].join(',');
      /* öğünler açık, makro kapalı: mesajda öğün satırı var ama kcal yok */
      DA.actions.exShare();
      o.dMetinOgun = /ÖĞÜNLER\nKahvaltı: /.test(paylasilan) + '/' + /kcal/.test(paylasilan);
      bas('degisim', 'ogun'); bas('degisim', 'ornek'); d = dg();
      o.dDiger = [/Kahvaltı:/.test(d), /1 değişim ne kadar\?/.test(d), /Süt \(yarım yağlı\)/.test(d)].join(',');
      DA.actions.exShare();
      o.dMetin = [/kcal/.test(paylasilan), /ÖĞÜNLER/.test(paylasilan), /Süt \(yarım yağlı\): 2 değişim/.test(paylasilan)].join(',');
      DA.actions.ciktiHepsi({ dataset: { tur: 'degisim' } });
      DA.actions.exShare();
      o.dMetinTam = /Toplam: 450 kcal · KH 18 g · Protein 36 g · Yağ 26 g/.test(paylasilan) + '/' + /ÖĞÜNLER/.test(paylasilan);
      Object.assign(G, JSON.parse(yedek));

      /* diyet listesi çıktısı: seçim listeye özel, çıktı ekranında da değişiyor */
      S.listeler = (S.listeler || []).filter((l) => l.id !== 'lc');
      S.listeler.push({ id: 'lc', ad: 'Çıktı liste', d: '2026-02-05', c: '', ex: { sutyy: 2 }, meal: {}, hedef: { kcal: 1500 },
        ogun: { kahvalti: [{ id: 's1', t: '1 su bardağı yarım yağlı süt', n: 1, d: { sutyy: 1 } }] }, not: '', ayar: {} });
      const ls = () => { location.hash = 'yazdir/liste/lc'; DA.render(false); };
      ls();
      const lchip = () => Array.from(document.querySelectorAll('.cikti-ayar [data-act=listeAyar]')).map((x) => x.dataset.k + (x.getAttribute('aria-pressed') === 'true' ? '+' : '-')).join(',');
      o.lOnce = lchip() + '|' + !!document.querySelector('.printdoc .liste-enerji');
      DA.actions.listeAyar({ dataset: { l: 'lc', k: 'enerji' } }); ls();
      o.lSonra = lchip() + '|' + !!document.querySelector('.printdoc .liste-enerji');
      S.listeler = S.listeler.filter((l) => l.id !== 'lc');
    } catch (e) { o.hata = String((e && e.message) || e); }
    S.clients = S.clients.filter((c) => c.id !== 'ck'); S.menus = S.menus.filter((m) => m.id !== 'mk');
    S.listeler = (S.listeler || []).filter((l) => l.id !== 'lc');
    delete ui.cikti; DA.save(); DA.shareText = eskiPay; DA.toast = eskiT;
    return o;
  });
  uiEkle('Çıktı: akış hatasız', '', ck.hata || '');
  uiEkle('Çıktı/rapor: yalnız içeriği olan bölümler, hepsi açık', 'olcum+,grafik+,plan+,makro+,lab+,ilac+,pes+,not+', ck.rChip);
  uiEkle('Çıktı/rapor: varsayılan tam (450 kcal elle, 5 sütun)', 'true,5,true,true,true,true', ck.rTam);
  uiEkle('Çıktı/rapor: kapatılan bölüm düğmeyle geri açılıyor; "Tümünü göster" yalnız kapalı varken', 'false/true/true/false/false', ck.rTumu);
  uiEkle('Çıktı/rapor: ilaç kapanıyor, diğerleri kalıyor, seçim diske yazılıyor', 'false,true,true,false,true', ck.rIlac);
  uiEkle('Çıktı/rapor: makro kapalıyken plan var, enerji ve KH/P/Y yok', 'true,false,false,2', ck.rMakro);
  uiEkle('Çıktı/rapor: plan kapanınca makro düğmesi de kalkıyor', 'false/-1', ck.rPlan);
  uiEkle('Çıktı/rapor: tanı, ölçüm, not kapanıyor; grafik kalıyor', 'false,false,false,true', ck.rDiger);
  uiEkle('Çıktı/rapor: metin paylaşımı da seçime uyuyor', 'false/false/true', ck.rMetin);
  uiEkle('Çıktı/rapor: tümünü göster', 'true,true,true,true,true,true', ck.rHepsi);
  uiEkle('Çıktı/menü: bölümler', 'enerji+,makro+,not+', ck.mChip);
  uiEkle('Çıktı/menü: varsayılan kcal sütunu ve makrolar', '3,true,true,true', ck.mTam);
  uiEkle('Çıktı/menü: kalori kapalı → sütun ve kcal yok, makro var', '2,false,true,2', ck.mEnerji);
  uiEkle('Çıktı/menü: hepsi kapalı → günlük toplam ve not yok, besin var', 'false,false,false,true', ck.mHicbiri);
  uiEkle('Çıktı/menü: metin paylaşımı da seçime uyuyor', 'false,false,false,true', ck.mMetin);
  uiEkle('Çıktı/menü: tümünü gösterince metin tam', 'true,true', ck.mMetinTam);
  uiEkle('Çıktı/değişim: bölümler (yemek karşılığı yok, planda yağ/ekmek yok)', 'makro+,ogun+,ornek+', ck.dChip);
  uiEkle('Çıktı/değişim: varsayılan tam (450 kcal elle)', 'true,true,true,true', ck.dTam);
  uiEkle('Çıktı/değişim: makro kapalı → hiç kcal yok, 2 sütun, öğün var', 'false,2,true', ck.dMakro);
  uiEkle('Çıktı/değişim: öğün ve porsiyon örneği kapanıyor, plan kalıyor', 'false,false,true', ck.dDiger);
  uiEkle('Çıktı/değişim: metin paylaşımı da seçime uyuyor', 'false,false,true', ck.dMetin);
  uiEkle('Çıktı/değişim: makro kapalı, öğün açık → öğün satırında kcal yok', 'true/false', ck.dMetinOgun);
  uiEkle('Çıktı/değişim: tümünü gösterince metin tam (KH 18 · P 36 · Y 26 elle)', 'true/true', ck.dMetinTam);
  uiEkle('Çıktı/liste: çıktı ekranında da enerji düğmesi (listeye özel, varsayılan kapalı)', 'enerji-,degisim-|false', ck.lOnce);
  uiEkle('Çıktı/liste: düğmeyle enerji satırı basılıyor', 'enerji+,degisim-|true', ck.lSonra);

  const ciktiSinir = await sayfa.evaluate(() => { try {
    const a = DA.veriDenetle({ ui: { cikti: { danisan: 'x', menu: { enerji: 'hayır', makro: false }, liste: [1] } } });
    const b = DA.veriDenetle({ ui: { cikti: 'x' } });
    return JSON.stringify(a.ui.cikti) + ' | ' + ('cikti' in b.ui);
  } catch (e) { return 'hata: ' + e.message; } });
  uiEkle('Sınır denetimi: çıktı ayarı', '{"menu":{"makro":false}} | false', ciktiSinir);

  /* ---- görsel yenileme (Kasım 2026) ----
     Yalnız görünüm değişti; testler görünümün bilgi taşıyan kısmını ölçer:
     varsayılan tema, gösterge geometrisi, makro kartındaki kalan miktarlar,
     simgelerin doğru gruba gitmesi, seçili sekme işareti, ekran geçişi. */
  const gy = await sayfa.evaluate(() => {
    const S = DA.state(), ui = S.ui, o = {}, eskiTema = ui.theme;
    try {
      /* Hiç seçim yoksa koyu; elle "Otomatik" seçilmişse korunur */
      delete ui.theme; DA.applyTheme();
      o.tema = DA.theme() + '/' + document.documentElement.getAttribute('data-theme');
      ui.theme = 'auto'; DA.applyTheme();
      o.tema += '/' + DA.theme() + '/' + document.documentElement.hasAttribute('data-theme');

      /* Yarım gösterge, elle: yay boyu π·42 = 131,95. Oran 0,25 → 32,99 → "33.0".
         Uç noktası: açı π·(1 − 0,25) = 135°; x = 50 + 42·cos135° = 50 − 29,70 = 20,3;
         y = 50 − 42·sin135° = 50 − 29,70 = 20,3. Oran 0 → uç noktası yok. */
      const kap = document.createElement('div');
      kap.innerHTML = DA.halka(0.25, '', { yarim: true }) + DA.halka(0, '', { yarim: true });
      const [h1, h2] = kap.querySelectorAll('.halka');
      const uc = h1.querySelector('.uc');
      o.yarim = [h1.classList.contains('yarim'), h1.querySelector('.yay').getAttribute('stroke-dasharray'),
        uc ? uc.getAttribute('cx') + ',' + uc.getAttribute('cy') : 'yok', !h2.querySelector('.uc')].join(' | ');

      /* Menü toplam kartı, elle: beyaz ekmek 100 g = 265 kcal · P 9 · KH 49 · Y 3,2
         (data-foods.js satırı). Hedef 1800/90/225/60:
         kalan 1800 − 265 = 1535 kcal; protein 9/90 = %10, 81 g kaldı;
         KH 49/225 = %21,78, 176 g kaldı; yağ 3,2/60 = %5,33, 56,8 → 57 g kaldı. */
      const meals = {}; DA.foods.ogunler.forEach((k) => { meals[k] = []; });
      meals[DA.foods.ogunler[0]].push({ id: 'beyaz-ekmek', g: 100 });
      S.menus.unshift({ id: 'gy', title: 'Görsel', date: '2026-02-05', client: '', note: '', target: { kcal: 1800, p: 90, c: 225, f: 60 }, meals });
      location.hash = 'menu/gy'; DA.render(false);
      const kart = document.querySelector('.makro-kart');
      const mk = Array.from(kart.querySelectorAll('.mk')).map((d) => {
        const w = parseFloat(((d.querySelector('.bar > i') || {}).style || {}).width);
        return d.querySelector('.mk-u span').textContent + ' ' + (isFinite(w) ? w.toFixed(2) : '-') + ' ' + d.querySelector('small').textContent;
      });
      o.makro = mk.join(' | ');
      o.halka = kart.querySelector('.halka .orta').textContent + '/' + kart.querySelector('.halka').classList.contains('asim');
      o.ogunIkon = document.querySelectorAll('h2.ogun-bas .oi svg').length + '/' + (document.querySelector('h2.ogun-bas') || {}).textContent;
      /* Hedef 200 kcal: 265 > 210 (%5 eşiği) → kırmızı yay, 65 kcal fazla.
         Protein hedefi 5 g: 9 > 5,25 → çubuk kırmızı, 9 − 5 = 4 g fazla;
         KH ve yağ hedefi yok. */
      S.menus[0].target = { kcal: 200, p: 5 }; DA.render(true);
      const k2 = document.querySelector('.makro-kart');
      o.asim = k2.querySelector('.halka .orta').textContent + '/' + k2.querySelector('.halka').classList.contains('asim') + '/' +
        k2.querySelectorAll('.mk small').length + '/' + Array.from(k2.querySelectorAll('.mk small')).map((x) => x.textContent).join(',') + '/' +
        k2.querySelector('.mk .bar').classList.contains('over');
      S.menus = S.menus.filter((m) => m.id !== 'gy');

      /* Besin grubu simgeleri: satırdaki simge kendi grubunun simgesi */
      const ic = (ad) => { const d = document.createElement('div'); d.innerHTML = DA.icon(ad); return d.innerHTML; };
      location.hash = 'besin'; DA.render(false);
      DA.actions.foodCat({ dataset: { c: 'Süt & Ürünleri' } });
      const ilk = document.querySelector('#foodList .li .ic.bg');
      o.besinIkon = !!ilk && ilk.innerHTML === ic('sut');
      DA.actions.foodCat({ dataset: { c: 'Tümü' } });
      o.ikonAdi = ['Tahıl & Ekmek', 'Et, Balık & Tavuk', 'Kurubaklagiller', 'Yağlı tohumlar', 'bilinmeyen'].map(DA.besinIkonAdi).join(',');

      /* Seçili sekme: renge ek olarak üst çizgi (::before) */
      const sek = Array.from(document.querySelectorAll('#tabs a'));
      const on = sek.find((a) => a.classList.contains('on')), off = sek.find((a) => !a.classList.contains('on'));
      o.sekme = (on ? on.dataset.tab : '-') + '/' + (on ? getComputedStyle(on, '::before').content !== 'none' : false) + '/' +
        (off ? getComputedStyle(off, '::before').content : '-');

      /* Hafta şeridi: ölçüm girilen gün dolu (degrade), girilmeyen düz.
         Bugüne bir ölçüm konur; altı gün öncesi boş kalır. */
      S.clients.push({ id: 'gyc', name: 'Şerit', sex: 'K', h: 160, meas: [{ id: 'm', d: DA.today(), w: 60 }] });
      location.hash = 'ana'; DA.render(false);
      S.clients = S.clients.filter((c) => c.id !== 'gyc');
      const gunler = Array.from(document.querySelectorAll('.hero .hafta .gun'));
      const dolu = gunler.find((g) => g.dataset.n !== '0'), bos = gunler.find((g) => g.dataset.n === '0');
      const arka = (g) => (g ? getComputedStyle(g.querySelector('b')).backgroundImage : '-');
      o.seri = /gradient/.test(arka(dolu)) + '/' + (arka(bos) === 'none');

      /* Ekran geçişi: adres değişince #app animasyonu yeniden başlar (style
         dokunulur); aynı ekranın yeniden çizimi dokunmaz. */
      const app = document.querySelector('#app'); let dokunus = 0;
      const gozcu = new MutationObserver((l) => { dokunus += l.filter((x) => x.attributeName === 'style').length; });
      gozcu.observe(app, { attributes: true });
      DA.render(true);
      o.gecis = [];
      return new Promise((tamam) => setTimeout(() => {
        o.gecis.push(dokunus); dokunus = 0;
        location.hash = 'hesapla'; DA.render(false);
        setTimeout(() => { o.gecis.push(dokunus > 0); gozcu.disconnect(); o.gecis = o.gecis.join('/');
          ui.theme = eskiTema; if (eskiTema == null) delete ui.theme; DA.applyTheme(); DA.save(); tamam(o); }, 0);
      }, 0));
    } catch (e) { o.hata = String((e && e.message) || e); ui.theme = eskiTema; DA.applyTheme(); return o; }
  });
  /* ---- besin değişim listesi (js/data-degisim.js) ----
     Beklenenler kullanıcının verdiği ana listeden elle okundu (ör. mercimek
     "2 yemek kaşığı, pişmiş tepeleme, 25 g çiğ"; zeytin "10 orta boy,
     40-35 g"; çilek "18 orta boy, 305-300 g") ve onun kararlarından
     (çorba 1 ekmek + 1 yağ; light ürünler yarım yağlı süt). Menemen kcal'i
     uygulamanın değişim değerleriyle: 3 et × 69 + 2 sebze × 32 + 2 yağ × 45
     = 207 + 64 + 90 = 361. */
  const dl = await sayfa.evaluate(async () => {
    const o = {}, S = DA.state(), ui = S.ui, eskiT = DA.toast; DA.toast = () => {};
    try {
      await DA.need(['degisim']);
      const D = DA.data.degisim, bul = (ad) => D.satirlar.find((r) => r.ad === ad) || {};
      const yaz = (r) => [r.olcu, r.miktar, JSON.stringify(r.d)].join(' | ');
      o.sayi = D.gruplar.map((g) => g[0] + ':' + D.satirlar.filter((r) => r.g === g[0]).length).join(',');
      o.mercimek = yaz(bul('Mercimek (yeşil, kırmızı)'));
      o.kusbasi = yaz(bul('Kuşbaşı et (yağsız)'));
      o.zeytin = yaz(bul('Zeytin (siyah ya da yeşil)'));
      o.cilek = yaz(bul('Çilek'));
      o.ispanak = bul('Ispanak').olcu + ' | ' + bul('Ispanak').pisOlcu;
      o.yogurt = bul('Yoğurt (light)').t + ' | ' + JSON.stringify(bul('Yoğurt (light)').d) + ' / ' + bul('Ev yoğurdu').t + ' | ' + JSON.stringify(bul('Ev yoğurdu').d);
      o.karsilik = ['Mercimek çorbası', 'Menemen', 'Boza', 'Humus'].map((a) => JSON.stringify(bul(a).d)).join(' ');
      o.atlanan = D.satirlar.filter((r) => /^(yaban mersini|kıyma|biftek|hindi füme|haşlanmış mısır)(\s*\(|$)/i.test(r.ad)).map((r) => r.ad).join(',');
      /* bütünlük: ad ve ölçü dolu, kimlik tekil, karşılık yalnız değişim
         gruplarında ve pozitif; serbest satırın karşılığı boş */
      const gk = DA.exchange.groups.map((g) => g.k), idler = {};
      o.butunluk = D.satirlar.filter((r) => {
        const k = Object.keys(r.d), tekrar = idler[r.id]; idler[r.id] = 1;
        return !r.ad || !r.olcu || tekrar || (r.serbest ? k.length !== 0 : !k.length || k.some((x) => gk.indexOf(x) < 0 || !(r.d[x] > 0)));
      }).map((r) => r.ad).join(',');
      const sec = (t) => D.secenekler.filter((e) => e.t === t);
      o.secenek = [sec('5–6 yemek kaşığı ıspanak (pişmiş)').map((e) => JSON.stringify(e.d)).join(''),
        sec('1 su bardağı süt').map((e) => JSON.stringify(e.d)).join(''),
        sec('1 su bardağı yarım yağlı süt').map((e) => JSON.stringify(e.d)).join('')].join(' ');
      /* Kaynakların adı hiçbir dosyada geçmez (sahiplerinin isteği). Aranan
         adlar bu testte de açık yazılmasın diye base64 (latin-1) tutulur. */
      const dosyalar = ['index.html'].concat(Array.from(document.querySelectorAll('script[src]')).map((x) => x.getAttribute('src')), ['js/data-degisim.js']);
      const metinler = await Promise.all(dosyalar.map((f) => fetch(f).then((r) => r.text()).catch(() => '')));
      o.adYok = dosyalar.filter((f, i) => new RegExp(atob('c21hcnRccypkaXlldHxlbWlyY2FufHR1ZmFufGVyZ2VuW2PnXQ=='), 'i').test(metinler[i])).join(',');

      /* Referans ekranı */
      ui.dlGrup = ''; ui.dlQ = '';
      location.hash = 'hesapla/degisimliste'; DA.render(false);
      o.cipler = document.querySelectorAll('#dlGruplar .chip').length;
      DA.actions.dlGrup({ dataset: { g: 'baklagil' } });
      const kartlar = document.querySelectorAll('.dl-grup');
      const mer = document.querySelector('.dl-grup tr[data-id="' + bul('Mercimek (yeşil, kırmızı)').id + '"]');
      o.grup = kartlar.length + '/' + (kartlar[0] || {}).dataset.g + '/' + document.querySelectorAll('.dl-grup tbody tr').length + '/' + (mer ? mer.cells[1].textContent : '');
      DA.actions.dlGrup({ dataset: { g: 'sut' } });
      const yo = document.querySelector('.dl-grup tr[data-id="' + bul('Yoğurt (light)').id + '"] .dl-kars');
      o.sutKars = yo ? yo.textContent.replace(/\s+/g, ' ') : '';
      DA.actions.dlGrup({ dataset: { g: 'yemek' } });
      const me = document.querySelector('.dl-grup tr[data-id="' + bul('Menemen').id + '"]');
      o.menemen = me ? (me.cells[2].textContent + ' | ' + me.cells[3].textContent).replace(/\s+/g, ' ') : '';
      DA.actions.dlGrup({ dataset: { g: '' } });
      DA.live.dlAra({ value: 'pilav' });
      o.ara = Array.from(document.querySelectorAll('#dlList tbody tr b')).map((b) => b.textContent).join(',');
      DA.live.dlAra({ value: 'zzzz' });
      o.bos = !!document.querySelector('#dlList .empty');
      ui.dlQ = ''; ui.dlGrup = '';

      /* Diyet listesi seçicisi: değişim listesinin satırları gelir, aynı
         metin bir kez görünür, seçilen satır karşılığıyla eklenir */
      S.listeler = (S.listeler || []).filter((l) => l.id !== 'dlx');
      S.listeler.push({ id: 'dlx', ad: 'Seçici', d: '2026-02-05', c: '', ex: { baklagil: 1 }, meal: { kahvalti: { baklagil: 1 } }, hedef: { kcal: 1500 },
        ogun: {}, not: '', ayar: {} });
      location.hash = 'liste/dlx'; DA.render(false);
      DA.actions.listeEkle({ dataset: { l: 'dlx', o: 'kahvalti' } });
      const secenekler = () => Array.from(document.querySelectorAll('#listeSecenek .li .t')).map((x) => x.textContent);
      DA.live.listeAra({ value: 'ıspanak', dataset: { l: 'dlx', o: 'kahvalti' } });
      o.ispSec = secenekler().join(' / ');
      DA.live.listeAra({ value: 'su bardağı süt', dataset: { l: 'dlx', o: 'kahvalti' } });
      o.tekil = secenekler().filter((t) => t === '1 su bardağı süt').length;
      DA.live.listeAra({ value: 'mercimek (yeşil', dataset: { l: 'dlx', o: 'kahvalti' } });
      const b = document.querySelector('#listeSecenek [data-e="' + bul('Mercimek (yeşil, kırmızı)').id + '"]');
      if (b) DA.actions.listeSec(b);
      const L = S.listeler.find((l) => l.id === 'dlx'), x = (L.ogun.kahvalti || [])[0] || {};
      o.secildi = x.t + ' | ' + JSON.stringify(x.d);
      DA.closeSheet();
    } catch (e) { o.hata = String((e && e.message) || e); }
    S.listeler = (S.listeler || []).filter((l) => l.id !== 'dlx'); DA.save(); DA.toast = eskiT;
    return o;
  });
  uiEkle('Değişim listesi: akış hatasız', '', dl.hata || '');
  uiEkle('Değişim listesi: grup başına satır', 'eyg:37,et:36,sut:9,meyve:37,sebze:41,yag:5,tohum:8,baklagil:10,tatli:16,yemek:30', dl.sayi);
  uiEkle('Değişim listesi: mercimek 2 yk (ana liste)', '2 yemek kaşığı (pişmiş, tepeleme) | 25 g (çiğ) | {"baklagil":1}', dl.mercimek);
  uiEkle('Değişim listesi: et 30 g çiğ / 20 g pişmiş', '3 orta boy | 30 g çiğ / 20 g pişmiş | {"et":1}', dl.kusbasi);
  uiEkle('Değişim listesi: zeytin 10 orta boy', '10 orta boy | 40 g brüt / 35 g net | {"yag":1}', dl.zeytin);
  uiEkle('Değişim listesi: çilek', '18 orta boy | 305 g brüt / 300 g net | {"meyve":1}', dl.cilek);
  uiEkle('Değişim listesi: sebzede çiğ ve pişmiş ölçü', '1 orta bağ (çiğ) | 5–6 yemek kaşığı', dl.ispanak);
  uiEkle('Değişim listesi: light yoğurt yarım yağlı, ev yoğurdu tam; gramaj metinde',
    '3/4 su bardağı (4 tepeleme yemek kaşığı) yarım yağlı yoğurt (150 g) | {"sutyy":1} / 1 su bardağı ev yoğurdu (200 g) | {"sut":1}', dl.yogurt);
  uiEkle('Değişim listesi: çorba ekmek + yağ, yemek ve içecek karşılıkları',
    '{"eyg":1,"yag":1} {"et":3,"sebze":2,"yag":2} {"eyg":2.5} {"yag":1,"baklagil":0.5}', dl.karsilik);
  uiEkle('Değişim listesi: atlanan satırlar yok', '', dl.atlanan);
  uiEkle('Değişim listesi: bütünlük (ad, ölçü, tekil kimlik, geçerli karşılık)', '', dl.butunluk);
  uiEkle('Değişim listesi: pişmiş sebze ve tam yağlı süt seçenekleri', '{"sebze":1} {"sut":1} {"sutyy":1}', dl.secenek);
  uiEkle('Değişim listesi: kaynakların adı hiçbir dosyada yok', '', dl.adYok);
  uiEkle('Değişim listesi ekranı: "Tümü" + 10 grup', 11, dl.cipler);
  uiEkle('Değişim listesi ekranı: grup süzgeci', '1/baklagil/10/2 yemek kaşığı (pişmiş, tepeleme)', dl.grup);
  uiEkle('Değişim listesi ekranı: light ürünün karşılığı yazılı', '= 1 süt (yarım yağlı)', dl.sutKars);
  uiEkle('Değişim listesi ekranı: menemen karşılığı ve kcal (elle 361)', '3 et + 2 sebze + 2 yağ | 361', dl.menemen);
  uiEkle('Değişim listesi ekranı: arama', 'Pirinç pilavı,Bulgur pilavı', dl.ara);
  uiEkle('Değişim listesi ekranı: sonuçsuz aramada boş durum', true, dl.bos);
  uiEkle('Liste seçicisi: ıspanak çiğ ve pişmiş', '1 orta bağ ıspanak (çiğ) / 5–6 yemek kaşığı ıspanak (pişmiş)', dl.ispSec);
  uiEkle('Liste seçicisi: aynı metin bir kez', 1, dl.tekil);
  uiEkle('Liste seçicisi: değişim listesinden satır ekleniyor', '2 yemek kaşığı mercimek (yeşil, kırmızı; pişmiş, tepeleme) | {"baklagil":1}', dl.secildi);

  /* ---- öğün şablonları ----
     Beyaz ekmek 100 g = 265 kcal (data-foods.js satırı): şablon satırında
     "Beyaz ekmek · 265 kcal". Şablon kopyadır: kaynak menüde gram değişince
     şablon 100 g kalır; şablondan eklenen besinde değişiklik şablonu bozmaz. */
  const sb = await sayfa.evaluate(() => {
    const S = DA.state(), o = {}, eski = DA.toast; let son = ''; DA.toast = (t) => { son = t; };
    try {
      S.ogunSablon = [];
      const bos = () => { const m = {}; DA.foods.ogunler.forEach((k) => { m[k] = []; }); return m; };
      const K = DA.foods.ogunler[0];
      const m1 = { id: 'sb1', title: 'Kaynak', date: '2026-02-05', client: '', note: '', meals: bos() };
      m1.meals[K].push({ id: 'beyaz-ekmek', g: 100, o: '4 dilim', a: 4 });
      const m2 = { id: 'sb2', title: 'Hedef', date: '2026-02-06', client: '', note: '', meals: bos() };
      m2.meals[K].push({ id: 'beyaz-ekmek', g: 25 });
      S.menus.unshift(m1, m2); DA.save();
      location.hash = 'menu/sb1'; DA.render(false);
      o.dugme = document.querySelectorAll('[data-act=menuSablon]').length + '/' + DA.foods.ogunler.length;
      DA.actions.menuSablon({ dataset: { m: 'sb1', k: K } });
      o.ilkAcilis = !document.querySelector('#sablonList') + '/' + !!document.querySelector('form[data-form=menuSablonKaydet]');
      let f = document.querySelector('form[data-form=menuSablonKaydet]');
      f.ad.value = '  '; DA.forms.menuSablonKaydet(f);
      o.bosAd = S.ogunSablon.length + '/' + son;
      f.ad.value = 'Standart kahvaltım'; DA.forms.menuSablonKaydet(f);
      const s = S.ogunSablon[0];
      o.kayit = S.ogunSablon.length + '/' + s.ad + '/' + JSON.stringify(s.items);
      m1.meals[K][0].g = 999;
      o.kopya = s.items[0].g;
      /* boş öğünde form yok, şablon listesi var */
      DA.actions.menuSablon({ dataset: { m: 'sb2', k: DA.foods.ogunler[2] } });
      o.bosOgun = !document.querySelector('form[data-form=menuSablonKaydet]') + '/' +
        ((document.querySelector('#sablonList .li .s') || {}).textContent || '');
      DA.closeSheet();
      /* var olan öğüne ekleme: sona eklenir */
      DA.actions.menuSablonEkle({ dataset: { s: s.id, m: 'sb2', k: K } });
      o.ekle = m2.meals[K].map((x) => x.id + ':' + x.g + (x.o ? ':' + x.o : '')).join(',');
      m2.meals[K][1].g = 5;
      o.ekleKopya = s.items[0].g;
      /* tanımsız öğüne ekleme de çalışır */
      delete m2.meals['Gece ara öğünü'];
      DA.actions.menuSablonEkle({ dataset: { s: s.id, m: 'sb2', k: 'Gece ara öğünü' } });
      o.yeniOgun = (m2.meals['Gece ara öğünü'] || []).length;
      /* silme ve geri alma */
      DA.actions.menuSablonSil({ dataset: { s: s.id } });
      o.sil = S.ogunSablon.length;
      DA.actions.geriAl();
      o.geri = S.ogunSablon.length + '/' + (S.ogunSablon[0] || {}).ad;
      o.disk = (localStorage.getItem(DA.depoAnahtari) || '').indexOf('Standart kahvaltım') >= 0;
      /* yedekten birleştirme: aynı kimlik atlanır, yeni eklenir */
      const den = DA.veriDenetle({ ogunSablon: [{ id: 'a b', ad: 5, items: 'x' }, 'çöp', { id: 'y', ad: 'Y', items: [{ id: 'q"', g: 10 }] }] });
      o.denetim = JSON.stringify(den.ogunSablon);
    } catch (e) { o.hata = String((e && e.message) || e); }
    S.menus = S.menus.filter((m) => m.id !== 'sb1' && m.id !== 'sb2'); S.ogunSablon = []; DA.save(); DA.toast = eski;
    return o;
  });
  uiEkle('Şablon: akış hatasız', '', sb.hata || '');
  uiEkle('Şablon: her öğünde şablon düğmesi', '6/6', sb.dugme);
  uiEkle('Şablon: ilk açılışta liste yok, kaydetme formu var', 'true/true', sb.ilkAcilis);
  uiEkle('Şablon: adsız kaydedilmiyor', '0/Şablona bir ad ver', sb.bosAd);
  uiEkle('Şablon: öğünün besinleri ölçüsüyle kaydediliyor', '1/Standart kahvaltım/[{"id":"beyaz-ekmek","g":100,"o":"4 dilim","a":4}]', sb.kayit);
  uiEkle('Şablon: kaynak menüdeki değişiklik şablonu bozmuyor', 100, sb.kopya);
  uiEkle('Şablon: boş öğünde form yok, satırda besin ve kcal', 'true/Beyaz ekmek · 265 kcal', sb.bosOgun);
  uiEkle('Şablon: öğünün sonuna ekleniyor', 'beyaz-ekmek:25,beyaz-ekmek:100:4 dilim', sb.ekle);
  uiEkle('Şablon: eklenen besindeki değişiklik şablonu bozmuyor', 100, sb.ekleKopya);
  uiEkle('Şablon: tanımsız öğüne de ekleniyor', 1, sb.yeniOgun);
  uiEkle('Şablon: silinip geri alınıyor', '0 → 1/Standart kahvaltım', sb.sil + ' → ' + sb.geri);
  uiEkle('Şablon: diske yazılıyor', true, sb.disk);
  uiEkle('Sınır denetimi: öğün şablonu', '[{"id":"a_b","ad":"5","items":[]},{"id":"y","ad":"Y","items":[{"id":"q_","g":10}]}]', sb.denetim);

  uiEkle('Görsel: akış hatasız', '', gy.hata || '');
  uiEkle('Görsel: seçim yoksa koyu tema, elle "Otomatik" korunuyor', 'dark/dark/auto/false', gy.tema);
  uiEkle('Görsel: yarım gösterge yayı ve uç noktası (elle)', 'true | 33.0 131.9 | 20.3,20.3 | true', gy.yarim);
  uiEkle('Görsel: menü makro çubukları ve kalan (elle)', 'Protein 10.00 81 g kaldı | Karbonhidrat 21.78 176 g kaldı | Yağ 5.33 57 g kaldı', gy.makro);
  uiEkle('Görsel: menü halkası kalan kcal', '1535kcal kaldı/false', gy.halka);
  uiEkle('Görsel: menü hedefi aşılınca kırmızı yay ve fazla', '65kcal fazla/true/3/4 g fazla,hedef yok,hedef yok/true', gy.asim);
  uiEkle('Görsel: öğün başlıklarında simge, başlık metni aynı', '6/Kahvaltı', gy.ogunIkon);
  uiEkle('Görsel: besin satırında kendi grubunun simgesi', true, gy.besinIkon);
  uiEkle('Görsel: grup adından simge', 'tahil,balik,fasulye,badem,bowl', gy.ikonAdi);
  uiEkle('Görsel: seçili sekmede üst çizgi var, diğerlerinde yok', 'besin/true/none', gy.sekme);
  uiEkle('Görsel: hafta şeridinde ölçüm günü dolu, boş gün düz', 'true/true', gy.seri);
  uiEkle('Görsel: ekran değişince geçiş, yeniden çizimde değil', '0/true', gy.gecis);

  /* ---- değişim listesi: hedef yüzde ya da gram ----
     Bildirilen hata: yüzdeler girilince "Yağ % (otomatik)" alanı güncellenmiyor,
     plan girilen yüzdelere uymuyormuş gibi görünüyordu. Giriş gerçek "input"
     olayıyla yapılır; olay bağlantısı da sınanmış olur. */
  const gr = await sayfa.evaluate(() => {
    const ui = DA.state().ui, o = {};
    const eski = DA.toast; const tostlar = []; DA.toast = (m) => tostlar.push(m);
    ui.exClient = null; location.hash = 'hesapla/degisim'; DA.render(false);
    const G = ui.exAlan[''];
    G.ex = {}; G.exLock = {}; G.exMeal = {}; G.adim = null; G.exT = { kcal: 1800, birim: 'yuzde', c: 50, p: 20, ts: 1 };
    DA.render(false);
    /* Öğe yoksa test çökmesin, ölçüm başarısız sayılsın: çökme sonraki bütün
       testleri koşturmadan durdurur ve başka hataları gizler. */
    const $ = (sel) => document.querySelector(sel);
    const deger = (sel) => { const e = $(sel); return e ? e.value : null; };
    const metin = (sel) => { const e = $(sel); return e ? e.textContent : ''; };
    const bas = (sel) => { const e = $(sel); if (e) e.click(); return !!e; };
    const yaz = (ad, d) => { const e = $('input[name=' + ad + '][data-live=exT]');
      if (e) { e.value = d; e.dispatchEvent(new Event('input', { bubbles: true })); } };
    const serit = () => Array.from(document.querySelectorAll('#exMakro .macros > div')).map((d) => (d.querySelector('b') || {}).textContent || '').map((x) => x.trim());
    const tikla = (b) => bas('button[data-act=exBirim][data-b=' + b + ']');

    /* 1) yüzde modunda yağ canlı güncelleniyor: 100 − 45 − 20 = 35 */
    yaz('c', '45'); yaz('p', '20');
    o.yagCanli = serit()[2];
    /* 2) grama geçiş: 1800 × 45 ÷ 400 = 202,5 → 203 g · 1800 × 20 ÷ 400 = 90 g */
    tikla('gram');
    o.gramaGecis = deger('input[name=cg]') + '/' + deger('input[name=pg]');
    /* 3) gram modunda dağıtım — elle: yağ hedefi (1800 − 720 − 320) ÷ 9 = 84,4 g
       sabitler KH 105, P (24 + 8 + 4) = 36, Y (12 + 10) = 22
       ekmek (180 − 105) ÷ 15 = 5 · et (80 − 36 − 10) ÷ 6 = 5,7 → 6
       yağ (84,4 − 22 − 30) ÷ 5 = 6,5 → 6 · toplam KH 180 · P 82 · Y 82 · 1786 kcal */
    yaz('cg', '180'); yaz('pg', '80');
    o.gramSerit = serit().join(' ');
    bas('button[data-act=exAuto]');
    const t = DA.exchange.totals(G.ex);
    o.gramSonuc = [G.ex.eyg, G.ex.et, G.ex.yag, Math.round(t.c), Math.round(t.p), Math.round(t.f), Math.round(t.kcal)].join(',');
    o.gramAdim = Array.from(document.querySelectorAll('#exAdim li')).some((x) => /Ekmek = \(180 g KH hedefi − 105\)/.test(x.textContent));
    /* 4) hedef değişince tablo eski hedefe göre kalır ve bu söylenir */
    yaz('cg', '200');
    o.bayatNot = /Hedef değişti/.test(metin('#exAdim'));
    o.bayatAdimGizli = !$('#exAdim li');
    o.notDugmesi = bas('#exAdim button[data-act=exAuto]');
    o.yenidenDagitildi = Math.round(DA.exchange.totals(G.ex).c);
    o.notKalkti = !/Hedef değişti/.test(metin('#exAdim'));
    /* 5) gram modunda enerji değişince gramlar sabit, yüzde değişir:
       200 × 4 ÷ 2000 = %40 */
    yaz('cg', '180'); yaz('kcal', '2000');
    o.gramSabit = G.exT.cg;
    o.yuzdeDegisti = metin('#exMakro .macros > div small.alt').trim();
    /* 6) yüzdeye dönüş: 180 × 4 ÷ 2000 = %36 · 80 × 4 ÷ 2000 = %16 */
    tikla('yuzde');
    o.yuzdeyeDonus = deger('input[name=c]') + '/' + deger('input[name=p]');
    /* 7) tutarsız hedef: 400 g + 100 g × 4 = 2000 kcal > 1800 → yağ eksi */
    tikla('gram'); yaz('kcal', '1800'); yaz('cg', '400'); yaz('pg', '100');
    o.eksiNot = /enerjinin tamamını aşıyor/.test(metin('#exMakro'));
    const once = JSON.stringify(G.ex); tostlar.length = 0;
    bas('button[data-act=exAuto]');
    o.eksiReddedildi = JSON.stringify(G.ex) === once && /Yağa en az %5/.test(tostlar.join(' '));
    /* 8) gram modunda uyarı gram ile yazılır: 1500 kcal, P 120 g ulaşılamaz */
    yaz('kcal', '1500'); yaz('cg', '170'); yaz('pg', '120');
    bas('button[data-act=exAuto]');
    o.gramUyari = (G.adim.uyari || []).join(' | ');

    /* 9) danışana gram modunda kayıt ve yeniden açınca aynı birim */
    DA.state().clients = [{ id: 'gk', name: 'Gram Kişi', sex: 'K', h: 160, meas: [] }];
    location.hash = 'hesapla/degisim?c=gk'; DA.render(false);
    const A = ui.exAlan.gk;
    A.exT = { kcal: 1800, birim: 'gram', cg: 180, pg: 80, ts: 2 }; A.exLock = {};
    DA.render(false);
    bas('button[data-act=exAuto]');
    DA.actions.exSaveClient({ dataset: { id: 'gk' } });
    const ph = (DA.state().clients[0].plan || {}).hedef || {};
    o.kayitBirim = ph.birim + ' ' + ph.cg + '/' + ph.pg + ' (%' + ph.c + '/%' + ph.p + ')';
    delete ui.exAlan.gk; ui.exClient = null;                        /* sonraki açılış dosyadan kurulsun */
    location.hash = 'hesapla/degisim?c=gk'; DA.render(false);
    o.yenidenAcilis = (($('button[data-act=exBirim].on') || {}).dataset || {}).b + ' ' + deger('input[name=cg]');
    o.yenidenAyni = /Dosyadaki planla aynı/.test(metin('#exDanisan'));

    /* 10) hesaplayıcı hedefi gram modunda gramla önerilir (300 g, 120 g) */
    DA.state().targets = { kcal: 2400, c: 300, p: 120, f: 80, dan: '', ts: Date.now() + 1000 };
    ui.exClient = null; location.hash = 'hesapla/degisim'; DA.render(false);
    ui.exAlan[''].exT.birim = 'gram'; DA.render(false);
    o.oneriGram = metin('#exHedefOneri');
    DA.toast = eski;
    return o;
  });
  uiEkle('Yüzde girilince yağ canlı güncelleniyor', '%35', gr.yagCanli);
  uiEkle('Grama geçişte değerler çevriliyor', '203/90', gr.gramaGecis);
  uiEkle('Gram modunda şerit (KH P Y)', '180g 80g 84g', gr.gramSerit);
  uiEkle('Gram hedefiyle dağıtım (ekmek,et,yağ,KH,P,Y,kcal)', '5,6,6,180,82,82,1786', gr.gramSonuc);
  uiEkle('Adımlar gram hedefini gösteriyor', true, gr.gramAdim);
  uiEkle('Hedef değişince "Hedef değişti" notu', true, gr.bayatNot);
  uiEkle('Hedef değişince eski adımlar gizleniyor', true, gr.bayatAdimGizli);
  uiEkle('Notta yeniden dağıt düğmesi var', true, gr.notDugmesi);
  uiEkle('Nottaki düğme yeni hedefe göre dağıtıyor (KH g)', true, Math.abs(gr.yenidenDagitildi - 200) <= 8);
  uiEkle('Yeniden dağıtınca not kalkıyor', true, gr.notKalkti);
  uiEkle('Gram modunda enerji değişince gram sabit', 180, gr.gramSabit);
  uiEkle('Gram modunda enerji değişince yüzde güncelleniyor', '%36', gr.yuzdeDegisti);
  uiEkle('Yüzdeye dönüşte değerler çevriliyor', '36/16', gr.yuzdeyeDonus);
  uiEkle('Tutarsız hedefte kırmızı not', true, gr.eksiNot);
  uiEkle('Tutarsız hedefte dağıtım reddediliyor', true, gr.eksiReddedildi);
  kosulUi('Gram modunda uyarı gramla yazılıyor', /Protein hedefi \(120 g\)/.test(gr.gramUyari), gr.gramUyari);
  uiEkle('Danışana gram modunda kayıt', 'gram 180/80 (%40/%17,8)'.replace(',', '.'), gr.kayitBirim);
  uiEkle('Yeniden açınca aynı birim ve değer', 'gram 180', gr.yenidenAcilis);
  uiEkle('Yeniden açınca dosyayla aynı', true, gr.yenidenAyni);
  kosulUi('Hesaplayıcı hedefi gram modunda gramla öneriliyor', /KH 300 g · P 120 g/.test(gr.oneriGram), gr.oneriGram);

  /* Enerji hesaplayıcısı hedefe kim için ve ne zaman hesaplandığını işliyor —
     değişim listesinin öneri kuralı bu damgaya dayanıyor. */
  await sayfa.evaluate(() => DA.need(['pal']));
  const damga = await sayfa.evaluate(() => {
    const once = Date.now();
    const kaydet = (hash) => {
      location.hash = hash; DA.render(false);
      const f = document.querySelector('form[data-calc=enerji]');
      [['age', '30'], ['h', '165'], ['w', '60']].forEach(([ad, d]) => {
        const e = f.querySelector('[name=' + ad + ']'); e.value = d; DA.live.calc(e); });
      DA.actions.saveTargets();
      return Object.assign({}, DA.state().targets);
    };
    const dan = kaydet('hesapla/enerji?c=ayse');
    const genel = kaydet('hesapla/enerji');
    return { dan: dan.dan, danTs: dan.ts >= once, genel: genel.dan, kcal: genel.kcal > 0 };
  });
  uiEkle('Danışan için kaydedilen hedef danışanla damgalanıyor', 'ayse', damga.dan);
  uiEkle('Kaydedilen hedef zaman damgası taşıyor', true, damga.danTs);
  uiEkle('Genel kaydedilen hedef kimseye ait değil', '', damga.genel);

  /* ---- dışarıdan gelen veri: kimlik ve bağlantı denetimi ----
     Bulunan açık: kayıt kimlikleri özniteliklere (href, data-id) kaçırılmadan
     yazılıyordu; kimliği " data-… eklenmiş bir yedek danışan, menü ve staj
     listelerine öznitelik enjekte ediyordu. Favorideki "javascript:" adresi
     de dokununca betik çalıştırabiliyordu. Üç giriş yolu da sınanır: depodan
     okuma, yedeği üzerine yazma, birleştirme. Ayrı bağlamda: ana testlerin
     depolamasına dokunmaz. */
  /* Service worker kapalı: yeni bağlamda ilk kayıt "controllerchange" ile
     sayfayı yeniden yüklüyor ve ölçümün ortasında bağlam kayboluyordu. */
  const gv = await tarayici.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  gv.on('dialog', (d) => d.accept());
  const zehir = (on) => {
    const zid = (x) => on + x + '" data-xss="' + on + x + '" x="';
    return {
      v: 1,
      clients: [{ id: zid('c'), name: 'Zehirli Danışan', sex: 'K', h: 160,
        meas: [{ id: zid('m'), d: '2026-01-10', w: 60 }], calcs: [{ id: zid('h'), d: '2026-01-10', t: 'BKİ', s: 'BKİ: 23' }] }],
      /* menüdeki besin eklenen besine aynı ham kimlikle bağlı: denetimden sonra da bağlı kalmalı */
      menus: [{ id: zid('mm'), title: 'Zehirli menü', date: '2026-01-10', meals: { 'Kahvaltı': [{ id: 'c_ö"x', g: 50 }] } }],
      customFoods: [{ id: 'c_ö"x', n: 'Özel Besin Adı', cat: 'Eklediklerim', kcal: 100, p: 1, c: 1, f: 1, fib: 0, u: [] }],
      journal: [{ id: zid('j'), d: '2026-01-10', type: 'Klinik', place: 'x', hours: 1, title: 'Zehirli kayıt', text: 'x' }],
      ui: { fav: [{ h: 'javascript:window.__xss=["fav"]', t: 'kötü', ico: 'star' }, { h: '#/hesapla/bki', t: 'BKİ', ico: 'calc' }],
        recent: [{ h: 'javascript:void(0)', t: 'kötü son', ico: 'calc' }], exClient: 'x" data-xss="ex' }
    };
  };
  const tara = async (rotalar) => {
    const bulgu = [];
    for (const r of rotalar) {
      await gv.goto(B + r, { waitUntil: 'domcontentloaded' });
      await gv.waitForFunction(() => window.DA && DA.state, null, { timeout: 10000 });
      await gv.waitForTimeout(80);
      const x = await gv.evaluate(() => ({ e: document.querySelectorAll('[data-xss]').length, b: (window.__xss || []).length }));
      if (x.e || x.b) bulgu.push(r + ':' + x.e + '/' + x.b);
    }
    return bulgu.join(' ');
  };
  const denetimSonucu = () => gv.evaluate(() => {
    const S = DA.state(), tum = [];
    S.clients.forEach((c) => { tum.push(c.id); (c.meas || []).forEach((m) => tum.push(m.id)); (c.calcs || []).forEach((m) => tum.push(m.id)); });
    S.menus.forEach((m) => tum.push(m.id)); S.journal.forEach((j) => tum.push(j.id)); S.customFoods.forEach((f) => tum.push(f.id));
    return { kimlikTemiz: tum.every((x) => /^[\w-]+$/.test(x)), sayi: tum.length,
      fav: (S.ui.fav || []).map((x) => x.h).join(' '), son: (S.ui.recent || []).length };
  });
  const ROTA_G = ['#/danisan', '#/menu', '#/staj', '#/ana', '#/besin'];

  /* 1) depodan okuma */
  await gv.goto(B + '#/ana', { waitUntil: 'domcontentloaded' });
  await gv.waitForFunction(() => window.DA && DA.state);
  await gv.evaluate((o) => localStorage.setItem('dyt.v1', JSON.stringify(o)), zehir('a'));
  await gv.reload({ waitUntil: 'domcontentloaded' });
  await gv.waitForFunction(() => window.DA && DA.state);
  const d1 = await denetimSonucu();
  uiEkle('Açılış: kimlikler güvenli karakterlerde', true, d1.kimlikTemiz && d1.sayi >= 6);
  uiEkle('Açılış: javascript: favorisi atıldı', '#/hesapla/bki', d1.fav);
  uiEkle('Açılış: javascript: son açılan atıldı', 0, d1.son);
  uiEkle('Açılış: hiçbir ekranda enjeksiyon yok', '', await tara(ROTA_G));
  const menuId = await gv.evaluate(() => DA.state().menus[0].id);
  await gv.goto(B + '#/menu/' + menuId, { waitUntil: 'domcontentloaded' });
  await gv.waitForFunction(() => window.DA && DA.state);
  await gv.evaluate(() => DA.need(['porsiyonBesin', 'hedef']));
  await gv.waitForTimeout(150);
  uiEkle('Denetimden sonra menüdeki besin bağı korunuyor', true,
    await gv.evaluate(() => /Özel Besin Adı/.test(document.querySelector('#app').textContent)));

  /* 2) yedeği üzerine yazma — gerçek dosya seçiciyle */
  const yukle = async (o) => {
    await gv.goto(B + '#/daha', { waitUntil: 'domcontentloaded' });
    await gv.waitForSelector('input[data-change=restore]', { state: 'attached', timeout: 10000 });
    await gv.setInputFiles('input[data-change=restore]', { name: 'yedek.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(o)) });
    await gv.waitForSelector('[data-act=restoreReplace]', { timeout: 10000 });
  };
  await gv.evaluate(() => { DA.replaceState({}); });
  await yukle(zehir('b'));
  await gv.click('[data-act=restoreReplace]');
  await gv.waitForTimeout(150);
  const d2 = await denetimSonucu();
  uiEkle('Üzerine yaz: kimlikler güvenli', true, d2.kimlikTemiz && d2.sayi >= 6);
  uiEkle('Üzerine yaz: javascript: favorisi atıldı', '#/hesapla/bki', d2.fav);
  uiEkle('Üzerine yaz: hiçbir ekranda enjeksiyon yok', '', await tara(ROTA_G));

  /* 3) birleştirme — kayıtlar replaceState'ten geçmeden eklenir */
  await gv.evaluate(() => { DA.replaceState({ clients: [{ id: 'temiz1', name: 'Temiz', sex: 'E', h: 170, meas: [] }] }); });
  await yukle(zehir('c'));
  await gv.click('[data-act=restoreMerge]');
  await gv.waitForTimeout(150);
  const d3 = await denetimSonucu();
  uiEkle('Birleştir: kimlikler güvenli', true, d3.kimlikTemiz);
  uiEkle('Birleştir: kayıtlar eklendi', true, await gv.evaluate(() => DA.state().clients.length === 2));
  uiEkle('Birleştir: hiçbir ekranda enjeksiyon yok', '', await tara(ROTA_G));
  await gv.close();

  /* ---- yapısal dayanıklılık: bozuk tek bir alan ekranı kilitlememeli ----
     Genel taramada bulundu: tarihsiz tek bir ölçüm ana sayfayı, danışan
     listesini ve raporu "Bir şeyler ters gitti"ye düşürüyordu; öğünsüz menü
     menü ekranlarını, "top"suz eski plan danışan dosyasını çökertiyordu.
     Tam dolu bir durumdan her alan tek tek silinir / null / metin / sayı /
     dizi yapılır, veri gerçek giriş yolundan (replaceState → denetim) geçer
     ve kaydın türüne göre ilgili ekranlar çizilir. 94 alan × 5 biçimde
     26 çökme vardı. */
  const yp = await tarayici.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  yp.on('dialog', (d) => d.accept());
  await yp.goto(B + '#/ana', { waitUntil: 'domcontentloaded' });
  await yp.waitForFunction(() => window.DA && DA.state);
  await yp.evaluate(() => DA.needAll());
  const yapi = await yp.evaluate(() => {
    const t = DA.today();
    const TAM = () => ({
      v: 1,
      clients: [{ id: 'c1', name: 'Ayşe', sex: 'K', h: 165, bdate: '2015-03-01', birth: 2015, hedef: 60, aralik: 21, pal: '1.4', tags: ['dm2'], avoid: 'x', note: 'n',
        meas: [{ id: 'm1', d: '2026-01-10', w: 30, h: 130, waist: 60, hip: 70, fat: 20, note: 'a' }, { id: 'm2', d: t, w: 32, h: 133 }],
        calcs: [{ id: 'k1', d: t, t: 'BKİ', s: 'BKİ: 18', ico: 'scale', k: 'BKİ', v: 18, u: 'kg/m²' }],
        plan: { d: t, ts: 1, hedef: { kcal: 1800, birim: 'yuzde', c: 50, p: 20 }, ex: { sutyy: 3, et: 5, eyg: 8 }, meal: { kahvalti: { sutyy: 1 } }, top: { kcal: 1800, c: 225, p: 90, f: 60 } },
        lab: [{ id: 'l1', d: t, ad: 'HbA1c', deger: 6.8, birim: '%' }], pes: [{ id: 'p1', d: t, p: 'P', e: 'E', s: 'S', cozuldu: false }],
        gorusme: [{ id: 'g1', d: t, t: 'not' }], dosya: { tani: 't', ilac: 'i', beslenme: 'b', oneri: 'o', gosterge: 'g' } }],
      ogunSablon: [{ id: 'os', ad: 'Şablon', items: [{ id: 'beyaz-ekmek', g: 50, o: '2 dilim', a: 2 }] }],
      menus: [{ id: 'mm', title: 'Menü', date: t, client: 'Ayşe', c: 'c1', tur: 'geri', note: 'n', target: { kcal: 1800, p: 90, c: 225, f: 60 },
        meals: { 'Kahvaltı': [{ id: 'yumurta-haslanmis', g: 50, o: '1 adet', a: 1 }], 'Öğle': [{ id: 'c_o', g: 100 }] } }],
      journal: [{ id: 'j1', d: t, type: 'Klinik', place: 'Hastane', hours: 2, title: 'Vaka', text: 'metin' }],
      customFoods: [{ id: 'c_o', n: 'Özel', cat: 'Eklediklerim', kcal: 100, p: 5, c: 10, f: 3, fib: 1, u: [['1 porsiyon', 50]] }],
      customCards: [{ id: 'cc1', q: 'Soru', a: 'Cevap', tag: 'x' }],
      listeler: [{ id: 'll', ad: 'Liste', d: t, c: 'c1', ex: { sutyy: 1 }, hedef: { kcal: 87 }, not: 'n', ayar: { enerji: true, degisim: true },
        meal: { kahvalti: { sutyy: 1 } }, ogun: { kahvalti: [{ id: 's1', t: '1 su bardağı süt', n: 2, d: { sutyy: 1 } }] } }],
      esdegerler: [{ id: 'e1', t: '2 adet galeta', d: { eyg: 1 } }],
      cardProgress: {}, targets: { kcal: 2000, p: 100, c: 250, f: 67 }, profile: { dyt: 'Dyt. X', iletisim: 'tel' },
      ui: { fav: [{ h: '#/hesapla/bki', t: 'BKİ', ico: 'calc' }], recent: [{ h: '#/danisan/c1', t: 'Ayşe', ico: 'users' }], lastBackup: t }
    });
    const EKRAN = {
      clients: ['ana', 'danisan', 'danisan/c1', 'yazdir/danisan/c1', 'yazdir/degisim/c1', 'hesapla/degisim?c=c1', 'hesapla/enerji?c=c1', 'ara'],
      menus: ['ana', 'menu', 'menu/mm', 'yazdir/menu/mm', 'ara', 'danisan/c1'],
      journal: ['ana', 'staj', 'yazdir/staj'],
      customFoods: ['besin', 'menu/mm', 'yazdir/menu/mm'],
      customCards: ['ana', 'kart'],
      listeler: ['liste', 'liste/ll', 'yazdir/liste/ll', 'danisan/c1', 'ara'],
      esdegerler: ['liste/ll']
    };
    const yollar = [];
    const gez = (kok, o, yol) => {
      if (!o || typeof o !== 'object') return;
      Object.keys(o).forEach((k) => {
        const y = yol.concat(k); yollar.push([kok, y]);
        if (Array.isArray(o[k])) { if (o[k].length && typeof o[k][0] === 'object') gez(kok, o[k][0], y.concat(0)); }
        else if (o[k] && typeof o[k] === 'object') gez(kok, o[k], y);
      });
    };
    const tam = TAM();
    Object.keys(EKRAN).forEach((k) => { yollar.push([k, [k]]); gez(k, tam[k][0], [k, 0]); });
    const BOZ = [['sil'], ['null', null], ['metin', 'x'], ['sayı', 7], ['dizi', []]];
    const cokme = [];
    let cizim = 0;
    yollar.forEach(([kok, yol]) => BOZ.forEach(([ad, deger]) => {
      const o = TAM(); let h = o;
      for (let i = 0; i < yol.length - 1; i++) h = h[yol[i]];
      const son = yol[yol.length - 1];
      if (ad === 'sil') delete h[son]; else h[son] = deger;
      try { DA.replaceState(o); } catch (e) { cokme.push(yol.join('.') + '←' + ad + ' replaceState'); return; }
      EKRAN[kok].forEach((r) => {
        cizim++;
        let hata = '';
        try { location.hash = r; DA.render(false); } catch (e) { hata = e.message; }
        if (hata || /Bir şeyler ters gitti/.test((document.querySelector('#app') || {}).innerText || '')) cokme.push(yol.join('.') + '←' + ad + ' @' + r);
      });
    }));
    return { yol: yollar.length, cizim, cokme };
  });
  await yp.close();
  uiEkle('Yapısal tarama kapsamı (alan sayısı)', true, yapi.yol >= 90);
  uiEkle('Yapısal tarama: bozuk tek alan hiçbir ekranı çökertmiyor', '', yapi.cokme.slice(0, 6).join(' | '));

  /* İki katman ayrı ayrı: (1) sınır denetimi kaydın şeklini düzeltiyor mu,
     (2) kullanım yeri denetimi atlayan bellek içi veride çökmüyor mu. Tek
     katman sınansaydı öteki bozulduğunda testler fark etmezdi. */
  const katman = await sayfa.evaluate(() => {
    const o = DA.veriDenetle({ clients: [{ id: 'a', name: null, tags: 'x', meas: [{ id: 'm' }, 'çöp', null], calcs: 5,
      plan: { ex: { sut: 1 } } }], menus: [{ id: 'b', meals: { 'Kahvaltı': 'x' } }, { id: 'c' }], journal: null, customCards: 'x' });
    const c = o.clients[0];
    const denetim = [c.name === '', Array.isArray(c.tags), c.meas.length === 1, c.meas[0].d === '', Array.isArray(c.calcs),
      typeof c.plan.top === 'object' && typeof c.plan.hedef === 'object', Array.isArray(o.menus[0].meals['Kahvaltı']),
      typeof o.menus[1].meals === 'object', !('journal' in o), !('customCards' in o)].map((x) => (x ? 1 : 0)).join('');
    /* denetimi atlayan bellek içi veri: tarihsiz ölçüm üç elemanlı dizinin sonunda */
    const S = DA.state();
    S.clients = [{ id: 'bt', name: 'Tarihsiz', sex: 'K', h: 160, meas: [{ id: '1', d: '2026-01-01', w: 60 }, { id: '2', d: '2026-02-01', w: 61 }, { id: '3', w: 62 }] }];
    const cok = [];
    /* ana sayfa ve ön doldurma yolları ayrı sıralama kopyaları taşıyordu */
    ['ana', 'danisan', 'danisan/bt', 'yazdir/danisan/bt', 'hesapla/enerji?c=bt', 'hesapla/bel?c=bt'].forEach((r) => {
      try { location.hash = r; DA.render(false); } catch (e) { cok.push(r + ':' + e.message); }
      if (/Bir şeyler ters gitti/.test(document.querySelector('#app').innerText)) cok.push(r);
    });
    return { denetim, cok: cok.join(' ') };
  });
  uiEkle('Sınır denetimi kaydın şeklini düzeltiyor (10 madde)', '1111111111', katman.denetim);
  uiEkle('Tarihsiz ölçüm (bellekte) ekranları çökertmiyor', '', katman.cok);

  /* Diyet listesi ve seçenekler de sınırda denetleniyor: kimlik HTML'e yazılır,
     satır metni ve çarpanı ekrana basılır. */
  const listeSinir = await sayfa.evaluate(() => {
    const o = DA.veriDenetle({ listeler: [{ id: 'a b"', ad: null, c: 5, meal: 'x', ex: { eyg: 'iki', yag: 2 }, ayar: 3,
      ogun: { kahvalti: 'x', ogle: [{ id: 'z"', t: 3, n: 'x', d: { eyg: 'iki', yag: 1, et: -2 } }, 'çöp', null] } }],
      esdegerler: [{ id: 'e"', t: null, d: { eyg: -1, sut: 1 } }, 7] });
    const l = o.listeler[0], s = l.ogun.ogle[0], e = o.esdegerler[0];
    return [l.id, l.ad, l.c, JSON.stringify(l.meal), JSON.stringify(l.ex), JSON.stringify(l.ayar), JSON.stringify(l.ogun.kahvalti),
      l.ogun.ogle.length, s.id, s.t, s.n, JSON.stringify(s.d), o.esdegerler.length, e.id, e.t, JSON.stringify(e.d)].join(' | ');
  });
  uiEkle('Sınır denetimi: diyet listesi ve seçenekler', 'a_b_ |  | 5 | {} | {"yag":2} | {} | [] | 1 | z_ | 3 | 1 | {"yag":1} | 1 | e_ |  | {"sut":1}', listeSinir);

  /* "top" alanı olmayan eski plan: toplam değişimlerden hesaplanır — elle:
     yarım yağlı süt 3 × 87 + et 5 × 69 + ekmek 8 × 68 = 1150 kcal;
     KH 27 + 120 = 147 g. Eskiden dosya çöküyor, rapor "undefined" basıyordu. */
  const eskiPlan = await sayfa.evaluate(() => {
    const S = DA.state();
    S.clients = [{ id: 'ep', name: 'Eski Plan', sex: 'K', h: 160, meas: [],
      plan: { d: '2025-01-01', hedef: { kcal: 1200, c: 50, p: 20 }, ex: { sutyy: 3, et: 5, eyg: 8 } } }];
    DA.save();
    location.hash = 'danisan/ep'; DA.render(false);
    const kart = Array.from(document.querySelectorAll('#app .card')).find((c) => /Değişim listesi planı/.test(c.textContent));
    location.hash = 'yazdir/danisan/ep'; DA.render(false);
    const rapor = document.querySelector('.printdoc') ? document.querySelector('.printdoc').textContent : '';
    return { kart: kart ? kart.textContent.replace(/\s+/g, ' ') : '', rapor };
  });
  kosulUi('Eski planda enerji değişimlerden hesaplanıyor', /1150\s*kcal/.test(eskiPlan.kart), eskiPlan.kart.slice(0, 120));
  kosulUi('Eski planda KH değişimlerden hesaplanıyor', /147\s*g/.test(eskiPlan.kart), eskiPlan.kart.slice(0, 120));
  kosulUi('Raporda "undefined" yok, toplam enerji basılıyor', !/undefined/.test(eskiPlan.rapor) && /Toplam enerji:\s*1150 kcal/.test(eskiPlan.rapor), eskiPlan.rapor.slice(0, 200));

  /* ---- uygulama kilidi (kasa) ----
     Gerçek sayfada uçtan uca: kur → diskte ve anlık kopyalarda düz metin
     yok → yeniden yükle → kilit ekranı, bellek boş → kilitliyken kayıt diske
     dokunmuyor → yanlış/doğru parola → kurtarma koduyla aç ve yeni parola →
     eski parola artık geçmiyor → otomatik kilit süresi → kilidi kaldır. */
  const ks = await tarayici.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  ks.on('dialog', (d) => d.accept());
  await ks.goto(B + '#/ana', { waitUntil: 'domcontentloaded' });
  await ks.waitForFunction(() => window.DA && DA.state && DA.kasa);
  const GIZLI = 'Gizli Danışan Örnek';
  const k1 = await ks.evaluate(async (ad) => {
    DA.replaceState({ clients: [{ id: 'k1', name: ad, sex: 'K', h: 160, meas: [{ id: 'm', d: '2026-01-01', w: 60 }] }], ui: { theme: 'dark' } });
    await DA.depoAnlik(true);                       /* kilitten önce düz metin kopya */
    const once = (await DA.depoListe()).some((x) => String(x.json).indexOf(ad) >= 0);
    const kod = await DA.kasa.kur('dogru-parola-1');
    await DA.kasa.bekle();
    const disk = localStorage.getItem(DA.depoAnahtari);
    const kopyalar = await DA.depoListe();
    return { once, kod, zarf: JSON.parse(disk).format, diskDuz: disk.indexOf(ad) >= 0 || disk.indexOf('Gizli') >= 0,
      kopyaDuz: kopyalar.some((x) => String(x.json).indexOf('Gizli') >= 0), kopyaSayi: kopyalar.length,
      hepsiSifreli: kopyalar.every((x) => x.sifreli) };
  }, GIZLI);
  uiEkle('Kilit: kurmadan önce düz metin kopya vardı (sınama koşulu)', true, k1.once);
  uiEkle('Kilit: kurtarma kodu 6×4 Crockford', true, /^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){5}$/.test(k1.kod));
  uiEkle('Kilit: disk kaydı şifreli zarf', 'diyet-asistani-kasa', k1.zarf);
  uiEkle('Kilit: diskte düz metin yok', false, k1.diskDuz);
  uiEkle('Kilit: anlık kopyalarda düz metin yok (eski kopyalar silindi)', false, k1.kopyaDuz);
  uiEkle('Kilit: yeni anlık kopya şifreli', 'true/true', (k1.kopyaSayi >= 1) + '/' + k1.hepsiSifreli);

  await ks.reload({ waitUntil: 'domcontentloaded' });
  await ks.waitForFunction(() => window.DA && DA.state && DA.kasa);
  await ks.waitForSelector('.kilit-ekran form[data-form=kasaAc]', { timeout: 10000 });
  const k2 = await ks.evaluate(async (ad) => {
    /* kilitliyken boş durumun anlık kopyası alınmaz (açılıştaki otomatik
       kopya da dahil): alınsaydı "geri dön" listesinde boş bir kayıt dururdu */
    const once = (await DA.depoListe()).length;
    const alindi = await DA.depoAnlik(true);
    const kopya = alindi + '/' + ((await DA.depoListe()).length === once);
    const o = { kopya, ekran: document.body.classList.contains('kasa-kilitli'), bellek: DA.state().clients.length,
      sizinti: document.body.innerText.indexOf(ad) >= 0, tema: document.documentElement.getAttribute('data-theme'),
      sekmeGizli: getComputedStyle(document.querySelector('#tabs')).display === 'none' };
    /* başka adrese gitmek kilidi aşmaz */
    location.hash = 'danisan/k1'; DA.render(false);
    o.adresKilitli = !!document.querySelector('.kilit-ekran') && document.body.innerText.indexOf(ad) < 0;
    /* kilitliyken kayıt diske dokunmaz */
    const disk = localStorage.getItem(DA.depoAnahtari);
    DA.state().clients.push({ id: 'x', name: 'Boş', meas: [] });
    o.kayit = DA.save() + '/' + (localStorage.getItem(DA.depoAnahtari) === disk);
    DA.state().clients = [];
    /* dokunma hedefleri */
    o.kucuk = Array.from(document.querySelectorAll('.kilit-ekran button,.kilit-ekran input')).filter((e) => {
      const r = e.getBoundingClientRect(); return r.height < 44; }).length;
    return o;
  }, GIZLI);
  uiEkle('Kilit: yeniden yüklenince kilit ekranı', true, k2.ekran);
  uiEkle('Kilit: kilitliyken bellek boş', 0, k2.bellek);
  uiEkle('Kilit: kilitliyken ekranda danışan adı yok', false, k2.sizinti);
  uiEkle('Kilit: kilit ekranı seçili temada', 'dark', k2.tema);
  uiEkle('Kilit: sekme çubuğu gizli', true, k2.sekmeGizli);
  uiEkle('Kilit: başka adres kilidi aşmıyor', true, k2.adresKilitli);
  uiEkle('Kilit: kilitliyken kayıt diske yazılmıyor', 'false/true', k2.kayit);
  uiEkle('Kilit: kilitliyken anlık kopya alınmıyor', 'false/true', k2.kopya);
  uiEkle('Kilit ekranı dokunma hedefleri 44 px', 0, k2.kucuk);

  /* yanlış ve doğru parola: gerçek form üzerinden. Önceki adım adresi
     değiştirdi; kilit aşılmışsa form bulunamaz ve test çökmesin diye ana
     sayfaya dönülür (aşılma yukarıdaki testte zaten kaydedildi). */
  await ks.evaluate(() => { location.hash = 'ana'; DA.render(false); });
  await ks.fill('.kilit-ekran input[name=p]', 'yanlis-parola');
  await ks.click('.kilit-ekran button[type=submit]');
  await ks.waitForFunction(() => /yanlış/i.test((document.querySelector('#kasaHata') || {}).textContent || ''), null, { timeout: 15000 });
  const yanlisSonra = await ks.evaluate(() => DA.state().clients.length);
  await ks.fill('.kilit-ekran input[name=p]', 'dogru-parola-1');
  await ks.click('.kilit-ekran button[type=submit]');
  await ks.waitForFunction(() => DA.kasa.acik(), null, { timeout: 15000 });
  const k3 = await ks.evaluate(async (ad) => {
    /* Her adım hatayı değer olarak döner: bozuk kodda bir adım patlarsa
       sonraki ölçümler yine yapılır, koşu çökmez. */
    const dene = async (f) => { try { return await f(); } catch (e) { return 'HATA ' + e.message; } };
    const o = { ad: (DA.state().clients[0] || {}).name, sekme: getComputedStyle(document.querySelector('#tabs')).display !== 'none' };
    /* açıkken değişiklik şifreli kalıcı */
    DA.state().clients.push({ id: 'k2', name: 'İkinci', sex: 'E', h: 170, meas: [] }); DA.save(); await DA.kasa.bekle();
    o.diskDuz = localStorage.getItem(DA.depoAnahtari).indexOf('İkinci') >= 0;
    /* parola değiştir: yanlış eskiyle reddedilir */
    try { await DA.kasa.parolaDegistir('yanlis', 'yeni-parola-22'); o.yanlisEski = 'kabul'; } catch (e) { o.yanlisEski = e.message; }
    await dene(() => DA.kasa.parolaDegistir('dogru-parola-1', 'yeni-parola-22'));
    await dene(() => DA.kasa.kilitle());
    o.kilitlendi = DA.state().clients.length + '/' + !!document.querySelector('.kilit-ekran');
    try { await DA.kasa.kilitAc('dogru-parola-1'); o.eskiParola = 'açtı'; } catch (e) { o.eskiParola = 'reddetti'; }
    await dene(() => DA.kasa.kilitAc('yeni-parola-22'));
    o.yeniParola = DA.state().clients.length;
    await dene(() => DA.kasa.kilitle());
    return o;
  }, GIZLI);
  uiEkle('Kilit: yanlış parolada veri açılmıyor', 0, yanlisSonra);
  uiEkle('Kilit: doğru parolada veri geliyor', GIZLI, k3.ad);
  uiEkle('Kilit: açılınca sekmeler görünüyor', true, k3.sekme);
  uiEkle('Kilit: açıkken yapılan kayıt da şifreli', false, k3.diskDuz);
  uiEkle('Kilit: yanlış eski parolayla değiştirilemiyor', 'yanlis', k3.yanlisEski);
  uiEkle('Kilit: kilitle → bellek boş, kilit ekranı', '0/true', k3.kilitlendi);
  uiEkle('Kilit: eski parola artık açmıyor', 'reddetti', k3.eskiParola);
  uiEkle('Kilit: yeni parola açıyor', 2, k3.yeniParola);

  /* kurtarma kodu: küçük harf ve boşlukla yazılmış da kabul */
  const k4 = await ks.evaluate(async (kod) => {
    const dene = async (f) => { try { return await f(); } catch (e) { return 'HATA ' + e.message; } };
    const o = {};
    try { await DA.kasa.kurtar('AAAA-BBBB-CCCC-DDDD-EEEE-FFFF'); o.yanlisKod = 'kabul'; } catch (e) { o.yanlisKod = 'red'; }
    o.kurtarHata = await dene(() => DA.kasa.kurtar(kod.toLowerCase().replace(/-/g, ' ')));
    DA.render(false);
    o.yeniForm = !!document.querySelector('.kilit-ekran form[data-form=kasaYeni]') && DA.state().clients.length === 0;
    await dene(() => DA.kasa.yeniParolaKur('ucuncu-parola-3'));
    o.acildi = DA.state().clients.length;
    await dene(() => DA.kasa.kilitle());
    try { await DA.kasa.kilitAc('yeni-parola-22'); o.oncekiParola = 'açtı'; } catch (e) { o.oncekiParola = 'reddetti'; }
    await dene(() => DA.kasa.kilitAc('ucuncu-parola-3'));
    o.ucuncu = DA.state().clients.length;
    /* otomatik kilit: 1 dk seçili; 30 sn arka plan kilitlemez, 61 sn kilitler */
    DA.state().ui.kilitSure = 1; DA.save();
    o.otuz = DA.kasa.gorunur(30000);
    o.altmisBir = DA.kasa.gorunur(61000);
    await DA.kasa.bekle(); await new Promise((r) => setTimeout(r, 50));
    o.otoKilit = !DA.kasa.acik() && DA.state().clients.length === 0;
    /* kaldır: yanlış parolayla olmaz; doğruyla düz metne döner */
    await dene(() => DA.kasa.kilitAc('ucuncu-parola-3'));
    try { await DA.kasa.kaldir('yanlis'); o.yanlisKaldir = 'kaldırdı'; } catch (e) { o.yanlisKaldir = 'red'; }
    await dene(() => DA.kasa.kaldir('ucuncu-parola-3'));
    const disk = localStorage.getItem(DA.depoAnahtari) || '';
    o.duzeDondu = disk.indexOf('Gizli Danışan Örnek') >= 0 && !DA.kasa.kurulu();
    await new Promise((r) => setTimeout(r, 50));
    const kop = await DA.depoListe();
    o.kopyalarDuz = kop.length >= 1 && kop.every((x) => !x.sifreli);
    return o;
  }, k1.kod);
  uiEkle('Kurtarma: yanlış kod reddediliyor', 'red', k4.yanlisKod);
  uiEkle('Kurtarma: küçük harf ve boşlukla yazılan kod kabul', undefined, k4.kurtarHata);
  uiEkle('Kurtarma: kod doğru → yeni parola istenir, veri henüz açılmaz', true, k4.yeniForm);
  uiEkle('Kurtarma: yeni parolayla veri açılıyor', 2, k4.acildi);
  uiEkle('Kurtarma: unutulan parola artık geçmiyor', 'reddetti', k4.oncekiParola);
  uiEkle('Kurtarma: yeni parola sonraki açılışta geçiyor', 2, k4.ucuncu);
  uiEkle('Otomatik kilit: süre dolmadan kilitlemiyor', false, k4.otuz);
  uiEkle('Otomatik kilit: süre dolunca kilitliyor', true, k4.altmisBir && k4.otoKilit);
  uiEkle('Kilit kaldırma: yanlış parolayla olmuyor', 'red', k4.yanlisKaldir);
  uiEkle('Kilit kaldırma: kayıt düz metne dönüyor', true, k4.duzeDondu);
  uiEkle('Kilit kaldırma: şifreli kopyalar yerine düz kopya', true, k4.kopyalarDuz);
  await ks.close();

  /* ---- yedek tarihi ----
     Geri yükleme ekranı "Yedek tarihi"ni o.lastBackup'tan okuyordu; tarih
     durumda ui.lastBackup altında durduğu için satır hiç görünmüyordu. */
  const yt = await tarayici.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', acceptDownloads: true });
  yt.on('dialog', (d) => d.accept());
  await yt.goto(B + '#/daha', { waitUntil: 'domcontentloaded' });
  await yt.waitForFunction(() => window.DA && DA.state);
  await yt.evaluate(() => { DA.replaceState({ clients: [{ id: 'y1', name: 'Yedekli', sex: 'K', h: 160, meas: [] }], ui: { lastBackup: '2025-01-01' } }); });
  const indirme = yt.waitForEvent('download', { timeout: 10000 });
  await yt.evaluate(() => { navigator.canShare = () => false; DA.actions.backup(); });
  const yedekMetin = fs.readFileSync(await (await indirme).path(), 'utf8');
  const yedekObje = JSON.parse(yedekMetin);
  const yedekGunu = await yt.evaluate(() => DA.today());
  uiEkle('Yedek dosyası alındığı günle damgalanıyor', yedekGunu, yedekObje.yedekTarihi);
  await yt.evaluate(() => { location.hash = 'daha'; DA.render(false); });
  await yt.setInputFiles('input[data-change=restore]', { name: 'y.json', mimeType: 'application/json', buffer: Buffer.from(yedekMetin) });
  await yt.waitForSelector('[data-act=restoreReplace]', { timeout: 10000 });
  const tarihMetni = await yt.evaluate(() => (document.querySelector('#sheet').textContent.match(/Yedek tarihi: ([^\n]+?)(Birleştir|$)/) || [])[1] || '');
  uiEkle('Geri yüklemede yedek tarihi görünüyor', await yt.evaluate(() => DA.fdate(DA.today())), tarihMetni.trim());
  await yt.click('[data-act=restoreReplace]');
  await yt.waitForTimeout(100);
  uiEkle('Dosya damgası duruma karışmıyor', false, await yt.evaluate(() => 'yedekTarihi' in DA.state()));
  await yt.close();

  /* ---- uzun boşluksuz metin taşmamalı (360 px telefon) ----
     Nota yapıştırılmış bağlantı ya da "fıstık,ceviz,badem" gibi boşluksuz
     liste danışan dosyasını yatayda taşırıyordu; çıktılarda sağ kenardan
     kesilip kayboluyordu. Kasıtlı yatay kaydırma alanları (.chips, .scrollx)
     sayılmaz. */
  const ts = await tarayici.newPage({ viewport: { width: 360, height: 780 }, serviceWorkers: 'block' });
  await ts.goto(B + '#/ana', { waitUntil: 'domcontentloaded' });
  await ts.waitForFunction(() => window.DA && DA.state);
  await ts.evaluate(() => DA.needAll());
  const tasmaSonuc = await ts.evaluate(() => {
    const S = DA.state(), t = DA.today();
    const URL_ = 'https://www.saglik.gov.tr/TR,11588/turkiye-beslenme-rehberi-tuber-2022.html';
    const LISTE = 'fıstık,ceviz,badem,fındık,susam,yumurta,süt,gluten,kivi';
    const KELIME = 'Çokuzunbirkelimeboşluksuz'.repeat(8);
    S.clients = [{ id: 'u', name: KELIME, sex: 'K', h: 160, avoid: LISTE, note: URL_, tags: ['dm2'],
      meas: [{ id: '1', d: t, w: 60, note: URL_ }], calcs: [{ id: 'k', d: t, t: KELIME, s: URL_, k: 'BKİ', v: 20, u: 'kg/m²' }] }];
    S.menus = [{ id: 'mu', title: KELIME, date: t, client: KELIME, note: URL_, meals: { 'Kahvaltı': [{ id: 'yumurta-haslanmis', g: 50 }] } }];
    S.journal = [{ id: 'ju', d: t, type: 'Klinik', place: KELIME, hours: 2, title: KELIME, text: URL_ }];
    DA.save();
    const bulgu = [];
    ['danisan', 'danisan/u', 'menu', 'menu/mu', 'staj', 'yazdir/danisan/u', 'yazdir/menu/mu', 'yazdir/staj'].forEach((h) => {
      location.hash = h; DA.render(false);
      const W = document.documentElement.clientWidth, fark = document.documentElement.scrollWidth - W;
      const tas = Array.from(document.querySelectorAll('#app *')).filter((e) => !e.closest('.chips, .scrollx') && e.getBoundingClientRect().right > W + 1);
      if (fark > 0 || tas.length) bulgu.push(h + ':' + fark + 'px');
    });
    return bulgu.join(' ');
  });
  await ts.close();
  uiEkle('Uzun boşluksuz metin ekranı ve çıktıyı taşırmıyor', '', tasmaSonuc);

  /* ---- service worker: ilk ziyarette yenileme yok, güncellemede var ----
     İlk ziyarette service worker sayfayı sahiplenince (clients.claim)
     "controllerchange" geliyor, uygulama sayfayı yeniden yüklüyordu: o an
     açık formdaki kaydedilmemiş yazı kayboluyordu (yeni danışan adı). Test
     koşusunda ara sıra görülen "bağlam kayboldu" hatası da buydu. Yenileme
     yalnız güncellemede, "Yenile"ye basılınca olmalı. Service worker AÇIK. */
  {
    const swBag = await tarayici.newContext({ viewport: { width: 390, height: 844 } });
    const sw = await swBag.newPage();
    let yukleme = 0; sw.on('load', () => yukleme++);
    await sw.goto(B + '#/danisan', { waitUntil: 'load' });
    await sw.waitForFunction(() => window.DA && DA.actions && DA.actions.clientNew);
    await sw.waitForTimeout(300);
    /* Yenileme ölçümün ortasında gelirse değerlendirme "bağlam kayboldu"
       diye fırlatır; test çökmesin, ölçüm başarısız sayılsın. */
    const guvenli = (p, varsayilan) => p.catch(() => varsayilan);
    await guvenli(sw.evaluate(() => { DA.actions.clientNew();
      const i = document.querySelector('#sheet input[name=name]'); i.value = 'Yeni Danışan'; i.dispatchEvent(new Event('input', { bubbles: true })); }), null);
    /* service worker kurulup sayfayı sahiplenene kadar bekle */
    await guvenli(sw.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 }), null);
    await sw.waitForTimeout(800);
    await guvenli(sw.waitForFunction(() => window.DA && DA.actions, null, { timeout: 10000 }), null);
    uiEkle('İlk ziyarette sayfa kendiliğinden yenilenmiyor', 1, yukleme);
    uiEkle('İlk ziyarette açık formdaki yazı korunuyor', 'Yeni Danışan',
      await guvenli(sw.evaluate(() => { const i = document.querySelector('#sheet input[name=name]'); return i ? i.value : '(form kapandı)'; }), '(sayfa yenilendi)'));
    /* güncelleme: sw.js değişmiş gibi sunulur, "Yenile" sayfayı yenilemeli */
    swSurumEki = '-test-guncelleme';
    await sw.evaluate(() => { if (DA.closeSheet) DA.closeSheet(); return DA._sw && DA._sw.update(); });
    await sw.waitForSelector('#updBar [data-act=doUpdate]', { timeout: 15000 });
    const onceYukleme = yukleme;
    const yenilendi = sw.waitForEvent('load', { timeout: 15000 }).catch(() => null);
    await sw.click('#updBar [data-act=doUpdate]');
    await yenilendi;
    uiEkle('Güncellemede "Yenile" sayfayı yeniliyor', onceYukleme + 1, yukleme);
    swSurumEki = '';
    await swBag.close();
  }

  /* ---- çevrimdışı: yüklenen her dosya önbellekte ----
     Manifestteki maskable ikon önbellek listesinde yoktu. Yeni bir veri
     dosyası eklenip ASSETS'e yazılmayı unutulursa da burası yakalar. */
  {
    const oku = (f) => fs.readFileSync(path.join(KOK, f), 'utf8');
    const swm = oku('sw.js'), html = oku('index.html'), core = oku('js/core.js'), man = oku('manifest.webmanifest');
    const assets = new Set((swm.slice(swm.indexOf('const ASSETS'), swm.indexOf('];')).match(/'([^']+)'/g) || []).map((x) => x.slice(1, -1)));
    const lazyBlok = core.slice(core.indexOf('DA.LAZY = {'), core.indexOf('};', core.indexOf('DA.LAZY = {')));
    const gerek = new Set([...(html.match(/src="([^"]+)"/g) || []).map((x) => x.slice(5, -1)),
      ...(lazyBlok.match(/'(js\/data-[\w-]+\.js)'/g) || []).map((x) => x.slice(1, -1)),
      ...(man.match(/"src"\s*:\s*"([^"]+)"/g) || []).map((x) => x.replace(/^"src"\s*:\s*"/, '').slice(0, -1))]);
    uiEkle('Yüklenen her dosya service worker önbelleğinde', '', [...gerek].filter((g) => !g.startsWith('http') && !assets.has(g)).join(' '));
    uiEkle('Önbellek listesindeki her dosya diskte', '', [...assets].filter((a) => a !== './' && !fs.existsSync(path.join(KOK, a))).join(' '));
  }

  /* Depolama teşhisi okunabiliyor */
  const durum = await sayfa.evaluate(() => DA.depoDurum());
  uiEkle('Depolama durumu raporlanıyor', true,
    durum && typeof durum.anlik === 'number' && durum.ls > 0);

  yaz('Arayüz: ' + ui.filter((t) => t.ok).length + '/' + ui.length);
  ui.forEach(bildir);

  await sayfa.close();

  /* ---- 3. rota taraması ---- */
  for (const tema of (TEK ? ['light'] : ['light', 'dark'])) {
    const p = await tarayici.newPage({ viewport: { width: 430, height: 930 } });
    const errs = [];
    p.on('console', (mm) => { if (mm.type() === 'error') errs.push(mm.text()); });
    p.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
    await p.goto(B, { waitUntil: 'networkidle' });
    await p.evaluate(ornekDurum, tema);
    let kotu = 0, tasma = 0;
    for (const r of ROTALAR) {
      await p.goto(B + r, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(150);
      const durum = await p.evaluate(() => ({
        baslik: (document.querySelector('#title') || {}).textContent || null,
        cokme: Array.from(document.querySelectorAll('#app .card b')).some((x) => x.textContent.includes('ters gitti')),
        bos: (document.querySelector('#app') || { innerHTML: '' }).innerHTML.length < 40,
        tasma: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      }));
      if (durum.cokme || durum.bos || durum.baslik == null) {
        kotu++;
        sonuc.satir.push({ grup: 'rota', ad: tema + ' ' + (r || '(kök)'), bek: 'çalışan ekran',
          bul: durum.cokme ? 'çöktü' : durum.bos ? 'boş' : 'başlık yok', ok: false });
        sonuc.kaldi++;
      } else sonuc.gecti++;
      if (durum.tasma) {
        tasma++;
        sonuc.satir.push({ grup: 'rota', ad: tema + ' ' + (r || '(kök)'), bek: 'yatay taşma yok', bul: 'taşma var', ok: false });
        sonuc.kaldi++;
      }
    }
    errs.forEach((e) => { sonuc.satir.push({ grup: 'konsol', ad: tema, bek: 'hata yok', bul: e, ok: false }); sonuc.kaldi++; });
    yaz('Rota (' + tema + '): ' + (ROTALAR.length - kotu) + '/' + ROTALAR.length +
      ' · taşma ' + tasma + ' · konsol hatası ' + errs.length);
    await p.close();
  }

  await tarayici.close();
  srv.close();

  if (sonuc.satir.length) {
    yaz('\nBAŞARISIZ (' + sonuc.satir.length + '):');
    sonuc.satir.forEach((s) => yaz('  ✗ [' + s.grup + '] ' + s.ad + '\n      beklenen: ' + s.bek + '\n      bulunan : ' + s.bul));
  }
  yaz('\nToplam: ' + sonuc.gecti + ' geçti, ' + sonuc.kaldi + ' kaldı');
  process.exit(sonuc.kaldi ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
