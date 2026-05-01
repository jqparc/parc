// frontend/js/components/navigation.js

// 메뉴 구성 데이터 (나중에 이 부분만 수정하면 메뉴가 관리됨)
const NAV_CONFIG = {
    economy: {
        title: "경제",
        basePath: "/economy",
        tabs: [
            { name: "경제 정보", href: "/economy/infos" },
            { name: "경제 뉴스", href: "/economy/news" },
            { name: "경제 지표", href: "/economy/indicators" }
        ]
    },
    asset: {
        title: "자산",
        basePath: "/asset",
        tabs: [
            { name: "포트폴리오", href: "/asset/portfolio" }
        ]
    }
};

export function renderNavigation() {
    const currentPath = window.location.pathname;
    const navtopContainer = document.getElementById('nav-top');
    const navbottomContainer = document.getElementById('nav-bottom');

    if (!navtopContainer || !navbottomContainer) return;

    // 1. 현재 어떤 카테고리(상단 메뉴)에 속해 있는지 찾기
    const activeCategoryKey = Object.keys(NAV_CONFIG).find(key => 
        currentPath.startsWith(NAV_CONFIG[key].basePath)
    );

    // 2. 상단 메뉴(nav-menu) 렌더링
    navtopContainer.innerHTML = Object.keys(NAV_CONFIG).map(key => `
        <a href="${NAV_CONFIG[key].tabs[0].href}" 
           class="nav-link ${activeCategoryKey === key ? 'active' : ''}" 
           data-link>${NAV_CONFIG[key].title}</a>
    `).join('');

    // 3. 하단 탭(nav-tab) 렌더링 (선택된 카테고리가 있을 때만)
    if (activeCategoryKey) {
        navbottomContainer.innerHTML = NAV_CONFIG[activeCategoryKey].tabs.map(tab => `
            <a href="${tab.href}" 
               class="nav-link ${currentPath === tab.href ? 'active' : ''}" 
               data-link>${tab.name}</a>
        `).join('');
    } else {
        navbottomContainer.innerHTML = '';
    }
}