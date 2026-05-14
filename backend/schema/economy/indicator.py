from pydantic import BaseModel


class IndicatorSummary(BaseModel):
    symbol: str
    name: str
    unit: str
    current_value: float
    current_date: str
    previous_value: float
    previous_date: str
    change: float
    change_rate: float


class IndicatorSummaryResponse(BaseModel):
    summaries: list[IndicatorSummary]


class DailyHistory(BaseModel):
    date: str
    value: float


class IndicatorHistoryResponse(BaseModel):
    symbol: str
    history: list[DailyHistory]
