from datetime import date
from urllib.parse import unquote

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.assets import StockItem


def make_trade_key(proc_date: date, item_code: str, transaction_code: str, seq: int) -> str:
    return f"{proc_date.isoformat()}|{item_code}|{transaction_code}|{seq}"


def make_item_key(proc_date: date, item_code: str) -> str:
    return f"{proc_date.isoformat()}|{item_code}"


def make_master_key(proc_date: date, item_code: str) -> str:
    return f"{proc_date.isoformat()}|{item_code}"


def parse_master_key(master_key: str) -> tuple[date, str]:
    parts = unquote(master_key).split("|")
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid stock master key.")
    proc_date_value, item_code = parts
    try:
        parsed_date = date.fromisoformat(proc_date_value)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid stock master date.")
    return parsed_date, item_code


def parse_item_key(item_key: str) -> tuple[date, str]:
    parts = unquote(item_key).split("|")
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid stock item key.")
    proc_date_value, item_code = parts
    try:
        parsed_date = date.fromisoformat(proc_date_value)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid stock item date.")
    return parsed_date, item_code


def parse_trade_key(trade_key: str) -> tuple[date, str, str, int]:
    parts = unquote(trade_key).split("|")
    if len(parts) != 4:
        raise HTTPException(status_code=400, detail="Invalid trade key.")
    proc_date_value, item_code, transaction_code, seq_value = parts
    if transaction_code not in {"B", "S"}:
        raise HTTPException(status_code=400, detail="Invalid trade transaction code.")
    try:
        parsed_date = date.fromisoformat(proc_date_value)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid trade date.")
    try:
        seq = int(seq_value)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid trade sequence.")
    if seq < 1:
        raise HTTPException(status_code=400, detail="Invalid trade sequence.")
    return parsed_date, item_code, transaction_code, seq


def get_stock_item_map(db: Session, item_codes: list[str]) -> dict[str, StockItem]:
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
    for item in items:
        item_map.setdefault(item.itms_code, item)
    return item_map


def get_stock_item_map_for_date(db: Session, item_codes: list[str], proc_date: date) -> dict[str, StockItem]:
    if not item_codes:
        return {}
    items = (
        db.query(StockItem)
        .filter(
            StockItem.itms_code.in_(set(item_codes)),
            StockItem.proc_date <= proc_date,
        )
        .order_by(
            StockItem.itms_code.asc(),
            StockItem.proc_date.desc(),
        )
        .all()
    )
    item_map = {}
    for item in items:
        item_map.setdefault(item.itms_code, item)
    return item_map


def normalize_bzty_code(value: str | None) -> str | None:
    if not value:
        return None
    code = value.strip()
    return code if code.isdigit() and len(code) == 3 else None
