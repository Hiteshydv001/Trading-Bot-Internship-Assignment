import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

class Settings(BaseSettings):
    # Pydantic-settings will automatically load from environment variables
    # with these names.
    BINANCE_API_KEY: str
    BINANCE_API_SECRET: str
    BINANCE_FUTURES_TESTNET_URL: str = "https://testnet.binancefuture.com"
    CORS_ALLOWED_ORIGINS: str = "http://localhost,http://localhost:3000"

    # Define model_config for pydantic_settings
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]

settings = Settings()