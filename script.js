// 0. 인앱 브라우저 탈출
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

document.addEventListener('DOMContentLoaded', () => {
    
    // [NEW] 자동 업데이트 로직
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(reg => {
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        window.location.reload();
                    }
                });
            });
        });
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    }

    // 로딩 화면
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
        }, 1500); 
    }

    try { if (!Kakao.isInitialized()) Kakao.init('b5c055c0651a6fce6f463abd18a9bdc7'); } catch (e) {}

    function openExternalLink(url) {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.match(/android/i) && userAgent.match(/kakaotalk|line|instagram|facebook|wv/i)) {
            const rawUrl = url.replace(/^https?:\/\//i, '');
            window.location.href = `intent://${rawUrl}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;
        } else {
            window.open(url, '_blank');
        }
    }

    // ==========================================
    // 모달 관리
    // ==========================================
    const modalOverlay = document.getElementById('modal-overlay');
    const iosModal = document.getElementById('ios-modal');
    const settingsModal = document.getElementById('settings-modal');

    // 요소들
    const ccmMenuView = document.getElementById('ccm-menu-view');
    const ccmPlayerView = document.getElementById('ccm-player-view');
    const youtubeIframe = document.getElementById('youtube-iframe');
    const backToMenuBtn = document.getElementById('back-to-menu-btn');
    const playerTitle = document.getElementById('player-title');

    // 버튼들
    const ccmBtn = document.getElementById('ccm-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const closeIosModalBtn = document.getElementById('close-ios-modal');
    const closeSettingsBtn = document.getElementById('close-settings-modal');
    const moodBtns = document.querySelectorAll('.mood-btn');

    let currentModal = null; 
    let wakeLock = null;

    // Wake Lock
    const requestWakeLock = async () => {
        try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
    };
    const releaseWakeLock = async () => {
        try { if (wakeLock) { await wakeLock.release(); wakeLock = null; } } catch (e) {}
    };

    const openModal = (modal) => {
        if (!modal) return;
        currentModal = modal;
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('show'));
        history.pushState({ modalOpen: true }, null, ""); 
    };

    const closeModal = (modal) => {
        if (!modal) return;
        
        if (modal === modalOverlay) {
            if(youtubeIframe) youtubeIframe.src = ''; 
            releaseWakeLock();
            setTimeout(() => {
                if(ccmPlayerView) ccmPlayerView.style.display = 'none';
                if(ccmMenuView) ccmMenuView.style.display = 'block';
            }, 300);
        }

        modal.classList.remove('show');
        setTimeout(() => { 
            modal.style.display = 'none'; 
            if (currentModal === modal) currentModal = null;
        }, 300);
    };

    const handleCloseBtnClick = (modal) => {
        closeModal(modal); 
        if (history.state && history.state.modalOpen) history.back();
    };

    window.addEventListener('popstate', () => {
        if (currentModal) closeModal(currentModal);
    });

    if (ccmBtn) ccmBtn.onclick = () => openModal(modalOverlay);
    if (closeModalBtn) closeModalBtn.onclick = () => handleCloseBtnClick(modalOverlay);
    if (modalOverlay) modalOverlay.onclick = (e) => { 
        if (e.target === modalOverlay) handleCloseBtnClick(modalOverlay); 
    };

    if (closeIosModalBtn) closeIosModalBtn.onclick = () => handleCloseBtnClick(iosModal);
    if (iosModal) iosModal.onclick = (e) => { if (e.target === iosModal) handleCloseBtnClick(iosModal); };

    if (settingsBtn) settingsBtn.onclick = () => openModal(settingsModal);
    if (closeSettingsBtn) closeSettingsBtn.onclick = () => handleCloseBtnClick(settingsModal);
    if (settingsModal) settingsModal.onclick = (e) => { if (e.target === settingsModal) handleCloseBtnClick(settingsModal); };


    // ==========================================
    // [핵심 수정] 유튜브 플레이어 (모바일 호환성 최적화)
    // ==========================================
    function getYouTubeEmbedUrl(url) {
        if (!url) return null;
        const origin = window.location.origin; // 현재 도메인 (보안 필수)

        // 1. 재생목록 (List)
        const listMatch = url.match(/[?&]list=([^#&?]+)/);
        if (listMatch && listMatch[1]) {
            const listId = listMatch[1];
            // [중요] autoplay 제거 + origin 추가
            return `https://www.youtube.com/embed?listType=playlist&list=${listId}&playsinline=1&rel=0&modestbranding=1&origin=${origin}`;
        }

        // 2. 단일 영상 (Video)
        const videoMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/)([^#&?]*))/);
        if (videoMatch && videoMatch[1]) {
            const videoId = videoMatch[1];
            // [중요] autoplay 제거 + origin 추가
            return `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1&origin=${origin}`;
        }

        return null;
    }

    moodBtns.forEach(btn => {
        btn.onclick = () => {
            const key = btn.getAttribute('data-key');
            const title = btn.querySelector('span:last-child').innerText;

            if (typeof CCM_PLAYLIST !== 'undefined' && CCM_PLAYLIST[key]) {
                const embedUrl = getYouTubeEmbedUrl(CCM_PLAYLIST[key]);

                if (embedUrl) {
                    if(youtubeIframe) youtubeIframe.src = embedUrl;
                    if(playerTitle) playerTitle.innerText = title;
                    
                    if(ccmMenuView) ccmMenuView.style.display = 'none';
                    if(ccmPlayerView) ccmPlayerView.style.display = 'block';

                    requestWakeLock();
                } else {
                    alert("지원하지 않는 유튜브 주소입니다.");
                }
            } else {
                alert("재생 목록이 없습니다.");
            }
        };
    });

    if (backToMenuBtn) {
        backToMenuBtn.onclick = () => {
            if(youtubeIframe) youtubeIframe.src = ''; 
            if(ccmPlayerView) ccmPlayerView.style.display = 'none';
            if(ccmMenuView) ccmMenuView.style.display = 'block';
            releaseWakeLock();
        };
    }


    // ==========================================
    // (이하 기존 코드 동일)
    // ==========================================
    const listContainer = document.getElementById('main-list');
    const hideModeBtn = document.getElementById('hide-mode-btn'); 
    let isHideMode = false;

    const applyHiddenStatus = () => {
        const hiddenList = JSON.parse(localStorage.getItem('hiddenCards')) || [];
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
            if (isHideMode) {
                hideModeBtn.innerHTML = '✅'; 
                hideModeBtn.classList.add('active');
            } else {
                hideModeBtn.innerHTML = '🙈';
                hideModeBtn.classList.remove('active');
            }
        };
    }

    if (listContainer) {
        listContainer.onclick = async (e) => {
            const card = e.target.closest('.list-card');
            if (!card) return;

            if (isHideMode) {
                let hiddenList = JSON.parse(localStorage.getItem('hiddenCards')) || [];
                if (hiddenList.includes(card.id)) {
                    hiddenList = hiddenList.filter(id => id !== card.id);
                    card.classList.remove('user-hidden');
                } else {
                    hiddenList.push(card.id);
                    card.classList.add('user-hidden');
                }
                localStorage.setItem('hiddenCards', JSON.stringify(hiddenList));
                return;
            }

            if (card.id === 'card-ccm') {
                openModal(modalOverlay);
            } else if (card.id === 'card-share') {
                const shareUrl = 'https://csy870617.github.io/faiths/';
                const shareTitle = 'FAITHS - 크리스천 성장 도구';
                const shareDesc = '더 멋진 크리스천으로 함께 성장해요';
                const shareImage = 'https://csy870617.github.io/faiths/thumbnail.png';

                if (window.Kakao && Kakao.isInitialized()) {
                    try {
                        Kakao.Share.sendDefault({
                            objectType: 'feed',
                            content: { title: shareTitle, description: shareDesc, imageUrl: shareImage, link: { mobileWebUrl: shareUrl, webUrl: shareUrl }, imageWidth: 800, imageHeight: 400 },
                            buttons: [{ title: '바로가기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl }}],
                        });
                        return; 
                    } catch (err) { console.log('카카오 공유 실패'); }
                }
                if (navigator.share) {
                    try { await navigator.share({ url: shareUrl }); return; } catch (err) { console.log('공유 취소'); }
                }
                try { await navigator.clipboard.writeText(shareUrl); alert('주소가 복사되었습니다!'); } catch (err) { prompt('주소:', shareUrl); }
            } else {
                const link = card.getAttribute('data-link');
                if (link) openExternalLink(link);
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

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault(); deferredPrompt = e; showInstallBanner();
    });
    const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIos) showInstallBanner();

    if (bannerInstallBtn) {
        bannerInstallBtn.onclick = () => {
            installBanner.classList.remove('show');
            if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then((r) => { deferredPrompt = null; }); }
            else if (isIos) { setTimeout(() => openModal(iosModal), 300); }
            else { alert("브라우저 메뉴에서 [앱 설치]를 선택하세요."); }
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
            else { const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent); if (isIos) { handleCloseBtnClick(settingsModal); setTimeout(() => openModal(iosModal), 350); } else { alert("이미 설치되어 있거나 브라우저 메뉴에서 설치 가능합니다."); } }
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
                if (filterValue === 'all' || filterValue === cardCategory) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        };
    });

});