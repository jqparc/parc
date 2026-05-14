from collections import defaultdict
from datetime import date
from decimal import Decimal

from core.exception import bad_request, conflict, not_found
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from model.asset import StockMaster
from repository.asset.stck import item as item_repository
from repository.asset.stck import master as master_repository
from repository.asset.stck import trade as trade_repository
from repository.asset.stck import unit_of_work
from schema.asset.stck import (
    StockMasterCreate,
    StockMasterGenerateRequest,
    StockMasterResponse,
    StockMasterUpdate,
)
from service.asset.stck import key, response


def get_my_stock_master_or_404(master_key: str, db: Session, user_id: int) -> StockMaster:
    proc_date_value, item_code = key.parse_master_key(master_key)
    master = master_repository.get_stock_master(db, user_id, proc_date_value, item_code)
    if not master:
        raise not_found("Stock master not found.")
    return master


def apply_master_data(master: StockMaster, data: dict) -> None:
    master.proc_date = data["proc_date"]
    master.itms_code = data["itms_code"]
    master.shtg_code = data["shtg_code"]
    master.bzty_code = data.get("bzty_code")
    master.prdy_stcn = data["prdy_stcn"]
    master.incr_stcn = data["incr_stcn"]
    master.dcrs_stcn = data["dcrs_stcn"]
    master.prdy_acqs_amt = data["prdy_acqs_amt"]
    master.incr_acqs_amt = data["incr_acqs_amt"]
    master.dcrs_acqs_amt = data["dcrs_acqs_amt"]
    master.prls_amt = data["prls_amt"]
    master.vlamt = data["vlamt"]
    master.slby_prls_amt = data["slby_prls_amt"]


def build_stock_master_rows(db: Session, user_id: int, proc_date_value: date) -> list[StockMaster]:
    previous_date = master_repository.get_previous_stock_master_date(db, user_id, proc_date_value)
    previous_rows = []
    if previous_date:
        previous_rows = master_repository.get_stock_masters_for_date(db, user_id, previous_date)

    trades = trade_repository.get_stock_trades_for_date(db, user_id, proc_date_value)
    item_codes = {row.itms_code for row in previous_rows}
    item_codes.update(trade.itms_code for trade in trades)
    stock_items = item_repository.get_stock_item_map_for_date(db, list(item_codes), proc_date_value)

    previous_by_code = {row.itms_code: row for row in previous_rows}
    trade_totals = defaultdict(lambda: {
        "incr_stcn": 0,
        "dcrs_stcn": 0,
        "incr_acqs_amt": Decimal("0"),
        "dcrs_acqs_amt": Decimal("0"),
    })

    for trade in trades:
        totals = trade_totals[trade.itms_code]
        trade_amount = Decimal(trade.qnty) * trade.prc
        if trade.trns_code == "S":
            totals["dcrs_stcn"] += trade.qnty
            totals["dcrs_acqs_amt"] += trade_amount
        else:
            totals["incr_stcn"] += trade.qnty
            totals["incr_acqs_amt"] += trade_amount

    generated = []
    for item_code in sorted(item_codes):
        previous = previous_by_code.get(item_code)
        totals = trade_totals[item_code]
        stock_item = stock_items.get(item_code)

        prdy_stcn = previous.prdy_stcn + previous.incr_stcn - previous.dcrs_stcn if previous else 0
        prdy_acqs_amt = (
            previous.prdy_acqs_amt + previous.incr_acqs_amt - previous.dcrs_acqs_amt
            if previous
            else Decimal("0")
        )
        incr_stcn = totals["incr_stcn"]
        dcrs_stcn = totals["dcrs_stcn"]
        incr_acqs_amt = totals["incr_acqs_amt"]
        dcrs_acqs_amt = totals["dcrs_acqs_amt"]
        current_stcn = prdy_stcn + incr_stcn - dcrs_stcn
        if current_stcn < 0:
            raise bad_request(f"{item_code} holding quantity cannot be negative. Check previous holdings or sell quantity.")
        current_acqs_amt = prdy_acqs_amt + incr_acqs_amt - dcrs_acqs_amt
        if current_acqs_amt < 0:
            current_acqs_amt = Decimal("0")
        average_acqs_price = current_acqs_amt / Decimal(current_stcn) if current_stcn else Decimal("0")
        sell_base_quantity = prdy_stcn + incr_stcn
        sell_base_amount = prdy_acqs_amt + incr_acqs_amt
        sell_base_price = sell_base_amount / Decimal(sell_base_quantity) if sell_base_quantity else Decimal("0")
        slby_prls_amt = dcrs_acqs_amt - (sell_base_price * Decimal(dcrs_stcn))
        clpr = stock_item.clpr if stock_item and stock_item.clpr is not None else None
        prls_amt = (
            (clpr - average_acqs_price) * Decimal(current_stcn)
            if clpr is not None and current_stcn
            else Decimal("0")
        )
        vlamt = current_acqs_amt + prls_amt

        generated.append(
            StockMaster(
                user_id=user_id,
                proc_date=proc_date_value,
                itms_code=item_code,
                shtg_code=(
                    stock_item.shtg_code
                    if stock_item
                    else previous.shtg_code
                    if previous
                    else "A"
                ),
                bzty_code=(
                    stock_item.bzty_code
                    if stock_item
                    else previous.bzty_code
                    if previous
                    else None
                ),
                prdy_stcn=prdy_stcn,
                incr_stcn=incr_stcn,
                dcrs_stcn=dcrs_stcn,
                prdy_acqs_amt=prdy_acqs_amt,
                incr_acqs_amt=incr_acqs_amt,
                dcrs_acqs_amt=dcrs_acqs_amt,
                vlamt=vlamt,
                prls_amt=prls_amt,
                slby_prls_amt=slby_prls_amt,
            )
        )

    return generated


