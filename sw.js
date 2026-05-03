const CACHE_NAME = 'butcem-v1';
const urlsToCache = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js'
];

// Uygulama kurulduğunda dosyaları hafızaya (cache) al
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

// İnternet yokken bile uygulamanın açılabilmesini sağla
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});