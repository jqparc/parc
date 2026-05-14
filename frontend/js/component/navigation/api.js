import { fetchAPI } from '/js/api.js';

export async function getMenus() {
    try {
        const menus = await fetchAPI('/menu/');
        return Array.isArray(menus) ? menus.filter((menu) => menu.use_yn === 'Y') : [];
    } catch {
        return [];
    }
}

export async function getTabs(menuId) {
    if (!menuId) return [];

    try {
        const tabs = await fetchAPI(`/tab/?menu_id=${encodeURIComponent(menuId)}`);
        return Array.isArray(tabs) ? tabs.filter((tab) => tab.use_yn === 'Y') : [];
    } catch {
        return [];
    }
}
