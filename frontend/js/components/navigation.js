// frontend/js/components/navigation.js

// 1. 메뉴 데이터 정의 (확장성을 고려한 구조)
const navData = {
    nav_menu: [
        { id: 'economy', name: '경제지표', url: '/pages/economy/infos.html' },
        { id: 'asset', name: '자산관리', url: '/pages/asset/portfolio.html' },
        { id: 'board', name: '게시판', url: '/pages/board/list.html' } // 현재 /frontend/pages/board/ 폴더가 없으므로 추후 생성 필요
    ],
    nav_tab: [
        { id: 'infos', parent: 'economy', name: '경제정보', url: '/pages/economy/infos.html' },
        { id: 'news', parent: 'economy', name: '경제뉴스', url: '/pages/economy/news.html' },
        { id: 'indicator', parent: 'economy', name: '지표상세', url: '/pages/economy/indicators.html' }
        // 예시: 자산관리 하위 탭이 필요하다면 아래처럼 추가만 하면 자동으로 렌더링 됩니다.
        // { id: 'portfolio', parent: 'asset', name: '내 포트폴리오', url: '/pages/asset/portfolio.html' }
    ]
};

export function renderNavigation() {
    // 2. DOM 요소 매핑 (HTML 파일과 ID 일치화)
    const menuContainer = document.getElementById('nav-menu-container');
    const tabContainer = document.getElementById('nav-tabs-container');
    
    // 네비게이션 영역이 없는 페이지면 조용히 종료
    if (!menuContainer) return;

    const currentPath = window.location.pathname;

    // 3. 현재 활성화된 메인 메뉴(부모) ID 찾기
    let activeParentId = null;
    for (const menu of navData.nav_menu) {
        // 현재 URL 경로가 메뉴 URL을 포함하거나, 해당 카테고리 폴더(/pages/economy/) 안에 있다면
        if (currentPath.includes(menu.url) || currentPath.includes(`/pages/${menu.id}/`)) {
            activeParentId = menu.id;
            break;
        }
    }

    // 4. 상단 메인 메뉴 렌더링
    menuContainer.innerHTML = navData.nav_menu.map(menu => {
        const isActive = (menu.id === activeParentId) ? 'active' : '';
        // top-button 대신 css와 통일성을 위해 클래스명 부여 (필요시 수정 가능)
        return `<a href="${menu.url}" class="top-button ${isActive}">${menu.name}</a>`;
    }).join('');

    // 5. 하단 상세 탭 렌더링 (현재 활성화된 부모의 탭만 필터링)
    if (tabContainer && activeParentId) {
        const filteredTabs = navData.nav_tab.filter(tab => tab.parent === activeParentId);
        
        if (filteredTabs.length > 0) {
            tabContainer.innerHTML = filteredTabs.map(tab => {
                const isActive = currentPath.includes(tab.url) ? 'active' : '';
                return `<a href="${tab.url}" class="tab-button ${isActive}">${tab.name}</a>`;
            }).join('');
            tabContainer.style.display = 'flex'; // 탭 영역 보이기
        } else {
            tabContainer.innerHTML = '';
            tabContainer.style.display = 'none'; // 하위 탭이 없는 메뉴면 영역 숨기기
        }
    }
}