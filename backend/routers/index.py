# backend/routers/index.py
from fastapi import APIRouter
from .pages import asset_pages, main_pages, auth_pages, economy_pages
from .api import users, posts

router = APIRouter()

# 1. 페이지 관련 라우터들을 하나로 합침
router.include_router(main_pages.router)
router.include_router(auth_pages.router)       # 주소 앞에 /auth가 자동으로 붙음
router.include_router(economy_pages.router, prefix="/economy") # 주소 앞에 /economy가 자동으로 붙음
router.include_router(asset_pages.router, prefix="/asset") # 주소 앞에 /economy가 자동으로 붙음

# 2. 데이터 처리용 API 라우터들을 하나로 합침
router.include_router(users.router, prefix="/api/users")
router.include_router(posts.router, prefix="/api/posts")

# 이제 이 router 변수 하나에 모든 길(Route)이 담겼습니다!