from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Application
    environment: Literal["development", "staging", "production", "test"] = "development"
    app_name: str = "cultura"
    app_version: str = "0.1.0"
    log_level: str = "INFO"

    # Database (PostgreSQL 16 + pgvector)
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5434/cultura"
    database_sync_url: str = "postgresql://postgres:postgres@localhost:5434/cultura"
    db_pool_size: int = 20
    db_max_overflow: int = 10
    db_pool_timeout: int = 30

    # Security & CORS
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )
    jwt_secret: str = "development-secret-key-change-in-production-min-32-chars"
    allowed_hosts: list[str] = Field(default_factory=lambda: ["localhost", "127.0.0.1"])

    # Qloo API
    qloo_api_key: str = ""
    qloo_base_url: str = "https://hackathon.api.qloo.com"
    qloo_timeout_seconds: int = 30
    qloo_max_retries: int = 3

    # TypeSafe / Jev Decision Engine
    jev_api_key: str = ""
    jev_base_url: str = "https://api.typesafe.ai"
    jev_timeout_seconds: int = 15
    jev_enable_fallback: bool = True

    # Primary LLM Provider
    llm_provider: str = "openai"
    llm_base_url: str | None = None
    llm_api_key: str = ""
    llm_model: str = "gpt-4o"
    llm_temperature: float = 0.2

    # Embeddings (pgvector semantic memory)
    embedding_provider: str = "openai"
    embedding_model_key: str | None = None
    embedding_model: str = "text-embedding-3-small"
    embedding_dimension: int = 1536

    # LangSmith Observability
    langsmith_tracing: bool = False
    langsmith_endpoint: str = "https://api.smith.langchain.com"
    langsmith_api_key: str = ""
    langsmith_project: str = "cultura-dev"

    # Firebase Authentication
    firebase_project_id: str = ""
    firebase_client_email: str = ""
    firebase_private_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
