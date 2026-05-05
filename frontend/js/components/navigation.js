// frontend/js/components/navigation.js
import { fetchAPI } from '/js/api.js';
import { navigateTo } from '/js/router.js';

// 1. [API] 상위 메뉴 및 하위 탭 데이터 패칭 함수 (순수 데이터만 가져옴)
async function getMenus() {
    try {
        const menus = await fetchAPI('/menus/');
        return Array.isArray(menus) ? menus.filter(m => m.use_yn === 'Y') : [];
    } catch { return []; }
}

async function getTabs(menuId) {
    if (!menuId) return [];
    try {
        const tabs = await fetchAPI(`/tabs/?menu_id=${encodeURIComponent(menuId)}`);
        return Array.isArray(tabs) ? tabs.filter(t => t.use_yn === 'Y') : [];
    } catch { return []; }
}

// 2. [UI 헬퍼] 탭을 화면에 그리는 역할 분리
function renderTabsToDOM(container, tabs, menuId) {
    container.dataset.renderedMenuId = menuId; // 🔥 핵심 로직 1: 현재 그려진 탭의 부모 메뉴 ID를 DOM에 기록
    container.innerHTML = tabs.map(tab => `
        <a href="${tab.href}" class="nav-link" data-link>${tab.tab_name}</a>
    `).join('');
}

// 3. [UI 헬퍼] CSS(.active) 상태만 가볍게 업데이트
function updateActiveClasses(currentPath, activeMenuId) {
    document.querySelectorAll('#nav-top a').forEach(link => {
        link.classList.toggle('active', link.dataset.menuId === activeMenuId);
    });
    document.querySelectorAll('#nav-bottom a').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === currentPath);
    });
}

// 4. [Main] 똑똑해진 네비게이션 렌더링 함수
export async function renderNavigation() {
    const currentPath = window.location.pathname;
    const navTop = document.getElementById('nav-top');
    const navBottom = document.getElementById('nav-bottom');

    if (!navTop || !navBottom) return;

    // --- 💡 [논리 개선 1] 상위 메뉴가 화면에 없을 때만 API 호출 ---
    if (navTop.children.length === 0) {
        const menus = await getMenus();
        if (menus.length === 0) return;

        navTop.innerHTML = menus.map(menu => `
            <a href="${menu.href || '#'}" class="nav-link" 
               data-menu-id="${menu.menu_id}" 
               data-menu-href="${menu.href || ''}">${menu.menu_name}</a>
        `).join('');

        // 상위 메뉴 클릭 이벤트 위임 (한 번만 등록)
        navTop.addEventListener('click', async (e) => {
            const link = e.target.closest('a[data-menu-id]');
            if (!link) return;
            e.preventDefault();

            const menuId = link.dataset.menuId;
            const menuTabs = await getTabs(menuId);

            if (menuTabs.length > 0) {
                // 🔥 핵심 로직 2: 화면 이동(navigateTo)을 하기 직전에 미리 탭을 화면에 그려버림!
                renderTabsToDOM(navBottom, menuTabs, menuId); 
                navigateTo(menuTabs[0].href);
            } else {
                const href = link.getAttribute('href');
                if (href && href !== '#') navigateTo(href);
            }
        });
    }

    // --- 💡 [논리 개선 2] 현재 URL에 맞는 상위 메뉴 ID 찾기 (화면에 그려진 DOM 기준) ---
    let activeMenuId = null;
    
    // 메인 화면(/)이 아닐 때만 활성화할 상위 메뉴를 찾음
    if (currentPath !== '/' && currentPath !== '/index.html') {
        const topLinks = Array.from(navTop.querySelectorAll('a[data-menu-id]'));
        for (const link of topLinks) {
            const menuHref = link.dataset.menuHref;
            if (menuHref && menuHref !== '#' && currentPath.startsWith(menuHref)) {
                activeMenuId = link.dataset.menuId;
                break;
            }
        }
    }

    // --- 💡 [논리 개선 3] 탭 중복 호출 방지 및 메인 화면 초기화 ---
    const currentRenderedMenuId = navBottom.dataset.renderedMenuId;
    
    if (!activeMenuId) {
        // 🔥 수정됨: 메인 화면 등 활성화된 상위 메뉴가 없을 때는 하위 탭을 비움
        navBottom.innerHTML = '';
        delete navBottom.dataset.renderedMenuId; // 기록된 부모 ID도 삭제
    } 
    else if (currentRenderedMenuId !== activeMenuId) {
        // 활성화되어야 할 상위 메뉴가 바뀌었을 때만 API 호출 후 새로 그림
        const tabs = await getTabs(activeMenuId);
        renderTabsToDOM(navBottom, tabs, activeMenuId);
    }

    // --- 💡 [논리 개선 4] 데이터 호출 없이 가볍게 UI 상태만 변경 ---
    updateActiveClasses(currentPath, activeMenuId);
}