// frontend/js/auth/change-password.js
import { navigateTo } from "/js/router.js";
import { fetchAPI } from '/js/api.js';
import { CONFIG } from '/js/config.js';

document.getElementById('change-pw-btn').addEventListener('click', async () => {
    const currentPassword = document.getElementById('current_password').value;
    const newPassword = document.getElementById('new_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;

    // 1. 유효성 검사
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert("모든 빈칸을 입력해주세요.");
        return;
    }
    if (newPassword !== confirmPassword) {
        alert("새 비밀번호 확인이 일치하지 않습니다.");
        return;
    }
    if (newPassword.length < 4) {
        alert("새 비밀번호는 4글자 이상이어야 합니다.");
        return;
    }

    try {
        // 2. api.js를 통해 서버에 변경 요청 전송
        const result = await fetchAPI('/users/me/password', {
            method: 'PUT',
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });

        // 3. 성공 처리
        alert("비밀번호가 변경되었습니다! 보안을 위해 다시 로그인해주세요.");
        
        // 로그아웃 API가 있다면 호출하고, 아니면 메인으로 이동
        navigateTo(CONFIG.PAGE_URL.LOGIN); 

    } catch (error) {
        console.error("비밀번호 변경 에러:", error);
        alert("변경 실패: " + error.message);
    }
});