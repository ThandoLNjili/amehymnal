const CACHE_NAME = 'amec-hymnal-v1.0.1';
const STATIC_CACHE = 'amec-hymnal-static-v1.0.1';
const DATA_CACHE = 'amec-hymnal-data-v1.0.1';

const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './icons/ame-logo.svg',
    './icons/ame-logo.webp',
    './icons/amec-logo-192.png',
    './icons/amec-logo-512.png',
    './icons/simple-logo.svg'
];

const DATA_ASSETS = [
    './hymnal_xh.json',
    './hymnal_en.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then(cache => {
                return cache.addAll(STATIC_ASSETS);
            }),
            caches.open(DATA_CACHE).then(cache => {
                return cache.addAll(DATA_ASSETS);
            })
        ]).then(() => {
            return self.skipWaiting();
        }).catch(error => {
            console.error('Cache installation failed:', error);
        })
    );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Skip caching for unsupported schemes (chrome-extension, etc.)
    const isSupportedScheme = url.protocol === 'http:' || url.protocol === 'https:';
    
    // Early return for unsupported schemes to prevent any caching attempts
    if (!isSupportedScheme) {
        console.log('Skipping unsupported scheme:', url.protocol, 'for URL:', url.href);
        return;
    }

    // Handle data requests (JSON files) - cache first, network fallback
    if (url.pathname.includes('hymnal_data.json')) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    // If not in cache, fetch and cache
                    return fetch(event.request).then(networkResponse => {
                        // Only cache successful responses
                        if (networkResponse.status === 200 && isSupportedScheme) {
                            const responseClone = networkResponse.clone();
                            caches.open(DATA_CACHE).then(cache => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return networkResponse;
                    });
                })
                .catch(() => {
                    // If both cache and network fail, return offline page
                    return new Response(
                        JSON.stringify({
                            error: 'Offline',
                            message: 'Hymnal data is not available offline. Please check your internet connection.'
                        }),
                        {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                })
        );
        return;
    }

    // Handle static assets - cache first, network fallback
    if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset.replace('./', '/'))) ||
        event.request.destination === 'style' ||
        event.request.destination === 'script' ||
        event.request.destination === 'document' ||
        event.request.destination === 'image') {

        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request).then(networkResponse => {
                        // Cache successful responses for future use
                        if (networkResponse.status === 200 && isSupportedScheme) {
                            const responseClone = networkResponse.clone();
                            caches.open(STATIC_CACHE).then(cache => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return networkResponse;
                    }).catch(fetchError => {
                        console.error('Fetch failed for:', event.request.url, 'Error:', fetchError);
                        throw fetchError;
                    });
                }).catch(cacheError => {
                    console.error('Cache match failed for:', event.request.url, 'Error:', cacheError);
                    throw cacheError;
                })
        );
        return;
    }

    // For other requests, try network first, fallback to cache
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache successful responses
                if (response.status === 200 && isSupportedScheme) {
                    const responseClone = response.clone();
                    caches.open(STATIC_CACHE).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});

// Handle background sync for updates (if supported)
self.addEventListener('sync', event => {
    if (event.tag === 'update-hymnal-data') {
        event.waitUntil(updateHymnalData());
    }
});

async function updateHymnalData() {
    try {
        const response = await fetch('./hymnal_data.json');
        if (response.status === 200) {
            const cache = await caches.open(DATA_CACHE);
            await cache.put('./hymnal_data.json', response);
            console.log('Hymnal data updated in background');
        }
    } catch (error) {
        console.log('Background update failed:', error);
    }
}

// Handle messages from the main thread
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});