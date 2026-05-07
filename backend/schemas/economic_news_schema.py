from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class EconomicNewsResponse(BaseModel):
    id: int
    title: str
    summary: Optional[str] = None
    content: Optional[str] = None
    source: str
    category: str
    original_url: str
    published_at: datetime
    thumbnail: Optional[str] = None
    collected_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EconomicNewsListResponse(BaseModel):
    items: list[EconomicNewsResponse]
    total: int
    categories: list[str]
