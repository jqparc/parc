from collections import defaultdict
from datetime import date
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from api.v1.dependencies.auth_deps import get_current_user
from db.database import get_db
from models.assets import StockItem, StockMaster, StockTrade
from models.user_model import User
from schemas.asset_schema import (
    StockMasterCreate,
    StockMasterGenerateRequest,
    StockMasterResponse,
    StockMasterUpdate,
)

from .stck_utils import (
    get_stock_item_map,
    get_stock_item_map_for_date,
    make_master_key,
    parse_master_key,
)

router = APIRouter()


def get_my_stock_master_or_404(master_key: str, db: Session, current_user: User) -> StockMaster:
    proc_date_value, item_code = parse_master_key(master_key)
    master = (
        db.query(StockMaster)
        .filter(
            StockMaster.user_id == current_user.id,
            StockMaster.proc_date == proc_date_value,
            StockMaster.itms_code == item_code,
        )
        .first()
    )
    if not master:
        raise HTTPException(status_code=404, detail="Stock master not found.")
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


def build_master_response(master: StockMaster, stock_item: StockItem | None = None) -> StockMasterResponse:
    holding_quantity = master.prdy_stcn + master.incr_stcn - master.dcrs_stcn
    acquisition_amount = master.prdy_acqs_amt + master.incr_acqs_amt - master.dcrs_acqs_amt
    valuation_amount = master.vlamt
    profit_loss_amount = master.prls_amt
    profit_rate = (
        (profit_loss_amount / valuation_amount) * Decimal("100")
        if valuation_amount
        else Decimal("0")
    )
    data = {
        "user_id": master.user_id,
        "master_key": make_master_key(master.proc_date, master.itms_code),
        "proc_date": master.proc_date,
        "proc_date_text": master.proc_date.strftime("%Y.%m.%d"),
        "itms_code": master.itms_code,
        "itms_name": stock_item.itms_name if stock_item else None,
        "shtg_code": master.shtg_code,
        "bzty_code": master.bzty_code,
        "prdy_stcn": master.prdy_stcn,
        "incr_stcn": master.incr_stcn,
        "dcrs_stcn": master.dcrs_stcn,
        "prdy_acqs_amt": master.prdy_acqs_amt,
        "incr_acqs_amt": master.incr_acqs_amt,
        "dcrs_acqs_amt": master.dcrs_acqs_amt,
        "prls_amt": master.prls_amt,
        "vlamt": master.vlamt,
        "slby_prls_amt": master.slby_prls_amt,
        "holding_quantity": holding_quantity,
        "acquisition_amount": acquisition_amount,
        "valuation_amount": valuation_amount,
        "profit_loss_amount": profit_loss_amount,
        "profit_rate": profit_rate,
        "created_at": master.created_at,
        "updated_at": master.updated_at,
    }
    return StockMasterResponse(**data)


def get_previous_master_date(db: Session, user_id: int, proc_date: date) -> date | None:
    row = (
        db.query(StockMaster.proc_date)
        .filter(
            StockMaster.user_id == user_id,
            StockMaster.proc_date < proc_date,
        )
        .order_by(StockMaster.proc_date.desc())
        .first()
    )
    return row[0] if row else None


def build_stock_master_rows(db: Session, user_id: int, proc_date: date) -> list[StockMaster]:
    previous_date = get_previous_master_date(db, user_id, proc_date)
    previous_rows = []
    if previous_date:
        previous_rows = (
            db.query(StockMaster)
            .filter(
                StockMaster.user_id == user_id,
                StockMaster.proc_date == previous_date,
            )
            .all()
        )

    trades = (
        db.query(StockTrade)
        .filter(
            StockTrade.user_id == user_id,
            StockTrade.proc_date == proc_date,
        )
        .all()
    )

    item_codes = {row.itms_code for row in previous_rows}
    item_codes.update(trade.itms_code for trade in trades)
    stock_items = get_stock_item_map_for_date(db, list(item_codes), proc_date)

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
            raise HTTPException(
                status_code=400,
                detail=f"{item_code} 보유수량이 음수입니다. 전일 보유 또는 매도 수량을 확인해주세요.",
            )
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
                proc_date=proc_date,
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


