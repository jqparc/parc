# backend/crud/user_crud.py
from sqlalchemy.orm import Session
from models.user_model import User
from schemas.user_schema import UserCreate

# 1. 아이디로 유저 찾기 (중복 체크 및 로그인 시 사용)
def get_user_by_user_id(db: Session, user_id: str):
    return db.query(User).filter(User.user_id == user_id).first()

# ⭐ 닉네임으로 유저 찾기 (중복 검사용)
def get_user_by_nickname(db: Session, nickname: str):
    return db.query(User).filter(User.nickname == nickname).first()

# 2. 새로운 유저 생성
def create_user(db: Session, user_data: UserCreate, hashed_password: str):
    db_user = User(
        user_id=user_data.user_id,
        password=hashed_password,
        nickname=user_data.nickname,
        phone=user_data.phone,
        # 기본값들이 모델에 설정되어 있으므로 필요한 것만 넣습니다.
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# 3. (추가 가능) 유저 삭제, 정보 수정 등...