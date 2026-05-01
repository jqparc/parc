// frontend/js/router.js

/**
 * 1. 라우팅 맵 정의
 * URL 경로에 매칭되는 HTML과 전용 JS 경로를 객체 형태로 통일하여 정의합니다.
 * 나중에 페이지별 CSS가 필요하다면 css 속성을 추가해 확장할 수 있습니다.
 */
const routes = {
    "/": {
        html: "/index.html", // 홈 화면 (임시)
        js: null
    },
    "/asset/portfolio": {
        html: "/pages/asset/portfolio.html",
        js: null // 나중에 /js/asset/portfolio.js 등으로 연결
    },
    "/login": {
        html: "/pages/auth/login.html",
        js: "/js/auth/login.js"
    },
    "/signup": {
        html: "/pages/auth/signup.html",
        js: "/js/auth/signup.js"
    },
    "/mypage": {
        html: "/pages/auth/mypage.html",
        js: "/js/auth/mypage.js"
    },
    "/profile": {
        html: "/pages/auth/profile.html",
        js: "/js/auth/profile.js"
    },
    "/change-password": {
        html: "/pages/auth/change-password.html",
        js: "/js/auth/change-password.js"
    },
    "/economy/infos": {
        html: "/pages/economy/infos.html",
        js: "/js/boards/economy-infos.js" 
    },
    "/economy/news": {
        html: "/pages/economy/news.html",
        js: null 
    },
    "/economy/indicators": {
        html: "/pages/economy/indicators.html",
        js: null
    }
};

let currentModule = null;

/**
 * 2. 라우터 메인 함수
 * 현재 URL에 맞는 HTML을 fetch하여 화면에 주입합니다.
 */
const router = async () => {
    const path = window.location.pathname;
    
    // 경로가 없으면 404 객체 반환
    const route = routes[path] || { html: "/pages/404.html", js: null }; 

    try {
        if (currentModule && typeof currentModule.cleanup === 'function') {
            currentModule.cleanup();
        }

        const response = await fetch(route.html);
        if (!response.ok) throw new Error("페이지를 찾을 수 없습니다.");
        const html = await response.text();
        
        // Step 2에서 만든 메인 컨테이너에 HTML 주입
        document.getElementById("app-content").innerHTML = html;

        if (route.js) {
            // 브라우저의 ES Module 기능을 활용해 비동기로 스크립트를 가져옵니다.
            // (캐시 무효화를 원한다면 `${route.js}?t=${Date.now()}` 처럼 쓸 수도 있습니다)
            currentModule = await import(route.js);
            
            // 모듈 내부에 init 함수가 선언되어 있다면 화면 주입 직후 실행합니다.
            if (currentModule && typeof currentModule.init === 'function') {
                currentModule.init();
            }
        } else {
            currentModule = null; // 전용 JS가 없는 페이지의 경우
        }
        
    } catch (error) {
        console.error("Router Error:", error);
        document.getElementById("app-content").innerHTML = `
            <div style="text-align:center; padding:50px;">
                <h2>404 Not Found</h2>
                <p>요청하신 페이지를 찾을 수 없습니다.</p>
            </div>
        `;
    }
};

/**
 * 3. 페이지 이동 함수
 * History API를 사용하여 브라우저 URL만 변경하고 라우터를 실행합니다.
 */
const navigateTo = (url) => {
    history.pushState(null, null, url);
    router();
};

/**
 * 4. 전역 이벤트 바인딩
 */
// 브라우저 뒤로가기/앞으로가기 버튼 클릭 시 라우터 실행
window.addEventListener("popstate", router);

document.addEventListener("DOMContentLoaded", () => {
    // 이벤트 위임(Event Delegation)을 통해 a 태그 클릭 이벤트 전역 처리
    document.body.addEventListener("click", e => {
        // data-link 속성이 있는 a 태그를 클릭했을 때만 SPA 라우팅 적용
        const targetLink = e.target.closest("[data-link]");
        if (targetLink) {
            e.preventDefault(); // 기본 동작(페이지 새로고침) 방지
            navigateTo(targetLink.href);
        }
    });

    // Step 2의 load_layout.js에서 레이아웃 로드가 끝난 후 발생하는 이벤트 감지
    document.addEventListener("layoutLoaded", router);
});