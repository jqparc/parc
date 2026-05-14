from async_lru import alru_cache

from client.economy_client import EconomyClient
from .history import get_indicator_history
from .summary import get_indicator_summaries


class IndicatorService:
    def __init__(self, client: EconomyClient | None = None):
        self.client = client or EconomyClient()

    @alru_cache(maxsize=1, ttl=3600)
    async def get_summaries(self) -> dict:
        return await get_indicator_summaries(self.client)

    @alru_cache(maxsize=10, ttl=3600)
    async def get_history(self, symbol: str) -> dict:
        return await get_indicator_history(self.client, symbol)
