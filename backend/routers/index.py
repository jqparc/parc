# backend/routers/index.py
from fastapi import APIRouter
from .api import users, posts
# pages 관련 임포트는 모두 삭제합니다.

router = APIRouter()

# 데이터 처리용 API 라우터들만 등록합니다.
# 모든 백엔드 요청은 '/api/...' 로 시작하게 됩니다.
router.include_router(users.router, prefix="/api/users")
router.include_router(posts.router, prefix="/api/posts")

# 추후 비즈니스 로직이 추가되면 아래와 같이 확장해 나갈 예정입니다.
# router.include_router(economy.router, prefix="/api/economy")
# router.include_router(assets.router, prefix="/api/assets")