// frontend/js/auth/check_auth.js
import { fetchAPI } from '/js/api.js';
import { navigateTo } from '/js/router.js';

// 가드에서 사용할 "순수 인증 체크" 함수를 내보냅니다.[cite: 1, 2]
export async function checkAuthStatus() {
    try {
        // 백엔드 엔드포인트 /users/me 호출[cite: 1, 2]
        return await fetchAPI('/users/me');
    } catch (error) {
        return null; // 비로그인 또는 에러 시 null 반환
    }
}

// UI를 업데이트하는 기존 함수입니다.
export async function updateAuthUI() {
    const authMenu = document.getElementById('header-auth-nav');
    if (!authMenu) return;

    const user = await checkAuthStatus(); // 위에서 만든 함수 재사용

    if (user) {
        // 로그인 상태 UI[cite: 2]
        authMenu.innerHTML = `
            <span class="user-name">Welcome, <strong>${user.user_id}</strong>님</span>
            <button id="logout-btn" class="logout-btn">로그아웃</button>
        `;

        document.getElementById('logout-btn').addEventListener('click', async () => {
            await fetchAPI('/users/logout', { method: 'POST' });
            alert("로그아웃 되었습니다.");
            await updateAuthUI(); 
            navigateTo('/'); 
        });
    } else {
        // 비로그인 상태 UI[cite: 2]
        authMenu.innerHTML = `
            <a href="/login" data-link>로그인</a>
            <a href="/signup" data-link>회원가입</a>
        `;
    }
}