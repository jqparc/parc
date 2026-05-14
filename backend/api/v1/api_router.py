from fastapi import APIRouter

from api.v1.endpoint import asset, calendar, economy, user
from api.v1.endpoint.navigation import menu, tab

api_v1_router = APIRouter()

api_v1_router.include_router(user.router, prefix="/user", tags=["Users"])
api_v1_router.include_router(menu.router, prefix="/menu", tags=["Menus"])
api_v1_router.include_router(tab.router, prefix="/tab", tags=["Tabs"])
api_v1_router.include_router(economy.router, prefix="/economy", tags=["Economy"])
api_v1_router.include_router(asset.router, prefix="/asset", tags=["Assets"])
api_v1_router.include_router(calendar.router, prefix="/calendar", tags=["Calendar"])
