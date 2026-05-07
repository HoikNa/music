from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./dev.db"
    jwt_secret: str = "dev-secret-change-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    jwt_refresh_expire_days: int = 7
    environment: str = "development"
    sentry_dsn: str | None = None
    cors_origins: str = "http://localhost:3000"
    aws_region: str = "ap-northeast-2"
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    s3_bucket_name: str = "vertualowl-audio"
    redis_url: str = "redis://localhost:6379/0"
    anthropic_api_key: str | None = None
    stale_submission_timeout_minutes: int = 10
    rate_limit_login_per_minute: int = 10
    rate_limit_register_per_minute: int = 5

    class Config:
        env_file = ".env"

    @property
    def cors_origins_list(self) -> list[str]:
        origins = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        if self.environment == "production":
            origins = [o for o in origins if "localhost" not in o and "127.0.0.1" not in o]
        return origins

    @property
    def s3_bucket(self) -> str:
        return self.s3_bucket_name


settings = Settings()

if settings.environment == "production" and settings.jwt_secret == "dev-secret-change-in-prod":
    raise RuntimeError("JWT_SECRET must be set to a secure value in production")
