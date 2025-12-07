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
        // [주의] YOUR_KAKAO_JS_KEY를 실제 키로 변경하세요
        if (!Kakao.isInitialized()) {
            Kakao.init('YOUR_KAKAO_JS_KEY'); 
        }
    } catch (e) {
        console.log('카카오 SDK 초기화 실패');
    }


    // ==========================================
    // [NEW] CCM 모달(팝업) 기능
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

    moodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const url = btn.getAttribute('data-url');
            if (url) {
                window.open(url, '_blank');
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
            const shareDesc = '말씀, 기도, 성장을 돕는 크리스천 필수 플랫폼 FAITHS에 초대합니다.';
            const shareImage = 'https://csy870617.github.io/todaybible/img/share_thumb.jpg';

            if (window.Kakao && Kakao.isInitialized()) {
                try {
                    Kakao.Share.sendDefault({
                        objectType: 'feed',
                        content: {
                            title: shareTitle, description: shareDesc, imageUrl: shareImage, 
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
            if (link) window.open(link, '_blank');
        });
    });

    // 탭 필터링 로직 (수정됨: 공유버튼 강제 표시 제거)
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const filterValue = tab.getAttribute('data-filter');
            
            cards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                
                // [수정] 조건문을 단순화하여 카테고리가 일치할 때만 보이게 수정
                if (filterValue === 'all' || filterValue === cardCategory) {
                    card.style.display = 'flex'; 
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

});