"""
Application configuration — reads from .env file.
All settings are validated by Pydantic.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # LLM
    google_api_key: str = ""
    openai_api_key: str = ""
    llm_provider: str = "gemini"          # "gemini" | "openai"
    llm_model: str = "gemini-1.5-flash"

    # Speech (optional upgrades)
    elevenlabs_api_key: str = ""
    deepgram_api_key: str = ""
    azure_speech_key: str = ""
    azure_speech_region: str = "eastus"

    # Auth
    jwt_secret_key: str = "change-me-to-a-random-256-bit-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    # Database
    database_url: str = "sqlite+aiosqlite:///./data/voice_assistant.db"

    # Redis (optional)
    redis_url: str = ""

    # Qdrant (optional)
    qdrant_url: str = ""
    qdrant_collection: str = "knowledge_base"

    # App
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    # Features
    enable_analytics: bool = True

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
