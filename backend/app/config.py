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
    openai_api_key: str | None = None
    feedback_provider: str = "openai"
    feedback_model: str = "gpt-4.1-mini"
    feedback_tts_model: str = "gpt-4o-mini-tts"
    feedback_tts_voice: str = "alloy"
    feedback_tts_enabled: bool = True
    lyrics_model: str = "gpt-4.1-mini"
    moderation_model: str = "omni-moderation-latest"
    music_generation_provider: str = "mock"
    mubert_api_key: str | None = None
    mastering_target_lufs: float = -14.0
    validation_strict_mode: bool = False
    acrcloud_host: str | None = None
    acrcloud_access_key: str | None = None
    acrcloud_access_secret: str | None = None
    ai_music_probability_threshold: float = 0.8
    stale_submission_timeout_minutes: int = 10
    rate_limit_login_per_minute: int = 10
    rate_limit_register_per_minute: int = 5
    max_submissions_per_day: int = 10
    abuse_user_submissions_per_hour: int = 5
    abuse_ip_submissions_per_hour: int = 20
    abuse_device_submissions_per_hour: int = 8
    abuse_audio_submissions_per_hour: int = 3

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
