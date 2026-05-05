// frontend/js/auth/authService.js
import { fetchAPI } from '/js/api.js';
import { CONFIG } from '/js/config.js';

let authStatusPromise = null;

export const authService = {
    // 1. 로그인 요청
    async login(email, password) {
        return await fetchAPI(CONFIG.API_ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    // 2. 로그아웃 요청
    async logout() {
        return await fetchAPI(CONFIG.API_ENDPOINTS.LOGOUT, { method: 'POST' });
    },
    
    clearAuthCache() {
        authStatusPromise = null; //[cite: 5]
    },
    
    // 기존 checkAuthStatus의 데이터 통신 및 캐싱 로직 통합[cite: 5]
    async verifySession({ force = false } = {}) {
        if (!force && authStatusPromise) {
            return authStatusPromise;
        }

        authStatusPromise = fetchAPI(CONFIG.API_ENDPOINTS.USERS_ME).catch(() => null);
        return authStatusPromise;
    }
};