import { navigateTo } from "/js/router.js";
import { fetchAPI } from '/js/api.js';
import { CONFIG } from '/js/config.js';

const PASSWORD_CHANGE_TOKEN_KEY = 'passwordChangeToken';

function setError(message) {
    const errorEl = document.getElementById('change-password-error');
    if (!errorEl) return;

    errorEl.textContent = message;
    errorEl.hidden = !message;
}

function setSubmitting(isSubmitting) {
    const button = document.getElementById('change-pw-btn');
    if (!button) return;

    button.disabled = isSubmitting;
    button.textContent = isSubmitting ? '변경 중...' : '비밀번호 변경하기';
}

export function init() {
    const token = sessionStorage.getItem(PASSWORD_CHANGE_TOKEN_KEY);
    if (!token) {
        alert('현재 비밀번호 확인 후 이용해 주세요.');
        navigateTo('/mypage');
        return;
    }

    const changeButton = document.getElementById('change-pw-btn');
    const cancelButton = document.getElementById('change-pw-cancel');

    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            sessionStorage.removeItem(PASSWORD_CHANGE_TOKEN_KEY);
            navigateTo('/mypage');
        });
    }

    if (!changeButton) return;

    changeButton.addEventListener('click', async () => {
        const newPassword = document.getElementById('new_password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

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

            sessionStorage.removeItem(PASSWORD_CHANGE_TOKEN_KEY);
            alert('비밀번호가 변경되었습니다. 다시 로그인해 주세요.');
            await fetchAPI('/users/logout', { method: 'POST' }).catch(() => null);
            navigateTo(CONFIG.PAGE_URL.LOGIN);
        } catch (error) {
            setError(error.message || '비밀번호 변경에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    });
}
