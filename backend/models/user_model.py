# models/user_model.py
import enum
from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"

class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    BANNED = "banned"
    PENDING = "pending"
    DELETED = "deleted"

class User(Base):
    __tablename__ = "users"

    # 표의 칸(Column)들을 정의합니다.
    id = Column(Integer, primary_key=True, index=True)      
    user_id = Column(String, unique=True, index=True)      
    password = Column(String, nullable=True)                           

    nickname = Column(String, unique=True, nullable=False)
    phone = Column(String, unique=True, nullable=False)

    provider = Column(String, default="local") # 'local', 'kakao', 'google' 등
    social_id = Column(String, unique=True, index=True, nullable=True)

    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    posts = relationship("Post", back_populates="author")