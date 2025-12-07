document.addEventListener('DOMContentLoaded', () => {
    
    // 1. 카카오톡 초기화
    try {
        if (!Kakao.isInitialized()) {
            Kakao.init('b5c055c0651a6fce6f463abd18a9bdc7'); 
        }
    } catch (e) {
        console.log('카카오 SDK 초기화 실패');
    }

    // ============================================================
    // [핵심] 링크 열기 헬퍼 함수 (인앱브라우저 탈출 로직 포함)
    // ============================================================
    function openExternalLink(url) {
        const userAgent = navigator.userAgent.toLowerCase();
        
        // 안드로이드이면서 카톡/라인/인스타/페이스북 등 인앱브라우저인 경우
        if (userAgent.match(/android/i) && userAgent.match(/kakaotalk|line|instagram|facebook|wv/i)) {
            
            // 'https://' 를 제거한 주소
            const rawUrl = url.replace(/^https?:\/\//i, '');
            
            // 안드로이드 Intent 스킴을 사용하여 기본 브라우저 강제 호출
            // package 지정을 삭제하여 사용자가 설정한 기본 브라우저가 뜨게 함
            const intentUrl = `intent://${rawUrl}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;
            
            window.location.href = intentUrl;
        } 
        // 아이폰이거나 일반 브라우저인 경우
        else {
            window.open(url, '_blank');
        }
    }


    // ==========================================
    // CCM 모달(팝업) 기능
    // ==========================================
    const ccmBtn = document.getElementById('ccm-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalBtn = document.getElementById('close-modal');
    const moodBtns = document.querySelectorAll('.mood-btn');

    if (ccmBtn) {
        ccmBtn.addEventListener('click', () => {
            modalOverlay.style.display = 'flex';
            setTimeout(() => {
                modalOverlay.classList.add('show');
            }, 10);
        });
    }

    const closeModal = () => {
        modalOverlay.classList.remove('show');
        setTimeout(() => {
            modalOverlay.style.display = 'none';
        }, 300);
    };

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    // 모달 내부 버튼 클릭 시
    moodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const url = btn.getAttribute('data-url');
            if (url) {
                openExternalLink(url); // [변경] 헬퍼 함수 사용
                closeModal();
            }
        });
    });


    // ==========================================
    // 2. 친구 초대 (공유) 기능
    // ==========================================
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            
            const shareUrl = location.href;
            const shareTitle = 'FAITHS - 크리스천 성장 도구';
            const shareDesc = '더 멋진 크리스천으로 함께 성장해요.';
            
            // 썸네일 경로 자동 생성
            const shareImage = new URL('thumbnail.png', window.location.href).href;

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
                        buttons: [{ title: '함께 성장하기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl }}],
                    });
                    return;
                } catch (err) { console.log('카카오 공유 실패'); }
            }
            if (navigator.share) {
                try {
                    await navigator.share({ title: shareTitle, text: shareDesc, url: shareUrl });
                    return;
                } catch (err) { console.log('기본 공유 취소'); }
            }
            try {
                await navigator.clipboard.writeText(shareUrl);
                alert('주소가 복사되었습니다!');
            } catch (err) { alert('공유하기를 지원하지 않는 브라우저입니다.'); }
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
                if (isIos) alert("아이폰: 공유 버튼 -> [홈 화면에 추가]");
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
            if (link) {
                openExternalLink(link); // [변경] 헬퍼 함수 사용
            }
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