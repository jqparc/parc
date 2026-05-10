from fastapi import APIRouter

from api.v1.endpoints.asset import stck


router = APIRouter()

router.include_router(stck.router)
