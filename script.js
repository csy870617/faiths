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
    
    // 1. 카카오톡 초기화
    try {
        if (!Kakao.isInitialized()) {
            Kakao.init('b5c055c0651a6fce6f463abd18a9bdc7'); 
        }
    } catch (e) {
        console.log('카카오 SDK 초기화 실패');
    }

    // [헬퍼] 링크 열기 함수
    function openExternalLink(url) {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.match(/android/i) && userAgent.match(/kakaotalk|line|instagram|facebook|wv/i)) {
            const rawUrl = url.replace(/^https?:\/\//i, '');
            const intentUrl = `intent://${rawUrl}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;
            window.location.href = intentUrl;
        } else {
            window.open(url, '_blank');
        }
    }


    // ==========================================
    // CCM 모달 & 아이폰 설치 모달 기능
    // ==========================================
    const ccmBtn = document.getElementById('ccm-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalBtn = document.getElementById('close-modal');
    const moodBtns = document.querySelectorAll('.mood-btn');
    const iosModal = document.getElementById('ios-modal');
    const closeIosModalBtn = document.getElementById('close-ios-modal');

    const closeModal = (modal) => {
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    };

    const openModal = (modal) => {
        modal.style.display = 'flex';
        setTimeout(() => { modal.classList.add('show'); }, 10);
    };

    if (ccmBtn) ccmBtn.addEventListener('click', () => openModal(modalOverlay));
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => closeModal(modalOverlay));
    if (modalOverlay) modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal(modalOverlay);
    });

    if (closeIosModalBtn) closeIosModalBtn.addEventListener('click', () => closeModal(iosModal));
    if (iosModal) iosModal.addEventListener('click', (e) => {
        if (e.target === iosModal) closeModal(iosModal);
    });

    moodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const url = btn.getAttribute('data-url');
            if (url) {
                openExternalLink(url);
                closeModal(modalOverlay);
            }
        });
    });


    // ==========================================
    // 2. 친구 초대 (공유) 기능 [수정됨]
    // ==========================================
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            
            const shareUrl = location.href;

            // 1순위: 브라우저 기본 공유
            if (navigator.share) {
                try {
                    await navigator.share({
                        // [수정] title, text 제거 -> 링크만 공유됨
                        url: shareUrl
                    });
                    return; 
                } catch (err) {
                    console.log('기본 공유 취소 또는 실패');
                }
            }

            // 2순위: PC이거나 기본 공유 실패 시 클립보드 복사
            try {
                await navigator.clipboard.writeText(shareUrl);
                alert('주소가 복사되었습니다! \n원하는 곳에 붙여넣기 하세요.');
            } catch (err) {
                alert('이 브라우저에서는 공유 기능을 지원하지 않습니다.');
            }
        });
    }


    // ==========================================
    // 3. PWA 설치 기능
    // ==========================================
    let deferredPrompt;
    const installBtn = document.getElementById('install-btn');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
    });
    if (installBtn) {
        installBtn.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => { deferredPrompt = null; });
            } else {
                const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);
                if (isIos) openModal(iosModal);
                else alert("이미 설치되어 있거나 브라우저 메뉴에서 설치 가능합니다.");
            }
        });
    }


    // ==========================================
    // 4. 기본 카드 링크 이동 & 탭 필터링
    // ==========================================
    const cards = document.querySelectorAll('.list-card');
    const tabs = document.querySelectorAll('.tab');

    cards.forEach(card => {
        if (['share-btn', 'install-btn', 'ccm-btn'].includes(card.id)) return;

        card.addEventListener('click', () => {
            const link = card.getAttribute('data-link');
            if (link) openExternalLink(link);
        });
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const filterValue = tab.getAttribute('data-filter');
            
            cards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                
                if (filterValue === 'all' || filterValue === cardCategory) {
                    card.style.display = 'flex'; 
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

});