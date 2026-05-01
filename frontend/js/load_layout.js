// frontend/js/load_layout.js
import { renderNavigation } from './components/navigation.js';

// 1. 상대경로로 수정하여 MIME 에러 방지
const GLOBAL_STYLES = [
    '../css/style.css', 
    '../css/table.css'
];

function injectGlobalStyles() {
    GLOBAL_STYLES.forEach(href => {
        if (!document.querySelector(`link[href="${href}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
        }
    });
}
/**
 * 지정된 URL의 HTML 조각을 가져와 특정 ID의 DOM에 주입하는 함수
 * @param {string} targetId - HTML을 주입할 컨테이너의 ID
 * @param {string} htmlPath - 가져올 HTML 파일의 경로
 */
export async function loadComponent(targetId, htmlPath, cssPath = null, jsPath = null) {
    try {
        const targetElement = document.getElementById(targetId);
        if (!targetElement) return;

        const response = await fetch(htmlPath);
        if (!response.ok) throw new Error(`${htmlPath} 로드 실패: ${response.status}`);
        const html = await response.text();
        targetElement.innerHTML = html;

        if (cssPath) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            document.head.appendChild(link);
        }

        if (jsPath) {
            await import(jsPath); 
        }
    } catch (error) {
        console.error(`[LoadComponent 에러]:`, error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    injectGlobalStyles();

    // 2. HTML 컴포넌트 경로를 현재 파일 위치 기준으로 상대경로 적용
    await loadComponent(
        'header-container', 
        '../components/header.html', 
        null, 
        './auth/check_auth.js'
    );
    
    await loadComponent(
        'nav-container', 
        '../components/navigation.html',
        null 
    );

    if (typeof renderNavigation === 'function') {
        renderNavigation();
    }
});