
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings

def add_cors_middleware(app: FastAPI):

    # 1. CORS 보안 설정
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.FRONTEND_URL,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )