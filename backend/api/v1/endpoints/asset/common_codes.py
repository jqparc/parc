from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from models.common_code_model import CommonCode
from schemas.asset_schema import AssetCommonCodeResponse, AssetCommonCodeSaveRequest

router = APIRouter()
BztyCodeGroup = "BZTY_CODE"


@router.get("/business-types", response_model=List[AssetCommonCodeResponse])
def get_business_types(db: Session = Depends(get_db)):
    codes = (
        db.query(CommonCode)
        .filter(CommonCode.srch_gpcd.in_(["BZTY_CODE", "bzty_code"]))
        .order_by(CommonCode.dtl_code.asc())
        .all()
    )
    return codes


@router.put("/business-types", response_model=List[AssetCommonCodeResponse])
def save_business_types(payload: AssetCommonCodeSaveRequest, db: Session = Depends(get_db)):
    normalized_codes = []
    seen_codes = set()

    for code in payload.codes:
        detail_code = code.dtl_code.strip()
        detail_name = code.dtl_code_name.strip()
        if not detail_code or not detail_name:
            raise HTTPException(status_code=400, detail="업종코드와 업종명은 필수입니다.")
        if detail_code in seen_codes:
            raise HTTPException(status_code=400, detail=f"중복된 업종코드가 있습니다: {detail_code}")
        seen_codes.add(detail_code)
        normalized_codes.append((detail_code, detail_name))

    existing_codes = {
        code.dtl_code: code
        for code in db.query(CommonCode).filter(CommonCode.srch_gpcd == BztyCodeGroup).all()
    }

    for detail_code, detail_name in normalized_codes:
        existing = existing_codes.get(detail_code)
        if existing:
            existing.dtl_code_name = detail_name
        else:
            db.add(
                CommonCode(
                    srch_gpcd=BztyCodeGroup,
                    dtl_code=detail_code,
                    dtl_code_name=detail_name,
                )
            )

    requested_codes = {detail_code for detail_code, _ in normalized_codes}
    for detail_code, existing in existing_codes.items():
        if detail_code not in requested_codes:
            db.delete(existing)

    db.commit()

    return get_business_types(db)
