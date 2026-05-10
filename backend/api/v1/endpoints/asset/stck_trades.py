from datetime import date
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from api.v1.dependencies.auth_deps import get_current_user
from db.database import get_db
from models.assets import StockItem, StockTrade
from models.user_model import User
from schemas.asset_schema import StockTradeCreate, StockTradeResponse, StockTradeUpdate
from services.stck_service import resolve_current_price

from .stck_utils import get_stock_item_map, make_trade_key, parse_trade_key

router = APIRouter()


def get_my_stock_trade_or_404(trade_key: str, db: Session, current_user: User) -> StockTrade:
    proc_date_value, item_code, transaction_code, seq = parse_trade_key(trade_key)
    trade = (
        db.query(StockTrade)
        .filter(
            StockTrade.user_id == current_user.id,
            StockTrade.proc_date == proc_date_value,
            StockTrade.itms_code == item_code,
            StockTrade.trns_code == transaction_code,
            StockTrade.seq == seq,
        )
        .first()
    )
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found.")
    return trade


def get_next_trade_seq(db: Session, user_id: int, proc_date_value, item_code: str, transaction_code: str) -> int:
    max_seq = (
        db.query(func.max(StockTrade.seq))
        .filter(
            StockTrade.user_id == user_id,
            StockTrade.proc_date == proc_date_value,
            StockTrade.itms_code == item_code,
            StockTrade.trns_code == transaction_code,
        )
        .scalar()
    )
    return (max_seq or 0) + 1


def build_trade_response(trade: StockTrade, stock_item: StockItem | None = None) -> StockTradeResponse:
    invested_amount = Decimal(trade.qnty) * trade.prc
    valuation_amount = None
    profit_loss = None
    profit_rate = None
    item_name = stock_item.itms_name if stock_item else None
    current_price = resolve_current_price(item_name or trade.itms_code, trade.itms_code)[2]

    if current_price is not None:
        valuation_amount = Decimal(trade.qnty) * current_price
        profit_loss = valuation_amount - invested_amount
        if invested_amount:
            profit_rate = (profit_loss / invested_amount) * Decimal("100")

    data = {
        "user_id": trade.user_id,
        "trade_key": make_trade_key(trade.proc_date, trade.itms_code, trade.trns_code, trade.seq),
        "proc_date": trade.proc_date,
        "itms_code": trade.itms_code,
        "itms_name": item_name,
        "shtg_code": stock_item.shtg_code if stock_item else None,
        "bzty_code": stock_item.bzty_code if stock_item else None,
        "trns_code": trade.trns_code,
        "seq": trade.seq,
        "qnty": trade.qnty,
        "prc": trade.prc,
        "current_price": current_price,
        "created_at": trade.created_at,
        "updated_at": trade.updated_at,
        "invested_amount": invested_amount,
        "valuation_amount": valuation_amount,
        "profit_loss": profit_loss,
        "profit_rate": profit_rate,
    }
    return StockTradeResponse(**data)


@router.get("/domestic-stocks", response_model=List[StockTradeResponse])
def get_my_domestic_stock_trades(
    proc_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(StockTrade).filter(StockTrade.user_id == current_user.id)
    if proc_date:
        query = query.filter(StockTrade.proc_date == proc_date)

    trades = (
        query
        .order_by(
            StockTrade.proc_date.desc(),
            StockTrade.itms_code.asc(),
            StockTrade.trns_code.asc(),
            StockTrade.seq.asc(),
        )
        .all()
    )

    item_map = get_stock_item_map(db, [trade.itms_code for trade in trades])
    return [build_trade_response(trade, item_map.get(trade.itms_code)) for trade in trades]


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
    data = trade_data.model_dump()
    data["itms_code"] = data["itms_code"][:20]
    stock_item = db.query(StockItem).filter(StockItem.itms_code == data["itms_code"]).first()
    seq = get_next_trade_seq(db, current_user.id, data["proc_date"], data["itms_code"], data["trns_code"])

    trade = StockTrade(
        user_id=current_user.id,
        seq=seq,
        **data,
    )
    db.add(trade)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Trade already exists for this user/date/item/type/sequence.")
    db.refresh(trade)
    return build_trade_response(trade, stock_item)


@router.get("/domestic-stocks/key/{trade_key}", response_model=StockTradeResponse)
def get_my_domestic_stock_trade_detail(
    trade_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trade = get_my_stock_trade_or_404(trade_key, db, current_user)
    stock_item = db.query(StockItem).filter(StockItem.itms_code == trade.itms_code).first()
    return build_trade_response(trade, stock_item)


@router.get("/domestic-stocks/item/{itms_code}", response_model=List[StockTradeResponse])
def get_my_domestic_stock_trade_history(
    itms_code: str,
    from_date: date | None = None,
    to_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(StockTrade)
        .filter(
            StockTrade.user_id == current_user.id,
            StockTrade.itms_code == itms_code[:20],
        )
    )
    if from_date:
        query = query.filter(StockTrade.proc_date >= from_date)
    if to_date:
        query = query.filter(StockTrade.proc_date <= to_date)

    trades = (
        query.order_by(
            StockTrade.proc_date.desc(),
            StockTrade.trns_code.asc(),
            StockTrade.seq.asc(),
        )
        .all()
    )
    item_map = get_stock_item_map(db, [trade.itms_code for trade in trades])
    return [build_trade_response(trade, item_map.get(trade.itms_code)) for trade in trades]


@router.put("/domestic-stocks/key/{trade_key}", response_model=StockTradeResponse)
def update_my_domestic_stock_trade(
    trade_key: str,
    trade_data: StockTradeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trade = get_my_stock_trade_or_404(trade_key, db, current_user)

    data = trade_data.model_dump()
    stock_item = db.query(StockItem).filter(StockItem.itms_code == data["itms_code"]).first()
    trade.trns_code = data["trns_code"]
    trade.qnty = data["qnty"]
    trade.prc = data["prc"]
    trade.proc_date = data["proc_date"]
    trade.itms_code = data["itms_code"][:20]

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Trade already exists for this user/date/item/type/sequence.")
    db.refresh(trade)
    return build_trade_response(trade, stock_item)


@router.get("/domestic-stocks/key/{trade_key}/lots", response_model=List[StockTradeResponse])
def get_my_domestic_stock_trade_lots(
    trade_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    selected = get_my_stock_trade_or_404(trade_key, db, current_user)

    trades = (
        db.query(StockTrade)
        .filter(
            StockTrade.user_id == current_user.id,
            StockTrade.itms_code == selected.itms_code,
        )
        .order_by(StockTrade.proc_date.desc(), StockTrade.trns_code.asc(), StockTrade.seq.asc())
        .all()
    )

    item_map = get_stock_item_map(db, [trade.itms_code for trade in trades])
    return [build_trade_response(trade, item_map.get(trade.itms_code)) for trade in trades]


@router.delete("/domestic-stocks/key/{trade_key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_domestic_stock_trade(
    trade_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trade = get_my_stock_trade_or_404(trade_key, db, current_user)

    db.delete(trade)
    db.commit()
    return None
