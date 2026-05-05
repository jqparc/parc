from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from db.database import Base


class DomesticStockHolding(Base):
    __tablename__ = "domestic_stock_holdings"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    stock_code = Column(String(20), nullable=False, index=True)
    stock_name = Column(String(100), nullable=False)
    market = Column(String(20), default="KOSPI", nullable=False)
    quantity = Column(Integer, nullable=False)
    purchase_price = Column(Numeric(14, 2), nullable=False)
    purchase_date = Column(Date, nullable=False)
    current_price = Column(Numeric(14, 2), nullable=True)
    memo = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User")
