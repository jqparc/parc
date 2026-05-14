from datetime import date
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from api.v1.dependency.auth_dep import get_current_user
from db.database import get_db
from model.user import User
from schema.asset.stck import (
    StockMasterCreate,
    StockMasterGenerateRequest,
    StockMasterResponse,
    StockMasterUpdate,
)
from service.asset.stck import master as stck_master_service

router = APIRouter()


@router.get("/stock-master", response_model=List[StockMasterResponse])
def get_my_stock_masters(
    proc_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return stck_master_service.list_my_stock_masters(db, current_user.id, proc_date)


@router.post("/stock-master/generate", response_model=List[StockMasterResponse])
def generate_my_stock_masters(
    generate_data: StockMasterGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return stck_master_service.generate_my_stock_masters(db, current_user.id, generate_data)


@router.get("/stock-master/item/{itms_code}", response_model=List[StockMasterResponse])
def get_my_stock_master_history(
    itms_code: str,
    from_date: date | None = None,
    to_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return stck_master_service.list_my_stock_master_history(db, current_user.id, itms_code, from_date, to_date)


@router.post(
    "/stock-master",
    response_model=StockMasterResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_my_stock_master(
    master_data: StockMasterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return stck_master_service.create_my_stock_master(db, current_user.id, master_data)


@router.get("/stock-master/key/{master_key}", response_model=StockMasterResponse)
def get_my_stock_master_detail(
    master_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return stck_master_service.get_my_stock_master_detail(db, current_user.id, master_key)


@router.put("/stock-master/key/{master_key}", response_model=StockMasterResponse)
def update_my_stock_master(
    master_key: str,
    master_data: StockMasterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return stck_master_service.update_my_stock_master(db, current_user.id, master_key, master_data)


@router.delete("/stock-master/key/{master_key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_stock_master(
    master_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stck_master_service.delete_my_stock_master(db, current_user.id, master_key)
    return None
