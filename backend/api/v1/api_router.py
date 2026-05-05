from fastapi import APIRouter
# 🔥 경로가 api.v1.endpoints 로 변경되었습니다.
from api.v1.endpoints import users, posts, menus, tabs, economy, assets

api_v1_router = APIRouter()

api_v1_router.include_router(users.router, prefix="/users", tags=["Users"])
api_v1_router.include_router(menus.router, prefix="/menus", tags=["Menus"])
api_v1_router.include_router(tabs.router, prefix="/tabs" , tags=["Tabs" ])
api_v1_router.include_router(economy.router, prefix="/economy" , tags=["Economy" ])
api_v1_router.include_router(assets.router, prefix="/assets" , tags=["Assets" ])
api_v1_router.include_router(posts.router, tags=["Posts"])
