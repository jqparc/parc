# backend/models/board_model.py
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from db.database import Base

class Board(Base):
    __tablename__ = "boards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True) # 화면 표시용 (예: "자유게시판")
    slug = Column(String, unique=True) # URL 용도 (예: "free")

    # [관계 설정] 하나의 게시판 안에는 여러 개의 글(Post)이 들어갑니다.
    posts = relationship("Post", back_populates="board")