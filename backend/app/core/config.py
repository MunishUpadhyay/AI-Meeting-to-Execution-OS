from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "AI Meeting-to-Execution OS"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "sqlite:///./meeting_execution.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
