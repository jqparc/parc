// frontend/js/auth/check_auth.js
import { fetchAPI } from '../api.js';

async function updateAuthUI() {
    try {
        // 1. 백엔드에 '내 정보' 요청 (api.js가 쿠키를 들고 갑니다)
        const user = await fetchAPI('/users/me');

        if (user) {
            // 2. 로그인 상태: 헤더의 인증 메뉴 찾기
            const authMenu = document.getElementById('header-auth-nav');
            if (authMenu) {
                // 3. 버튼 갈아끼우기
                authMenu.innerHTML = `
                    <span class="user-name">Welcome, <strong>${user.user_id}</strong>님</span>
                    <a href="/pages/auth/mypage.html" class="mypage-btn">마이페이지</a>
                    <button id="logout-btn" class="logout-btn">로그아웃</button>
                `;

                // 4. 로그아웃 버튼 이벤트 달기
                document.getElementById('logout-btn').addEventListener('click', async () => {
                    await fetchAPI('/users/logout', { method: 'POST' });
                    alert("로그아웃 되었습니다.");
                    location.reload(); // 새로고침해서 UI 초기화
                });
            }
        }
    } catch (error) {
        // 로그인 안 된 상태 (401 에러 등)
        console.log("비로그인 상태 또는 토큰 만료");
        // 기본 '로그인/회원가입' 버튼이 header.html에 있으므로 아무것도 안 해도 됩니다.
    }
}

// 스크립트 로드 시 즉시 실행
updateAuthUI();