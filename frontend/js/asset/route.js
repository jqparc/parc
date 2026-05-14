export const assetRoutes = {
    '/asset/portfolio': {
        html: '/page/asset/portfolio.html',
        js: null,
        auth: false,
    },
    '/asset/setting': {
        html: '/page/asset/setting.html',
        js: null,
        auth: true,
    },
    '/asset/setting/stck-item': {
        html: '/page/asset/setting-stck-item.html',
        js: '/js/asset/setting-stck-item.js',
        auth: true,
    },
    '/asset/setting/stck-items': {
        html: '/page/asset/setting-stck-item.html',
        js: '/js/asset/setting-stck-item.js',
        auth: true,
    },
    '/asset/setting/business-type': {
        html: '/page/asset/setting-business-type.html',
        js: '/js/asset/setting-business-type.js',
        auth: true,
    },
    '/asset/setting/business-types': {
        html: '/page/asset/setting-business-type.html',
        js: '/js/asset/setting-business-type.js',
        auth: true,
    },
    '/asset/stck': {
        html: '/page/asset/stck.html',
        js: '/js/asset/stck.js',
        auth: true,
    },
    '/asset/stck/add': {
        html: '/page/asset/stck-add.html',
        js: '/js/asset/stck-add.js',
        auth: true,
    },
};

export const assetDynamicRoutes = [
    {
        pattern: /^\/asset\/stck\/item\/[^/]+$/,
        route: {
            html: '/page/asset/stck-item-detail.html',
            js: '/js/asset/stck-item-detail.js',
            auth: true,
        },
    },
    {
        pattern: /^\/asset\/stck\/[^/]+\/edit$/,
        route: {
            html: '/page/asset/stck-edit.html',
            js: '/js/asset/stck-edit.js',
            auth: true,
        },
    },
    {
        pattern: /^\/asset\/stck\/[^/]+$/,
        route: {
            html: '/page/asset/stck-detail.html',
            js: '/js/asset/stck-detail.js',
            auth: true,
        },
    },
];
