from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.database import get_db
from schema.asset import AssetCommonCodeResponse, AssetCommonCodeSaveRequest
from service.asset import common_code as common_code_service

router = APIRouter()


@router.get("/business-type", response_model=List[AssetCommonCodeResponse])
def get_business_types(db: Session = Depends(get_db)):
    return common_code_service.get_business_types(db)


@router.put("/business-type", response_model=List[AssetCommonCodeResponse])
def save_business_types(payload: AssetCommonCodeSaveRequest, db: Session = Depends(get_db)):
    return common_code_service.save_business_types(payload, db)
