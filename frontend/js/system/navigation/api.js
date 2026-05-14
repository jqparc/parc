import { fetchAPI } from '/js/api.js';

const HREF_ALIASES = new Map([
    ['/economy/infos', '/economy/info'],
    ['/economy/indicators', '/economy/indicator'],
    ['/boards/write', '/board/write'],
    ['/asset/setting/stck-items', '/asset/setting/stck-item'],
    ['/asset/setting/business-types', '/asset/setting/business-type'],
]);

export function normalizeHref(href) {
    if (!href || href === '#') return href;

    const [path, suffix = ''] = href.split(/([?#].*)/, 2);
    return `${HREF_ALIASES.get(path) || path}${suffix}`;
}

function normalizeNavigationItem(item) {
    return {
        ...item,
        href: normalizeHref(item.href),
    };
}

export async function getMenus() {
    try {
        const menus = await fetchAPI('/menu/');
        return Array.isArray(menus)
            ? menus.filter((menu) => menu.use_yn === 'Y').map(normalizeNavigationItem)
            : [];
    } catch {
        return [];
    }
}

export async function getTabs(menuId) {
    if (!menuId) return [];

    try {
        const tabs = await fetchAPI(`/tab/?menu_id=${encodeURIComponent(menuId)}`);
        return Array.isArray(tabs)
            ? tabs.filter((tab) => tab.use_yn === 'Y').map(normalizeNavigationItem)
            : [];
    } catch {
        return [];
    }
}
