// frontend/js/auth/guard.js
import { checkAuthStatus } from '/js/auth/check_auth.js'; // 이미 만드신 인증 체크 로직 활용

export async function authGuard(route) {
    const user = await checkAuthStatus();

    // 로그인 필수 페이지인데 유저가 없는 경우
    if (route.auth === true && !user) {
        alert("로그인이 필요한 서비스입니다.");
        return "/login";
    }

    // 로그인한 유저가 로그인/회원가입 페이지에 접근하는 경우
    if (route.auth === 'guest' && user) {
        return "/";
    }

    return null; // 통과
}