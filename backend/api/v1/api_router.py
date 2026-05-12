from fastapi import APIRouter

from api.v1.endpoints import assets, calendar, economy, menus, posts, tabs, users

api_v1_router = APIRouter()

api_v1_router.include_router(users.router, prefix="/users", tags=["Users"])
api_v1_router.include_router(menus.router, prefix="/menus", tags=["Menus"])
api_v1_router.include_router(tabs.router, prefix="/tabs", tags=["Tabs"])
api_v1_router.include_router(economy.router, prefix="/economy", tags=["Economy"])
api_v1_router.include_router(assets.router, prefix="/assets", tags=["Assets"])
api_v1_router.include_router(calendar.router, prefix="/calendar", tags=["Calendar"])
api_v1_router.include_router(posts.router, tags=["Posts"])
