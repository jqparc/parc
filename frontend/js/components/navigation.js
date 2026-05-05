import { fetchAPI } from '/js/api.js';
import { navigateTo } from '/js/router.js';

// 캐싱 및 상태 관리를 위한 변수들
let menusPromise = null; // 메뉴 데이터를 한 번만 가져오기 위한 프로미스
const tabsPromiseByMenuId = new Map(); // 메뉴 ID별 탭 데이터를 저장하는 캐시 맵
let renderPromise = null; // 중복 렌더링 방지를 위한 프로미스

// [API] 서버로부터 상위 메뉴 목록을 가져오는 함수
function fetchMenus() {
    if (!menusPromise) {
        menusPromise = fetchAPI('/menus/').catch(error => {
            menusPromise = null; // 에러 발생 시 재시도 가능하도록 초기화
            throw error;
        });
    }
    return menusPromise;
}

// [API] 특정 메뉴에 속한 하위 탭 목록을 가져오는 함수
async function fetchTabs(menuId) {
    if (!menuId) return []; // 메뉴 ID가 없으면 빈 배열 반환
    if (!tabsPromiseByMenuId.has(menuId)) {
        const promise = fetchAPI(`/tabs/?menu_id=${encodeURIComponent(menuId)}`)
            .catch(error => {
                tabsPromiseByMenuId.delete(menuId);
                throw error;
            });
        tabsPromiseByMenuId.set(menuId, promise);
    }

    const tabs = await tabsPromiseByMenuId.get(menuId);
    // 사용 여부(use_yn)가 'Y'인 탭만 필터링하여 반환
    return Array.isArray(tabs) ? tabs.filter(tab => tab.use_yn === 'Y') : [];
}

// [Util] 경로 문자열을 일관된 형태로 정규화하는 함수
function normalizePath(path) {
    if (!path || path === '#') return null;
    try {
        return new URL(path, window.location.origin).pathname;
    } catch {
        return path.startsWith('/') ? path : `/${path}`;
    }
}

