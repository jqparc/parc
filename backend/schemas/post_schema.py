# backend/schemas/post_schema.py
from pydantic import BaseModel
from datetime import datetime

# 1. 글을 쓸 때 (프론트엔드 -> 백엔드) 받을 데이터
class PostCreate(BaseModel):
    title: str
    content: str
    # 💡 팁: author_id(작성자)나 board_id는 여기서 받지 않습니다! 
    # 해킹의 위험이 있으므로, 백엔드에서 쿠키와 URL을 통해 직접 알아내서 넣습니다.

# 2. 글 작성이 완료된 후 (백엔드 -> 프론트엔드) 돌려줄 데이터
class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    views: int
    created_at: datetime
    author_id: int

    class Config:
        # DB 모델(SQLAlchemy)을 JSON 형태로 자동 변환해주기 위한 필수 설정
        from_attributes = True