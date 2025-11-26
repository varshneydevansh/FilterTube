// FilterTube Service Worker - Cache all pages for instant loading
const CACHE_NAME = 'filtertube-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/kids.html',
    '/ml.html',
    '/mobile.html',
    '/css/style.css',
    '/js/script.js',
    '/assets/images/logo.png',
    // Add CDN resources
    'https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/chrome/chrome_24x24.png',
    'https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/edge/edge_24x24.png',
    'https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/brave/brave_24x24.png',
    'https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/opera/opera_24x24.png',
    'https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/firefox/firefox_48x48.png',
    'https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/chrome/chrome_48x48.png',
    'https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/edge/edge_48x48.png',
    'https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/brave/brave_48x48.png',
    'https://cdnjs.cloudflare.com/ajax/libs/browser-logos/74.1.0/opera/opera_48x48.png'
];

// Install event - cache all resources
self.addEventListener('install', event => {
    console.log('[FilterTube SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[FilterTube SW] Caching all pages and assets');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[FilterTube SW] Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[FilterTube SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache first (instant), then network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response instantly
                if (response) {
                    console.log('[FilterTube SW] Serving from cache:', event.request.url);
                    return response;
                }

                // Not in cache - fetch from network
                console.log('[FilterTube SW] Fetching from network:', event.request.url);
                return fetch(event.request).then(response => {
                    // Don't cache if not a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    // Add to cache for next time
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                });
            })
    );
});
