import { assetDynamicRoutes, assetRoutes } from '/js/route-config/asset.js';
import { authRoutes } from '/js/route-config/auth.js';
import { boardRoutes } from '/js/route-config/board.js';
import { calendarRoutes } from '/js/route-config/calendar.js';
import { economyDynamicRoutes, economyRoutes } from '/js/route-config/economy.js';

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