// [Util] 현재 경로와 메뉴의 href가 일치하는지 확인하여 활성화 여부 판단
function isActiveHref(currentPath, href) {
    const targetPath = normalizePath(href);
    if (!targetPath) return false;
    if (targetPath === '/') return currentPath === targetPath;
    // 현재 경로가 대상 경로와 같거나 하위 경로인 경우 true
    return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

// [Logic] 현재 URL 경로에 가장 적합한 메뉴 ID를 찾는 함수
function findMenuIdByPath(activeMenus, currentPath) {
    const matchedMenu = activeMenus
        .filter(menu => isActiveHref(currentPath, menu.href))
        // 가장 구체적으로 일치하는 경로(길이가 긴 것)를 우선 선택
        .sort((a, b) => (normalizePath(b.href) || '').length - (normalizePath(a.href) || '').length)[0];

    return matchedMenu?.menu_id || null;
}

// [Logic] 페이지 로드 시 어떤 메뉴를 활성화할지 결정하는 함수 (수정 대상)
function getInitialMenuId(activeMenus, currentPath, resetToFirst = false) {
    // 1. 인덱스 페이지(/)인 경우 아무것도 선택하지 않음
    if (currentPath === '/' || currentPath === '/index.html') {
        return null;
    }

    if (resetToFirst) {
        return activeMenus[0]?.menu_id || null;
    }

    // 2. 현재 경로와 일치하는 메뉴가 있는지 확인
    const pathMenuId = findMenuIdByPath(activeMenus, currentPath);
    if (pathMenuId) {
        return pathMenuId;
    }

    // 3. 세션 스토리지에 저장된 마지막 메뉴 확인
    const savedMenuId = sessionStorage.getItem('currentMenuId');
    if (savedMenuId && activeMenus.some(menu => menu.menu_id === savedMenuId)) {
        return savedMenuId;
    }

    return null;
}

// [Render] 상위 네비게이션 HTML을 생성하고 컨테이너에 삽입하는 함수
function renderTopMenus(container, activeMenus, activeMenuId) {
    container.innerHTML = activeMenus.map(menu => `
        <a href="#"
           class="nav-link ${activeMenuId === menu.menu_id ? 'active' : ''}"
           data-menu-id="${menu.menu_id}"
           ${activeMenuId === menu.menu_id ? 'aria-current="true"' : ''}
           data-action="top-menu">${menu.menu_name}</a>
    `).join('');
}

// [Render] 하위 탭 네비게이션 HTML을 생성하고 컨테이너에 삽입하는 함수
function renderBottomTabs(container, tabs, currentPath) {
    if (tabs.length === 0) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = tabs.map(tab => `
        <a href="${tab.href}"
           class="nav-link ${isActiveHref(currentPath, tab.href) ? 'active' : ''}"
           ${isActiveHref(currentPath, tab.href) ? 'aria-current="page"' : ''}
           data-link>${tab.tab_name}</a>
    `).join('');
}

// [Main] 실제 네비게이션 렌더링 및 이벤트 바인딩을 수행하는 비동기 함수
async function doRenderNavigation({ resetToFirst = false } = {}) {
    const currentPath = window.location.pathname;
    const navtopContainer = document.getElementById('nav-top');
    const navbottomContainer = document.getElementById('nav-bottom');

    if (!navtopContainer || !navbottomContainer) return;

    try {
        const menus = await fetchMenus();
        const activeMenus = Array.isArray(menus) ? menus.filter(menu => menu.use_yn === 'Y') : [];

        if (activeMenus.length === 0) {
            navtopContainer.innerHTML = '';
            navbottomContainer.innerHTML = '';
            return;
        }

        // 초기 메뉴 ID 결정 (수정된 로직 적용)
        const activeMenuId = getInitialMenuId(activeMenus, currentPath, resetToFirst);
        
        // 메뉴 상태 저장 및 렌더링
        if (activeMenuId) {
            sessionStorage.setItem('currentMenuId', activeMenuId);
        } else {
            sessionStorage.removeItem('currentMenuId'); // 인덱스일 경우 세션 비움
        }

        renderTopMenus(navtopContainer, activeMenus, activeMenuId);
        const activeMenuTabs = await fetchTabs(activeMenuId);
        renderBottomTabs(navbottomContainer, activeMenuTabs, currentPath);

        // 이벤트 리스너 등록 (상위 메뉴 클릭 시)
        navtopContainer.querySelectorAll('a[data-action="top-menu"]').forEach(link => {
            link.addEventListener('click', async (event) => {
                event.preventDefault();
                const menuId = event.currentTarget.getAttribute('data-menu-id');
                sessionStorage.setItem('currentMenuId', menuId);

                const tabs = await fetchTabs(menuId);
                if (tabs.length > 0) {
                    navigateTo(tabs[0].href); // 탭이 있으면 첫 번째 탭으로 이동
                    return;
                }
                // 탭이 없으면 상위 메뉴만 활성화 표시
                renderTopMenus(navtopContainer, activeMenus, menuId);
                renderBottomTabs(navbottomContainer, [], currentPath);
            });
        });

        // 이벤트 리스너 등록 (하위 탭 클릭 시 - SPA 라우팅 적용)
        navbottomContainer.querySelectorAll('a[data-link]').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const href = event.currentTarget.getAttribute('href');
                if (href && href !== '#') {
                    navigateTo(href);
                }
            });
        });
    } catch (error) {
        console.error('Navigation render failed:', error);
        navtopContainer.innerHTML = '';
        navbottomContainer.innerHTML = '';
    }
}

// 외부에서 호출하는 인터페이스 함수 (렌더링 동시성 제어)
export function renderNavigation(options = {}) {
    if (!renderPromise) {
        renderPromise = doRenderNavigation(options).finally(() => {
            renderPromise = null;
        });
    }
    return renderPromise;
}