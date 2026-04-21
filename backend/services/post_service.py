# backend/services/post_service.py
from sqlalchemy.orm import Session
from models.post_model import Post # 앞서 만든 통합 Post 모델
from schemas.post_schema import PostCreate

def create_new_post(db: Session, post_data: PostCreate, board_id: int, user_id: int):
    # 1. DB에 넣을 객체 조립하기
    new_post = Post(
        title=post_data.title,
        content=post_data.content,
        board_id=board_id,
        author_id=user_id
    )
    
    # 2. DB에 저장
    db.add(new_post)
    db.commit()
    db.refresh(new_post) # 저장 후 생성된 id나 created_at 값을 가져옴
    
    return new_post