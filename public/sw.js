// Service Worker for Dictionary Caching
const CACHE_NAME = 'dictionary-cache-v1';
const DICTIONARY_URL = '/dictionaries/CSW24.txt';

// Install event - cache the dictionary
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching dictionary...');
        return cache.add(DICTIONARY_URL);
      })
      .then(() => {
        console.log('Service Worker: Dictionary cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache dictionary:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached dictionary
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes(DICTIONARY_URL)) {
    console.log('Service Worker: Intercepting dictionary request');
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            console.log('Service Worker: Serving dictionary from cache');
            return response;
          }
          console.log('Service Worker: Dictionary not in cache, fetching from network');
          return fetch(event.request)
            .then((response) => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                  console.log('Service Worker: Dictionary cached for next time');
                });
              return response;
            });
        })
        .catch((error) => {
          console.error('Service Worker: Error serving dictionary:', error);
          return fetch(event.request);
        })
    );
  }
});

// Background sync for dictionary updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'update-dictionary') {
    console.log('Service Worker: Background sync - updating dictionary');
    event.waitUntil(
      fetch(DICTIONARY_URL)
        .then((response) => {
          if (response.ok) {
            return caches.open(CACHE_NAME)
              .then((cache) => cache.put(DICTIONARY_URL, response));
          }
        })
        .catch((error) => {
          console.error('Service Worker: Background sync failed:', error);
        })
    );
  }
});

// Message handling for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'UPDATE_DICTIONARY') {
    event.waitUntil(
      fetch(DICTIONARY_URL)
        .then((response) => {
          if (response.ok) {
            return caches.open(CACHE_NAME)
              .then((cache) => cache.put(DICTIONARY_URL, response));
          }
        })
        .then(() => {
          event.ports[0].postMessage({ type: 'DICTIONARY_UPDATED' });
        })
        .catch((error) => {
          console.error('Service Worker: Dictionary update failed:', error);
          event.ports[0].postMessage({ type: 'DICTIONARY_UPDATE_FAILED', error: error.message });
        })
    );
  }
});
