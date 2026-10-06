# Phase 4 Implementation Report: Execution Intelligence & Rule-Based Risk Engine

## 1. Phase Objective
The objective of Phase 4 is to build a deterministic, explainable, rule-based Execution Intelligence and Risk Engine for the AI Meeting-to-Execution OS. The system evaluates current project execution state (tasks, statuses, deadlines, and dependencies) to answer:

> *"Given the tasks, statuses, deadlines, and dependencies extracted from meetings, what is currently at risk and why?"*

Risk calculation is strictly deterministic and dynamically computed from SQLite database state without calling LLMs (Ollama/Qwen).

---

## 2. Architecture & Separation of Concerns

```
Meeting Transcript
      ↓
Ollama + Qwen 2.5 (Language Extraction - Phase 2)
      ↓
Structured Tasks & Decisions
      ↓
SQLite Database (Phase 1)
      ↓
Rule-Based Risk Engine (Phase 4 Service)
      ↓
Project Risk API (/projects/{id}/risks)
      ↓
React Dashboard & RiskPanel UI (Phase 4 Frontend)
```

The system explicitly maintains a clean separation between **Language Extraction** (Qwen 2.5) and **Execution Reasoning** (Deterministic Risk Engine).

---

## 3. Implemented Risk Evaluation Rules

The engine evaluates task records against 5 core rules:

1. **`BLOCKED_TASK` (HIGH Severity)**
   - **Condition:** `task.status == "BLOCKED"`
   - **Title:** "Blocked task"
   - **Description:** Indicates that the task is currently blocked.

2. **`OVERDUE_TASK` (HIGH Severity)**
   - **Condition:** `task.deadline < today` AND `task.status != "DONE"`
   - **Title:** "Overdue task"
   - **Description:** States task title and original deadline.

3. **`DEPENDENCY_RISK` (HIGH Severity) / `UNRESOLVED_DEPENDENCY_REFERENCE` (MEDIUM Severity)**
   - **Condition:** `task.dependency` is specified.
   - Resolves case-insensitively against project task titles.
   - If matched task is not DONE → `DEPENDENCY_RISK` (HIGH).
   - If dependency reference cannot be matched to any project task → `UNRESOLVED_DEPENDENCY_REFERENCE` (MEDIUM).

4. **`APPROACHING_DEADLINE` (MEDIUM Severity)**
   - **Condition:** `today <= task.deadline <= today + 2 days` AND `task.status != "DONE"`.
   - **Title:** "Approaching deadline"

5. **`HIGH_PRIORITY_INCOMPLETE` (MEDIUM Severity)**
   - **Condition:** `task.priority == "HIGH"` AND `task.status != "DONE"` AND task does not already have a HIGH severity risk assigned.

---

## 4. Risk Data Contract

### Pydantic Schemas (`backend/app/schemas/risk.py`)
- `Risk`: Represents an individual risk card with `type`, `severity`, `title`, `description`, `related_task_id`, `related_task_title`, `dependency_task_id`, `dependency_task_title`.
- `ProjectRiskSummary`: Contains counts for `total_tasks`, `completed_tasks`, `in_progress_tasks`, `blocked_tasks`, `overdue_tasks`, `risk_count`, `high_risk_count`, `medium_risk_count`.
- `ProjectRisksResponse`: Top-level response wrapping `project_id`, `summary`, and `risks`.

---

## 5. API Endpoint

- `GET /projects/{project_id}/risks`
  - Returns `ProjectRisksResponse`.
  - Dynamically calculates risks on request (no DB persistence required).
  - Returns 404 if project does not exist.

---

## 6. Frontend Integration

- **`frontend/src/types/index.ts`**: TypeScript definitions for `Risk`, `ProjectRiskSummary`, `ProjectRisksResponse`, `RiskType`, and `RiskSeverity`.
- **`frontend/src/services/api.ts`**: Added `getProjectRisks(projectId)`.
- **`frontend/src/components/RiskPanel.tsx`**: Reusable risk panel component displaying execution statistics, high/medium risk summary badges, and individual risk cards.
- **`frontend/src/pages/ProjectDetails.tsx`**: Integrated `RiskPanel` between Project Header and Meetings section. Automatically re-fetches risks upon task status updates.
- **`frontend/src/components/ProjectCard.tsx` & `Dashboard.tsx`**: Added lightweight risk count badge (`Risk: X High` / `Risk: Y Medium` / `No Risks`).

---

## 7. Testing Results & Verification

- **Focused Risk Test Suite**: `pytest tests/test_risks.py`
  - **12/12 passed** (0.29s).
- **Full Backend Regression Suite**: `pytest`
  - **49/49 passed** (4.14s).
- **Frontend TypeScript Build**: `npm run build`
  - **Clean build succeeded** with 0 errors.

---

## 8. Example Risk Output

```json
{
  "project_id": 1,
  "summary": {
    "total_tasks": 1,
    "completed_tasks": 0,
    "in_progress_tasks": 0,
    "blocked_tasks": 0,
    "overdue_tasks": 0,
    "risk_count": 3,
    "high_risk_count": 0,
    "medium_risk_count": 3
  },
  "risks": [
    {
      "type": "UNRESOLVED_DEPENDENCY_REFERENCE",
      "severity": "MEDIUM",
      "title": "Unresolved dependency reference",
      "description": "Task 'Implement payment API' references dependency 'Database schema' which could not be matched to an existing task in this project.",
      "related_task_id": 1,
      "related_task_title": "Implement payment API",
      "dependency_task_id": null,
      "dependency_task_title": null
    },
    {
      "type": "APPROACHING_DEADLINE",
      "severity": "MEDIUM",
      "title": "Approaching deadline",
      "description": "Task 'Implement payment API' has an approaching deadline of 2026-10-08.",
      "related_task_id": 1,
      "related_task_title": "Implement payment API",
      "dependency_task_id": null,
      "dependency_task_title": null
    },
    {
      "type": "HIGH_PRIORITY_INCOMPLETE",
      "severity": "MEDIUM",
      "title": "High-priority task incomplete",
      "description": "High-priority task 'Implement payment API' is still incomplete.",
      "related_task_id": 1,
      "related_task_title": "Implement payment API",
      "dependency_task_id": null,
      "dependency_task_title": null
    }
  ]
}
```

---

## 9. Limitations & Future ML Risk Prediction

### Current Limitations
- Rule evaluation relies on exact or case-insensitive string title matching for dependencies.
- Dates are evaluated based on server local date (`YYYY-MM-DD`).

### Future ML Risk Prediction (Phase 5+)
- Historical task completion velocity estimation.
- NLP-based semantic dependency resolution.
- Probabilistic delay prediction using statistical ML models.
