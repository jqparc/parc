#core/exceptions.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

def add_exception_handlers(app: FastAPI):
    
    # 1. 커스텀 HTTP 에러 처리
    @app.exception_handler(StarletteHTTPException)
    async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False, 
                "message": exc.detail, 
                "data": None
            },
        )

    # 2. 예상치 못한 서버 내부 에러 (500) 처리
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