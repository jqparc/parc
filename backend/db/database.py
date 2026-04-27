# db/database.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

load_dotenv()

# 1. 데이터베이스 파일 주소 
# (이 코드를 실행하면 프로젝트 최상위 폴더에 'parc.db'라는 파일이 자동으로 생깁니다!)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./parc.db")

# 2. 파이썬과 DB를 연결해주는 '엔진(통신 케이블)'
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 3. DB에 접속하는 '세션(출입증)' 만들기
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. 우리가 만들 모든 DB 테이블(표)들의 '기본 뼈대'
class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()