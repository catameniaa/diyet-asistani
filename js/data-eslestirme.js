/* TÜBER 2022 — Ek 3.3.1: Beslenme örüntülerinin enerji düzeylerinin yaş, cinsiyet ve
   fiziksel aktivite durumuna göre enerji gereksinimleri ile eşleştirilmesi (s. 293) */
(function () {
  'use strict';

  DA.data.eslestirme = {
    src: 'TÜBER 2022, Ek 3.3.1 (s. 293)',
    grup: [['Çocuk ve adölesanlar', 'c'], ['Yetişkinler', 'y']],
    pal: [['Az aktif', 1.4], ['Orta aktif', 1.6], ['Aktif', 1.8]],
    /* kcal: { c: [azAktif, ortaAktif, aktif], y: [azAktif, ortaAktif, aktif] } — null = boş hücre */
    r: [
      { k: 1000, c: ['E: 2 yaş\nK: 2-3 yaş', null, null], y: [null, null, null] },
      { k: 1200, c: ['E: 3-5 yaş\nK: 4-6 yaş', null, null], y: [null, null, null] },
      { k: 1400, c: ['E: 6-7 yaş\nK: 7-9 yaş', 'E: 4-5 yaş\nK: 5-6 yaş', null], y: ['K: >70 yaş', null, null] },
      { k: 1600, c: ['E: 8-9 yaş\nE: 10 yaş\nK: 10-11 yaş', 'E: 6-7 yaş\nK: 7-9 yaş', 'E: 5 yaş\nK: 5-6 yaş'],
        y: ['K: 40-69 yaş', 'K: >70 yaş', null] },
      { k: 1800, c: ['E: 11-12 yaş\nK: 12-14 yaş', 'E: 8-10 yaş\nK: 10-11 yaş', 'E: 6-7 yaş\nK: 7-8 yaş'],
        y: ['K: 18-39 yaş\nE: >60 yaş', 'K: 40-69 yaş', 'K: >70 yaş'] },
      { k: 2000, c: ['E: 13 yaş\nK: 15-18 yaş', 'E: 11-12 yaş\nK: 12-14 yaş', 'E: 8-10 yaş\nK: 9-11 yaş'],
        y: ['E: 50-59 yaş', 'K: 19-39 yaş\nE: >70 yaş', 'K: 60-69 yaş'] },
      { k: 2200, c: ['E: 14 yaş', 'E: 13 yaş\nK: 15-18 yaş', 'E: 11 yaş\nK: 12-13 yaş'],
        y: ['E: 18-49 yaş', 'E: 60-69 yaş', 'K: 30-59 yaş'] },
      { k: 2400, c: ['E: 15-16 yaş', 'E: 14 yaş', 'E: 12 yaş\nK: 14-16 yaş'],
        y: [null, 'E: 30-59 yaş', 'E: >60 yaş\nK: 19-29 yaş'] },
      { k: 2600, c: ['E: 17-18 yaş', 'E: 15 yaş', 'E: 13 yaş\nK: 17-18 yaş'],
        y: [null, 'E: 19-29 yaş', 'E: 40-59 yaş'] },
      { k: 2800, c: [null, 'E: 16-17 yaş', 'E: 14 yaş'], y: [null, null, 'E: 19-39 yaş'] },
      { k: 3000, c: [null, 'E: 18 yaş', 'E: 15-16 yaş'], y: [null, null, null] },
      { k: 3200, c: [null, null, 'E: 17-18 yaş'], y: [null, null, null] }
    ],
    n: [
      'Çocuk ve adolesanlarda WHO-MGRS 2006-2007 medyan ve 85. persentil boy uzunluğu ve vücut ağırlıklarına göre; ' +
      'yetişkinlerde yaş grupları ve TBSA 2010 boy uzunluğu yüzdelik dilimlerine göre belirlenmiştir.',
      'Yetişkinlerde PAL’in tanımlandığı yaşam biçimi sınıflaması için Ek 4.8.3’e, sağlığı koruyan ve geliştiren ' +
      'fiziksel aktivite düzeyine ulaşma önerileri için Ek 4.8.4’e bakın.',
      'Toplam enerji harcamasına bağımlı enerji gereksinimlerinin hesaplanması için Tablo 10.2 ve 10.3’e bakın.'
    ]
  };
})();
