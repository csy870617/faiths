// sw.js
// [중요] 버전 업데이트: v140
const CACHE_NAME = 'faiths-v140'; 

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css?v=140',
    './script.js?v=140',
    './playlist.js?v=140', 
    './manifest.json',
    './icon/0.png', 
    './icon/11.png',
    './ad/01.png',
    './ad.css?v=140',
    // 필요한 이미지나 아이콘 경로를 여기에 추가하세요
];

// 1. 설치 (Install): 캐시 저장
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('파일을 캐싱하는 중...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    // 대기하지 않고 즉시 활성화
    self.skipWaiting();
});

// 2. 활성화 (Activate): 구버전 캐시 삭제
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
    // 모든 탭에서 즉시 제어권 가져오기
    return self.clients.claim();
});

// 3. 요청 (Fetch): 네트워크 우선, 실패 시 캐시 사용 (항상 최신 버전 유지 전략)
self.addEventListener('fetch', (event) => {
    // 유튜브나 외부 링크는 캐싱하지 않고 바로 네트워크로 연결
    if (event.request.url.includes('youtube.com') || event.request.url.includes('googlevideo.com')) {
        return; 
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // 네트워크 요청 성공 시: 캐시를 최신 버전으로 업데이트하고 응답 반환
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
                // 네트워크 실패(오프라인) 시: 캐시된 내용 반환
                return caches.match(event.request);
            })
    );
});