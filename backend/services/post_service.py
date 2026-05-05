# backend/services/post_service.py
from sqlalchemy.orm import Session
from schemas.post_schema import PostCreate, PostUpdate
from repositories import post_repository


def create_new_post(db: Session, post_data: PostCreate, board_id: int, user_id: int):
    # 비즈니스 로직이 있다면 여기서 처리 (예: 욕설 필터링, 권한 체크 등)
    
    # 순수 DB 저장 로직은 Repository로 위임
    new_post = post_repository.create_post(
        db=db,
        title=post_data.title,
        content=post_data.content,
        board_id=board_id,
        author_id=user_id,
        is_notice=post_data.is_notice,
    )
    
    return new_post


def get_posts_by_board(db: Session, board_id: int, page: int = 1, size: int = 10):
    total_count = post_repository.count_posts_by_board_id(db, board_id)
    skip = (page - 1) * size
    posts = post_repository.get_posts_by_board_id(
        db=db,
        board_id=board_id,
        skip=skip,
        limit=size,
    )
    total_pages = (total_count + size - 1) // size

    return {
        "posts": posts,
        "total_pages": total_pages,
        "current_page": page,
        "total_count": total_count,
    }


def get_post_detail(db: Session, post_id: int):
    return post_repository.get_post_by_id(db, post_id)


def get_post_detail_by_board(db: Session, post_id: int, board_id: int):
    return post_repository.get_post_by_id_and_board_id(db, post_id, board_id)


def update_existing_post(db: Session, post_id: int, post_data: PostUpdate):
    post = post_repository.get_post_by_id(db, post_id)
    if not post:
        return None

    update_data = post_data.model_dump(exclude_unset=True)
    if not update_data:
        return post

    return post_repository.update_post(db, post, update_data)


def delete_existing_post(db: Session, post_id: int) -> bool:
    post = post_repository.get_post_by_id(db, post_id)
    if not post:
        return False

    post_repository.delete_post(db, post)
    return True
