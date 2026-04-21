# models/user_model.py
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.database import Base

# Base(기본 뼈대)를 상속받아서 만듭니다.
class User(Base):
    # 데이터베이스(SQLite) 안에 만들어질 실제 표의 이름입니다.
    __tablename__ = "users"

    # 표의 칸(Column)들을 정의합니다.
    id = Column(Integer, primary_key=True, index=True)      # 1번, 2번... 고유 번호
    username = Column(String, unique=True, index=True)      # 아이디 (중복 가입 방지!)
    password = Column(String)                               # 비밀번호
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    posts = relationship("Post", back_populates="author")