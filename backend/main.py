# main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from routers import index # 마스터 라우터 하나만 임포트
from db.database import engine
from models import Base
Base.metadata.create_all(bind=engine)

origins = [
    "http://127.0.0.1:8000"  # Live Server 사용 시
]

app = FastAPI()

# 1. CORS 보안 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. 정적 파일 (CSS, JS) 연결
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

# 3. 각 부서(라우터)들 등록하기 ⭐
app.include_router(index.router)