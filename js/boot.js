/* Başlatma: ikonlar, ilk çizim, çevrimdışı çalışma (service worker) */
(function () {
  'use strict';
  const { icon, $ } = DA;
  $('#gearBtn').innerHTML = icon('gear');
  $('#backBtn').innerHTML = icon('back');
  $('#searchBtn').innerHTML = icon('search');
  $('#favBtn').innerHTML = icon('star');
  const tabs = { ana: ['home', 'Ana Sayfa'], hesapla: ['calc', 'Hesapla'], besin: ['apple', 'Besin'], danisan: ['users', 'Danışan'], referans: ['book', 'Referans'] };
  Object.keys(tabs).forEach((k) => { $('#tabs a[data-tab="' + k + '"]').innerHTML = icon(tabs[k][0]) + '<span>' + tabs[k][1] + '</span>'; });

  if (!location.hash) history.replaceState(null, '', '#/ana');
  DA.render(false);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }
  // kalıcı depolama iste (tarayıcı verileri silmesin)
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
})();
