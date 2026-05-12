from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str
    DATABASE_URL: str
    OPEN_API_KEY: str | None = None

    ACCESS_TOKEN_EXPIRE_MINUTES: int
    FRONTEND_URL: str
    COOKIE_SECURE: bool
    COOKIE_SAMESITE: str

    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", env_file_encoding="utf-8")


settings = Settings()
