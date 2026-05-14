from sqlalchemy import Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from db.database import Base


class CalendarEvent(Base):
    __tablename__ = "user_calendar_event"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("user.id"), nullable=False, index=True)
    title = Column(String(120), nullable=False)
    start = Column(Date, nullable=False, index=True)
    color = Column(String(20), nullable=False, default="#2563eb")

    owner = relationship("User", back_populates="calendar_events")
