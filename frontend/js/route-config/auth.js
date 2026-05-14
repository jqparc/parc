export const authRoutes = {
    '/login': {
        html: '/page/auth/login.html',
        js: '/js/auth/login.js',
        auth: 'guest',
    },
    '/signup': {
        html: '/page/auth/signup.html',
        js: '/js/auth/signup.js',
        auth: 'guest',
    },
    '/mypage': {
        html: '/page/auth/mypage.html',
        js: '/js/auth/mypage.js',
        auth: true,
    },
    '/profile': {
        html: '/page/auth/profile.html',
        js: '/js/auth/profile.js',
        auth: true,
    },
    '/menu': {
        html: '/page/auth/menu.html',
        js: '/js/auth/menu.js',
        auth: true,
    },
    '/change-password': {
        html: '/page/auth/change-password.html',
        js: '/js/auth/change-password.js',
        auth: true,
    },
};
