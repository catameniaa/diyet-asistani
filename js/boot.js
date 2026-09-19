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
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then((reg) => {
        DA._sw = reg;
        if (reg.waiting && navigator.serviceWorker.controller) DA.showUpdate();
        /* Zaten bu sürüm çalışıyorken yenisi inerse kullanıcıya haber ver */
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) DA.showUpdate();
          });
        });
      }).catch(() => {});
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return; reloaded = true; location.reload();
      });
    });
  }
  // kalıcı depolama iste (tarayıcı verileri silmesin)
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
})();
