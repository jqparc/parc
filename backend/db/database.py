# db/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from core.config import settings

# 1. 데이터베이스 파일 주소 
# (이 코드를 실행하면 프로젝트 최상위 폴더에 'parc.db'라는 파일이 자동으로 생깁니다!)
# SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./parc.db")

# 2. 파이썬과 DB를 연결해주는 '엔진(통신 케이블)'
engine = create_engine(
    settings.DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

# 3. DB에 접속하는 '세션(출입증)' 만들기
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()