from fastapi import APIRouter

from . import stck_items, stck_masters, stck_trades

router = APIRouter()
router.include_router(stck_items.router)
router.include_router(stck_masters.router)
router.include_router(stck_trades.router)
