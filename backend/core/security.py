# core/security.py
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt 

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