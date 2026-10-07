from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class MeetingCreate(BaseModel):
    title: str = Field(..., min_length=1, description="Meeting title must not be empty")
    transcript: str | None = None
    summary: str | None = None


class MeetingUpdate(BaseModel):
    title: str | None = Field(None, min_length=1)
    transcript: str | None = None
    summary: str | None = None


class MeetingResponse(BaseModel):
    id: int
    project_id: int
    title: str
    transcript: str | None = None
    summary: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

