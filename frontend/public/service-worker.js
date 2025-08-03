const CACHE_NAME = 'qr-photo-app-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html'
];

// Service Worker kurulum
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// Service Worker aktifleştirme
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch olayları için cache stratejisi
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache'de varsa cache'den döndür
        if (response) {
          return response;
        }

        // API çağrıları için network-first stratejisi
        if (event.request.url.includes('/api/')) {
          return fetch(event.request)
            .then(response => {
              // Response'u clone et çünkü stream sadece bir kez kullanılabilir
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            })
            .catch(() => {
              // Network başarısız olursa cache'den dön
              return caches.match(event.request);
            });
        }

        // Diğer tüm istekler için cache-first stratejisi
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Network başarısız olursa offline sayfasını göster
            if (event.request.destination === 'document') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Background sync için (opsiyonel)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Background sync işlemleri buraya eklenebilir
  console.log('Background sync triggered');
}

// Push notification için (opsiyonel)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Yeni bildirim',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('QR Photo App', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});