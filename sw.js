// sw.js
// [중요] 버전 업데이트: v162
// [주의] 아래 ?v= 쿼리는 index.html에서 로드하는 버전과 항상 일치해야 합니다.
const CACHE_NAME = 'faiths-v162';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css?v=153',
    './script.js?v=158',
    './playlist.js?v=150',
    './manifest.json',
    './icon/0.png',
    './icon/11.png',
    './icon/12.png', // BINGO 아이콘 추가
    './ad/01.png',
    './cards.css?v=150',
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
    // cache.put은 GET 요청만 지원하므로 그 외 메서드는 건드리지 않음
    if (event.request.method !== 'GET') {
        return;
    }

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
                caches.open(CACHE_NAME)
                    .then((cache) => cache.put(event.request, responseToCache))
                    .catch(() => {});
                return response;
            })
            .catch(async () => {
                const cached = await caches.match(event.request);
                if (cached) return cached;
                // 오프라인 상태의 페이지 이동은 캐시된 index.html로 폴백
                if (event.request.mode === 'navigate') {
                    const fallback = await caches.match('./index.html');
                    if (fallback) return fallback;
                }
                return Response.error();
            })
    );
});