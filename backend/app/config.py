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

    class Config:
        env_file = ".env"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def s3_bucket(self) -> str:
        return self.s3_bucket_name


settings = Settings()
