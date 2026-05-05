// frontend/js/utils/loader.js

const GLOBAL_STYLES = [
    '/css/style.css',
    '/css/table.css',
    '/css/menu-admin.css',
    '/css/auth-pages.css',
    '/css/asset-stck.css'
];

/**
 * 전역 스타일 시트를 헤드에 주입합니다.
 */
export function injectGlobalStyles() {
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
 * 특정 컨테이너에 HTML/CSS/JS 컴포넌트를 로드합니다.
 */
export async function loadComponent(targetId, htmlPath, cssPath = null, jsPath = null) {
    try {
        const targetElement = document.getElementById(targetId);
        if (!targetElement) return;

        const response = await fetch(htmlPath);
        if (!response.ok) throw new Error(`${htmlPath} load failed: ${response.status}`);
        const html = await response.text();
        targetElement.innerHTML = html;

        if (cssPath) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            document.head.appendChild(link);
        }

        if (jsPath) {
            await import(jsPath); // 모듈 동적 로드[cite: 3]
        }
    } catch (error) {
        console.error('[LoadComponent Error]:', error);
    }
}