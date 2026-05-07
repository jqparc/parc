from sqlalchemy import Column, DateTime, Integer, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from db.database import Base


class EconomicNews(Base):
    __tablename__ = "economic_news"
    __table_args__ = (
        UniqueConstraint("original_url", name="uq_economic_news_original_url"),
    )

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False, index=True)
    summary = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    source = Column(String(120), nullable=False, index=True)
    category = Column(String(50), nullable=False, default="business", index=True)
    original_url = Column(Text, nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=False, index=True)
    thumbnail = Column(Text, nullable=True)
    collected_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
