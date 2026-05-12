import logging

from clients.economy_client import EconomyClient

logger = logging.getLogger(__name__)


def build_indicator_history(symbol: str, history) -> dict:
    rows = []
    if history is not None:
        for date, row in history.iterrows():
            rows.append(
                {
                    "date": date.strftime("%Y-%m-%d"),
                    "value": round(row["Close"], 2),
                }
            )
    return {"symbol": symbol, "history": rows}


async def get_indicator_history(client: EconomyClient, symbol: str) -> dict:
    try:
        history = await client.fetch_history(symbol, period="1y")
    except Exception as exc:
        logger.error("Failed to fetch economy history for %s: %s", symbol, exc)
        history = None

    return build_indicator_history(symbol, history)
