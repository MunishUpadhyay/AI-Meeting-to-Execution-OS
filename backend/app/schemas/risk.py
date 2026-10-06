from enum import Enum
from pydantic import BaseModel, ConfigDict


class RiskSeverity(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"


class RiskType(str, Enum):
    BLOCKED_TASK = "BLOCKED_TASK"
    OVERDUE_TASK = "OVERDUE_TASK"
    DEPENDENCY_RISK = "DEPENDENCY_RISK"
    UNRESOLVED_DEPENDENCY_REFERENCE = "UNRESOLVED_DEPENDENCY_REFERENCE"
    APPROACHING_DEADLINE = "APPROACHING_DEADLINE"
    HIGH_PRIORITY_INCOMPLETE = "HIGH_PRIORITY_INCOMPLETE"


class Risk(BaseModel):
    type: RiskType
    severity: RiskSeverity
    title: str
    description: str
    related_task_id: int
    related_task_title: str
    dependency_task_id: int | None = None
    dependency_task_title: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ProjectRiskSummary(BaseModel):
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    blocked_tasks: int
    overdue_tasks: int
    risk_count: int
    high_risk_count: int
    medium_risk_count: int

    model_config = ConfigDict(from_attributes=True)


class ProjectRisksResponse(BaseModel):
    project_id: int
    summary: ProjectRiskSummary
    risks: list[Risk]

    model_config = ConfigDict(from_attributes=True)
