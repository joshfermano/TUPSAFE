"""Application settings using Pydantic BaseSettings."""

from typing import List
from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class RateLimitSettings(BaseSettings):
    """Rate limiting configuration."""

    # Enable/disable rate limiting
    ENABLED: bool = Field(True, description="Enable rate limiting")

    # Per-user limits by role (requests per minute)
    ADMIN_RATE_LIMIT_PER_MINUTE: int = Field(60, description="Admin requests per minute")
    ADMIN_RATE_LIMIT_PER_HOUR: int = Field(2000, description="Admin requests per hour")

    HR_RATE_LIMIT_PER_MINUTE: int = Field(40, description="HR requests per minute")
    HR_RATE_LIMIT_PER_HOUR: int = Field(1500, description="HR requests per hour")

    CO_ADMIN_RATE_LIMIT_PER_MINUTE: int = Field(30, description="Co-admin requests per minute")
    CO_ADMIN_RATE_LIMIT_PER_HOUR: int = Field(1000, description="Co-admin requests per hour")

    # Token/cost limits
    MAX_TOKENS_PER_REQUEST: int = Field(4000, description="Max tokens per single request")
    MAX_TOKENS_PER_USER_PER_DAY: int = Field(100000, description="Max tokens per user per day")
    MAX_COST_PER_USER_PER_DAY: float = Field(10.0, description="Max cost ($) per user per day")

    # Streaming limits
    MAX_STREAMING_DURATION_SECONDS: int = Field(300, description="Max streaming duration")

    model_config = SettingsConfigDict(
        env_prefix="RATE_LIMIT_",
        env_file=".env",
        extra="ignore",
    )


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "TUPSAFE AI Agent"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Supabase (Required)
    SUPABASE_URL: str = Field(..., description="Supabase project URL")
    SUPABASE_ANON_KEY: str = Field(..., description="Supabase anonymous key")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(..., description="Supabase service role key")
    SUPABASE_JWT_SECRET: str = Field(..., description="Supabase JWT secret")

    # LLM Providers (Optional)
    OPENAI_API_KEY: str | None = Field(None, description="OpenAI API key")
    OPENROUTER_API_KEY: str | None = Field(None, description="OpenRouter API key")
    GOOGLE_API_KEY: str | None = Field(None, description="Google AI API key")
    GROQ_API_KEY: str | None = Field(None, description="Groq API key")

    # LLM Configuration
    DEFAULT_LLM_PROVIDER: str = Field(
        "openrouter",
        description="Default LLM provider (openai, openrouter, google, groq)",
    )
    DEFAULT_LLM_MODEL: str = Field(
        "anthropic/claude-sonnet-4",
        description="Default LLM model identifier",
        validation_alias=AliasChoices("DEFAULT_LLM_MODEL", "DEFAULT_MODEL"),
    )

    # Redis
    REDIS_URL: str = Field(
        "redis://localhost:6379",
        description="Redis connection URL for caching and rate limiting",
    )

    # CORS
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:3001"],
        description="Allowed CORS origins",
    )

    # Rate Limiting (nested settings)
    rate_limits: RateLimitSettings = Field(default_factory=RateLimitSettings)

    # Server
    HOST: str = Field("0.0.0.0", description="Server host")
    PORT: int = Field(8000, description="Server port")

    # Logging
    LOG_LEVEL: str = Field("INFO", description="Logging level")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse ALLOWED_ORIGINS from JSON array, comma-separated string, or list."""
        import json
        if isinstance(v, str):
            # Try to parse as JSON first
            v = v.strip()
            if v.startswith("["):
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    pass
            # Fall back to comma-separated
            return [origin.strip() for origin in v.split(",")]
        return v

    @field_validator("LOG_LEVEL", mode="before")
    @classmethod
    def normalize_log_level(cls, v):
        """Normalize LOG_LEVEL to uppercase."""
        if isinstance(v, str):
            return v.upper()
        return v

    @field_validator("DEFAULT_LLM_PROVIDER")
    @classmethod
    def validate_llm_provider(cls, v):
        """Validate LLM provider is supported."""
        allowed_providers = {"openai", "openrouter", "google", "groq"}
        if v not in allowed_providers:
            raise ValueError(
                f"Invalid LLM provider: {v}. Must be one of {allowed_providers}"
            )
        return v

    def get_api_key_for_provider(self, provider: str) -> str | None:
        """Get API key for the specified provider."""
        key_mapping = {
            "openai": self.OPENAI_API_KEY,
            "openrouter": self.OPENROUTER_API_KEY,
            "google": self.GOOGLE_API_KEY,
            "groq": self.GROQ_API_KEY,
        }
        return key_mapping.get(provider)

    def validate_llm_config(self) -> bool:
        """Validate that at least one LLM provider is configured."""
        has_provider = any(
            [
                self.OPENAI_API_KEY,
                self.OPENROUTER_API_KEY,
                self.GOOGLE_API_KEY,
                self.GROQ_API_KEY,
            ]
        )
        if not has_provider:
            raise ValueError(
                "At least one LLM provider API key must be configured"
            )
        return True


# Global settings instance
settings = Settings()
