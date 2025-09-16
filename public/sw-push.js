// Service Worker for Push Notifications
// This file should be placed in the public folder as sw-push.js

const CACHE_NAME = 'wordcraft-push-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Push service worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Push service worker activated');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'WordSmith', body: event.data.text() };
    }
  }
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/og-image.png',
    badge: '/og-image.png',
    tag: data.tag || 'wordsmith-notification',
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'WordSmith', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // Open the app
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'notification-sync') {
    console.log('Background sync for notifications');
    // Handle any offline notification logic here
  }
});
