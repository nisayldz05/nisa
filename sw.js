const CACHE_NAME = 'mia-coffee-v10-final-fix';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&display=swap',
    'https://unpkg.com/@phosphor-icons/web'
];

self.addEventListener('install', event => {
    self.skipWaiting(); // Force the new service worker to become the active one immediately
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', event => {
    // Delete old caches that don't match the current CACHE_NAME
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take control of all clients immediately
    );
});

self.addEventListener('fetch', event => {
    // For HTML requests, try the network first, then fall back to cache
    // This triggers a fresh load for page content updates
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Update the cache with the fresh version
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        // For other assets (CSS, Images), use cache first, then network
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
        );
    }
});
