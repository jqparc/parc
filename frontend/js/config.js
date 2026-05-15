export const CONFIG = {
    // Backend API base URL.
    BASE_URL: 'http://127.0.0.1:8000/api/v1',

    // Client route paths.
    PAGE_URL: {
        LOGIN: '/login',
        INDEX: '/',
        MYPAGE: '/mypage'
    },

    // API endpoints.
    API_ENDPOINTS: {
        LOGIN: '/user/login',
        LOGOUT: '/user/logout',
        USERS_ME: '/user/me',
        USERS_REFRESH: '/user/refresh',
        MENUS: '/menu/',
        TABS: '/tab/'
    }
};
