# backend/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # JWT Auth 관련 설정
    SECRET_KEY: str = "fallback_secret_key_for_development_only"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # DB 관련 설정
    DATABASE_URL: str = "sqlite:///./parc.db"
    
    class Config:
        env_file = ".env"

# settings 인스턴스를 생성해 다른 파일에서 재사용합니다.
settings = Settings()