from pydantic import BaseModel, ConfigDict


class MeetingTranscribeResponse(BaseModel):
    meeting_id: int
    transcript: str
    status: str = "transcribed"

    model_config = ConfigDict(from_attributes=True)
