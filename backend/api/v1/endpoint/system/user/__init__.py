from fastapi import APIRouter

from . import auth, mypage

router = APIRouter()

router.include_router(auth.router)
router.include_router(mypage.router)

__all__ = ["router"]
