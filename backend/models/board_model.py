from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from db.database import Base

class Board(Base):
    __tablename__ = "boards"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True)      # 내부 코드 (FREE, NOTICE)
    name = Column(String(50), nullable=False)   # 표시 이름 (자유게시판)

    description = Column(String(255))
    is_active = Column(Boolean, default=True)

    # 관계
    posts = relationship("Post", back_populates="board", cascade="all, delete")