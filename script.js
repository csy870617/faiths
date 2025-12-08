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
    
    // 로딩 화면 처리
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
        }, 1500); 
    }

    try { if (!Kakao.isInitialized()) Kakao.init('b5c055c0651a6fce6f463abd18a9bdc7'); } catch (e) { console.log('카카오 SDK 초기화 실패'); }

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
    // [NEW] 하단 설치 배너 관리
    // ==========================================
    const installBanner = document.getElementById('install-banner');
    const bannerInstallBtn = document.getElementById('banner-install-btn');
    const bannerCloseBtn = document.getElementById('banner-close-btn');
    const bannerNeverBtn = document.getElementById('banner-never-btn');
    let deferredPrompt;

    // 배너 보이기 함수
    const showInstallBanner = () => {
        // 이미 '다시 보지 않기'를 눌렀다면 실행 안 함
        if (localStorage.getItem('installBannerHidden') === 'true') return;
        // 이미 설치된 상태라면 실행 안 함
        if (window.matchMedia('(display-mode: standalone)').matches) return;

        setTimeout(() => {
            if(installBanner) installBanner.classList.add('show');
        }, 3000); // 3초 뒤 등장
    };

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallBanner(); // 안드로이드/PC는 이벤트 발생 시 배너 표시
    });

    // 아이폰 등은 이벤트 없이도 조건 체크 후 표시
    const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIos) showInstallBanner();

    // 배너 버튼 이벤트
    if (bannerInstallBtn) {
        bannerInstallBtn.addEventListener('click', () => {
            installBanner.classList.remove('show'); // 배너 닫기
            
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((r) => { deferredPrompt = null; });
            } else if (isIos) {
                setTimeout(() => openModal(document.getElementById('ios-modal')), 300);
            } else {
                alert("브라우저 메뉴에서 [앱 설치]를 선택하세요.");
            }
        });
    }

    if (bannerCloseBtn) {
        bannerCloseBtn.addEventListener('click', () => {
            installBanner.classList.remove('show'); // 이번 세션에서만 닫기
        });
    }

    if (bannerNeverBtn) {
        bannerNeverBtn.addEventListener('click', () => {
            installBanner.classList.remove('show');
            localStorage.setItem('installBannerHidden', 'true'); // 영구 숨김 설정
        });
    }


    // ==========================================
    // 모달 관리 & 뒤로가기 지원
    // ==========================================
    const modalOverlay = document.getElementById('modal-overlay');
    const iosModal = document.getElementById('ios-modal');
    const settingsModal = document.getElementById('settings-modal');

    const ccmBtn = document.getElementById('ccm-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const closeIosModalBtn = document.getElementById('close-ios-modal');
    const closeSettingsBtn = document.getElementById('close-settings-modal');
    const moodBtns = document.querySelectorAll('.mood-btn');

    let currentModal = null; 

    const openModal = (modal) => {
        currentModal = modal;
        modal.style.display = 'flex';
        setTimeout(() => { modal.classList.add('show'); }, 10);
        history.pushState({ modalOpen: true }, null, ""); 
    };

    const closeModal = (modal) => {
        if (!modal) return;
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
        currentModal = null;
    };

    const closeWithBack = (modal) => {
        if (history.state && history.state.modalOpen) { history.back(); }
        else { closeModal(modal); }
    };

    window.addEventListener('popstate', () => {
        if (currentModal) {
            closeModal(currentModal);
        }
    });

    if (ccmBtn) ccmBtn.addEventListener('click', () => openModal(modalOverlay));
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => closeWithBack(modalOverlay));
    if (modalOverlay) modalOverlay.addEventListener('click', (e) => { 
        if (e.target === modalOverlay) closeWithBack(modalOverlay); 
    });

    if (closeIosModalBtn) closeIosModalBtn.addEventListener('click', () => closeWithBack(iosModal));
    if (iosModal) iosModal.addEventListener('click', (e) => { 
        if (e.target === iosModal) closeWithBack(iosModal); 
    });

    if (settingsBtn) settingsBtn.addEventListener('click', () => openModal(settingsModal));
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => closeWithBack(settingsModal));
    if (settingsModal) settingsModal.addEventListener('click', (e) => { 
        if (e.target === settingsModal) closeWithBack(settingsModal); 
    });

    moodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-key');
            if (typeof CCM_LINKS !== 'undefined' && CCM_LINKS[key]) {
                openExternalLink(CCM_LINKS[key]);
                closeWithBack(modalOverlay);
            }
        });
    });

    const fontSizeSlider = document.getElementById('font-size-slider');
    if (fontSizeSlider) {
        const savedScale = localStorage.getItem('textScale');
        if (savedScale) { document.documentElement.style.setProperty('--text-scale', savedScale); fontSizeSlider.value = savedScale; }
        fontSizeSlider.addEventListener('input', (e) => { const scale = e.target.value; document.documentElement.style.setProperty('--text-scale', scale); localStorage.setItem('textScale', scale); });
    }

    // 설정 팝업 내 설치 버튼 (수동)
    const installAppBtn = document.getElementById('install-app-btn');
    if (installAppBtn) {
        installAppBtn.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((r) => { deferredPrompt = null; });
            } else {
                const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
                if (isIos) {
                    closeWithBack(settingsModal);
                    setTimeout(() => openModal(iosModal), 350);
                } else {
                    alert("이미 설치되어 있거나 브라우저 메뉴에서 설치 가능합니다.");
                }
            }
        });
    }

    // 메인 리스트 클릭
    const listContainer = document.getElementById('main-list');
    listContainer.addEventListener('click', async (e) => {
        const card = e.target.closest('.list-card');
        if (!card) return;

        if (card.id === 'card-ccm') {
            openModal(modalOverlay);
        } else if (card.id === 'card-share') {
            const shareUrl = location.href;
            const shareTitle = 'FAITHS - 크리스천 성장 도구';
            const shareDesc = '더 멋진 크리스천으로 함께 성장해요';
            const shareImage = new URL('thumbnail.png?v=' + new Date().getTime(), window.location.href).href;

            if (window.Kakao && Kakao.isInitialized()) {
                try {
                    Kakao.Share.sendDefault({
                        objectType: 'feed',
                        content: {
                            title: shareTitle, description: shareDesc, imageUrl: shareImage, 
                            link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
                            imageWidth: 800, imageHeight: 400
                        },
                        buttons: [{ title: '바로가기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl }}],
                    });
                    return; 
                } catch (err) { console.log('카카오 공유 실패'); }
            }

            if (navigator.share) {
                try { await navigator.share({ url: shareUrl }); return; } catch (err) { console.log('공유 취소'); }
            } 
            
            try {
                await navigator.clipboard.writeText(shareUrl);
                alert('사이트 주소가 복사되었습니다!\n원하는 곳에 붙여넣기 해주세요.');
            } catch (err) { prompt('주소를 복사하세요:', shareUrl); }
        } 
        else {
            const link = card.getAttribute('data-link');
            if (link) openExternalLink(link);
        }
    });

    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filterValue = tab.getAttribute('data-filter');
            const cards = document.querySelectorAll('.list-card');
            cards.forEach(card => {
                if (card.classList.contains('hidden')) return;
                const cardCategory = card.getAttribute('data-category');
                if (filterValue === 'all' || filterValue === cardCategory) card.style.display = 'flex'; 
                else card.style.display = 'none';
            });
        });
    });

});