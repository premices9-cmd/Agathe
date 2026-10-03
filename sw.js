// ============================================================
// MKA SHOP - Service Worker V5.4.2
// Gère : Cache, Sync, Notifications, Rappels vocaux persistants
// ============================================================

const CACHE_NAME = 'mka-shop-v5.4.2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './logo.png'
];

// ============================================================
// 1. INSTALLATION : Mise en cache des fichiers statiques
// ============================================================
self.addEventListener('install', (event) => {
  console.log('🔧 MKA SW : Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('⚠️ Certains assets non mis en cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// ============================================================
// 2. ACTIVATION : Nettoyage des anciens caches
// ============================================================
self.addEventListener('activate', (event) => {
  console.log('✅ MKA SW : Activation');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('🗑️ Suppression ancien cache:', key);
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// ============================================================
// 3. STRATÉGIE DE FETCH : Réseau d'abord, Cache sinon
// ============================================================
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes Firebase
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('googleapis') ||
      event.request.url.includes('gstatic')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// ============================================================
// 4. SYNCHRONISATION EN ARRIÈRE-PLAN
// ============================================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    console.log('🔄 MKA SW : Synchronisation des données...');
    event.waitUntil(Promise.resolve());
  }
});

// ============================================================
// 5. GESTION DES MESSAGES DU CLIENT
// ============================================================
let reminderTimer = null;

self.addEventListener('message', (event) => {
  const data = event.data;
  
  if (!data || !data.type) return;

  // --- PROGRAMMER UN RAPPEL ---
  if (data.type === 'SCHEDULE_REMINDER') {
    console.log('📅 MKA SW : Programmation rappel dans', data.delay / 1000, 'secondes');
    
    // Annuler l'ancien timer
    if (reminderTimer) {
      clearTimeout(reminderTimer);
      reminderTimer = null;
    }

    const delay = data.delay || (5 * 60 * 1000);

    reminderTimer = setTimeout(() => {
      const title = data.title || '🔔 MKA Shop - Rappel';
      const body = data.body || 'Veuillez enregistrer les services effectués.';

      // Envoyer la notification système
      self.registration.showNotification(title, {
        body: body,
        icon: './icon.png',
        badge: './icon.png',
        tag: 'mka-reminder-' + Date.now(),
        renotify: true,
        requireInteraction: false,
        vibrate: [200, 100, 200, 100, 200],
        silent: false,
        data: {
          type: 'VOICE_REMINDER',
          timestamp: Date.now()
        }
      });

      console.log('🔔 MKA SW : Notification envoyée');

      // Envoyer un message à tous les clients ouverts pour jouer le son
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'PLAY_REMINDER_SOUND',
              message: body
            });
          });
        });

      // Reprogrammer automatiquement pour la prochaine fois
      if (data.autoRepeat !== false) {
        const nextDelay = data.delay || (5 * 60 * 1000);
        reminderTimer = setTimeout(() => {
          self.registration.showNotification(title, {
            body: body,
            icon: './icon.png',
            badge: './icon.png',
            tag: 'mka-reminder-' + Date.now(),
            renotify: true,
            vibrate: [200, 100, 200, 100, 200]
          });
          
          // Renvoyer un message aux clients
          self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clients => {
              clients.forEach(client => {
                client.postMessage({
                  type: 'PLAY_REMINDER_SOUND',
                  message: body
                });
              });
            });
        }, nextDelay);
      }
    }, delay);

    // Confirmer au client
    if (event.source) {
      event.source.postMessage({
        type: 'REMINDER_SCHEDULED',
        nextIn: delay / 1000
      });
    }
  }

  // --- ANNULER LE RAPPEL ---
  if (data.type === 'CANCEL_REMINDER') {
    console.log('🛑 MKA SW : Annulation du rappel');
    if (reminderTimer) {
      clearTimeout(reminderTimer);
      reminderTimer = null;
    }
    if (event.source) {
      event.source.postMessage({ type: 'REMINDER_CANCELLED' });
    }
  }

  // --- TEST IMMÉDIAT ---
  if (data.type === 'TEST_NOTIFICATION') {
    self.registration.showNotification('🧪 Test MKA Shop', {
      body: data.body || 'Test de notification',
      icon: './icon.png',
      badge: './icon.png',
      vibrate: [200, 100, 200]
    });
  }
});

// ============================================================
// 6. CLIC SUR NOTIFICATION
// ============================================================
self.addEventListener('notificationclick', (event) => {
  console.log('👆 MKA SW : Notification cliquée');
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si une fenêtre MKA Shop est déjà ouverte, la focus
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Sinon, en ouvrir une nouvelle
        if (self.clients.openWindow) {
          return self.clients.openWindow('./');
        }
      })
  );
});

// ============================================================
// 7. FERMETURE DE NOTIFICATION
// ============================================================
self.addEventListener('notificationclose', (event) => {
  console.log('❌ MKA SW : Notification fermée');
});