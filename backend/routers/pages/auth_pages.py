# routers/pages.py
from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates


router = APIRouter(tags=["Page_Auth"])
templates = Jinja2Templates(directory="../frontend")

# 회원가입 화면 (signup.html)
@router.get("/signup")
async def read_signup(request: Request):
    return templates.TemplateResponse(request=request, name="pages/auth/signup.html")

@router.get("/login")
async def read_signup(request: Request):
    return templates.TemplateResponse(request=request, name="pages/auth/login.html")