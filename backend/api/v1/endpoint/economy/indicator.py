from fastapi import APIRouter

from core.exception import not_found
from schema.economy import IndicatorHistoryResponse, IndicatorSummaryResponse
from service.economy import economy_service

router = APIRouter()


@router.get("/summary", response_model=IndicatorSummaryResponse)
async def get_indicator_summaries():
    data = await economy_service.indicators.get_summaries()
    if not data or not data.get("summaries"):
        raise not_found("Indicator summary data was not found.")
    return data


@router.get("/{symbol}/history", response_model=IndicatorHistoryResponse)
async def get_indicator_history(symbol: str):
    data = await economy_service.indicators.get_history(symbol)
    if not data or not data.get("history"):
        raise not_found(f"History data was not found for {symbol}.")
    return data
