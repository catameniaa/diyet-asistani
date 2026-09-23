/* Karbonhidrat sayımı — İ:KH oranı (500 kuralı), düzeltme faktörü (1800 kuralı) ve bolus */
(function () {
  'use strict';
  const { fmt } = DA;

  DA.calcs.push({
    id: 'khsayim', title: 'Karbonhidrat sayımı', desc: 'İ:KH oranı (500), düzeltme faktörü (1800), öğün bolusu', ico: 'syringe',
    fields: [
      { k: 'gtid', l: 'Günlük toplam insülin dozu (ünite)', t: 'num', ph: 'örn. 40' },
      { k: 'ikh', l: 'İ:KH oranı (hekim verdiyse; 1 Ü / … g)', t: 'num', ph: '500 kuralından hesaplanır', opt: true },
      { k: 'idf', l: 'Düzeltme faktörü (hekim verdiyse; mg/dL)', t: 'num', ph: '1800 kuralından hesaplanır', opt: true },
      { k: 'kh', l: 'Öğündeki karbonhidrat (g)', t: 'num', ph: '', opt: true },
      { k: 'bg', l: 'Ölçülen kan şekeri (mg/dL)', t: 'num', ph: '', opt: true },
      { k: 'hedef', l: 'Hedef kan şekeri (mg/dL)', t: 'num', ph: '100', opt: true }
    ],
    req: [],
    run(v) {
      const elle = (v.ikh > 0) || (v.idf > 0);
      if (!(v.gtid > 0) && !elle) return { err: 'Günlük toplam insülin dozunu ya da hekimin verdiği İ:KH oranını gir.' };
      const ikh = v.ikh > 0 ? v.ikh : 500 / v.gtid;
      const idf = v.idf > 0 ? v.idf : 1800 / v.gtid;
      const rows = [
        { l: 'İ:KH oranı' + (v.ikh > 0 ? '' : ' (500 kuralı)'), v: '1 Ü / ' + fmt(ikh, 1) + ' g KH',
          s: v.ikh > 0 ? 'Hekimin verdiği değer kullanıldı' : '500 ÷ ' + fmt(v.gtid, 0) + ' — 1 ünite hızlı etkili insülin bu kadar karbonhidratı karşılar', hl: true },
        { l: 'Düzeltme faktörü' + (v.idf > 0 ? '' : ' (1800 kuralı)'), v: fmt(idf, 0) + ' mg/dL',
          s: v.idf > 0 ? 'Hekimin verdiği değer kullanıldı' : '1800 ÷ ' + fmt(v.gtid, 0) + ' — 1 ünite kan şekerini bu kadar düşürür', hl: true }
      ];

      let ogun = NaN, duzeltme = NaN;
      if (isFinite(v.kh) && v.kh > 0) {
        ogun = v.kh / ikh;
        rows.push({ l: 'Öğün bolusu', v: fmt(ogun, 1) + ' Ü', s: fmt(v.kh, 0) + ' g KH ÷ ' + fmt(ikh, 1) + ' · ' + fmt(v.kh / 15, 1) + ' KH değişimi' });
      }
      const hedef = isFinite(v.hedef) ? v.hedef : 100;
      if (isFinite(v.bg)) {
        duzeltme = (v.bg - hedef) / idf;
        rows.push({ l: 'Düzeltme dozu', v: fmt(duzeltme, 1) + ' Ü', s: '(' + fmt(v.bg, 0) + ' − ' + fmt(hedef, 0) + ') ÷ ' + fmt(idf, 0) + (duzeltme < 0 ? ' — negatif: doz düşürülür' : '') });
      }
      if (isFinite(ogun) || isFinite(duzeltme)) {
        const tot = (isFinite(ogun) ? ogun : 0) + (isFinite(duzeltme) ? duzeltme : 0);
        rows.push({ l: 'Toplam bolus', v: fmt(Math.max(0, tot), 1) + ' Ü', s: tot < 0 ? 'Hesap negatif çıktı; hekim planına göre değerlendirilir' : 'Öğün + düzeltme', hl: true });
      }

      let note = 'Bu hesap yalnızca eğitim amaçlıdır. İ:KH oranı ve düzeltme faktörü hastaya özeldir, hekim tarafından belirlenir ve izlemle değiştirilir; insülin dozu bu sonuca göre uygulanmaz.';
      let tone = 'warn';
      if (isFinite(v.bg) && v.bg < 70) { note = 'Kan şekeri 70 mg/dL altında — hipoglisemi. Önce 15 g hızlı karbonhidrat verilir, 15 dakika sonra tekrar ölçülür (15-15 kuralı). ' + note; tone = 'bad'; }
      return { rows, note, tone };
    }
  });
})();
