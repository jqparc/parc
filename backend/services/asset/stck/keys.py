from datetime import date
from urllib.parse import unquote

from core.exceptions import bad_request


def make_trade_key(proc_date_value: date, item_code: str, transaction_code: str, seq: int) -> str:
    return f"{proc_date_value.isoformat()}|{item_code}|{transaction_code}|{seq}"


def make_item_key(proc_date_value: date, item_code: str) -> str:
    return f"{proc_date_value.isoformat()}|{item_code}"


def make_master_key(proc_date_value: date, item_code: str) -> str:
    return f"{proc_date_value.isoformat()}|{item_code}"


def parse_master_key(master_key: str) -> tuple[date, str]:
    parts = unquote(master_key).split("|")
    if len(parts) != 2:
        raise bad_request("Invalid stock master key.")
    proc_date_value, item_code = parts
    try:
        parsed_date = date.fromisoformat(proc_date_value)
    except ValueError:
        raise bad_request("Invalid stock master date.")
    return parsed_date, item_code


def parse_item_key(item_key: str) -> tuple[date, str]:
    parts = unquote(item_key).split("|")
    if len(parts) != 2:
        raise bad_request("Invalid stock item key.")
    proc_date_value, item_code = parts
    try:
        parsed_date = date.fromisoformat(proc_date_value)
    except ValueError:
        raise bad_request("Invalid stock item date.")
    return parsed_date, item_code


def parse_trade_key(trade_key: str) -> tuple[date, str, str, int]:
    parts = unquote(trade_key).split("|")
    if len(parts) != 4:
        raise bad_request("Invalid trade key.")
    proc_date_value, item_code, transaction_code, seq_value = parts
    if transaction_code not in {"B", "S"}:
        raise bad_request("Invalid trade transaction code.")
    try:
        parsed_date = date.fromisoformat(proc_date_value)
    except ValueError:
        raise bad_request("Invalid trade date.")
    try:
        seq = int(seq_value)
    except ValueError:
        raise bad_request("Invalid trade sequence.")
    if seq < 1:
        raise bad_request("Invalid trade sequence.")
    return parsed_date, item_code, transaction_code, seq


def normalize_bzty_code(value: str | None) -> str | None:
    if not value:
        return None
    code = value.strip()
    return code if code.isdigit() and len(code) == 3 else None
