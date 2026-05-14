from fastapi import APIRouter

from . import indicator
from .info import router as info_router

router = APIRouter()

router.include_router(info_router, prefix="/info", tags=["Economy Info"])
router.include_router(indicator.router, prefix="/indicator", tags=["Economy Indicators"])

__all__ = ["router"]
