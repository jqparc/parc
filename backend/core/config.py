from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[1]

class Settings(BaseSettings):
    SECRET_KEY: str 
    ALGORITHM: str 
    DATABASE_URL: str 
    NEWSAPI_API_KEY: str | None = None
    NEWSAPI_COUNTRY: str = "kr"
    NEWSAPI_CATEGORIES: str = "business"
    NEWSAPI_PAGE_SIZE: int = 50
    NEWS_COLLECTION_INTERVAL_MINUTES: int = 10
    NEWSAPI_QUERY: str | None = "경제 OR 금융 OR 증시 OR 환율 OR 금리"
    OPEN_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str = "gpt-5.2"
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    
    # 새로 추가된 속성
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    FRONTEND_URL: str 
    COOKIE_SECURE: bool
    COOKIE_SAMESITE: str

    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", env_file_encoding="utf-8")

settings = Settings()
