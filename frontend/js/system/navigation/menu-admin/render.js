import { DOM } from '/js/system/navigation/menu-admin/dom.js';
import { disabledUnless, escapeHTML, selected } from '/js/system/navigation/menu-admin/format.js';

const useYnSelect = (value, isAdmin) => `
    <select class="admin-control" data-field="use_yn" ${disabledUnless(isAdmin)}>
        <option value="Y" ${selected(value, 'Y')}>사용</option>
        <option value="N" ${selected(value, 'N')}>미사용</option>
    </select>
`;

export function setTabTitle(menu) {
    const title = DOM.tabTitle();
    if (title) {
        title.textContent = menu ? `탭 - ${menu.menu_name}` : '탭';
    }
}

export function renderMenuTable({ menus, selectedMenuId, isAdmin }) {
    const tbody = DOM.menuTbody();
    if (!tbody) return;

    if (!menus.length) {
        tbody.innerHTML = `<tr><td colspan="${isAdmin ? 6 : 5}" class="empty-cell">메뉴가 없습니다.</td></tr>`;
        return;
    }

    tbody.innerHTML = menus.map((menu) => `
        <tr class="${menu.menu_id === selectedMenuId ? 'selected-row' : ''}" data-menu-id="${escapeHTML(menu.menu_id)}">
            <td><input class="admin-control" type="number" min="0" value="${menu.seq ?? 0}" data-field="seq" ${disabledUnless(isAdmin)}></td>
            <td class="menu-admin-name">${escapeHTML(menu.menu_name)}</td>
            <td>${escapeHTML(menu.menu_id)}</td>
            <td>${escapeHTML(menu.role)}</td>
            <td>${useYnSelect(menu.use_yn, isAdmin)}</td>
            ${isAdmin ? '<td><button type="button" class="save-menu-btn">수정</button></td>' : ''}
        </tr>
    `).join('');
}

export function renderTabTable({ tabs, selectedMenuId, isAdmin }) {
    const tbody = DOM.tabTbody();
    if (!tbody) return;

    if (!selectedMenuId) {
        tbody.innerHTML = `<tr><td colspan="${isAdmin ? 7 : 6}" class="empty-cell">메뉴를 선택해 주세요.</td></tr>`;
        return;
    }

    if (!tabs.length) {
        tbody.innerHTML = `<tr><td colspan="${isAdmin ? 7 : 6}" class="empty-cell">탭이 없습니다.</td></tr>`;
        return;
    }

    tbody.innerHTML = tabs.map((tab) => `
        <tr data-menu-id="${escapeHTML(tab.menu_id)}" data-tab-id="${escapeHTML(tab.tab_id)}">
            <td><input class="admin-control" type="number" min="0" value="${tab.seq ?? 0}" data-field="seq" ${disabledUnless(isAdmin)}></td>
            <td class="menu-admin-name">${escapeHTML(tab.tab_name)}</td>
            <td>${escapeHTML(tab.tab_id)}</td>
            <td>${escapeHTML(tab.role)}</td>
            <td>${escapeHTML(tab.href)}</td>
            <td>${useYnSelect(tab.use_yn, isAdmin)}</td>
            ${isAdmin ? '<td><button type="button" class="save-tab-btn">수정</button></td>' : ''}
        </tr>
    `).join('');
}
