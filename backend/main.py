# main.py
from fastapi import FastAPI
from core.middleware import add_cors_middleware
from core.exceptions import add_exception_handlers

from api.v1.api_router import api_v1_router # 통합 라우터 임포트

from db.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Parc API Server")

# 1. CORS 미들웨어 적용
add_cors_middleware(app)

# 2. 예외 처리 핸들러 적용
add_exception_handlers(app)

app.include_router(api_v1_router, prefix="/api/v1")
