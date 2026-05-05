// frontend/js/app.js
import { injectGlobalStyles, loadComponent } from '/js/utils/loader.js';
import { AuthError } from '/js/api.js';
import { navigateTo } from '/js/router.js';

window.addEventListener('unhandledrejection', (event) => {
    if (event.reason instanceof AuthError) {
        alert("세션이 만료되었습니다. 다시 로그인해 주세요.");
        navigateTo('/login');
    }
});

/**
 * 앱의 기본 레이아웃(헤더, 네비게이션 등)을 초기화합니다.[cite: 3]
 */
async function initializeApp() {
    // 1. 전역 스타일 주입[cite: 3]
    injectGlobalStyles();

    // 2. 공통 UI 컴포넌트 렌더링[cite: 3]
    // 헤더와 인증 체크 스크립트 로드
    await loadComponent(
        'header-container',
        '/components/header.html',
        null,
        '/js/auth/check_auth.js'
    );

    // 네비게이션 메뉴 로드
    await loadComponent(
        'nav-container',
        '/components/navigation.html',
        null
    );

    // 3. 레이아웃 준비 완료 이벤트 발생 -> 라우터가 이를 받아 첫 페이지를 렌더링함[cite: 3, 4]
    document.dispatchEvent(new Event("layoutLoaded"));
}

// 앱 시작점
document.addEventListener("DOMContentLoaded", initializeApp);