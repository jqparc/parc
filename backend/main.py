# main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from routers import index # 마스터 라우터 하나만 임포트
from db.database import engine
from models import Base

Base.metadata.create_all(bind=engine)

origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:8000", 
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

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False, 
            "message": exc.detail, 
            "data": None
        },
    )

# 예상치 못한 서버 내부 에러 (500)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # 실제 운영 시에는 에러 로깅을 추가해야 합니다 (예: Sentry, Python logging)
    print(f"서버 에러 발생: {exc}") 
    return JSONResponse(
        status_code=500,
        content={
            "success": False, 
            "message": "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", 
            "error": str(exc) # 개발 중에만 보이게 하거나 나중에 숨길 수 있습니다.
        },
    )

app.include_router(index.router)