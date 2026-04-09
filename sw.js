// --- CONFIGURATION DU CACHE ---
// Change ce numéro (v5.3.3 -> v5.3.4) à chaque fois que tu modifies ton index.html
const CACHE_NAME = 'mka-shop-v5.4.4'; 

const assets = [
  './',
  './index.html',
  './icon.png',      
  './manifest.json'  
];

// 1. INSTALLATION : Mise en cache des fichiers pour le mode hors-ligne
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('MKA Shop : Mise en cache des ressources (Nouvelle Version)...');
      return cache.addAll(assets);
    })
  );
  // Force l'activation immédiate sans attendre la fermeture de l'onglet
  self.skipWaiting();
});

// 2. ACTIVATION : Suppression automatique des anciens caches (Nettoyage)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('MKA Shop : Suppression de l\'ancienne version du cache :', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // Prend le contrôle de la page immédiatement
  self.clients.claim();
});

// 3. STRATÉGIE DE CHARGEMENT : Cache d'abord, puis Réseau
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      // Si le fichier est en cache, on le donne, sinon on va sur internet
      return res || fetch(e.request).catch(() => {
        console.log("MKA Shop : Mode hors-ligne actif pour cette ressource");
      });
    })
  );
});


