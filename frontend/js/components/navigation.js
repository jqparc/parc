// 메뉴 데이터 정의 (나중에 서버 API로 받아올 수도 있습니다)
const navData = {
    nav_menu: [
        { id: 'economy', name: '경제지표', url: '/pages/economy/infos.html' },
        { id: 'asset', name: '자산관리', url: '/pages/asset/portfolio.html' },
        { id: 'board', name: '게시판', url: '/pages/board/list.html' }
    ],
    nav_tab: [
        { id: 'news', parent: 'economy', name: '경제뉴스', url: '/pages/economy/news.html' },
        { id: 'indicator', parent: 'economy', name: '지표상세', url: '/pages/economy/indicators.html' }
    ]
};

export function renderNavigation() {
    const topContainer = document.getElementById('top-tabs-container');
    const dtlContainer = document.getElementById('dtl-tabs-container');
    
    if (!topContainer || !dtlContainer) return;

    const currentPath = window.location.pathname;

    // 1. 상단 메인 메뉴 생성
    topContainer.innerHTML = navData.top_tabs.map(menu => `
        <a href="${menu.url}" class="top-button ${currentPath.includes(menu.url) ? 'active' : ''}">
            ${menu.name}
        </a>
    `).join('');

    // 2. 하단 상세 탭 생성 (현재 페이지가 속한 카테고리만 노출하는 로직 추가 가능)
    dtlContainer.innerHTML = navData.nav_dtl_tabs.map(tab => `
        <a href="${tab.url}" class="top-button ${currentPath.includes(tab.url) ? 'active' : ''}">
            ${tab.name}
        </a>
    `).join('');
}