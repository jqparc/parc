/**
 * 모든 페이지에서 공통으로 실행되는 인증 상태 확인 스크립트
 */
import {API_BASE_URL} from '../config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const authNav = document.getElementById('header-auth-nav');
    
    // 헤더에 인증 네비게이션 영역이 없으면 실행하지 않음
    if (!authNav) return;

    try {
        // 1. 서버에 현재 로그인 세션 정보 요청 (쿠키 포함)
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
            method: 'GET',
            credentials: 'same-origin' // 브라우저가 자동으로 쿠키를 포함하도록 설정
        });

        // 응답이 성공적이지 않을 경우 (401 Unauthorized 등)
        if (!response.ok) {
            showGuestMenu(authNav);
            return;
        }

        const data = await response.json();

        // 2. 서버 응답 데이터에 따른 분기 처리
        if (data.loggedIn && data.nickname) {
            showUserMenu(authNav, data.nickname);
        } else {
            showGuestMenu(authNav);
        }
    } catch (error) {
        console.error("인증 상태를 확인하는 중 오류가 발생했습니다:", error);
        // 오류 발생 시 기본적으로 게스트 메뉴 표시
        showGuestMenu(authNav);
    }
});

/**
 * 로그인 성공 시: 사용자 정보와 로그아웃 버튼 표시
 */
function showUserMenu(container, nickname) {
    container.innerHTML = `
        <a href="/mypage" class="user-info"><strong>${nickname}</strong>님 환영합니다</a>
        <a href="#" id="logout-btn" class="login-btn" style="margin-left: 10px;">로그아웃</a>
    `;

    // 로그아웃 이벤트 바인딩
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
}

/**
 * 비로그인 상태 시: 로그인 및 회원가입 버튼 표시
 */
function showGuestMenu(container) {
    container.innerHTML = `
        <a href="/login" class="login-btn">로그인</a>
        <a href="/signup" class="signup-btn">회원가입</a>
    `;
}

/**
 * 로그아웃 처리 로직
 */
async function handleLogout(e) {
    e.preventDefault();

    if (!confirm("정말 로그아웃 하시겠습니까?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/users/logout`, {
            method: 'POST',
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message || "로그아웃 되었습니다.");
            window.location.href = "/"; // 메인 페이지로 이동 및 상태 갱신
        } else {
            alert("로그아웃 처리 중 문제가 발생했습니다.");
        }
    } catch (error) {
        console.error("로그아웃 요청 오류:", error);
        alert("서버와 통신할 수 없습니다.");
    }
}