import { fetchAPI } from '/js/api.js';

const withInactiveParam = (path, includeInactive) => {
    const params = new URLSearchParams();
    if (includeInactive) {
        params.set('include_inactive', 'true');
    }

    const query = params.toString();
    return query ? `${path}?${query}` : path;
};

export function fetchMenus({ includeInactive = false } = {}) {
    return fetchAPI(withInactiveParam('/menu/', includeInactive));
}

export function fetchTabs(menuId, { includeInactive = false } = {}) {
    const path = `/tab/?menu_id=${encodeURIComponent(menuId)}`;
    return fetchAPI(includeInactive ? `${path}&include_inactive=true` : path);
}

export function createMenu(menuData) {
    return fetchAPI('/menu/', {
        method: 'POST',
        body: JSON.stringify(menuData),
    });
}

export function updateMenu(menuId, menuData) {
    return fetchAPI(`/menu/${encodeURIComponent(menuId)}`, {
        method: 'PATCH',
        body: JSON.stringify(menuData),
    });
}

export function createTab(tabData) {
    return fetchAPI('/tab/', {
        method: 'POST',
        body: JSON.stringify(tabData),
    });
}

export function updateTab(menuId, tabId, tabData) {
    return fetchAPI(`/tab/${encodeURIComponent(menuId)}/${encodeURIComponent(tabId)}`, {
        method: 'PATCH',
        body: JSON.stringify(tabData),
    });
}
