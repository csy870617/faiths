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
    // 메뉴 순서 및 숨김 관리 (Drag & Drop)
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
            closeModal(settingsModal); // 설정창 닫기 (히스토리 처리 포함)
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
            sortable = new Sortable(listContainer, { animation: 150, ghostClass: 'sortable-ghost', dragClass: 'sortable-drag', delay: 100, delayOnTouchOnly: true });
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
    // [NEW] 모달 관리 & 뒤로가기 지원
    // ==========================================
    const modalOverlay = document.getElementById('modal-overlay');
    const iosModal = document.getElementById('ios-modal');
    // const settingsModal = ...
    const ccmBtn = document.getElementById('ccm-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const closeIosModalBtn = document.getElementById('close-ios-modal');
    const closeSettingsBtn = document.getElementById('close-settings-modal');
    const moodBtns = document.querySelectorAll('.mood-btn');

    let currentModal = null; // 현재 열린 모달 추적

    // 모달 열기 (히스토리 추가)
    const openModal = (modal) => {
        currentModal = modal;
        modal.style.display = 'flex';
        setTimeout(() => { modal.classList.add('show'); }, 10);
        // 히스토리 스택에 상태 추가 (뒤로가기 시 닫기 위해)
        history.pushState({ modalOpen: true }, null, ""); 
    };

    // 모달 닫기 (히스토리 백 or 직접 닫기)
    const closeModal = (modal) => {
        if (!modal) return;
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
        currentModal = null;
        
        // 히스토리 상태가 모달 오픈 상태라면 뒤로가기 실행
        if (history.state && history.state.modalOpen) {
            history.back(); 
        }
    };

    // [핵심] 브라우저 뒤로가기 감지 (popstate 이벤트)
    window.addEventListener('popstate', () => {
        // 뒤로가기를 눌렀는데 모달이 열려있다면 닫기 (UI만)
        if (currentModal) {
            currentModal.classList.remove('show');
            setTimeout(() => { currentModal.style.display = 'none'; }, 300);
            currentModal = null;
        }
    });

    // 닫기 버튼을 눌렀을 때 (history.back을 호출하여 popstate 유도)
    const closeWithBack = (modal) => {
        if (history.state && history.state.modalOpen) {
            history.back(); // 이게 popstate를 발생시켜서 위 로직이 실행됨
        } else {
            // 혹시 히스토리가 꼬였을 경우 강제 닫기
            modal.classList.remove('show');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
            currentModal = null;
        }
    };


    // 이벤트 연결
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

    // CCM 내부 버튼 클릭 시
    moodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const url = btn.getAttribute('data-url');
            if (url) {
                openExternalLink(url);
                closeWithBack(modalOverlay); // 이동 후 닫기
            }
        });
    });

    // 글자 크기
    const fontSizeSlider = document.getElementById('font-size-slider');
    if (fontSizeSlider) {
        const savedScale = localStorage.getItem('textScale');
        if (savedScale) { document.documentElement.style.setProperty('--text-scale', savedScale); fontSizeSlider.value = savedScale; }
        fontSizeSlider.addEventListener('input', (e) => { const scale = e.target.value; document.documentElement.style.setProperty('--text-scale', scale); localStorage.setItem('textScale', scale); });
    }

    // PWA 설치
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
                    closeWithBack(settingsModal); // 설정창 닫고
                    setTimeout(() => openModal(iosModal), 350); // 아이폰 창 열기
                } else {
                    alert("이미 설치되어 있거나 브라우저 메뉴에서 설치 가능합니다.");
                }
            }
        });
    }

    // 메인 리스트 클릭
    listContainer.addEventListener('click', (e) => {
        if (document.body.classList.contains('edit-mode')) return;
        const card = e.target.closest('.list-card');
        if (!card) return;

        if (card.id === 'card-ccm') {
            openModal(modalOverlay);
        } else if (card.id === 'card-share') {
            const shareUrl = location.href;
            const shareTitle = 'FAITHS - 크리스천 성장 도구';
            const shareDesc = '더 멋진 크리스천으로 함께 성장해요';
            const shareImage = new URL('thumbnail.png', window.location.href).href;
            if (window.Kakao && Kakao.isInitialized()) {
                Kakao.Share.sendDefault({ objectType: 'feed', content: { title: shareTitle, description: shareDesc, imageUrl: shareImage, link: { mobileWebUrl: shareUrl, webUrl: shareUrl }, }, buttons: [{ title: '바로가기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl }}] });
            } else if (navigator.share) {
                navigator.share({ url: shareUrl });
            } else {
                navigator.clipboard.writeText(shareUrl).then(() => alert('주소 복사됨'));
            }
        } else {
            const link = card.getAttribute('data-link');
            if (link) openExternalLink(link);
        }
    });

    // 탭 필터링
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