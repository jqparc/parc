from fastapi import APIRouter, Depends, HTTPException, Query, status

from api.v1.dependency.auth_dep import get_current_user
from model.system.user import User
from schema.economy.info import PostCreate, PostListResponse, PostResponse, PostUpdate
from service.economy.info import BoardService, PostService
from .dependency import get_board_service, get_post_service
from .guard import check_admin, check_post_owner_or_admin

router = APIRouter()


@router.post("/board/{board_code}/post", response_model=PostResponse)
def create_post(
    board_code: str,
    post_data: PostCreate,
    current_user: User = Depends(get_current_user),
    board_service: BoardService = Depends(get_board_service),
    post_service: PostService = Depends(get_post_service),
):
    check_admin(current_user)
    board = board_service.get_active_board_by_code(board_code)
    if post_data.board_id is not None and post_data.board_id != board.id:
        raise HTTPException(status_code=400, detail="Selected board_id does not match board code.")

    return post_service.create_new_post(
        post_data=post_data,
        board_id=board.id,
        user_id=current_user.id,
    )


@router.get("/board/{board_code}/post", response_model=PostListResponse)
def get_posts(
    board_code: str,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=50, description="Posts per page"),
    board_service: BoardService = Depends(get_board_service),
    post_service: PostService = Depends(get_post_service),
):
    board = board_service.get_active_board_by_code(board_code)
    return post_service.get_posts_by_board(board.id, page, size)


@router.get("/board/{board_code}/post/{post_id}", response_model=PostResponse)
def get_post(
    board_code: str,
    post_id: int,
    board_service: BoardService = Depends(get_board_service),
    post_service: PostService = Depends(get_post_service),
):
    board = board_service.get_active_board_by_code(board_code)
    post = post_service.get_post_detail_by_board(post_id, board.id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    return post


@router.patch("/board/{board_code}/post/{post_id}", response_model=PostResponse)
def update_post(
    board_code: str,
    post_id: int,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_user),
    board_service: BoardService = Depends(get_board_service),
    post_service: PostService = Depends(get_post_service),
):
    board = board_service.get_active_board_by_code(board_code)
    post = post_service.get_post_detail_by_board(post_id, board.id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    check_post_owner_or_admin(post.author_id, current_user)
    return post_service.update_existing_post(post.id, post_data)


@router.delete("/board/{board_code}/post/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    board_code: str,
    post_id: int,
    current_user: User = Depends(get_current_user),
    board_service: BoardService = Depends(get_board_service),
    post_service: PostService = Depends(get_post_service),
):
    board = board_service.get_active_board_by_code(board_code)
    post = post_service.get_post_detail_by_board(post_id, board.id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    check_post_owner_or_admin(post.author_id, current_user)
    post_service.delete_existing_post(post.id)
    return None
