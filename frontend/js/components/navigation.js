// frontend/js/components/navigation.js
import { fetchAPI } from '/js/api.js';
import { navigateTo } from '/js/router.js';

export async function renderNavigation() {
    const currentPath = window.location.pathname;
    const navtopContainer = document.getElementById('nav-top');
    const navbottomContainer = document.getElementById('nav-bottom');

    // 네비게이션 컨테이너가 없으면 종료
    if (!navtopContainer || !navbottomContainer) return;

    try {
        // 1. 서버에서 상단 메뉴(nav-menu) 가져오기
        const menus = await fetchAPI('/menus'); 
        
        // 🚨 핵심 1: 메뉴 데이터가 없거나 배열이 아니면 네비게이션을 비우고 함수 종료
        if (!menus || !Array.isArray(menus) || menus.length === 0) {
            console.warn("표시할 메뉴 데이터가 없습니다. (비로그인 상태 등)");
            navtopContainer.innerHTML = '';
            navbottomContainer.innerHTML = '';
            return; // 여기서 렌더링 중단
        }

        const activeMenus = menus.filter(menu => menu.use_yn === 'Y');

        // 사용 가능한 메뉴가 없을 때도 동일하게 처리
        if (activeMenus.length === 0) {
            navtopContainer.innerHTML = '';
            navbottomContainer.innerHTML = '';
            return;
        }

        // 2. 각 메뉴에 속한 탭 데이터를 병렬로 모두 가져오기 
        const tabsPromises = activeMenus.map(menu => fetchAPI(`/tabs?menu_id=${menu.menu_id}`));
        const tabsResults = await Promise.all(tabsPromises);

        let activeMenuId = sessionStorage.getItem('currentMenuId');
        let activeMenuTabs = [];

        // 3. 상단 메뉴(nav-menu) HTML 생성 및 렌더링
        const topMenuHtml = activeMenus.map((menu, index) => {
            // 🚨 핵심 2: 특정 메뉴의 탭 데이터가 없을 경우를 대비해 빈 배열을 기본값으로 설정
            const menuTabs = (tabsResults[index] || []).filter(tab => tab.use_yn === 'Y');

            const isMatch = menuTabs.some(tab => tab.href === currentPath);
            if (isMatch) {
                activeMenuId = menu.menu_id;
                sessionStorage.setItem('currentMenuId', activeMenuId);
                activeMenuTabs = menuTabs; 
            } else if (activeMenuId === menu.menu_id) {
                activeMenuTabs = menuTabs;
            }

            const firstTabHref = menuTabs.length > 0 ? menuTabs[0].href : '#';
            const isActive = activeMenuId === menu.menu_id;

            return `
                <a href="${firstTabHref}" 
                   class="nav-link ${isActive ? 'active' : ''}" 
                   data-menu-id="${menu.menu_id}" 
                   data-action="top-menu"
                   data-link>${menu.menu_name}</a>
            `;
        }).join('');

        navtopContainer.innerHTML = topMenuHtml;

        // 4. 하단 탭(nav-tab) 렌더링
        if (activeMenuId && activeMenuTabs.length > 0) {
            navbottomContainer.innerHTML = activeMenuTabs.map(tab => `
                <a href="${tab.href}" 
                   class="nav-link ${currentPath === tab.href ? 'active' : ''}" 
                   data-link>${tab.tab_name}</a>
            `).join('');
        } else {
            navbottomContainer.innerHTML = '';
        }

        // 5. 상단 메뉴 클릭 시 동작할 이벤트 추가 (SPA 라우팅)
        navtopContainer.querySelectorAll('a[data-action="top-menu"]').forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault(); 
                
                const menuId = e.currentTarget.getAttribute('data-menu-id');
                sessionStorage.setItem('currentMenuId', menuId);

                const href = e.currentTarget.getAttribute('href');
                
                // 🚨 핵심 3: href가 '#'이 아닐 때만 화면 이동 (이벤트 없음 처리)
                if (href && href !== '#') {
                    navigateTo(href); 
                } else {
                     // 탭이 없는 메뉴를 클릭했을 때 사용자에게 알림 (선택 사항)
                     console.log("해당 메뉴에 연결된 탭(화면)이 없습니다.");
                }
            });
        });

        // 6. 하단 탭 클릭 이벤트 추가 (SPA 라우팅)
        navbottomContainer.querySelectorAll('a[data-link]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); 
                
                const href = e.currentTarget.getAttribute('href');
                if (href && href !== '#') {
                    navigateTo(href); 
                }
            });
        });

    } catch (error) {
        // 서버 에러나 네트워크 문제 발생 시 조용히 처리하거나 로그만 남김
        console.error("네비게이션 렌더링 중 에러 발생 (데이터 없음):", error);
        navtopContainer.innerHTML = '';
        navbottomContainer.innerHTML = '';
    }
}