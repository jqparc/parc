from fastapi import APIRouter

from api.v1.endpoint import asset, calendar, economy
from api.v1.endpoint.system import user
from api.v1.endpoint.system.navigation import menu, tab

api_v1_router = APIRouter()

api_v1_router.include_router(user.router, prefix="/user", tags=["User"])
api_v1_router.include_router(menu.router, prefix="/menu", tags=["Menu"])
api_v1_router.include_router(tab.router, prefix="/tab", tags=["Tab"])
api_v1_router.include_router(economy.router, prefix="/economy", tags=["Economy"])
api_v1_router.include_router(asset.router, prefix="/asset", tags=["Asset"])
api_v1_router.include_router(calendar.router, prefix="/calendar", tags=["Calendar"])
