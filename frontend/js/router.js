// frontend/js/router.js
import { renderNavigation } from '/js/components/navigation.js';
import { checkAuthStatus, updateAuthUI } from '/js/auth/check_auth.js';
import { authGuard } from '/js/auth/guard.js';

let currentModule = null;
let activeRouteKey = null;
let pendingRouteKey = null;

// 모든 HTML과 JS 경로를 하드코딩된 절대경로(/)로 고정
const routes = {
    "/": {
        html: "/index.html",
        js: null,
        auth: false
    },
    "/login": {
        html: "/pages/auth/login.html",
        js: "/js/auth/login.js",
        auth: 'guest'
    },
    "/signup": {
        html: "/pages/auth/signup.html",
        js: "/js/auth/signup.js"
    },
    "/mypage": {
        html: "/pages/auth/mypage.html",
        js: "/js/auth/mypage.js",
        auth: true
    },
    "/profile": {
        html: "/pages/auth/profile.html",
        js: "/js/auth/profile.js"
    },
    "/change-password": {
        html: "/pages/auth/change-password.html",
        js: "/js/auth/change-password.js",
        auth: true
    },
    "/menu": {
        html: "/pages/auth/menu.html",
        js: "/js/auth/menu.js"
    },
    "/boards/write": {
        html: "/pages/boards/write.html",
        js: "/js/boards/post-write.js",
        auth: true
    },
    "/economy/infos": {
        html: "/pages/economy/infos.html",
        js: "/js/boards/economy-infos.js" 
    },
    "/economy/news": {
        html: "/pages/economy/news.html",
        js: null 
    },
    "/economy/indicators": {
        html: "/pages/economy/indicators.html",
        // initFunction: initEconomyIndicators,
        js: "/js/boards/economy-indicators.js" 
    },
    "/asset": {
        html: "/pages/asset/portfolio.html",
        js: null
    },
    "/asset/portfolio": {
        html: "/pages/asset/portfolio.html",
        js: null, 
        auth: true
    },
    "/asset/stck": {
        html: "/pages/asset/stck.html",
        js: "/js/asset/stck.js",
        auth: true,
        requireLogin: true
    },
};

const router = async () => {
    const path = window.location.pathname;
    const routeKey = `${window.location.pathname}${window.location.search}`;

    if (pendingRouteKey === routeKey || activeRouteKey === routeKey) {
        return;
    }

    pendingRouteKey = routeKey;

    const route = routes[path] || (
        /^\/economy\/infos\/\d+\/edit$/.test(path)
            ? {
                html: "/pages/boards/edit.html",
                js: "/js/boards/post-edit.js",
                auth: true
            }
            : /^\/economy\/infos\/\d+$/.test(path)
                ? {
                html: "/pages/boards/detail.html",
                js: "/js/boards/post-detail.js",
                auth: false
            }
                : { html: "/pages/404.html", js: null, auth: false }
    );

    let didRedirect = false;

    try {
        const authUser = await checkAuthStatus();
        const redirectPath = await authGuard(route, authUser, routeKey, path);
        if (redirectPath) {
            didRedirect = true;
            history.pushState(null, null, redirectPath);
            pendingRouteKey = null;
            activeRouteKey = null;
            await router();
            return;
        }

        if (currentModule && typeof currentModule.cleanup === 'function') {
            currentModule.cleanup();
        }

        const response = await fetch(route.html);
        if (!response.ok) throw new Error("페이지를 찾을 수 없습니다.");
        const html = await response.text();
        
        document.getElementById("app-content").innerHTML = html;
        
        if (route.js) {
            try {
                currentModule = await import(route.js);
                if (currentModule && typeof currentModule.init === 'function') {
                    currentModule.init();
                }
            } catch (moduleError) {
                console.error(`[모듈 로드 실패] ${route.js} 파일을 불러올 수 없습니다:`, moduleError);
            }
        } else {
            currentModule = null;
        }
        await updateAuthUI(authUser);
        await renderNavigation({ resetToFirst: path === "/" });
        

    } catch (error) {
        console.error("Router Error:", error);
        document.getElementById("app-content").innerHTML = `
            <div style="text-align:center; padding:50px;">
                <h2>404 Not Found</h2>
                <p>요청하신 페이지를 찾을 수 없습니다.</p>
            </div>
        `;
    } finally {
        if (!didRedirect) {
            activeRouteKey = routeKey;
        }

        if (pendingRouteKey === routeKey) {
            pendingRouteKey = null;
        }
    }
};

export const navigateTo = (url) => {
    const targetUrl = new URL(url, window.location.origin);
    const currentUrl = new URL(window.location.href);
    if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) {
        return;
    }

    history.pushState(null, null, url);
    activeRouteKey = null;
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

    document.addEventListener("layoutLoaded", () => {
        router();
    });
});
