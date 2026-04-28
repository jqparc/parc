// frontend/js/auth/signup.js
import { fetchAPI } from '../api.js';
import { CONFIG } from '../config.js';

// 💡 실시간 비밀번호 일치 확인 로직
const passwordEl = document.getElementById('password');
const confirmPasswordEl = document.getElementById('confirm_password');
const passwordMsg = document.getElementById('password_msg');

function checkPasswordMatch() {
    if (confirmPasswordEl.value === '') {
        passwordMsg.style.display = 'none';
        return;
    }
    
    passwordMsg.style.display = 'block';
    if (passwordEl.value !== confirmPasswordEl.value) {
        passwordMsg.textContent = '비밀번호가 일치하지 않습니다.';
        passwordMsg.style.color = 'red';
    } else {
        passwordMsg.textContent = '비밀번호가 일치합니다.';
        passwordMsg.style.color = 'green';
    }
}

// 비밀번호나 확인란에 타이핑할 때마다 일치 여부 검사
passwordEl.addEventListener('input', checkPasswordMatch);
confirmPasswordEl.addEventListener('input', checkPasswordMatch);


// 💡 가입 버튼 클릭 이벤트
document.getElementById('signup-btn').addEventListener('click', async () => {
    const userIdInput = document.getElementById('user_id').value.trim();
    const passwordInput = passwordEl.value;
    const confirmPasswordInput = confirmPasswordEl.value;
    const nicknameInput = document.getElementById('nickname').value.trim();
    const phoneInput = document.getElementById('phone').value.trim();

    // 1. 프론트엔드 유효성 검사 (백엔드 schema와 동기화)
    if (userIdInput.length < 4 || userIdInput.length > 20) {
        alert("아이디는 4자 이상, 20자 이하로 입력해주세요!");
        return;
    }

    if (passwordInput.length < 8) {
        alert("비밀번호는 8자 이상 입력해주세요!");
        return; 
    }

    // 비밀번호 정규식 검사 (영문, 숫자 포함 여부)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).+$/;
    if (!passwordRegex.test(passwordInput)) {
        alert("비밀번호는 영문자와 숫자를 모두 포함해야 합니다!");
        return;
    }

    if (passwordInput !== confirmPasswordInput) {
        alert("비밀번호가 일치하지 않습니다. 다시 확인해주세요.");
        return;
    }

    if (nicknameInput.length < 2 || nicknameInput.length > 20) {
        alert("닉네임은 2자 이상, 20자 이하로 입력해주세요!");
        return; 
    }

    if (phoneInput.length === 0) {
        alert("전화번호를 입력해주세요!");
        return; 
    }

    // 2. 백엔드 스키마(UserCreate) 구조에 맞게 데이터 포장
    const userData = {
        user_id: userIdInput,
        password: passwordInput,
        nickname: nicknameInput,
        phone: phoneInput
    };

    try {
        // 회원가입 버튼 비활성화 (중복 클릭 방지)
        const signupBtn = document.getElementById('signup-btn');
        signupBtn.disabled = true;
        signupBtn.textContent = '가입 처리 중...';

        const result = await fetchAPI('/users/signup', {
            method: 'POST', 
            body: JSON.stringify(userData) 
        });

        // fetchAPI는 실패하면 throw Error를 던지므로, 여기까지 코드가 내려왔다면 무조건 성공입니다.
        alert("회원가입이 완료되었습니다! 로그인 해주세요.");
        
        // 가입 성공 후 config.js에 정의된 로그인 페이지로 이동
        window.location.href = CONFIG.PAGE_URL.LOGIN;

    } catch (error) {
        // api.js에서 던진 에러 메시지(error.message)를 띄워줍니다. (예: 이미 존재하는 아이디입니다 등)
        console.error("회원가입 에러:", error);
        alert("가입 실패: " + error.message);
    }finally {
        // 실패하더라도 버튼 다시 활성화
        const signupBtn = document.getElementById('signup-btn');
        signupBtn.disabled = false;
        signupBtn.textContent = '가입하기';
    }
});