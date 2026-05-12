from datetime import date

from sqlalchemy.orm import Session, aliased

from models.assets import StockItem, StockMaster, StockTrade
from models.common_code_model import CommonCode


def get_stock_item(db: Session, proc_date_value: date, item_code: str) -> StockItem | None:
    return (
        db.query(StockItem)
        .filter(
            StockItem.proc_date == proc_date_value,
            StockItem.itms_code == item_code,
        )
        .first()
    )


def get_stock_items(db: Session) -> list[StockItem]:
    return db.query(StockItem).order_by(StockItem.proc_date.desc(), StockItem.itms_code.asc()).all()


def search_stock_items(
    db: Session,
    from_date: date | None = None,
    to_date: date | None = None,
    item_code: str | None = None,
):
    market_code = aliased(CommonCode)
    business_type_code = aliased(CommonCode)

    query = (
        db.query(
            StockItem,
            market_code.dtl_code_name.label("shtg_name"),
            business_type_code.dtl_code_name.label("bzty_name"),
        )
        .outerjoin(
            market_code,
            market_code.srch_gpcd.in_(["SHTG_DNCD", "shtg_dncd"])
            & (market_code.dtl_code == StockItem.shtg_code),
        )
        .outerjoin(
            business_type_code,
            business_type_code.srch_gpcd.in_(["BZTY_CODE", "BZTY_DNCD", "bzty_code"])
            & (business_type_code.dtl_code == StockItem.bzty_code),
        )
    )

    if from_date:
        query = query.filter(StockItem.proc_date >= from_date)
    if to_date:
        query = query.filter(StockItem.proc_date <= to_date)
    if item_code and item_code != "전체":
        query = query.filter(StockItem.itms_code == item_code)

    return query.order_by(StockItem.proc_date.desc(), StockItem.itms_code.asc()).all()


def add_stock_item(db: Session, item: StockItem) -> StockItem:
    db.add(item)
    return item


def delete_stock_item(db: Session, item: StockItem) -> None:
    db.delete(item)


def get_latest_stock_item_map(db: Session, item_codes: list[str]) -> dict[str, StockItem]:
    if not item_codes:
        return {}
    items = (
        db.query(StockItem)
        .filter(StockItem.itms_code.in_(set(item_codes)))
        .order_by(
            StockItem.itms_code.asc(),
            StockItem.proc_date.desc(),
        )
        .all()
    )
    item_map = {}
    for stock_item in items:
        item_map.setdefault(stock_item.itms_code, stock_item)
    return item_map


def get_stock_item_map_for_date(db: Session, item_codes: list[str], proc_date_value: date) -> dict[str, StockItem]:
    if not item_codes:
        return {}
    items = (
        db.query(StockItem)
        .filter(
            StockItem.itms_code.in_(set(item_codes)),
            StockItem.proc_date <= proc_date_value,
        )
        .order_by(
            StockItem.itms_code.asc(),
            StockItem.proc_date.desc(),
        )
        .all()
    )
    item_map = {}
    for stock_item in items:
        item_map.setdefault(stock_item.itms_code, stock_item)
    return item_map


def get_stock_item_source_codes(db: Session, user_id: int, proc_date_value: date) -> list[str]:
    trade_codes = (
        db.query(StockTrade.itms_code)
        .filter(
            StockTrade.user_id == user_id,
            StockTrade.proc_date <= proc_date_value,
        )
        .distinct()
        .all()
    )
    master_codes = (
        db.query(StockMaster.itms_code)
        .filter(
            StockMaster.user_id == user_id,
            StockMaster.proc_date < proc_date_value,
        )
        .distinct()
        .all()
    )
    return sorted({row[0] for row in trade_codes + master_codes if row[0]})
