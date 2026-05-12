import asyncio

import pandas as pd
import yfinance as yf


class EconomyClient:
    async def fetch_history(self, symbol: str, period: str = "5d") -> pd.DataFrame:
        def get_data():
            ticker = yf.Ticker(symbol)
            return ticker.history(period=period)

        return await asyncio.to_thread(get_data)
