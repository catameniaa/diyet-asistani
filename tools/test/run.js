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
  '#/hesapla/tuber', '#/hesapla/oruntu', '#/hesapla/hedef', '#/hesapla/porsiyon',
  '#/hesapla/porsiyonbesin', '#/hesapla/istege', '#/hesapla/bebek', '#/hesapla/gebe',
  '#/hesapla/pal', '#/hesapla/ornekmenu', '#/hesapla/enerjiref', '#/hesapla/yontem', '#/hesapla/vejetaryen',
  '#/hesapla/porsiyon?t=olcu&ara=ceviz', '#/hesapla/ornekmenu?m=ek53',
  '#/danisan/c1', '#/menu/mm', '#/daha/sablon', '#/daha/kaynaknot',
  '#/yazdir/menu/mm', '#/yazdir/danisan/c1', '#/yazdir/degisim', '#/yazdir/ornekmenu/ek53'
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
      'hesapla/khdagilim', 'besin', 'danisan', 'menu', 'daha'].forEach(say);
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
    const g = (n) => { const d = new Date(Date.now() - n * 86400000); return d.toISOString().slice(0, 10); };
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
    const g = (n) => { const d = new Date(b + 'T00:00'); d.setDate(d.getDate() - n);
      return d.toISOString().slice(0, 10); };
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
      kartDeger: kutu[2] ? kutu[2].querySelector('b').textContent.trim() : null
    };
  });
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
        plan: { d: t, ts: 1, hedef: { kcal: 1800, birim: 'yuzde', c: 50, p: 20 }, ex: { sutyy: 3, et: 5, eyg: 8 }, meal: { kahvalti: { sutyy: 1 } }, top: { kcal: 1800, c: 225, p: 90, f: 60 } } }],
      menus: [{ id: 'mm', title: 'Menü', date: t, client: 'Ayşe', note: 'n', target: { kcal: 1800, p: 90, c: 225, f: 60 },
        meals: { 'Kahvaltı': [{ id: 'yumurta-haslanmis', g: 50 }], 'Öğle': [{ id: 'c_o', g: 100 }] } }],
      journal: [{ id: 'j1', d: t, type: 'Klinik', place: 'Hastane', hours: 2, title: 'Vaka', text: 'metin' }],
      customFoods: [{ id: 'c_o', n: 'Özel', cat: 'Eklediklerim', kcal: 100, p: 5, c: 10, f: 3, fib: 1, u: [['1 porsiyon', 50]] }],
      customCards: [{ id: 'cc1', q: 'Soru', a: 'Cevap', tag: 'x' }],
      cardProgress: {}, targets: { kcal: 2000, p: 100, c: 250, f: 67 }, profile: { dyt: 'Dyt. X', iletisim: 'tel' },
      ui: { fav: [{ h: '#/hesapla/bki', t: 'BKİ', ico: 'calc' }], recent: [{ h: '#/danisan/c1', t: 'Ayşe', ico: 'users' }], lastBackup: t }
    });
    const EKRAN = {
      clients: ['ana', 'danisan', 'danisan/c1', 'yazdir/danisan/c1', 'yazdir/degisim/c1', 'hesapla/degisim?c=c1', 'hesapla/enerji?c=c1', 'ara'],
      menus: ['ana', 'menu', 'menu/mm', 'yazdir/menu/mm', 'ara'],
      journal: ['ana', 'staj', 'yazdir/staj'],
      customFoods: ['besin', 'menu/mm', 'yazdir/menu/mm'],
      customCards: ['ana', 'kart']
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
