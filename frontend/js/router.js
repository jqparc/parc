// frontend/js/router.js
import { routes, dynamicRoutes } from '/js/routes.js';
import { renderNavigation } from '/js/components/navigation.js';
import { checkAuthStatus, updateAuthUI } from '/js/auth/check_auth.js';
import { authGuard } from '/js/auth/guard.js';

let currentModule = null;
let activeRouteKey = null;

/**
 * 현재 경로에 맞는 라우트 객체를 찾습니다.
 */
const findRoute = (path) => {
    // 1. 정적 경로 매칭
    if (routes[path]) return routes[path];

    // 2. 동적 경로 매칭 (정규식 검사)
    const dynamic = dynamicRoutes.find(dr => dr.pattern.test(path));
    if (dynamic) return dynamic.route;

    // 3. 매칭되는 경로가 없을 때
    return { html: "/pages/404.html", js: null, auth: false };
};

const router = async () => {
    const path = window.location.pathname;
    const routeKey = `${path}${window.location.search}`;

    if (activeRouteKey === routeKey) return;

    const route = findRoute(path);

    try {
        const authUser = await checkAuthStatus();
        const redirectPath = await authGuard(route, authUser, routeKey, path);

        if (redirectPath) {
            navigateTo(redirectPath);
            return;
        }

        // 기존 모듈 정리
        if (currentModule?.cleanup) currentModule.cleanup();

        // 페이지 로드
        const response = await fetch(route.html);
        if (!response.ok) throw new Error("Page Not Found");
        const html = await response.text();
        
        document.getElementById("app-content").innerHTML = html;
        
        // JS 모듈 실행
        if (route.js) {
            currentModule = await import(route.js);
            if (currentModule?.init) currentModule.init();
        } else {
            currentModule = null;
        }

        // UI 업데이트[cite: 4]
        await updateAuthUI(authUser);
        await renderNavigation({ resetToFirst: path === "/" });
        activeRouteKey = routeKey;

    } catch (error) {
        console.error("Router Error:", error);
        document.getElementById("app-content").innerHTML = "<h2>Error</h2><p>페이지를 불러오는 중 문제가 발생했습니다.</p>";
    }
};

export const navigateTo = (url) => {
    history.pushState(null, null, url);
    router();
};

window.addEventListener("popstate", router);

// 초기화 이벤트 리스너
document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", e => {
        const targetLink = e.target.closest("[data-link]");
        if (targetLink) {
            e.preventDefault();
            navigateTo(targetLink.getAttribute('href'));
        }
    });

    document.addEventListener("layoutLoaded", router);
});
