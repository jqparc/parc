import { fetchAPI } from '/js/api.js';
import { navigateTo } from '/js/router.js';

const PASSWORD_CHANGE_TOKEN_KEY = 'passwordChangeToken';

export function init() {
    const changePasswordLink = document.getElementById('change-password-link');
    const modal = document.getElementById('password-verify-modal');
    const input = document.getElementById('password-verify-input');
    const errorEl = document.getElementById('password-verify-error');
    const cancelBtn = document.getElementById('password-verify-cancel');
    const submitBtn = document.getElementById('password-verify-submit');

    if (!changePasswordLink || !modal || !input || !cancelBtn || !submitBtn) return;

    const setError = (message) => {
        if (!errorEl) return;
        errorEl.textContent = message;
        errorEl.hidden = !message;
    };

    const closeModal = () => {
        modal.hidden = true;
        input.value = '';
        setError('');
    };

    const openModal = () => {
        modal.hidden = false;
        input.focus();
    };

    changePasswordLink.addEventListener('click', (event) => {
        event.preventDefault();
        sessionStorage.removeItem(PASSWORD_CHANGE_TOKEN_KEY);
        openModal();
    });

    cancelBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            submitBtn.click();
        }
    });

    submitBtn.addEventListener('click', async () => {
        const currentPassword = input.value.trim();
        if (!currentPassword) {
            setError('현재 비밀번호를 입력해 주세요.');
            return;
        }

        try {
            submitBtn.disabled = true;
            const result = await fetchAPI('/users/me/password/verify', {
                method: 'POST',
                body: JSON.stringify({ current_password: currentPassword }),
            });

            sessionStorage.setItem(PASSWORD_CHANGE_TOKEN_KEY, result.verification_token);
            closeModal();
            navigateTo('/change-password');
        } catch (error) {
            setError(error.message || '비밀번호 확인에 실패했습니다.');
        } finally {
            submitBtn.disabled = false;
        }
    });
}
