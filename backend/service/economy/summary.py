import asyncio
import logging

from client.economy_client import EconomyClient
from .catalog import IndicatorDefinition, get_indicator_definitions

logger = logging.getLogger(__name__)


def build_indicator_summary(definition: IndicatorDefinition, history) -> dict | None:
    if history is None or len(history) < 2:
        return None

    current_row = history.iloc[-1]
    previous_row = history.iloc[-2]
    current_value = float(current_row["Close"])
    previous_value = float(previous_row["Close"])
    change = current_value - previous_value
    change_rate = (change / previous_value) * 100 if previous_value else 0

    return {
        "symbol": definition.symbol,
        "name": definition.name,
        "unit": definition.unit,
        "current_value": round(current_value, 2),
        "current_date": history.index[-1].strftime("%Y-%m-%d"),
        "previous_value": round(previous_value, 2),
        "previous_date": history.index[-2].strftime("%Y-%m-%d"),
        "change": round(change, 2),
        "change_rate": round(change_rate, 2),
    }


async def fetch_indicator_summary(client: EconomyClient, definition: IndicatorDefinition) -> dict | None:
    try:
        history = await client.fetch_history(definition.symbol, period="5d")
        return build_indicator_summary(definition, history)
    except Exception as exc:
        logger.error("Failed to fetch economy summary for %s: %s", definition.symbol, exc)
        return None


async def get_indicator_summaries(client: EconomyClient) -> dict:
    tasks = [
        fetch_indicator_summary(client, definition)
        for definition in get_indicator_definitions().values()
    ]
    results = await asyncio.gather(*tasks)
    return {"summaries": [result for result in results if result is not None]}
