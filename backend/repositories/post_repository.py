# backend/repositories/post_repository.py
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from models.post_model import Post


def create_post(
    db: Session,
    title: str,
    content: str,
    board_id: int,
    author_id: int,
    is_notice: bool = False,
):
    new_post = Post(
        title=title,
        content=content,
        board_id=board_id,
        author_id=author_id,
        is_notice=is_notice,
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post


def get_posts_by_board_id(db: Session, board_id: int, skip: int = 0, limit: int = 10):
    return (
        db.query(Post)
        .filter(Post.board_id == board_id, Post.is_deleted.is_(False))
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def count_posts_by_board_id(db: Session, board_id: int) -> int:
    return (
        db.query(Post)
        .filter(Post.board_id == board_id, Post.is_deleted.is_(False))
        .count()
    )


def get_post_by_id(db: Session, post_id: int) -> Optional[Post]:
    return (
        db.query(Post)
        .filter(Post.id == post_id, Post.is_deleted.is_(False))
        .first()
    )


def get_post_by_id_and_board_id(
    db: Session,
    post_id: int,
    board_id: int,
) -> Optional[Post]:
    return (
        db.query(Post)
        .filter(
            Post.id == post_id,
            Post.board_id == board_id,
            Post.is_deleted.is_(False),
        )
        .first()
    )


def update_post(
    db: Session,
    post: Post,
    update_data: dict,
) -> Post:
    for field, value in update_data.items():
        setattr(post, field, value)

    db.commit()
    db.refresh(post)
    return post


def delete_post(db: Session, post: Post) -> None:
    post.is_deleted = True
    post.deleted_at = func.now()
    db.commit()
