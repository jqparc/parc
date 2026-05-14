export const authRoutes = {
    '/login': {
        html: '/page/system/user/login.html',
        js: '/js/system/user/login.js',
        auth: 'guest',
    },
    '/signup': {
        html: '/page/system/user/signup.html',
        js: '/js/system/user/signup.js',
        auth: 'guest',
    },
    '/mypage': {
        html: '/page/system/user/mypage.html',
        js: '/js/system/user/mypage.js',
        auth: true,
    },
    '/profile': {
        html: '/page/system/user/profile.html',
        js: '/js/system/user/profile.js',
        auth: true,
    },
    '/menu': {
        html: '/page/system/navigation/menu.html',
        js: '/js/system/navigation/menu-admin.js',
        auth: true,
    },
    '/change-password': {
        html: '/page/system/user/change-password.html',
        js: '/js/system/user/change-password.js',
        auth: true,
    },
};
