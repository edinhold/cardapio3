// Minimal Service Worker for PWA installability
const CACHE_NAME = 'menuflow-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // basic bypass for compliance
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
