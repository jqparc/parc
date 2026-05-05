# backend/schemas/post_schema.py
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class PostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    is_notice: bool = False
    board_id: Optional[int] = None


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    is_notice: Optional[bool] = None


class PostResponse(PostBase):
    id: int
    board_id: int
    author_id: int
    views: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PostListResponse(BaseModel):
    posts: list[PostResponse]
    total_pages: int
    current_page: int
    total_count: int


class BoardResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
