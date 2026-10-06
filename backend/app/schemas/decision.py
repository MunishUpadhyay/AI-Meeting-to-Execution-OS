from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class DecisionCreate(BaseModel):
    content: str = Field(..., min_length=1, description="Decision content must not be empty")


class DecisionResponse(BaseModel):
    id: int
    meeting_id: int
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
