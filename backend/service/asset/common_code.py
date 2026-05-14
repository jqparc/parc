from sqlalchemy.orm import Session

from core.exception import bad_request
from repository.asset import common_code as common_code_repository
from schema.asset import AssetCommonCodeSaveRequest


def get_business_types(db: Session):
    return common_code_repository.get_business_types(db)


def save_business_types(payload: AssetCommonCodeSaveRequest, db: Session):
    normalized_codes = _normalize_codes(payload)
    existing_codes = common_code_repository.get_codes_by_group(
        db,
        common_code_repository.BUSINESS_TYPE_GROUP,
    )

    for detail_code, detail_name in normalized_codes:
        existing = existing_codes.get(detail_code)
        if existing:
            existing.dtl_code_name = detail_name
            continue

        common_code_repository.add_code(
            db,
            common_code_repository.BUSINESS_TYPE_GROUP,
            detail_code,
            detail_name,
        )

    requested_codes = {detail_code for detail_code, _ in normalized_codes}
    for detail_code, existing in existing_codes.items():
        if detail_code not in requested_codes:
            common_code_repository.delete_code(db, existing)

    db.commit()
    return get_business_types(db)


def _normalize_codes(payload: AssetCommonCodeSaveRequest) -> list[tuple[str, str]]:
    normalized_codes = []
    seen_codes = set()

    for code in payload.codes:
        detail_code = code.dtl_code.strip()
        detail_name = code.dtl_code_name.strip()

        if not detail_code or not detail_name:
            raise bad_request("Business type code and name are required.")
        if detail_code in seen_codes:
            raise bad_request(f"Duplicate business type code: {detail_code}")

        seen_codes.add(detail_code)
        normalized_codes.append((detail_code, detail_name))

    return normalized_codes
