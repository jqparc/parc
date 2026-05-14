import { navigateTo } from '/js/router.js';
import { getMenus, getTabs } from '/js/component/navigation/api.js';
import { clearTabs, renderTabs, renderTopMenus, updateActiveClasses } from '/js/component/navigation/render.js';
import { findActiveMenuId } from '/js/component/navigation/state.js';

export async function renderNavigation() {
    const currentPath = window.location.pathname;
    const navTop = document.getElementById('nav-top');
    const navBottom = document.getElementById('nav-bottom');

    if (!navTop || !navBottom) return;

    await ensureTopMenus(navTop, navBottom);

    const activeMenuId = findActiveMenuId(currentPath, navTop);
    await syncBottomTabs(navBottom, activeMenuId);
    updateActiveClasses(currentPath, activeMenuId);
}

async function ensureTopMenus(navTop, navBottom) {
    if (navTop.children.length > 0) return;

    const menus = await getMenus();
    if (menus.length === 0) return;

    renderTopMenus(navTop, menus);
    navTop.addEventListener('click', (event) => handleTopMenuClick(event, navBottom));
}

async function handleTopMenuClick(event, navBottom) {
    const link = event.target.closest('a[data-menu-id]');
    if (!link) return;

    event.preventDefault();

    const menuTabs = await getTabs(link.dataset.menuId);
    if (menuTabs.length > 0) {
        renderTabs(navBottom, menuTabs, link.dataset.menuId);
        navigateTo(menuTabs[0].href);
        return;
    }

    const href = link.getAttribute('href');
    if (href && href !== '#') {
        navigateTo(href);
    }
}

async function syncBottomTabs(navBottom, activeMenuId) {
    if (!activeMenuId) {
        clearTabs(navBottom);
        return;
    }

    if (navBottom.dataset.renderedMenuId === activeMenuId) return;

    const tabs = await getTabs(activeMenuId);
    renderTabs(navBottom, tabs, activeMenuId);
}
