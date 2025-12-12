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
        "https://www.youtube.com/embed/FAa_oQo_tms",
        "https://www.youtube.com/embed/zHfp71hwO2g", // [NEW]
        "https://www.youtube.com/embed/RcmyhEvaYWA", // [NEW]
        "https://www.youtube.com/embed/OTTWQ8ePxBQ", // [NEW]
        "https://www.youtube.com/embed/Rc_QHVrUlx8", // [NEW]
        "https://www.youtube.com/embed/SJwVH-Agzbw"  // [NEW]
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
        "https://www.youtube.com/embed/PrYd9qUhJgE",
        "https://www.youtube.com/embed/ye2B_dLOZYw", // [NEW]
        "https://www.youtube.com/embed/JHchbQxnUnU", // [NEW]
        "https://www.youtube.com/embed/3-ShlJLcnFc"  // [NEW]
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
        "https://www.youtube.com/embed/VJqhRwD2vs0",
        "https://www.youtube.com/embed/zNz3jJ-8s8A", // [NEW]
        "https://www.youtube.com/embed/Nf93e2Kc61Y", // [NEW]
        "https://www.youtube.com/embed/ZRHv4N-LpSY", // [NEW]
        "https://www.youtube.com/embed/w-5WfXpddLU"  // [NEW]
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
        "https://www.youtube.com/embed/gDS3Ar1ZQm4",
        "https://www.youtube.com/embed/b1XiJeyFdWU", // [NEW]
        "https://www.youtube.com/embed/2XE_lxZ5vgI", // [NEW]
        "https://www.youtube.com/embed/pW9cPvgz7ME", // [NEW]
        "https://www.youtube.com/embed/cUh8EjhWdbE", // [NEW]
        "https://www.youtube.com/embed/dsN48ty2TKY", // [NEW]
        "https://www.youtube.com/embed/jDoCHM2BMb4"  // [NEW]
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
        "https://www.youtube.com/embed/11-btPv8-8c",
        "https://www.youtube.com/embed/Xg-rjbC_fjI", // [NEW]
        "https://www.youtube.com/embed/kBhMLA_vFgk", // [NEW]
        "https://www.youtube.com/embed/fy9-fqTe16M", // [NEW]
        "https://www.youtube.com/embed/6UVmBCaDSoI", // [NEW]
        "https://www.youtube.com/embed/x20LnUjrIKA", // [NEW]
        "https://www.youtube.com/embed/RoBEAr0EbcI", // [NEW]
        "https://www.youtube.com/embed/Av1z2P8tGN0", // [NEW]
        "https://www.youtube.com/embed/GhTd3RtoC00"  // [NEW]
    ],

    // 6. 카페에서 듣는 찬양
    cafe: [
        "https://www.youtube.com/embed/BsszEkOzjCQ",
        "https://www.youtube.com/embed/6v5NEEttOa0",
        "https://www.youtube.com/embed/ikuY2YMb0yk",
        "https://www.youtube.com/embed/fB1CqDmHZWU",
        "https://www.youtube.com/embed/5M8XCiBTj8Y",
        "https://www.youtube.com/embed/2pCT3Nz_0u0",
        "https://www.youtube.com/embed/FptG0S6VTrQ",
        "https://www.youtube.com/embed/nK-P0GveIuY", // [NEW]
        "https://www.youtube.com/embed/42MllIvRXQc", // [NEW]
        "https://www.youtube.com/embed/2OZX0_9OwAc", // [NEW]
        "https://www.youtube.com/embed/z91F5RJcIUw", // [NEW]
        "https://www.youtube.com/embed/PmqJZHWm7JA"  // [NEW]
    ],

    // 7. 7080 베스트 찬양
    oldies: [
        "https://www.youtube.com/embed/aqQ0fOBxL8E",
        "https://www.youtube.com/embed/1qa1DcY1fBk",
        "https://www.youtube.com/embed/udakoVS0HyU",
        "https://www.youtube.com/embed/31O-eK9oX70",
        "https://www.youtube.com/embed/Duln3Uo6J0k",
        "https://www.youtube.com/embed/B6gCbqZIrxE",
        "https://www.youtube.com/embed/ufSakfFXPmU",
        "https://www.youtube.com/embed/8ouOjt4hZu0",
        "https://www.youtube.com/embed/kagI5DQZE6U",
        "https://www.youtube.com/embed/RI5zr4CLhCo",
        "https://www.youtube.com/embed/mBSv11nf3DM"
    ],

    // 8. 은혜의 찬송가 플리
    hymn: [
        "https://www.youtube.com/embed/_GmnL3Jb3s4",
        "https://www.youtube.com/embed/ph72EkaBrog",
        "https://www.youtube.com/embed/Xsnhus5FkKw",
        "https://www.youtube.com/embed/YdcHG4XHNdY",
        "https://www.youtube.com/embed/Kh4X7Uq3MH4",
        "https://www.youtube.com/embed/BeoPMcAS3JA",
        "https://www.youtube.com/embed/s2EJ_-pHidE",
        "https://www.youtube.com/embed/EezhuJJiZjo",
        "https://www.youtube.com/embed/WmBny2r7cCE",
        "https://www.youtube.com/embed/Gq27mVMY7Ps"
    ]
};