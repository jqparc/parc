# routers/pages.py
from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from utils.nav_helper import get_nav_context

# 화면 전용 라우터 생성
router = APIRouter(tags=["Page_Main"])
# 템플릿(HTML)들이 모여있는 폴더 지정
templates = Jinja2Templates(directory="../frontend")

# 메인 화면 (base.html)
@router.get("/")
async def read_index(request: Request):
    context = get_nav_context(active_top="home", active_dtl="home")
    context["request"] = request
    return templates.TemplateResponse(request=request, 
                                      name="index.html",
                                      context=context)
