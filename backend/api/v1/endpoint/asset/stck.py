from fastapi import APIRouter

from . import common_code, stck_item, stck_master, stck_trade

router = APIRouter()
router.include_router(common_code.router)
router.include_router(stck_item.router)
router.include_router(stck_master.router)
router.include_router(stck_trade.router)
