from fastapi import Depends
from sqlalchemy.orm import Session
from db.database import get_db
from services.user_service import UserService
# from services.post_service import PostService # Post 도메인도 있다면 추가

# User 서비스를 주입하기 위한 전용 의존성 함수
def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)

# Post 서비스를 주입하기 위한 전용 의존성 함수
# def get_post_service(db: Session = Depends(get_db)):
#     return PostService(db)