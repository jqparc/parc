import { fetchAPI } from '/js/api.js';

const LOGIN_ALERT_COOLDOWN_MS = 1500;

async function isPublicNavigationPath(path) {
    try {
        const menus = await fetchAPI('/menus/');
        if (!Array.isArray(menus) || menus.length === 0) {
            return false;
        }

        const activeMenus = menus.filter(menu => menu.use_yn === 'Y' && menu.role === 'ALL');
        const tabsResults = await Promise.all(
            activeMenus.map(menu => fetchAPI(`/tabs/?menu_id=${encodeURIComponent(menu.menu_id)}`))
        );

        return tabsResults.some(tabs =>
            Array.isArray(tabs) &&
            tabs.some(tab => tab.use_yn === 'Y' && tab.role === 'ALL' && tab.href === path)
        );
    } catch (error) {
        console.warn('[Auth Guard] Failed to check public menu/tab access:', error);
        return false;
    }
}

function showLoginRequiredAlertOnce(routeKey) {
    const now = Date.now();
    const lastAlert = window.__parcLoginRequiredAlert || { routeKey: null, time: 0 };

    if (
        lastAlert.routeKey === routeKey ||
        now - lastAlert.time < LOGIN_ALERT_COOLDOWN_MS
    ) {
        return;
    }

    window.__parcLoginRequiredAlert = { routeKey, time: now };
    alert("로그인이 필요한 화면입니다.");
}

export async function authGuard(route, user, routeKey = window.location.pathname, path = window.location.pathname) {
    if (route.auth === true && !user) {
        if (!route.requireLogin && await isPublicNavigationPath(path)) {
            return null;
        }

        showLoginRequiredAlertOnce(routeKey);
        return "/login";
    }

    if (route.auth === 'guest' && user) {
        return "/";
    }

    return null;
}
