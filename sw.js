const CACHE_NAME = 'mka-shop-v5.3.0'; // Version mise à jour
const assets = [
  './',
  './index.html',
  './icon.png',      // Corrigé : Utilise icon.png
  './manifest.json'  
];

// 1. Installation : on met les fichiers essentiels en cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('MKA Shop V5.3.0 : Mise en cache des ressources...');
      return cache.addAll(assets);
    })
  );
  // Force le nouveau Service Worker à s'activer immédiatement
  self.skipWaiting();
});

// 2. Activation : Nettoyage des anciennes versions du cache
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('MKA Shop : Suppression de l\'ancien cache :', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // Prend le contrôle des pages immédiatement
  self.clients.claim();
});

// 3. Stratégie réseau : Répondre depuis le cache, sinon chercher sur le réseau
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).catch(() => {
        // Optionnel : Retourner une page d'erreur si hors-ligne total et non en cache
        console.log("MKA Shop : Ressource non trouvée hors-ligne");
      });
    })
  );
});

