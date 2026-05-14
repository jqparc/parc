import { createMenuAdminPage } from '/js/system/navigation/menu-admin/page.js';

const page = createMenuAdminPage();

export const init = () => page.init();
export const cleanup = () => page.cleanup();
