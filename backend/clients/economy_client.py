import yfinance as yf
import asyncio
import pandas as pd

class EconomyClient:
    async def fetch_history(self, symbol: str, period: str = "5d") -> pd.DataFrame:
        """
        yfinance를 이용해 특정 심볼의 과거 데이터를 가져옵니다.
        블로킹 함수이므로 스레드 풀에서 실행합니다.
        """
        def _get_data():
            ticker = yf.Ticker(symbol)
            return ticker.history(period=period)
            
        return await asyncio.to_thread(_get_data)