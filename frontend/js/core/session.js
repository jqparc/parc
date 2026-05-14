import { AuthError } from '/js/api.js';
import { authService } from '/js/system/user/auth-service.js';
import { navigateTo } from '/js/router.js';

const SESSION_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const ACTIVITY_EVENTS = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart'];

let lastSessionRefreshAt = 0;
let refreshInProgress = false;

export function bindAuthErrorHandler() {
    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason instanceof AuthError) {
            alert('세션이 만료되었습니다. 다시 로그인해 주세요.');
            navigateTo('/login');
        }
    });
}

export function bindSessionKeepAlive() {
    ACTIVITY_EVENTS.forEach((eventName) => {
        window.addEventListener(eventName, refreshSessionOnActivity, { passive: true });
    });
}

async function refreshSessionOnActivity() {
    const now = Date.now();
    if (refreshInProgress || now - lastSessionRefreshAt < SESSION_REFRESH_INTERVAL_MS) return;

    refreshInProgress = true;
    try {
        await authService.refreshSession();
        lastSessionRefreshAt = now;
    } catch {
        authService.clearAuthCache();
    } finally {
        refreshInProgress = false;
    }
}
