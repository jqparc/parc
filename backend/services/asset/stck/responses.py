from decimal import Decimal

from models.assets import StockItem, StockMaster, StockTrade
from schemas.asset.stck import StockItemResponse, StockItemSearchResponse, StockMasterResponse, StockTradeResponse
from services.asset.stck import keys
from services.asset.stck.market_data import resolve_current_price


def build_stock_item_response(item: StockItem) -> StockItemResponse:
    data = {
        "item_key": keys.make_item_key(item.proc_date, item.itms_code),
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


def build_stock_item_search_response(
    item: StockItem,
    shtg_name: str | None = None,
    bzty_name: str | None = None,
) -> StockItemSearchResponse:
    data = build_stock_item_response(item).model_dump()
    data.update(
        {
            "shtg_name": shtg_name,
            "bzty_name": bzty_name,
        }
    )
    return StockItemSearchResponse(**data)


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
        "master_key": keys.make_master_key(master.proc_date, master.itms_code),
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
        "trade_key": keys.make_trade_key(trade.proc_date, trade.itms_code, trade.trns_code, trade.seq),
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
