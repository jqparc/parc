import { escapeHTML } from '/js/board/page-util.js';

export function renderTopMenus(container, menus) {
    container.innerHTML = menus.map((menu) => `
        <a href="${escapeHTML(menu.href || '#')}" class="nav-menu-link"
           data-menu-id="${escapeHTML(menu.menu_id)}"
           data-menu-href="${escapeHTML(menu.href || '')}">${escapeHTML(menu.menu_name)}</a>
    `).join('');
}

export function renderTabs(container, tabs, menuId) {
    container.dataset.renderedMenuId = menuId;
    container.innerHTML = tabs.map((tab) => `
        <a href="${escapeHTML(tab.href)}" class="nav-tab-link" data-link>${escapeHTML(tab.tab_name)}</a>
    `).join('');
}

export function clearTabs(container) {
    container.innerHTML = '';
    delete container.dataset.renderedMenuId;
}

export function updateActiveClasses(currentPath, activeMenuId) {
    document.querySelectorAll('#nav-top a').forEach((link) => {
        link.classList.toggle('active', link.dataset.menuId === activeMenuId);
    });

    document.querySelectorAll('#nav-bottom a').forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === currentPath);
    });
}
