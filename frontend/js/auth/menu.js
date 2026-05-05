// frontend/js/admin/menu-admin.js (파일 경로는 프로젝트에 맞게 확인하세요)
import { navigateTo } from "/js/router.js";
import { fetchAPI } from '/js/api.js';
import { authService } from '/js/auth/authService.js';

// --- 💡 [상태 관리] ---
let isAdmin = false;
let menus = [];
let selectedMenuId = null;

// --- 💡 [DOM 캐싱] ---
const DOM = {
    menuTbody: () => document.getElementById('tbody-menu'),
    tabTbody: () => document.getElementById('tbody-tab'),
    menuForm: () => document.getElementById('menu-create-form'),
    tabForm: () => document.getElementById('tab-create-form'),
    tabTitle: () => document.getElementById('tab-section-title'),
};

// --- 💡 [API 쿼리 헬퍼] ---
const menuQuery = () => isAdmin ? '/menus/?include_inactive=true' : '/menus/';
const tabsQuery = (menuId) => isAdmin ? `/tabs/?menu_id=${encodeURIComponent(menuId)}&include_inactive=true` : `/tabs/?menu_id=${encodeURIComponent(menuId)}`;

// --- 💡 [UI 렌더링 로직] HTML만 순수하게 생성 (이벤트 바인딩 제거) ---
function renderMenuTable(menuList) {
    const tbody = DOM.menuTbody();
    if (!tbody) return;

    if (menuList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${isAdmin ? 6 : 5}" class="empty-cell">메뉴가 없습니다.</td></tr>`;
        return;
    }

    tbody.innerHTML = menuList.map(menu => `
        <tr class="${menu.menu_id === selectedMenuId ? 'selected-row' : ''}" data-menu-id="${menu.menu_id}">
            <td><input class="admin-control" type="number" min="0" value="${menu.seq ?? 0}" data-field="seq" ${isAdmin ? '' : 'disabled'}></td>
            <td class="menu-admin-name">${menu.menu_name}</td>
            <td>${menu.menu_id}</td>
            <td>${menu.role}</td>
            <td>
                <select class="admin-control" data-field="use_yn" ${isAdmin ? '' : 'disabled'}>
                    <option value="Y" ${menu.use_yn === 'Y' ? 'selected' : ''}>사용</option>
                    <option value="N" ${menu.use_yn === 'N' ? 'selected' : ''}>미사용</option>
                </select>
            </td>
            ${isAdmin ? '<td><button type="button" class="save-menu-btn">수정</button></td>' : ''}
        </tr>
    `).join('');
}

function renderTabTable(tabList) {
    const tbody = DOM.tabTbody();
    if (!tbody) return;

    if (!selectedMenuId) {
        tbody.innerHTML = `<tr><td colspan="${isAdmin ? 7 : 6}" class="empty-cell">메뉴를 선택하세요.</td></tr>`;
        return;
    }

    if (tabList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${isAdmin ? 7 : 6}" class="empty-cell">탭이 없습니다.</td></tr>`;
        return;
    }

    tbody.innerHTML = tabList.map(tab => `
        <tr data-menu-id="${tab.menu_id}" data-tab-id="${tab.tab_id}">
            <td><input class="admin-control" type="number" min="0" value="${tab.seq ?? 0}" data-field="seq" ${isAdmin ? '' : 'disabled'}></td>
            <td class="menu-admin-name">${tab.tab_name}</td>
            <td>${tab.tab_id}</td>
            <td>${tab.role}</td>
            <td>${tab.href}</td>
            <td>
                <select class="admin-control" data-field="use_yn" ${isAdmin ? '' : 'disabled'}>
                    <option value="Y" ${tab.use_yn === 'Y' ? 'selected' : ''}>사용</option>
                    <option value="N" ${tab.use_yn === 'N' ? 'selected' : ''}>미사용</option>
                </select>
            </td>
            ${isAdmin ? '<td><button type="button" class="save-tab-btn">수정</button></td>' : ''}
        </tr>
    `).join('');
}

// --- 💡 [데이터 통신 로직] ---
async function loadTabs(menuId) {
    selectedMenuId = menuId;
    const selectedMenu = menus.find(menu => menu.menu_id === menuId);
    const title = DOM.tabTitle();
    
    if (title) {
        title.textContent = selectedMenu ? `탭 - ${selectedMenu.menu_name}` : '탭';
    }

    try {
        const tabData = await fetchAPI(tabsQuery(menuId));
        renderTabTable(Array.isArray(tabData) ? tabData : []);
    } catch {
        renderTabTable([]);
    }
}

