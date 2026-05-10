from datetime import datetime, timezone
import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.config import settings
from db.database import SessionLocal
from models.economic_news_model import EconomicNews


NEWSAPI_TOP_HEADLINES_URL = "https://newsapi.org/v2/top-headlines"
NEWSAPI_EVERYTHING_URL = "https://newsapi.org/v2/everything"


def parse_newsapi_datetime(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def configured_categories() -> list[str]:
    return [
        category.strip()
        for category in settings.NEWSAPI_CATEGORIES.split(",")
        if category.strip()
    ] or ["business"]


def is_newsapi_configured() -> bool:
    return bool(settings.NEWSAPI_API_KEY)


def fetch_newsapi_everything_articles() -> list[dict]:
    query = (settings.NEWSAPI_QUERY or "").strip()
    if not settings.NEWSAPI_API_KEY or not query:
        return []

    params = {
        "q": query,
        "sortBy": "publishedAt",
        "pageSize": settings.NEWSAPI_PAGE_SIZE,
    }
    url = f"{NEWSAPI_EVERYTHING_URL}?{urlencode(params)}"
    request = Request(url, headers={"X-Api-Key": settings.NEWSAPI_API_KEY})

    try:
        with urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"[economic-news] NewsAPI everything fetch failed: {exc}")
        return []

    if payload.get("status") != "ok":
        print(f"[economic-news] NewsAPI everything returned error: {payload}")
        return []

    return payload.get("articles", [])


def fetch_newsapi_articles(category: str) -> list[dict]:
    if not settings.NEWSAPI_API_KEY:
        return []

    params = {
        "country": settings.NEWSAPI_COUNTRY,
        "category": category,
        "pageSize": settings.NEWSAPI_PAGE_SIZE,
    }
    url = f"{NEWSAPI_TOP_HEADLINES_URL}?{urlencode(params)}"
    request = Request(url, headers={"X-Api-Key": settings.NEWSAPI_API_KEY})

    try:
        with urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"[economic-news] NewsAPI fetch failed for {category}: {exc}")
        return []

    if payload.get("status") != "ok":
        print(f"[economic-news] NewsAPI returned error: {payload}")
        return []

    articles = payload.get("articles", [])
    if articles:
        return articles

    return fetch_newsapi_everything_articles()


def build_news_record(article: dict, category: str) -> EconomicNews | None:
    title = (article.get("title") or "").strip()
    original_url = (article.get("url") or "").strip()
    if not title or not original_url:
        return None

    source = article.get("source") or {}
    return EconomicNews(
        title=title[:300],
        summary=article.get("description"),
        content=article.get("content"),
        source=(source.get("name") or "Unknown")[:120],
        category=category,
        original_url=original_url,
        published_at=parse_newsapi_datetime(article.get("publishedAt")),
        thumbnail=article.get("urlToImage"),
    )


def save_articles(db: Session, category: str, articles: list[dict]) -> int:
    inserted = 0
    for article in articles:
        news = build_news_record(article, category)
        if not news:
            continue

        exists = (
            db.query(EconomicNews.id)
            .filter(EconomicNews.original_url == news.original_url)
            .first()
        )
        if exists:
            continue

        db.add(news)
        try:
            db.commit()
            inserted += 1
        except IntegrityError:
            db.rollback()

    return inserted


def collect_economic_news() -> int:
    db = SessionLocal()
    try:
        total_inserted = 0
        for category in configured_categories():
            articles = fetch_newsapi_articles(category)
            total_inserted += save_articles(db, category, articles)
        return total_inserted
    finally:
        db.close()
