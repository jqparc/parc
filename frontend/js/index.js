// frontend/js/index.js

document.addEventListener('DOMContentLoaded', async () => {
    const authLinksDiv = document.getElementById('header-auth-nav');

    try {
        // 1. 서버에 내 정보 물어보기
        const response = await fetch('/api/me', {
            method: 'GET',
            credentials: 'same-origin'
        });
        const data = await response.json();

        // 2. 로그인 상태에 따라 헤더 내용 바꾸기
        if (data.loggedIn) {
            authLinksDiv.innerHTML = `
                <span><strong>${data.username}</strong>님</span>
                <a href="#" id="logout-btn" style="margin-left: 10px;">로그아웃</a>
            `;

            // 로그아웃 버튼 이벤트 연결
            document.getElementById('logout-btn').addEventListener('click', logout);
        } else {
            // 로그아웃 상태면 기본 [로그인 | 회원가입] 유지
            authLinksDiv.innerHTML = `
                <a href="/login">로그인</a>
                <a href="/signup">회원가입</a>
            `;
        }
    } catch (error) {
        console.error("인증 확인 오류:", error);
    }
});

// 로그아웃 처리 함수
async function logout(e) {
    e.preventDefault(); // 페이지 이동 방지
    
    if (confirm("로그아웃 하시겠습니까?")) {
        const response = await fetch('/api/logout', { 
            method: 'POST',
            credentials: 'same-origin'
        });
        const result = await response.json();
        
        if (result.success) {
            alert(result.message);
            window.location.href = "/"; // 메인으로 새로고침
        }
    }
}