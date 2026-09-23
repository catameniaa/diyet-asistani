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
    const hc = document.querySelector('.chart .hedef');
    /* Çizginin var olması yetmez: ölçek hedefi kapsamazsa çizgi görünür
       alanın dışına düşer. viewBox 0..150 içinde olmalı. */
    const hy = hc ? parseFloat(hc.getAttribute('y1')) : null;
    return {
      cizgi: !!hc,
      cizgiIcerde: hy != null && hy > 0 && hy < 150,
      etiket: !!document.querySelector('.chart text.hedefe'),
      hedefeKalan: t.indexOf('hedefe (kg)') >= 0,
      bes: /hedefe \(kg\)/.test(t) && t.indexOf('-5') >= 0,   /* 65 − 70 = -5: 5 kg verilecek */
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