async function loadMenus() {
    try {
        const menuData = await fetchAPI(menuQuery());
        menus = Array.isArray(menuData) ? menuData : [];

        if (menus.length === 0) {
            renderMenuTable([]);
            renderTabTable([]);
            return;
        }

        if (!selectedMenuId || !menus.some(menu => menu.menu_id === selectedMenuId)) {
            selectedMenuId = menus[0].menu_id;
        }

        renderMenuTable(menus);
        await loadTabs(selectedMenuId);
    } catch {
        renderMenuTable([]);
        renderTabTable([]);
    }
}

function getUpdatePayload(row) {
    const seq = row.querySelector('[data-field="seq"]').value;
    const useYn = row.querySelector('[data-field="use_yn"]').value;
    return { seq: Number(seq), use_yn: useYn };
}

function getFormPayload(form) {
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.seq = Number(payload.seq);
    return payload;
}

// --- 💡 [이벤트 위임 로직] 테이블 클릭 핸들러 ---
async function handleMenuTableClick(event) {
    const row = event.target.closest('tr[data-menu-id]');
    if (!row) return;

    // 1. '수정' 버튼을 눌렀을 때
    if (event.target.classList.contains('save-menu-btn')) {
        const menuId = row.dataset.menuId;
        await fetchAPI(`/menus/${encodeURIComponent(menuId)}`, {
            method: 'PATCH', body: JSON.stringify(getUpdatePayload(row))
        });
        await loadMenus();
        return;
    }

    // 2. 행(Row) 자체를 클릭했을 때 (입력 요소 클릭 제외)
    if (!event.target.closest('button, input, select')) {
        await loadTabs(row.dataset.menuId);
        renderMenuTable(menus);
    }
}

async function handleTabTableClick(event) {
    // '수정' 버튼을 눌렀을 때만 처리
    if (event.target.classList.contains('save-tab-btn')) {
        const row = event.target.closest('tr');
        const menuId = row.dataset.menuId;
        const tabId = row.dataset.tabId;
        
        await fetchAPI(`/tabs/${encodeURIComponent(menuId)}/${encodeURIComponent(tabId)}`, {
            method: 'PATCH', body: JSON.stringify(getUpdatePayload(row))
        });
        await loadTabs(selectedMenuId);
    }
}

// --- 💡 [이벤트 핸들러] 생성 폼 제출 ---
async function handleMenuSubmit(event) {
    event.preventDefault();
    const form = DOM.menuForm();
    const payload = getFormPayload(form);

    await fetchAPI('/menus/', { method: 'POST', body: JSON.stringify(payload) });
    form.reset();
    selectedMenuId = payload.menu_id;
    await loadMenus();
}

async function handleTabSubmit(event) {
    event.preventDefault();
    if (!selectedMenuId) {
        alert('탭을 추가할 메뉴를 먼저 선택하세요.');
        return;
    }

    const form = DOM.tabForm();
    const payload = { ...getFormPayload(form), menu_id: selectedMenuId };

    await fetchAPI('/tabs/', { method: 'POST', body: JSON.stringify(payload) });
    form.reset();
    await loadTabs(selectedMenuId);
}

// --- 💡 [메인 초기화 로직] ---
export async function init() {
    try {
        // 🔥 직접 fetchAPI를 부르지 않고 캐싱된 authService 활용
        const user = await authService.verifySession();
        isAdmin = user?.role === 'ADMIN';

        document.querySelectorAll('.admin-only').forEach(element => {
            element.hidden = !isAdmin;
        });

        // 🔥 SPA 이벤트 중복 방지를 위한 onclick / onsubmit 바인딩 (이벤트 위임)
        if (DOM.menuTbody()) DOM.menuTbody().onclick = handleMenuTableClick;
        if (DOM.tabTbody()) DOM.tabTbody().onclick = handleTabTableClick;
        if (DOM.menuForm()) DOM.menuForm().onsubmit = handleMenuSubmit;
        if (DOM.tabForm()) DOM.tabForm().onsubmit = handleTabSubmit;

        await loadMenus();
    } catch (error) {
        console.error("메뉴 관리 데이터 로드 실패:", error);
        alert("메뉴 관리 화면을 불러오지 못했습니다.");
        navigateTo('/');
    }
}

// --- 💡 [라우터 클린업] 메모리 누수 완벽 차단 ---
export function cleanup() {
    if (DOM.menuTbody()) DOM.menuTbody().onclick = null;
    if (DOM.tabTbody()) DOM.tabTbody().onclick = null;
    if (DOM.menuForm()) DOM.menuForm().onsubmit = null;
    if (DOM.tabForm()) DOM.tabForm().onsubmit = null;
    
    // 화면 이탈 시 선택된 상태 초기화
    selectedMenuId = null;
}