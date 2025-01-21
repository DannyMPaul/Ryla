from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    firebase_credentials_path: str
    firebase_database_url: str
    model_cache_dir: str
    port: int
    host: str
    environment: str

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()