def list_my_stock_masters(
    db: Session,
    user_id: int,
    proc_date_value: date | None = None,
) -> list[StockMasterResponse]:
    target_date = proc_date_value or master_repository.get_latest_stock_master_date(db, user_id)
    masters = master_repository.get_stock_masters(db, user_id, target_date)
    item_map = item_repository.get_latest_stock_item_map(db, [master.itms_code for master in masters])
    return [response.build_master_response(master, item_map.get(master.itms_code)) for master in masters]


def generate_my_stock_masters(
    db: Session,
    user_id: int,
    generate_data: StockMasterGenerateRequest,
) -> list[StockMasterResponse]:
    generated = build_stock_master_rows(db, user_id, generate_data.proc_date)
    master_repository.replace_stock_masters_for_date(db, user_id, generate_data.proc_date, generated)
    unit_of_work.commit(db)
    for master in generated:
        unit_of_work.refresh(db, master)
    item_map = item_repository.get_latest_stock_item_map(db, [master.itms_code for master in generated])
    return [response.build_master_response(master, item_map.get(master.itms_code)) for master in generated]


def list_my_stock_master_history(
    db: Session,
    user_id: int,
    item_code: str,
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[StockMasterResponse]:
    masters = master_repository.get_stock_master_history(db, user_id, item_code, from_date, to_date)
    item_map = item_repository.get_latest_stock_item_map(db, [master.itms_code for master in masters])
    return [response.build_master_response(master, item_map.get(master.itms_code)) for master in masters]


def create_my_stock_master(
    db: Session,
    user_id: int,
    master_data: StockMasterCreate,
) -> StockMasterResponse:
    master = StockMaster(user_id=user_id, **master_data.model_dump())
    master_repository.add_stock_master(db, master)
    try:
        unit_of_work.commit(db)
    except IntegrityError:
        unit_of_work.rollback(db)
        raise conflict("Stock master already exists for this user/date/item.")
    unit_of_work.refresh(db, master)
    stock_item = item_repository.get_latest_stock_item_map(db, [master.itms_code]).get(master.itms_code)
    return response.build_master_response(master, stock_item)


def get_my_stock_master_detail(db: Session, user_id: int, master_key: str) -> StockMasterResponse:
    master = get_my_stock_master_or_404(master_key, db, user_id)
    stock_item = item_repository.get_latest_stock_item_map(db, [master.itms_code]).get(master.itms_code)
    return response.build_master_response(master, stock_item)


def update_my_stock_master(
    db: Session,
    user_id: int,
    master_key: str,
    master_data: StockMasterUpdate,
) -> StockMasterResponse:
    master = get_my_stock_master_or_404(master_key, db, user_id)
    apply_master_data(master, master_data.model_dump())
    try:
        unit_of_work.commit(db)
    except IntegrityError:
        unit_of_work.rollback(db)
        raise conflict("Stock master already exists for this user/date/item.")
    unit_of_work.refresh(db, master)
    stock_item = item_repository.get_latest_stock_item_map(db, [master.itms_code]).get(master.itms_code)
    return response.build_master_response(master, stock_item)


def delete_my_stock_master(db: Session, user_id: int, master_key: str) -> None:
    master = get_my_stock_master_or_404(master_key, db, user_id)
    master_repository.delete_stock_master(db, master)
    unit_of_work.commit(db)
