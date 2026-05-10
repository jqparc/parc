from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class StockTradeBase(BaseModel):
    proc_date: date
    itms_code: str = Field(..., min_length=1, max_length=20)
    trns_code: Literal["B", "S"] = "B"
    qnty: int = Field(..., gt=0)
    prc: Decimal = Field(..., ge=0, validation_alias=AliasChoices("prc", "prcn", "price"))


class StockTradeCreate(BaseModel):
    trns_code: Literal["B", "S"] = Field("B", validation_alias=AliasChoices("trns_code", "trade_type"))
    qnty: int = Field(..., gt=0, validation_alias=AliasChoices("qnty", "quantity"))
    prc: Decimal = Field(..., ge=0, validation_alias=AliasChoices("prc", "prcn", "price"))
    proc_date: date
    itms_code: str = Field(..., min_length=1, max_length=20, validation_alias=AliasChoices("itms_code", "stock_code"))


class StockTradeUpdate(BaseModel):
    trns_code: Literal["B", "S"] = Field("B", validation_alias=AliasChoices("trns_code", "trade_type"))
    qnty: int = Field(..., gt=0, validation_alias=AliasChoices("qnty", "quantity"))
    prc: Decimal = Field(..., ge=0, validation_alias=AliasChoices("prc", "prcn", "price"))
    proc_date: date
    itms_code: str = Field(..., min_length=1, max_length=20, validation_alias=AliasChoices("itms_code", "stock_code"))


class StockTradeResponse(StockTradeBase):
    user_id: int
    trade_key: str
    seq: int
    itms_name: Optional[str] = None
    shtg_code: Optional[Literal["A", "B", "C"]] = None
    bzty_code: Optional[str] = None
    current_price: Optional[Decimal] = None
    invested_amount: Decimal
    valuation_amount: Optional[Decimal] = None
    profit_loss: Optional[Decimal] = None
    profit_rate: Optional[Decimal] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StockItemBase(BaseModel):
    proc_date: date
    itms_code: str = Field(..., min_length=1, max_length=20)
    itms_name: str = Field(..., min_length=1, max_length=100)
    shtg_code: Literal["A", "B", "C"] = "A"
    bzty_code: Optional[str] = Field(None, min_length=3, max_length=3, pattern=r"^\d{3}$")
    clpr: Optional[Decimal] = Field(None, ge=0, validation_alias=AliasChoices("clpr", "prc", "price"))


class StockItemCreate(StockItemBase):
    pass


class StockItemUpdate(StockItemBase):
    pass


class StockItemResponse(StockItemBase):
    item_key: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StockMasterBase(BaseModel):
    proc_date: date
    itms_code: str = Field(..., min_length=1, max_length=20)
    shtg_code: Literal["A", "B", "C"] = "A"
    bzty_code: Optional[str] = Field(None, min_length=3, max_length=3, pattern=r"^\d{3}$")
    prdy_stcn: int = Field(default=0, ge=0)
    incr_stcn: int = Field(default=0, ge=0)
    dcrs_stcn: int = Field(default=0, ge=0)
    prdy_acqs_amt: Decimal = Field(default=Decimal("0"), ge=0)
    incr_acqs_amt: Decimal = Field(default=Decimal("0"), ge=0)
    dcrs_acqs_amt: Decimal = Field(default=Decimal("0"), ge=0)
    prls_amt: Decimal = Decimal("0")
    vlamt: Decimal = Field(default=Decimal("0"), ge=0)
    slby_prls_amt: Decimal = Decimal("0")


class StockMasterCreate(StockMasterBase):
    pass


class StockMasterUpdate(StockMasterBase):
    pass


class StockMasterResponse(StockMasterBase):
    user_id: int
    master_key: str
    itms_name: Optional[str] = None
    proc_date_text: str
    holding_quantity: int
    acquisition_amount: Decimal
    valuation_amount: Decimal
    profit_loss_amount: Decimal
    profit_rate: Decimal
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StockMasterGenerateRequest(BaseModel):
    proc_date: date
