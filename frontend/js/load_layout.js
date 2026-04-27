// frontend/js/load_layout.js
import { renderNavigation } from './components/navigation.js';

// 공통적으로 쓰이는 CSS 리스트
const GLOBAL_STYLES = [
    '/css/style.css',
    '/css/table.css'
];

function injectGlobalStyles() {
    GLOBAL_STYLES.forEach(href => {
        // 이미 해당 CSS가 head에 있는지 확인 (중복 방지)
        if (!document.querySelector(`link[href="${href}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
        }
    });
}

/**
 * HTML, CSS, JS를 한 세트(컴포넌트)로 불러와서 화면에 주입하는 만능 함수
 */
async function loadComponent(targetId, htmlPath, cssPath = null, jsPath = null) {
    try {
        const targetElement = document.getElementById(targetId);
        // [개선 포인트] 타겟 ID가 해당 페이지에 없으면 불필요한 로드를 막고 종료합니다.
        if (!targetElement) return;

        // 1. HTML 가져와서 끼워 넣기
        const response = await fetch(htmlPath);
        if (!response.ok) throw new Error(`${htmlPath} 로드 실패: ${response.status}`);
        const html = await response.text();
        targetElement.innerHTML = html;

        // 2. 전용 CSS가 있다면 <head>에 몰래 찔러 넣기
        if (cssPath) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            document.head.appendChild(link);
        }

        // 3. 전용 JS가 있다면 실행하기
        if (jsPath) {
            await import(jsPath); 
        }
    } catch (error) {
        console.error(`[LoadComponent 에러]:`, error);
    }
}

// 페이지가 켜지면 공통 레이아웃을 세트로 불러옵니다.
document.addEventListener("DOMContentLoaded", async () => {

    injectGlobalStyles();

    // 1. 헤더 로드
    await loadComponent(
        'header-placeholder', 
        '/components/header.html', 
        null, // 만약 헤더 전용 CSS가 없다면 null로 처리 (에러 방지)
        '/js/auth/check_auth.js'
    );
    
    // 2. 네비게이션 로드 (주석 해제 및 수정)
    await loadComponent(
        'nav-placeholder', 
        '/components/navigation.html',
        null // 임시로 null 처리. 나중에 '/css/components/navigation.css'를 만들면 추가하세요.
    );

    // 3. 네비게이션이 HTML에 주입된 직후에 메뉴를 그리는 함수 실행
    if (typeof renderNavigation === 'function') {
        renderNavigation();
    }
});