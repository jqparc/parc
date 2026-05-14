from sqlalchemy import Column, Integer, String, UniqueConstraint

from db.database import Base


class Tab(Base):
    __tablename__ = "tab"

    id = Column(Integer, primary_key=True, index=True)
    menu_id = Column(String, nullable=False)
    tab_id = Column(String, nullable=False)
    tab_name = Column(String, nullable=False)
    href = Column(String, nullable=False)
    role = Column(String, default="ALL", nullable=False)
    use_yn = Column(String, default="Y", nullable=False)
    seq = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint("menu_id", "tab_id", name="uq_tab"),
    )
