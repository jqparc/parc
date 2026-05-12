from datetime import date

from core.exceptions import conflict, not_found
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.assets import StockTrade
from repositories.asset.stck import item as item_repository
from repositories.asset.stck import trade as trade_repository
from repositories.asset.stck import unit_of_work
from schemas.asset.stck import StockTradeCreate, StockTradeResponse, StockTradeUpdate
from services.asset.stck import keys, responses


def get_my_stock_trade_or_404(trade_key: str, db: Session, user_id: int) -> StockTrade:
    proc_date_value, item_code, transaction_code, seq = keys.parse_trade_key(trade_key)
    trade = trade_repository.get_stock_trade(db, user_id, proc_date_value, item_code, transaction_code, seq)
    if not trade:
        raise not_found("Trade not found.")
    return trade


def list_my_domestic_stock_trades(
    db: Session,
    user_id: int,
    proc_date_value: date | None = None,
) -> list[StockTradeResponse]:
    trades = trade_repository.get_stock_trades(db, user_id, proc_date_value)
    item_map = item_repository.get_latest_stock_item_map(db, [trade.itms_code for trade in trades])
    return [responses.build_trade_response(trade, item_map.get(trade.itms_code)) for trade in trades]


def create_my_domestic_stock_trade(
    db: Session,
    user_id: int,
    trade_data: StockTradeCreate,
) -> StockTradeResponse:
    data = trade_data.model_dump()
    data["itms_code"] = data["itms_code"][:20]
    stock_item = item_repository.get_latest_stock_item_map(db, [data["itms_code"]]).get(data["itms_code"])
    seq = trade_repository.get_next_trade_seq(db, user_id, data["proc_date"], data["itms_code"], data["trns_code"])

    trade = StockTrade(user_id=user_id, seq=seq, **data)
    trade_repository.add_stock_trade(db, trade)
    try:
        unit_of_work.commit(db)
    except IntegrityError:
        unit_of_work.rollback(db)
        raise conflict("Trade already exists for this user/date/item/type/sequence.")
    unit_of_work.refresh(db, trade)
    return responses.build_trade_response(trade, stock_item)


def get_my_domestic_stock_trade_detail(db: Session, user_id: int, trade_key: str) -> StockTradeResponse:
    trade = get_my_stock_trade_or_404(trade_key, db, user_id)
    stock_item = item_repository.get_latest_stock_item_map(db, [trade.itms_code]).get(trade.itms_code)
    return responses.build_trade_response(trade, stock_item)


def list_my_domestic_stock_trade_history(
    db: Session,
    user_id: int,
    item_code: str,
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[StockTradeResponse]:
    trades = trade_repository.get_stock_trade_history(db, user_id, item_code, from_date, to_date)
    item_map = item_repository.get_latest_stock_item_map(db, [trade.itms_code for trade in trades])
    return [responses.build_trade_response(trade, item_map.get(trade.itms_code)) for trade in trades]


def update_my_domestic_stock_trade(
    db: Session,
    user_id: int,
    trade_key: str,
    trade_data: StockTradeUpdate,
) -> StockTradeResponse:
    trade = get_my_stock_trade_or_404(trade_key, db, user_id)
    data = trade_data.model_dump()
    data["itms_code"] = data["itms_code"][:20]
    stock_item = item_repository.get_latest_stock_item_map(db, [data["itms_code"]]).get(data["itms_code"])
    trade.trns_code = data["trns_code"]
    trade.qnty = data["qnty"]
    trade.prc = data["prc"]
    trade.proc_date = data["proc_date"]
    trade.itms_code = data["itms_code"]

    try:
        unit_of_work.commit(db)
    except IntegrityError:
        unit_of_work.rollback(db)
        raise conflict("Trade already exists for this user/date/item/type/sequence.")
    unit_of_work.refresh(db, trade)
    return responses.build_trade_response(trade, stock_item)


def list_my_domestic_stock_trade_lots(db: Session, user_id: int, trade_key: str) -> list[StockTradeResponse]:
    selected = get_my_stock_trade_or_404(trade_key, db, user_id)
    trades = trade_repository.get_stock_trade_lots(db, user_id, selected.itms_code)
    item_map = item_repository.get_latest_stock_item_map(db, [trade.itms_code for trade in trades])
    return [responses.build_trade_response(trade, item_map.get(trade.itms_code)) for trade in trades]


def delete_my_domestic_stock_trade(db: Session, user_id: int, trade_key: str) -> None:
    trade = get_my_stock_trade_or_404(trade_key, db, user_id)
    trade_repository.delete_stock_trade(db, trade)
    unit_of_work.commit(db)
