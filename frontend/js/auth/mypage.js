// frontend/js/auth/mypage.js
import { fetchAPI } from '/js/api.js';
import { navigateTo } from '/js/router.js';

const PASSWORD_VERIFY_TOKEN_KEY = 'passwordVerifyToken';

const DOM = {
    changePwdLink: () => document.getElementById('change-password-link'),
    editProfileLink: () => document.getElementById('edit-profile-link'),
    modal: () => document.getElementById('password-verify-modal'),
    input: () => document.getElementById('password-verify-input'),
    error: () => document.getElementById('password-verify-error'),
    cancelBtn: () => document.getElementById('password-verify-cancel'),
    submitBtn: () => document.getElementById('password-verify-submit'),
};

let abortController = null;
let isSubmitting = false;
let targetPath = '';

const setError = (message) => {
    const errorEl = DOM.error();
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = !message;
};

const closeModal = () => {
    const modal = DOM.modal();
    if (modal) modal.hidden = true;
    
    const input = DOM.input();
    if (input) input.value = ''; 
    sessionStorage.removeItem(PASSWORD_VERIFY_TOKEN_KEY);
    targetPath = '';
    setError('');
};

// 💡 수정 1: path 파라미터 추가
const openModal = (path) => { 
    targetPath = path;
    const modal = DOM.modal();
    if (modal) {
        modal.hidden = false;
        DOM.input()?.focus();
    }
};

// --- 💡 [이벤트 핸들러] ---
const handlePwdChangeClick = (e) => {
    e.preventDefault();
    openModal('/change-password'); 
};

const handleProfileEditClick = (e) => {
    e.preventDefault();
    openModal('/profile'); 
};

// 💡 수정 2: init에서 참조하지만 누락된 핸들러 함수 추가
const handleCancelClick = () => closeModal();

const handleModalClick = (e) => {
    if (e.target === DOM.modal()) closeModal();
};

const handleInputKeydown = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
        e.preventDefault();
        handleVerifySubmit();
    }
};

async function handleVerifySubmit() {
    if (isSubmitting) return;
    
    const input = DOM.input();
    if (!input) return;

    const currentPassword = input.value.trim();
    if (!currentPassword) {
        setError('현재 비밀번호를 입력해 주세요.');
        return;
    }

    if (abortController) abortController.abort();
    abortController = new AbortController();

    try {
        isSubmitting = true;
        DOM.submitBtn().disabled = true;
        
        const result = await fetchAPI('/users/me/password/verify', {
            method: 'POST',
            body: JSON.stringify({ current_password: currentPassword }),
            signal: abortController.signal 
        });

        sessionStorage.setItem(PASSWORD_VERIFY_TOKEN_KEY, result.verification_token);
        
        const destination = targetPath; 
        closeModal();
        navigateTo(destination); 
        
    } catch (error) {
        if (error.name === 'AbortError') return;
        setError(error.message || '비밀번호 확인에 실패했습니다.');
        input.value = ''; 
        input.focus();
    } finally {
        isSubmitting = false;
        if (DOM.submitBtn()) DOM.submitBtn().disabled = false;
    }
}

// --- 💡 [메인 초기화 로직] ---
export function init() {
    // 💡 수정 3: 존재하지 않는 DOM.changeLink() 제거[cite: 9]
    const modal = DOM.modal();
    const cancel = DOM.cancelBtn();
    const submit = DOM.submitBtn();
    const input = DOM.input();
    const pwdLink = DOM.changePwdLink();
    const profileLink = DOM.editProfileLink();

    if (!modal || !input || !cancel || !submit) return;
    
    if (pwdLink) pwdLink.addEventListener('click', handlePwdChangeClick);
    if (profileLink) profileLink.addEventListener('click', handleProfileEditClick);

    // 💡 수정 4: 존재하지 않는 handleLinkClick 이벤트 바인딩 제거[cite: 9]
    cancel.addEventListener('click', handleCancelClick);
    modal.addEventListener('click', handleModalClick);
    input.addEventListener('keydown', handleInputKeydown);
    submit.addEventListener('click', handleVerifySubmit);
}

// --- 💡 [라우터 클린업] ---
export function cleanup() {
    if (abortController) {
        abortController.abort();
        abortController = null;
    }

    isSubmitting = false;
    sessionStorage.removeItem(PASSWORD_VERIFY_TOKEN_KEY);

    // 💡 수정 5: 존재하지 않는 DOM.changeLink() 제거[cite: 9]
    const modal = DOM.modal();
    const cancel = DOM.cancelBtn();
    const submit = DOM.submitBtn();
    const input = DOM.input();
    const pwdLink = DOM.changePwdLink();
    const profileLink = DOM.editProfileLink();

    // 💡 수정 6: 존재하지 않는 handleLinkClick 이벤트 해제 제거[cite: 9]
    if (cancel) cancel.removeEventListener('click', handleCancelClick);
    if (modal) modal.removeEventListener('click', handleModalClick);
    if (input) input.removeEventListener('keydown', handleInputKeydown);
    if (submit) submit.removeEventListener('click', handleVerifySubmit);
    if (pwdLink) pwdLink.removeEventListener('click', handlePwdChangeClick);
    if (profileLink) profileLink.removeEventListener('click', handleProfileEditClick);

    sessionStorage.removeItem(PASSWORD_VERIFY_TOKEN_KEY);
    targetPath = '';
}