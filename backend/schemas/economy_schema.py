# backend/schemas/economy_schema.py
from pydantic import BaseModel
from typing import List

# --- 1. 표(Table) 용도 스키마 ---
class IndicatorSummary(BaseModel):
    symbol: str                 # 티커 (예: ^GSPC, ^KS200)
    name: str                   # 표시명 (예: S&P 500, KOSPI 200)
    unit: str                   # 단위 (예: pt, KRW)
    current_value: float        # 최근 영업일 종가
    current_date: str           # 최근 영업일 날짜 (YYYY-MM-DD)
    previous_value: float       # 전 영업일 종가
    previous_date: str          # 전 영업일 날짜 (YYYY-MM-DD)
    change: float               # 등락폭
    change_rate: float          # 등락률 (%)

class IndicatorSummaryResponse(BaseModel):
    summaries: List[IndicatorSummary]

# --- 2. 그래프(Chart) 용도 스키마 ---
class DailyHistory(BaseModel):
    date: str          
    value: float       

class IndicatorHistoryResponse(BaseModel):
    symbol: str
    history: List[DailyHistory]