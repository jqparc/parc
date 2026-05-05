import { navigateTo } from "/js/router.js";
import { fetchAPI } from '/js/api.js';

let currentUser = null;
let isAdmin = false;
let menus = [];
let selectedMenuId = null;

export async function init() {
    try {
        currentUser = await fetchAPI('/users/me');
        isAdmin = currentUser?.role === 'ADMIN';

        document.querySelectorAll('.admin-only').forEach(element => {
            element.hidden = !isAdmin;
        });

        bindCreateForms();
        await loadMenus();
    } catch (error) {
        console.error("메뉴 관리 데이터 로드 실패:", error);
        alert("메뉴 관리 화면을 불러오지 못했습니다.");
        navigateTo('/');
    }
}

function menuQuery() {
    return isAdmin ? '/menus/?include_inactive=true' : '/menus/';
}

function tabsQuery(menuId) {
    const query = isAdmin ? '&include_inactive=true' : '';
    return `/tabs/?menu_id=${encodeURIComponent(menuId)}${query}`;
}

async function loadMenus() {
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
}

async function loadTabs(menuId) {
    selectedMenuId = menuId;
    const selectedMenu = menus.find(menu => menu.menu_id === menuId);
    const title = document.getElementById('tab-section-title');
    if (title) {
        title.textContent = selectedMenu ? `탭 - ${selectedMenu.menu_name}` : '탭';
    }

    const tabData = await fetchAPI(tabsQuery(menuId));
    renderTabTable(Array.isArray(tabData) ? tabData : []);
}

function renderMenuTable(menuList) {
    const tbody = document.getElementById('tbody-menu');
    if (!tbody) return;

    if (menuList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${isAdmin ? 6 : 5}" class="empty-cell">메뉴가 없습니다.</td></tr>`;
        return;
    }

    tbody.innerHTML = menuList.map(menu => `
        <tr class="${menu.menu_id === selectedMenuId ? 'selected-row' : ''}" data-menu-id="${menu.menu_id}">
            <td>
                <input class="admin-control" type="number" min="0" value="${menu.seq ?? 0}" data-field="seq" ${isAdmin ? '' : 'disabled'}>
            </td>
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

    tbody.querySelectorAll('tr[data-menu-id]').forEach(row => {
        row.addEventListener('click', async event => {
            if (event.target.closest('button, input, select')) return;
            await loadTabs(row.dataset.menuId);
            renderMenuTable(menus);
        });
    });

    tbody.querySelectorAll('.save-menu-btn').forEach(button => {
        button.addEventListener('click', async event => {
            const row = event.target.closest('tr');
            await saveMenu(row);
        });
    });
}

function renderTabTable(tabList) {
    const tbody = document.getElementById('tbody-tab');
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
            <td>
                <input class="admin-control" type="number" min="0" value="${tab.seq ?? 0}" data-field="seq" ${isAdmin ? '' : 'disabled'}>
            </td>
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

    tbody.querySelectorAll('.save-tab-btn').forEach(button => {
        button.addEventListener('click', async event => {
            const row = event.target.closest('tr');
            await saveTab(row);
        });
    });
}

async function saveMenu(row) {
    const menuId = row.dataset.menuId;
    const payload = getUpdatePayload(row);

    await fetchAPI(`/menus/${encodeURIComponent(menuId)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });

    await loadMenus();
}

async function saveTab(row) {
    const menuId = row.dataset.menuId;
    const tabId = row.dataset.tabId;
    const payload = getUpdatePayload(row);

    await fetchAPI(`/tabs/${encodeURIComponent(menuId)}/${encodeURIComponent(tabId)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
    });

    await loadTabs(selectedMenuId);
}

function getUpdatePayload(row) {
    const seq = row.querySelector('[data-field="seq"]').value;
    const useYn = row.querySelector('[data-field="use_yn"]').value;

    return {
        seq: Number(seq),
        use_yn: useYn
    };
}

function bindCreateForms() {
    const menuForm = document.getElementById('menu-create-form');
    const tabForm = document.getElementById('tab-create-form');

    if (menuForm) {
        menuForm.addEventListener('submit', async event => {
            event.preventDefault();
            const payload = getFormPayload(menuForm);

            await fetchAPI('/menus/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            menuForm.reset();
            selectedMenuId = payload.menu_id;
            await loadMenus();
        });
    }

    if (tabForm) {
        tabForm.addEventListener('submit', async event => {
            event.preventDefault();
            if (!selectedMenuId) {
                alert('탭을 추가할 메뉴를 먼저 선택하세요.');
                return;
            }

            const payload = {
                ...getFormPayload(tabForm),
                menu_id: selectedMenuId
            };

            await fetchAPI('/tabs/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            tabForm.reset();
            await loadTabs(selectedMenuId);
        });
    }
}

function getFormPayload(form) {
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.seq = Number(payload.seq);
    return payload;
}
