// frontend/js/auth/login.js (예시)
import { fetchAPI } from '../api.js';

async function handleLogin(user_id, password) {
    try {
        const result = await fetchAPI('/users/login', {
            method: 'POST',
            body: JSON.stringify({ user_id, password })
        });
        
        // 기존 코드: localStorage.setItem('access_token', result.access_token); <- 삭제!!
        
        alert("로그인 성공!");
        window.location.href = '/index.html'; // 바로 메인으로 이동
    } catch (error) {
        alert("로그인 실패: " + error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // HTML에서 'login-btn' 아이디를 가진 버튼을 찾습니다.
    const loginBtn = document.getElementById('login-btn');

    // 버튼이 정상적으로 찾아졌다면 클릭 이벤트를 달아줍니다.
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            // 1. 사용자가 입력한 아이디(user_id)와 비밀번호(password) 값을 가져옵니다.
            const useridInput = document.getElementById('user_id').value;
            const passwordInput = document.getElementById('password').value;

            // 2. 빈칸 검사 (선택 사항이지만 강력 추천)
            if (!useridInput || !passwordInput) {
                alert("아이디와 비밀번호를 모두 입력해주세요.");
                return; // 빈칸이면 여기서 중단
            }

            // 3. 위에서 만든 handleLogin 함수를 실행합니다!
            handleLogin(useridInput, passwordInput);
        });
    }
});