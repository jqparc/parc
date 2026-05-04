import logging
import asyncio
from async_lru import alru_cache
from clients.economy_client import EconomyClient

logger = logging.getLogger(__name__)

class EconomyService:
    def __init__(self):
        self.client = EconomyClient()
        # 확장성을 고려해 관리할 지표들을 딕셔너리로 관리합니다.
        self.target_indicators = {
            "^GSPC": {"name": "S&P 500", "unit": "pt"},
            "^IXIC": {"name": "나스닥", "unit": "pt"},
            "^DJI": {"name": "다우존스", "unit": "pt"},
            "^VIX": {"name": "공포지수(VIX)", "unit": "pt"},
            "^KS11": {"name": "KOSPI", "unit": "pt"},
            "^KQ11": {"name": "KOSDAQ", "unit": "pt"},
            "KRW=X": {"name": "원/달러 환율", "unit": "KRW"},
            "DX-Y.NYB": {"name": "달러 인덱스", "unit": "pt"},
            "EURUSD=X": {"name": "유로/달러", "unit": "USD"},
            "JPY=X": {"name": "엔/달러", "unit": "JPY"},
            "DX-Y.NYB": {"name": "달러 인덱스", "unit": "pt"},
            "^TNX": {"name": "미국 10년 국채금리", "unit": "%"},
            "^IRX": {"name": "미국 3개월 국채금리", "unit": "%"},
            "GC=F": {"name": "금", "unit": "USD"},
            "CL=F": {"name": "WTI 원유", "unit": "USD"},
            "SI=F": {"name": "은", "unit": "USD"},
        }

    @alru_cache(maxsize=1, ttl=3600)
    async def get_summaries(self) -> dict:
        """표(Table)를 그리기 위한 모든 지표의 요약 데이터를 병렬로 가져옵니다."""
        async def fetch_single_summary(symbol, info):
            try:
                hist = await self.client.fetch_history(symbol, period="5d")
                if len(hist) >= 2:
                    # 최근 영업일 데이터
                    current_row = hist.iloc[-1]
                    current_date = hist.index[-1].strftime("%Y-%m-%d")
                    current_val = float(current_row['Close'])
                    # 전 영업일 데이터
                    prev_row = hist.iloc[-2]
                    prev_date = hist.index[-2].strftime("%Y-%m-%d")
                    prev_val = float(prev_row['Close'])
                    
                    # 등락 계산
                    change = current_val - prev_val
                    change_rate = (change / prev_val) * 100
                    
                    return {
                        "symbol": symbol,
                        "name": info["name"],
                        "unit": info["unit"],
                        "current_value": round(current_val, 2),
                        "current_date": current_date,
                        "previous_value": round(prev_val, 2),
                        "previous_date": prev_date,
                        "change": round(change, 2),
                        "change_rate": round(change_rate, 2)
                    }
            except Exception as e:
                logger.error(f"{symbol} 요약 데이터 수집 오류: {e}")
            return None

        # asyncio.gather를 사용해 여러 지표를 동시에(병렬로) 수집합니다.
        tasks = [fetch_single_summary(sym, info) for sym, info in self.target_indicators.items()]
        results = await asyncio.gather(*tasks)
        
        # 에러 난 항목(None)은 제외하고 반환
        valid_summaries = [res for res in results if res is not None]
        return {"summaries": valid_summaries}

    @alru_cache(maxsize=10, ttl=3600)
    async def get_history(self, symbol: str) -> dict:
        """차트(Chart)를 그리기 위한 단일 지표의 1년 치 데이터를 가져옵니다."""
        history_list = []
        try:
            hist = await self.client.fetch_history(symbol, period="1y")
            for date, row in hist.iterrows():
                history_list.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "value": round(row['Close'], 2)
                })
        except Exception as e:
            logger.error(f"{symbol} 히스토리 데이터 수집 오류: {e}")

        return {
            "symbol": symbol,
            "history": history_list
        }

economy_service = EconomyService()