export const economyRoutes = {
    '/economy/info': {
        html: '/page/economy/info.html',
        js: '/js/economy/info.js',
        auth: false,
    },
    '/economy/indicator': {
        html: '/page/economy/indicator.html',
        js: '/js/economy/indicator.js',
        auth: false,
    },
};

export const economyDynamicRoutes = [
    {
        pattern: /^\/economy\/info\/\d+\/edit$/,
        route: {
            html: '/page/board/edit.html',
            js: '/js/board/post-edit.js',
            auth: false,
        },
    },
    {
        pattern: /^\/economy\/info\/\d+$/,
        route: {
            html: '/page/board/detail.html',
            js: '/js/board/post-detail.js',
            auth: false,
        },
    },
];
