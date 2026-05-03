// frontend/js/auth/profile.js
import { navigateTo } from "/js/router.js";
import { fetchAPI } from '/js/api.js';
import { CONFIG } from '/js/config.js';


export async function init() {
    try {
        // api.js의 fetchAPI가 쿠키(토큰)를 실어서 보냅니다.
        const user = await fetchAPI('/users/me'); 

        // HTML이 그려진 이후이므로 안전하게 DOM에 접근해 데이터를 채웁니다.
        document.getElementById('user_id').value = user.user_id;
        document.getElementById('nickname').value = user.nickname || '';
        document.getElementById('phone').value = user.phone || '';

    } catch (error) {
        console.error("사용자 정보 로드 실패:", error);
        alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
        
        // 새로고침 없이 부드럽게 화면만 전환합니다.
        navigateTo(CONFIG.PAGE_URL.LOGIN); 
    }
}

/**
 * 2. 정보 수정 요청 (PUT)
 */
document.getElementById('update-btn').addEventListener('click', async () => {
    const nicknameInput = document.getElementById('nickname').value.trim();
    const phoneInput = document.getElementById('phone').value.trim();

    // 유효성 검사
    if (!nicknameInput) { alert("닉네임을 입력해주세요."); return; }
    if (!phoneInput) { alert("전화번호를 입력해주세요."); return; }

    const updateData = {
        nickname: nicknameInput,
        phone: phoneInput
    };

    try {
        // api.js를 통해 PUT 요청 전송
        const result = await fetchAPI('/users/me', {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        alert("정보가 성공적으로 수정되었습니다! ✨");
        // 성공 시 정보를 최신화하기 위해 페이지 새로고침
        init();

    } catch (error) {
        console.error("수정 요청 에러:", error);
        alert("수정 실패: " + error.message);
    }
});