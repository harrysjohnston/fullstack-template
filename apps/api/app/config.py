"""Application settings and configuration."""

import json

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors_origins(value: str | list[str]) -> list[str]:
    """Parse CORS origins from string (comma-separated or JSON) or list."""
    if isinstance(value, list):
        return value
    if not value:
        return ["http://localhost:3000"]
    # Try JSON first
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return parsed
    except (json.JSONDecodeError, TypeError):
        pass
    # Fall back to comma-separated
    return [origin.strip() for origin in value.split(",") if origin.strip()]


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application metadata
    app_name: str = Field(default="fullstack-template API", description="Application name")
    app_version: str = Field(default="0.0.0", description="Application version")
    app_description: str = Field(
        default="FastAPI + SQLModel API scaffold for the fullstack template",
        description="Application description",
    )
    environment: str = Field(
        default="development",
        description="Environment (development, staging, production)",
    )

    # API server settings
    api_host: str = Field(default="0.0.0.0", description="API server host")
    api_port: int = Field(default=8000, description="API server port")

    # CORS settings
    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000"],
        description="Allowed CORS origins (comma-separated string or JSON array)",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def validate_cors_origins(cls, value: str | list[str]) -> list[str]:
        """Parse CORS origins from various formats."""
        return parse_cors_origins(value)

    # JWT settings
    jwt_secret: str = Field(
        default="dev-change-me",
        description="JWT signing secret (MUST be changed in production)",
    )
    jwt_issuer: str = Field(
        default="fullstack-template",
        description="JWT issuer claim",
    )
    jwt_audience: str = Field(
        default="fullstack-template",
        description="JWT audience claim",
    )
    jwt_algorithm: str = Field(default="HS256", description="JWT signing algorithm")
    jwt_access_token_expire_minutes: int = Field(
        default=30,
        description="JWT access token expiration in minutes",
    )

    # Database settings (for future use)
    database_url: str | None = Field(
        default=None,
        description="PostgreSQL database URL",
    )

    # Logging
    log_level: str = Field(
        default="INFO",
        description="Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)",
    )

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment.lower() == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() == "production"

    @property
    def openapi_url(self) -> str | None:
        """OpenAPI docs URL (disabled in production)."""
        return None if self.is_production else "/openapi.json"

    @property
    def docs_url(self) -> str | None:
        """Swagger UI docs URL (disabled in production)."""
        return None if self.is_production else "/docs"

    @property
    def redoc_url(self) -> str | None:
        """ReDoc docs URL (disabled in production)."""
        return None if self.is_production else "/redoc"


# Global settings instance
settings = Settings()
