// script.js - v165 (파이어베이스 세션이 남아있으면 팝업 없이 자동으로 로그인 상태 표시)

// 1. 전역 변수 및 함수 선언 (ReferenceError 방지)
let player;
let isPlayerReady = false;
let pendingPlay = null;
let wakeLock = null;
let currentCategory = null;
let lastVideoUrl = null;
// 모달을 중첩해서 열 수 있으므로(예: 플레이어 위에 쿠키 가이드) 단일 변수 대신
// 스택으로 관리한다. 뒤로가기/배경탭은 항상 "맨 위 모달"만 닫는다.
let modalStack = [];
// 닫기 버튼이 history 균형을 맞추려 호출하는 history.back()의 popstate가
// 그 아래 모달까지 닫아버리지 않도록 1회 무시하기 위한 플래그.
let suppressPopstateClose = false;

// localStorage에 손상된 JSON이 있어도 앱이 멈추지 않도록 안전하게 파싱
function safeParseJSON(value, fallback) {
    if (value === null || value === undefined) return fallback;
    try {
        const parsed = JSON.parse(value);
        return parsed === null ? fallback : parsed;
    } catch (e) {
        return fallback;
    }
}

// 인앱 브라우저 탈출
(function() {
    const userAgent = navigator.userAgent.toLowerCase();
    const targetUrl = location.href;
    if (userAgent.match(/kakaotalk|line|instagram|facebook/i)) {
        if (userAgent.match(/android/i)) {
            location.href = 'intent://' + targetUrl.replace(/https?:\/\//i, '') + '#Intent;scheme=https;package=com.android.chrome;end';
        } else if (userAgent.match(/iphone|ipad|ipod/i)) {
            console.log('아이폰 인앱 브라우저 감지');
        }
    }
})();

// WakeLock 함수 (전역)
const requestWakeLock = async () => {
    try {
        if (!('wakeLock' in navigator)) return;
        if (wakeLock) return; // 이미 활성 상태면 중복 요청하지 않음(센티넬 누수 방지)
        wakeLock = await navigator.wakeLock.request('screen');
        // 브라우저가 탭 전환 등으로 자동 해제하면 참조를 비워 재요청이 가능하도록 함
        wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch (e) {}
};
const releaseWakeLock = async () => { try { if (wakeLock) { await wakeLock.release(); wakeLock = null; } } catch (e) {} };

// 유튜브 API 콜백
window.onYouTubeIframeAPIReady = function() {
    const origin = window.location.origin;
    if (player) return;
    
    const container = document.getElementById('youtube-player');
    if (!container) return;

    player = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        host: 'https://www.youtube.com',
        playerVars: { 
            'playsinline': 1, 
            'rel': 0, 
            'modestbranding': 1, 
            'controls': 1, 
            'origin': origin, 
            'widget_referrer': window.location.href, 
            'enablejsapi': 1, 
            'autoplay': 0, 
            'disablekb': 1 
        },
        events: { 'onReady': onPlayerReady, 'onStateChange': onPlayerStateChange }
    });
};

function onPlayerReady(event) {
    isPlayerReady = true;
    const iframe = document.getElementById('youtube-player');
    if (iframe) {
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    }
    if (pendingPlay) { 
        playRandomVideo(pendingPlay.category, pendingPlay.title); 
        pendingPlay = null; 
    }
}

function onPlayerStateChange(event) {
    const playPauseBtn = document.getElementById('mini-play-pause');
    if (playPauseBtn) {
        if (event.data == YT.PlayerState.PLAYING) { playPauseBtn.innerText = "⏸"; } else { playPauseBtn.innerText = "▶"; }
    }
}

