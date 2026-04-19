# routers/pages.py
from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from utils.nav_helper import get_nav_context


router = APIRouter(tags=["Page_Economy"])
templates = Jinja2Templates(directory="../frontend")

@router.get("/indicators")
async def read_economy(request: Request):
    context = get_nav_context(active_top="economy", active_dtl="indicators")
    context["request"] = request
    return templates.TemplateResponse(request=request, 
                                      name="pages/economy/indicators.html",
                                      context=context)

@router.get("/infos")
async def read_economy(request: Request):
    context = get_nav_context(active_top="economy", active_dtl="indicators")
    context["request"] = request
    return templates.TemplateResponse(request=request, 
                                      name="pages/economy/infos.html",
                                      context=context)

@router.get("/news")
async def read_economy(request: Request):
    context = get_nav_context(active_top="economy", active_dtl="indicators")
    context["request"] = request
    return templates.TemplateResponse(request=request, 
                                      name="pages/economy/news.html",
                                      context=context)