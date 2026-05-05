// frontend/js/auth/guard.js

const LOGIN_ALERT_COOLDOWN_MS = 500; // 중복 알림 방지 쿨다운 시간[cite: 6]

let isAlertShowing = false; 

function showLoginRequiredAlertOnce() {
    // 1. 이미 팝업이 화면에 떠 있다면 이후의 요청은 모두 무시
    if (isAlertShowing) return; 

    const now = Date.now();
    const lastAlertTime = window.__parcLoginAlertTime || 0;

    // 2. 팝업이 닫힌 지 0.5초 이내라면 무시 (따닥 클릭 방지)
    if (now - lastAlertTime < 500) {
        return;
    }

    isAlertShowing = true; // 팝업 잠금 활성화
    alert("로그인이 필요한 화면입니다.");
    
    // 🔥 3. 핵심: 사용자가 '확인'을 눌러 팝업이 닫힌 '직후'의 시간을 기록
    window.__parcLoginAlertTime = Date.now(); 
    isAlertShowing = false; // 팝업 잠금 해제
}

/**
 * 라우터 진입 전 접근 권한을 검사합니다.
 * 백엔드 권한과 무관하게 프론트엔드의 route.auth 설정을 절대적으로 따릅니다.
 */
export async function authGuard(route, user, routeKey = window.location.pathname, path = window.location.pathname) {
    
    // 1. 프론트엔드에서 auth: true로 설정했는데 유저가 없는 경우 -> 예외 없이 무조건 막음
    if (route.auth === true && !user) {
        showLoginRequiredAlertOnce(routeKey);
        return "/login";
    }

    // 2. 로그인한 유저가 게스트 전용 페이지(로그인, 회원가입 등)에 접근한 경우 -> 메인으로 이동[cite: 6]
    if (route.auth === 'guest' && user) {
        return "/";
    }

    // 3. 그 외의 경우는 모두 통과 (auth: false 등)[cite: 6]
    return null;
}