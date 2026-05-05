# backend/api/v1/endpoints/economy.py
from fastapi import APIRouter, HTTPException
from services.economy_service import economy_service
from schemas.economy_schema import IndicatorSummaryResponse, IndicatorHistoryResponse

router = APIRouter()

@router.get("/indicators/summary", response_model=IndicatorSummaryResponse)
async def get_economy_summaries():
    """
    [표 렌더링용 API]
    등록된 모든 경제 지표의 최신 요약 데이터(현재가, 전일가, 등락폭, 등락률 등)를 가볍게 반환합니다.
    """
    data = await economy_service.get_summaries()
    if not data or not data.get("summaries"):
        raise HTTPException(status_code=404, detail="지표 요약 데이터를 불러올 수 없습니다.")
    return data

@router.get("/indicators/{symbol}/history", response_model=IndicatorHistoryResponse)
async def get_economy_history(symbol: str):
    """
    [차트 렌더링용 API]
    특정 지표(symbol)의 최근 1년치 일별 시계열 데이터(날짜, 종가)를 반환합니다.
    (예: /api/v1/economy/indicators/^GSPC/history)
    """
    data = await economy_service.get_history(symbol)
    if not data or not data.get("history"):
        raise HTTPException(status_code=404, detail=f"{symbol}의 히스토리 데이터를 찾을 수 없습니다.")
    return data
