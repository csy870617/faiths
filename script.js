// script.js - v156 (닫기 버튼 더블탭으로 위치 초기화)

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
        lastVideoUrl = randomUrl;

        const idInfo = getYouTubeIdInfo(randomUrl);

        if(playerTitle && title) playerTitle.innerText = title;
        if(ccmMenuView) ccmMenuView.style.display = 'none';
        if(ccmPlayerView) ccmPlayerView.style.display = 'block';
        requestWakeLock();

        if (idInfo) {
            if (player && isPlayerReady) {
                if (idInfo.type === 'playlist') { player.loadPlaylist({list: idInfo.id, listType: 'playlist'}); } 
                else { player.loadVideoById(idInfo.id); }
            } else {
                console.log("Player not ready. Queuing...");
                pendingPlay = { category: category, title: title }; 
            }
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
                applyCloseBtnPosition(safeParseJSON(localStorage.getItem('closeBtnPos'), null));
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
                localStorage.setItem('closeBtnPos', JSON.stringify({ left: rect.left, top: rect.top }));
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
                localStorage.removeItem('closeBtnPos');
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
    const savedOrder = safeParseJSON(localStorage.getItem('menuOrder'), null);
    if (listContainer && Array.isArray(savedOrder)) {
        const currentCards = Array.from(listContainer.children);
        const cardMap = {};
        currentCards.forEach(card => cardMap[card.id] = card);
        savedOrder.forEach(id => { if (cardMap[id]) listContainer.appendChild(cardMap[id]); });
    }

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
            const title = btn.querySelector('span:last-child').innerText;
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
            if (isHideMode) { hideModeBtn.innerHTML = '✅'; hideModeBtn.classList.add('active'); } 
            else { hideModeBtn.innerHTML = '🙈'; hideModeBtn.classList.remove('active'); }
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
        fontSizeSlider.oninput = (e) => { const scale = e.target.value; document.documentElement.style.setProperty('--text-scale', scale); localStorage.setItem('textScale', scale); };
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
});