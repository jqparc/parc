from datetime import date
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from api.v1.dependencies.auth_deps import get_current_user
from db.database import get_db
from models.user_model import User
from schemas.asset.stck import StockTradeCreate, StockTradeResponse, StockTradeUpdate
from services.asset.stck import trade as stck_trade_service

router = APIRouter()


@router.get("/domestic-stocks", response_model=List[StockTradeResponse])
def get_my_domestic_stock_trades(
    proc_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return stck_trade_service.list_my_domestic_stock_trades(db, current_user.id, proc_date)


@router.post(
    "/domestic-stocks",
    response_model=StockTradeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_my_domestic_stock_trade(
    trade_data: StockTradeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return stck_trade_service.create_my_domestic_stock_trade(db, current_user.id, trade_data)


@router.get("/domestic-stocks/key/{trade_key}", response_model=StockTradeResponse)
def get_my_domestic_stock_trade_detail(
    trade_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return stck_trade_service.get_my_domestic_stock_trade_detail(db, current_user.id, trade_key)


@router.get("/domestic-stocks/item/{itms_code}", response_model=List[StockTradeResponse])
def get_my_domestic_stock_trade_history(
    itms_code: str,
    from_date: date | None = None,
    to_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return stck_trade_service.list_my_domestic_stock_trade_history(db, current_user.id, itms_code, from_date, to_date)


@router.put("/domestic-stocks/key/{trade_key}", response_model=StockTradeResponse)
def update_my_domestic_stock_trade(
    trade_key: str,
    trade_data: StockTradeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return stck_trade_service.update_my_domestic_stock_trade(db, current_user.id, trade_key, trade_data)


@router.get("/domestic-stocks/key/{trade_key}/lots", response_model=List[StockTradeResponse])
def get_my_domestic_stock_trade_lots(
    trade_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return stck_trade_service.list_my_domestic_stock_trade_lots(db, current_user.id, trade_key)


@router.delete("/domestic-stocks/key/{trade_key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_domestic_stock_trade(
    trade_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stck_trade_service.delete_my_domestic_stock_trade(db, current_user.id, trade_key)
    return None
