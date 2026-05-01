// frontend/js/routes.js
export const routes = {
    '/': { page: 'home', requiresAuth: false },
    '/login': { page: 'auth/login', requiresAuth: false },
    '/signup': { page: 'auth/signup', requiresAuth: false },
    '/mypage': { page: 'auth/mypage', requiresAuth: true }, // 인증 필요
    '/asset/portfolio': { page: 'asset/portfolio', requiresAuth: true }, // 인증 필요
    '/economy/infos': { page: 'economy/infos', requiresAuth: false }
};