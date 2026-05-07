try:
    from apscheduler.schedulers.background import BackgroundScheduler
except ModuleNotFoundError:
    BackgroundScheduler = None

from core.config import settings
from services.economic_news_collector import collect_economic_news

news_scheduler = BackgroundScheduler(timezone="UTC") if BackgroundScheduler else None


def start_news_scheduler() -> None:
    if news_scheduler is None:
        print("[economic-news] APScheduler is not installed. Scheduler skipped.")
        return

    if not settings.NEWSAPI_API_KEY:
        print("[economic-news] NEWSAPI_API_KEY is not set. Scheduler skipped.")
        return

    if news_scheduler.running:
        return

    news_scheduler.add_job(
        collect_economic_news,
        "interval",
        minutes=settings.NEWS_COLLECTION_INTERVAL_MINUTES,
        id="collect_economic_news",
        replace_existing=True,
        max_instances=1,
    )
    news_scheduler.start()
    collect_economic_news()


def stop_news_scheduler() -> None:
    if news_scheduler and news_scheduler.running:
        news_scheduler.shutdown(wait=False)
