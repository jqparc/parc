// frontend/js/config.js
export const CONFIG = {
    // 백엔드 API 서버의 기본 주소
    BASE_URL: 'http://127.0.0.1:8000/api/v1',
    
    // 페이지 이동 경로 (Live Server 기준)
    PAGE_URL: {
        LOGIN: '/login',
        INDEX: '/',
        MYPAGE: '/mypage'
    },

    // 💡 추가된 부분: API 엔드포인트 상수화
    API_ENDPOINTS: {
        LOGIN: '/login',
        LOGOUT: '/users/logout', // 실제 소스코드 기준
        USERS_ME: '/users/me',   // 실제 소스코드 기준
        MENUS: '/menus/',        // 실제 소스코드 기준
        TABS: '/tabs/'
    }
};