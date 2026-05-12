// frontend/js/routes.js

export const routes = {
    "/": {
        html: "/pages/calendar.html",
        js: "/js/calendar.js",
        auth: false
    },
    "/calendar": {
        html: "/pages/calendar.html",
        js: "/js/calendar.js",
        auth: false
    },
    "/login": {
        html: "/pages/auth/login.html",
        js: "/js/auth/login.js",
        auth: 'guest'
    },
    "/signup": {
        html: "/pages/auth/signup.html",
        js: "/js/auth/signup.js",
        auth: 'guest'
    },
    "/mypage": {
        html: "/pages/auth/mypage.html",
        js: "/js/auth/mypage.js",
        auth: true
    },
    "/profile": {
        html: "/pages/auth/profile.html",
        js: "/js/auth/profile.js",
        auth: true
    },
    "/menu": {
        html: "/pages/auth/menu.html",
        js: "/js/auth/menu.js",
        auth: true
    },
    "/change-password": {
        html: "/pages/auth/change-password.html",
        js: "/js/auth/change-password.js",
        auth: true
    },
    "/economy/infos": {
        html: "/pages/economy/infos.html",
        js: "/js/boards/economy-infos.js",
        auth: false
    },
    "/economy/indicators": {
        html: "/pages/economy/indicators.html",
        js: "/js/boards/economy-indicators.js",
        auth: false
    },
    "/asset/portfolio": {
        html: "/pages/asset/portfolio.html",
        js: null, 
        auth: false
    },
    "/asset/setting": {
        html: "/pages/asset/setting.html",
        js: null,
        auth: true
    },
    "/asset/setting/stck-items": {
        html: "/pages/asset/setting-stck-items.html",
        js: "/js/asset/setting-stck-items.js",
        auth: true
    },
    "/asset/setting/business-types": {
        html: "/pages/asset/setting-business-types.html",
        js: "/js/asset/setting-business-types.js",
        auth: true
    },
    "/asset/stck": {
        html: "/pages/asset/stck.html",
        js: "/js/asset/stck.js",
        auth: true
    },
    "/asset/stck/add": {
        html: "/pages/asset/stck-add.html",
        js: "/js/asset/stck-add.js",
        auth: true
    },
    "/boards/write": {
        html: "/pages/boards/write.html",
        js: "/js/boards/post-write.js", // 필요하면
        auth: true // 글쓰기니까 보통 로그인 필요
    }
};

// 동적 경로 처리를 위한 정규식 매핑
export const dynamicRoutes = [
    {
        pattern: /^\/economy\/infos\/\d+\/edit$/,
        route: { html: "/pages/boards/edit.html", js: "/js/boards/post-edit.js", auth: false }
    },
    {
        pattern: /^\/economy\/infos\/\d+$/,
        route: { html: "/pages/boards/detail.html", js: "/js/boards/post-detail.js", auth: false }
    },
    {
        pattern: /^\/asset\/stck\/item\/[^/]+$/,
        route: { html: "/pages/asset/stck-item-detail.html", js: "/js/asset/stck-item-detail.js", auth: true }
    },
    {
        pattern: /^\/asset\/stck\/[^/]+\/edit$/,
        route: { html: "/pages/asset/stck-edit.html", js: "/js/asset/stck-edit.js", auth: true }
    },
    {
        pattern: /^\/asset\/stck\/[^/]+$/,
        route: { html: "/pages/asset/stck-detail.html", js: "/js/asset/stck-detail.js", auth: true }
    }
];
