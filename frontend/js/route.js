import { assetDynamicRoutes, assetRoutes } from '/js/asset/route.js';
import { authRoutes } from '/js/system/user/route.js';
import { boardRoutes } from '/js/board/route.js';
import { calendarRoutes } from '/js/calendar/route.js';
import { economyDynamicRoutes, economyRoutes } from '/js/economy/route.js';

export const routes = {
    ...calendarRoutes,
    ...authRoutes,
    ...economyRoutes,
    ...assetRoutes,
    ...boardRoutes,
};

export const dynamicRoutes = [
    ...economyDynamicRoutes,
    ...assetDynamicRoutes,
];
