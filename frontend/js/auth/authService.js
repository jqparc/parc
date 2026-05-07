// frontend/js/auth/authService.js
import { fetchAPI } from '/js/api.js';
import { CONFIG } from '/js/config.js';

let authStatusPromise = null;

export const authService = {
    // 1. 로그인 요청
    async login(email, password) {
        const result = await fetchAPI(CONFIG.API_ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        // 🔥 보완: 로그인 성공 시 기존 비로그인 캐시를 파기하여 다음 호출 시 유저 정보를 갱신하도록 함
        this.clearAuthCache(); 
        return result;
    },

    // 2. 로그아웃 요청
    async logout() {
        const result = await fetchAPI(CONFIG.API_ENDPOINTS.LOGOUT, { method: 'POST' });
        // 🔥 보완: 로그아웃 시 유저 정보 캐시 즉각 파기 (보안 및 화면 동기화)
        this.clearAuthCache();
        return result;
    },

    async refreshSession() {
        const result = await fetchAPI(CONFIG.API_ENDPOINTS.USERS_REFRESH, { method: 'POST' });
        this.clearAuthCache();
        return result;
    },
    
    clearAuthCache() {
        authStatusPromise = null;
    },
    
    async verifySession({ force = false } = {}) {
        if (!force && authStatusPromise) {
            return authStatusPromise;
        }

        authStatusPromise = fetchAPI(CONFIG.API_ENDPOINTS.USERS_ME).catch(() => null);
        return authStatusPromise;
    }
};