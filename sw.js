const CACHE_NAME = 'mka-shop-v5.3.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
  // Ajoutez ici vos fichiers CSS ou JS locaux si vous en avez
];

// 1. Installation : Mise en cache des fichiers statiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activation : Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. Stratégie de Fetch : Réseau d'abord, Cache sinon
// Cela permet de toujours tenter d'avoir les données Firebase fraîches
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// 4. Synchronisation en arrière-plan (Background Sync)
// S'active quand la connexion revient après une coupure
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(
      // Ici, le navigateur tente de relancer les requêtes Firebase en attente
      console.log("🔄 Synchronisation des données en cours...")
    );
  }
});

// 5. Gestion des notifications (Optionnel pour vos alertes)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('./'));
});