@router.get("/stock-masters", response_model=List[StockMasterResponse])
def get_my_stock_masters(
    proc_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(StockMaster).filter(StockMaster.user_id == current_user.id)
    target_date = proc_date
    if target_date is None:
        latest = (
            db.query(StockMaster.proc_date)
            .filter(StockMaster.user_id == current_user.id)
            .order_by(StockMaster.proc_date.desc())
            .first()
        )
        target_date = latest[0] if latest else None
    if target_date:
        query = query.filter(StockMaster.proc_date == target_date)

    masters = query.order_by(StockMaster.proc_date.desc(), StockMaster.itms_code.asc()).all()
    item_map = get_stock_item_map(db, [master.itms_code for master in masters])
    return [build_master_response(master, item_map.get(master.itms_code)) for master in masters]


@router.post("/stock-masters/generate", response_model=List[StockMasterResponse])
def generate_my_stock_masters(
    generate_data: StockMasterGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    generated = build_stock_master_rows(db, current_user.id, generate_data.proc_date)
    (
        db.query(StockMaster)
        .filter(
            StockMaster.user_id == current_user.id,
            StockMaster.proc_date == generate_data.proc_date,
        )
        .delete(synchronize_session=False)
    )
    db.add_all(generated)
    db.commit()
    for master in generated:
        db.refresh(master)
    item_map = get_stock_item_map(db, [master.itms_code for master in generated])
    return [build_master_response(master, item_map.get(master.itms_code)) for master in generated]


@router.get("/stock-masters/item/{itms_code}", response_model=List[StockMasterResponse])
def get_my_stock_master_history(
    itms_code: str,
    from_date: date | None = None,
    to_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(StockMaster)
        .filter(
            StockMaster.user_id == current_user.id,
            StockMaster.itms_code == itms_code[:20],
        )
    )
    if from_date:
        query = query.filter(StockMaster.proc_date >= from_date)
    if to_date:
        query = query.filter(StockMaster.proc_date <= to_date)

    masters = query.order_by(StockMaster.proc_date.desc()).all()
    item_map = get_stock_item_map(db, [master.itms_code for master in masters])
    return [build_master_response(master, item_map.get(master.itms_code)) for master in masters]


@router.post(
    "/stock-masters",
    response_model=StockMasterResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_my_stock_master(
    master_data: StockMasterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    master = StockMaster(user_id=current_user.id, **master_data.model_dump())
    db.add(master)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Stock master already exists for this user/date/item.")
    db.refresh(master)
    stock_item = db.query(StockItem).filter(StockItem.itms_code == master.itms_code).first()
    return build_master_response(master, stock_item)


@router.get("/stock-masters/key/{master_key}", response_model=StockMasterResponse)
def get_my_stock_master_detail(
    master_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    master = get_my_stock_master_or_404(master_key, db, current_user)
    stock_item = db.query(StockItem).filter(StockItem.itms_code == master.itms_code).first()
    return build_master_response(master, stock_item)


@router.put("/stock-masters/key/{master_key}", response_model=StockMasterResponse)
def update_my_stock_master(
    master_key: str,
    master_data: StockMasterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    master = get_my_stock_master_or_404(master_key, db, current_user)
    apply_master_data(master, master_data.model_dump())
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Stock master already exists for this user/date/item.")
    db.refresh(master)
    stock_item = db.query(StockItem).filter(StockItem.itms_code == master.itms_code).first()
    return build_master_response(master, stock_item)


@router.delete("/stock-masters/key/{master_key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_stock_master(
    master_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    master = get_my_stock_master_or_404(master_key, db, current_user)
    db.delete(master)
    db.commit()
    return None
