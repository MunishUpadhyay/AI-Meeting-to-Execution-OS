from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field, field_validator


class TaskStatus(str, Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"
    BLOCKED = "BLOCKED"


class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class TaskCreate(BaseModel):
    meeting_id: int | None = None
    title: str = Field(..., min_length=1, description="Task title must not be empty")
    owner: str | None = None
    deadline: str | None = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    dependency: str | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(None, min_length=1)
    owner: str | None = None
    deadline: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    dependency: str | None = None


class TaskResponse(BaseModel):
    id: int
    project_id: int
    meeting_id: int | None = None
    title: str
    owner: str | None = None
    deadline: str | None = None
    status: str
    priority: str
    dependency: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
