import { fetchAPI } from '/js/api.js';
import { navigateTo } from '/js/router.js';

let authStatusPromise = null;

export function clearAuthStatusCache() {
    authStatusPromise = null;
}

export async function checkAuthStatus({ force = false } = {}) {
    if (!force && authStatusPromise) {
        return authStatusPromise;
    }

    authStatusPromise = fetchAPI('/users/me').catch(() => null);
    return authStatusPromise;
}

async function logout() {
    try {
        await fetchAPI('/users/logout', { method: 'POST' });
    } finally {
        clearAuthStatusCache();
        alert("로그아웃 되었습니다.");
        await updateAuthUI(null);
        navigateTo('/');
    }
}

export async function updateAuthUI(user = undefined) {
    const authMenu = document.getElementById('header-auth-nav');
    if (!authMenu) return;

    if (user === undefined) {
        user = await checkAuthStatus();
    }

    if (user) {
        authMenu.innerHTML = `
            <a href="/mypage" class="user-link" data-link>
                <strong>${user.user_id}</strong>님
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
