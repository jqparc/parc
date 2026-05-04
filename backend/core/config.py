from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SECRET_KEY: str 
    ALGORITHM: str 
    DATABASE_URL: str 
    
    # 새로 추가된 속성
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    FRONTEND_URL: str 
    COOKIE_SECURE: bool
    COOKIE_SAMESITE: str

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()