from fastapi import APIRouter

from core.exceptions import not_found
from schemas.economy_schema import IndicatorHistoryResponse, IndicatorSummaryResponse
from services.economy import economy_service

router = APIRouter()


@router.get("/indicators/summary", response_model=IndicatorSummaryResponse)
async def get_economy_summaries():
    data = await economy_service.get_summaries()
    if not data or not data.get("summaries"):
        raise not_found("Indicator summary data was not found.")
    return data


@router.get("/indicators/{symbol}/history", response_model=IndicatorHistoryResponse)
async def get_economy_history(symbol: str):
    data = await economy_service.get_history(symbol)
    if not data or not data.get("history"):
        raise not_found(f"History data was not found for {symbol}.")
    return data
