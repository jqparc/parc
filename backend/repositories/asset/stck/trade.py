from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from models.assets import StockTrade


def get_stock_trade(
    db: Session,
    user_id: int,
    proc_date_value: date,
    item_code: str,
    transaction_code: str,
    seq: int,
) -> StockTrade | None:
    return (
        db.query(StockTrade)
        .filter(
            StockTrade.user_id == user_id,
            StockTrade.proc_date == proc_date_value,
            StockTrade.itms_code == item_code,
            StockTrade.trns_code == transaction_code,
            StockTrade.seq == seq,
        )
        .first()
    )


def get_next_trade_seq(
    db: Session,
    user_id: int,
    proc_date_value: date,
    item_code: str,
    transaction_code: str,
) -> int:
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


def get_stock_trades(
    db: Session,
    user_id: int,
    proc_date_value: date | None = None,
) -> list[StockTrade]:
    query = db.query(StockTrade).filter(StockTrade.user_id == user_id)
    if proc_date_value:
        query = query.filter(StockTrade.proc_date == proc_date_value)
    return (
        query
        .order_by(
            StockTrade.proc_date.desc(),
            StockTrade.itms_code.asc(),
            StockTrade.trns_code.asc(),
            StockTrade.seq.asc(),
        )
        .all()
    )


def get_stock_trade_history(
    db: Session,
    user_id: int,
    item_code: str,
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[StockTrade]:
    query = (
        db.query(StockTrade)
        .filter(
            StockTrade.user_id == user_id,
            StockTrade.itms_code == item_code[:20],
        )
    )
    if from_date:
        query = query.filter(StockTrade.proc_date >= from_date)
    if to_date:
        query = query.filter(StockTrade.proc_date <= to_date)
    return (
        query.order_by(
            StockTrade.proc_date.desc(),
            StockTrade.trns_code.asc(),
            StockTrade.seq.asc(),
        )
        .all()
    )


def get_stock_trade_lots(db: Session, user_id: int, item_code: str) -> list[StockTrade]:
    return (
        db.query(StockTrade)
        .filter(
            StockTrade.user_id == user_id,
            StockTrade.itms_code == item_code,
        )
        .order_by(StockTrade.proc_date.desc(), StockTrade.trns_code.asc(), StockTrade.seq.asc())
        .all()
    )


def get_stock_trades_for_date(db: Session, user_id: int, proc_date_value: date) -> list[StockTrade]:
    return (
        db.query(StockTrade)
        .filter(
            StockTrade.user_id == user_id,
            StockTrade.proc_date == proc_date_value,
        )
        .all()
    )


def add_stock_trade(db: Session, trade: StockTrade) -> StockTrade:
    db.add(trade)
    return trade


def delete_stock_trade(db: Session, trade: StockTrade) -> None:
    db.delete(trade)
