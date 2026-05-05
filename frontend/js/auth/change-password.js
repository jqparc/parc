// frontend/js/auth/change-password.js
import { navigateTo } from "/js/router.js";
import { fetchAPI } from '/js/api.js';
import { CONFIG } from '/js/config.js';
import { authService } from '/js/auth/authService.js'; // 🔥 프론트엔드 인증 상태 동기화를 위해 임포트

const PASSWORD_CHANGE_TOKEN_KEY = 'passwordChangeToken';

// --- 💡 [DOM 캐싱] 문서 전체 탐색 최소화 ---
const DOM = {
    newPassword: () => document.getElementById('new_password'),
    confirmPassword: () => document.getElementById('confirm_password'),
    changeBtn: () => document.getElementById('change-pw-btn'),
    cancelBtn: () => document.getElementById('change-pw-cancel'),
    error: () => document.getElementById('change-password-error'),
};

function setError(message) {
    const errorEl = DOM.error();
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = !message;
}

function setSubmitting(isSubmitting) {
    const button = DOM.changeBtn();
    if (!button) return;
    button.disabled = isSubmitting;
    button.textContent = isSubmitting ? '변경 중...' : '비밀번호 변경하기';
}

// --- 💡 [이벤트 로직] 비밀번호 변경 처리 ---
async function handleChangePassword(token) {
    const newPassword = DOM.newPassword()?.value;
    const confirmPassword = DOM.confirmPassword()?.value;

    setError('');

    if (!newPassword || !confirmPassword) {
        setError('새 비밀번호와 비밀번호 확인을 입력해 주세요.');
        return;
    }

    if (newPassword !== confirmPassword) {
        setError('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
        return;
    }

    if (newPassword.length < 8) {
        setError('새 비밀번호는 8글자 이상이어야 합니다.');
        return;
    }

    try {
        setSubmitting(true);
        await fetchAPI('/users/me/password', {
            method: 'PUT',
            body: JSON.stringify({
                verification_token: token,
                new_password: newPassword,
            })
        });

        // 성공 시 토큰 파기
        sessionStorage.removeItem(PASSWORD_CHANGE_TOKEN_KEY);
        alert('비밀번호가 변경되었습니다. 다시 로그인해 주세요.');
        
        // 🔥 보안: 직접 API를 찌르는 대신 authService를 통해 로그아웃 & 프론트 캐시 초기화
        await authService.logout().catch(() => null); 
        authService.clearAuthCache(); 
        
        navigateTo(CONFIG.PAGE_URL.LOGIN);
    } catch (error) {
        setError(error.message || '비밀번호 변경에 실패했습니다.');
    } finally {
        setSubmitting(false);
    }
}

// --- 💡 [메인 초기화 로직] ---
export function init() {
    const token = sessionStorage.getItem(PASSWORD_CHANGE_TOKEN_KEY);
    if (!token) {
        alert('현재 비밀번호 확인 후 이용해 주세요.');
        navigateTo('/mypage');
        return;
    }

    // 🔥 SPA 환경에 맞게 addEventListener 대신 onclick 사용으로 중복 실행 원천 차단
    if (DOM.cancelBtn()) {
        DOM.cancelBtn().onclick = () => {
            sessionStorage.removeItem(PASSWORD_CHANGE_TOKEN_KEY);
            navigateTo('/mypage');
        };
    }

    if (DOM.changeBtn()) {
        DOM.changeBtn().onclick = () => handleChangePassword(token);
    }
}

// --- 💡 [라우터 클린업] 최고 수준의 보안 및 누수 방지 ---
export function cleanup() {
    // 🔥 보안 핵심: 사용자가 변경을 안 하고 뒤로가기나 다른 메뉴로 이탈할 경우 토큰을 즉각 파기합니다.
    sessionStorage.removeItem(PASSWORD_CHANGE_TOKEN_KEY);
    
    // 메모리 정리
    if (DOM.cancelBtn()) DOM.cancelBtn().onclick = null;
    if (DOM.changeBtn()) DOM.changeBtn().onclick = null;
}