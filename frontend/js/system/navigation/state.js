export function findActiveMenuId(currentPath, navTop) {
    if (currentPath === '/' || currentPath === '/index.html') return null;

    const topLinks = Array.from(navTop.querySelectorAll('a[data-menu-id]'));
    const activeLink = topLinks.find((link) => {
        const menuHref = link.dataset.menuHref;
        return menuHref && menuHref !== '#' && currentPath.startsWith(menuHref);
    });

    return activeLink?.dataset.menuId || null;
}
