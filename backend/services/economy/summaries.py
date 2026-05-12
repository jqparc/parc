import asyncio
import logging

from clients.economy_client import EconomyClient
from .indicators import TARGET_INDICATORS

logger = logging.getLogger(__name__)


def build_indicator_summary(symbol: str, info: dict, history) -> dict | None:
    if history is None or len(history) < 2:
        return None

    current_row = history.iloc[-1]
    previous_row = history.iloc[-2]
    current_value = float(current_row["Close"])
    previous_value = float(previous_row["Close"])
    change = current_value - previous_value
    change_rate = (change / previous_value) * 100 if previous_value else 0

    return {
        "symbol": symbol,
        "name": info["name"],
        "unit": info["unit"],
        "current_value": round(current_value, 2),
        "current_date": history.index[-1].strftime("%Y-%m-%d"),
        "previous_value": round(previous_value, 2),
        "previous_date": history.index[-2].strftime("%Y-%m-%d"),
        "change": round(change, 2),
        "change_rate": round(change_rate, 2),
    }


async def fetch_indicator_summary(client: EconomyClient, symbol: str, info: dict) -> dict | None:
    try:
        history = await client.fetch_history(symbol, period="5d")
        return build_indicator_summary(symbol, info, history)
    except Exception as exc:
        logger.error("Failed to fetch economy summary for %s: %s", symbol, exc)
        return None


async def get_indicator_summaries(client: EconomyClient) -> dict:
    tasks = [
        fetch_indicator_summary(client, symbol, info)
        for symbol, info in TARGET_INDICATORS.items()
    ]
    results = await asyncio.gather(*tasks)
    return {"summaries": [result for result in results if result is not None]}
