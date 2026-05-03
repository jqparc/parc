# models/user_model.py
import enum
from sqlalchemy import UniqueConstraint, Column, Integer, String, DateTime, Enum, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.database import Base

class Menu(Base):
    __tablename__ = "menus"

    # PK는 단일 키
    id = Column(Integer, primary_key=True, index=True)

    # 유니크 묶을 컬럼들
    menu_id = Column(String, nullable=False)

    menu_name = Column(String, nullable=False)
    href     = Column(String, nullable=False)
    role     = Column(String, default="ALL", nullable=False)

    use_yn   = Column(String, default="Y", nullable=False)
    seq      = Column(Integer, nullable=False)

    # 🔥 핵심
    __table_args__ = (
        UniqueConstraint("menu_id", name="uq_menu"),
    )