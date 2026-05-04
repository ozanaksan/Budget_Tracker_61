const CACHE_NAME = 'butcem-v2'; // Sürümü güncelledik (Bir dahakine v3 yapmalısın)
const urlsToCache = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js'
];

// 1. KURULUM (Install): Yeni dosyaları hafızaya al
self.addEventListener('install', event => {
    // YENİ: Yeni sürüm geldiğinde beklemeden hemen kuruluma geç
    self.skipWaiting(); 
    
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

// 2. AKTİVASYON (Activate): Eski sürümleri (butcem-v1) sil ve telefonu temizle
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Eğer hafızadaki isim mevcut sürümle eşleşmiyorsa (örn: v1 ise), sil!
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eski önbellek silindi:', cacheName);
                        return caches.delete(cacheName); 
                    }
                })
            );
        }).then(() => self.clients.claim()) // YENİ: Kontrolü anında ele al, sekmelerin yenilenmesini bekleme
    );
});

// 3. GETİRME (Fetch): İnternet yokken bile uygulamanın açılabilmesini sağla
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});