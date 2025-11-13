"""Configuration helpers for the backend service."""

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    api_prefix: str = Field(default="/api")
    cors_origins: List[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"])
    openai_api_key: str | None = None

    class Config:
        env_file = Path(__file__).resolve().parent.parent / ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
