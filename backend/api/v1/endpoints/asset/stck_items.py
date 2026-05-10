from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from api.v1.dependencies.auth_deps import get_current_user
from db.database import get_db
from models.assets import StockItem, StockMaster, StockTrade
from models.user_model import User
from schemas.asset_schema import (
    StockItemCreate,
    StockItemResponse,
    StockItemUpdate,
    StockMasterGenerateRequest,
)
from services.stck_service import resolve_stock_item_snapshot

from .stck_utils import (
    get_stock_item_map_for_date,
    make_item_key,
    normalize_bzty_code,
    parse_item_key,
)

router = APIRouter()


def get_stock_item_or_404(item_key: str, db: Session) -> StockItem:
    proc_date_value, item_code = parse_item_key(item_key)
    item = (
        db.query(StockItem)
        .filter(
            StockItem.proc_date == proc_date_value,
            StockItem.itms_code == item_code,
        )
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Stock item not found.")
    return item


def build_stock_item_response(item: StockItem) -> StockItemResponse:
    data = {
        "item_key": make_item_key(item.proc_date, item.itms_code),
        "proc_date": item.proc_date,
        "itms_code": item.itms_code,
        "itms_name": item.itms_name,
        "shtg_code": item.shtg_code,
        "bzty_code": item.bzty_code,
        "clpr": item.clpr,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }
    return StockItemResponse(**data)


def apply_stock_item_data(item: StockItem, data: dict) -> None:
    item.proc_date = data.get("proc_date")
    item.itms_code = data["itms_code"]
    item.itms_name = data["itms_name"]
    item.shtg_code = data["shtg_code"]
    item.bzty_code = normalize_bzty_code(data.get("bzty_code"))
    item.clpr = data.get("clpr")


def get_stock_item_source_codes(db: Session, user_id: int, proc_date: date) -> list[str]:
    trade_codes = (
        db.query(StockTrade.itms_code)
        .filter(
            StockTrade.user_id == user_id,
            StockTrade.proc_date <= proc_date,
        )
        .distinct()
        .all()
    )
    master_codes = (
        db.query(StockMaster.itms_code)
        .filter(
            StockMaster.user_id == user_id,
            StockMaster.proc_date < proc_date,
        )
        .distinct()
        .all()
    )
    return sorted({row[0] for row in trade_codes + master_codes if row[0]})


def generate_stock_items_for_date(db: Session, user_id: int, proc_date: date) -> list[StockItem]:
    item_codes = get_stock_item_source_codes(db, user_id, proc_date)
    if not item_codes:
        return []

    previous_items = get_stock_item_map_for_date(db, item_codes, proc_date)
    generated = []

    for item_code in item_codes:
        previous_item = previous_items.get(item_code)
        name, market_code, _, price = resolve_stock_item_snapshot(
            item_code,
            previous_item.itms_name if previous_item else None,
        )
        item = (
            db.query(StockItem)
            .filter(
                StockItem.itms_code == item_code,
                StockItem.proc_date == proc_date,
            )
            .first()
        )
        if not item:
            item = StockItem(itms_code=item_code, proc_date=proc_date)
            db.add(item)

        item.itms_name = name or (previous_item.itms_name if previous_item else item_code)
        item.shtg_code = market_code or (previous_item.shtg_code if previous_item else "A")
        item.bzty_code = None
        item.clpr = price if price is not None else (previous_item.clpr if previous_item else None)
        generated.append(item)

    return generated


@router.get("/stock-items", response_model=List[StockItemResponse])
def get_stock_items(db: Session = Depends(get_db)):
    items = db.query(StockItem).order_by(StockItem.proc_date.desc(), StockItem.itms_code.asc()).all()
    return [build_stock_item_response(item) for item in items]


@router.post("/stock-items", response_model=StockItemResponse, status_code=status.HTTP_201_CREATED)
def create_stock_item(item_data: StockItemCreate, db: Session = Depends(get_db)):
    item = StockItem(**item_data.model_dump())
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Stock item already exists for this date/code.")
    db.refresh(item)
    return build_stock_item_response(item)


@router.post("/stock-items/generate", response_model=List[StockItemResponse])
def generate_my_stock_items(
    generate_data: StockMasterGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    generated = generate_stock_items_for_date(db, current_user.id, generate_data.proc_date)
    db.commit()
    for item in generated:
        db.refresh(item)
    return [build_stock_item_response(item) for item in generated]


@router.get("/stock-items/key/{item_key}", response_model=StockItemResponse)
def get_stock_item(item_key: str, db: Session = Depends(get_db)):
    return build_stock_item_response(get_stock_item_or_404(item_key, db))


@router.put("/stock-items/key/{item_key}", response_model=StockItemResponse)
def update_stock_item(item_key: str, item_data: StockItemUpdate, db: Session = Depends(get_db)):
    item = get_stock_item_or_404(item_key, db)
    apply_stock_item_data(item, item_data.model_dump())
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Stock item already exists for this date/code.")
    db.refresh(item)
    return build_stock_item_response(item)


@router.delete("/stock-items/key/{item_key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stock_item(item_key: str, db: Session = Depends(get_db)):
    item = get_stock_item_or_404(item_key, db)
    db.delete(item)
    db.commit()
    return None
