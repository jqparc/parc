from sqlalchemy import Column, DateTime, String
from sqlalchemy.sql import func

from db.database import Base


class CommonCode(Base):
    __tablename__ = "cmn_code"

    srch_gpcd = Column(String(30), primary_key=True, nullable=False)
    dtl_code = Column(String(30), primary_key=True, nullable=False)
    dtl_code_name = Column(String(100), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
