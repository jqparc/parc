# backend/schemas/post_schema.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PostBase(BaseModel):
    title: str
    content: str
    is_notice: Optional[bool] = False

# 1. 글을 쓸 때 (프론트엔드 -> 백엔드) 받을 데이터
class PostCreate(PostBase):
    board_id: int
    # 💡 팁: author_id(작성자)나 board_id는 여기서 받지 않습니다! 
    # 해킹의 위험이 있으므로, 백엔드에서 쿠키와 URL을 통해 직접 알아내서 넣습니다.

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_notice: Optional[bool] = None

# 2. 글 작성이 완료된 후 (백엔드 -> 프론트엔드) 돌려줄 데이터
class PostResponse(PostBase):
    id: int
    board_id: int
    author_id: int
    views: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True  # (구 orm_mode=True)