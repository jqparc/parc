const GLOBAL_STYLES = [
    '/css/style.css',
    '/css/table.css',
    '/css/menu-admin.css',
    '/css/auth-pages.css',
    '/css/asset-stck.css'
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
            await import(jsPath);
        }
    } catch (error) {
        console.error('[LoadComponent Error]:', error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    injectGlobalStyles();

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

    document.dispatchEvent(new Event("layoutLoaded"));
});
