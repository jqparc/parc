# backend/services/user_service.py
from sqlalchemy.orm import Session
from schemas.user_schema import UserCreate, UserLogin
from core.security import get_password_hash, verify_password, create_access_token
from crud import user_crud  # 위에서 만든 crud 가져오기

def create_new_user(db: Session, user_data: UserCreate):
    # 1. 중복 검사 (CRUD 레이어 활용)
    existing_user = user_crud.get_user_by_user_id(db, user_id=user_data.user_id)
    if existing_user:
        return {"success": False, "message": "이미 존재하는 아이디입니다."}
    
    # ⭐ 2. 닉네임 중복 검사 (새로 추가됨!)
    existing_nickname = user_crud.get_user_by_nickname(db, nickname=user_data.nickname)
    if existing_nickname:
        return {"success": False, "message": "이미 사용 중인 닉네임입니다."}
    
    # 2. 비즈니스 로직: 비밀번호 해싱
    hashed_pwd = get_password_hash(user_data.password)
    
    # 3. DB 저장 (CRUD 레이어 활용)
    new_user = user_crud.create_user(db, user_data=user_data, hashed_password=hashed_pwd)
    
    return {"success": True, "message": f"{new_user.user_id}님, 회원가입이 완료되었습니다!"}

def authenticate_user(db: Session, login_data: UserLogin):
    # 1. 유저 찾기 (CRUD 레이어 활용)
    user = user_crud.get_user_by_user_id(db, user_id=login_data.user_id)
    
    # 2. 비즈니스 로직: 비밀번호 검증
    if not user or not verify_password(login_data.password, user.password):
        return {"success": False, "message": "아이디 또는 비밀번호가 올바르지 않습니다."}
    
    # 3. 비즈니스 로직: 토큰 생성
    access_token = create_access_token(data={"sub": user.user_id})
    
    return {
        "success": True, 
        "message": f"{user.nickname}님, 반가워요!", # 로그인 메시지도 닉네임으로!
        "access_token": access_token, 
        "token_type": "bearer"
    }