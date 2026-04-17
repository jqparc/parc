# routers/pages.py
from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates

# 화면 전용 라우터 생성
router = APIRouter()

# 템플릿(HTML)들이 모여있는 폴더 지정
templates = Jinja2Templates(directory="../frontend")

# 메인 화면 (base.html)
@router.get("/")
async def read_index(request: Request):
    return templates.TemplateResponse(request=request, name="base.html")

# 회원가입 화면 (signup.html)
@router.get("/signup")
async def read_signup(request: Request):
    return templates.TemplateResponse(request=request, name="pages/auth/signup.html")

# (나중에 로그인 화면이 생기면 여기에 추가하면 됩니다!)