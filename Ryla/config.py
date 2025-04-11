from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    environment: str = "development"
    host: str = "localhost"
    port: int = 8000
    firebase_credentials_path: str = r"..\Ryla\Firebase_connection.json"
    firebase_database_url: str = "https:"
    model_cache_dir: str = "./model_cache"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()