function getYouTubeIdInfo(url) {
    if (!url) return null;
    const listMatch = url.match(/[?&]list=([^#&?]+)/);
    if (listMatch) return { type: 'playlist', id: listMatch[1] };
    const videoMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|shorts\/|live\/|v\/|watch\?.*v=))([^#&?\/]+)/);
    if (videoMatch && videoMatch[1]) return { type: 'video', id: videoMatch[1] };
    return null;
}

// 재생 함수
window.playRandomVideo = (category, title) => {
    const ccmMenuView = document.getElementById('ccm-menu-view');
    const ccmPlayerView = document.getElementById('ccm-player-view');
    const playerTitle = document.getElementById('player-title');

    if (!player && window.YT && window.YT.Player) {
        window.onYouTubeIframeAPIReady();
    }

    if (typeof CCM_PLAYLIST !== 'undefined' && CCM_PLAYLIST[category]) {
        const list = CCM_PLAYLIST[category];
        let availableList = list.filter(url => url !== lastVideoUrl);
        if (availableList.length === 0) availableList = list;
        const randomUrl = availableList[Math.floor(Math.random() * availableList.length)];
        const idInfo = getYouTubeIdInfo(randomUrl);

        // URL 파싱에 실패하면 플레이어 화면으로 전환하지 않고 여기서 바로 중단한다.
        // (전환 이후에 실패를 알아채면 화면 꺼짐 방지만 켜진 빈 플레이어가 남는다)
        if (!idInfo) { alert("재생 목록이 없습니다."); return; }

        lastVideoUrl = randomUrl;

        if(playerTitle && title) playerTitle.innerText = title;
        if(ccmMenuView) ccmMenuView.style.display = 'none';
        if(ccmPlayerView) ccmPlayerView.style.display = 'block';
        requestWakeLock();

        if (player && isPlayerReady) {
            if (idInfo.type === 'playlist') { player.loadPlaylist({list: idInfo.id, listType: 'playlist'}); }
            else { player.loadVideoById(idInfo.id); }
        } else {
            console.log("Player not ready. Queuing...");
            pendingPlay = { category: category, title: title };
        }
    } else { alert("재생 목록이 없습니다."); }
};

// DOM 로드 후 실행
document.addEventListener('DOMContentLoaded', () => {
    
    const cardSlider = document.getElementById('card-slider');
    if (cardSlider) {
        cardSlider.addEventListener('wheel', (evt) => {
            evt.preventDefault();
            cardSlider.scrollLeft += evt.deltaY;
        }, { passive: false });
    }

    if (window.YT && window.YT.Player && !player) {
        window.onYouTubeIframeAPIReady();
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch((err) => {
            console.log('서비스워커 등록 실패:', err);
        });
        // 새 서비스워커 활성화 시 1회만 새로고침 (중복/무한 리로드 방지)
        let isRefreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (isRefreshing) return;
            isRefreshing = true;
            window.location.reload();
        });
    }

    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => { loadingScreen.style.display = 'none'; }, 400);
        }, 400); 
    }

    try { if (!Kakao.isInitialized()) Kakao.init('b5c055c0651a6fce6f463abd18a9bdc7'); } catch (e) {}

    // 앱 내 브라우저 로직
    const internalBrowser = document.getElementById('internal-browser');
    const browserContentArea = document.getElementById('browser-content-area');
    const browserUrlText = document.getElementById('browser-url-text'); 
    const browserHeader = document.getElementById('browser-header-bar');
    const floatingCloseBtn = document.getElementById('floating-close-btn-right');
    
    // 네비게이션 버튼
    const navBack = document.getElementById('nav-back');
    const navForward = document.getElementById('nav-forward');
    const navReload = document.getElementById('nav-reload');
    const navHome = document.getElementById('nav-home');

    // 내부 브라우저를 연 직후의 history 길이. 앱(iframe) 내부 이동으로 쌓인 history를
    // 닫을 때 한 번에 정리하기 위해 사용한다.
    let browserHistoryStart = null;

    function openInternalBrowser(url, mode = 'default') {
        if (!internalBrowser || !browserContentArea) { window.open(url, '_blank'); return; }
        
        if (mode === 'bible') {
            if(browserHeader) browserHeader.style.display = 'flex';
            if(floatingCloseBtn) floatingCloseBtn.style.display = 'none';
            if(browserUrlText) browserUrlText.innerText = url;
        } else {
            if(browserHeader) browserHeader.style.display = 'none';
            if(floatingCloseBtn) {
                floatingCloseBtn.style.display = 'flex';
                applyCloseBtnPosition(safeParseJSON(sessionStorage.getItem('closeBtnPos'), null));
            }
        }

        browserContentArea.innerHTML = '';
        const loadingBox = document.createElement('div');
        loadingBox.className = 'loading-icon-box';
        const loadingImg = document.createElement('img');
        loadingImg.src = 'icon/0.png';
        loadingImg.className = 'loading-icon';
        loadingBox.appendChild(loadingImg);
        browserContentArea.appendChild(loadingBox);

        const newIframe = document.createElement('iframe');
        newIframe.id = 'browser-frame';
        newIframe.src = url;
        newIframe.frameBorder = '0';
        newIframe.style.width = '100%';
        newIframe.style.height = '100%';
        newIframe.style.background = '#fff';
        newIframe.style.opacity = '0'; 
        newIframe.style.transition = 'opacity 0.3s ease';

        newIframe.onload = function() {
            if (browserContentArea.contains(loadingBox)) { loadingBox.remove(); }
            newIframe.style.opacity = '1';
        };
        browserContentArea.appendChild(newIframe);
        internalBrowser.classList.add('show');
        history.pushState({ browserOpen: true }, null, "");
        // pushState 직후의 history 길이 기록. 이후 iframe 내부 이동마다 길이가 늘어난다.
        browserHistoryStart = history.length;
    }

    function closeInternalBrowser() {
        if (internalBrowser && internalBrowser.classList.contains('show')) {
            internalBrowser.classList.remove('show');
            setTimeout(() => { if(browserContentArea) browserContentArea.innerHTML = ''; }, 300);
            // 앱(iframe) 내부에서 이동하며 쌓인 history 항목 + browserOpen 항목까지
            // 한 번에 되돌려, 홈으로 돌아온 뒤 뒤로가기를 여러 번 눌러야 하는 문제를 막는다.
            if (browserHistoryStart !== null) {
                const steps = (history.length - browserHistoryStart) + 1;
                browserHistoryStart = null;
                if (steps > 0) history.go(-steps);
            } else if (history.state && history.state.browserOpen) {
                history.back();
            }
        }
    }

    // 네비게이션 버튼 이벤트
    if (navBack) {
        navBack.onclick = () => {
            const iframe = document.getElementById('browser-frame');
            if(iframe && iframe.contentWindow) {
                try { iframe.contentWindow.history.back(); } catch(e) { console.log('Cross-origin restriction'); }
            }
        };
    }
    if (navForward) {
        navForward.onclick = () => {
            const iframe = document.getElementById('browser-frame');
            if(iframe && iframe.contentWindow) {
                try { iframe.contentWindow.history.forward(); } catch(e) { console.log('Cross-origin restriction'); }
            }
        };
    }
    if (navReload) {
        navReload.onclick = () => {
            const iframe = document.getElementById('browser-frame');
            if(iframe) { iframe.src = iframe.src; }
        };
    }
    if (navHome) {
        navHome.onclick = () => { closeInternalBrowser(); };
    }
    
    // 닫기 버튼: 짧게 탭하면 닫고, 끌면 위치 이동(위치는 저장하여 다음에 복원)
    const clampCloseBtn = (left, top) => {
        if (!floatingCloseBtn) return { left: left, top: top };
        const maxLeft = Math.max(0, window.innerWidth - floatingCloseBtn.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - floatingCloseBtn.offsetHeight);
        return { left: Math.min(Math.max(0, left), maxLeft), top: Math.min(Math.max(0, top), maxTop) };
    };
    const applyCloseBtnPosition = (pos) => {
        if (!floatingCloseBtn) return;
        if (pos && typeof pos.left === 'number' && typeof pos.top === 'number') {
            const c = clampCloseBtn(pos.left, pos.top);
            floatingCloseBtn.classList.add('dragged');
            floatingCloseBtn.style.left = c.left + 'px';
            floatingCloseBtn.style.top = c.top + 'px';
            floatingCloseBtn.style.bottom = 'auto';
            floatingCloseBtn.style.right = 'auto';
        } else {
            // 저장된 위치가 없으면 기본값(하단 중앙)으로 되돌린다(인라인 스타일 제거)
            floatingCloseBtn.classList.remove('dragged');
            floatingCloseBtn.style.left = '';
            floatingCloseBtn.style.top = '';
            floatingCloseBtn.style.bottom = '';
            floatingCloseBtn.style.right = '';
        }
    };

    if (floatingCloseBtn) {
        let cbDragging = false, cbMoved = 0, cbShiftX = 0, cbShiftY = 0, cbStart = { x: 0, y: 0 };
        let cbLastTouchTime = 0;   // 터치 직후 합성되는 마우스 이벤트를 무시하기 위한 시각
        let cbLastTapTime = 0;     // 더블탭 판정용 직전 탭 시각
        let cbCloseTimer = null;   // 옮겨진 상태에서 단일 탭 닫기를 지연시키는 타이머

        const cbStartDrag = (e) => {
            if (e.touches) { cbLastTouchTime = Date.now(); }
            else if (Date.now() - cbLastTouchTime < 600) { return; } // 합성 마우스 이벤트 무시
            cbDragging = true; cbMoved = 0;
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const cy = e.touches ? e.touches[0].clientY : e.clientY;
            cbStart = { x: cx, y: cy };
            const rect = floatingCloseBtn.getBoundingClientRect();
            cbShiftX = cx - rect.left; cbShiftY = cy - rect.top;
            floatingCloseBtn.style.transition = 'none';
            // 드래그 중 iframe이 마우스 이벤트를 가로채지 않도록 일시 비활성화
            const fr = document.getElementById('browser-frame');
            if (fr) fr.style.pointerEvents = 'none';
        };
        const cbOnDrag = (e) => {
            if (!cbDragging) return;
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const cy = e.touches ? e.touches[0].clientY : e.clientY;
            cbMoved = Math.max(cbMoved, Math.hypot(cx - cbStart.x, cy - cbStart.y));
            if (cbMoved > 3 && e.cancelable) e.preventDefault();
            const c = clampCloseBtn(cx - cbShiftX, cy - cbShiftY);
            floatingCloseBtn.classList.add('dragged');
            floatingCloseBtn.style.left = c.left + 'px';
            floatingCloseBtn.style.top = c.top + 'px';
            floatingCloseBtn.style.bottom = 'auto';
            floatingCloseBtn.style.right = 'auto';
        };
        const cbEndDrag = () => {
            if (!cbDragging) return;
            cbDragging = false;
            floatingCloseBtn.style.transition = '';
            const fr = document.getElementById('browser-frame');
            if (fr) fr.style.pointerEvents = '';

            if (cbMoved >= 6) { // 드래그 → 위치 저장
                const rect = floatingCloseBtn.getBoundingClientRect();
                // 세션 저장소를 사용해, 같은 실행 중에는 위치를 유지하되 앱을 껐다 켜면 초기화되게 한다
                sessionStorage.setItem('closeBtnPos', JSON.stringify({ left: rect.left, top: rect.top }));
                return;
            }

            // 거의 안 움직임 = 탭
            // 기본 위치에서는 즉시 닫고, 옮겨진 상태에서는 더블탭=초기화 / 단일탭=닫기로 구분
            if (!floatingCloseBtn.classList.contains('dragged')) {
                closeInternalBrowser();
                return;
            }
            const now = Date.now();
            if (now - cbLastTapTime < 300) {
                // 더블탭 → 기본(하단 중앙) 위치로 초기화
                if (cbCloseTimer) { clearTimeout(cbCloseTimer); cbCloseTimer = null; }
                cbLastTapTime = 0;
                sessionStorage.removeItem('closeBtnPos');
                applyCloseBtnPosition(null);
            } else {
                // 단일 탭: 더블탭이 이어질 수 있으니 잠깐 기다렸다 닫는다
                cbLastTapTime = now;
                cbCloseTimer = setTimeout(() => { cbCloseTimer = null; cbLastTapTime = 0; closeInternalBrowser(); }, 300);
            }
        };

        floatingCloseBtn.addEventListener('mousedown', cbStartDrag);
        floatingCloseBtn.addEventListener('touchstart', cbStartDrag, { passive: false });
        document.addEventListener('mousemove', cbOnDrag);
        document.addEventListener('touchmove', cbOnDrag, { passive: false });
        document.addEventListener('mouseup', cbEndDrag);
        document.addEventListener('touchend', cbEndDrag);
    }

    const listContainer = document.getElementById('main-list');
    let isDragging = false;

    // 저장된 순서(로컬 또는 클라우드 동기화)를 리스트에 적용한다.
    // 저장 순서에 없던(나중에 새로 추가된) 카드는 맨 위로 튀지 않도록
    // 원래 위치의 다음 카드 앞으로 되돌린다.
    const applyMenuOrder = (order) => {
        if (!listContainer || !Array.isArray(order)) return;
        const currentCards = Array.from(listContainer.children);
        const cardMap = {};
        currentCards.forEach(card => cardMap[card.id] = card);
        // 1) 저장된 순서대로 재배치
        order.forEach(id => { if (cardMap[id]) listContainer.appendChild(cardMap[id]); });
        // 2) 저장 순서에 없던 카드 보정
        const known = new Set(order);
        currentCards.forEach((card, i) => {
            if (known.has(card.id)) return;
            let ref = null;
            for (let j = i + 1; j < currentCards.length; j++) {
                if (currentCards[j].parentNode === listContainer) { ref = currentCards[j]; break; }
            }
            listContainer.insertBefore(card, ref);
        });
    };

    const savedOrder = safeParseJSON(localStorage.getItem('menuOrder'), null);
    applyMenuOrder(savedOrder);

    // Sortable CDN 로드 실패 시에도 나머지 기능은 정상 동작하도록 가드
    if (listContainer && typeof Sortable !== 'undefined') {
        new Sortable(listContainer, {
            animation: 150, delay: 200, delayOnTouchOnly: true, touchStartThreshold: 5,
            ghostClass: 'sortable-ghost', dragClass: 'sortable-drag',
            // 아이콘(grid) 모드의 2D 배치 + 모바일 터치에서도 재정렬이 안정적으로
            // 동작하도록 포인터 기반 폴백 드래그를 사용한다. (리스트 모드 동작은 동일)
            forceFallback: true, fallbackClass: 'sortable-fallback', fallbackTolerance: 5,
            onStart: function() { isDragging = true; },
            onEnd: function (evt) {
                setTimeout(() => { isDragging = false; }, 100);
                const order = [];
                const cards = listContainer.querySelectorAll('.list-card');
                cards.forEach(card => order.push(card.id));
                localStorage.setItem('menuOrder', JSON.stringify(order));
                if (window.scheduleSettingsSync) window.scheduleSettingsSync();
            }
        });
    }

    // 일부 브라우저(안드로이드/삼성·웨일 등)는 CSS 콜아웃을 무시하므로,
    // 카드 영역의 롱프레스 컨텍스트 메뉴(이미지 공유/저장 등)를 직접 차단한다.
    document.addEventListener('contextmenu', (e) => {
        if (e.target.closest && e.target.closest('.list-card, .card-slider')) e.preventDefault();
    });

    const viewListBtn = document.getElementById('view-list');
    const viewGridBtn = document.getElementById('view-grid');
    const shareTitle = document.querySelector('#card-share .text-box h3');

    const setViewMode = (mode) => {
        // 요소 하나라도 없으면 여기서 조용히 멈춘다. 이 가드가 없으면 예외가 던져져
        // DOMContentLoaded 콜백의 나머지 초기화(모달, 구글 로그인, 동기화 등)가 전부 실행되지 않는다.
        if (!listContainer || !viewGridBtn || !viewListBtn) return;
        if (mode === 'grid') {
            listContainer.classList.add('grid-view');
            viewGridBtn.classList.add('active'); viewListBtn.classList.remove('active');
            if(shareTitle) shareTitle.innerText = '친구 초대';
        } else {
            listContainer.classList.remove('grid-view');
            viewListBtn.classList.add('active'); viewGridBtn.classList.remove('active');
            if(shareTitle) shareTitle.innerText = '함께 성장할 친구 초대';
        }
        localStorage.setItem('viewMode', mode);
        if (window.scheduleSettingsSync) window.scheduleSettingsSync();
    };
    const savedViewMode = localStorage.getItem('viewMode') || 'list';
    setViewMode(savedViewMode);
    
    if (viewListBtn) viewListBtn.onclick = () => setViewMode('list');
    if (viewGridBtn) viewGridBtn.onclick = () => setViewMode('grid');

    const modalOverlay = document.getElementById('modal-overlay');
    const draggablePlayer = document.getElementById('draggable-player'); 
    const bibleModal = document.getElementById('bible-modal');
    const closeBibleModalBtn = document.getElementById('close-bible-modal');
    const iosModal = document.getElementById('ios-modal');
    const settingsModal = document.getElementById('settings-modal');
    const ccmMenuView = document.getElementById('ccm-menu-view');
    const ccmPlayerView = document.getElementById('ccm-player-view');
    const backToMenuBtn = document.getElementById('back-to-menu-btn');
    const shufflePlayBtn = document.getElementById('shuffle-play-btn');
    const floatModeBtn = document.getElementById('float-mode-btn'); 
    const maximizeOverlay = document.getElementById('maximize-overlay'); 
    const miniPlayPauseBtn = document.getElementById('mini-play-pause');
    const miniCloseBtn = document.getElementById('mini-close');
    
    const ccmBtn = document.getElementById('ccm-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const closeIosModalBtn = document.getElementById('close-ios-modal');
    const closeSettingsBtn = document.getElementById('close-settings-modal');
    const moodBtns = document.querySelectorAll('.mood-btn');
    const bibleLinkBtns = document.querySelectorAll('.bible-link-btn');

    const videoSettingsBtn = document.getElementById('video-settings-btn'); 
    const cookieGuideModal = document.getElementById('cookie-guide-modal');
    const closeCookieGuideBtn = document.getElementById('close-cookie-guide-btn');
    const settingsCookieGuideBtn = document.getElementById('settings-cookie-guide-btn');

    const pcDownloadCard = document.getElementById('pc-download-card');
    if (pcDownloadCard) {
        pcDownloadCard.onclick = async () => {
            const url = 'https://csy870617.github.io/faiths/';
            try {
                await navigator.clipboard.writeText(url);
                alert('PC 버전 주소가 복사되었습니다!\n\n' + url + '\n\nPC 브라우저 주소창에 붙여넣기 하세요.');
            } catch (err) {
                prompt('아래 주소를 복사해서 PC에서 접속하세요:', url);
            }
        };
    }

    moodBtns.forEach(btn => {
        btn.onclick = () => {
            const key = btn.getAttribute('data-key');
            const titleSpan = btn.querySelector('span:last-child');
            const title = titleSpan ? titleSpan.innerText : '';
            currentCategory = key;
            lastVideoUrl = null; 
            playRandomVideo(key, title); 
        };
    });

    // 성경 링크 클릭 시 외부 브라우저(새 창)로 열기
    bibleLinkBtns.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault(); 
            const link = btn.getAttribute('data-link');
            if(link) {
                handleCloseBtnClick(bibleModal); // 모달 닫기 + history 항목 정리
                window.open(link, '_blank'); // 외부 브라우저 호출
            }
        };
    });

    if (shufflePlayBtn) {
        shufflePlayBtn.onclick = () => {
            if (currentCategory) playRandomVideo(currentCategory, null);
        };
    }

    if (backToMenuBtn) {
        backToMenuBtn.onclick = () => {
            if(player && typeof player.stopVideo === 'function') player.stopVideo();
            if(ccmPlayerView) ccmPlayerView.style.display = 'none';
            if(ccmMenuView) ccmMenuView.style.display = 'block';
            releaseWakeLock(); 
        };
    }

    if (floatModeBtn) {
        floatModeBtn.onclick = () => {
            modalOverlay.classList.add('mini-mode');
            if (maximizeOverlay) maximizeOverlay.style.display = 'block';
        };
    }

    const openModal = (modal) => {
        if (!modal) return;
        if (!modalStack.includes(modal)) modalStack.push(modal);
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('show'));
        history.pushState({ modalOpen: true }, null, "");
    };

    const closeModal = (modal) => {
        if (!modal) return;
        modal.classList.remove('mini-mode');
        if (maximizeOverlay) maximizeOverlay.style.display = 'none';
        
        if(modal === modalOverlay && draggablePlayer) {
            draggablePlayer.style.top = ''; draggablePlayer.style.left = '';
            draggablePlayer.style.bottom = '20px'; draggablePlayer.style.right = '20px';
        }

        if (modal === modalOverlay) {
            if(player && typeof player.stopVideo === 'function') { player.stopVideo(); }
            releaseWakeLock(); 
            setTimeout(() => { if(ccmPlayerView) ccmPlayerView.style.display = 'none'; if(ccmMenuView) ccmMenuView.style.display = 'block'; }, 300);
        }
        if (modal.id === 'internal-browser') { closeInternalBrowser(); return; }

        // popstate에서 같은 모달이 중복으로 닫히지 않도록 스택에서 제거
        modalStack = modalStack.filter(m => m !== modal);
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    };

    const handleCloseBtnClick = (modal) => {
        closeModal(modal);
        // openModal이 쌓은 history 항목 1개를 되돌린다. 이때 발생하는 popstate는
        // 이미 닫기를 처리했으므로 아래 핸들러에서 1회 무시한다.
        if (history.state && (history.state.modalOpen || history.state.browserOpen)) {
            suppressPopstateClose = true;
            history.back();
        }
    };

    window.addEventListener('popstate', () => {
        if (internalBrowser && internalBrowser.classList.contains('show')) {
            // 기기 뒤로가기로 브라우저가 닫힐 때, 앱 내부 이동으로 남은 history도 함께 정리한다.
            const remaining = (browserHistoryStart !== null) ? (history.length - browserHistoryStart) : 0;
            internalBrowser.classList.remove('show');
            if(browserContentArea) browserContentArea.innerHTML = '';
            browserHistoryStart = null;
            if (remaining > 0) history.go(-remaining);
            return;
        }
        // 닫기 버튼이 유발한 history 균형용 popstate는 1회만 무시
        if (suppressPopstateClose) { suppressPopstateClose = false; return; }
        const topModal = modalStack[modalStack.length - 1];
        if (topModal) {
            // 미니 플레이어 상태에서는 뒤로가기로 닫지 않고 추적만 해제
            if (topModal === modalOverlay && modalOverlay.classList.contains('mini-mode')) {
                modalStack = modalStack.filter(m => m !== modalOverlay);
                return;
            }
            closeModal(topModal);
        }
    });

    if (ccmBtn) ccmBtn.onclick = () => openModal(modalOverlay);
    if (closeModalBtn) closeModalBtn.onclick = () => handleCloseBtnClick(modalOverlay);
    if (closeBibleModalBtn) closeBibleModalBtn.onclick = () => handleCloseBtnClick(bibleModal);
    if (bibleModal) bibleModal.onclick = (e) => { if (e.target === bibleModal) handleCloseBtnClick(bibleModal); };
    if (modalOverlay) modalOverlay.onclick = (e) => { if (!modalOverlay.classList.contains('mini-mode') && e.target === modalOverlay) { handleCloseBtnClick(modalOverlay); } };
    if (closeIosModalBtn) closeIosModalBtn.onclick = () => handleCloseBtnClick(iosModal);
    if (iosModal) iosModal.onclick = (e) => { if (e.target === iosModal) handleCloseBtnClick(iosModal); };
    if (settingsBtn) settingsBtn.onclick = () => openModal(settingsModal);
    if (closeSettingsBtn) closeSettingsBtn.onclick = () => handleCloseBtnClick(settingsModal);
    if (settingsModal) settingsModal.onclick = (e) => { if (e.target === settingsModal) handleCloseBtnClick(settingsModal); };

    if (videoSettingsBtn) {
        videoSettingsBtn.onclick = (e) => {
            e.stopPropagation(); 
            openModal(cookieGuideModal);
        };
    }

    if (closeCookieGuideBtn) closeCookieGuideBtn.onclick = () => handleCloseBtnClick(cookieGuideModal);
    if (cookieGuideModal) cookieGuideModal.onclick = (e) => { if (e.target === cookieGuideModal) handleCloseBtnClick(cookieGuideModal); };


    // --- 드래그 기능 수정 (PC 지원 최적화) ---
    let isPlayerDragging = false;
    let shiftX, shiftY;
    let dragStartPos = { x: 0, y: 0 };
    let totalMovedDistance = 0; // 드래그한 총 거리

    const maximizePlayer = (e) => {
         if (e) {
             if (typeof e.preventDefault === 'function') e.preventDefault();
             if (typeof e.stopPropagation === 'function') e.stopPropagation();
         }
         if (!modalOverlay || !ccmMenuView || !ccmPlayerView || !draggablePlayer) return;
         modalOverlay.classList.remove('mini-mode');
         if(maximizeOverlay) maximizeOverlay.style.display = 'none';
         
         ccmMenuView.style.display = 'none';
         ccmPlayerView.style.display = 'block';

         draggablePlayer.style.top = '';
         draggablePlayer.style.left = '';
         draggablePlayer.style.bottom = '20px';
         draggablePlayer.style.right = '20px';
         draggablePlayer.style.transition = ''; 
    };

    const startPlayerDrag = (e) => {
        if (!modalOverlay || !draggablePlayer) return;
        if (!modalOverlay.classList.contains('mini-mode')) return;
        if (e.target.closest('.mini-btn')) return;

        isPlayerDragging = true;
        totalMovedDistance = 0; // 초기화

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        dragStartPos = { x: clientX, y: clientY };

        const rect = draggablePlayer.getBoundingClientRect();
        shiftX = clientX - rect.left;
        shiftY = clientY - rect.top;
        
        draggablePlayer.style.transition = 'none';
        draggablePlayer.style.bottom = 'auto';
        draggablePlayer.style.right = 'auto';
        draggablePlayer.style.left = rect.left + 'px';
        draggablePlayer.style.top = rect.top + 'px';
    };

    const onPlayerDrag = (e) => {
        if (!isPlayerDragging) return;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // 드래그 거리 누적 계산
        const dist = Math.sqrt(Math.pow(clientX - dragStartPos.x, 2) + Math.pow(clientY - dragStartPos.y, 2));
        totalMovedDistance = dist;

        // 플레이어가 화면 밖으로 완전히 나가 복구 불가능해지지 않도록 뷰포트 안으로 제한
        const maxLeft = Math.max(0, window.innerWidth - draggablePlayer.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - draggablePlayer.offsetHeight);
        const newLeft = Math.min(Math.max(0, clientX - shiftX), maxLeft);
        const newTop = Math.min(Math.max(0, clientY - shiftY), maxTop);

        draggablePlayer.style.left = newLeft + 'px';
        draggablePlayer.style.top = newTop + 'px';
    };

    const endPlayerDrag = (e) => {
        if (!isPlayerDragging) return;
        isPlayerDragging = false;
        
        // 드래그 거리가 10px 미만일 때만 클릭으로 간주하여 최대화
        if (totalMovedDistance < 10) {
             maximizePlayer(e);
        }
    };

    if (draggablePlayer) {
        draggablePlayer.addEventListener('mousedown', startPlayerDrag);
        draggablePlayer.addEventListener('touchstart', startPlayerDrag, {passive: false});
        document.addEventListener('mousemove', onPlayerDrag);
        document.addEventListener('touchmove', onPlayerDrag, {passive: false});
        document.addEventListener('mouseup', endPlayerDrag);
        document.addEventListener('touchend', endPlayerDrag);
    }
    
    // PC에서 드래그와 클릭 충돌을 방지하기 위해 onclick 대신 드래그 로직 내에서 판단함
    if (maximizeOverlay) {
        // 기존의 maximizeOverlay.onclick = maximizePlayer; 코드는 삭제됨
    }

    if (miniPlayPauseBtn) {
        miniPlayPauseBtn.onclick = (e) => {
            e.stopPropagation(); 
            if (player && typeof player.getPlayerState === 'function') {
                const state = player.getPlayerState();
                if (state === YT.PlayerState.PLAYING) player.pauseVideo(); else player.playVideo();
            }
        };
    }
    if (miniCloseBtn) { miniCloseBtn.onclick = (e) => { e.stopPropagation(); closeModal(modalOverlay); }; }

    const hideModeBtn = document.getElementById('hide-mode-btn');
    let isHideMode = false;
    const ICON_EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
    const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    const applyHiddenStatus = () => {
        const hiddenList = safeParseJSON(localStorage.getItem('hiddenCards'), []);
        const cards = document.querySelectorAll('.list-card');
        cards.forEach(card => {
            if (hiddenList.includes(card.id)) card.classList.add('user-hidden'); 
            else card.classList.remove('user-hidden');
        });
    };
    applyHiddenStatus();
    if (hideModeBtn) {
        hideModeBtn.onclick = () => {
            isHideMode = !isHideMode;
            document.body.classList.toggle('hide-mode', isHideMode);
            if (isHideMode) { hideModeBtn.innerHTML = ICON_CHECK; hideModeBtn.classList.add('active'); }
            else { hideModeBtn.innerHTML = ICON_EYE_OFF; hideModeBtn.classList.remove('active'); }
        };
    }

    if (listContainer) {
        listContainer.onclick = async (e) => {
            const card = e.target.closest('.list-card');
            if (!card) return;
            if (isDragging) return;
            if (isHideMode) {
                if (card.id === 'card-share' || card.id === 'card-market') { alert("이 메뉴는 숨길 수 없습니다."); return; }
                let hiddenList = safeParseJSON(localStorage.getItem('hiddenCards'), []);
                if (hiddenList.includes(card.id)) { hiddenList = hiddenList.filter(id => id !== card.id); card.classList.remove('user-hidden'); } 
                else { hiddenList.push(card.id); card.classList.add('user-hidden'); }
                localStorage.setItem('hiddenCards', JSON.stringify(hiddenList));
                if (window.scheduleSettingsSync) window.scheduleSettingsSync();
                return;
            }

            if (card.id === 'card-ccm') {
                if (modalOverlay.classList.contains('mini-mode')) { maximizePlayer(); } else { openModal(modalOverlay); }
            } else if (card.id === 'card-share') {
                const shareUrl = 'https://csy870617.github.io/faiths/';
                if (navigator.share) { try { await navigator.share({ url: shareUrl }); return; } catch (err) {} }
                try { await navigator.clipboard.writeText(shareUrl); alert('주소가 복사되었습니다!'); } catch (err) { prompt('주소:', shareUrl); }
            } else if (card.id === 'card-bible') {
                openModal(bibleModal);
            } else {
                const link = card.getAttribute('data-link');
                const target = card.getAttribute('data-target');
                if (link) {
                    if (target === 'external') { window.open(link, '_blank'); } else { 
                        openInternalBrowser(link, 'default'); 
                    }
                }
            }
        };
    }

    const installBanner = document.getElementById('install-banner');
    const bannerInstallBtn = document.getElementById('banner-install-btn');
    const bannerCloseBtn = document.getElementById('banner-close-btn');
    const bannerNeverBtn = document.getElementById('banner-never-btn');
    let deferredPrompt;
    const showInstallBanner = () => {
        if (localStorage.getItem('installBannerHidden') === 'true') return;
        if (window.matchMedia('(display-mode: standalone)').matches) return;
        setTimeout(() => { if(installBanner) installBanner.classList.add('show'); }, 3000);
    };
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; showInstallBanner(); });
    // iPadOS 13+는 UA가 Mac으로 표기되므로 터치 지원 여부로 함께 판별
    const isIosDevice = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/i.test(navigator.userAgent) && 'ontouchend' in document);
    if (isIosDevice()) showInstallBanner();
    if (bannerInstallBtn) {
        bannerInstallBtn.onclick = () => {
            installBanner.classList.remove('show');
            if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then((r) => { deferredPrompt = null; }); }
            else if (isIosDevice()) { handleCloseBtnClick(settingsModal); setTimeout(() => openModal(iosModal), 300); }
            else { alert("이미 설치되어 있거나 브라우저 메뉴에서 설치 가능합니다."); }
        };
    }
    if (bannerCloseBtn) bannerCloseBtn.onclick = () => installBanner.classList.remove('show');
    if (bannerNeverBtn) bannerNeverBtn.onclick = () => { installBanner.classList.remove('show'); localStorage.setItem('installBannerHidden', 'true'); };

    const fontSizeSlider = document.getElementById('font-size-slider');
    if (fontSizeSlider) {
        const savedScale = localStorage.getItem('textScale');
        if (savedScale) { document.documentElement.style.setProperty('--text-scale', savedScale); fontSizeSlider.value = savedScale; }
        fontSizeSlider.oninput = (e) => { const scale = e.target.value; document.documentElement.style.setProperty('--text-scale', scale); localStorage.setItem('textScale', scale); if (window.scheduleSettingsSync) window.scheduleSettingsSync(); };
    }
    const installAppBtn = document.getElementById('install-app-btn');
    if (installAppBtn) {
        installAppBtn.onclick = () => {
            if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then((r) => { deferredPrompt = null; }); }
            else if (isIosDevice()) { handleCloseBtnClick(settingsModal); setTimeout(() => openModal(iosModal), 350); }
            else { alert("이미 설치되어 있거나 브라우저 메뉴에서 설치 가능합니다."); }
        };
    }
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filterValue = tab.getAttribute('data-filter');
            const cards = document.querySelectorAll('.list-card');
            cards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                if (filterValue === 'all' || filterValue === cardCategory) card.style.display = 'flex';
                else card.style.display = 'none';
            });
        };
    });

    // ===== 구글 통합 로그인 (SSO 허브) =====
    // FAITHS에서 한 번 로그인하면, 같은 origin의 연결 앱(iframe)에 Google ID 토큰을
    // 넘겨줘 각 앱이 자기 Firebase 프로젝트에 자동 로그인하도록 한다.
    const GOOGLE_CLIENT_ID = '702745292814-3982jsolqu1lv3q68fmcqbue2c4af3gg.apps.googleusercontent.com';
    const SSO_ALLOWED_ORIGINS = ['https://csy870617.github.io']; // 토큰을 전달할 자식 앱 origin
    let currentGoogleIdToken = null;

    const parseJwt = (token) => {
        try {
            const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const json = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            return JSON.parse(json);
        } catch (e) { return null; }
    };

    const googleSigninArea = document.getElementById('google-login-area'); // GIS 원형 아이콘 버튼 렌더 위치(로그아웃 상태)
    const googleStatusBtn = document.getElementById('google-status-btn');   // 연결됨 표시 버튼(로그인 상태)
    const googleReauthDot = document.getElementById('google-reauth-dot');   // 재로그인 필요 시 버튼 위에 살짝 표시하는 점
    let currentGoogleEmail = null;

    // 자동 팝업 대신 로그인 버튼 위에 작은 점만 표시해 재로그인이 필요함을 알린다.
    const setReauthHint = (show) => {
        if (googleReauthDot) googleReauthDot.classList.toggle('show', !!show);
    };

    const updateGoogleUI = (payload) => {
        const loggedIn = !!(payload && payload.email);
        currentGoogleEmail = loggedIn ? payload.email : null;
        if (googleSigninArea) googleSigninArea.style.display = loggedIn ? 'none' : 'flex';
        if (googleStatusBtn) {
            googleStatusBtn.style.display = loggedIn ? 'flex' : 'none';
            googleStatusBtn.title = loggedIn ? payload.email : '';
        }
        if (loggedIn) setReauthHint(false);
    };

    // 연결됨 버튼을 누르면 계정/연결 해제 안내
    if (googleStatusBtn) {
        googleStatusBtn.onclick = () => {
            if (confirm('구글 계정 연결을 해제할까요?\n' + (currentGoogleEmail || ''))) {
                currentGoogleIdToken = null;
                localStorage.removeItem('googleLinked');
                setReauthHint(false);
                try { if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect(); } catch (e) {}
                try { if (window.firebase && firebase.auth) firebase.auth().signOut(); } catch (e) {}
                updateGoogleUI(null);
            }
        };
    }

    let lastTokenTime = 0; // 마지막으로 Google ID 토큰을 받은 시각(무음 갱신 판단용)

    // GIS 로그인 콜백: Google ID 토큰(JWT) 수신
    window.handleGoogleCredential = (response) => {
        if (!response || !response.credential) return;
        currentGoogleIdToken = response.credential;
        lastTokenTime = Date.now();
        localStorage.setItem('googleLinked', 'true');
        updateGoogleUI(parseJwt(currentGoogleIdToken));
        if (window.ensureFirebaseSignedIn) window.ensureFirebaseSignedIn(); // 설정 동기화용 Firebase 로그인
        // 이미 열려 있는 연결 앱(iframe)에도 즉시 밀어넣어 준다
        const frame = document.getElementById('browser-frame');
        if (frame && frame.contentWindow) {
            try { frame.contentWindow.postMessage({ type: 'faiths-google-idtoken', idToken: currentGoogleIdToken }, 'https://csy870617.github.io'); } catch (e) {}
        }
    };

    // 로그인 유지: Google ID 토큰은 약 1시간 후 만료된다. 예전에는 만료 전에
    // google.accounts.id.prompt()로 재발급을 시도했으나, 이 방식은 기기에 따라
    // 화면 하단에 로그인 창(One Tap/FedCM UI)이 뜨는 문제가 있었다. 이제는 팝업을
    // 띄우지 않고, 로그인 버튼 위에 살짝 표시(점)만 해서 사용자가 직접 눌러
    // 재연결하도록 안내한다.
    const refreshGoogleTokenIfStale = () => {
        if (localStorage.getItem('googleLinked') !== 'true') return;
        if (Date.now() - lastTokenTime < 45 * 60 * 1000) return; // 아직 신선하면 스킵
        setReauthHint(true);
    };
    setInterval(refreshGoogleTokenIfStale, 5 * 60 * 1000); // 5분마다 만료 임박 여부 확인
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') refreshGoogleTokenIfStale();
    });

    // 연결 앱(iframe)이 토큰을 요청하면, origin을 검증한 뒤 전달한다
    window.addEventListener('message', (e) => {
        if (!SSO_ALLOWED_ORIGINS.includes(e.origin)) return;
        if (!e.data || e.data.type !== 'faiths-request-idtoken') return;
        if (currentGoogleIdToken && e.source) {
            try { e.source.postMessage({ type: 'faiths-google-idtoken', idToken: currentGoogleIdToken }, e.origin); } catch (err) {}
        }
        refreshGoogleTokenIfStale(); // 다음 요청을 위해 만료 임박 시 미리 갱신
    });

    const initGoogleSSO = () => {
        if (!(window.google && google.accounts && google.accounts.id)) return false;
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: window.handleGoogleCredential,
            auto_select: true,
            use_fedcm_for_prompt: true,
            cancel_on_tap_outside: false
        });
        if (googleSigninArea) {
            googleSigninArea.innerHTML = '';
            try {
                // 숨기기/설정 버튼처럼 동그란 아이콘 형태의 구글 버튼
                google.accounts.id.renderButton(googleSigninArea, { type: 'icon', shape: 'circle', theme: 'outline', size: 'large' });
            } catch (e) {}
        }
        // 이전에 연결한 사용자면 페이지 로드시 팝업을 띄우지 않고, 아직 토큰을
        // 못 받은 상태에 한해 로그인 버튼 위에 살짝 표시만 해서 재연결을 안내한다.
        if (localStorage.getItem('googleLinked') === 'true' && !currentGoogleIdToken) {
            setReauthHint(true);
        }
        return true;
    };

    // GIS 라이브러리는 async 로드되므로 준비될 때까지 잠깐 폴링
    let ssoTries = 0;
    (function waitForGIS() {
        if (initGoogleSSO()) return;
        if (ssoTries++ > 50) return; // 약 10초 후 포기
        setTimeout(waitForGIS, 200);
    })();

    // ===== 기기 간 설정/순서 동기화 (Firebase Firestore) =====
    // 로그인하면 클라우드에 저장된 순서/설정을 이 기기에 적용하고, 변경 시 자동 업로드한다.
    const FIREBASE_CONFIG = {
        apiKey: 'AIzaSyB0SJWqE-ecZ3uV9cW3TdYU8Kgmxw2LrYM',
        authDomain: 'faiths-93c4c.firebaseapp.com',
        projectId: 'faiths-93c4c',
        storageBucket: 'faiths-93c4c.firebasestorage.app',
        messagingSenderId: '269816120372',
        appId: '1:269816120372:web:f7848e2bd3693069c17661'
    };
    let fbDb = null, fbAuthReady = false, syncApplying = false, syncTimer = null;

    // 클라우드 값을 이 기기에 적용(중복 업로드 방지 플래그 syncApplying 사용)
    const applySyncedSettings = (data) => {
        if (!data) return;
        syncApplying = true;
        try {
            if (Array.isArray(data.menuOrder) && listContainer) {
                localStorage.setItem('menuOrder', JSON.stringify(data.menuOrder));
                applyMenuOrder(data.menuOrder);
            }
            if (Array.isArray(data.hiddenCards)) {
                localStorage.setItem('hiddenCards', JSON.stringify(data.hiddenCards));
                applyHiddenStatus();
            }
            if (data.viewMode === 'grid' || data.viewMode === 'list') {
                setViewMode(data.viewMode);
            }
            if (data.textScale) {
                document.documentElement.style.setProperty('--text-scale', data.textScale);
                localStorage.setItem('textScale', data.textScale);
                if (fontSizeSlider) fontSizeSlider.value = data.textScale;
            }
        } catch (e) {} finally { syncApplying = false; }
    };

    const gatherSettings = () => {
        const s = {
            hiddenCards: safeParseJSON(localStorage.getItem('hiddenCards'), []),
            viewMode: localStorage.getItem('viewMode') || 'list',
            textScale: localStorage.getItem('textScale') || '1',
            updatedAt: Date.now()
        };
        const order = safeParseJSON(localStorage.getItem('menuOrder'), null);
        if (Array.isArray(order)) s.menuOrder = order;
        return s;
    };

    const pushSettings = () => {
        if (!fbDb || !fbAuthReady || !window.firebase) return;
        const user = firebase.auth().currentUser;
        if (!user) return;
        fbDb.collection('users').doc(user.uid).set(gatherSettings(), { merge: true }).catch(() => {});
    };

    // 변경 발생 시 1초 디바운스로 업로드(동기화 적용 중에는 무시)
    window.scheduleSettingsSync = () => {
        if (syncApplying) return;
        clearTimeout(syncTimer);
        syncTimer = setTimeout(pushSettings, 1000);
    };

    const pullSettings = (uid) => {
        if (!fbDb) return;
        fbDb.collection('users').doc(uid).get().then(doc => {
            if (doc.exists) applySyncedSettings(doc.data());
            else pushSettings(); // 클라우드에 처음이면 현재 로컬 설정을 올려둔다
        }).catch(() => {});
    };

    // 구글 로그인 토큰으로 FAITHS Firebase 세션 생성(설정 저장용)
    window.ensureFirebaseSignedIn = () => {
        if (!(window.firebase && firebase.auth)) return;
        if (!currentGoogleIdToken) return;
        try {
            if (firebase.auth().currentUser) return;
            const cred = firebase.auth.GoogleAuthProvider.credential(currentGoogleIdToken);
            firebase.auth().signInWithCredential(cred).catch((e) => { console.log('FAITHS Firebase 로그인 실패:', e && e.code); });
        } catch (e) {}
    };

    const initFirebaseSync = () => {
        if (!(window.firebase && firebase.initializeApp && firebase.firestore)) return false;
        try {
            if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
            fbDb = firebase.firestore();
            firebase.auth().onAuthStateChanged((user) => {
                fbAuthReady = true;
                if (user) {
                    pullSettings(user.uid);
                    // 브라우저에 파이어베이스 로그인 세션이 남아있으면(재방문), 구글 팝업 없이도
                    // 헤더에 로그인 상태를 바로 표시해 매번 다시 로그인할 필요가 없게 한다.
                    if (user.email) updateGoogleUI({ email: user.email });
                }
            });
            return true;
        } catch (e) { return false; }
    };

    let fbTries = 0;
    (function waitForFirebase() {
        if (initFirebaseSync()) { window.ensureFirebaseSignedIn(); return; }
        if (fbTries++ > 50) return; // 약 10초 후 포기
        setTimeout(waitForFirebase, 200);
    })();
});