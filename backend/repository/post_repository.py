from sqlalchemy.orm import Session

from repository.economy.info import PostRepository


def create_post(
    db: Session,
    title: str,
    content: str,
    board_id: int,
    author_id: int,
    is_notice: bool = False,
):
    return PostRepository(db).create(title, content, board_id, author_id, is_notice)


def get_posts_by_board_id(db: Session, board_id: int, skip: int = 0, limit: int = 10):
    return PostRepository(db).list_by_board_id(board_id, skip, limit)


def count_posts_by_board_id(db: Session, board_id: int) -> int:
    return PostRepository(db).count_by_board_id(board_id)


def get_post_by_id(db: Session, post_id: int):
    return PostRepository(db).get_by_id(post_id)


def get_post_by_id_and_board_id(db: Session, post_id: int, board_id: int):
    return PostRepository(db).get_by_id_and_board_id(post_id, board_id)


def update_post(db: Session, post, update_data: dict):
    return PostRepository(db).update(post, update_data)


def delete_post(db: Session, post) -> None:
    PostRepository(db).soft_delete(post)
