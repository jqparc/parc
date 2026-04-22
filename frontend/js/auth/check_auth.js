/**
 * 모든 페이지에서 공통으로 실행되는 인증 상태 확인 스크립트
 */
import { CONFIG } from '../config.js'; // CONFIG 객체 전체를 가져오는 것으로 가정

document.addEventListener('DOMContentLoaded', async () => {
    const authNav = document.getElementById('header-auth-nav');
    
    // 헤더에 인증 네비게이션 영역이 없으면 실행하지 않음
    if (!authNav) return;

    try {
        // 1. 서버에 현재 로그인 세션 정보 요청
        const response = await fetch(`${CONFIG.API_BASE_URL}/users/me`, {
            method: 'GET',
            // 🔴 중요: 포트가 다르므로 'include'여야 쿠키가 전달됩니다.
            credentials: 'include', 
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // 2. 응답 상태에 따른 분기 처리
        if (response.status === 401) {
            // 인증되지 않은 상태 (로그아웃 상태)
            showGuestMenu(authNav);
            return;
        }

        if (!response.ok) {
            throw new Error("서버 응답 오류");
        }

        const data = await response.json();

        // 3. 로그인 성공 시 (데이터에 유저 정보가 있음)
        if (data.nickname) {
            showUserMenu(authNav, data.nickname);
        } else {
            showGuestMenu(authNav);
        }

    } catch (error) {
        console.error("인증 상태 확인 중 오류:", error);
        showGuestMenu(authNav);
    }
});

/**
 * 로그인 성공 시: 사용자 정보와 로그아웃 버튼 표시
 */
function showUserMenu(container, nickname) {
    container.innerHTML = `
        <a href="${CONFIG.PAGE_URL.MYPAGE}" class="user-info">
            <strong>${nickname}</strong>님 환영합니다
        </a>
        <a href="#" id="logout-btn" class="login-btn" style="margin-left: 10px;">로그아웃</a>
    `;

    document.getElementById('logout-btn').addEventListener('click', handleLogout);
}

/**
 * 비로그인 상태 시: 로그인 및 회원가입 버튼 표시
 */
function showGuestMenu(container) {
    container.innerHTML = `
        <a href="${CONFIG.PAGE_URL.LOGIN}" class="login-btn">로그인</a>
        <a href="${CONFIG.PAGE_URL.SIGNUP}" class="signup-btn">회원가입</a>
    `;
}

/**
 * 로그아웃 처리 로직
 */
async function handleLogout(e) {
    e.preventDefault();

    if (!confirm("정말 로그아웃 하시겠습니까?")) return;

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/users/logout`, {
            method: 'POST',
            credentials: 'include' // 로그아웃 시에도 해당 세션 쿠키를 날려야 하므로 include
        });

        if (response.ok) {
            alert("로그아웃 되었습니다.");
            // 메인 페이지(index.html)로 이동
            window.location.href = CONFIG.PAGE_URL.INDEX;
        } else {
            alert("로그아웃 처리 중 문제가 발생했습니다.");
        }
    } catch (error) {
        console.error("로그아웃 요청 오류:", error);
        alert("서버와 통신할 수 없습니다.");
    }
}