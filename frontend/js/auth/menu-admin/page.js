import { navigateTo } from '/js/router.js';
import { authService } from '/js/auth/authService.js';
import { createMenu, createTab, fetchMenus, fetchTabs, updateMenu, updateTab } from '/js/auth/menu-admin/api.js';
import { DOM, setAdminControlsVisible } from '/js/auth/menu-admin/dom.js';
import { getFormPayload, getUpdatePayload } from '/js/auth/menu-admin/form.js';
import { renderMenuTable, renderTabTable, setTabTitle } from '/js/auth/menu-admin/render.js';

export function createMenuAdminPage() {
    const state = {
        isAdmin: false,
        menus: [],
        selectedMenuId: null,
    };

    const renderMenus = () => {
        renderMenuTable({
            menus: state.menus,
            selectedMenuId: state.selectedMenuId,
            isAdmin: state.isAdmin,
        });
    };

    const renderTabs = (tabs) => {
        renderTabTable({
            tabs,
            selectedMenuId: state.selectedMenuId,
            isAdmin: state.isAdmin,
        });
    };

    const loadTabs = async (menuId) => {
        state.selectedMenuId = menuId;
        const selectedMenu = state.menus.find((menu) => menu.menu_id === menuId);
        setTabTitle(selectedMenu);

        try {
            const tabs = await fetchTabs(menuId, { includeInactive: state.isAdmin });
            renderTabs(Array.isArray(tabs) ? tabs : []);
        } catch (error) {
            console.error('Failed to load tabs:', error);
            renderTabs([]);
        }
    };

    const loadMenus = async () => {
        try {
            const menus = await fetchMenus({ includeInactive: state.isAdmin });
            state.menus = Array.isArray(menus) ? menus : [];

            if (!state.menus.length) {
                state.selectedMenuId = null;
                renderMenus();
                renderTabs([]);
                setTabTitle(null);
                return;
            }

            if (!state.selectedMenuId || !state.menus.some((menu) => menu.menu_id === state.selectedMenuId)) {
                state.selectedMenuId = state.menus[0].menu_id;
            }

            renderMenus();
            await loadTabs(state.selectedMenuId);
        } catch (error) {
            console.error('Failed to load menus:', error);
            state.menus = [];
            state.selectedMenuId = null;
            renderMenus();
            renderTabs([]);
            setTabTitle(null);
        }
    };

    const handleMenuTableClick = async (event) => {
        const row = event.target.closest('tr[data-menu-id]');
        if (!row) return;

        if (event.target.classList.contains('save-menu-btn')) {
            await updateMenu(row.dataset.menuId, getUpdatePayload(row));
            await loadMenus();
            return;
        }

        if (!event.target.closest('button, input, select')) {
            await loadTabs(row.dataset.menuId);
            renderMenus();
        }
    };

    const handleTabTableClick = async (event) => {
        if (!event.target.classList.contains('save-tab-btn')) return;

        const row = event.target.closest('tr[data-menu-id][data-tab-id]');
        if (!row) return;

        await updateTab(row.dataset.menuId, row.dataset.tabId, getUpdatePayload(row));
        await loadTabs(state.selectedMenuId);
    };

    const handleMenuSubmit = async (event) => {
        event.preventDefault();

        const form = DOM.menuForm();
        if (!form) return;

        const payload = getFormPayload(form);
        await createMenu(payload);
        form.reset();
        state.selectedMenuId = payload.menu_id;
        await loadMenus();
    };

    const handleTabSubmit = async (event) => {
        event.preventDefault();

        if (!state.selectedMenuId) {
            alert('탭을 추가할 메뉴를 먼저 선택해 주세요.');
            return;
        }

        const form = DOM.tabForm();
        if (!form) return;

        const payload = { ...getFormPayload(form), menu_id: state.selectedMenuId };
        await createTab(payload);
        form.reset();
        await loadTabs(state.selectedMenuId);
    };

    const bindEvents = () => {
        if (DOM.menuTbody()) DOM.menuTbody().onclick = handleMenuTableClick;
        if (DOM.tabTbody()) DOM.tabTbody().onclick = handleTabTableClick;
        if (DOM.menuForm()) DOM.menuForm().onsubmit = handleMenuSubmit;
        if (DOM.tabForm()) DOM.tabForm().onsubmit = handleTabSubmit;
    };

    const unbindEvents = () => {
        if (DOM.menuTbody()) DOM.menuTbody().onclick = null;
        if (DOM.tabTbody()) DOM.tabTbody().onclick = null;
        if (DOM.menuForm()) DOM.menuForm().onsubmit = null;
        if (DOM.tabForm()) DOM.tabForm().onsubmit = null;
    };

    return {
        async init() {
            try {
                const user = await authService.verifySession();
                state.isAdmin = user?.role === 'ADMIN';
                setAdminControlsVisible(state.isAdmin);
                bindEvents();
                await loadMenus();
            } catch (error) {
                console.error('Failed to load menu admin page:', error);
                alert('메뉴 관리 화면을 불러오지 못했습니다.');
                navigateTo('/');
            }
        },
        cleanup() {
            unbindEvents();
            state.isAdmin = false;
            state.menus = [];
            state.selectedMenuId = null;
        },
    };
}
