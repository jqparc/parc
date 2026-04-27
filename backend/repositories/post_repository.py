# backend/repositories/post_repository.py
from sqlalchemy.orm import Session
from models.post_model import Post

def create_post(db: Session, title: str, content: str, board_id: int, author_id: int):
    new_post = Post(
        title=title,
        content=content,
        board_id=board_id,
        author_id=author_id
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post