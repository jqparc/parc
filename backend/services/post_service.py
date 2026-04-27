# backend/services/post_service.py
from sqlalchemy.orm import Session
from schemas.post_schema import PostCreate
from repositories import post_repository

def create_new_post(db: Session, post_data: PostCreate, board_id: int, user_id: int):
    # 비즈니스 로직이 있다면 여기서 처리 (예: 욕설 필터링, 권한 체크 등)
    
    # 순수 DB 저장 로직은 Repository로 위임
    new_post = post_repository.create_post(
        db=db,
        title=post_data.title,
        content=post_data.content,
        board_id=board_id,
        author_id=user_id
    )
    
    return new_post