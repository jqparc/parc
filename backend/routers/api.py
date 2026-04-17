# routers/api.py
from fastapi import APIRouter

# 각 부서(라우터)들을 불러옵니다.
from routers import users, pages

# 1. 총괄 매니저(마스터 라우터)를 생성합니다.
master_router = APIRouter()

# 2. 총괄 매니저에게 모든 부서를 등록시킵니다.
master_router.include_router(pages.router)
master_router.include_router(users.router, prefix="/api")