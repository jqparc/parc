# core/security.py
from passlib.context import CryptContext

# Bcrypt 알고리즘을 사용하겠다고 설정합니다.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 1. 평문 비밀번호를 해시(다진 고기)로 만들어주는 함수
def get_password_hash(password: str):
    return pwd_context.hash(password)

# 2. 나중에 로그인할 때, 입력한 비밀번호가 맞는지 확인해 주는 함수
def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

# backend/core/security.py 수정
from datetime import datetime, timedelta
from jose import jwt 

SECRET_KEY = "my-very-secret-key" # 절대 외부에 노출되면 안 되는 열쇠!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 # 30분 뒤면 만료되는 팔찌

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire}) # 만료 시간 도장 찍기
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt