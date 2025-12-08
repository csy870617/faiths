const CACHE_NAME = 'faiths-v20';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './icon/0.png',
  './icon/1.png',
  './icon/2.png',
  './icon/3.png'
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