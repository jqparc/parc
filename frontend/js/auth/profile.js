// frontend/js/auth/profile.js
import { fetchAPI } from '../api.js';
import { CONFIG } from '../config.js';

/**
 * 1. 페이지 로드 시 내 정보 가져오기
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // api.js의 fetchAPI가 쿠키(토큰)를 실어서 보냅니다.
        const user = await fetchAPI('/users/me'); 

        // 서버에서 받아온 데이터를 입력 칸에 채웁니다.
        // 백엔드 UserResponse 스키마 필드명과 일치해야 합니다.
        document.getElementById('user_id').value = user.user_id;
        document.getElementById('nickname').value = user.nickname || '';
        document.getElementById('phone').value = user.phone || '';

    } catch (error) {
        console.error("사용자 정보 로드 실패:", error);
        // 401 에러(로그인 안됨) 등이 발생하면 로그인 페이지로 리다이렉트
        alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
        window.location.href = CONFIG.PAGE_URL.LOGIN;
    }
});

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
        window.location.reload();

    } catch (error) {
        console.error("수정 요청 에러:", error);
        alert("수정 실패: " + error.message);
    }
});