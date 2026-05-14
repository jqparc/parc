from fastapi import APIRouter

from . import board, post

router = APIRouter(tags=["Economy Info"])

router.include_router(board.router)
router.include_router(post.router)

__all__ = ["router"]
