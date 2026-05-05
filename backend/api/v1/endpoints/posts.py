# backend/routers/posts.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from api.v1.dependencies.auth_deps import get_current_user
from db.database import get_db
from models.board_model import Board
from models.user_model import User, UserRole
from schemas.post_schema import (
    BoardResponse,
    PostCreate,
    PostListResponse,
    PostResponse,
    PostUpdate,
)
from services import post_service

router = APIRouter(tags=["Posts"])


def get_board_by_code(db: Session, board_code: str) -> Board:
    board = (
        db.query(Board)
        .filter(Board.code == board_code, Board.is_active.is_(True))
        .first()
    )
    if not board:
        raise HTTPException(status_code=404, detail="Board not found.")

    return board


def check_post_owner_or_admin(post_author_id: int, current_user: User) -> None:
    if current_user.id == post_author_id or current_user.role == UserRole.ADMIN:
        return

    raise HTTPException(status_code=403, detail="You do not have permission for this post.")


def check_admin(current_user: User) -> None:
    if current_user.role == UserRole.ADMIN:
        return

    raise HTTPException(status_code=403, detail="Admin permission required.")


@router.get("/boards", response_model=list[BoardResponse])
def get_boards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)
    return (
        db.query(Board)
        .filter(Board.is_active.is_(True))
        .order_by(Board.id)
        .all()
    )


@router.post("/boards/{board_code}/posts", response_model=PostResponse)
def create_post(
    board_code: str,
    post_data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_admin(current_user)
    board = get_board_by_code(db, board_code)
    if post_data.board_id is not None and post_data.board_id != board.id:
        raise HTTPException(status_code=400, detail="Selected board_id does not match board code.")

    return post_service.create_new_post(
        db=db,
        post_data=post_data,
        board_id=board.id,
        user_id=current_user.id,
    )


@router.get("/boards/{board_code}/posts", response_model=PostListResponse)
def get_posts(
    board_code: str,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=50, description="Posts per page"),
    db: Session = Depends(get_db),
):
    board = get_board_by_code(db, board_code)
    return post_service.get_posts_by_board(db, board.id, page, size)


@router.get("/boards/{board_code}/posts/{post_id}", response_model=PostResponse)
def get_post(
    board_code: str,
    post_id: int,
    db: Session = Depends(get_db),
):
    board = get_board_by_code(db, board_code)
    post = post_service.get_post_detail_by_board(db, post_id, board.id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    return post


@router.patch("/boards/{board_code}/posts/{post_id}", response_model=PostResponse)
def update_post(
    board_code: str,
    post_id: int,
    post_data: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    board = get_board_by_code(db, board_code)
    post = post_service.get_post_detail_by_board(db, post_id, board.id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    check_post_owner_or_admin(post.author_id, current_user)
    return post_service.update_existing_post(db, post.id, post_data)


@router.delete("/boards/{board_code}/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    board_code: str,
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    board = get_board_by_code(db, board_code)
    post = post_service.get_post_detail_by_board(db, post_id, board.id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    check_post_owner_or_admin(post.author_id, current_user)
    post_service.delete_existing_post(db, post.id)
    return None
