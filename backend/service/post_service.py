from sqlalchemy.orm import Session

from service.economy.info import PostService


def create_new_post(db: Session, post_data, board_id: int, user_id: int):
    return PostService(db).create_new_post(post_data, board_id, user_id)


def get_posts_by_board(db: Session, board_id: int, page: int = 1, size: int = 10):
    return PostService(db).get_posts_by_board(board_id, page, size)


def get_post_detail(db: Session, post_id: int):
    return PostService(db).get_post_detail(post_id)


def get_post_detail_by_board(db: Session, post_id: int, board_id: int):
    return PostService(db).get_post_detail_by_board(post_id, board_id)


def update_existing_post(db: Session, post_id: int, post_data):
    return PostService(db).update_existing_post(post_id, post_data)


def delete_existing_post(db: Session, post_id: int) -> bool:
    return PostService(db).delete_existing_post(post_id)
