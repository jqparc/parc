export const DOM = {
    menuTbody: () => document.getElementById('tbody-menu'),
    tabTbody: () => document.getElementById('tbody-tab'),
    menuForm: () => document.getElementById('menu-create-form'),
    tabForm: () => document.getElementById('tab-create-form'),
    tabTitle: () => document.getElementById('tab-section-title'),
    adminOnly: () => document.querySelectorAll('.admin-only'),
};

export function setAdminControlsVisible(isAdmin) {
    DOM.adminOnly().forEach((element) => {
        element.hidden = !isAdmin;
    });
}
