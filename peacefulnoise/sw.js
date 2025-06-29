// A unique name for your cache
const CACHE_NAME = 'fantasy-cave-cache-v1';

// The list of files to be cached
const urlsToCache = [
  '/',
  'index.html',
  'style.css',
  'app.js',
  'https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Orbitron:wght@400;700&display=swap'
  // NOTE: You will need to create 'icon-192.png' and 'icon-512.png' and place them in the same folder.
];

// Install the service worker and cache the files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Serve cached content when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
