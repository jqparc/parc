from sqlalchemy import Column, Integer, String, UniqueConstraint

from db.database import Base


class Menu(Base):
    __tablename__ = "menu"

    id = Column(Integer, primary_key=True, index=True)
    menu_id = Column(String, nullable=False)
    menu_name = Column(String, nullable=False)
    href = Column(String, nullable=False)
    role = Column(String, default="ALL", nullable=False)
    use_yn = Column(String, default="Y", nullable=False)
    seq = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint("menu_id", name="uq_menu"),
    )
