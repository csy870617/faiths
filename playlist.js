// ==========================================
// CCM 유튜브 주소 관리 (랜덤 재생 지원)
// ==========================================
//
// 각 주제 값은 두 가지 형식을 지원합니다.
//  1) 유튜브 재생목록 링크 문자열 (권장): 해당 재생목록 안에서 랜덤으로 재생.
//     재생목록을 유튜브에서 수정하면 앱도 자동으로 최신 목록에서 재생합니다.
//     예) comfort: "https://www.youtube.com/playlist?list=PLxxxxxxxx"
//  2) 개별 영상 URL 배열 (기존 방식): 배열에서 무작위로 한 곡 재생.

const CCM_PLAYLIST = {
    // 1. 힘들고 지칠 때
    comfort: "https://www.youtube.com/playlist?list=PLf0S0SzAlW99lw1tHvzPMJSWPKUGrG3gz",

    // 2. 깊은 기도의 시간
    prayer: "https://www.youtube.com/playlist?list=PLV0pF8dtyZiM",

    // 3. 활기찬 아침
    morning: "https://www.youtube.com/playlist?list=PLXrzajD7aMdA",

    // 4. 잠들기 전 평안
    sleep: "https://www.youtube.com/playlist?list=PLBg0d5ZPYeRc",

    // 5. 신나는 노동요 & 드라이브
    drive: "https://www.youtube.com/playlist?list=PLXqKV2YjItAM",

    // 6. 카페에서 듣는 찬양
    cafe: "https://www.youtube.com/playlist?list=PLPMAn6rfTjkw",

    // 7. 7080 베스트 찬양
    oldies: "https://www.youtube.com/playlist?list=PLa_1KwB4UjHk",

    // 8. 은혜의 찬송가 플리
    hymn: "https://www.youtube.com/playlist?list=PLLvCJ2tsCIZI"
};
