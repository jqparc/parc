// frontend/js/load_layout.js
// 절대경로로 바로 지정
import { renderNavigation } from '/js/components/navigation.js'; 

const GLOBAL_STYLES = [
    '/css/style.css', 
    '/css/table.css'
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

    // 헬퍼 함수 없이 무조건 절대경로 사용
    await loadComponent(
        'header-container', 
        '/components/header.html', 
        null, 
        '/js/auth/check_auth.js'
    );
    
    await loadComponent(
        'nav-container', 
        '/components/navigation.html',
        null 
    );

    if (typeof renderNavigation === 'function') {
        renderNavigation();
    }

    // 레이아웃 로드 완료 이벤트를 발생시켜 router.js가 이후 작업을 하도록 함
    document.dispatchEvent(new Event("layoutLoaded"));
});