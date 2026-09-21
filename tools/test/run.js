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
