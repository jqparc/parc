from datetime import date

from core.exceptions import conflict, not_found
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.assets import StockItem
from repositories.asset.stck import item as item_repository
from repositories.asset.stck import unit_of_work
from schemas.asset.stck import (
    StockItemCreate,
    StockItemResponse,
    StockItemSearchResponse,
    StockItemUpdate,
    StockMasterGenerateRequest,
)
from services.asset.stck import keys, responses
from services.asset.stck.market_data import resolve_stock_item_snapshot


def get_stock_item_or_404(item_key: str, db: Session) -> StockItem:
    proc_date_value, item_code = keys.parse_item_key(item_key)
    item = item_repository.get_stock_item(db, proc_date_value, item_code)
    if not item:
        raise not_found("Stock item not found.")
    return item


def apply_stock_item_data(item: StockItem, data: dict) -> None:
    item.proc_date = data.get("proc_date")
    item.itms_code = data["itms_code"]
    item.itms_name = data["itms_name"]
    item.shtg_code = data["shtg_code"]
    item.bzty_code = keys.normalize_bzty_code(data.get("bzty_code"))
    item.clpr = data.get("clpr")


def list_stock_items(db: Session) -> list[StockItemResponse]:
    return [responses.build_stock_item_response(item) for item in item_repository.get_stock_items(db)]


def search_stock_items(
    db: Session,
    from_date: date | None = None,
    to_date: date | None = None,
    item_code: str | None = None,
) -> list[StockItemSearchResponse]:
    rows = item_repository.search_stock_items(db, from_date, to_date, item_code)
    return [
        responses.build_stock_item_search_response(item, shtg_name, bzty_name)
        for item, shtg_name, bzty_name in rows
    ]


def create_stock_item(db: Session, item_data: StockItemCreate) -> StockItemResponse:
    item = StockItem(**item_data.model_dump())
    item_repository.add_stock_item(db, item)
    try:
        unit_of_work.commit(db)
    except IntegrityError:
        unit_of_work.rollback(db)
        raise conflict("Stock item already exists for this date/code.")
    unit_of_work.refresh(db, item)
    return responses.build_stock_item_response(item)


def generate_stock_items_for_date(db: Session, user_id: int, proc_date_value: date) -> list[StockItem]:
    item_codes = item_repository.get_stock_item_source_codes(db, user_id, proc_date_value)
    if not item_codes:
        return []

    previous_items = item_repository.get_stock_item_map_for_date(db, item_codes, proc_date_value)
    generated = []

    for item_code in item_codes:
        previous_item = previous_items.get(item_code)
        name, market_code, _, price = resolve_stock_item_snapshot(
            item_code,
            previous_item.itms_name if previous_item else None,
            proc_date_value,
        )
        item = item_repository.get_stock_item(db, proc_date_value, item_code)
        if not item:
            item = StockItem(itms_code=item_code, proc_date=proc_date_value)
            item_repository.add_stock_item(db, item)

        item.itms_name = name or (previous_item.itms_name if previous_item else item_code)
        item.shtg_code = market_code or (previous_item.shtg_code if previous_item else "A")
        item.bzty_code = None
        if price is not None:
            item.clpr = price
        elif previous_item and proc_date_value >= date.today():
            item.clpr = previous_item.clpr
        else:
            item.clpr = None
        generated.append(item)

    return generated


def generate_my_stock_items(
    db: Session,
    user_id: int,
    generate_data: StockMasterGenerateRequest,
) -> list[StockItemResponse]:
    generated = generate_stock_items_for_date(db, user_id, generate_data.proc_date)
    unit_of_work.commit(db)
    for item in generated:
        unit_of_work.refresh(db, item)
    return [responses.build_stock_item_response(item) for item in generated]


def get_stock_item_detail(db: Session, item_key: str) -> StockItemResponse:
    return responses.build_stock_item_response(get_stock_item_or_404(item_key, db))


def update_stock_item(db: Session, item_key: str, item_data: StockItemUpdate) -> StockItemResponse:
    item = get_stock_item_or_404(item_key, db)
    apply_stock_item_data(item, item_data.model_dump())
    try:
        unit_of_work.commit(db)
    except IntegrityError:
        unit_of_work.rollback(db)
        raise conflict("Stock item already exists for this date/code.")
    unit_of_work.refresh(db, item)
    return responses.build_stock_item_response(item)


def delete_stock_item(db: Session, item_key: str) -> None:
    item = get_stock_item_or_404(item_key, db)
    item_repository.delete_stock_item(db, item)
    unit_of_work.commit(db)
