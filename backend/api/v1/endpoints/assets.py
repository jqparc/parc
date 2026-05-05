from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.v1.dependencies.auth_deps import get_current_user
from db.database import get_db
from models.domestic_stock_model import DomesticStockHolding
from models.user_model import User
from schemas.asset_schema import (
    DomesticStockHoldingCreate,
    DomesticStockHoldingResponse,
)

router = APIRouter()


def build_holding_response(holding: DomesticStockHolding) -> DomesticStockHoldingResponse:
    invested_amount = Decimal(holding.quantity) * holding.purchase_price
    valuation_amount = None
    profit_loss = None
    profit_rate = None

    if holding.current_price is not None:
        valuation_amount = Decimal(holding.quantity) * holding.current_price
        profit_loss = valuation_amount - invested_amount
        if invested_amount:
            profit_rate = (profit_loss / invested_amount) * Decimal("100")

    data = {
        "id": holding.id,
        "owner_id": holding.owner_id,
        "stock_code": holding.stock_code,
        "stock_name": holding.stock_name,
        "market": holding.market,
        "quantity": holding.quantity,
        "purchase_price": holding.purchase_price,
        "purchase_date": holding.purchase_date,
        "current_price": holding.current_price,
        "memo": holding.memo,
        "created_at": holding.created_at,
        "updated_at": holding.updated_at,
        "invested_amount": invested_amount,
        "valuation_amount": valuation_amount,
        "profit_loss": profit_loss,
        "profit_rate": profit_rate,
    }
    return DomesticStockHoldingResponse(**data)


@router.get("/domestic-stocks", response_model=List[DomesticStockHoldingResponse])
def get_my_domestic_stock_holdings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    holdings = (
        db.query(DomesticStockHolding)
        .filter(DomesticStockHolding.owner_id == current_user.id)
        .order_by(DomesticStockHolding.purchase_date.desc(), DomesticStockHolding.id.desc())
        .all()
    )
    return [build_holding_response(holding) for holding in holdings]


@router.post(
    "/domestic-stocks",
    response_model=DomesticStockHoldingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_my_domestic_stock_holding(
    holding_data: DomesticStockHoldingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    holding = DomesticStockHolding(
        owner_id=current_user.id,
        **holding_data.model_dump(),
    )
    db.add(holding)
    db.commit()
    db.refresh(holding)
    return build_holding_response(holding)


@router.delete("/domestic-stocks/{holding_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_domestic_stock_holding(
    holding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    holding = (
        db.query(DomesticStockHolding)
        .filter(
            DomesticStockHolding.id == holding_id,
            DomesticStockHolding.owner_id == current_user.id,
        )
        .first()
    )
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found.")

    db.delete(holding)
    db.commit()
    return None
