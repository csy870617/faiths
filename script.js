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
            closeModal(settingsModal); 
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
        if (history.state && history.state.modalOpen) { history.back(); }
    };

    window.addEventListener('popstate', () => {
        if (currentModal) {
            currentModal.classList.remove('show');
            setTimeout(() => { currentModal.style.display = 'none'; }, 300);
            currentModal = null;
        }
    });

    const closeWithBack = (modal) => {
        if (history.state && history.state.modalOpen) { history.back(); }
        else {
            modal.classList.remove('show');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
            currentModal = null;
        }
    };

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
            const url = btn.getAttribute('data-url');
            if (url) {
                openExternalLink(url);
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
                    closeWithBack(settingsModal);
                    setTimeout(() => openModal(iosModal), 350);
                } else {
                    alert("이미 설치되어 있거나 브라우저 메뉴에서 설치 가능합니다.");
                }
            }
        });
    }


    // ==========================================
    // 2. 친구 초대 (공유) 기능 [수정됨: 카카오톡 1순위]
    // ==========================================
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            
            const shareUrl = location.href;
            const shareTitle = 'FAITHS - 크리스천 성장 도구';
            const shareDesc = '더 멋진 크리스천으로 함께 성장해요';
            const shareImage = new URL('thumbnail.png', window.location.href).href;

            // [1순위] 카카오톡 공유 시도
            if (window.Kakao && Kakao.isInitialized()) {
                try {
                    Kakao.Share.sendDefault({
                        objectType: 'feed',
                        content: {
                            title: shareTitle, 
                            description: shareDesc, 
                            imageUrl: shareImage, 
                            link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
                        },
                        buttons: [{ title: '바로가기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl }}],
                    });
                    // 카카오톡 실행에 성공하면 여기서 함수 종료 (다른 공유 창 안 뜨게)
                    return; 
                } catch (err) {
                    console.log('카카오 공유 실패, 다음 단계로...');
                }
            }

            // [2순위] 기본 공유 (Web Share API)
            if (navigator.share) {
                try {
                    await navigator.share({
                        // 제목/내용 없이 URL만 보내면 더 깔끔하게 뜨는 경우가 많음
                        url: shareUrl 
                    });
                    return;
                } catch (err) { console.log('기본 공유 취소'); }
            }

            // [3순위] 클립보드 복사
            try {
                await navigator.clipboard.writeText(shareUrl);
                alert('주소가 복사되었습니다! \n원하는 곳에 붙여넣기 하세요.');
            } catch (err) { alert('공유하기를 지원하지 않는 브라우저입니다.'); }
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
            // 위에서 정의한 shareBtn 로직을 따르지만,
            // 동적으로 생성되거나 이벤트 버블링을 위해 여기서 트리거할 경우를 대비해
            // shareBtn.click()을 호출하는 것이 안전함.
            // 하지만 여기서는 card-share 자체가 shareBtn 아이디를 가지므로
            // 위의 addEventListener('click')이 먼저 실행됨. 중복 실행 방지용 return.
            return;
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