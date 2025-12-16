const CACHE_NAME = 'faiths-v106'; /* 버전 업 */

const urlsToCache = [
  './',
  './index.html',
  './style.css?v=106',
  './script.js?v=106',
  './playlist.js?v=102',
  './manifest.json',
  './icon/0.png',
  './icon/1.png',
  './icon/2.png',
  './icon/3.png',
  './icon/4.png',
  './icon/5.png',
  './icon/6.png',
  './icon/7.png',
  './icon/8.png',
  './icon/9.png',
  './icon/10.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
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

self.addEventListener('activate', event => {
  self.clients.claim();
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});