// frontend/js/load_layout.js
import { renderNavigation } from './components/navigation.js';
/**
 * HTML, CSS, JS를 한 세트(컴포넌트)로 불러와서 화면에 주입하는 만능 함수
 * @param {string} targetId - HTML을 끼워넣을 빈 태그의 ID
 * @param {string} htmlPath - 가져올 HTML 파일 경로
 * @param {string} cssPath - (선택) 해당 부품 전용 CSS 경로
 * @param {string} jsPath - (선택) 해당 부품 전용 JS 경로
 */
async function loadComponent(targetId, htmlPath, cssPath = null, jsPath = null) {
    try {
        // 1. HTML 가져와서 끼워 넣기
        const response = await fetch(htmlPath);
        const html = await response.text();
        document.getElementById(targetId).innerHTML = html;

        // 2. 전용 CSS가 있다면 <head>에 몰래 찔러 넣기
        if (cssPath) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            document.head.appendChild(link); // 브라우저가 이때 CSS를 다운받아 적용함
        }

        // 3. 전용 JS가 있다면 실행하기 (ES6 동적 임포트 활용)
        if (jsPath) {
            await import(jsPath); // 이 순간 해당 JS 파일이 실행됨!
        }
    } catch (error) {
        console.error(`${htmlPath} 컴포넌트 로드 중 에러:`, error);
    }
}

// 페이지가 켜지면 공통 레이아웃(헤더, 푸터)을 세트로 불러옵니다.
document.addEventListener("DOMContentLoaded", async () => {
    
    // 헤더 컴포넌트 로드 (HTML + 헤더 전용 CSS + 인증 체크 JS)
    await loadComponent(
        'header-placeholder', 
        '/components/header.html', 
        '/css/components/header.css',  // 헤더 모양만 꾸미는 전용 CSS
        '/js/auth/check_auth.js'       // 헤더의 로그인/로그아웃 버튼을 제어하는 JS
    );

    // 푸터 컴포넌트 로드 (HTML + 푸터 전용 CSS)
    // await loadComponent(
    //     'footer-placeholder', 
    //     '/components/footer.html',
    //     '/css/components/footer.css'   // JS는 필요 없으니 생략!
    // );
    
    // await loadComponent(
    //     'nav-placeholder', // base.html에 이 ID를 가진 div가 있어야 함
    //     '/components/navigation.html',
    //     '/css/components/navigation.css' // 네비게이션 전용 CSS
    // );

    // renderNavigation();
});