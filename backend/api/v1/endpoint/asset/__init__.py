from fastapi import APIRouter

from . import stck

router = APIRouter()
router.include_router(stck.router)

__all__ = ["router", "stck"]
