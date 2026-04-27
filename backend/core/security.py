# backend/core/security.py
import os
from fastapi import Request, HTTPException, Depends
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from db.database import get_db
from dotenv import load_dotenv
from passlib.context import CryptContext
from datetime import datetime, timedelta

from models.user_model import User
from repositories import user_repository

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key_for_development_only")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # 30분 뒤면 만료되는 팔찌

# Bcrypt 알고리즘을 사용하겠다고 설정합니다.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 1. 평문 비밀번호를 해시(다진 고기)로 만들어주는 함수
def get_password_hash(password: str):
    return pwd_context.hash(password)

# 2. 나중에 로그인할 때, 입력한 비밀번호가 맞는지 확인해 주는 함수
def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire}) # 만료 시간 도장 찍기
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")
    if not token:
        # 로그인이 안 되어 있으면 에러를 던짐
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    try:
        token = token.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="인증 실패")
            
        # DB에서 실제 유저를 찾아서 반환
        user = user_repository.get_user_by_user_id(db, user_id=user_id)
        if user is None:
            raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다.")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="토큰이 유효하지 않습니다.")