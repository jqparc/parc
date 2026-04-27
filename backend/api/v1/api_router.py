from fastapi import APIRouter
# 🔥 경로가 api.v1.endpoints 로 변경되었습니다.
from api.v1.endpoints import users, posts

api_v1_router = APIRouter()

api_v1_router.include_router(users.router, prefix="/users", tags=["Users"])
api_v1_router.include_router(posts.router, prefix="/posts", tags=["Posts"])