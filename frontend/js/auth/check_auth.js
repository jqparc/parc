// frontend/js/auth/check_auth.js
import { authService } from '/js/auth/authService.js';
import { navigateTo } from '/js/router.js';

// 외부에서 checkAuthStatus를 호출하던 기존 호환성을 위해 래핑[cite: 5]
export async function checkAuthStatus(options) {
    return await authService.verifySession(options);
}

// UI 및 라우팅 역할만 수행하도록 수정[cite: 5]
async function logout() {
    try {
        await authService.logout(); 
    } finally {
        authService.clearAuthCache(); // 서비스 계층의 캐시 초기화
        alert("로그아웃 되었습니다.");
        await updateAuthUI(null);
        navigateTo('/');
    }
}

// 기존 DOM 조작 로직 유지 (의존성만 깔끔하게 정리됨)[cite: 5]
export async function updateAuthUI(user = undefined) {
    const authMenu = document.getElementById('header-auth-nav');
    if (!authMenu) return;

    if (user === undefined) {
        user = await checkAuthStatus();
    }

    if (user) {
        authMenu.innerHTML = `
            <a href="/mypage" class="user-link" data-link>
                <strong>${user.nickname}</strong>님
            </a>
            <button id="logout-btn" class="logout-btn">로그아웃</button>
        `;

        document.getElementById('logout-btn').addEventListener('click', logout);
    } else {
        authMenu.innerHTML = `
            <a href="/login" data-link>로그인</a>
            <a href="/signup" data-link>회원가입</a>
        `;
    }
}