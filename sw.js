// sw.js
// [중요] 버전 업데이트: v147
const CACHE_NAME = 'faiths-v147'; 

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css?v=145',
    './script.js?v=145',
    './playlist.js?v=145', 
    './manifest.json',
    './icon/0.png', 
    './icon/11.png',
    './icon/12.png', // BINGO 아이콘 추가
    './ad/01.png',
    './ad.css?v=145',
];

// 1. 설치 (Install)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('파일을 캐싱하는 중...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// 2. 활성화 (Activate)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('구버전 캐시 삭제:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// 3. 요청 (Fetch)
self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith('http')) {
        return;
    }

    if (event.request.url.includes('youtube.com') || event.request.url.includes('googlevideo.com')) {
        return; 
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});