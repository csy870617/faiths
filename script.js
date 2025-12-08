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
    
    // [NEW] 로딩 화면 처리
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.opacity = '0'; // 투명해짐
            setTimeout(() => {
                loadingScreen.style.display = 'none'; // 사라짐
            }, 500);
        }, 2200); // 2.2초 동안 보여줌
    }

    // 1. 카카오톡 초기화
    try {
        if (!Kakao.isInitialized()) {
            Kakao.init('b5c055c0651a6fce6f463abd18a9bdc7'); 
        }
    } catch (e) { console.log('카카오 SDK 초기화 실패'); }

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
    // 메뉴 순서 및 숨김 관리
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
                card.style.display = 'flex';
                if (card.classList.contains('hidden')) {
                    card.classList.add('hidden-item');
                    card.classList.remove('hidden');
                }
                if (!card.querySelector('.edit-eye-btn')) {
                    const eyeBtn = document.createElement('button');
                    eyeBtn.className = 'edit-eye-btn';
                    eyeBtn.innerHTML = '👁️';
                    eyeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        card.classList.toggle('hidden-item');
                        eyeBtn.style.opacity = card.classList.contains('hidden-item') ? '0.5' : '1';
                    });
                    card.appendChild(eyeBtn);
                }
            });
            sortable = new Sortable(listContainer, { animation: 350, easing: "cubic-bezier(0.25, 1, 0.5, 1)", ghostClass: 'sortable-ghost', dragClass: 'sortable-drag', delay: 150, delayOnTouchOnly: true, swapThreshold: 0.65 });
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
                newOrder.push(card.id);
                if (card.classList.contains('hidden-item')) {
                    newHidden.push(card.id);
                    card.classList.remove('hidden-item');
                    card.classList.add('hidden');
                    card.style.display = 'none';
                } else {
                    card.style.display = 'flex';
                }
                const eyeBtn = card.querySelector('.edit-eye-btn');
                if (eyeBtn) eyeBtn.remove();
            });
            localStorage.setItem('menuOrder', JSON.stringify(newOrder));
            localStorage.setItem('hiddenMenus', JSON.stringify(newHidden));
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
        // history.back()은 하지 않음 (popstate에서 처리되거나, 닫기 버튼 로직에서 처리)
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
            // playlist.js에서 URL 찾기
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
            if (navigator.share) {
                try { await navigator.share({ url: shareUrl }); } catch (err) { console.log('공유 취소'); }
            } else {
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    alert('사이트 주소가 복사되었습니다!\n원하는 곳에 붙여넣기 해주세요.');
                } catch (err) { prompt('주소를 복사하세요:', shareUrl); }
            }
        } else {
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