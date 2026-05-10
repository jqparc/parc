# db/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import settings

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