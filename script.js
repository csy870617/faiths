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
    
    // [중요] 로딩 화면 처리
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => { loadingScreen.style.display = 'none'; }, 500);
        }, 2200); 
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
    // 메뉴 순서 및 숨김 관리 (부드러운 Drag & Drop)
    // ==========================================
    const listContainer = document.getElementById('main-list');
    const startEditBtn = document.getElementById('start-edit-btn');
    const editDoneBtn = document.getElementById('edit-done-btn');
    const editDoneContainer = document.getElementById('edit-done-container');
    const settingsModal = document.getElementById('settings-modal');
    let sortable = null;

    function loadMenuState() {
        const savedOrder = JSON.parse(localStorage.getItem('menuOrder'));
        const savedHidden = JSON.parse(localStorage.getItem('hiddenMenus')) || [];
        if (savedOrder) {
            const currentCards = Array.from(listContainer.children);
            const cardMap = {};
            currentCards.forEach(card => cardMap[card.id] = card);
            savedOrder.forEach(id => { if (cardMap[id]) listContainer.appendChild(cardMap[id]); });
        }
        const cards = document.querySelectorAll('.list-card');
        cards.forEach(card => { if (savedHidden.includes(card.id)) card.classList.add('hidden'); });
    }
    loadMenuState();

    if (startEditBtn) {
        startEditBtn.addEventListener('click', () => {
            closeWithBack(settingsModal);
            document.body.classList.add('edit-mode');
            editDoneContainer.style.display = 'flex';
            
            const cards = document.querySelectorAll('.list-card');
            cards.forEach(card => {
                card.style.display = 'flex'; // 편집 중엔 다 보이게
                
                // 이미 숨김 처리된 카드는 'hidden-item' 클래스 추가
                if (card.classList.contains('hidden')) {
                    card.classList.add('hidden-item');
                    card.classList.remove('hidden');
                }
                
                // 눈 아이콘 버튼 생성 (중복 방지)
                if (!card.querySelector('.edit-eye-btn')) {
                    const eyeBtn = document.createElement('button');
                    eyeBtn.className = 'edit-eye-btn';
                    eyeBtn.innerHTML = '👁️';
                    eyeBtn.addEventListener('click', (e) => {
                        e.stopPropagation(); // 클릭 시 드래그 방지
                        card.classList.toggle('hidden-item');
                        // 시각적 피드백
                        eyeBtn.style.opacity = card.classList.contains('hidden-item') ? '0.5' : '1';
                    });
                    card.appendChild(eyeBtn);
                }
            });

            // [핵심] 부드러운 드래그 설정
            sortable = new Sortable(listContainer, { 
                animation: 350,  // 이동 애니메이션 속도 (ms)
                easing: "cubic-bezier(0.25, 1, 0.5, 1)", // 부드러운 가속도
                
                // [중요] forceFallback: true -> 브라우저 기본 드래그 끄고 JS로 그림 (훨씬 부드러움)
                forceFallback: true, 
                fallbackClass: "sortable-fallback", // 드래그 중인 아이템 클래스
                
                ghostClass: 'sortable-ghost', // 원래 자리에 남는 빈칸
                
                delay: 200, // 200ms 꾹 눌러야 드래그 시작 (실수 방지)
                delayOnTouchOnly: true,
                
                swapThreshold: 0.65, // 65% 이상 겹쳐야 자리 바꿈 (안정적)
                
                onStart: function() {
                    if (navigator.vibrate) navigator.vibrate(40); // 햅틱 피드백
                }
            });
        });
    }

    if (editDoneBtn) {
        editDoneBtn.addEventListener('click', () => {
            document.body.classList.remove('edit-mode');
            editDoneContainer.style.display = 'none';
            if (sortable) { sortable.destroy(); sortable = null; }
            
            const cards = document.querySelectorAll('.list-card');
            const newOrder = [];
            const newHidden = [];
            
            cards.forEach(card => {
                newOrder.push(card.id); // 순서 저장
                
                // 숨김 처리 확정
                if (card.classList.contains('hidden-item')) {
                    newHidden.push(card.id);
                    card.classList.remove('hidden-item');
                    card.classList.add('hidden');
                    card.style.display = 'none';
                } else {
                    card.style.display = 'flex';
                }
                
                // 눈 아이콘 제거
                const eyeBtn = card.querySelector('.edit-eye-btn');
                if (eyeBtn) eyeBtn.remove();
            });
            
            localStorage.setItem('menuOrder', JSON.stringify(newOrder));
            localStorage.setItem('hiddenMenus', JSON.stringify(newHidden));
            
            // 현재 탭에 맞춰 다시 필터링
            const activeTab = document.querySelector('.tab.active');
            if (activeTab) activeTab.click();
        });
    }


    // ==========================================
    // 모달 관리 & 뒤로가기 지원
    // ==========================================
    const modalOverlay = document.getElementById('modal-overlay');
    const iosModal = document.getElementById('ios-modal');
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

    let deferredPrompt;
    const installAppBtn = document.getElementById('install-app-btn');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
    });
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

    listContainer.addEventListener('click', async (e) => {
        if (document.body.classList.contains('edit-mode')) return;
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
                try {
                    await navigator.share({ url: shareUrl });
                    return;
                } catch (err) { console.log('공유 취소'); }
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