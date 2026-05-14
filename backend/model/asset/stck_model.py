from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from db.database import Base


class StockItem(Base):
    __tablename__ = "stck_itms"

    proc_date = Column(Date, primary_key=True, nullable=False, index=True)
    itms_code = Column(String(20), primary_key=True, nullable=False, index=True)
    itms_name = Column(String(100), nullable=False)
    shtg_code = Column(String(1), default="A", nullable=False)
    bzty_code = Column(String(3), nullable=True)
    clpr = Column(Numeric(14, 2), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class StockTrade(Base):
    __tablename__ = "stck_tr"

    user_id = Column(Integer, ForeignKey("user.id"), primary_key=True, nullable=False, index=True)
    proc_date = Column(Date, primary_key=True, nullable=False)
    itms_code = Column(String(20), primary_key=True, nullable=False, index=True)
    trns_code = Column(String(1), primary_key=True, default="B", nullable=False)
    seq = Column(Integer, primary_key=True, nullable=False)
    qnty = Column(Integer, nullable=False)
    prc = Column(Numeric(14, 2), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")


class StockMaster(Base):
    __tablename__ = "stck_ma"

    user_id = Column(Integer, ForeignKey("user.id"), primary_key=True, nullable=False, index=True)
    proc_date = Column(Date, primary_key=True, nullable=False, index=True)
    itms_code = Column(String(20), primary_key=True, nullable=False, index=True)
    shtg_code = Column(String(1), default="A", nullable=False)
    bzty_code = Column(String(3), nullable=True)
    prdy_stcn = Column(Integer, default=0, nullable=False)
    incr_stcn = Column(Integer, default=0, nullable=False)
    dcrs_stcn = Column(Integer, default=0, nullable=False)
    prdy_acqs_amt = Column(Numeric(18, 2), default=0, nullable=False)
    incr_acqs_amt = Column(Numeric(18, 2), default=0, nullable=False)
    dcrs_acqs_amt = Column(Numeric(18, 2), default=0, nullable=False)
    prls_amt = Column(Numeric(18, 2), default=0, nullable=False)
    vlamt = Column(Numeric(18, 2), default=0, nullable=False)
    slby_prls_amt = Column(Numeric(18, 2), default=0, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
