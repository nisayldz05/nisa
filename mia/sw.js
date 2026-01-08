const CACHE_NAME = 'mia-coffee-v12-icon-fix';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&display=swap',
    'https://unpkg.com/@phosphor-icons/web'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
