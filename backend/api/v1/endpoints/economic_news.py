from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from core.config import settings
from db.database import get_db
from models.economic_news_model import EconomicNews
from schemas.economic_news_schema import EconomicNewsListResponse, EconomicNewsResponse
from services.economic_news_collector import (
    collect_economic_news,
    configured_categories,
    is_newsapi_configured,
)

router = APIRouter()


@router.get("", response_model=EconomicNewsListResponse)
def get_economic_news(
    category: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(EconomicNews)
    if category and category != "all":
        query = query.filter(EconomicNews.category == category)

    total = query.count()
    items = (
        query.order_by(EconomicNews.published_at.desc(), EconomicNews.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    categories = [
        row[0]
        for row in db.query(EconomicNews.category)
        .distinct()
        .order_by(EconomicNews.category.asc())
        .all()
    ]
    return {"items": items, "total": total, "categories": categories}


@router.get("/collector/status")
def get_economic_news_collector_status():
    return {
        "configured": is_newsapi_configured(),
        "country": settings.NEWSAPI_COUNTRY,
        "categories": configured_categories(),
        "query": settings.NEWSAPI_QUERY,
    }


@router.post("/collect")
def collect_economic_news_now():
    if not is_newsapi_configured():
        raise HTTPException(status_code=500, detail="NEWSAPI_API_KEY is not configured.")

    inserted = collect_economic_news()
    return {"success": True, "inserted": inserted}


@router.get("/{news_id}", response_model=EconomicNewsResponse)
def get_economic_news_detail(news_id: int, db: Session = Depends(get_db)):
    news = db.query(EconomicNews).filter(EconomicNews.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="News not found.")
    return news
