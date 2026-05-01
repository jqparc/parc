# main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.v1.api_router import api_v1_router # 통합 라우터 임포트

from db.database import engine
from models import Base

Base.metadata.create_all(bind=engine)

origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]

app = FastAPI(title="Parc API Server")

# 1. CORS 보안 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    모든 HTTPException을 프론트엔드가 이해하기 쉬운 
    {"success": False, "message": "..."} 형태로 변환해서 응답합니다.
    """
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
    print(f"서버 에러 발생: {exc}") 
    return JSONResponse(
        status_code=500,
        content={
            "success": False, 
            "message": "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", 
            "error": str(exc) # 개발 중에만 활성화
        },
    )

app.include_router(api_v1_router, prefix="/api/v1")