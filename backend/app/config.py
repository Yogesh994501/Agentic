from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path

class Settings(BaseSettings):
    APP_NAME: str = "SentinelFlow"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "sentinelflow"

    # AI / LLM Configuration
    LLM_PROVIDER: str = "mock"  # "mock" | "gemini" | "openai"
    DEMO_MODE: bool = True
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    # Agent Engine
    CONFIDENCE_THRESHOLD: int = 80
    MAX_INVESTIGATION_STEPS: int = 10
    AUTO_RESPONSE_ENABLED: bool = True

    # Sandbox Simulation
    DATA_DIR: Path = Path(__file__).resolve().parent.parent.parent / "data"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

settings = Settings()
