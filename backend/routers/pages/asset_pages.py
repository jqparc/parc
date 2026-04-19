# routers/pages.py
from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from utils.nav_helper import get_nav_context


router = APIRouter(tags=["Page_Asset"])
templates = Jinja2Templates(directory="../frontend")

@router.get("/portfolio")
async def read_economy(request: Request):
    context = get_nav_context(active_top="asset", active_dtl="portfolio")
    context["request"] = request
    return templates.TemplateResponse(request=request, 
                                      name="pages/asset/portfolio.html",
                                      context=context)
