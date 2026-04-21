# backend/routers/posts.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.database import get_db
from core.security import get_current_user # 이전에 쿠키로 인증하게 만든 함수
from models.user_model import User
from models.board_model import Board
from models.post_model import Post
from schemas.post_schema import PostCreate, PostResponse
from services import post_service

router = APIRouter(tags=["Posts"])

@router.post("/api/boards/{board_slug}/posts", response_model=PostResponse)
def create_post(
    board_slug: str, # URL에서 'free', 'notice' 등을 받아옴
    post_data: PostCreate, # 프론트엔드에서 보낸 제목, 내용
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # ⭐️ 로그인한 사람만 이 API를 실행할 수 있음!
):
    # 1. 주소표시줄의 slug 값이 실제 존재하는 게시판인지 확인
    board = db.query(Board).filter(Board.slug == board_slug).first()
    if not board:
        raise HTTPException(status_code=404, detail="존재하지 않는 게시판입니다.")

    # 2. 서비스 로직을 호출하여 글 저장 (게시판 ID와 현재 로그인한 유저의 ID를 넘겨줌)
    new_post = post_service.create_new_post(
        db=db,
        post_data=post_data,
        board_id=board.id,
        user_id=current_user.id # 쿠키에서 안전하게 빼낸 내 ID
    )
    
    return new_post

@router.get("/api/boards/{board_slug}/posts")
def get_posts(
    board_slug: str,
    page: int = Query(1, ge=1, description="페이지 번호"),  # 기본값 1, 1 이상이어야 함
    size: int = Query(10, ge=1, le=50, description="한 페이지당 글 개수"), # 기본 10개, 최대 50개 제한
    db: Session = Depends(get_db)
):
    # 1. 주소표시줄의 slug 값이 실제 존재하는 게시판인지 확인
    board = db.query(Board).filter(Board.slug == board_slug).first()
    if not board:
        raise HTTPException(status_code=404, detail="존재하지 않는 게시판입니다.")

    # 2. 해당 게시판에 있는 전체 글 개수 조회 (번호 역순 계산을 위해 필수!)
    total_count = db.query(Post).filter(Post.board_id == board.id).count()

    # 3. 페이지네이션 (건너뛸 개수 계산)
    skip = (page - 1) * size
    
    # 4. 최신순(created_at.desc())으로 정렬한 뒤, 필요한 만큼만(limit) 잘라서 가져오기
    posts = db.query(Post).filter(Post.board_id == board.id)\
              .order_by(Post.created_at.desc())\
              .offset(skip).limit(size).all()

    # 전체 페이지 수 계산 (올림 처리)
    total_pages = (total_count + size - 1) // size

    # 프론트엔드가 요구하는 데이터 형식으로 리턴
    return {
        "posts": posts,
        "total_pages": total_pages,
        "current_page": page,
        "total_count": total_count  # 역순 번호 매기기를 위해 프론트로 전달!
    }