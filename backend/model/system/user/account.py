import enum

from sqlalchemy import Column, DateTime, Enum, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from db.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    USER = "USER"
    ALL = "ALL"


class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    BANNED = "BANNED"
    PENDING = "PENDING"
    DELETED = "DELETED"


class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=True)
    nickname = Column(String, unique=True, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    provider = Column(String, default="LOCAL", nullable=False)
    social_id = Column(String, unique=True, index=True, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    posts = relationship("Post", back_populates="author")
    calendar_events = relationship("CalendarEvent", back_populates="owner", cascade="all, delete-orphan")
