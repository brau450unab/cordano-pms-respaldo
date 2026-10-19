// Cordano PMS Service Worker - Versión Canónica v2.0.0 Master Release
// Offline Resilience for POS Garita & Subterráneo (Serrano 447, Iquique)
const CACHE_NAME = 'cordano-pms-cache-v2.0.0';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/logo.svg',
];

self.addEventListener('install', (event) => {
  // Forzar activación inmediata del nuevo Service Worker sin esperar cierre de pestañas
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW v2.0.0] Error precacheando assets:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  // Purgar inmediatamente todas las cachés anteriores (v1, etc.)
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW v2.0.0] Eliminando caché obsoleta:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Ignorar peticiones a Firebase, APIs remotas de sync y extensiones
  if (
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('identitytoolkit.googleapis.com') ||
    event.request.url.includes('googleapis.com') ||
    event.request.url.startsWith('chrome-extension://')
  ) {
    return;
  }

  // 1. ESTRATEGIA NETWORK-FIRST PARA NAVEGACIÓN (HTML / Páginas principales)
  // Garantiza que el usuario SIEMPRE reciba la última versión publicada si hay conexión.
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback offline a index.html en caché
          return caches.match('/index.html').then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // 2. ESTRATEGIA STALE-WHILE-REVALIDATE O CACHE-FIRST PARA ASSETS ESTÁTICOS CON HASH
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (event.request.destination === 'script' ||
              event.request.destination === 'style' ||
              event.request.destination === 'image' ||
              event.request.destination === 'font')
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Si falla red y no hay caché, retornar respuesta vacía o fallback
          return new Response('Offline resource not available', { status: 503 });
        });
    })
  );
});
