from datetime import datetime
import re
from pydantic import BaseModel, Field, field_validator, model_validator
from app.schemas.task import TaskPriority

MONTH_NAMES = {
    "january": 1, "jan": 1,
    "february": 2, "feb": 2,
    "march": 3, "mar": 3,
    "april": 4, "apr": 4,
    "may": 5,
    "june": 6, "jun": 6,
    "july": 7, "jul": 7,
    "august": 8, "aug": 8,
    "september": 9, "sep": 9, "sept": 9,
    "october": 10, "oct": 10,
    "november": 11, "nov": 11,
    "december": 12, "dec": 12,
}


def normalize_deadline(raw: str | None, current_year: int = 2026) -> str | None:
    if not raw or not isinstance(raw, str):
        return None
    val = raw.strip()
    if not val or val.lower() in ("null", "none", "n/a", "undefined"):
        return None

    if re.match(r"^\d{4}-\d{2}-\d{2}$", val):
        return val

    cleaned = re.sub(r"(\d+)(st|nd|rd|th)", r"\1", val, flags=re.IGNORECASE)
    cleaned = cleaned.replace(",", " ")

    m1 = re.search(r"([a-zA-Z]+)\s+(\d{1,2})(?:\s+(\d{4}))?", cleaned)
    if m1:
        month_str, day_str, year_str = m1.group(1).lower(), m1.group(2), m1.group(3)
        if month_str in MONTH_NAMES:
            month = MONTH_NAMES[month_str]
            day = int(day_str)
            year = int(year_str) if year_str else current_year
            try:
                return datetime(year, month, day).strftime("%Y-%m-%d")
            except ValueError:
                pass

    m2 = re.search(r"(\d{1,2})\s+([a-zA-Z]+)(?:\s+(\d{4}))?", cleaned)
    if m2:
        day_str, month_str, year_str = m2.group(1), m2.group(2).lower(), m2.group(3)
        if month_str in MONTH_NAMES:
            month = MONTH_NAMES[month_str]
            day = int(day_str)
            year = int(year_str) if year_str else current_year
            try:
                return datetime(year, month, day).strftime("%Y-%m-%d")
            except ValueError:
                pass

    m3 = re.search(r"(\d{4})[/-](\d{1,2})[/-](\d{1,2})", cleaned)
    if m3:
        try:
            return datetime(int(m3.group(1)), int(m3.group(2)), int(m3.group(3))).strftime("%Y-%m-%d")
        except ValueError:
            pass

    return None


class DecisionExtraction(BaseModel):
    content: str = Field(..., min_length=1, description="Extracted decision content")


class TaskExtraction(BaseModel):
    title: str = Field(..., min_length=1, description="Actionable task title")
    owner: str | None = None
    deadline: str | None = None
    priority: TaskPriority = TaskPriority.MEDIUM
    dependency: str | None = None

    @field_validator("deadline", mode="before")
    @classmethod
    def validate_and_normalize_deadline(cls, v: str | None) -> str | None:
        return normalize_deadline(v)

    @model_validator(mode="after")
    def validate_dependency_not_self(self) -> "TaskExtraction":
        if self.dependency:
            dep_clean = self.dependency.strip()
            if not dep_clean or dep_clean.lower() in ("null", "none", "n/a", "undefined"):
                self.dependency = None
                return self
            t_lower = self.title.strip().lower()
            d_lower = dep_clean.lower()
            if t_lower == d_lower or t_lower in d_lower or d_lower in t_lower:
                self.dependency = None
            else:
                self.dependency = dep_clean
        return self


class AnalysisResult(BaseModel):
    summary: str = Field(..., description="Concise meeting summary")
    decisions: list[DecisionExtraction] = Field(default_factory=list)
    tasks: list[TaskExtraction] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)


class MeetingAnalysisResponse(BaseModel):
    meeting_id: int
    summary: str
    decisions: list[DecisionExtraction] = Field(default_factory=list)
    tasks: list[TaskExtraction] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
