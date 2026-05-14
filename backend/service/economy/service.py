from client.economy_client import EconomyClient
from .indicator_service import IndicatorService


class EconomyService:
    def __init__(self, client: EconomyClient | None = None):
        self.client = client or EconomyClient()
        self.indicators = IndicatorService(self.client)

    async def get_summaries(self) -> dict:
        return await self.indicators.get_summaries()

    async def get_history(self, symbol: str) -> dict:
        return await self.indicators.get_history(symbol)


economy_service = EconomyService()
