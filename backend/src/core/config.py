from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_ROOT / ".env", extra="ignore")
    app_name: str = "Ideally API"
    log_level: str = "INFO"
    database_url: str = f"sqlite:///{BACKEND_ROOT / 'ideally.db'}"
    google_api_key: SecretStr = Field(
        default=SecretStr(""), validation_alias=AliasChoices("GOOGLE_API_KEY", "GEMINI_API_KEY")
    )
    tavily_api_key: SecretStr = SecretStr("")
    gemini_model: str = "gemini-3.8-flash"
    gemini_fallback_model: str = "gemini-3.1-flash-lite"
    agent_timeout_seconds: int = Field(default=120, ge=1, le=600)
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    max_history_messages: int = Field(default=40, ge=2, le=200)


@lru_cache
def get_settings() -> Settings:
    return Settings()
