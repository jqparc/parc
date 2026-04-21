# backend/models/post_model.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.database import Base

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    views = Column(Integer, default=0) # 조회수
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # -----------------------------------------------------
    # [핵심] 다른 테이블과 연결되는 Foreign Key (외부키)
    # -----------------------------------------------------
    author_id = Column(Integer, ForeignKey("users.id"))  # 누가 썼나?
    board_id = Column(Integer, ForeignKey("boards.id"))  # 어디에 썼나?

    # -----------------------------------------------------
    # [관계 설정] 파이썬 코드에서 쉽게 데이터를 가져오기 위한 설정
    # -----------------------------------------------------
    author = relationship("User", back_populates="posts")
    board = relationship("Board", back_populates="posts")