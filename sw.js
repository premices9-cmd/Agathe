const CACHE_NAME = 'mka-shop-v5.3.0'; // Version mise à jour
const assets = [
  './',
  './index.html',
  './logo.png',      // Changé icon.png par logo.png
  './manifest.json'  // Ajouté pour que l'app soit stable hors-ligne
];

// Installation : on met les fichiers en cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('MKA Shop : Cache initialisé');
      return cache.addAll(assets);
    })
  );
});

// Stratégie : Répondre depuis le cache, sinon chercher sur le réseau
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});
