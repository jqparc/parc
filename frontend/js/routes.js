// frontend/js/routes.js

export const routes = {
    "/": {
        html: "/index.html",
        js: null,
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
    "/asset/stck": {
        html: "/pages/asset/stck.html",
        js: "/js/asset/stck.js",
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
    }
];