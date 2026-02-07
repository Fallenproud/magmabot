// MagmaBot Service Worker
const CACHE_NAME = 'magmabot-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                './',
                './index.html',
                './favicon.svg',
                './manifest.json'
            ]);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Simple network-first strategy for API, cache-first for static could be added here
    // For now, we mainly want the PWA installability, so we just pass through
    // but handle offline fallback if needed.
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
