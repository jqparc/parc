// frontend/js/auth/login.js
import { navigateTo } from "/js/router.js";
import { fetchAPI } from '/js/api.js';
import { CONFIG } from '/js/config.js';
import { authService } from '/js/auth/authService.js';

const handleLoginSubmit = async (e) => {
    // 1. 브라우저의 기본 폼 제출(새로고침 및 URL 쿼리스트링 추가) 방지! ⭐ 가장 중요
    e.preventDefault();

    // 2. input 필드의 값 가져오기
    const user_id = document.getElementById("user_id").value;
    const password = document.getElementById("password").value;

    // 간단한 프론트엔드 유효성 검사
    if (!user_id || !password) {
        alert("이메일과 비밀번호를 모두 입력해주세요.");
        return;
    }

    try {
        // 3. 백엔드(FastAPI)로 로그인 요청 (fetch API)
        
        const data = await fetchAPI('/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: user_id, password: password }),
            credentials: 'include' // 백엔드에서 내려주는 HttpOnly 쿠키를 받기 위해 필수
        });

        console.log("로그인 성공:", data);
        

        // 4. 로그인 성공 시 메인 화면으로 이동 (임시 테스트용)
        alert("로그인 성공! (API 통신 구현 전 임시 알림)");
        
        // 브라우저 주소를 메인('/')으로 바꾸고 화면을 다시 그립니다 (Step 3의 라우터 활용)
        authService.clearAuthCache();
        navigateTo(CONFIG.PAGE_URL.INDEX);
        //navigateTo('/');

    } catch (error) {
        console.error("로그인 에러:", error);
        alert("아이디 또는 비밀번호를 확인해주세요.");
    }
};

/**
 * 라우터가 화면을 그린 후 호출하는 초기화 함수
 */
export function init() {
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        // 폼 제출 이벤트(Enter 키 포함)에 핸들러를 연결합니다.
        loginForm.addEventListener("submit", handleLoginSubmit);
    }
}

/**
 * 라우터가 다른 화면으로 넘어가기 전 호출하는 정리 함수
 */
export function cleanup() {
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        // 메모리 누수를 막기 위해 연결했던 이벤트를 해제합니다.
        loginForm.removeEventListener("submit", handleLoginSubmit);
    }
}
