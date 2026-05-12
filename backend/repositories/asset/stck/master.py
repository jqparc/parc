from datetime import date

from sqlalchemy.orm import Session

from models.assets import StockMaster


def get_stock_master(db: Session, user_id: int, proc_date_value: date, item_code: str) -> StockMaster | None:
    return (
        db.query(StockMaster)
        .filter(
            StockMaster.user_id == user_id,
            StockMaster.proc_date == proc_date_value,
            StockMaster.itms_code == item_code,
        )
        .first()
    )


def get_latest_stock_master_date(db: Session, user_id: int) -> date | None:
    row = (
        db.query(StockMaster.proc_date)
        .filter(StockMaster.user_id == user_id)
        .order_by(StockMaster.proc_date.desc())
        .first()
    )
    return row[0] if row else None


def get_previous_stock_master_date(db: Session, user_id: int, proc_date_value: date) -> date | None:
    row = (
        db.query(StockMaster.proc_date)
        .filter(
            StockMaster.user_id == user_id,
            StockMaster.proc_date < proc_date_value,
        )
        .order_by(StockMaster.proc_date.desc())
        .first()
    )
    return row[0] if row else None


def get_stock_masters(db: Session, user_id: int, proc_date_value: date | None = None) -> list[StockMaster]:
    query = db.query(StockMaster).filter(StockMaster.user_id == user_id)
    if proc_date_value:
        query = query.filter(StockMaster.proc_date == proc_date_value)
    return query.order_by(StockMaster.proc_date.desc(), StockMaster.itms_code.asc()).all()


def get_stock_master_history(
    db: Session,
    user_id: int,
    item_code: str,
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[StockMaster]:
    query = (
        db.query(StockMaster)
        .filter(
            StockMaster.user_id == user_id,
            StockMaster.itms_code == item_code[:20],
        )
    )
    if from_date:
        query = query.filter(StockMaster.proc_date >= from_date)
    if to_date:
        query = query.filter(StockMaster.proc_date <= to_date)
    return query.order_by(StockMaster.proc_date.desc()).all()


def get_stock_masters_for_date(db: Session, user_id: int, proc_date_value: date) -> list[StockMaster]:
    return (
        db.query(StockMaster)
        .filter(
            StockMaster.user_id == user_id,
            StockMaster.proc_date == proc_date_value,
        )
        .all()
    )


def replace_stock_masters_for_date(
    db: Session,
    user_id: int,
    proc_date_value: date,
    masters: list[StockMaster],
) -> None:
    (
        db.query(StockMaster)
        .filter(
            StockMaster.user_id == user_id,
            StockMaster.proc_date == proc_date_value,
        )
        .delete(synchronize_session=False)
    )
    db.add_all(masters)


def add_stock_master(db: Session, master: StockMaster) -> StockMaster:
    db.add(master)
    return master


def delete_stock_master(db: Session, master: StockMaster) -> None:
    db.delete(master)
