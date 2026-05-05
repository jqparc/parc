import { navigateTo } from "/js/router.js";
import { fetchAPI } from '/js/api.js';
import { CONFIG } from '/js/config.js';

const availabilityState = {
    user_id: { value: '', available: false },
    nickname: { value: '', available: false }
};

function debounce(callback, delay = 450) {
    let timerId = null;
    return (...args) => {
        clearTimeout(timerId);
        timerId = setTimeout(() => callback(...args), delay);
    };
}

function setFieldMessage(element, message, isOk = false) {
    if (!element) return;
    element.textContent = message;
    element.hidden = !message;
    element.style.color = isOk ? 'green' : 'red';
}

function checkPasswordMatch() {
    const passwordEl = document.getElementById('password');
    const confirmPasswordEl = document.getElementById('confirm_password');
    const passwordMsg = document.getElementById('password_msg');

    if (!passwordEl || !confirmPasswordEl || !passwordMsg) return;

    if (confirmPasswordEl.value === '') {
        setFieldMessage(passwordMsg, '');
        return;
    }

    if (passwordEl.value !== confirmPasswordEl.value) {
        setFieldMessage(passwordMsg, '비밀번호가 일치하지 않습니다.');
        return;
    }

    setFieldMessage(passwordMsg, '비밀번호가 일치합니다.', true);
}

async function checkAvailability(field, value) {
    const trimmedValue = value.trim();
    const msgEl = document.getElementById(`${field}_msg`);
    const minLength = field === 'user_id' ? 4 : 2;
    const label = field === 'user_id' ? '아이디' : '닉네임';

    availabilityState[field] = { value: trimmedValue, available: false };

    if (!trimmedValue) {
        setFieldMessage(msgEl, '');
        return false;
    }

    if (trimmedValue.length < minLength || trimmedValue.length > 20) {
        setFieldMessage(msgEl, `${label}는 ${minLength}~20자로 입력해 주세요.`);
        return false;
    }

    setFieldMessage(msgEl, '중복 확인 중...', true);

    try {
        const data = await fetchAPI(`/users/availability?${field}=${encodeURIComponent(trimmedValue)}`);
        const result = data?.[field];

        if (result?.value !== trimmedValue) {
            return false;
        }

        availabilityState[field] = {
            value: trimmedValue,
            available: Boolean(result.available)
        };

        if (result.available) {
            setFieldMessage(msgEl, `사용 가능한 ${label}입니다.`, true);
            return true;
        }

        setFieldMessage(msgEl, `이미 사용 중인 ${label}입니다.`);
        return false;
    } catch (error) {
        setFieldMessage(msgEl, `${label} 중복 확인에 실패했습니다.`);
        return false;
    }
}

async function validateAvailabilityBeforeSubmit(userId, nickname) {
    const checks = [];

    if (availabilityState.user_id.value !== userId || !availabilityState.user_id.available) {
        checks.push(checkAvailability('user_id', userId));
    }

    if (availabilityState.nickname.value !== nickname || !availabilityState.nickname.available) {
        checks.push(checkAvailability('nickname', nickname));
    }

    if (checks.length > 0) {
        await Promise.all(checks);
    }

    return (
        availabilityState.user_id.value === userId &&
        availabilityState.user_id.available &&
        availabilityState.nickname.value === nickname &&
        availabilityState.nickname.available
    );
}

async function handleSignup() {
    const userIdInput = document.getElementById('user_id').value.trim();
    const passwordInput = document.getElementById('password').value;
    const confirmPasswordInput = document.getElementById('confirm_password').value;
    const nicknameInput = document.getElementById('nickname').value.trim();
    const phoneInput = document.getElementById('phone').value.trim();
    const signupBtn = document.getElementById('signup-btn');

    if (userIdInput.length < 4 || userIdInput.length > 20) {
        alert("아이디는 4자 이상, 20자 이하로 입력해 주세요.");
        return;
    }

    if (passwordInput.length < 8) {
        alert("비밀번호는 8자 이상 입력해 주세요.");
        return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(passwordInput)) {
        alert("비밀번호는 영문자와 숫자를 모두 포함해야 합니다.");
        return;
    }

    if (passwordInput !== confirmPasswordInput) {
        alert("비밀번호가 일치하지 않습니다.");
        return;
    }

    if (nicknameInput.length < 2 || nicknameInput.length > 20) {
        alert("닉네임은 2자 이상, 20자 이하로 입력해 주세요.");
        return;
    }

    if (!phoneInput) {
        alert("전화번호를 입력해 주세요.");
        return;
    }

    const isAvailable = await validateAvailabilityBeforeSubmit(userIdInput, nicknameInput);
    if (!isAvailable) {
        alert("아이디와 닉네임 중복 여부를 확인해 주세요.");
        return;
    }

    try {
        signupBtn.disabled = true;
        signupBtn.textContent = '가입 처리 중...';

        await fetchAPI('/users/signup', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userIdInput,
                password: passwordInput,
                nickname: nicknameInput,
                phone: phoneInput
            })
        });

        alert("회원가입이 완료되었습니다. 로그인해 주세요.");
        navigateTo(CONFIG.PAGE_URL.LOGIN);
    } catch (error) {
        alert("가입 실패: " + error.message);
    } finally {
        signupBtn.disabled = false;
        signupBtn.textContent = '가입하기';
    }
}

export function init() {
    const userIdEl = document.getElementById('user_id');
    const nicknameEl = document.getElementById('nickname');
    const passwordEl = document.getElementById('password');
    const confirmPasswordEl = document.getElementById('confirm_password');
    const signupBtn = document.getElementById('signup-btn');

    userIdEl?.addEventListener('input', debounce(() => {
        checkAvailability('user_id', userIdEl.value);
    }));

    nicknameEl?.addEventListener('input', debounce(() => {
        checkAvailability('nickname', nicknameEl.value);
    }));

    passwordEl?.addEventListener('input', checkPasswordMatch);
    confirmPasswordEl?.addEventListener('input', checkPasswordMatch);
    signupBtn?.addEventListener('click', handleSignup);
}
