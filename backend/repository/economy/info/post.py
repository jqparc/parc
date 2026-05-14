from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from model.economy.info import Post


class PostRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        title: str,
        content: str,
        board_id: int,
        author_id: int,
        is_notice: bool = False,
    ) -> Post:
        post = Post(
            title=title,
            content=content,
            board_id=board_id,
            author_id=author_id,
            is_notice=is_notice,
        )
        self.db.add(post)
        self.db.commit()
        self.db.refresh(post)
        return post

    def list_by_board_id(self, board_id: int, skip: int = 0, limit: int = 10) -> list[Post]:
        return (
            self.db.query(Post)
            .filter(Post.board_id == board_id, Post.is_deleted.is_(False))
            .order_by(Post.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_board_id(self, board_id: int) -> int:
        return (
            self.db.query(Post)
            .filter(Post.board_id == board_id, Post.is_deleted.is_(False))
            .count()
        )

    def get_by_id(self, post_id: int) -> Post | None:
        return (
            self.db.query(Post)
            .filter(Post.id == post_id, Post.is_deleted.is_(False))
            .first()
        )

    def get_by_id_and_board_id(self, post_id: int, board_id: int) -> Post | None:
        return (
            self.db.query(Post)
            .filter(
                Post.id == post_id,
                Post.board_id == board_id,
                Post.is_deleted.is_(False),
            )
            .first()
        )

    def update(self, post: Post, update_data: dict) -> Post:
        for field, value in update_data.items():
            setattr(post, field, value)

        self.db.commit()
        self.db.refresh(post)
        return post

    def soft_delete(self, post: Post) -> None:
        post.is_deleted = True
        post.deleted_at = func.now()
        self.db.commit()
