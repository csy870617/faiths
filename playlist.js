// ==========================================
// CCM 유튜브 주소 관리 (랜덤 재생 지원)
// ==========================================

const CCM_PLAYLIST = {
    // 1. 힘들고 지칠 때
    comfort: [
        "https://www.youtube.com/embed/8lkLZFE0ly8",
        "https://www.youtube.com/embed/-NGkYW74oKQ",
        "https://www.youtube.com/embed/n-_TY_Gnp0w",
        "https://www.youtube.com/embed/Jyzf5Q3A0cs",
        "https://www.youtube.com/embed/1XhTOE7S1lg",
        "https://www.youtube.com/embed/mSUxUWYfq4I",
        "https://www.youtube.com/embed/J9mNIr99RqQ",
        "https://www.youtube.com/embed/eWGehATN8Xk",
        "https://www.youtube.com/embed/FAa_oQo_tms"
    ],

    // 2. 깊은 기도의 시간
    prayer: [
        "https://www.youtube.com/embed/JO2tmJ9Fe2M",
        "https://www.youtube.com/embed/4HPAvNjPvIE",
        "https://www.youtube.com/embed/Tc0zj8rtKps",
        "https://www.youtube.com/embed/FYkaIiDSc1Q",
        "https://www.youtube.com/embed/c6KH-5EjTIU",
        "https://www.youtube.com/embed/fb4UgjdiRy4",
        "https://www.youtube.com/embed/KOSJHN89qk8",
        "https://www.youtube.com/embed/TGE56pKXyp4",
        "https://www.youtube.com/embed/PrYd9qUhJgE"
    ],

    // 3. 활기찬 아침
    morning: [
        "https://www.youtube.com/embed/crrfujNlEL8",
        "https://www.youtube.com/embed/j-LdIhGA2Uk",
        "https://www.youtube.com/embed/pYikyg2j3rU",
        "https://www.youtube.com/embed/8YrD1ZTbKAk",
        "https://www.youtube.com/embed/NxDnks17rbs",
        "https://www.youtube.com/embed/x3RtGW4neh8",
        "https://www.youtube.com/embed/rV2STvfIIUo",
        "https://www.youtube.com/embed/u-DaUpYOe34",
        "https://www.youtube.com/embed/dhUlSiItGAM",
        "https://www.youtube.com/embed/Av1z2P8tGN0",
        "https://www.youtube.com/embed/xokf7CBUGO4",
        "https://www.youtube.com/embed/VJqhRwD2vs0"
    ],

    // 4. 잠들기 전 평안
    sleep: [
        "https://www.youtube.com/embed/MK09F_X-YXA",
        "https://www.youtube.com/embed/Xu0FLSFwkKE",
        "https://www.youtube.com/embed/u3zoXZHU9Dk",
        "https://www.youtube.com/embed/KEN341CJV1E",
        "https://www.youtube.com/embed/mlyy2XV4Bck",
        "https://www.youtube.com/embed/4exK8f30HM0",
        "https://www.youtube.com/embed/57eqKmCuIP4",
        "https://www.youtube.com/embed/E7d4TFxn5dY",
        "https://www.youtube.com/embed/gDS3Ar1ZQm4"
    ],

    // 5. 신나는 노동요 & 드라이브
    drive: [
        "https://www.youtube.com/embed/Xd5raTcGV1s",
        "https://www.youtube.com/embed/t_hkY41s-98",
        "https://www.youtube.com/embed/UiZvRBRm6YI",
        "https://www.youtube.com/embed/RjtD43Vozm4",
        "https://www.youtube.com/embed/NxDnks17rbs",
        "https://www.youtube.com/embed/MWhlPTtJPi0",
        "https://www.youtube.com/embed/94RK8qFXmgA",
        "https://www.youtube.com/embed/nF4rjcSUJgI",
        "https://www.youtube.com/embed/neqhNmR2kgY",
        "https://www.youtube.com/embed/DLcaLTsrCPI",
        "https://www.youtube.com/embed/11-btPv8-8c"
    ],

    // 6. 카페에서 듣는 찬양
    cafe: [
        "https://www.youtube.com/embed/BsszEkOzjCQ",
        "https://www.youtube.com/embed/6v5NEEttOa0",
        "https://www.youtube.com/embed/ikuY2YMb0yk",
        "https://www.youtube.com/embed/fB1CqDmHZWU",
        "https://www.youtube.com/embed/5M8XCiBTj8Y",
        "https://www.youtube.com/embed/2pCT3Nz_0u0",
        "https://www.youtube.com/embed/FptG0S6VTrQ"
    ],

    // [NEW] 7. 7080 베스트 찬양
    oldies: [
        "https://www.youtube.com/embed/iilDmtK35dw", // 7080 찬양 15곡 모음
        "https://www.youtube.com/embed/ahSQ-JySOfo", // 은혜와 감동의 7080
        "https://www.youtube.com/embed/vttUcyns0GU"  // 복음성가 가수 베스트
    ],

    // [NEW] 8. 은혜의 찬송가 플리
    hymn: [
        "https://www.youtube.com/embed/T3ERy6rpS_s", // 베스트 은혜 찬송가 20
        "https://www.youtube.com/embed/RAdc5L1nihg", // 한국인이 사랑하는 찬송가
        "https://www.youtube.com/embed/Pz_16UFdxSA", // 찬송가 100선
        "https://www.youtube.com/embed/gVbqXSFGiAQ"  // 은혜의 찬송가 40곡
    ]
};