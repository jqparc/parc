from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class DomesticStockHoldingBase(BaseModel):
    stock_code: str = Field(..., min_length=1, max_length=20)
    stock_name: str = Field(..., min_length=1, max_length=100)
    market: str = Field(default="KOSPI", max_length=20)
    quantity: int = Field(..., gt=0)
    purchase_price: Decimal = Field(..., ge=0)
    purchase_date: date
    current_price: Optional[Decimal] = Field(None, ge=0)
    memo: Optional[str] = None


class DomesticStockHoldingCreate(DomesticStockHoldingBase):
    pass


class DomesticStockHoldingResponse(DomesticStockHoldingBase):
    id: int
    owner_id: int
    invested_amount: Decimal
    valuation_amount: Optional[Decimal] = None
    profit_loss: Optional[Decimal] = None
    profit_rate: Optional[Decimal] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
