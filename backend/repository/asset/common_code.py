from sqlalchemy.orm import Session

from model.asset import CommonCode


BUSINESS_TYPE_GROUP = "BZTY_CODE"
BUSINESS_TYPE_GROUP_ALIASES = ["BZTY_CODE", "bzty_code"]


def get_business_types(db: Session) -> list[CommonCode]:
    return (
        db.query(CommonCode)
        .filter(CommonCode.srch_gpcd.in_(BUSINESS_TYPE_GROUP_ALIASES))
        .order_by(CommonCode.dtl_code.asc())
        .all()
    )


def get_codes_by_group(db: Session, group_code: str) -> dict[str, CommonCode]:
    codes = db.query(CommonCode).filter(CommonCode.srch_gpcd == group_code).all()
    return {code.dtl_code: code for code in codes}


def add_code(db: Session, group_code: str, detail_code: str, detail_name: str) -> CommonCode:
    code = CommonCode(
        srch_gpcd=group_code,
        dtl_code=detail_code,
        dtl_code_name=detail_name,
    )
    db.add(code)
    return code


def delete_code(db: Session, code: CommonCode) -> None:
    db.delete(code)
