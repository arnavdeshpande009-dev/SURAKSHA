import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "NER-SMART Backend"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", 8000))
    API_PREFIX: str = "/api"

settings = Settings()
