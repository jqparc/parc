from datetime import date
from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from api.v1.dependency.auth_dep import get_current_user
from db.database import get_db
from model.user import User
from schema.asset.stck import (
    StockItemCreate,
    StockItemResponse,
    StockItemSearchResponse,
    StockItemUpdate,
    StockMasterGenerateRequest,
)
from service.asset.stck import item as stck_item_service

router = APIRouter()


@router.get("/stock-item", response_model=List[StockItemResponse])
def get_stock_items(db: Session = Depends(get_db)):
    return stck_item_service.list_stock_items(db)


@router.get("/stock-item/search", response_model=List[StockItemSearchResponse])
def search_stock_items(
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    itms_code: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return stck_item_service.search_stock_items(db, from_date, to_date, itms_code)


@router.post("/stock-item", response_model=StockItemResponse, status_code=status.HTTP_201_CREATED)
def create_stock_item(item_data: StockItemCreate, db: Session = Depends(get_db)):
    return stck_item_service.create_stock_item(db, item_data)


@router.post("/stock-item/generate", response_model=List[StockItemResponse])
def generate_my_stock_items(
    generate_data: StockMasterGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return stck_item_service.generate_my_stock_items(db, current_user.id, generate_data)


@router.get("/stock-item/key/{item_key}", response_model=StockItemResponse)
def get_stock_item(item_key: str, db: Session = Depends(get_db)):
    return stck_item_service.get_stock_item_detail(db, item_key)


@router.put("/stock-item/key/{item_key}", response_model=StockItemResponse)
def update_stock_item(item_key: str, item_data: StockItemUpdate, db: Session = Depends(get_db)):
    return stck_item_service.update_stock_item(db, item_key, item_data)


@router.delete("/stock-item/key/{item_key}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stock_item(item_key: str, db: Session = Depends(get_db)):
    stck_item_service.delete_stock_item(db, item_key)
    return None
