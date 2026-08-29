// Service Worker pour Notebook · Agathe my wife
const CACHE_NAME = 'agathe-notebook-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './logo.png'
];

// Installation : Mise en cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache ouvert avec succès');
        return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
          console.warn('[SW] Erreur de cache (certains fichiers peuvent manquer):', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activation : Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Interception des requêtes : Stratégie "Cache d'abord, puis réseau"
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si la ressource est dans le cache, on la retourne
        if (response) {
          return response;
        }

        // Sinon, on va chercher sur le réseau
        return fetch(event.request)
          .then((response) => {
            // On vérifie que la réponse est valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // On clone la réponse pour la mettre en cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Fallback hors ligne : retourner la page d'accueil pour les navigations
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            return new Response('Contenu non disponible hors ligne', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Gestion des notifications (optionnel)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Rappel de votre planning',
    icon: './logo.png',
    badge: './logo.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Voir le planning',
        icon: './logo.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('🔔 Notebook · Agathe', options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('./index.html')
    );
  } else {
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then((windowClients) => {
        if (windowClients.length > 0) {
          windowClients[0].focus();
        } else {
          clients.openWindow('./index.html');
        }
      })
    );
  }
});

// Gestion des messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});